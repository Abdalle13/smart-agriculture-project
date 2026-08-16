import json
import io
import os
import asyncio
import numpy as np
from pathlib import Path
from PIL import Image
import tensorflow as tf
from dotenv import load_dotenv
from google import genai

# Load environment variables from .env
load_dotenv()

# ── Gemini Client
_gemini_key = os.getenv("GEMINI_API_KEY", "")
try:
    from google import genai
    _gemini_client = genai.Client(api_key=_gemini_key) if _gemini_key else None
except Exception as e:
    print(f"Warning: Could not initialize Gemini Client: {e}")
    _gemini_client = None

BASE_DIR = Path(__file__).resolve().parent.parent
MODEL_DIR = BASE_DIR / "models"

# ── Load CNN model once at startup
cnn_model = tf.keras.models.load_model(MODEL_DIR / "cnn_best.keras")

with open(MODEL_DIR / "class_names.json") as f:
    data = json.load(f)
    class_names = data["class_names"]

with open(MODEL_DIR / "fallback_advice.json", encoding="utf-8") as f:
    _advice_data = json.load(f)
    _GENERIC_FALLBACK = _advice_data["generic_fallback"]
    FALLBACK_ADVICE = _advice_data["fallback_advice"]

# ── Warm-up: run a dummy prediction so the first real request is instant ───
_dummy = np.zeros((1, 224, 224, 3), dtype=np.float32)
cnn_model.predict(_dummy, verbose=0)
print("CNN model warmed up — first prediction will be instant.")

CONFIDENCE_THRESHOLD = 0.60

# Returned when the image is clearly NOT a plant (person, car, food, animal, etc.)
_NOT_A_PLANT = {
    "disease":    "Sawirka aad sogalisay ma ahan caleen geed",
    "class_key":  None,
    "crop":       "Unknown",
    "severity":   "Unknown",
    "treatment":  "Nidaamkan waxaa loogu talagalay caleen dhirta oo keliya. Sawirka aad gelisay wuxuu u muuqdaa inuu yahay qof, xayawaan, ama shay kale  ma ahan caleen geed ah.",
    "prevention": "Fadlan sawir hal caleen oo dhirta beertaada ka mid ah oo kaamirada u dhowee. Nidaamku si toos ah ayuu u ogaanayaa haddii cudur jiro iyo in kale.",
    "model_used": "CNN (MobileNetV2)",
}

# Returned when image looks like a plant but model can't classify it (low confidence)
_UNRECOGNIZED = {
    "disease":    "Sawirka lama garan karo",
    "class_key":  None,
    "crop":       "Unknown",
    "severity":   "Unknown",
    "treatment":  "Modelku ma garanin sawirkan. Sababtu waxay noqon kartaa: sawirku wuxuu muujinayaa geed dhan ama wax aan la xiriirin cudurrada caleemaha. Modelku wuxuu u baahan yahay sawir cad oo HAL CALEEN ah.",
    "prevention": "Sida sawir fiican loo qaado: Ka dooro hal caleen oo dhibaatada muujinaysa, kaamirada u soo dhowee (5–15 cm), hubi in iftiinku fiican yahay (hadhka, ma aha qorraxda tooska ah), oo caleentu ha buuxiso sawirka.",
    "model_used": "CNN (MobileNetV2)",
}


# ── Image preprocessing (combined: validate + resize in one PIL open) ──────
def preprocess_and_validate(image_bytes: bytes) -> tuple[np.ndarray | None, bool]:
    """
    Open image once, check green ratio, and return preprocessed tensor.
    Returns (tensor, is_plant). Avoids opening the image twice.
    """
    img = Image.open(io.BytesIO(image_bytes)).convert("RGB")

    # Green ratio check on small thumbnail (fast)
    thumb = img.resize((64, 64))
    arr_small = np.array(thumb, dtype=np.float32)
    R, G, B = arr_small[:, :, 0], arr_small[:, :, 1], arr_small[:, :, 2]
    green_dominant = np.sum((G > R + 10) & (G > B + 10))
    green_ratio = green_dominant / (arr_small.shape[0] * arr_small.shape[1])

    if green_ratio < 0.08:
        return None, False

    # Reuse same PIL image for model input (no second file open)
    img_resized = img.resize((224, 224))
    img_array = np.array(img_resized, dtype=np.float32) / 255.0
    tensor = np.expand_dims(img_array, axis=0)
    return tensor, True


def _extract_crop_and_disease(class_key: str) -> tuple[str, str]:
    """Parse crop name and disease display name from dataset class key."""
    if "___" in class_key:
        crop_part, disease_part = class_key.split("___", 1)
        crop_name = crop_part.replace("_", " ").strip()
        if disease_part.lower() == "healthy":
            disease_name = f"{crop_name} Healthy (Caafimaad qaba)"
        else:
            disease_name = f"{crop_name} {disease_part.replace('_', ' ').strip()}"
        return crop_name, disease_name
    else:
        crop_name = "Mango"
        if class_key.lower() == "healthy":
            disease_name = "Mango Healthy (Caafimaad qaba)"
        else:
            disease_name = f"Mango {class_key}"
        return crop_name, disease_name



# Backend (Node.js) gives the whole /predict request 75s total — cap Gemini
# under that so a slow response still leaves room for a fallback + reply.
GEMINI_TIMEOUT_SECONDS = 30


