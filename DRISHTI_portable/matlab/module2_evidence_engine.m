function evidence = module2_evidence_engine(img, mask)
% =========================================================================
% DRISHTI - MODULE 2: CLINICAL EVIDENCE ENGINE
% =========================================================================
%
% Detects:
%   1. Blood vessels
%   2. Optic disc
%   3. Fovea
%   4. Microaneurysms
%   5. Hemorrhages
%   6. Hard exudates
%   7. DME risk flag
%
% Input:
%   img  : RGB fundus image
%   mask : Retina mask from Module 1
%
% Output:
%   evidence structure containing masks, centroids and measurements
%
% Requires:
%   Image Processing Toolbox
%
% Prototype implementation. Lesion masks are screening evidence and
% should not be presented as clinically validated segmentation.
% =========================================================================


%% ========================================================================
% INPUT VALIDATION
% ========================================================================

if ndims(img) ~= 3 || size(img,3) ~= 3
    error('Module 2 requires an RGB fundus image.');
end

if size(mask,1) ~= size(img,1) || ...
   size(mask,2) ~= size(img,2)
    error('Image and retina mask dimensions do not match.');
end

mask = logical(mask);

if ~any(mask(:))
    error('Module 2 received an empty retina mask.');
end


%% ========================================================================
% 1. BLOOD VESSELS
% ========================================================================

fprintf('[M2] Detecting blood vessels...\n');

green = img(:,:,2);

greenC = adapthisteq( ...
    green, ...
    'ClipLimit',0.02, ...
    'NumTiles',[8 8]);

vessels = vesselFilter(greenC,mask);

evidence.vessels = vessels;

evidence.vessel_density = ...
    sum(vessels(:)) / max(sum(mask(:)),1);


%% ========================================================================
% 2. OPTIC DISC
% ========================================================================

fprintf('[M2] Detecting optic disc...\n');

od = detectOpticDisc( ...
    img, ...
    mask, ...
    vessels);

evidence.optic_disc = od;


%% ========================================================================
% 3. FOVEA
% ========================================================================

fprintf('[M2] Detecting fovea...\n');

fovea = findFovea( ...
    img, ...
    od, ...
    mask, ...
    vessels);

evidence.fovea = fovea;


%% ========================================================================
% 4. MICROANEURYSMS
% ========================================================================

fprintf('[M2] Detecting microaneurysms...\n');

[maMask,maCentres] = ...
    detectMicroaneurysms( ...
        img, ...
        mask, ...
        vessels, ...
        od);

evidence.ma_mask = maMask;

evidence.ma_count = ...
    size(maCentres,1);

evidence.ma_centres = ...
    maCentres;


%% ========================================================================
% 5. HEMORRHAGES
% ========================================================================

fprintf('[M2] Detecting hemorrhages...\n');

[hemMask,hemCentres] = ...
    detectHemorrhages( ...
        img, ...
        mask, ...
        vessels, ...
        od, ...
        maMask);

evidence.hem_mask = hemMask;

evidence.hem_count = ...
    size(hemCentres,1);

evidence.hem_centres = ...
    hemCentres;


%% ========================================================================
% 6. HARD EXUDATES
% ========================================================================

fprintf('[M2] Detecting hard exudates...\n');

[exMask,exCentres] = ...
    detectExudates( ...
        img, ...
        mask, ...
        od, ...
        vessels);

evidence.ex_mask = exMask;

evidence.ex_count = ...
    size(exCentres,1);

evidence.ex_centres = ...
    exCentres;


%% ========================================================================
% 7. DME RISK
% ========================================================================

fprintf('[M2] Checking DME risk...\n');

[risk,distDD,msg] = ...
    dmeRiskFlag( ...
        exCentres, ...
        fovea, ...
        od(3));

evidence.dme_risk = risk;

evidence.dme_distance_dd = distDD;

evidence.dme_message = msg;


%% ========================================================================
% SUMMARY
% ========================================================================

fprintf('\n');
fprintf('============================================\n');
fprintf('       DRISHTI MODULE 2 RESULT\n');
fprintf('============================================\n');

fprintf('Vessel density : %.4f\n', ...
    evidence.vessel_density);

fprintf('Optic disc     : [%d, %d], radius=%d\n', ...
    od(1),od(2),od(3));

