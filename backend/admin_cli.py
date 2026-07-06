import argparse
import sys
import os
from pathlib import Path
import sqlite3

# Adjust python path to allow importing backend modules
sys.path.append(str(Path(__file__).resolve().parent.parent))

from backend.db.session import SessionLocal, engine
from backend.models.user import User
from backend.models.project import Project
from backend.models.document import Document
from backend.models.analysis import Analysis
from backend.models.finding import Finding
from backend.services import rag_service
from backend.db.vector_store import DB_PATH

def get_db():
    return SessionLocal()

def show_summary():
    db = get_db()
    try:
        users_count = db.query(User).count()
        projects_count = db.query(Project).filter(Project.is_deleted == False).count()
        docs_count = db.query(Document).filter(Document.is_deleted == False).count()
        analysis_count = db.query(Analysis).filter(Analysis.is_deleted == False).count()
        findings_count = db.query(Finding).count()

        # Vector Database Stats
        vector_chunks_count = 0
        if DB_PATH.exists():
            try:
                conn = sqlite3.connect(DB_PATH)
                cursor = conn.cursor()
                cursor.execute("SELECT COUNT(*) FROM vector_chunks")
                vector_chunks_count = cursor.fetchone()[0]
                conn.close()
            except Exception:
                pass

        # Database File Sizes
        main_db_size_kb = 0
        main_db_path = Path("policyguard.db")
        if main_db_path.exists():
            main_db_size_kb = main_db_path.stat().st_size / 1024

        vector_db_size_kb = 0
        if DB_PATH.exists():
            vector_db_size_kb = DB_PATH.stat().st_size / 1024

        print("\n==========================================")
        print("    POLICYGUARD AI - SYSTEM SUMMARY       ")
        print("==========================================")
        print(f" Total Registered Users:  {users_count}")
        print(f" Active Projects:         {projects_count}")
        print(f" Uploaded Policies:       {docs_count}")
        print(f" Completed Analyses:      {analysis_count}")
        print(f" Total Violated Findings: {findings_count}")
        print(f" Indexed RAG Chunks:      {vector_chunks_count}")
        print("------------------------------------------")
        print(f" Main Database Size:      {main_db_size_kb:.2f} KB ({main_db_path.name})")
        print(f" Vector Database Size:    {vector_db_size_kb:.2f} KB ({DB_PATH.name})")
        print("==========================================\n")
    finally:
        db.close()

def list_users():
    db = get_db()
    try:
        users = db.query(User).all()
        if not users:
            print("No registered users found.")
            return

        print("\n" + "=" * 80)
        print(f"{'ID':<38} | {'USERNAME':<15} | {'EMAIL':<25}")
        print("-" * 80)
        for u in users:
            print(f"{str(u.id):<38} | {u.username:<15} | {(u.email or 'N/A'):<25}")
        print("=" * 80 + "\n")
    finally:
        db.close()

def delete_user(username: str):
    db = get_db()
    try:
        user = db.query(User).filter(User.username == username).first()
        if not user:
            print(f"Error: User '{username}' not found.")
            return

        confirm = input(f"Are you sure you want to delete user '{username}' and all associated data? (y/N): ")
        if confirm.lower() != 'y':
            print("Operation cancelled.")
            return

        # Hard delete user and let cascades handle ORM relationships
        db.delete(user)
        db.commit()
        print(f"Successfully deleted user '{username}' and all associated projects/analyses.")
    finally:
        db.close()

def reindex_rag():
    print("Manually re-indexing all reference framework regulations into vector database...")
    try:
        rag_service.init_rag_system()
        print("RAG Vector Indexing completed successfully!")
    except Exception as e:
        print(f"Re-indexing failed: {e}")

def main():
    parser = argparse.ArgumentParser(description="PolicyGuard AI Administration Command Line Utility")
    subparsers = parser.add_subparsers(dest="command", help="Admin Commands")

    # System Summary Command
    subparsers.add_parser("summary", help="Show system counts and database file sizes")

    # List Users Command
    subparsers.add_parser("list-users", help="List all registered system users")

    # Delete User Command
    del_parser = subparsers.add_parser("delete-user", help="Delete a user and their associated data")
    del_parser.add_argument("username", type=str, help="Username to delete")

    # Reindex RAG Command
    subparsers.add_parser("reindex", help="Re-index all reference regulations into vector store")

    args = parser.parse_args()

    if args.command == "summary":
        show_summary()
    elif args.command == "list-users":
        list_users()
    elif args.command == "delete-user":
        delete_user(args.username)
    elif args.command == "reindex":
        reindex_rag()
    else:
        parser.print_help()

if __name__ == "__main__":
    main()
