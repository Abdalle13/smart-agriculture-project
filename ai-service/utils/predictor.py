import json
import io
import numpy as np
from pathlib import Path
from PIL import Image
import tensorflow as tf

MODEL_DIR = Path("./models")

# ── Load CNN model and class names once on startup ────────────────────────────
cnn_model = tf.keras.models.load_model(MODEL_DIR / "cnn_best.keras")

with open(MODEL_DIR / "class_names.json") as f:
    data = json.load(f)
    class_names = data["class_names"]   # JSON is {"class_names": [...], "num_classes": 27}

# ── Treatment lookup — keys must match class_names.json exactly ───────────────
TREATMENT_MAP = {
    # ── Mango (short class names from MangoLeafBD dataset) ───────────────────
    "Anthracnose": {
        "treatment": "Apply copper-based fungicides or mancozeb before and after flowering. Remove and destroy all infected fruits and leaves.",
        "severity": "High",
        "prevention": "Prune trees to improve air circulation and avoid wetting fruit during irrigation.",
        "crop": "Mango",
    },
    "Bacterial Canker": {
        "treatment": "Prune infected branches 30 cm below visible symptoms. Apply copper bactericide on cuts. Disinfect pruning tools between each cut.",
        "severity": "High",
        "prevention": "Avoid mechanical injuries to bark and apply copper sprays after any pruning.",
        "crop": "Mango",
    },
    "Cutting Weevil": {
        "treatment": "Apply insecticides (chlorpyrifos, carbaryl) to stem and soil around the tree. Remove and destroy all infested shoots.",
        "severity": "Medium",
        "prevention": "Monitor trees regularly and remove dead wood where weevils breed.",
        "crop": "Mango",
    },
    "Die Back": {
        "treatment": "Prune dead branches back to healthy wood. Apply Bordeaux mixture or copper fungicide to all cut surfaces. Improve tree nutrition with potassium and zinc.",
        "severity": "High",
        "prevention": "Avoid water stress and maintain adequate potassium and zinc levels in soil.",
        "crop": "Mango",
    },
    "Gall Midge": {
        "treatment": "Apply systemic insecticides (dimethoate, imidacloprid) at bud burst. Remove and destroy all galled tissues immediately.",
        "severity": "Medium",
        "prevention": "Time insecticide applications at leaf flush stage when midges are most active.",
        "crop": "Mango",
    },
    "Healthy": {
        "treatment": "No treatment needed. Tree is healthy.",
        "severity": "None",
        "prevention": "Maintain regular fertilization schedule and monitor for early signs of pests or disease.",
        "crop": "Mango",
    },
    "Powdery Mildew": {
        "treatment": "Apply sulfur-based fungicides or wettable sulfur. Use potassium bicarbonate as an organic alternative. Spray during cooler parts of the day.",
        "severity": "Medium",
        "prevention": "Ensure good air circulation and avoid excessive nitrogen fertilization.",
        "crop": "Mango",
    },
    "Sooty Mould": {
        "treatment": "Control honeydew-producing insects (aphids, whiteflies, mealybugs) with appropriate insecticides. Wash affected leaf surfaces with mild soapy water.",
        "severity": "Low",
        "prevention": "Control sap-sucking insects to eliminate the honeydew substrate that sooty mold grows on.",
        "crop": "Mango",
    },

    # ── Corn ─────────────────────────────────────────────────────────────────
    "Corn_(maize)___Cercospora_leaf_spot Gray_leaf_spot": {
        "treatment": "Apply fungicides containing azoxystrobin or pyraclostrobin. Remove and destroy infected leaves. Practice strict crop rotation.",
        "severity": "Medium",
        "prevention": "Plant resistant corn varieties and rotate crops every 2–3 years.",
        "crop": "Corn",
    },
    "Corn_(maize)___Common_rust_": {
        "treatment": "Apply triazole or strobilurin fungicides at early infection stage. Scout fields regularly for early detection.",
        "severity": "Medium",
        "prevention": "Plant rust-resistant hybrids and monitor fields during warm, humid conditions.",
        "crop": "Corn",
    },
    "Corn_(maize)___Northern_Leaf_Blight": {
        "treatment": "Apply foliar fungicides (azoxystrobin, propiconazole) when lesions first appear. Destroy all crop debris after harvest.",
        "severity": "High",
        "prevention": "Use resistant varieties and avoid consecutive corn planting in the same field.",
        "crop": "Corn",
    },
    "Corn_(maize)___healthy": {
        "treatment": "No treatment needed. Continue regular monitoring.",
        "severity": "None",
        "prevention": "Maintain balanced soil nutrition and adequate plant spacing for good airflow.",
        "crop": "Corn",
    },

    # ── Pepper ────────────────────────────────────────────────────────────────
    "Pepper,_bell___Bacterial_spot": {
        "treatment": "Apply copper-based bactericides. Remove infected plant parts immediately. Avoid overhead irrigation.",
        "severity": "Medium",
        "prevention": "Use certified disease-free seeds and avoid working in wet fields.",
        "crop": "Pepper",
    },
    "Pepper,_bell___healthy": {
        "treatment": "No treatment needed. Plant is healthy.",
        "severity": "None",
        "prevention": "Maintain proper spacing and ensure good drainage to prevent future disease.",
        "crop": "Pepper",
    },

    # ── Potato ────────────────────────────────────────────────────────────────
    "Potato___Early_blight": {
        "treatment": "Apply chlorothalonil or mancozeb fungicides. Remove infected leaves. Ensure adequate potassium levels in soil.",
        "severity": "Medium",
        "prevention": "Rotate crops and apply mulch to prevent soil splash onto leaves.",
        "crop": "Potato",
    },
    "Potato___Late_blight": {
        "treatment": "Apply systemic fungicides (metalaxyl, cymoxanil) immediately. Destroy all infected plants. Do not compost infected material.",
        "severity": "High",
        "prevention": "Plant certified seed potatoes and apply preventive fungicide sprays during humid weather.",
        "crop": "Potato",
    },
    "Potato___healthy": {
        "treatment": "No treatment needed. Continue regular monitoring.",
        "severity": "None",
        "prevention": "Ensure well-drained soil and balanced fertilization for continued plant health.",
        "crop": "Potato",
    },

    # ── Tomato ───────────────────────────────────────────────────────────────
    "Tomato___Bacterial_spot": {
        "treatment": "Apply copper-based bactericides combined with mancozeb. Remove heavily infected leaves. Avoid wetting foliage during irrigation.",
        "severity": "Medium",
        "prevention": "Use disease-free transplants and switch to drip irrigation.",
        "crop": "Tomato",
    },
    "Tomato___Early_blight": {
        "treatment": "Apply chlorothalonil or copper fungicides. Remove lower infected leaves. Ensure adequate plant nutrition.",
        "severity": "Medium",
        "prevention": "Mulch soil surface and use drip irrigation to avoid leaf wetness.",
        "crop": "Tomato",
    },
    "Tomato___Late_blight": {
        "treatment": "Apply systemic fungicides (mefenoxam, cymoxanil) immediately. Destroy all infected plant material. Act fast — spreads rapidly.",
        "severity": "High",
        "prevention": "Monitor weather and apply preventive sprays before expected humid conditions.",
        "crop": "Tomato",
    },
    "Tomato___Leaf_Mold": {
        "treatment": "Improve air circulation by pruning. Apply fungicides (chlorothalonil, copper). Reduce greenhouse humidity below 85%.",
        "severity": "Medium",
        "prevention": "Prune plants for better airflow and avoid high humidity environments.",
        "crop": "Tomato",
    },
    "Tomato___Septoria_leaf_spot": {
        "treatment": "Apply fungicides (chlorothalonil, copper, or mancozeb). Remove infected lower leaves. Avoid wetting foliage during irrigation.",
        "severity": "Medium",
        "prevention": "Rotate crops and remove all plant debris after harvest.",
        "crop": "Tomato",
    },
    "Tomato___Spider_mites Two-spotted_spider_mite": {
        "treatment": "Apply miticides (abamectin, bifenazate) or insecticidal soap. Increase plant moisture — mites thrive in dry conditions. Remove heavily infested leaves.",
        "severity": "Medium",
        "prevention": "Maintain adequate irrigation and avoid dusty field conditions.",
        "crop": "Tomato",
    },
    "Tomato___Target_Spot": {
        "treatment": "Apply fungicides containing azoxystrobin or chlorothalonil. Remove affected leaves promptly.",
        "severity": "Medium",
        "prevention": "Ensure good air circulation and avoid excessive nitrogen fertilization.",
        "crop": "Tomato",
    },
    "Tomato___Tomato_mosaic_virus": {
        "treatment": "No chemical cure available. Remove and destroy infected plants immediately. Disinfect all tools with 10% bleach solution.",
        "severity": "High",
        "prevention": "Control aphid populations, use virus-resistant varieties, and wash hands before handling plants.",
        "crop": "Tomato",
    },
    "Tomato___Tomato_Yellow_Leaf_Curl_Virus": {
        "treatment": "Remove and destroy infected plants. Control whitefly vectors with insecticides (imidacloprid, thiamethoxam). Use reflective mulches to repel whiteflies.",
        "severity": "High",
        "prevention": "Use insect-proof nets in nurseries and plant whitefly-resistant varieties.",
        "crop": "Tomato",
    },
    "Tomato___healthy": {
        "treatment": "No treatment needed. Plant is in excellent condition.",
        "severity": "None",
        "prevention": "Continue regular scouting and maintain balanced soil fertility.",
        "crop": "Tomato",
    },
}


