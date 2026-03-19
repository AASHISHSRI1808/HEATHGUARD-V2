"""
Health Guard - Model Training Script
Run this script to train and save all disease prediction models.

Requirements:
pip install scikit-learn xgboost pandas numpy

Datasets needed (from UCI / Kaggle):
- heart.csv (Heart Disease Dataset)
- liver.csv (ILPD - Indian Liver Patient Dataset)
- parkinson.csv (Parkinson's Disease Dataset)
"""

import pickle
import numpy as np
import os

MODEL_DIR = os.path.join(os.path.dirname(__file__), 'saved_models')
os.makedirs(MODEL_DIR, exist_ok=True)

# ============ HEART DISEASE - Random Forest ============
def train_heart_model():
    try:
        import pandas as pd
        from sklearn.ensemble import RandomForestClassifier
        from sklearn.model_selection import train_test_split
        from sklearn.preprocessing import StandardScaler

        df = pd.read_csv('datasets/heart.csv')
        X = df.drop('target', axis=1)
        y = df['target']

        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

        model = RandomForestClassifier(n_estimators=100, random_state=42)
        model.fit(X_train, y_train)

        score = model.score(X_test, y_test)
        print(f"✅ Heart Model Accuracy: {score:.4f}")

        with open(os.path.join(MODEL_DIR, 'heart_model.pkl'), 'wb') as f:
            pickle.dump(model, f)
        print("💾 Heart model saved!")

    except Exception as e:
        print(f"❌ Heart model training error: {e}")

# ============ LIVER DISEASE - XGBoost ============
def train_liver_model():
    try:
        import pandas as pd
        from xgboost import XGBClassifier
        from sklearn.model_selection import train_test_split
        from sklearn.preprocessing import LabelEncoder

        df = pd.read_csv('datasets/liver.csv')
        df.fillna(df.mean(numeric_only=True), inplace=True)

        le = LabelEncoder()
        if 'Gender' in df.columns:
            df['Gender'] = le.fit_transform(df['Gender'])

        X = df.drop('Dataset', axis=1) if 'Dataset' in df.columns else df.drop('Result', axis=1)
        y = df['Dataset'] if 'Dataset' in df.columns else df['Result']
        y = (y == 1).astype(int)

        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

        model = XGBClassifier(n_estimators=100, random_state=42, eval_metric='logloss')
        model.fit(X_train, y_train)

        score = model.score(X_test, y_test)
        print(f"✅ Liver Model Accuracy: {score:.4f}")

        with open(os.path.join(MODEL_DIR, 'liver_model.pkl'), 'wb') as f:
            pickle.dump(model, f)
        print("💾 Liver model saved!")

    except Exception as e:
        print(f"❌ Liver model training error: {e}")

# ============ PARKINSON'S - SVM ============
def train_parkinson_model():
    try:
        import pandas as pd
        from sklearn.svm import SVC
        from sklearn.model_selection import train_test_split
        from sklearn.preprocessing import StandardScaler

        df = pd.read_csv('datasets/parkinson.csv')
        if 'name' in df.columns:
            df = df.drop('name', axis=1)

        X = df.drop('status', axis=1)
        y = df['status']

        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

        scaler = StandardScaler()
        X_train = scaler.fit_transform(X_train)
        X_test = scaler.transform(X_test)

        from sklearn.pipeline import Pipeline
        model = Pipeline([
            ('scaler', StandardScaler()),
            ('svm', SVC(kernel='rbf', probability=True, random_state=42))
        ])

        df_X = df.drop('status', axis=1)
        X_train2, X_test2, y_train2, y_test2 = train_test_split(df_X, y, test_size=0.2, random_state=42)
        model.fit(X_train2, y_train2)

        score = model.score(X_test2, y_test2)
        print(f"✅ Parkinson Model Accuracy: {score:.4f}")

        with open(os.path.join(MODEL_DIR, 'parkinson_model.pkl'), 'wb') as f:
            pickle.dump(model, f)
        print("💾 Parkinson model saved!")

    except Exception as e:
        print(f"❌ Parkinson model training error: {e}")

if __name__ == '__main__':
    print("🚀 Starting Health Guard Model Training...")
    print("=" * 50)
    train_heart_model()
    print("=" * 50)
    train_liver_model()
    print("=" * 50)
    train_parkinson_model()
    print("=" * 50)
    print("✅ All models trained and saved!")
