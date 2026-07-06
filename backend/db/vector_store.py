import sqlite3
import json
from pathlib import Path
from typing import List, Dict, Any
import numpy as np

DB_PATH = Path(__file__).resolve().parent.parent / "vector_store.db"

def init_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS vector_chunks (
            id TEXT PRIMARY KEY,
            collection TEXT,
            text TEXT,
            metadata TEXT,
            embedding BLOB
        )
    """)
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_collection ON vector_chunks(collection)")
    conn.commit()
    conn.close()

def delete_collection(collection: str):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("DELETE FROM vector_chunks WHERE collection = ?", (collection.lower(),))
    conn.commit()
    conn.close()

def add_documents(collection: str, documents: List[Dict[str, Any]]):
    init_db()
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    for doc in documents:
        doc_id = doc["id"]
        text = doc["text"]
        metadata = json.dumps(doc.get("metadata", {}))
        vector = np.array(doc["vector"], dtype=np.float32).tobytes()
        
        cursor.execute("""
            INSERT OR REPLACE INTO vector_chunks (id, collection, text, metadata, embedding)
            VALUES (?, ?, ?, ?, ?)
        """, (doc_id, collection.lower(), text, metadata, vector))
        
    conn.commit()
    conn.close()

def similarity_search(collection: str, query_vector: List[float], k: int = 5) -> List[Dict[str, Any]]:
    init_db()
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT id, text, metadata, embedding 
        FROM vector_chunks 
        WHERE collection = ?
    """, (collection.lower(),))
    
    rows = cursor.fetchall()
    conn.close()
    
    if not rows:
        return []
        
    q_vec = np.array(query_vector, dtype=np.float32)
    q_norm = np.linalg.norm(q_vec)
    if q_norm > 0:
        q_vec = q_vec / q_norm
        
    results = []
    
    for row in rows:
        stored_vec = np.frombuffer(row["embedding"], dtype=np.float32)
        stored_norm = np.linalg.norm(stored_vec)
        if stored_norm > 0:
            stored_vec = stored_vec / stored_norm
            
        similarity = float(np.dot(q_vec, stored_vec))
        
        results.append({
            "id": row["id"],
            "text": row["text"],
            "metadata": json.loads(row["metadata"]),
            "score": similarity
        })
        
    # Sort descending by cosine similarity score
    results.sort(key=lambda x: x["score"], reverse=True)
    return results[:k]