async def get_ai_recommendation_async(disease_name: str, crop: str, class_key: str) -> dict:
    """
    Async Gemini call — runs in a thread pool so it doesn't block the event loop.
    Falls back to a static Somali lookup (FALLBACK_ADVICE) when Gemini is slow,
    unavailable, or the client wasn't configured, so the farmer never sees null.
    """
    if _gemini_client is None:
        return FALLBACK_ADVICE.get(class_key, _GENERIC_FALLBACK)

    prompt = f"""Adiga oo ah khabiir beeraleyda ka caawiya cudurrada dalagga, beeralahe Soomaali ah oo ku nool Afgoye ayaa kuu yimid.
Wuxuu ku sheegay in beertiisa uu ku ogaaday cudur la yiraahdo: {disease_name}, geedkuna waa {crop}.

Af-Soomaali fudud, caadi ah oo la fahmi karo ku qor labadan wax (HA ISTICMAALIN EMOJI):

1. DAAWEYNTA: Sida loo daaweeyo. Haddii daawo ama kemiko lagu buufo loo baahdo, sheeg magaceeda saxda ah si beeralayhu suuqa ugu weydiin karo. Ka dib sharax si fudud sida loo isticmaalo.

2. KAHORTAGGA: Tallaabooyinka fudud ee uu beeralayhu samayn karo si uu mustaqbalka uga hortaggo in cudurkan dib u yimaado.

Jawaabta JSON format oo keliya soo celi, sidan:
{{
  "treatment": "...",
  "prevention": "..."
}}

Xusuusnow: Beeralayhu waa qof da weyn oo aan waxbarasho badan lahayn. Ereyada fudud ee maalinlaha ah isticmaal, ha isticmaalin emoji ama calaamado."""

    def _call_gemini():
        try:
            response = _gemini_client.models.generate_content(
                model="gemini-3.1-flash-lite",
                contents=prompt,
            )
            text = response.text.strip()
            if "```json" in text:
                text = text.split("```json")[1].split("```")[0].strip()
            elif "```" in text:
                text = text.split("```")[1].split("```")[0].strip()
            parsed = json.loads(text)
            return {
                "treatment":  parsed.get("treatment", "Hada daaweynta lama soo saari karin."),
                "prevention": parsed.get("prevention", "Hada kahortagga lama soo saari karin."),
            }
        except Exception as e:
            print(f"Gemini advisory error: {e}")
            return FALLBACK_ADVICE.get(class_key, _GENERIC_FALLBACK)

    # Run synchronous Gemini SDK call in a thread so FastAPI stays non-blocking.
    # Cap the wait so a slow/hanging Gemini call can't eat the whole request —
    # the Node backend only waits 75s total for /predict, so give up on Gemini
    # well before that and use the static fallback instead.
    loop = asyncio.get_event_loop()
    try:
        return await asyncio.wait_for(
            loop.run_in_executor(None, _call_gemini),
            timeout=GEMINI_TIMEOUT_SECONDS,
        )
    except asyncio.TimeoutError:
        print(f"Gemini advisory timeout after {GEMINI_TIMEOUT_SECONDS}s")
        return FALLBACK_ADVICE.get(class_key, _GENERIC_FALLBACK)


async def predict_disease(image_bytes: bytes) -> dict:
    """
    1. Validate leaf image + preprocess in ONE pass (faster)
    2. Classify with CNN (warm model = instant)
    3. Kick off Gemini async so nothing blocks
    """
    # Step 1: Validate + preprocess in a single image open
    tensor, is_plant = preprocess_and_validate(image_bytes)

    # Image is clearly NOT a plant (person, object, animal, etc.)
    if not is_plant:
        return {**_NOT_A_PLANT, "confidence": 0.0}

    # Step 2: CNN inference (warm model — ~50–100 ms)
    predictions = cnn_model.predict(tensor, verbose=0)
    confidence = float(np.max(predictions))
    class_idx  = int(np.argmax(predictions))
    class_key  = class_names[class_idx]

    if confidence < CONFIDENCE_THRESHOLD:
        return {**_UNRECOGNIZED, "confidence": round(confidence, 4)}

    # Step 3: Parse names
    crop_name, disease_display_name = _extract_crop_and_disease(class_key)

    # Step 4: Severity
    if "healthy" in class_key.lower():
        severity = "None"
    elif any(term in class_key.lower() for term in ["canker", "blight", "virus", "die_back", "anthracnose"]):
        severity = "High"
    else:
        severity = "Medium"

    # Step 5: AI advice (async — doesn't block)
    if "healthy" in class_key.lower():
        ai_advice = {
            "treatment":  "Geedku waa caafimaad qabaa, wax daawo ah ma u baahna.",
            "prevention": "Waraabka iyo nafaqada carada si caadi ah u sii wad oo beerta ka war hay.",
        }
    else:
        ai_advice = await get_ai_recommendation_async(
            disease_name=disease_display_name,
            crop=crop_name,
            class_key=class_key,
        )

    return {
        "disease":        disease_display_name,
        "class_key":      class_key,
        "crop":           crop_name,
        "confidence":     round(confidence, 4),
        "severity":       severity,
        "treatment":      ai_advice["treatment"],
        "prevention":     ai_advice["prevention"],
        "model_used":     "CNN (MobileNetV2)",
        "model_accuracy": "97.92%",
    }
