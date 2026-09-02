function [decision, finalImg, report] = module1_quality_gate(img)
% =========================================================================
% DRISHTI - MODULE 1: THE TRUST GATE
% =========================================================================
% Fundus image quality assessment:
%   1. Focus / sharpness
%   2. Illumination
%   3. Field of View
%
% Decision:
%   ACCEPT
%   ACCEPT_AFTER_ENHANCE
%   REJECT
%
% Input:
%   img - RGB fundus image
%
% Outputs:
%   decision - quality-gate decision
%   finalImg - original/enhanced image sent to Module 2
%   report   - quality metrics and retina mask
%
% Requires:
%   Image Processing Toolbox
% =========================================================================

% -------------------------------------------------------------------------
% Validate input
% -------------------------------------------------------------------------

if ndims(img) ~= 3 || size(img,3) ~= 3
    error('Module 1 requires an RGB fundus image.');
end

% -------------------------------------------------------------------------
% STEP 1: Retina mask
% -------------------------------------------------------------------------

report.mask = getRetinaMask(img);

% -------------------------------------------------------------------------
% STEP 2: Quality metrics
% -------------------------------------------------------------------------

[report.focus, report.laplacianVar] = ...
    focusScore(img, report.mask);

[report.illumination, report.meanBrightness] = ...
    illuminationScore(img, report.mask);

[report.fieldOfView, report.retinaCoverage] = ...
    fovScore(report.mask);

% -------------------------------------------------------------------------
% STEP 3: Combined quality score
%
% Focus         = 40%
% Illumination  = 30%
% FOV           = 30%
% -------------------------------------------------------------------------

report.qualityScore = ...
    0.40 * report.focus + ...
    0.30 * report.illumination + ...
    0.30 * report.fieldOfView;

report.enhanced = false;

% -------------------------------------------------------------------------
% STEP 4: TRUST GATE
% -------------------------------------------------------------------------

if report.qualityScore >= 0.80

    % -------------------------------------------------------------
    % GOOD IMAGE
    % -------------------------------------------------------------

    decision = 'ACCEPT';
    finalImg = img;

    report.reason = ...
        'Image quality is good. Proceed to analysis.';

elseif report.qualityScore >= 0.50

    % -------------------------------------------------------------
    % BORDERLINE IMAGE
    % Enhance and re-check
    % -------------------------------------------------------------

    enhanced = enhanceImage(img);

    rep2 = struct();

    % Keep original retina mask
    rep2.mask = report.mask;

    [rep2.focus, rep2.laplacianVar] = ...
        focusScore(enhanced, rep2.mask);

    [rep2.illumination, rep2.meanBrightness] = ...
        illuminationScore(enhanced, rep2.mask);

    [rep2.fieldOfView, rep2.retinaCoverage] = ...
        fovScore(rep2.mask);

    rep2.qualityScore = ...
        0.40 * rep2.focus + ...
        0.30 * rep2.illumination + ...
        0.30 * rep2.fieldOfView;

    rep2.enhanced = true;

    % Enhancement may improve brightness/contrast,
    % but cannot recover severe blur.
    if rep2.qualityScore >= 0.62 && rep2.focus >= 0.30

        decision = 'ACCEPT_AFTER_ENHANCE';
        finalImg = enhanced;

        report = rep2;

        report.reason = ...
            'Borderline image rescued by CLAHE enhancement.';

    else

        decision = 'REJECT';
        finalImg = img;

        report.reason = ...
            ['RECAPTURE NEEDED: enhancement could not rescue ' ...
             'this image. Ask the health worker to retake the photo.'];

    end

else

    % -------------------------------------------------------------
    % POOR IMAGE
    % -------------------------------------------------------------

    decision = 'REJECT';
    finalImg = img;

    report.reason = buildRejectReason(report);

end

end


% =========================================================================
% RETINA MASK
% =========================================================================

function mask = getRetinaMask(img)
% Detect the bright retinal field against the dark camera background.

gray = rgb2gray(img);

% Retina is brighter than the surrounding background
mask = gray > 15;

% Morphological cleanup
mask = imclose(mask, strel('disk', 8));
mask = imopen(mask, strel('disk', 8));

% -------------------------------------------------------------------------
% IMPORTANT FIX:
% bwareaopen requires an integer area threshold.
% -------------------------------------------------------------------------

