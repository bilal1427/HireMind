"""
Text chunking for RAG document processing.
"""

from typing import Optional
from dataclasses import dataclass


@dataclass
class TextChunk:
    """Represents a chunk of text."""
    text: str
    start_index: int
    end_index: int
    chunk_index: int
    metadata: dict


class TextChunker:
    """Split text into chunks for embedding."""

    def __init__(
        self,
        chunk_size: int = 500,
        chunk_overlap: int = 50,
        separator: str = "\n\n"
    ):
        """
        Initialize chunker.

        Args:
            chunk_size: Maximum characters per chunk
            chunk_overlap: Characters to overlap between chunks
            separator: Preferred split separator
        """
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
        self.separator = separator

    def chunk(self, text: str, metadata: Optional[dict] = None) -> list[TextChunk]:
        """
        Split text into chunks.

        Args:
            text: Input text to chunk
            metadata: Optional metadata to include in each chunk

        Returns:
            List of TextChunk objects
        """
        if not text or not text.strip():
            return []

        metadata = metadata or {}
        chunks = []

        # Split by separator first
        segments = text.split(self.separator)

        current_chunk = ""
        current_start = 0
        chunk_index = 0

        for segment in segments:
            # If segment alone is too long, split further
            if len(segment) > self.chunk_size:
                # Process current chunk if exists
                if current_chunk:
                    chunks.append(self._create_chunk(
                        current_chunk.strip(),
                        current_start,
                        current_start + len(current_chunk),
                        chunk_index,
                        metadata
                    ))
                    chunk_index += 1
                    current_chunk = ""

                # Split long segment by sentences or words
                sub_chunks = self._split_long_segment(
                    segment,
                    current_start + len(current_chunk),
                    chunk_index,
                    metadata
                )
                chunks.extend(sub_chunks)
                chunk_index += len(sub_chunks)

                # Update position
                current_start = current_start + len(segment) + len(self.separator)
                continue

            # Check if adding segment exceeds chunk size
            if current_chunk and len(current_chunk) + len(segment) + len(self.separator) > self.chunk_size:
                # Save current chunk
                chunks.append(self._create_chunk(
                    current_chunk.strip(),
                    current_start,
                    current_start + len(current_chunk),
                    chunk_index,
                    metadata
                ))
                chunk_index += 1

                # Start new chunk with overlap
                overlap_text = self._get_overlap(current_chunk)
                current_start = current_start + len(current_chunk) - len(overlap_text)
                current_chunk = overlap_text + self.separator + segment
            else:
                # Add to current chunk
                if current_chunk:
                    current_chunk += self.separator + segment
                else:
                    current_chunk = segment

        # Add final chunk
        if current_chunk.strip():
            chunks.append(self._create_chunk(
                current_chunk.strip(),
                current_start,
                current_start + len(current_chunk),
                chunk_index,
                metadata
            ))

        return chunks

    def _split_long_segment(
        self,
        segment: str,
        start_index: int,
        chunk_index: int,
        metadata: dict
    ) -> list[TextChunk]:
        """Split a long segment into smaller chunks."""
        chunks = []
        words = segment.split()
        current_chunk = ""
        current_start = start_index

        for word in words:
            if current_chunk and len(current_chunk) + len(word) + 1 > self.chunk_size:
                chunks.append(self._create_chunk(
                    current_chunk.strip(),
                    current_start,
                    current_start + len(current_chunk),
                    chunk_index + len(chunks),
                    metadata
                ))
                current_start += len(current_chunk)
                overlap = self._get_overlap(current_chunk)
                current_chunk = overlap + " " + word
            else:
                current_chunk += " " + word if current_chunk else word

        if current_chunk.strip():
            chunks.append(self._create_chunk(
                current_chunk.strip(),
                current_start,
                current_start + len(current_chunk),
                chunk_index + len(chunks),
                metadata
            ))

        return chunks

    def _create_chunk(
        self,
        text: str,
        start_index: int,
        end_index: int,
        chunk_index: int,
        metadata: dict
    ) -> TextChunk:
        """Create a TextChunk object."""
        return TextChunk(
            text=text,
            start_index=start_index,
            end_index=end_index,
            chunk_index=chunk_index,
            metadata=metadata.copy()
        )

    def _get_overlap(self, text: str) -> str:
        """Get overlap text from the end of a chunk."""
        if len(text) <= self.chunk_overlap:
            return text
        return text[-self.chunk_overlap:]


def get_chunker(
    chunk_size: int = 500,
    chunk_overlap: int = 50
) -> TextChunker:
    """Get a text chunker instance."""
    return TextChunker(chunk_size=chunk_size, chunk_overlap=chunk_overlap)


def chunk_text(
    text: str,
    chunk_size: int = 500,
    chunk_overlap: int = 50,
    metadata: Optional[dict] = None
) -> list[TextChunk]:
    """Convenience function to chunk text."""
    chunker = get_chunker(chunk_size, chunk_overlap)
    return chunker.chunk(text, metadata)
