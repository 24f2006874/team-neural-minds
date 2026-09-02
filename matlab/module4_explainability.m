function explanation = module4_explainability(net, img, evidence, qualityScore)
% =========================================================================
% DRISHTI - MODULE 4
% EXPLAINABILITY + CONSISTENCY + TRUST
%
% Inputs:
%   net          - trained DR network
%   img          - RGB fundus image
%   evidence     - Module 2 evidence structure
%   qualityScore - Module 1 quality score [0,1]
%
% Output:
%   explanation  - prediction, confidence, Grad-CAM,
%                  consistency and trust information
% =========================================================================

fprintf('\n');
fprintf('====================================================\n');
fprintf('        DRISHTI MODULE 4 - EXPLAINABILITY\n');
fprintf('====================================================\n');

%% 1. GET ACTUAL CLASS NAMES FROM NETWORK

try
    classNames = net.Layers(end).Classes;
catch
    error(['Unable to read class names from the trained network. ' ...
           'Check drishti_dr_model.mat.']);
end

classNames = cellstr(classNames);

%% 2. PREPARE IMAGE

inputSize = net.Layers(1).InputSize;

imgResized = imresize(img, ...
    [inputSize(1), inputSize(2)]);

%% 3. CLASSIFICATION

[YPred, scores] = classify(net, imgResized);

[confidence, predIdx] = max(scores);

confidence = double(confidence);

predictedLabel = classNames{predIdx};

fprintf('\n[M4] Prediction\n');
fprintf('Predicted class : %s\n', predictedLabel);
fprintf('Confidence      : %.2f%%\n', confidence * 100);

%% 4. REFERABLE DR

% APTOS / DRISHTI screening definition:
% Level 2, 3 and 4 are treated as referable DR.

if predIdx >= 3
    referableDR = true;
else
    referableDR = false;
end

if referableDR
    referableText = 'YES';
else
    referableText = 'NO';
end

fprintf('Referable DR    : %s\n', referableText);

%% 5. GRAD-CAM

fprintf('[M4] Generating Grad-CAM...\n');

try

    % Categorical label is robust for the trained classification network
    map = gradCAM(net, imgResized, YPred);

catch ME1

    % Fallback: class index
    try
        map = gradCAM(net, imgResized, predIdx);

    catch ME2

        error(['Grad-CAM failed.\n' ...
               'Label attempt: %s\n' ...
               'Index attempt: %s'], ...
               ME1.message, ME2.message);
    end
end

%% 6. NORMALIZE GRAD-CAM

map = double(map);

map(map < 0) = 0;

if max(map(:)) > 0
    map = map ./ max(map(:));
end

%% 7. CONSISTENCY CHECK

fprintf('[M4] Comparing AI attention with Module 2 evidence...\n');

consistency = consistencyCheck( ...
    map, evidence, size(img));

%% 8. TRUST SCORE

trust = ...
      0.35 * double(qualityScore) ...
    + 0.35 * confidence ...
    + 0.30 * consistency.consistency;

trust = max(min(trust,1),0);

if trust >= 0.76

    trustLevel = 'HIGH';
    route = 'TRUSTED - auto screening recommendation';

elseif trust >= 0.55

    trustLevel = 'MODERATE';
    route = 'REVIEW - queue for ophthalmologist';

else

    trustLevel = 'LOW';
    route = 'HUMAN REVIEW REQUIRED - do not act on AI alone';

end

%% 9. SAVE RESULTS

explanation.predicted_class = predIdx;
explanation.predicted_label = predictedLabel;
explanation.confidence = confidence;
explanation.scores = scores;

explanation.referableDR = referableDR;
explanation.referableText = referableText;

explanation.gradcam = map;

explanation.consistency = consistency;

explanation.trust_score = trust;
explanation.trust_level = trustLevel;
explanation.route = route;

%% 10. DISPLAY RESULTS

fprintf('\n');
fprintf('---------------- MODULE 4 RESULT ----------------\n');

fprintf('Predicted Grade : %s\n', predictedLabel);
fprintf('Confidence      : %.2f%%\n', confidence * 100);
fprintf('Referable DR    : %s\n', referableText);

fprintf('Consistency      : %.3f\n', ...
    consistency.consistency);

fprintf('Consistency level : %s\n', ...
    consistency.verdict);

fprintf('Trust Score      : %.3f\n', trust);
fprintf('Trust Level      : %s\n', trustLevel);

fprintf('Route            : %s\n', route);

fprintf('--------------------------------------------------\n');

%% 11. VISUAL DEMO

figure('Name','DRISHTI Module 4 - Explainability', ...
       'NumberTitle','off');

% Original
subplot(1,3,1);

imshow(img);