def _make_display_name(class_key: str) -> str:
    """Convert a class key to a human-readable disease name."""
    if "___" in class_key:
        # PlantVillage style: "Tomato___Early_blight" → "Tomato – Early blight"
        crop, disease = class_key.split("___", 1)
        crop    = crop.replace("_", " ").replace(",", "").strip()
        disease = disease.replace("_", " ").strip()
        return f"{crop} – {disease}"
    # Short-name style (Mango dataset): already human-readable
    return class_key


def preprocess_image(image_bytes: bytes) -> np.ndarray:
    img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    img = img.resize((224, 224))
    img_array = np.array(img, dtype=np.float32) / 255.0
    return np.expand_dims(img_array, axis=0)


CONFIDENCE_THRESHOLD = 0.60  # below this, the image likely isn't one of the trained categories


def predict_disease(image_bytes: bytes) -> dict:
    img_tensor = preprocess_image(image_bytes)
    predictions = cnn_model.predict(img_tensor, verbose=0)

    confidence = float(np.max(predictions))
    class_idx  = int(np.argmax(predictions))
    class_key  = class_names[class_idx]

    if confidence < CONFIDENCE_THRESHOLD:
        return {
            "disease":    "Unrecognized — not a supported crop/disease",
            "class_key":  None,
            "crop":       "Unknown",
            "confidence": round(confidence, 4),
            "severity":   "Unknown",
            "treatment":  "This image doesn't clearly match any of the trained disease categories (mango, corn, pepper, potato, tomato). Retake a clear, well-lit photo of a single leaf, or consult an agronomist.",
            "prevention": "Make sure the photo is a close-up of one leaf from a supported crop, in good lighting.",
            "model_used": "CNN",
        }

    info = TREATMENT_MAP.get(class_key, {
        "treatment":  "Consult an agronomist for further analysis.",
        "severity":   "Unknown",
        "prevention": "Monitor the plant closely and document all symptoms.",
        "crop":       "Unknown",
    })

    return {
        "disease":    _make_display_name(class_key),
        "class_key":  class_key,
        "crop":       info["crop"],
        "confidence": round(confidence, 4),
        "severity":   info["severity"],
        "treatment":  info["treatment"],
        "prevention": info["prevention"],
        "model_used": "CNN",
    }
