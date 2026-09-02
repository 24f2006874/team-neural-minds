function results = module5_capacity_simulation()
% =========================================================================
% DRISHTI - MODULE 5
% CAPACITY AND SCALABILITY SIMULATION
%
% MATLAB-only discrete-event style queue simulation.
%
% Purpose:
%   Evaluate DRISHTI screening capacity under different patient arrival
%   rates and identify system bottlenecks.
% =========================================================================

clc;

fprintf('\n');
fprintf('============================================================\n');
fprintf('        DRISHTI MODULE 5 - CAPACITY SIMULATION\n');
fprintf('============================================================\n');

%% ========================================================================
% 1. BASELINE PARAMETERS
% ========================================================================

meanArrivalInterval = 3.0;       % minutes
acquisitionTime      = 5.0;      % camera time
m1Time               = 0.50;
m2Time               = 0.10;
m3Time               = 0.08;
m4Time               = 0.10;
doctorTime           = 0.50;

numberOfCameras = 2;
numberOfDoctors = 1;

simulationMinutes = 10000;

rng(42);

fprintf('\n[M5] Baseline configuration\n');

fprintf('Arrival interval : %.2f min\n',meanArrivalInterval);
fprintf('Arrival rate     : %.2f patients/hour\n',...
    60/meanArrivalInterval);

fprintf('Acquisition      : %.2f min\n',acquisitionTime);
fprintf('M1               : %.2f min\n',m1Time);
fprintf('M2               : %.2f min\n',m2Time);
fprintf('M3               : %.2f min\n',m3Time);
fprintf('M4               : %.2f min\n',m4Time);
fprintf('Doctor review    : %.2f min\n',doctorTime);

fprintf('Cameras          : %d\n',numberOfCameras);
fprintf('Doctors          : %d\n',numberOfDoctors);
fprintf('Simulation       : %.0f min\n',simulationMinutes);

%% ========================================================================
% 2. BASELINE
% ========================================================================

baseline = simulateScenario( ...
    meanArrivalInterval,...
    acquisitionTime,...
    m1Time,...
    m2Time,...
    m3Time,...
    m4Time,...
    doctorTime,...
    numberOfCameras,...
    numberOfDoctors,...
    simulationMinutes);

printScenario(baseline,'BASELINE');

%% ========================================================================
% 3. WHAT-IF ANALYSIS
% ========================================================================

fprintf('\n');
fprintf('============================================================\n');
fprintf('                 WHAT-IF ANALYSIS\n');
fprintf('============================================================\n');

scenario1 = simulateScenario( ...
    6.0,...
    acquisitionTime,...
    m1Time,...
    m2Time,...
    m3Time,...
    m4Time,...
    doctorTime,...
    numberOfCameras,...
    numberOfDoctors,...
    simulationMinutes);

scenario2 = simulateScenario( ...
    3.0,...
    acquisitionTime,...
    m1Time,...
    m2Time,...
    m3Time,...
    m4Time,...
    doctorTime,...
    numberOfCameras,...
    numberOfDoctors,...
    simulationMinutes);

scenario3 = simulateScenario( ...
    2.0,...
    acquisitionTime,...
    m1Time,...
    m2Time,...
    m3Time,...
    m4Time,...
    doctorTime,...
    numberOfCameras,...
    numberOfDoctors,...
    simulationMinutes);

scenario4 = simulateScenario( ...
    1.5,...
    acquisitionTime,...
    m1Time,...
    m2Time,...
    m3Time,...
    m4Time,...
    doctorTime,...
    numberOfCameras,...
    numberOfDoctors,...
    simulationMinutes);

%% ========================================================================
% 4. PRINT SCENARIOS
% ========================================================================

printScenario(scenario1,'LOW LOAD - 10 PATIENTS/HOUR');
printScenario(scenario2,'BASELINE - 20 PATIENTS/HOUR');
printScenario(scenario3,'HIGH LOAD - 30 PATIENTS/HOUR');
printScenario(scenario4,'STRESS - 40 PATIENTS/HOUR');

%% ========================================================================
% 5. COMPARISON TABLE
% ========================================================================

scenarioNames = categorical( ...
    {'Low';'Baseline';'High';'Stress'});

arrivalRates = [ ...
    scenario1.arrivalRate;
    scenario2.arrivalRate;
    scenario3.arrivalRate;
    scenario4.arrivalRate];

