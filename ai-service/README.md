# AgriSense AI Service

FastAPI microservice for crop disease detection using a CNN deep learning model.  
Accepts a leaf image and returns the detected disease, confidence score, severity, and treatment advice.

---

## Folder Structure

```
ai-service/
├── main.py               FastAPI app — POST /predict, GET /
├── requirements.txt      Python dependencies
├── models/
│   ├── cnn_best.keras    CNN model (production)
│   ├── class_names.json  Ordered list of 27 class names
│   ├── knn_model.pkl     KNN model (thesis comparison)
│   ├── rf_model.pkl      Random Forest model (thesis comparison)
│   ├── svm_model.pkl     SVM model (thesis comparison)
│   └── svm_scaler.pkl    SVM feature scaler
└── utils/
    ├── __init__.py
    └── predictor.py      Image preprocessing + CNN inference + treatment lookup
```

> `knn_model.pkl`, `rf_model.pkl`, `svm_model.pkl` are used only for thesis accuracy comparison — not called in production.

> **Git tracking:** only `cnn_best.keras` (28 MB) and `class_names.json` are committed to this repo — they're the two files `predictor.py` actually loads. The `.pkl` thesis-comparison files (up to 463 MB each) are excluded via `.gitignore` since they exceed GitHub's size limits and aren't needed to run the service. Cloning the repo is enough to get everything `main.py` needs.

---

## Requirements

- Python 3.11
- All dependencies in `requirements.txt`

---

## Setup

### 1. Create and activate a virtual environment

```bash
py -3.11 -m venv .venv
.\.venv\Scripts\Activate
```

Confirm the prompt shows `(.venv)` before continuing — otherwise dependencies install to (and uvicorn runs from) the system Python instead of this project's enadvironment.

### 2. Install dependencies

```bash
pip install -r requirements.txt
```

### 3. Start the server

```bash
uvicorn main:app --port 8000 --reload
```

Server runs at `http://localhost:8000`

> Each new terminal session needs `.\.venv\Scripts\Activate` run again before `uvicorn` — activation does not persist across terminals.

---

## Development Commands

```bash
# Activate the virtual environment (run in every new terminal)
.\.venv\Scripts\Activate

# Start with hot-reload (auto-restarts on file changes)
uvicorn main:app --port 8000 --reload

# Start without hot-reload
uvicorn main:app --port 8000

# Test the health check endpoint
curl http://localhost:8000

# Test a prediction with a sample image
curl -X POST http://localhost:8000/predict -F "file=@path/to/leaf.jpg"

# Deactivate the virtual environment
deactivate
```

---

## VS Code

Point VS Code at this project's virtual environment so imports (`fastapi`, `tensorflow`, etc.) resolve correctly and the debugger/test tools use the right interpreter:

1. `Ctrl+Shift+P` → **Python: Select Interpreter**
2. Choose `.\ai-service\.venv\Scripts\python.exe`
3. Confirm the bottom-right status bar shows the `.venv` interpreter, not a system-wide Python

Recommended extensions: **Python** (`ms-python.python`), **Pylance**.

The integrated terminal does not auto-activate the virtual environment for existing panels — run `.\.venv\Scripts\Activate` in any new terminal before using `uvicorn` or `pip`.

---

## Endpoints

### `GET /`

Health check.

**Response:**

```json
{
  "status": "ok",
  "service": "AgriSense AI"
}
```

---

### `POST /predict`

Upload a leaf image and get a disease prediction.

**Request:** `multipart/form-data`

| Field  | Type       | Description                    |
| ------ | ---------- | ------------------------------ |
| `file` | image file | JPEG, PNG, or WebP — max 10 MB |

**Response:**

```json
{
  "success": true,
  "disease": "Tomato Early blight",
  "class_key": "Tomato___Early_blight",
  "crop": "Tomato",
  "confidence": 0.9231,
  "severity": "Medium",
  "treatment": "Apply chlorothalonil or copper fungicides...",
  "prevention": "Mulch soil surface and use drip irrigation...",
  "model_used": "AgriCNN v1.0"
}
```

**Error responses:**

| Status | Reason                |
| ------ | --------------------- |
| `400`  | Unsupported file type |
| `400`  | File exceeds 10 MB    |
| `400`  | Empty file            |
| `500`  | Model inference error |

---

## API Documentation

FastAPI auto-generates interactive API docs — no extra setup needed:

- **Swagger UI**: `http://localhost:8000/docs` — try requests directly from the browser
- **ReDoc**: `http://localhost:8000/redoc` — read-only reference view

---

## Model Information

- **Production model**: `models/cnn_best.keras` — CNN trained on 27 disease classes across 5 crops (mango, corn, pepper, potato, tomato), ~27 MB.
- **Input**: 224×224 RGB images, pixel values normalized to 0.0–1.0 (`utils/predictor.py: preprocess_image`).
- **Confidence threshold**: predictions below **60%** confidence are reported as `"Unrecognized not a supported crop/disease"` instead of being forced into the closest class (`CONFIDENCE_THRESHOLD` in `predictor.py`).
- **Class list**: `models/class_names.json` — ordered list of 27 class names; index order must match the model's output layer.
- **Treatment/prevention data**: hardcoded per class in `utils/predictor.py: TREATMENT_MAP`.
- **Thesis comparison models** (loaded for offline accuracy comparison only — not called by `/predict`): `knn_model.pkl` (~154 MB), `rf_model.pkl` (~462 MB), `svm_model.pkl` (~124 MB), `svm_scaler.pkl`.

