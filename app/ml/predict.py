"""
Job role prediction for ML pipeline.
"""

import json
from pathlib import Path
from typing import Optional
from datetime import datetime

import numpy as np
from sklearn.ensemble import RandomForestClassifier
import joblib

from app.ml.feature_engineering import get_feature_engineer
from app.utils.skill_normalizer import normalize_skill


# Model paths
MODELS_DIR = Path(__file__).parent / "models"


class JobRolePredictor:
    """Predict job roles from skills."""

    def __init__(self, model_path: Optional[Path] = None):
        """
        Initialize predictor.

        Args:
            model_path: Optional path to model file
        """
        self.feature_engineer = get_feature_engineer()
        self.model: Optional[RandomForestClassifier] = None
        self.model_metadata: dict = {}
        self.model_loaded = False

        if model_path:
            self.load_model(model_path)
        else:
            # Try to load default model
            default_path = MODELS_DIR / "job_role_predictor.joblib"
            if default_path.exists():
                self.load_model(default_path)

    def load_model(self, model_path: Path) -> None:
        """
        Load a trained model.

        Args:
            model_path: Path to model file
        """
        if not model_path.exists():
            raise FileNotFoundError(f"Model not found: {model_path}")

        self.model = joblib.load(model_path)
        self.model_loaded = True

        # Load metadata if exists
        metadata_path = model_path.with_suffix(".json").with_name(
            model_path.stem + "_metadata.json"
        )
        if metadata_path.exists():
            with open(metadata_path, "r") as f:
                self.model_metadata = json.load(f)

    def predict(self, skills: list[str]) -> dict:
        """
        Predict job role from skills.

        Args:
            skills: List of skill names

        Returns:
            Prediction result with confidence
        """
        if not self.model_loaded or self.model is None:
            return self._heuristic_prediction(skills)

        # Normalize skills
        normalized = [normalize_skill(s) for s in skills if s]

        # Create feature vector
        features = self.feature_engineer.create_skill_vector(normalized)
        X = features.reshape(1, -1)

        # Predict
        prediction = self.model.predict(X)[0]

        # Get probabilities
        probabilities = self.model.predict_proba(X)[0]
        classes = self.model.classes_

        # Top predictions
        top_indices = np.argsort(probabilities)[::-1][:3]
        top_predictions = [
            {
                "role": classes[i],
                "confidence": float(probabilities[i]),
            }
            for i in top_indices
        ]

        return {
            "predicted_role": prediction,
            "confidence": float(probabilities[classes.tolist().index(prediction)]),
            "top_predictions": top_predictions,
            "method": "ml_model",
            "model_version": self.model_metadata.get("model_version", "unknown"),
        }

    def _heuristic_prediction(self, skills: list[str]) -> dict:
        """
        Heuristic job role prediction when no model is available.

        Args:
            skills: List of skill names

        Returns:
            Prediction result
        """
        skills_lower = [s.lower() for s in skills]

        # Score each role based on skill matching
        role_scores = {
            "Java Backend Developer": 0.0,
            "Frontend Developer": 0.0,
            "Full Stack Developer": 0.0,
            "Python Developer": 0.0,
            "Data Analyst": 0.0,
            "Data Scientist": 0.0,
            "ML Engineer": 0.0,
            "DevOps Engineer": 0.0,
            "Mobile Developer": 0.0,
            "Cloud Engineer": 0.0,
        }

        # Java Backend
        if "java" in skills_lower:
            role_scores["Java Backend Developer"] += 3
        if "spring" in skills_lower or "spring boot" in skills_lower:
            role_scores["Java Backend Developer"] += 2
        if "hibernate" in skills_lower:
            role_scores["Java Backend Developer"] += 1

        # Frontend
        if "react" in skills_lower or "vue" in skills_lower or "angular" in skills_lower:
            role_scores["Frontend Developer"] += 3
        if "javascript" in skills_lower or "typescript" in skills_lower:
            role_scores["Frontend Developer"] += 2
        if "css" in skills_lower or "html" in skills_lower:
            role_scores["Frontend Developer"] += 1

        # Python
        if "python" in skills_lower:
            role_scores["Python Developer"] += 3
        if "django" in skills_lower or "flask" in skills_lower or "fastapi" in skills_lower:
            role_scores["Python Developer"] += 2

        # Data/ML
        if "pandas" in skills_lower or "numpy" in skills_lower:
            role_scores["Data Analyst"] += 2
            role_scores["Data Scientist"] += 1
        if "machine learning" in skills_lower or "tensorflow" in skills_lower or "pytorch" in skills_lower:
            role_scores["ML Engineer"] += 3
            role_scores["Data Scientist"] += 2
        if "scikit-learn" in skills_lower:
            role_scores["ML Engineer"] += 2

        # DevOps
        if "docker" in skills_lower or "kubernetes" in skills_lower:
            role_scores["DevOps Engineer"] += 3
        if "jenkins" in skills_lower or "terraform" in skills_lower:
            role_scores["DevOps Engineer"] += 2
        if "ci/cd" in skills_lower:
            role_scores["DevOps Engineer"] += 1

        # Cloud
        if "aws" in skills_lower or "azure" in skills_lower or "gcp" in skills_lower:
            role_scores["Cloud Engineer"] += 3

        # Mobile
        if "react native" in skills_lower or "flutter" in skills_lower:
            role_scores["Mobile Developer"] += 3
        if "android" in skills_lower or "ios" in skills_lower or "swift" in skills_lower:
            role_scores["Mobile Developer"] += 2

        # Full Stack (combination)
        frontend_skills = sum(1 for s in skills_lower if s in ["react", "vue", "angular", "javascript", "typescript"])
        backend_skills = sum(1 for s in skills_lower if s in ["python", "java", "node.js", "django", "fastapi", "spring"])
        if frontend_skills >= 2 and backend_skills >= 2:
            role_scores["Full Stack Developer"] += 4

        # Get top prediction
        top_role = max(role_scores, key=role_scores.get)
        top_score = role_scores[top_role]

        # Normalize scores to probabilities
        total_score = sum(max(s, 0) for s in role_scores.values())
        confidence = top_score / max(total_score, 1)

        # Get top 3 predictions
        sorted_roles = sorted(role_scores.items(), key=lambda x: x[1], reverse=True)[:3]
        top_predictions = [
            {
                "role": role,
                "confidence": score / max(total_score, 1),
            }
            for role, score in sorted_roles
        ]

        return {
            "predicted_role": top_role,
            "confidence": round(confidence, 3),
            "top_predictions": top_predictions,
            "method": "heuristic",
            "model_version": "heuristic_v1",
            "note": "No ML model loaded. Using heuristic scoring. Train a model for better predictions.",
        }


# Singleton instance
_predictor: Optional[JobRolePredictor] = None


def get_job_role_predictor() -> JobRolePredictor:
    """Get the singleton job role predictor instance."""
    global _predictor
    if _predictor is None:
        _predictor = JobRolePredictor()
    return _predictor


def predict_job_role(skills: list[str]) -> dict:
    """Convenience function to predict job role."""
    return get_job_role_predictor().predict(skills)