title('Original Fundus');

% Grad-CAM
subplot(1,3,2);

imshow(img);

hold on;

imagesc(map, ...
    'AlphaData',0.50);

axis image off;

colormap(gca,'jet');

title('Grad-CAM');

hold off;

% Combined
subplot(1,3,3);

imshow(img);

hold on;

imagesc(map, ...
    'AlphaData',0.45);

axis image off;

colormap(gca,'jet');

title(sprintf('%s | %.1f%%', ...
    predictedLabel, confidence*100));

hold off;

sgtitle(sprintf( ...
    'DRISHTI Explainability | Referable DR: %s | Trust: %.2f', ...
    referableText, trust));

end


% =========================================================================
% CONSISTENCY CHECK
% =========================================================================

function c = consistencyCheck(map, evidence, imgSize)

mapF = imresize(map, imgSize(1:2));

% ---------------------------------------------------------
% OPTIC DISC
% ---------------------------------------------------------

od = evidence.optic_disc;

if isempty(od) || numel(od) < 3 || od(3) <= 0

    dd = max(imgSize(1:2)) / 8;

else

    dd = 2 * double(od(3));

end

% ---------------------------------------------------------
% LESION CENTRES
% ---------------------------------------------------------

lesionCentres = [];

if isfield(evidence,'ma_centres') && ...
        ~isempty(evidence.ma_centres)

    lesionCentres = [
        lesionCentres;
        evidence.ma_centres
    ];

end

if isfield(evidence,'hem_centres') && ...
        ~isempty(evidence.hem_centres)

    lesionCentres = [
        lesionCentres;
        evidence.hem_centres
    ];

end

if isfield(evidence,'ex_centres') && ...
        ~isempty(evidence.ex_centres)

    lesionCentres = [
        lesionCentres;
        evidence.ex_centres
    ];

end

% ---------------------------------------------------------
% LESION MASK
% ---------------------------------------------------------

lesionMask = false(imgSize(1),imgSize(2));

if isfield(evidence,'ma_mask')
    lesionMask = lesionMask | logical(evidence.ma_mask);
end

if isfield(evidence,'hem_mask')
    lesionMask = lesionMask | logical(evidence.hem_mask);
end

if isfield(evidence,'ex_mask')
    lesionMask = lesionMask | logical(evidence.ex_mask);
end

lesionZone = imdilate( ...
    lesionMask, ...
    strel('disk',12));

% ---------------------------------------------------------
% METRIC 1: CENTROID DISTANCE
% ---------------------------------------------------------

if ~isempty(lesionCentres)

    [~,idx] = max(mapF(:));

    [py,px] = ind2sub(size(mapF),idx);

    d = hypot( ...
        lesionCentres(:,1)-px, ...
        lesionCentres(:,2)-py);

    centroidDistDD = min(d) / dd;

    mCentroid = ...
        min(max(1 - centroidDistDD/3,0),1);

else

    centroidDistDD = NaN;

    mCentroid = 0.6;

end

% ---------------------------------------------------------
% METRIC 2: REGION OVERLAP
% ---------------------------------------------------------

totalEnergy = sum(mapF(:));

if totalEnergy > 0 && any(lesionZone(:))

    mOverlap = ...
        min(sum(mapF(lesionZone)) / ...
        totalEnergy / 0.30,1);

elseif ~any(lesionZone(:))

    mOverlap = 0.6;

else

    mOverlap = 0;

end

% ---------------------------------------------------------
% METRIC 3: EVIDENCE AGREEMENT
% ---------------------------------------------------------

maCount = 0;
hemCount = 0;
exCount = 0;

if isfield(evidence,'ma_count')
    maCount = double(evidence.ma_count);
end

if isfield(evidence,'hem_count')
    hemCount = double(evidence.hem_count);
end

if isfield(evidence,'ex_count')
    exCount = double(evidence.ex_count);
end

lesionLoad = ...
      maCount * 1.0 ...
    + hemCount * 2.0 ...
    + exCount * 1.5;

if lesionLoad > 0

    mAgree = ...
        0.5 + 0.5 * min(lesionLoad/80,1);

else

    mAgree = 0.5;

end

% ---------------------------------------------------------
% FINAL CONSISTENCY
% ---------------------------------------------------------

c.consistency = ...
      0.4*mCentroid ...
    + 0.4*mOverlap ...
    + 0.2*mAgree;

if c.consistency >= 0.55

    c.verdict = 'HIGH';

elseif c.consistency >= 0.40

    c.verdict = 'MODERATE';

else

    c.verdict = 'LOW';

end

c.centroid_distance_dd = centroidDistDD;
c.region_overlap = mOverlap;
c.evidence_agreement = mAgree;

end