throughput = [ ...
    scenario1.throughput;
    scenario2.throughput;
    scenario3.throughput;
    scenario4.throughput];

avgWait = [ ...
    scenario1.averageWait;
    scenario2.averageWait;
    scenario3.averageWait;
    scenario4.averageWait];

maxWait = [ ...
    scenario1.maximumWait;
    scenario2.maximumWait;
    scenario3.maximumWait;
    scenario4.maximumWait];

cameraUtil = [ ...
    scenario1.cameraUtilization;
    scenario2.cameraUtilization;
    scenario3.cameraUtilization;
    scenario4.cameraUtilization];

doctorUtil = [ ...
    scenario1.doctorUtilization;
    scenario2.doctorUtilization;
    scenario3.doctorUtilization;
    scenario4.doctorUtilization];

systemDelay = [ ...
    scenario1.averageSystemTime;
    scenario2.averageSystemTime;
    scenario3.averageSystemTime;
    scenario4.averageSystemTime];

status = string({ ...
    scenario1.status;
    scenario2.status;
    scenario3.status;
    scenario4.status});

comparison = table( ...
    scenarioNames,...
    arrivalRates,...
    throughput,...
    avgWait,...
    maxWait,...
    cameraUtil,...
    doctorUtil,...
    systemDelay,...
    status,...
    'VariableNames',{ ...
    'Scenario',...
    'ArrivalRate',...
    'Throughput',...
    'AverageWait_min',...
    'MaximumWait_min',...
    'CameraUtil_percent',...
    'DoctorUtil_percent',...
    'AverageSystemTime_min',...
    'Status'});

fprintf('\n');
fprintf('================ COMPARISON TABLE =========================\n');
disp(comparison);

%% ========================================================================
% 6. BOTTLENECK
% ========================================================================

fprintf('\n');
fprintf('============================================================\n');
fprintf('                 BOTTLENECK ANALYSIS\n');
fprintf('============================================================\n');

resources = { ...
    'Camera',...
    'Ophthalmologist'};

utilization = [ ...
    baseline.cameraUtilization,...
    baseline.doctorUtilization];

[maximumUtilization,index] = max(utilization);

fprintf('Camera utilization          : %.2f%%\n',...
    baseline.cameraUtilization);

fprintf('Ophthalmologist utilization : %.2f%%\n',...
    baseline.doctorUtilization);

fprintf('Primary bottleneck           : %s\n',...
    resources{index});

fprintf('Maximum utilization          : %.2f%%\n',...
    maximumUtilization);

%% ========================================================================
% 7. CAPACITY INTERPRETATION
% ========================================================================

fprintf('\n');
fprintf('============================================================\n');
fprintf('                 CAPACITY INTERPRETATION\n');
fprintf('============================================================\n');

fprintf('Theoretical camera capacity : %.2f patients/hour\n',...
    numberOfCameras * 60 / acquisitionTime);

fprintf('Baseline arrival rate       : %.2f patients/hour\n',...
    baseline.arrivalRate);

if baseline.cameraUtilization < 85

    fprintf(['Baseline camera utilization is below 85%%.\n' ...
             'The system has reasonable camera capacity at baseline load.\n']);

else

    fprintf(['Baseline camera utilization is at or above 85%%.\n' ...
             'Camera capacity is becoming a bottleneck.\n']);

end

if baseline.doctorUtilization < 85

    fprintf(['Doctor utilization is below 85%%.\n' ...
             'The ophthalmologist is not the primary bottleneck.\n']);

else

    fprintf(['Doctor utilization is at or above 85%%.\n' ...
             'Ophthalmologist capacity is becoming a bottleneck.\n']);

end

%% ========================================================================
% 8. WAITING TIME GRAPH
% ========================================================================

figure('Name','DRISHTI M5 - Waiting Time');

plot(arrivalRates,avgWait,'-o','LineWidth',2);

xlabel('Patient arrival rate (patients/hour)');
ylabel('Average waiting time (minutes)');
title('DRISHTI: Arrival Rate vs Average Waiting Time');

grid on;

%% ========================================================================
% 9. RESOURCE UTILIZATION GRAPH
% ========================================================================

figure('Name','DRISHTI M5 - Resource Utilization');

plot(arrivalRates,cameraUtil,'-o','LineWidth',2);
hold on;

plot(arrivalRates,doctorUtil,'-s','LineWidth',2);

yline(100,'--','100% capacity');

hold off;

xlabel('Patient arrival rate (patients/hour)');
ylabel('Resource utilization (%)');

