import os
import json
import logging
from pathlib import Path
from typing import List, Dict, Any
from backend.db import vector_store
from backend.services import ml_service

logger = logging.getLogger(__name__)

def chunk_text(text: str, chunk_size: int = 500, chunk_overlap: int = 100) -> List[str]:
    """
    Split text into chunks of roughly chunk_size characters with chunk_overlap characters of overlap.
    Maintains word boundaries.
    """
    if not text:
        return []
        
    chunks = []
    start = 0
    while start < len(text):
        end = min(start + chunk_size, len(text))
        if end < len(text):
            # Backtrack to the nearest space to avoid cutting words in half
            last_space = text.rfind(" ", start, end)
            if last_space != -1 and last_space > start:
                end = last_space
        chunks.append(text[start:end].strip())
        if end >= len(text) or (chunk_size - chunk_overlap) <= 0:
            break
        start = end - chunk_overlap
            
    return chunks

def load_articles(framework: str) -> List[Dict[str, Any]]:
    root_dir = Path(__file__).resolve().parent.parent
    plugin_dir = root_dir / "compliance" / "frameworks" / framework.lower().replace(" ", "_")
    articles_file = plugin_dir / "articles.json"
    
    if not articles_file.exists():
        logger.warning(f"Articles file not found for framework: {framework} at {articles_file}")
        return []
        
    with open(articles_file, "r", encoding="utf-8") as f:
        return json.load(f)

def index_framework_articles(framework: str):
    """
    Load, chunk, embed, and index a framework's reference articles.
    """
    articles = load_articles(framework)
    if not articles:
        return
        
    logger.info(f"Indexing RAG references for {framework} ({len(articles)} articles found)...")
    sbert_model = ml_service.get_sbert_model()
    
    documents = []
    
    for art in articles:
        content = art["content"]
        chunks = chunk_text(content, chunk_size=500, chunk_overlap=100)
        
        for idx, chunk in enumerate(chunks):
            embedding = sbert_model.encode(chunk).tolist()
            doc_id = f"{framework.lower()}_{art['id'].lower()}_{idx}"
            documents.append({
                "id": doc_id,
                "text": chunk,
                "vector": embedding,
                "metadata": {
                    "title": art["title"],
                    "regulation": art["regulation"],
                    "article": art["article"],
                    "category": art["category"],
                    "source": art["source"]
                }
            })
            
    # Re-build collection cleanly
    vector_store.delete_collection(framework)
    vector_store.add_documents(framework, documents)
    logger.info(f"Successfully indexed {len(documents)} chunks for framework {framework}.")

def retrieve_relevant_clauses(framework: str, query: str, k: int = 5) -> List[Dict[str, Any]]:
    """
    Generate query embedding and retrieve matching regulatory clauses.
    """
    sbert_model = ml_service.get_sbert_model()
    query_vector = sbert_model.encode(query).tolist()
    return vector_store.similarity_search(framework, query_vector, k=k)

def init_rag_system():
    """
    Scans the frameworks directory and auto-indexes articles for any non-indexed active framework.
    """
    try:
        root_dir = Path(__file__).resolve().parent.parent
        frameworks_dir = root_dir / "compliance" / "frameworks"
        
        if not frameworks_dir.exists():
            return
            
        for item in frameworks_dir.iterdir():
            if item.is_dir():
                framework_name = item.name.replace("_", " ")
                articles_file = item / "articles.json"
                if articles_file.exists():
                    # Run a dummy lookup to see if the index is empty
                    results = vector_store.similarity_search(framework_name, [0.0] * 384, k=1)
                    if not results:
                        index_framework_articles(framework_name)
    except Exception as e:
        logger.error(f"Error during RAG system initialization: {e}")