fprintf('Fovea          : [%d, %d]\n', ...
    fovea(1),fovea(2));

fprintf('Microaneurysms : %d\n', ...
    evidence.ma_count);

fprintf('Hemorrhages    : %d\n', ...
    evidence.hem_count);

fprintf('Exudates       : %d\n', ...
    evidence.ex_count);

fprintf('DME risk       : %d\n', ...
    evidence.dme_risk);

fprintf('Message        : %s\n', ...
    evidence.dme_message);

fprintf('============================================\n');

end


%% ========================================================================
% VESSEL FILTER
% ========================================================================

function vessels = vesselFilter(green,mask)

v = zeros(size(green),'double');

for s = [1 2 3 4 5]

    hxx = imfilter( ...
        double(green), ...
        s^2 * gaussDeriv(s,'xx'), ...
        'replicate');

    hyy = imfilter( ...
        double(green), ...
        s^2 * gaussDeriv(s,'yy'), ...
        'replicate');

    hxy = imfilter( ...
        double(green), ...
        s^2 * gaussDeriv(s,'xy'), ...
        'replicate');


    tr = hxx + hyy;

    dt = sqrt( ...
        (hxx-hyy).^2/4 + hxy.^2);


    l1 = tr/2 + dt;


    resp = max(-l1,0).^2;


    mx = max(resp(:));

    if mx > 0
        resp = resp/mx;
    end


    v = max(v,resp);

end


mx = max(v(:));

if mx > 0
    v = v/mx;
end


vals = v(mask);

if isempty(vals)

    vessels = false(size(mask));

    return;

end


thr = prctile(vals(:),90);

thr = min( ...
    max(thr,25/255), ...
    70/255);


vessels = ...
    v > thr & mask;


vessels = imclose( ...
    vessels, ...
    strel('disk',1));


vessels = bwareaopen( ...
    vessels, ...
    40);

end


%% ========================================================================
% GAUSSIAN DERIVATIVE
% ========================================================================

function k = gaussDeriv(sigma,which)

r = ceil(3*sigma);

[x,y] = meshgrid( ...
    -r:r, ...
    -r:r);

x = double(x);
y = double(y);

g = exp( ...
    -(x.^2+y.^2) / ...
    (2*sigma^2));


switch which

    case 'xx'

        k = ...
            ((x.^2/sigma^4) - ...
             1/sigma^2).*g;

    case 'yy'

        k = ...
            ((y.^2/sigma^4) - ...
             1/sigma^2).*g;

    case 'xy'

        k = ...
            (x.*y/sigma^4).*g;

    otherwise

        error('Unknown Gaussian derivative type.');

end


n = sum(abs(k(:)));

if n > 0
    k = k/n;
end

k = double(k);

end


%% ========================================================================
% OPTIC DISC
% ========================================================================

function od = detectOpticDisc(img, mask, vessels)
% Optic disc = brightest large region after suppressing vessel pixels.

lab = rgb2lab(im2single(img));

L = lab(:,:,1);

% Ensure same 2-D dimensions
L = squeeze(L);

% Keep only retinal region
L(~mask) = 0;

% Smooth illumination
L = imclose(L, strel('disk',17));
L = imgaussfilt(L,10);

% ---------------------------------------------------------
% FIX:
% Do NOT assign the complete filtered image to L(vessels).
% Filter first, then select only vessel locations.
% ---------------------------------------------------------
Lfiltered = medfilt2(L,[5 5]);

L(vessels) = Lfiltered(vessels);

% Restore retina restriction
L(~mask) = 0;

% Bright candidate regions
vals = L(mask);

if isempty(vals)
    od = [ ...
        round(size(img,2)/2), ...
        round(size(img,1)/2), ...
        round(0.07*min(size(img,1),size(img,2))) ...
    ];
    return;
end

t = max(prctile(vals,98),60);

cand = L > t;

% Only consider retinal pixels
cand = cand & mask;

stats = regionprops( ...
    cand, ...
    'Centroid', ...
    'Area', ...
    'PixelIdxList');

% Fallback if no candidate found
if isempty(stats)

    [~,idx] = max(L(:));

    [cy,cx] = ...
        ind2sub(size(L),idx);

    r = round( ...
        0.07*min(size(img,1),size(img,2)));

    od = [cx,cy,r];

    return;
end

% Largest bright component
[~,bi] = max([stats.Area]);

