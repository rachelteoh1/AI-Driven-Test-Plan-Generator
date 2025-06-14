import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
import joblib

def train_intent_model():
    df = pd.read_csv("app/utils/intent_dataset_full.csv")

    X = df["text"]
    y = df["intent"]

    vectorizer = TfidfVectorizer()
    X_train = vectorizer.fit_transform(X)

    clf = LogisticRegression()
    clf.fit(X_train, y)

    joblib.dump((vectorizer, clf), "app/utils/intent_model.joblib")

def classify_intent_ml(text: str, threshold: float = 0.6) -> str:
    vectorizer, clf = joblib.load("app/utils/intent_model.joblib")
    X = vectorizer.transform([text])
    proba = clf.predict_proba(X)[0]
    top_intent_index = proba.argmax()
    confidence = proba[top_intent_index]

    if confidence < threshold:
        return "unknown"
    return clf.classes_[top_intent_index]
