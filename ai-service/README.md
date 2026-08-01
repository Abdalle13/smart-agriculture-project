# AgriSense AI Service 🌿🤖

FastAPI microservice for **Crop Disease Detection** and **Agronomic Advisory** using a **MobileNetV2 CNN Deep Learning Model** and **Google Gemini Generative AI (`gemini-flash-latest`)**.

---

## 🌟 Overview & AI Usage

This microservice combines computer vision and generative AI to provide localized agricultural assistance to farmers:

### 1. 🎯 Leaf Disease Classification (CNN MobileNetV2)
- **Model**: MobileNetV2 Deep Learning Convolutional Neural Network trained on plant leaf datasets.
- **Accuracy**: 97.92% test accuracy across 27 plant disease classes.
- **Warm-Up Pipeline**: Automatically runs a warm-up tensor pass on server startup so predictions return instantly (~0.5–1s).
- **Validation Guardrails**:
  - Green-ratio thresholding rejects non-plant images (e.g. people, cars, animals).
  - Confidence thresholding (`CONFIDENCE_THRESHOLD = 0.60`) prevents false positive predictions on blurry or multi-object photos.

### 2. 💡 Generative AI Treatment & Prevention Advisory (Google Gemini)
- **SDK**: `google-genai` official Python SDK.
- **Model**: `gemini-flash-latest`.
- **Function**: Automatically generates localized, easy-to-understand Somali treatment and prevention advisories for diagnosed crop diseases.
- **Async Execution**: Gemini API calls are run in an asynchronous thread executor (`asyncio.run_in_executor`), ensuring the FastAPI event loop is non-blocking.

---

## 📁 Folder Structure

```
ai-service/
├── main.py               # FastAPI application & routes (/predict, /advise/weather, /advise/soil, /)
├── requirements.txt      # Python dependencies
├── .env                  # Environment variables (GEMINI_API_KEY)
├── models/
│   ├── cnn_best.keras    # Production MobileNetV2 CNN model (28 MB)
│   └── class_names.json  # 27 plant disease class mappings
└── utils/
    ├── __init__.py
    └── predictor.py      # Preprocessing, CNN inference, validation checks, and Gemini AI advisor
```

---

## ⚙️ Setup & Installation

### Prerequisites
- **Python 3.10 or 3.11** installed
- **Google Gemini API Key** from [Google AI Studio](https://aistudio.google.com)

---

### Step 1: Create Virtual Environment

Open a terminal in the `ai-service` directory:

```bash
cd ai-service
py -3.11 -m venv .venv
```

Activate the virtual environment:
- **Windows (PowerShell)**:
  ```powershell
  .\.venv\Scripts\Activate.ps1
  ```
- **Windows (CMD)**:
  ```cmd
  .\.venv\Scripts\activate.bat
  ```
- **Linux/macOS**:
  ```bash
  source .venv/bin/activate
  ```

---

### Step 2: Install Dependencies

```bash
pip install -r requirements.txt
```

---

### Step 3: Configure Environment Variables

Create or edit the `.env` file inside `ai-service/`:

```env
GEMINI_API_KEY=YOUR_GEMINI_API_KEY_HERE
```

---

### Step 4: Run the AI Service

```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

When started, you should see:
```text
✅ CNN model warmed up — first prediction will be instant.
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
```

The service is now live at `http://localhost:8000`.

---

## 📡 API Endpoints

### 1. `GET /`
- **Description**: Health check endpoint.
- **Response**:
  ```json
  {
    "status": "ok",
    "service": "AgriSense AI Microservice",
    "engine": "CNN MobileNetV2 (97.92%) + Gemini Flash AI Advisor"
  }
  ```

### 2. `POST /predict`
- **Description**: Upload a leaf photo for instant crop disease classification and Somali advisory generation.
- **Payload**: `multipart/form-data` with `file` (image file).
- **Response Example**:
  ```json
  {
    "success": true,
    "disease": "Tomato Target Spot",
    "class_key": "Tomato___Target_Spot",
    "crop": "Tomato",
    "confidence": 0.8754,
    "severity": "Medium",
    "treatment": "Daaweynta cudurka...",
    "prevention": "Ka hortaga cudurka...",
    "model_used": "CNN (MobileNetV2)",
    "model_accuracy": "97.92%"
  }
  ```

### 3. `POST /advise/weather`
- **Description**: Generate weather agronomic advice via Gemini AI.
- **Payload**: `{ "current": {...}, "forecast": [...] }`

### 4. `POST /advise/soil`
- **Description**: Generate soil NPK and moisture advice via Gemini AI.
- **Payload**: `{ "nitrogen": 40, "phosphorus": 15, "potassium": 18, "moisture": 30 }`

---

## 🧪 Testing with Curl

```bash
# Health check
curl http://localhost:8000/

# Test disease diagnosis with an image
curl -X POST http://localhost:8000/predict -F "file=@path/to/leaf.jpg"
```
