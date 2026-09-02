function [net, info, results] = module3_train_resnet(dataFolder, epochs)
% =========================================================================
% DRISHTI - MODULE 3
% Diabetic Retinopathy Severity Grading
%
% TRAIN  : APTOS_TRAIN_VAL/train
% VAL    : APTOS_TRAIN_VAL/val
% TEST   : APTOS_TEST/test
%
% Model  : ResNet-101 transfer learning
% Classes: Level0 - Level4
%
% Outputs:
%   drishti_dr_model.mat
%   module3_results.mat
%   confusion matrix
%   5-class accuracy
%   per-class sensitivity
%   Level 2+ referable DR metrics
% =========================================================================

if nargin < 2
    epochs = 3;
end

clc;

fprintf('\n');
fprintf('====================================================\n');
fprintf('        DRISHTI MODULE 3 - RESNET-101\n');
fprintf('====================================================\n');

numClasses = 5;

%% 1. DATASET PATHS
% -------------------------------------------------------------------------

trainFolder = fullfile( ...
    dataFolder, ...
    'APTOS_TRAIN_VAL', ...
    'train');

valFolder = fullfile( ...
    dataFolder, ...
    'APTOS_TRAIN_VAL', ...
    'val');

testFolder = fullfile( ...
    dataFolder, ...
    'APTOS_TEST', ...
    'test');

fprintf('\n[M3] Dataset paths:\n');
fprintf('Train : %s\n',trainFolder);
fprintf('Val   : %s\n',valFolder);
fprintf('Test  : %s\n',testFolder);

if ~isfolder(trainFolder)
    error('Training folder not found:\n%s',trainFolder);
end

if ~isfolder(valFolder)
    error('Validation folder not found:\n%s',valFolder);
end

if ~isfolder(testFolder)
    error('Test folder not found:\n%s',testFolder);
end

fprintf('[M3] All dataset folders found successfully.\n');

%% 2. LOAD DATA
% -------------------------------------------------------------------------

fprintf('\n[M3] Loading datasets...\n');

imdsTrain = imageDatastore( ...
    trainFolder, ...
    'IncludeSubfolders',true, ...
    'LabelSource','foldernames');

imdsVal = imageDatastore( ...
    valFolder, ...
    'IncludeSubfolders',true, ...
    'LabelSource','foldernames');

imdsTest = imageDatastore( ...
    testFolder, ...
    'IncludeSubfolders',true, ...
    'LabelSource','foldernames');

% Required class order
classNames = categorical( ...
    {'Level0','Level1','Level2','Level3','Level4'});

% Convert labels to categorical using required categories
imdsTrain.Labels = categorical( ...
    string(imdsTrain.Labels), ...
    string(classNames));

imdsVal.Labels = categorical( ...
    string(imdsVal.Labels), ...
    string(classNames));

imdsTest.Labels = categorical( ...
    string(imdsTest.Labels), ...
    string(classNames));

fprintf('\nTraining distribution:\n');
disp(countEachLabel(imdsTrain));

fprintf('Validation distribution:\n');
disp(countEachLabel(imdsVal));

fprintf('Test distribution:\n');
disp(countEachLabel(imdsTest));

%% 3. CLASS WEIGHTS
% -------------------------------------------------------------------------
% APTOS is imbalanced.
%
% Instead of duplicating datastore indices, use inverse-frequency
% class weighting in the classification loss.
% -------------------------------------------------------------------------

fprintf('\n[M3] Calculating class weights...\n');

trainCounts = zeros(numClasses,1);

for i = 1:numClasses
    trainCounts(i) = sum( ...
        imdsTrain.Labels == classNames(i));
end

totalTrain = sum(trainCounts);

% Inverse-frequency weighting
classWeights = totalTrain ./ ...
    (numClasses .* trainCounts);

% Normalize average weight to approximately 1
classWeights = classWeights ./ mean(classWeights);

fprintf('\nClass weights:\n');

for i = 1:numClasses
    fprintf('%s : %.4f (%d images)\n', ...
        char(classNames(i)), ...
        classWeights(i), ...
        trainCounts(i));
end

%% 4. LOAD RESNET-101
% -------------------------------------------------------------------------

