from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from utils.predictor import predict_disease

app = FastAPI(
    title="AgriSense AI Service",
    description="Crop Disease Detection Microservice using MobileNetV2 CNN & Gemini 2.5 Flash AI Advisor.",
    version="2.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

ALLOWED_TYPES  = {"image/jpeg", "image/png", "image/webp", "image/gif"}
MAX_SIZE_BYTES = 10 * 1024 * 1024   # 10 MB


@app.get("/")
def health_check():
    return {
        "status":  "ok",
        "service": "AgriSense AI Microservice",
        "engine":  "CNN MobileNetV2 (97.92%) + Gemini 2.5 Flash AI Advisor",
    }


@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    # Validate file type
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '{file.content_type}'. Upload a JPEG, PNG, or WebP image."
        )

    image_bytes = await file.read()

    if len(image_bytes) > MAX_SIZE_BYTES:
        raise HTTPException(status_code=400, detail="Image exceeds 10 MB limit.")

    if len(image_bytes) == 0:
        raise HTTPException(status_code=400, detail="Empty file received.")

    result = await predict_disease(image_bytes)
    return {"success": True, **result}