title('DRISHTI: Resource Utilization');

legend('Camera','Ophthalmologist','Capacity limit',...
    'Location','best');

ylim([0 110]);

grid on;

%% ========================================================================
% 10. SAVE RESULTS
% ========================================================================

results = struct();

results.baseline = baseline;
results.scenarios = comparison;

results.bottleneck = resources{index};

results.parameters = struct( ...
    'arrivalInterval',meanArrivalInterval,...
    'acquisitionTime',acquisitionTime,...
    'm1Time',m1Time,...
    'm2Time',m2Time,...
    'm3Time',m3Time,...
    'm4Time',m4Time,...
    'doctorTime',doctorTime,...
    'numberOfCameras',numberOfCameras,...
    'numberOfDoctors',numberOfDoctors,...
    'simulationMinutes',simulationMinutes);

% ============================================================
% SAVE RESULTS - PORTABLE PATH
% ============================================================

%% ========================================================================
% SAVE RESULTS - PORTABLE PATH
% ========================================================================

matlabDir = fileparts(mfilename('fullpath'));
projectRoot = fileparts(matlabDir);

resultsDir = fullfile(projectRoot, 'results');

if ~exist(resultsDir, 'dir')
    mkdir(resultsDir);
end

resultsFile = fullfile(resultsDir, 'DRISHTI_M5_results.mat');

save(resultsFile, 'results');

fprintf('\n');
fprintf('[M5] Results saved to:\n');
fprintf('%s\n', resultsFile);

save(resultsFile,'results');

fprintf('\n');
fprintf('[M5] Results saved to:\n');
fprintf('%s\n',resultsFile);

fprintf('\n');
fprintf('============================================================\n');
fprintf('          MODULE 5 SIMULATION COMPLETED\n');
fprintf('============================================================\n');

end


%% =========================================================================
% SIMULATION FUNCTION
% =========================================================================

function result = simulateScenario( ...
    meanArrivalInterval,...
    acquisitionTime,...
    m1Time,...
    m2Time,...
    m3Time,...
    m4Time,...
    doctorTime,...
    numberOfCameras,...
    numberOfDoctors,...
    simulationMinutes)

%% Generate arrivals

arrivalTimes = [];

t = 0;

while t < simulationMinutes

    interArrival = ...
        -meanArrivalInterval * log(rand);

    t = t + interArrival;

    if t <= simulationMinutes
        arrivalTimes(end+1,1) = t; %#ok<AGROW>
    end

end

numberPatients = length(arrivalTimes);

%% Resource availability

cameraAvailable = zeros(numberOfCameras,1);
doctorAvailable = zeros(numberOfDoctors,1);

%% Timing arrays

cameraStart = zeros(numberPatients,1);
cameraEnd   = zeros(numberPatients,1);

m1End = zeros(numberPatients,1);
m2End = zeros(numberPatients,1);
m3End = zeros(numberPatients,1);
m4End = zeros(numberPatients,1);

doctorStart = zeros(numberPatients,1);
doctorEnd   = zeros(numberPatients,1);

%% Process patients

for i = 1:numberPatients

    arrival = arrivalTimes(i);

    % ---------------------------------------------------------------
    % CAMERA
    % ---------------------------------------------------------------

    [earliestCamera,cameraIndex] = min(cameraAvailable);

    cameraStart(i) = max(arrival,earliestCamera);

    cameraEnd(i) = ...
        cameraStart(i) + acquisitionTime;

    cameraAvailable(cameraIndex) = cameraEnd(i);

    % ---------------------------------------------------------------
    % MODULE 1
    % ---------------------------------------------------------------

    m1End(i) = cameraEnd(i) + m1Time;

    % ---------------------------------------------------------------
    % MODULE 2
    % ---------------------------------------------------------------

    m2End(i) = m1End(i) + m2Time;

    % ---------------------------------------------------------------
    % MODULE 3
    % ---------------------------------------------------------------

    m3End(i) = m2End(i) + m3Time;

    % ---------------------------------------------------------------
    % MODULE 4
    % ---------------------------------------------------------------

    m4End(i) = m3End(i) + m4Time;

    % ---------------------------------------------------------------
    % DOCTOR
    % ---------------------------------------------------------------

    [earliestDoctor,doctorIndex] = ...
        min(doctorAvailable);

    doctorStart(i) = ...
        max(m4End(i),earliestDoctor);

    doctorEnd(i) = ...
        doctorStart(i) + doctorTime;

    doctorAvailable(doctorIndex) = doctorEnd(i);