fprintf('\n[M3] Loading pretrained ResNet-101...\n');

if exist('resnet101','file') ~= 2
    error(['resnet101 is not available. Install the ', ...
        'Deep Learning Toolbox Model for ResNet-101 support.']);
end

net0 = resnet101();

fprintf('[M3] ResNet-101 loaded successfully.\n');

inputSize = net0.Layers(1).InputSize;

fprintf('Network input size: %d x %d x %d\n', ...
    inputSize(1), ...
    inputSize(2), ...
    inputSize(3));

%% 5. MODIFY RESNET CLASSIFICATION HEAD
% -------------------------------------------------------------------------

fprintf('\n[M3] Replacing ImageNet classification head...\n');

lgraph = layerGraph(net0);

layers = lgraph.Layers;

% Locate fully connected layers
fcIdx = [];

for i = 1:numel(layers)

    if isa(layers(i), ...
            'nnet.cnn.layer.FullyConnectedLayer')

        fcIdx = i;

    end

end

if isempty(fcIdx)
    error('Could not find final fully connected layer.');
end

oldFcName = layers(fcIdx).Name;

% Locate softmax layer
softmaxIdx = [];

for i = 1:numel(layers)

    if isa(layers(i), ...
            'nnet.cnn.layer.SoftmaxLayer')

        softmaxIdx = i;

    end

end

if isempty(softmaxIdx)
    error('Could not find softmax layer.');
end

oldSoftmaxName = layers(softmaxIdx).Name;

% Locate classification layer
classIdx = [];

for i = 1:numel(layers)

    if isa(layers(i), ...
            'nnet.cnn.layer.ClassificationOutputLayer')

        classIdx = i;

    end

end

if isempty(classIdx)
    error('Could not find classification layer.');
end

oldClassName = layers(classIdx).Name;

fprintf('Original FC         : %s\n',oldFcName);
fprintf('Original softmax    : %s\n',oldSoftmaxName);
fprintf('Original classifier : %s\n',oldClassName);

% Find connection into FC layer
connections = lgraph.Connections;

sourceBeforeFC = connections.Source( ...
    strcmp(connections.Destination,oldFcName));

if isempty(sourceBeforeFC)
    error('Could not find layer feeding final FC layer.');
end

sourceBeforeFC = sourceBeforeFC{1};

% Remove original ImageNet head
lgraph = removeLayers( ...
    lgraph, ...
    {oldFcName,oldSoftmaxName,oldClassName});

%% 6. NEW FIVE-CLASS HEAD
% -------------------------------------------------------------------------

newFc = fullyConnectedLayer( ...
    numClasses, ...
    'Name','fc_dr', ...
    'WeightLearnRateFactor',10, ...
    'BiasLearnRateFactor',10);

newSoftmax = softmaxLayer( ...
    'Name','softmax_dr');

% IMPORTANT:
% ClassWeights handles the APTOS class imbalance without duplicated
% datastore indices.

newClassifier = classificationLayer( ...
    'Name','output_dr', ...
    'Classes',classNames, ...
    'ClassWeights',classWeights);

lgraph = addLayers( ...
    lgraph, ...
    newFc);

lgraph = addLayers( ...
    lgraph, ...
    newSoftmax);

lgraph = addLayers( ...
    lgraph, ...
    newClassifier);

% Connect new head
lgraph = connectLayers( ...
    lgraph, ...
    sourceBeforeFC, ...
    'fc_dr');

lgraph = connectLayers( ...
    lgraph, ...
    'fc_dr', ...
    'softmax_dr');

lgraph = connectLayers( ...
    lgraph, ...
    'softmax_dr', ...
    'output_dr');

fprintf('[M3] Five-class weighted classification head created.\n');

%% 7. DATA AUGMENTATION
% -------------------------------------------------------------------------

fprintf('\n[M3] Creating augmentation pipeline...\n');

augmenter = imageDataAugmenter( ...
    'RandRotation',[-20 20], ...
    'RandXReflection',true, ...
    'RandXScale',[0.90 1.10], ...
    'RandYScale',[0.90 1.10], ...
    'RandXTranslation',[-15 15], ...
    'RandYTranslation',[-15 15]);