c = stats(bi).Centroid;

[ys,xs] = ...
    ind2sub(size(L),stats(bi).PixelIdxList);

% Estimate radius
r = median( ...
    sqrt( ...
        (xs-c(1)).^2 + ...
        (ys-c(2)).^2)) * 1.35;

% Constrain radius
rMin = ...
    0.055*min(size(img,1),size(img,2));

rMax = ...
    0.10*min(size(img,1),size(img,2));

r = min( ...
    max(r,rMin), ...
    rMax);

od = [ ...
    round(c(1)), ...
    round(c(2)), ...
    round(r)];

end

%% ========================================================================
% FOVEA
% ========================================================================

function fovea = findFovea(img,od,mask,vessels)

[H,W,~] = size(img);

dd = 2*od(3);


dx = W/2 - od(1);

dy = H/2 - od(2);

n = hypot(dx,dy) + eps;

dx = dx/n;
dy = dy/n;


gray = rgb2gray(img);

gray = adapthisteq( ...
    gray, ...
    'ClipLimit',0.02, ...
    'NumTiles',[8 8]);


inner = imerode( ...
    mask, ...
    strel('disk',20));


fovea = [ ...
    od(1)+dx*2.5*dd, ...
    od(2)+dy*2.5*dd];


bestDark = inf;


for dist = 1.6:0.1:3.0

    for ang = -30:5:30

        a = deg2rad(ang);


        px = round( ...
            od(1)+ ...
            (dx*cos(a)-dy*sin(a))* ...
            dist*dd);


        py = round( ...
            od(2)+ ...
            (dx*sin(a)+dy*cos(a))* ...
            dist*dd);


        if px < 1 || ...
           py < 1 || ...
           px > W || ...
           py > H

            continue;

        end


        if ~inner(py,px)

            continue;

        end


        y1 = max(1,py-14);
        y2 = min(H,py+14);

        x1 = max(1,px-14);
        x2 = min(W,px+14);


        patch = ...
            double(gray(y1:y2,x1:x2));

        pm = ...
            inner(y1:y2,x1:x2);


        if mean(pm(:)) < 0.6

            continue;

        end


        p = patch(pm);


        if isempty(p)

            continue;

        end


        dark = mean(p);


        vesselFraction = ...
            mean(vessels(y1:y2,x1:x2),'all');


        dark = ...
            dark + 30*vesselFraction;


        if dark < bestDark

            bestDark = dark;

            fovea = [px,py];

        end

    end

end

end


%% ========================================================================
% MICROANEURYSM DETECTION
% ========================================================================

function [maMask,centres] = ...
    detectMicroaneurysms(img,mask,vessels,od)

% Green-channel small dark lesion detection.

green = img(:,:,2);

green = adapthisteq( ...
    green, ...
    'ClipLimit',0.025, ...
    'NumTiles',[8 8]);


bh = imbothat( ...
    green, ...
    strel('disk',4));


[rr,cc] = ...
    meshgrid( ...
        1:size(mask,2), ...
        1:size(mask,1));


% Posterior pole
pole = ...
    ((rr-od(1)).^2 + ...
     (cc-od(2)).^2 <= ...
     (3.5*2*od(3))^2) ...
     & imerode( ...
         mask, ...
         strel('disk',25));


vals = double(bh(pole));


if numel(vals) < 100

    maMask = false(size(mask));

    centres = zeros(0,2);

    return;

end


med = median(vals);

madVal = ...
    median(abs(vals-med))*1.4826;


% Tightened threshold compared with previous version
thr = ...
    min( ...
        max(med+4*madVal,20), ...
        50);


m = ...
    bh > thr & pole;


% Remove vessels
m = ...
    m & ...
    ~imdilate( ...
        vessels, ...
        strel('disk',3));


% Remove optic disc
discRegion = ...
    ((rr-od(1)).^2 + ...
     (cc-od(2)).^2 <= ...
     (1.2*od(3))^2);

m(discRegion) = false;


% Remove isolated tiny noise
m = bwareaopen(m,5);


lab = bwlabel(m);


stats = regionprops( ...
    lab, ...
    'Centroid', ...
    'Area', ...
    'BoundingBox', ...
    'Eccentricity', ...
    'Solidity');


maMask = false(size(m));

centres = zeros(0,2);


