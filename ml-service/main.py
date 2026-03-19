from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Any, Dict
import pickle
import numpy as np
import os

app = FastAPI(title="Health Guard ML Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load trained models
models = {}
MODEL_DIR = os.path.join(os.path.dirname(__file__), 'saved_models')

def load_models():
    model_files = {
        'heart': 'heart_model.pkl',
        'liver': 'liver_model.pkl',
        'parkinson': 'parkinson_model.pkl'
    }
    for disease, filename in model_files.items():
        filepath = os.path.join(MODEL_DIR, filename)
        if os.path.exists(filepath):
            with open(filepath, 'rb') as f:
                models[disease] = pickle.load(f)
                print(f"✅ Loaded {disease} model")
        else:
            print(f"⚠️ Model file not found: {filepath}")

load_models()

class PredictionRequest(BaseModel):
    disease: str
    data: Dict[str, Any]

HEART_FEATURES = ['age', 'sex', 'cp', 'trestbps', 'chol', 'fbs', 'restecg', 'thalach', 'exang', 'oldpeak', 'slope', 'ca', 'thal']
LIVER_FEATURES = ['Age', 'Gender', 'Total_Bilirubin', 'Direct_Bilirubin', 'Alkaline_Phosphotase', 'Alamine_Aminotransferase', 'Aspartate_Aminotransferase', 'Total_Protiens', 'Albumin', 'Albumin_and_Globulin_Ratio']
PARKINSON_FEATURES = ['MDVP:Fo(Hz)', 'MDVP:Fhi(Hz)', 'MDVP:Flo(Hz)', 'MDVP:Jitter(%)', 'MDVP:Jitter(Abs)', 'MDVP:RAP', 'MDVP:PPQ', 'Jitter:DDP', 'MDVP:Shimmer', 'MDVP:Shimmer(dB)', 'Shimmer:APQ3', 'Shimmer:APQ5', 'MDVP:APQ', 'Shimmer:DDA', 'NHR', 'HNR', 'RPDE', 'DFA', 'spread1', 'spread2', 'D2', 'PPE']

FEATURE_MAP = {
    'heart': HEART_FEATURES,
    'liver': LIVER_FEATURES,
    'parkinson': PARKINSON_FEATURES
}

def get_risk_level(probability: float) -> str:
    if probability >= 75:
        return "Very High"
    elif probability >= 55:
        return "High"
    elif probability >= 35:
        return "Moderate"
    else:
        return "Low"

@app.get("/")
def root():
    return {"status": "Health Guard ML Service Running", "models_loaded": list(models.keys())}

@app.get("/health")
def health():
    return {"status": "OK"}

@app.post("/predict")
async def predict(request: PredictionRequest):
    disease = request.disease.lower()
    
    if disease not in ['heart', 'liver', 'parkinson']:
        raise HTTPException(status_code=400, detail="Invalid disease type. Choose: heart, liver, parkinson")
    
    if disease not in models:
        # Return demo prediction if model not loaded
        import random
        prob = random.uniform(0.15, 0.85)
        return {
            "prediction": "Positive" if prob > 0.5 else "Negative",
            "probability": round(prob * 100, 1),
            "risk_level": get_risk_level(prob * 100),
            "note": "Demo mode - model not loaded"
        }
    
    try:
        features = FEATURE_MAP[disease]
        input_data = [float(request.data.get(f, 0)) for f in features]
        input_array = np.array(input_data).reshape(1, -1)
        
        model = models[disease]
        prediction = model.predict(input_array)[0]
        
        if hasattr(model, 'predict_proba'):
            prob_array = model.predict_proba(input_array)[0]
            probability = float(max(prob_array) * 100)
        else:
            probability = 75.0 if prediction == 1 else 25.0
        
        pred_label = "Positive" if prediction == 1 else "Negative"
        
        return {
            "prediction": pred_label,
            "probability": round(probability, 1),
            "risk_level": get_risk_level(probability)
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")

@app.get("/models")
def list_models():
    return {"loaded_models": list(models.keys()), "available_diseases": ["heart", "liver", "parkinson"]}