auimdsTrain = augmentedImageDatastore( ...
    inputSize(1:2), ...
    imdsTrain, ...
    'DataAugmentation',augmenter, ...
    'ColorPreprocessing','gray2rgb');

auimdsVal = augmentedImageDatastore( ...
    inputSize(1:2), ...
    imdsVal, ...
    'ColorPreprocessing','gray2rgb');

auimdsTest = augmentedImageDatastore( ...
    inputSize(1:2), ...
    imdsTest, ...
    'ColorPreprocessing','gray2rgb');

fprintf('[M3] Datastores ready.\n');

%% 8. TRAINING OPTIONS
% -------------------------------------------------------------------------

fprintf('\n[M3] Preparing training options...\n');

options = trainingOptions( ...
    'adam', ...
    'InitialLearnRate',1e-4, ...
    'MaxEpochs',epochs, ...
    'MiniBatchSize',8, ...
    'Shuffle','every-epoch', ...
    'ValidationData',auimdsVal, ...
    'ValidationFrequency',50, ...
    'ExecutionEnvironment','auto', ...
    'Verbose',true, ...
    'Plots','training-progress');

%% 9. TRAIN
% -------------------------------------------------------------------------

fprintf('\n');
fprintf('====================================================\n');
fprintf('        STARTING RESNET-101 TRAINING\n');
fprintf('====================================================\n');

fprintf('Epochs      : %d\n',epochs);
fprintf('Batch size  : 8\n');
fprintf('Train images: %d\n',numel(imdsTrain.Files));
fprintf('Val images  : %d\n',numel(imdsVal.Files));
fprintf('Test images : %d\n',numel(imdsTest.Files));

tic;

[net,info] = trainNetwork( ...
    auimdsTrain, ...
    lgraph, ...
    options);

trainingTime = toc;

fprintf('\n[M3] Training completed.\n');
fprintf('Training time: %.2f minutes\n', ...
    trainingTime/60);

%% 10. SAVE MODEL
% -------------------------------------------------------------------------

modelPath = fullfile( ...
    dataFolder, ...
    'drishti_dr_model.mat');

save( ...
    modelPath, ...
    'net', ...
    'info', ...
    '-v7.3');

fprintf('\n[M3] Model saved:\n%s\n',modelPath);

%% 11. TEST SET PREDICTION
% -------------------------------------------------------------------------

fprintf('\n');
fprintf('====================================================\n');
fprintf('        TEST SET EVALUATION\n');
fprintf('====================================================\n');

[YPred,scores] = classify( ...
    net, ...
    auimdsTest);

YTest = imdsTest.Labels;

%% 12. OVERALL ACCURACY
% -------------------------------------------------------------------------

accuracy = mean(YPred == YTest);

fprintf('\nOverall test accuracy: %.4f (%.2f%%)\n', ...
    accuracy, ...
    accuracy*100);

%% 13. CONFUSION MATRIX
% -------------------------------------------------------------------------

figure('Name', ...
    'DRISHTI Module 3 - Confusion Matrix');

confusionchart( ...
    YTest, ...
    YPred, ...
    'RowSummary','row-normalized', ...
    'ColumnSummary','column-normalized');

title('DRISHTI ResNet-101 - Test Confusion Matrix');

%% 14. CONFUSION MATRIX NUMERIC
% -------------------------------------------------------------------------

cm = confusionmat( ...
    YTest, ...
    YPred, ...
    'Order',classNames);

fprintf('\nNumeric confusion matrix:\n');
disp(cm);

%% 15. PER-CLASS METRICS
% -------------------------------------------------------------------------

classSensitivity = zeros(numClasses,1);
classPrecision   = zeros(numClasses,1);
classF1          = zeros(numClasses,1);

for i = 1:numClasses

    TP = cm(i,i);

    FN = sum(cm(i,:)) - TP;

    FP = sum(cm(:,i)) - TP;

    sensitivity = ...
        TP / max(TP + FN,1);

    precision = ...
        TP / max(TP + FP,1);

    f1 = ...
        2 * precision * sensitivity / ...
        max(precision + sensitivity,eps);

    classSensitivity(i) = sensitivity;
    classPrecision(i) = precision;
    classF1(i) = f1;

end

