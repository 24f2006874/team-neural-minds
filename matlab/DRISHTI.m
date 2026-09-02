function result = DRISHTI(imagePath, patientID)
% =========================================================================
% DRISHTI - MAIN END-TO-END MATLAB PIPELINE
%
% Project root:
%   DRISHTI_portable/
%
% MATLAB source:
%   DRISHTI_portable/matlab/
%
% Model:
%   DRISHTI_portable/models/drishti_dr_model.mat
%
% Results:
%   DRISHTI_portable/results/
%
% =========================================================================

if nargin < 2
    patientID = 'DEMO-001';
end

%% ------------------------------------------------------------------------
% LOCATE PROJECT DIRECTORIES
% -------------------------------------------------------------------------

% Folder containing this DRISHTI.m file
matlabDir = fileparts(mfilename('fullpath'));

% DRISHTI_portable/
projectRoot = fileparts(matlabDir);

% Standard project folders
modelDir   = fullfile(projectRoot, 'models');
resultsDir = fullfile(projectRoot, 'results');

if ~exist(resultsDir, 'dir')
    mkdir(resultsDir);
end

%% ------------------------------------------------------------------------
% CHECK INPUT
% -------------------------------------------------------------------------

if ~isfile(imagePath)
    error('DRISHTI:ImageNotFound', ...
        'Input image not found:\n%s', imagePath);
end

fprintf('\n');
fprintf('============================================================\n');
fprintf('                 DRISHTI SCREENING PIPELINE\n');
fprintf('============================================================\n');

fprintf('Patient : %s\n', patientID);
fprintf('Image   : %s\n', imagePath);

fprintf('MATLAB source : %s\n', matlabDir);
fprintf('Project root  : %s\n', projectRoot);

%% ------------------------------------------------------------------------
% LOAD IMAGE
% -------------------------------------------------------------------------

img = imread(imagePath);

if ndims(img) == 2
    img = cat(3, img, img, img);
end

%% ========================================================================
% MODULE 1
% ========================================================================

fprintf('\n[M1] Quality Gate...\n');

[decision, finalImg, quality] = ...
    module1_quality_gate(img);

fprintf('Decision        : %s\n', decision);
fprintf('Quality score   : %.4f\n', quality.qualityScore);
fprintf('Focus score     : %.4f\n', quality.focus);
fprintf('Illumination    : %.4f\n', quality.illumination);
fprintf('FOV score       : %.4f\n', quality.fieldOfView);
fprintf('Retina coverage : %.4f\n', quality.retinaCoverage);
fprintf('Enhancement     : %d\n', quality.enhanced);
fprintf('Reason          : %s\n', quality.reason);

if strcmpi(decision,'REJECT')

    fprintf('\n[M1] REJECTED - RECAPTURE REQUIRED\n');

    result = struct();

    result.patient_id = patientID;
    result.image_path = imagePath;
    result.gate = 'REJECT';
    result.quality = quality;
    result.reason = quality.reason;
    result.engine = 'MATLAB';

    return;
end

%% ========================================================================
% MODULE 2
% ========================================================================

fprintf('\n[M2] Evidence Engine...\n');

evidence = module2_evidence_engine( ...
    finalImg, quality.mask);

fprintf('\n');
fprintf('---------------- MODULE 2 RESULT ----------------\n');

fprintf('Vessel density : %.4f\n', evidence.vessel_density);
fprintf('Optic disc     : [%g %g], radius=%g\n', ...
    evidence.optic_disc(1), ...
    evidence.optic_disc(2), ...
    evidence.optic_disc(3));

fprintf('Fovea          : [%g %g]\n', ...
    evidence.fovea(1), ...
    evidence.fovea(2));

fprintf('Microaneurysms : %d\n', evidence.ma_count);
fprintf('Hemorrhages    : %d\n', evidence.hem_count);
fprintf('Exudates       : %d\n', evidence.ex_count);

fprintf('DME risk flag  : %s\n', ...
    ternary(evidence.dme_risk, ...
    'TRIGGERED', ...
    'NOT TRIGGERED'));

fprintf('DME message    : %s\n', evidence.dme_message);

%% ========================================================================
% MODULE 3 + MODULE 4
% ========================================================================

fprintf('\n[M3] CNN classification...\n');
fprintf('[M4] Grad-CAM + consistency + trust...\n');

%% ------------------------------------------------------------------------
% FIND MATLAB MODEL
% -------------------------------------------------------------------------

modelPath = fullfile(modelDir, 'drishti_dr_model.mat');

fprintf('\nModel path:\n%s\n', modelPath);

if isfile(modelPath)

    fprintf('[M3] MATLAB model found.\n');

    S = load(modelPath);

    % Expected variable name
    if isfield(S,'net')
        net = S.net;
    elseif isfield(S,'netTransfer')
        net = S.netTransfer;
    else
        error(['MATLAB model found, but no supported network variable ' ...
               '("net" or "netTransfer") was found.']);
    end

    %% MODULE 4

    explanation = module4_explainability( ...
        net, ...
        finalImg, ...
        evidence, ...
        quality.qualityScore);

else

    warning(['MATLAB CNN model not found:\n%s\n' ...
             'Module 3/4 cannot run the trained MATLAB CNN.'], ...
             modelPath);

    result = struct();

    result.patient_id = patientID;
    result.image_path = imagePath;
    result.gate = decision;
    result.quality = quality;
    result.evidence = evidence;
    result.engine = 'MATLAB';
    result.status = 'MODEL_NOT_FOUND';
    result.model_path = modelPath;

    fprintf('\n[M3] MATLAB model unavailable.\n');
    fprintf('Expected model:\n%s\n', modelPath);

    return;
end

%% ========================================================================
% FINAL RESULT
% ========================================================================

result = struct();

result.patient_id = patientID;
result.image_path = imagePath;

result.gate = decision;
result.quality = quality;

result.evidence = evidence;

result.prediction = explanation.predicted_label;
result.confidence = explanation.confidence;

result.explanation = explanation;

result.engine = 'MATLAB';

%% ------------------------------------------------------------------------
% SAVE A MATLAB RESULT FILE
% -------------------------------------------------------------------------

resultFile = fullfile( ...
    resultsDir, ...
    sprintf('%s_DRISHTI_result.mat', patientID));

save(resultFile, 'result');

fprintf('\n');
fprintf('============================================================\n');
fprintf('              FINAL DRISHTI RESULT\n');
fprintf('============================================================\n');

fprintf('Prediction : %s\n', result.prediction);
fprintf('Confidence : %.2f%%\n', 100*result.confidence);

fprintf('\nResult saved to:\n%s\n', resultFile);

end


%% ========================================================================
% LOCAL HELPER
% ========================================================================

function output = ternary(condition, trueValue, falseValue)

if condition
    output = trueValue;
else
    output = falseValue;
end

end