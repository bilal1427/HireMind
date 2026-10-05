"""RAG package.

Heavy embedding and vector-store dependencies are imported by submodules only
when a RAG feature is used, so the core API can start without loading ML stacks.
"""