fprintf('\n');
fprintf('====================================================\n');
fprintf('        PER-CLASS RESULTS\n');
fprintf('====================================================\n');

for i = 1:numClasses

    fprintf('%s | Sensitivity: %.4f | Precision: %.4f | F1: %.4f\n', ...
        char(classNames(i)), ...
        classSensitivity(i), ...
        classPrecision(i), ...
        classF1(i));

end

%% 16. REFERABLE DR: LEVEL 2+
% -------------------------------------------------------------------------
%
% Level0/Level1 = non-referable
% Level2/Level3/Level4 = referable
%
% This is a screening classification, not a diagnosis.
% -------------------------------------------------------------------------

referableTrue = ...
    (YTest == classNames(3)) | ...
    (YTest == classNames(4)) | ...
    (YTest == classNames(5));

referablePred = ...
    (YPred == classNames(3)) | ...
    (YPred == classNames(4)) | ...
    (YPred == classNames(5));

TP = sum(referableTrue & referablePred);
TN = sum(~referableTrue & ~referablePred);
FP = sum(~referableTrue & referablePred);
FN = sum(referableTrue & ~referablePred);

referableSensitivity = ...
    TP / max(TP + FN,1);

referableSpecificity = ...
    TN / max(TN + FP,1);

referablePrecision = ...
    TP / max(TP + FP,1);

referableF1 = ...
    2 * referablePrecision * referableSensitivity / ...
    max(referablePrecision + referableSensitivity,eps);

fprintf('\n');
fprintf('====================================================\n');
fprintf('        REFERABLE DR (LEVEL 2+) RESULTS\n');
fprintf('====================================================\n');

fprintf('Sensitivity : %.4f (%.2f%%)\n', ...
    referableSensitivity, ...
    referableSensitivity*100);

fprintf('Specificity : %.4f (%.2f%%)\n', ...
    referableSpecificity, ...
    referableSpecificity*100);

fprintf('Precision   : %.4f\n', ...
    referablePrecision);

fprintf('F1 score    : %.4f\n', ...
    referableF1);

%% 17. STORE RESULTS
% -------------------------------------------------------------------------

results = struct();

results.classNames = classNames;

results.YTest = YTest;

results.YPred = YPred;

results.scores = scores;

results.accuracy = accuracy;

results.confusionMatrix = cm;

results.classSensitivity = ...
    classSensitivity;

results.classPrecision = ...
    classPrecision;

results.classF1 = ...
    classF1;

results.referableSensitivity = ...
    referableSensitivity;

results.referableSpecificity = ...
    referableSpecificity;

results.referablePrecision = ...
    referablePrecision;

results.referableF1 = ...
    referableF1;

results.trainingTimeMinutes = ...
    trainingTime/60;

results.modelPath = modelPath;

results.trainCount = ...
    numel(imdsTrain.Files);

results.validationCount = ...
    numel(imdsVal.Files);

results.testCount = ...
    numel(imdsTest.Files);

%% 18. SAVE RESULTS
% -------------------------------------------------------------------------

resultsPath = fullfile( ...
    dataFolder, ...
    'module3_results.mat');

save( ...
    resultsPath, ...
    'results', ...
    '-v7.3');

fprintf('\n[M3] Results saved:\n%s\n', ...
    resultsPath);

%% 19. FINAL SUMMARY
% -------------------------------------------------------------------------

fprintf('\n');
fprintf('====================================================\n');
fprintf('        MODULE 3 COMPLETE\n');
fprintf('====================================================\n');

fprintf('Model                  : ResNet-101\n');
fprintf('Classes                : 5\n');
fprintf('Training images        : %d\n', ...
    numel(imdsTrain.Files));

fprintf('Validation images      : %d\n', ...
    numel(imdsVal.Files));

fprintf('Test images            : %d\n', ...
    numel(imdsTest.Files));

fprintf('Test accuracy          : %.2f%%\n', ...
    accuracy*100);

fprintf('Referable DR sensitivity: %.2f%%\n', ...
    referableSensitivity*100);

fprintf('Referable DR specificity: %.2f%%\n', ...
    referableSpecificity*100);

fprintf('\nModel file:\n%s\n',modelPath);

fprintf('\nResults file:\n%s\n',resultsPath);

fprintf('====================================================\n');

end