minArea = max(1, round(numel(mask) * 0.05));

mask = bwareaopen(mask, minArea);

% -------------------------------------------------------------------------
% Keep largest connected retinal component
% -------------------------------------------------------------------------

cc = bwconncomp(mask);

if cc.NumObjects > 1

    sizes = cellfun(@numel, cc.PixelIdxList);

    [~, largestIdx] = max(sizes);

    newMask = false(size(mask));

    newMask(cc.PixelIdxList{largestIdx}) = true;

    mask = newMask;

end

% Convert to uint8 mask
mask = uint8(mask) * 255;

end


% =========================================================================
% FOCUS SCORE
% =========================================================================

function [score, lapVar] = focusScore(img, mask)
% Sharpness using:
%   1. Laplacian variance
%   2. Tenengrad / Sobel edge energy
%
% IMPORTANT:
% MATLAB image functions often convert images to 0-1 when using im2single.
% Here we deliberately keep grayscale intensity in the 0-255 range because
% the normalization constants below were designed for that scale.

gray = rgb2gray(img);

% Convert to double but preserve 0-255 intensity scale
gray = double(gray);

% -------------------------------------------------------------------------
% Measure focus INSIDE the retina
% -------------------------------------------------------------------------

inner = imerode( ...
    logical(mask), ...
    strel('disk', 12));

if ~any(inner(:))
    inner = logical(mask);
end

% -------------------------------------------------------------------------
% Laplacian variance
% -------------------------------------------------------------------------

lap = imfilter( ...
    gray, ...
    fspecial('laplacian', 0.2), ...
    'replicate');

lapPixels = lap(inner);

if isempty(lapPixels)

    lapVar = 0;

else

    lapVar = var(lapPixels);

end

% -------------------------------------------------------------------------
% Tenengrad / Sobel edge energy
% -------------------------------------------------------------------------

[gx, gy] = imgradientxy(gray, 'sobel');

edgeEnergy = gx.^2 + gy.^2;

edgePixels = edgeEnergy(inner);

if isempty(edgePixels)

    tenengrad = 0;

else

    tenengrad = mean(edgePixels);

end

% -------------------------------------------------------------------------
% Normalize to 0-1
% -------------------------------------------------------------------------

s1 = 1 - exp(-lapVar / 100);

s2 = 1 - exp(-tenengrad / 2200);

score = ...
    0.60 * s1 + ...
    0.40 * s2;

% -------------------------------------------------------------------------
% Severe blur protection
% -------------------------------------------------------------------------

if lapVar < 12
    score = min(score, 0.30);
end

end


% =========================================================================
% ILLUMINATION SCORE
% =========================================================================

function [score, meanBright] = illuminationScore(img, mask)
% Measures:
%   1. Mean retinal brightness
%   2. Illumination uniformity

gray = rgb2gray(img);

retina = logical(mask);

pixels = gray(retina);

if isempty(pixels)

    meanBright = 0;

else

    meanBright = mean(pixels);

end

% -------------------------------------------------------------------------
% Brightness score
% -------------------------------------------------------------------------

if meanBright >= 60 && meanBright <= 200

    brightS = 1.0;

elseif meanBright < 60

    brightS = max(0, meanBright / 60);

else

    brightS = max(0, (255 - meanBright) / 55);

end

% -------------------------------------------------------------------------
% 8 x 8 illumination uniformity
% -------------------------------------------------------------------------

[H, W] = size(gray);

ch = floor(H / 8);
cw = floor(W / 8);

means = zeros(1, 64);

k = 0;

for i = 1:8

    for j = 1:8

        r1 = (i - 1) * ch + 1;
        r2 = i * ch;

        c1 = (j - 1) * cw + 1;
        c2 = j * cw;

        cellImg = gray(r1:r2, c1:c2);

        cellMsk = retina(r1:r2, c1:c2);

        % Only consider cells mostly covered by retina
        if mean(cellMsk(:)) > 0.4

            cellPixels = cellImg(cellMsk);

            if ~isempty(cellPixels)

                k = k + 1;

                means(k) = mean(cellPixels);

            end

        end

    end

end

means = means(1:k);

% -------------------------------------------------------------------------
% Uniformity score
% -------------------------------------------------------------------------

if numel(means) < 4

    uniformS = 0;