---

## Supported Classes (27 total)

### Mango — 8 classes

| Class            | Severity |
| ---------------- | -------- |
| Anthracnose      | High     |
| Bacterial Canker | High     |
| Cutting Weevil   | Medium   |
| Die Back         | High     |
| Gall Midge       | Medium   |
| Powdery Mildew   | Medium   |
| Sooty Mould      | Low      |
| Healthy          | None     |

### Corn — 4 classes

| Class                                                  | Severity |
| ------------------------------------------------------ | -------- |
| Corn\_(maize)\_\_\_Cercospora_leaf_spot Gray_leaf_spot | Medium   |
| Corn\_(maize)_\_\_Common_rust_                         | Medium   |
| Corn\_(maize)\_\_\_Northern_Leaf_Blight                | High     |
| Corn\_(maize)\_\_\_healthy                             | None     |

### Pepper — 2 classes

| Class                             | Severity |
| --------------------------------- | -------- |
| Pepper,\_bell\_\_\_Bacterial_spot | Medium   |
| Pepper,\_bell\_\_\_healthy        | None     |

### Potato — 3 classes

| Class                    | Severity |
| ------------------------ | -------- |
| Potato\_\_\_Early_blight | Medium   |
| Potato\_\_\_Late_blight  | High     |
| Potato\_\_\_healthy      | None     |

### Tomato — 10 classes

| Class                                            | Severity |
| ------------------------------------------------ | -------- |
| Tomato\_\_\_Bacterial_spot                       | Medium   |
| Tomato\_\_\_Early_blight                         | Medium   |
| Tomato\_\_\_Late_blight                          | High     |
| Tomato\_\_\_Leaf_Mold                            | Medium   |
| Tomato\_\_\_Septoria_leaf_spot                   | Medium   |
| Tomato\_\_\_Spider_mites Two-spotted_spider_mite | Medium   |
| Tomato\_\_\_Target_Spot                          | Medium   |
| Tomato\_\_\_Tomato_mosaic_virus                  | High     |
| Tomato\_\_\_Tomato_Yellow_Leaf_Curl_Virus        | High     |
| Tomato\_\_\_healthy                              | None     |

---

## Image Preprocessing

All images are processed before inference:

1. Convert to RGB
2. Resize to **224 × 224** pixels
3. Normalize pixel values to **0.0 – 1.0**
4. Expand dims → shape `(1, 224, 224, 3)`

---

## Troubleshooting

| Problem | Cause | Fix |
| --- | --- | --- |
| `Fatal error in launcher: Unable to create process using "...python.exe"` | `uvicorn` resolved to a system-wide Python install, not this project's `.venv` | Run `.\.venv\Scripts\Activate` first, then re-run `uvicorn` |
| Prompt doesn't show `(.venv)` | Virtual environment not activated in this terminal | Activation doesn't persist across terminals — re-run `.\.venv\Scripts\Activate` in every new one |
| `WARNING: TensorFlow GPU support is not available on native Windows` | Expected — TensorFlow ≥2.11 dropped native Windows GPU support | Harmless; inference runs on CPU. Use WSL2 for GPU acceleration if needed |
| Traceback appears after pressing `Ctrl+C` to stop the server | Normal `uvicorn --reload` shutdown behavior on Windows | Harmless — ignore it if `Application startup complete` printed beforehand |
| `Address already in use` on port 8000 | A previous `uvicorn` process is still running | Stop the old process, or start on a different port with `--port 8001` |
| `500` error / model inference error on `/predict` | Corrupted or missing model file in `models/` | Confirm `cnn_best.keras` and `class_names.json` exist and aren't truncated |

---

## Deployment (Railway)

1. New Railway service → connect this GitHub repo → set **root directory** to `ai-service/`.
2. Start command is picked up automatically from the `Procfile`: `uvicorn main:app --host 0.0.0.0 --port $PORT`. Railway injects `$PORT` — no need to set it manually.
3. No environment variables are required (CORS is open by design — this service is only ever called server-to-server by the backend, never directly from a browser).
4. After deploying, copy the Railway-assigned URL and set it as `AI_SERVICE_URL` on the Railway **backend** service (see [`../backend/README.md`](../backend/README.md)).
5. Confirm it's live: `GET https://<your-ai-service>.up.railway.app/` should return the health check JSON.

> Cold starts: TensorFlow takes a few seconds to load the model on the first request after a period of inactivity (Railway's free tier can sleep idle services) — this is normal, not an error.

---

## Integration

Farmer uploads an image to the Node.js backend:

```
POST http://localhost:5000/api/diagnosis   (multipart/form-data, JWT required)
```

The backend forwards the image to this service and saves the result:

```
POST http://localhost:8000/predict   (multipart/form-data)
```

The frontend never calls this service directly — CORS is left open for local development/testing convenience only.

---

_AgriSense AI Service · CNN Crop Disease Detection · 27 classes_
