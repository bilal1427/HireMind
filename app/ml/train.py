"""
Model training for ML pipeline.
Job role prediction model training.
"""

import json
from pathlib import Path
from typing import Optional
from datetime import datetime

import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import classification_report, accuracy_score
import joblib

from app.ml.preprocessing import preprocess_text
from app.ml.feature_engineering import FeatureEngineer, get_feature_engineer


# Model storage path
MODELS_DIR = Path(__file__).parent / "models"
ARTIFACTS_DIR = Path(__file__).parent / "artifacts"
MODELS_DIR.mkdir(exist_ok=True)
ARTIFACTS_DIR.mkdir(exist_ok=True)


# Job role categories for prediction
JOB_ROLES = [
    "Java Backend Developer",
    "Frontend Developer",
    "Full Stack Developer",
    "Python Developer",
    "Data Analyst",
    "Data Scientist",
    "ML Engineer",
    "DevOps Engineer",
    "Mobile Developer",
    "Cloud Engineer",
]


class ModelTrainer:
    """Train ML models for job role prediction."""

    def __init__(self, model_dir: Path = MODELS_DIR):
        """Initialize trainer."""
        self.model_dir = model_dir
        self.feature_engineer = get_feature_engineer()
        self.model: Optional[RandomForestClassifier] = None
        self.model_metadata: dict = {}

    def train_job_role_model(
        self,
        skills_list: list[list[str]],
        titles: list[str],
        test_size: float = 0.2,
        random_state: int = 42,
    ) -> dict:
        """
        Train a job role prediction model.

        Args:
            skills_list: List of skill lists for each sample
            titles: Job titles (labels)
            test_size: Fraction for testing
            random_state: Random seed

        Returns:
            Training metrics
        """
        # Normalize titles to categories
        y = self._normalize_titles(titles)

        # Create skill vectors
        X = np.array([
            self.feature_engineer.create_skill_vector(skills)
            for skills in skills_list
        ])

        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=test_size, random_state=random_state, stratify=y
        )

        # Train model
        self.model = RandomForestClassifier(
            n_estimators=100,
            max_depth=10,
            min_samples_split=5,
            min_samples_leaf=2,
            random_state=random_state,
            n_jobs=-1,
        )
        self.model.fit(X_train, y_train)

        # Evaluate
        y_pred = self.model.predict(X_test)
        accuracy = accuracy_score(y_test, y_pred)

        # Cross-validation
        cv_scores = cross_val_score(self.model, X, y, cv=5)

        # Store metadata
        self.model_metadata = {
            "model_type": "RandomForestClassifier",
            "trained_at": datetime.utcnow().isoformat(),
            "n_samples": len(skills_list),
            "n_features": X.shape[1],
            "accuracy": float(accuracy),
            "cv_mean": float(cv_scores.mean()),
            "cv_std": float(cv_scores.std()),
            "classes": list(self.model.classes_),
            "params": {
                "n_estimators": 100,
                "max_depth": 10,
            },
        }

        return {
            "accuracy": accuracy,
            "cv_mean": cv_scores.mean(),
            "cv_std": cv_scores.std(),
            "classification_report": classification_report(y_test, y_pred, output_dict=True),
        }

    def save_model(self, name: str = "job_role_predictor") -> Path:
        """
        Save trained model to disk.

        Args:
            name: Model name

        Returns:
            Path to saved model
        """
        if self.model is None:
            raise ValueError("No model to save. Train a model first.")

        model_path = self.model_dir / f"{name}.joblib"
        metadata_path = self.model_dir / f"{name}_metadata.json"

        # Save model
        joblib.dump(self.model, model_path)

        # Save metadata
        with open(metadata_path, "w") as f:
            json.dump(self.model_metadata, f, indent=2)

        # Save known skills
        skills_path = ARTIFACTS_DIR / "known_skills.json"
        with open(skills_path, "w") as f:
            json.dump(self.feature_engineer.known_skills, f, indent=2)

        return model_path

    def load_model(self, name: str = "job_role_predictor") -> None:
        """
        Load a trained model from disk.

        Args:
            name: Model name
        """
        model_path = self.model_dir / f"{name}.joblib"
        metadata_path = self.model_dir / f"{name}_metadata.json"

        if not model_path.exists():
            raise FileNotFoundError(f"Model not found: {model_path}")

        self.model = joblib.load(model_path)

        if metadata_path.exists():
            with open(metadata_path, "r") as f:
                self.model_metadata = json.load(f)

    def _normalize_titles(self, titles: list[str]) -> list[str]:
        """
        Normalize job titles to standard categories.

        Args:
            titles: Raw job titles

        Returns:
            Normalized categories
        """
        normalized = []
        for title in titles:
            title_lower = title.lower()

            if "java" in title_lower and ("backend" in title_lower or "server" in title_lower):
                normalized.append("Java Backend Developer")
            elif "frontend" in title_lower or "front-end" in title_lower or "react" in title_lower:
                normalized.append("Frontend Developer")
            elif "full stack" in title_lower or "fullstack" in title_lower:
                normalized.append("Full Stack Developer")
            elif "python" in title_lower:
                normalized.append("Python Developer")
            elif "data scientist" in title_lower:
                normalized.append("Data Scientist")
            elif "ml" in title_lower or "machine learning" in title_lower:
                normalized.append("ML Engineer")
            elif "data analyst" in title_lower:
                normalized.append("Data Analyst")
            elif "devops" in title_lower or "sre" in title_lower:
                normalized.append("DevOps Engineer")
            elif "mobile" in title_lower or "android" in title_lower or "ios" in title_lower:
                normalized.append("Mobile Developer")
            elif "cloud" in title_lower or "aws" in title_lower or "azure" in title_lower:
                normalized.append("Cloud Engineer")
            else:
                # Default to most common
                normalized.append("Full Stack Developer")

        return normalized


def train_job_role_model(
    skills_list: list[list[str]],
    titles: list[str],
    save: bool = True,
) -> dict:
    """
    Convenience function to train job role model.

    Args:
        skills_list: List of skill lists
        titles: Job titles
        save: Whether to save model

    Returns:
        Training metrics
    """
    trainer = ModelTrainer()
    metrics = trainer.train_job_role_model(skills_list, titles)

    if save:
        trainer.save_model()

    return metrics
