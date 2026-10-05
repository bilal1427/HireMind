"""
Text preprocessing for ML pipeline.
"""

import re
from typing import Optional
from pathlib import Path


class TextPreprocessor:
    """Preprocess text for ML models."""

    def __init__(self):
        """Initialize preprocessor."""
        self.stop_words = self._load_stop_words()

    def _load_stop_words(self) -> set[str]:
        """Load common English stop words."""
        return {
            'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
            'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
            'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
            'could', 'should', 'may', 'might', 'must', 'shall', 'can', 'need',
            'it', 'its', 'this', 'that', 'these', 'those', 'i', 'you', 'he',
            'she', 'we', 'they', 'what', 'which', 'who', 'when', 'where', 'why',
            'how', 'all', 'each', 'every', 'both', 'few', 'more', 'most', 'other',
            'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so',
            'than', 'too', 'very', 's', 't', 'just', 'don', 'now',
        }

    def clean(self, text: str) -> str:
        """
        Clean text by removing noise.

        Args:
            text: Raw text

        Returns:
            Cleaned text
        """
        if not text:
            return ""

        # Convert to lowercase
        text = text.lower()

        # Remove URLs
        text = re.sub(r'https?://\S+|www\.\S+', '', text)

        # Remove email addresses
        text = re.sub(r'\S+@\S+', '', text)

        # Remove phone numbers
        text = re.sub(r'\+?\d[\d\s\-\(\)]{8,}', '', text)

        # Remove special characters but keep alphanumeric and spaces
        text = re.sub(r'[^a-z0-9\s]', ' ', text)

        # Normalize whitespace
        text = ' '.join(text.split())

        return text.strip()

    def remove_stop_words(self, text: str) -> str:
        """
        Remove stop words from text.

        Args:
            text: Input text

        Returns:
            Text without stop words
        """
        words = text.lower().split()
        filtered = [w for w in words if w not in self.stop_words]
        return ' '.join(filtered)

    def tokenize(self, text: str) -> list[str]:
        """
        Tokenize text into words.

        Args:
            text: Input text

        Returns:
            List of tokens
        """
        text = self.clean(text)
        return text.split()

    def preprocess(self, text: str, remove_stopwords: bool = True) -> str:
        """
        Full preprocessing pipeline.

        Args:
            text: Raw text
            remove_stopwords: Whether to remove stop words

        Returns:
            Preprocessed text
        """
        text = self.clean(text)
        if remove_stopwords:
            text = self.remove_stop_words(text)
        return text

    def preprocess_batch(self, texts: list[str], remove_stopwords: bool = True) -> list[str]:
        """
        Preprocess multiple texts.

        Args:
            texts: List of texts
            remove_stopwords: Whether to remove stop words

        Returns:
            List of preprocessed texts
        """
        return [self.preprocess(text, remove_stopwords) for text in texts]


# Singleton instance
_preprocessor: Optional[TextPreprocessor] = None


def get_text_preprocessor() -> TextPreprocessor:
    """Get the singleton text preprocessor instance."""
    global _preprocessor
    if _preprocessor is None:
        _preprocessor = TextPreprocessor()
    return _preprocessor


def preprocess_text(text: str, remove_stopwords: bool = True) -> str:
    """Convenience function to preprocess a single text."""
    return get_text_preprocessor().preprocess(text, remove_stopwords)


def preprocess_texts(texts: list[str], remove_stopwords: bool = True) -> list[str]:
    """Convenience function to preprocess multiple texts."""
    return get_text_preprocessor().preprocess_batch(texts, remove_stopwords)
