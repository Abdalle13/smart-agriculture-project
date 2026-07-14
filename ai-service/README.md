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

---

## Requirements

- Python 3.12
- All dependencies in `requirements.txt`

---

## Setup

### 1. Install dependencies

```bash
pip install -r requirements.txt
```

### 2. Start the server

```bash
uvicorn main:app --port 8000 --reload
```

Server runs at `http://localhost:8000`

---

## Endpoints

### `GET /`
Health check.

**Response:**
```json
{
  "status": "ok",
  "service": "AgriSense AI",
  "version": "1.0.0"
}
```

---

### `POST /predict`
Upload a leaf image and get a disease prediction.

**Request:** `multipart/form-data`

| Field | Type | Description |
|---|---|---|
| `file` | image file | JPEG, PNG, or WebP — max 10 MB |

**Response:**
```json
{
  "success": true,
  "disease": "Tomato – Early blight",
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

| Status | Reason |
|---|---|
| `400` | Unsupported file type |
| `400` | File exceeds 10 MB |
| `400` | Empty file |
| `500` | Model inference error |

---

## Supported Classes (27 total)

### Mango — 8 classes
| Class | Severity |
|---|---|
| Anthracnose | High |
| Bacterial Canker | High |
| Cutting Weevil | Medium |
| Die Back | High |
| Gall Midge | Medium |
| Powdery Mildew | Medium |
| Sooty Mould | Low |
| Healthy | None |

### Corn — 4 classes
| Class | Severity |
|---|---|
| Corn_(maize)___Cercospora_leaf_spot Gray_leaf_spot | Medium |
| Corn_(maize)___Common_rust_ | Medium |
| Corn_(maize)___Northern_Leaf_Blight | High |
| Corn_(maize)___healthy | None |

### Pepper — 2 classes
| Class | Severity |
|---|---|
| Pepper,_bell___Bacterial_spot | Medium |
| Pepper,_bell___healthy | None |

### Potato — 3 classes
| Class | Severity |
|---|---|
| Potato___Early_blight | Medium |
| Potato___Late_blight | High |
| Potato___healthy | None |

### Tomato — 10 classes
| Class | Severity |
|---|---|
| Tomato___Bacterial_spot | Medium |
| Tomato___Early_blight | Medium |
| Tomato___Late_blight | High |
| Tomato___Leaf_Mold | Medium |
| Tomato___Septoria_leaf_spot | Medium |
| Tomato___Spider_mites Two-spotted_spider_mite | Medium |
| Tomato___Target_Spot | Medium |
| Tomato___Tomato_mosaic_virus | High |
| Tomato___Tomato_Yellow_Leaf_Curl_Virus | High |
| Tomato___healthy | None |

---

## Image Preprocessing

All images are processed before inference:

1. Convert to RGB
2. Resize to **224 × 224** pixels
3. Normalize pixel values to **0.0 – 1.0**
4. Expand dims → shape `(1, 224, 224, 3)`

---

## Integration

Frontend sends image directly to this service:
```
POST http://localhost:8000/predict   (multipart/form-data)
```

Frontend then saves the result to Node.js backend:
```
POST http://localhost:5000/api/diagnosis   (JSON, JWT required)
```

CORS is open to all origins — no proxy needed.

---

*AgriSense AI Service · CNN Crop Disease Detection · 27 classes*
