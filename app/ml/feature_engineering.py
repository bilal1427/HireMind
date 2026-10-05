"""
Feature engineering for ML pipeline.
"""

import json
from typing import Optional
from collections import Counter
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.preprocessing import MultiLabelBinarizer

from app.ml.preprocessing import preprocess_text
from app.utils.skill_normalizer import normalize_skill, SKILL_CATEGORIES


class FeatureEngineer:
    """Extract features for ML models."""

    def __init__(self):
        """Initialize feature engineer."""
        self.tfidf_vectorizer: Optional[TfidfVectorizer] = None
        self.skill_binarizer: Optional[MultiLabelBinarizer] = None
        self.known_skills: list[str] = []

    def extract_skill_features(
        self,
        skills: list[str],
        normalize: bool = True,
    ) -> dict:
        """
        Extract features from a list of skills.

        Args:
            skills: List of skill names
            normalize: Whether to normalize skill names

        Returns:
            Dictionary of skill features
        """
        if normalize:
            skills = [normalize_skill(s) for s in skills if s]

        # Skill counts
        skill_counts = Counter(skills)
        total_skills = len(skills)
        unique_skills = len(skill_counts)

        # Category distribution
        category_counts = Counter()
        for skill in skills:
            for category, category_skills in SKILL_CATEGORIES.items():
                if skill in category_skills:
                    category_counts[category] += 1
                    break

        # Features
        features = {
            "total_skills": total_skills,
            "unique_skills": unique_skills,
            "skills_per_category": dict(category_counts),
            "top_skills": skill_counts.most_common(10),
            "skill_diversity": unique_skills / max(total_skills, 1),
        }

        return features

    def extract_text_features(self, text: str) -> dict:
        """
        Extract features from text.

        Args:
            text: Input text

        Returns:
            Dictionary of text features
        """
        if not text:
            return {
                "word_count": 0,
                "char_count": 0,
                "avg_word_length": 0,
                "sentence_count": 0,
            }

        # Basic counts
        words = text.split()
        word_count = len(words)
        char_count = len(text)

        # Average word length
        avg_word_length = sum(len(w) for w in words) / max(word_count, 1)

        # Sentence count (approximate)
        sentence_count = len([s for s in text.split('.') if s.strip()])

        return {
            "word_count": word_count,
            "char_count": char_count,
            "avg_word_length": avg_word_length,
            "sentence_count": sentence_count,
        }

    def create_skill_vector(
        self,
        skills: list[str],
        known_skills: Optional[list[str]] = None,
    ) -> np.ndarray:
        """
        Create a binary vector for skills.

        Args:
            skills: List of skill names
            known_skills: List of all known skills (vocabulary)

        Returns:
            Binary numpy array
        """
        if known_skills is None:
            known_skills = self.known_skills

        if not known_skills:
            # Flatten all skills from categories
            known_skills = []
            for category_skills in SKILL_CATEGORIES.values():
                known_skills.extend(category_skills)
            known_skills = list(set(known_skills))

        # Normalize input skills
        normalized = [normalize_skill(s).lower() for s in skills if s]

        # Create binary vector
        vector = np.zeros(len(known_skills))
        for i, skill in enumerate(known_skills):
            if skill.lower() in normalized:
                vector[i] = 1

        return vector

    def fit_tfidf(self, texts: list[str]) -> None:
        """
        Fit TF-IDF vectorizer on corpus.

        Args:
            texts: List of texts to fit on
        """
        preprocessed = [preprocess_text(t) for t in texts]
        self.tfidf_vectorizer = TfidfVectorizer(
            max_features=5000,
            min_df=2,
            max_df=0.95,
            ngram_range=(1, 2),
        )
        self.tfidf_vectorizer.fit(preprocessed)

    def transform_tfidf(self, texts: list[str]) -> np.ndarray:
        """
        Transform texts to TF-IDF vectors.

        Args:
            texts: List of texts

        Returns:
            TF-IDF matrix
        """
        if self.tfidf_vectorizer is None:
            raise ValueError("TF-IDF vectorizer not fitted. Call fit_tfidf first.")

        preprocessed = [preprocess_text(t) for t in texts]
        return self.tfidf_vectorizer.transform(preprocessed).toarray()

    def create_feature_matrix(
        self,
        texts: list[str],
        skills_list: list[list[str]],
    ) -> np.ndarray:
        """
        Create combined feature matrix.

        Args:
            texts: List of texts
            skills_list: List of skill lists (parallel to texts)

        Returns:
            Combined feature matrix
        """
        # Text features (TF-IDF)
        if self.tfidf_vectorizer is None:
            self.fit_tfidf(texts)
        text_features = self.transform_tfidf(texts)

        # Skill features
        skill_features = np.array([
            self.create_skill_vector(skills)
            for skills in skills_list
        ])

        # Combine
        return np.hstack([text_features, skill_features])


# Singleton instance
_feature_engineer: Optional[FeatureEngineer] = None


def get_feature_engineer() -> FeatureEngineer:
    """Get the singleton feature engineer instance."""
    global _feature_engineer
    if _feature_engineer is None:
        _feature_engineer = FeatureEngineer()
    return _feature_engineer


def extract_skill_features(skills: list[str], normalize: bool = True) -> dict:
    """Convenience function to extract skill features."""
    return get_feature_engineer().extract_skill_features(skills, normalize)


def extract_text_features(text: str) -> dict:
    """Convenience function to extract text features."""
    return get_feature_engineer().extract_text_features(text)