end

%% ========================================================================
% WAITING TIMES
% ========================================================================

cameraWait = cameraStart - arrivalTimes;

doctorWait = doctorStart - m4End;

totalWait = cameraWait + doctorWait;

systemTime = doctorEnd - arrivalTimes;

%% ========================================================================
% CORRECT RESOURCE UTILIZATION
%
% Only resource activity occurring inside the simulation window is counted.
% Therefore utilization cannot exceed 100%.
% ========================================================================

cameraBusyWithinWindow = 0;

for i = 1:numberPatients

    if cameraStart(i) < simulationMinutes

        busyEnd = min(cameraEnd(i),simulationMinutes);

        cameraBusyWithinWindow = ...
            cameraBusyWithinWindow + ...
            max(0,busyEnd-cameraStart(i));

    end

end

cameraUtilization = ...
    cameraBusyWithinWindow / ...
    (numberOfCameras * simulationMinutes) * 100;

%% Doctor utilization

doctorBusyWithinWindow = 0;

for i = 1:numberPatients

    if doctorStart(i) < simulationMinutes

        busyEnd = min(doctorEnd(i),simulationMinutes);

        doctorBusyWithinWindow = ...
            doctorBusyWithinWindow + ...
            max(0,busyEnd-doctorStart(i));

    end

end

doctorUtilization = ...
    doctorBusyWithinWindow / ...
    (numberOfDoctors * simulationMinutes) * 100;

%% Protect against numerical rounding

cameraUtilization = ...
    min(100,max(0,cameraUtilization));

doctorUtilization = ...
    min(100,max(0,doctorUtilization));

%% ========================================================================
% THROUGHPUT
% ========================================================================

completedWithinSimulation = ...
    sum(doctorEnd <= simulationMinutes);

throughput = ...
    completedWithinSimulation / simulationMinutes * 60;

%% ========================================================================
% STATUS
% ========================================================================

averageWait = mean(totalWait);

if averageWait < 5 && ...
        cameraUtilization < 85 && ...
        doctorUtilization < 85

    status = 'ACCEPTABLE';

elseif averageWait < 15 && ...
        cameraUtilization < 100 && ...
        doctorUtilization < 100

    status = 'HIGH LOAD';

else

    status = 'OVERLOADED';

end

%% ========================================================================
% RESULT
% ========================================================================

result = struct();

result.numberPatients = numberPatients;

result.arrivalRate = ...
    60 / meanArrivalInterval;

result.throughput = throughput;

result.averageWait = averageWait;

result.maximumWait = max(totalWait);

result.averageSystemTime = mean(systemTime);

result.cameraUtilization = cameraUtilization;

result.doctorUtilization = doctorUtilization;

result.averageCameraQueueWait = mean(cameraWait);

result.averageDoctorQueueWait = mean(doctorWait);

result.completedPatients = ...
    completedWithinSimulation;

result.status = status;

result.arrivalTimes = arrivalTimes;

result.cameraWait = cameraWait;

result.doctorWait = doctorWait;

result.systemTime = systemTime;

end


%% =========================================================================
% PRINT SCENARIO
% =========================================================================

function printScenario(result,name)

fprintf('\n');
fprintf('---------------- %s ----------------\n',name);

fprintf('Patients generated        : %d\n',...
    result.numberPatients);

fprintf('Arrival rate              : %.2f patients/hour\n',...
    result.arrivalRate);

fprintf('Completed patients        : %d\n',...
    result.completedPatients);

fprintf('Throughput                : %.2f patients/hour\n',...
    result.throughput);

fprintf('Average waiting time      : %.2f min\n',...
    result.averageWait);

fprintf('Maximum waiting time      : %.2f min\n',...
    result.maximumWait);

fprintf('Average system time       : %.2f min\n',...
    result.averageSystemTime);

fprintf('Camera utilization        : %.2f%%\n',...
    result.cameraUtilization);

fprintf('Doctor utilization        : %.2f%%\n',...
    result.doctorUtilization);

fprintf('Camera queue wait         : %.2f min\n',...
    result.averageCameraQueueWait);

fprintf('Doctor queue wait         : %.2f min\n',...
    result.averageDoctorQueueWait);

fprintf('System status             : %s\n',...
    result.status);

fprintf('------------------------------------------------------------\n');

end