else

    spread = std(means);

    uniformS = exp(-spread / 45);

end

% -------------------------------------------------------------------------
% Combined illumination score
% -------------------------------------------------------------------------

score = ...
    0.55 * brightS + ...
    0.45 * uniformS;

end


% =========================================================================
% FIELD-OF-VIEW SCORE
% =========================================================================

function [score, coverage] = fovScore(mask)
% Measures:
%   1. Retina coverage
%   2. Bounding-box fill
%   3. Circularity / shape

m = logical(mask);

% -------------------------------------------------------------------------
% Retina coverage
% -------------------------------------------------------------------------

coverage = mean(m(:));

% Full score at approximately 75% coverage
covS = min( ...
    max((coverage - 0.40) / (0.75 - 0.40), 0), ...
    1);

% -------------------------------------------------------------------------
% Connected components
% -------------------------------------------------------------------------

stats = regionprops( ...
    m, ...
    'Area', ...
    'BoundingBox', ...
    'Perimeter');

if ~isempty(stats)

    % IMPORTANT:
    % regionprops ordering is not guaranteed to be largest-first.
    areas = [stats.Area];

    [~, idx] = max(areas);

    area = stats(idx).Area;

    bb = stats(idx).BoundingBox;

    per = stats(idx).Perimeter;

    % Bounding-box fill
    bboxArea = bb(3) * bb(4);

    if bboxArea > 0
        fillS = min(area / bboxArea / 0.75, 1);
    else
        fillS = 0.5;
    end

    % Circularity
    circ = ...
        4 * pi * area / max(per^2, eps);

    shapeS = min(circ / 0.85, 1);

else

    fillS = 0.5;
    shapeS = 0.5;

end

% -------------------------------------------------------------------------
% Combined FOV score
% -------------------------------------------------------------------------

score = ...
    0.45 * covS + ...
    0.30 * fillS + ...
    0.25 * shapeS;

end


% =========================================================================
% IMAGE ENHANCEMENT
% =========================================================================

function out = enhanceImage(img)
% Enhancement pipeline:
%   1. CLAHE
%   2. Edge-preserving denoising
%   3. Gamma correction

% -------------------------------------------------------------------------
% RGB -> LAB
% -------------------------------------------------------------------------

lab = rgb2lab(im2single(img));

% -------------------------------------------------------------------------
% CLAHE on L channel
% -------------------------------------------------------------------------

L8 = im2uint8(lab(:,:,1) / 100);

L8 = adapthisteq( ...
    L8, ...
    'ClipLimit', 0.02, ...
    'NumTiles', [8 8]);

lab(:,:,1) = ...
    single(L8) / 255 * 100;

% LAB -> RGB
out = lab2rgb(lab);

% -------------------------------------------------------------------------
% Edge-preserving denoising
% -------------------------------------------------------------------------

try

    out = imnlmfilt(out);

catch

    % Fallback if Non-Local Means is unavailable
    out = imgaussfilt(out, 0.8);

end

% -------------------------------------------------------------------------
% Gamma correction
% -------------------------------------------------------------------------

g = rgb2gray(out);

vals = g(g > 0.06);

if isempty(vals)

    mb = 0.5;

else

    mb = mean(vals);

end

if mb < 0.28

    % Brighten dark images
    out = out .^ 0.6;

elseif mb > 0.75

    % Darken over-exposed images
    out = out .^ 1.4;

end

% -------------------------------------------------------------------------
% Convert to uint8
% -------------------------------------------------------------------------

out = im2uint8( ...
    min(max(out, 0), 1));

end


% =========================================================================
% REJECTION REASON
% =========================================================================

function reason = buildRejectReason(report)
% Generate a specific field-level recapture instruction.

reason = 'RECAPTURE NEEDED: ';

if report.focus < 0.35

    reason = [ ...
        reason ...
        'image too blurry - ask patient to hold still and refocus. '];

end

if report.illumination < 0.35

    reason = [ ...
        reason ...
        'bad lighting - check camera flash / room lighting. '];

end

if report.fieldOfView < 0.35

    reason = [ ...
        reason ...
        'retina not fully captured - realign camera closer to pupil.'];

end

if strcmp(reason, 'RECAPTURE NEEDED: ')

    reason = [ ...
        reason ...
        'overall image quality is too low - retake the photo.'];

end

end