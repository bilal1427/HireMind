"""
Embedding generation for HireMind AI RAG system.
Uses sentence-transformers for semantic embeddings.
"""

from typing import Any, Optional

# Default model - balance between quality and speed
DEFAULT_MODEL = "all-MiniLM-L6-v2"
SentenceTransformer: Any = None


class EmbeddingGenerator:
    """Generate embeddings for text using sentence-transformers."""

    _instance: Optional['EmbeddingGenerator'] = None
    _model: Optional[Any] = None

    def __init__(self, model_name: str = DEFAULT_MODEL):
        """Initialize embedding model."""
        self.model_name = model_name
        # Lazy load model
        self._model = None

    @property
    def model(self) -> Any:
        """Lazy load the model."""
        if self._model is None:
            global SentenceTransformer
            if SentenceTransformer is None:
                from sentence_transformers import SentenceTransformer as _SentenceTransformer

                SentenceTransformer = _SentenceTransformer
            self._model = SentenceTransformer(self.model_name)
        return self._model

    @classmethod
    def get_instance(cls, model_name: str = DEFAULT_MODEL) -> 'EmbeddingGenerator':
        """Get singleton instance."""
        if cls._instance is None:
            cls._instance = cls(model_name)
        return cls._instance

    def generate(self, text: str) -> list[float]:
        """
        Generate embedding for a single text.

        Args:
            text: Input text

        Returns:
            Embedding vector as list
        """
        embedding = self.model.encode(text, convert_to_numpy=True)
        return embedding.tolist()

    def generate_batch(self, texts: list[str]) -> list[list[float]]:
        """
        Generate embeddings for multiple texts.

        Args:
            texts: List of input texts

        Returns:
            List of embedding vectors
        """
        if not texts:
            return []

        embeddings = self.model.encode(texts, convert_to_numpy=True)
        return embeddings.tolist()

    @property
    def embedding_dimension(self) -> int:
        """Get the dimension of embeddings."""
        return self.model.get_sentence_embedding_dimension()


def get_embedding_generator() -> EmbeddingGenerator:
    """Get the embedding generator instance."""
    return EmbeddingGenerator.get_instance()


def generate_embedding(text: str) -> list[float]:
    """Convenience function to generate embedding for a single text."""
    return get_embedding_generator().generate(text)


def generate_embeddings(texts: list[str]) -> list[list[float]]:
    """Convenience function to generate embeddings for multiple texts."""
    return get_embedding_generator().generate_batch(texts)
