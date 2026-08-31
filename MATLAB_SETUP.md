# MATLAB Setup & Live-Engine Runbook
### DRISHTI — SIH 2026 · PS 26038 (MathWorks)

This project is specified as a **MATLAB-based pipeline**. The repo ships the real
MATLAB prototype (`DRISHTI_portable/matlab`, `DRISHTI.m` + `module1..5`) plus a
faithful Python port (`DRISHTI_portable/src`). The web app prefers to run the
**real MATLAB `DRISHTI.m` pipeline / Simulink capacity model** through the MATLAB
Engine for Python, and transparently falls back to the Python port when MATLAB is
not installed.

This runbook walks you through getting the live MATLAB path working, and how to
demonstrate it to the judges.

---

## 0. What you'll end up with

| Component | Purpose | MATLAB needed? |
|---|---|---|
| `DRISHTI.m` + `module1..5` | The real 5-module MATLAB pipeline | Yes |
| `module5_build_simulink.m` → `DRISHTI_CapacityPlanner.slx` | Simulink / SimEvents capacity model | Yes |
| `module3_train_resnet.m` | Trains the CNN (ICDR 0-4) → `drishti_dr_model.mat` | Yes |
| Python `src/` port | Faithful twin used as web fallback | No |
| Web app (`/api/screen`, `/api/capacity`) | Runs whichever engine is available | Runtime |

---

## 1. Install MATLAB (interactive — needs your login)

Requires: **student/university MathWorks license** (free for students) or a 30-day trial.

1. Go to **https://www.mathworks.com/downloads** (or your university portal).
2. Download the **Windows installer** (R2024a or newer recommended).
3. Run it, **sign in** with your university MathWorks account.
4. In the **"Select Products"** step choose **only**:
   - ✅ MATLAB
   - ✅ Simulink
   - ✅ SimEvents
   - ✅ Image Processing Toolbox
   - ✅ Computer Vision Toolbox
   - ✅ Deep Learning Toolbox
   - ✅ Statistics & Machine Learning Toolbox
   - (Medical Imaging Toolbox — optional, if offered)
5. Continue with default **"Sign in → activate online"**.
6. Finish the install and let it register (bytecode/`installProduct` step).

**Expected:** ~25–35 GB disk, **2–4 hours** on a 2-core/no-GPU laptop, several GB download.

> No GPU is fine — the pipeline runs CPU-only (matches your Python port).

---

## 2. Install the MATLAB Engine for Python (bridge)

Once MATLAB is on disk:

```powershell
python -m pip install matlabengine
```

This adds the `matlab.engine` package that lets the web backend call `DRISHTI.m`.

---

## 3. Verify the live MATLAB path (one command)

From the `drishti_webapp/backend` folder:

```powershell
python setup_matlab.py
```

It checks the package, boots the engine, verifies `DRISHTI.m` + all 5 modules are
callable, and builds the Simulink model. Output should end with:

```
DONE. The web app will now report 'MATLAB Engine active'.
```

---

## 4. Confirm the web app switched

Start/restart the backend:

```powershell
# from drishti_webapp/backend
uvicorn main:app --host 127.0.0.1 --port 8000
```

Then open in the browser (or curl):

- **`GET http://localhost:8000/api/matlab_status`** → should now return
  `{"engine":"connected","using":"matlab", ...}`
- **`GET http://localhost:8000/health`** → `"matlab":{"installed":true,"available":true,...}`
- The **How It Works** page badge flips to **"MATLAB Engine active"**.
- Screening results now carry **`"engine":"matlab"`**.

---

## 5. Optional: train the MATLAB CNN model

`DRISHTI.m` uses the CNN when `drishti_dr_model.mat` exists; otherwise it uses the
evidence-based ICDR grading fallback (still a full real pipeline run). To enable
the trained-CNN path in MATLAB:

1. Open MATLAB, `cd` into `DRISHTI_portable/matlab`.
2. Put APTOS/IDRiD training data in the expected folder structure.
3. Run:

   ```matlab
   module3_train_resnet           % train -> drishti_dr_model.mat
   ```

4. Verify a full run:

   ```matlab
   r = DRISHTI('path/to/fundus.png', 'PHC-001')
   ```

---

## 6. Demonstrate to the judges (prescription)

1. Open the web app → **Screening** → upload a fundus image → watch the 5-stage
   stepper; the report PNG shows Grad-CAM + lesion evidence.
2. Point at the **How It Works → "Built as a MATLAB pipeline"** section: the 5 `.m`
   modules mapped to Toolboxes, and the live **"MATLAB Engine active"** badge.
3. Open **Planner** → run a what-if (cameras vs reviewers vs arrivals) → show it's
   backed by the same queuing model that `module5_build_simulink.m` builds as
   `DRISHTI_CapacityPlanner.slx`.
4. In MATLAB: run `module5_build_simulink`, open the `.slx`, press Run — show the
   discrete-event workflow (arrivals → acquisition queue → cameras → AI → review).
5. **Explainability story:** Grad-CAM + Consistency Check + trust router — the
   define-the-competition differentiator.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| `pip install matlabengine` fails | Install MATLAB first; retry from an admin terminal. |
| `start_matlab()` hangs/errors | MATLAB not activated; open MATLAB once to activate, then retry. |
| `DRISHTI` not found (step 3) | Confirm `DRISHTI_portable/matlab` path; rerun `python setup_matlab.py`. |
| Simulink step skipped | Install Simulink + SimEvents in the MATLAB installer (run installer again → Add products). |
| Web app still says "Python port active" | Backend was started before MATLAB. Restart the backend process, then refresh. |