for i = 1:numel(stats)

    area = stats(i).Area;

    bb = stats(i).BoundingBox;

    aspect = ...
        bb(3)/max(bb(4),1);

    eccentricity = ...
        stats(i).Eccentricity;

    solidity = ...
        stats(i).Solidity;


    % Small, approximately round structures
    if area >= 5 && ...
       area <= 80 && ...
       aspect >= 0.50 && ...
       aspect <= 2.0 && ...
       eccentricity <= 0.90 && ...
       solidity >= 0.45


        maMask = ...
            maMask | ...
            (lab == i);


        centres(end+1,:) = ...
            stats(i).Centroid; %#ok<AGROW>

    end

end

end


%% ========================================================================
% HEMORRHAGE DETECTION
% ========================================================================

function [hemMask,centres] = ...
    detectHemorrhages(img,mask,vessels,od,maMask)

% -------------------------------------------------------------------------
% IMPORTANT CHANGE:
% Use red-vs-green contrast.
%
% Hemorrhages are dark/red retinal lesions. Pure grayscale black-hat
% produced massive false positives on the previous test image.
% -------------------------------------------------------------------------


R = double(img(:,:,1));

G = double(img(:,:,2));


% Normalize each channel
R = mat2gray(R);

G = mat2gray(G);


% Hemorrhage-sensitive image:
% relatively dark red structures compared with surrounding green channel
redContrast = G - R;


redContrast = mat2gray(redContrast);


% Enhance local dark/red structures
bh = imbothat( ...
    redContrast, ...
    strel('disk',10));


% -------------------------------------------------------------------------
% Adaptive threshold
% -------------------------------------------------------------------------

vals = bh(mask);

if isempty(vals)

    hemMask = false(size(mask));

    centres = zeros(0,2);

    return;

end


med = median(vals);

madVal = ...
    median(abs(vals-med))*1.4826;


thr = ...
    max( ...
        med+3.5*madVal, ...
        0.08);


m = ...
    bh > thr & mask;


% -------------------------------------------------------------------------
% Remove vessels
% -------------------------------------------------------------------------

m = ...
    m & ...
    ~imdilate( ...
        vessels, ...
        strel('disk',5));


% -------------------------------------------------------------------------
% Remove microaneurysms
% -------------------------------------------------------------------------

m = ...
    m & ...
    ~imdilate( ...
        maMask, ...
        strel('disk',4));


% -------------------------------------------------------------------------
% Remove optic disc
% -------------------------------------------------------------------------

[rr,cc] = ...
    meshgrid( ...
        1:size(mask,2), ...
        1:size(mask,1));


discRegion = ...
    ((rr-od(1)).^2 + ...
     (cc-od(2)).^2 <= ...
     (1.3*od(3))^2);


m(discRegion) = false;


% -------------------------------------------------------------------------
% Morphological cleanup
% -------------------------------------------------------------------------

m = imopen( ...
    m, ...
    strel('disk',2));


m = imclose( ...
    m, ...
    strel('disk',2));


m = bwareaopen( ...
    m, ...
    80);


% -------------------------------------------------------------------------
% Connected component filtering
% -------------------------------------------------------------------------

stats = regionprops( ...
    m, ...
    'Centroid', ...
    'Area', ...
    'BoundingBox', ...
    'Eccentricity', ...
    'Solidity');


hemMask = false(size(m));

centres = zeros(0,2);


for i = 1:numel(stats)

    area = stats(i).Area;

    bb = stats(i).BoundingBox;

    aspect = ...
        bb(3)/max(bb(4),1);

    ecc = ...
        stats(i).Eccentricity;

    sol = ...
        stats(i).Solidity;


    % Reject huge regions caused by illumination/background
    if area >= 80 && ...
       area <= 8000 && ...
       aspect >= 0.20 && ...
       aspect <= 5.0 && ...
       ecc <= 0.98 && ...
       sol >= 0.20


        hemMask = ...
            hemMask | ...
            ( ...
                bwlabel(m) == i ...
            );


        centres(end+1,:) = ...
            stats(i).Centroid; %#ok<AGROW>

    end

end

end


%% ========================================================================
% HARD EXUDATE DETECTION
% ========================================================================

function [exMask,centres] = ...
    detectExudates(img,mask,od,vessels)

