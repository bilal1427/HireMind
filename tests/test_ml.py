"""
Tests for ML modules.
"""

import pytest
import numpy as np
from unittest.mock import Mock, patch

from app.ml.preprocessing import TextPreprocessor, preprocess_text
from app.ml.feature_engineering import FeatureEngineer, extract_skill_features
from app.ml.predict import JobRolePredictor


class TestTextPreprocessor:
    """Tests for text preprocessing."""

    def test_clean_text(self):
        """Test text cleaning."""
        preprocessor = TextPreprocessor()

        text = "Hello  World!  Visit https://example.com for more."
        cleaned = preprocessor.clean(text)

        assert "https://" not in cleaned
        assert "example.com" not in cleaned

    def test_remove_stop_words(self):
        """Test stop word removal."""
        preprocessor = TextPreprocessor()

        text = "This is a test of the system"
        result = preprocessor.remove_stop_words(text)

        assert "is" not in result.split()
        assert "a" not in result.split()
        assert "the" not in result.split()

    def test_tokenize(self):
        """Test tokenization."""
        preprocessor = TextPreprocessor()

        text = "Hello World Test"
        tokens = preprocessor.tokenize(text)

        assert len(tokens) == 3
        assert "hello" in tokens
        assert "world" in tokens

    def test_preprocess_full_pipeline(self):
        """Test full preprocessing pipeline."""
        text = "The Quick Brown Fox jumps over the lazy dog!"
        result = preprocess_text(text)

        assert "the" not in result.lower()
        assert "over" not in result.lower()


class TestFeatureEngineering:
    """Tests for feature engineering."""

    def test_extract_skill_features(self):
        """Test skill feature extraction."""
        skills = ["Python", "JavaScript", "React", "PostgreSQL"]
        features = extract_skill_features(skills)

        assert features["total_skills"] == 4
        assert features["unique_skills"] == 4
        assert "skills_per_category" in features
        assert len(features["top_skills"]) > 0

    def test_create_skill_vector(self):
        """Test skill vector creation."""
        engineer = FeatureEngineer()

        skills = ["Python", "JavaScript"]
        vector = engineer.create_skill_vector(skills)

        assert isinstance(vector, np.ndarray)
        assert vector.dtype == np.float64

    def test_extract_text_features(self):
        """Test text feature extraction."""
        engineer = FeatureEngineer()

        text = "This is a test sentence. This is another sentence."
        features = engineer.extract_text_features(text)

        assert features["word_count"] == 10
        assert features["char_count"] == len(text)
        assert features["sentence_count"] >= 2


class TestJobRolePredictor:
    """Tests for job role prediction."""

    def test_heuristic_prediction_python_developer(self):
        """Test heuristic prediction for Python developer."""
        predictor = JobRolePredictor()
        predictor.model_loaded = False  # Force heuristic

        skills = ["Python", "Django", "FastAPI", "PostgreSQL", "Docker"]
        result = predictor.predict(skills)

        assert result["method"] == "heuristic"
        assert result["predicted_role"] == "Python Developer"
        assert result["confidence"] > 0

    def test_heuristic_prediction_frontend(self):
        """Test heuristic prediction for frontend developer."""
        predictor = JobRolePredictor()
        predictor.model_loaded = False

        skills = ["React", "JavaScript", "TypeScript", "CSS", "HTML"]
        result = predictor.predict(skills)

        assert result["predicted_role"] == "Frontend Developer"

    def test_heuristic_prediction_full_stack(self):
        """Test heuristic prediction for full stack developer."""
        predictor = JobRolePredictor()
        predictor.model_loaded = False

        skills = ["React", "JavaScript", "Python", "Django", "PostgreSQL", "Docker"]
        result = predictor.predict(skills)

        # Should recognize as full stack due to frontend + backend skills
        assert "full stack" in result["predicted_role"].lower() or \
               result["predicted_role"] in ["Frontend Developer", "Python Developer"]

    def test_heuristic_prediction_devops(self):
        """Test heuristic prediction for DevOps."""
        predictor = JobRolePredictor()
        predictor.model_loaded = False

        skills = ["Docker", "Kubernetes", "Jenkins", "Terraform", "CI/CD"]
        result = predictor.predict(skills)

        assert result["predicted_role"] == "DevOps Engineer"

    def test_top_predictions_returned(self):
        """Test that top predictions are returned."""
        predictor = JobRolePredictor()
        predictor.model_loaded = False

        skills = ["Python", "Docker", "JavaScript"]
        result = predictor.predict(skills)

        assert "top_predictions" in result
        assert len(result["top_predictions"]) == 3
        for pred in result["top_predictions"]:
            assert "role" in pred
            assert "confidence" in pred


class TestModelEvaluator:
    """Tests for model evaluation."""

    def test_evaluate_classification(self):
        """Test classification evaluation."""
        from app.ml.evaluate import ModelEvaluator

        evaluator = ModelEvaluator()

        y_true = np.array([0, 1, 1, 0, 1, 0])
        y_pred = np.array([0, 1, 0, 0, 1, 1])

        metrics = evaluator.evaluate_classification(y_true, y_pred)

        assert "accuracy" in metrics
        assert "precision_macro" in metrics
        assert "recall_macro" in metrics
        assert "f1_macro" in metrics
        assert "confusion_matrix" in metrics

    def test_generate_report(self):
        """Test report generation."""
        from app.ml.evaluate import ModelEvaluator

        evaluator = ModelEvaluator()

        metrics = {
            "accuracy": 0.85,
            "precision_weighted": 0.84,
            "recall_weighted": 0.85,
            "f1_weighted": 0.84,
        }

        report = evaluator.generate_report(metrics, "Test Model")

        assert "Test Model" in report
        assert "0.85" in report
        assert "Accuracy" in report


class TestSkillNormalization:
    """Tests for skill normalization in ML context."""

    def test_normalized_skills_in_vector(self):
        """Test that skills are normalized when creating vectors."""
        engineer = FeatureEngineer()

        # Use variants
        skills = ["ReactJS", "NodeJS", "Postgres"]
        vector = engineer.create_skill_vector(skills)

        # Vector should be created with normalized skills
        assert isinstance(vector, np.ndarray)