% -------------------------------------------------------------------------
% LAB-based exudate detection.
%
% Uses:
%   L*  -> brightness
%   b*  -> yellow component
%   local top-hat -> small bright lesions
%
% Additional component filtering prevents large illuminated regions from
% being classified as individual exudates.
% -------------------------------------------------------------------------


lab = rgb2lab(im2single(img));


L = double(lab(:,:,1));

bch = double(lab(:,:,3));


% -------------------------------------------------------------------------
% Local bright structures
% -------------------------------------------------------------------------

Lnorm = mat2gray(L);


topHat = ...
    imtophat( ...
        Lnorm, ...
        strel('disk',7));


% -------------------------------------------------------------------------
% Relative brightness threshold
% -------------------------------------------------------------------------

Lvals = Lnorm(mask);

if isempty(Lvals)

    exMask = false(size(mask));

    centres = zeros(0,2);

    return;

end


Lhigh = ...
    prctile(Lvals,88);


% Local enhancement threshold
topThr = ...
    max( ...
        prctile(topHat(mask),92), ...
        0.10);


% -------------------------------------------------------------------------
% Yellow relative threshold
% -------------------------------------------------------------------------

bvals = bch(mask);

bRef = ...
    prctile(bvals,65);


% -------------------------------------------------------------------------
% Candidate
% -------------------------------------------------------------------------

cand = ...
    topHat > topThr & ...
    Lnorm > Lhigh & ...
    bch > bRef & ...
    mask;


% -------------------------------------------------------------------------
% Remove optic disc
% -------------------------------------------------------------------------

[rr,cc] = ...
    meshgrid( ...
        1:size(mask,2), ...
        1:size(mask,1));


discRegion = ...
    ((rr-od(1)).^2 + ...
     (cc-od(2)).^2 <= ...
     (1.4*od(3))^2);


cand(discRegion) = false;


% -------------------------------------------------------------------------
% Remove vessels
% -------------------------------------------------------------------------

cand = ...
    cand & ...
    ~imdilate( ...
        vessels, ...
        strel('disk',3));


% -------------------------------------------------------------------------
% Morphological cleanup
% -------------------------------------------------------------------------

cand = imopen( ...
    cand, ...
    strel('disk',1));


cand = imclose( ...
    cand, ...
    strel('disk',2));


cand = bwareaopen( ...
    cand, ...
    15);


% -------------------------------------------------------------------------
% Connected-component filtering
% -------------------------------------------------------------------------

stats = regionprops( ...
    cand, ...
    'Centroid', ...
    'Area', ...
    'BoundingBox', ...
    'Eccentricity', ...
    'Solidity');


exMask = false(size(cand));

centres = zeros(0,2);


for i = 1:numel(stats)

    area = stats(i).Area;

    bb = stats(i).BoundingBox;

    aspect = ...
        bb(3)/max(bb(4),1);

    ecc = ...
        stats(i).Eccentricity;

    sol = ...
        stats(i).Solidity;


    % Reject large illumination regions
    if area >= 15 && ...
       area <= 2500 && ...
       aspect >= 0.25 && ...
       aspect <= 4.0 && ...
       ecc <= 0.98 && ...
       sol >= 0.20


        component = ...
            ( ...
                bwlabel(cand) == i ...
            );


        exMask = ...
            exMask | component;


        centres(end+1,:) = ...
            stats(i).Centroid; %#ok<AGROW>

    end

end

end


%% ========================================================================
% DME RISK
% ========================================================================

function [risk,distDD,msg] = ...
    dmeRiskFlag(exCentres,fovea,discRadius)

if isempty(exCentres)

    risk = false;

    distDD = NaN;

    msg = ...
        'No exudates detected -> no DME risk flag';

    return;

end


% One disc diameter
dd = 2*discRadius;


d = hypot( ...
    exCentres(:,1)-fovea(1), ...
    exCentres(:,2)-fovea(2));


dmin = min(d);


distDD = dmin/dd;


if dmin < dd

    risk = true;

    msg = sprintf( ...
        ['URGENT: exudate within %.2f DD of fovea ' ...
         '-> possible DME. Refer for ophthalmic review.'], ...
        distDD);

else

    risk = false;

    msg = sprintf( ...
        ['Closest detected exudate is %.2f DD from fovea ' ...
         '(>1 DD) -> no DME risk flag'], ...
        distDD);

end

end