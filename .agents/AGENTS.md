# PolicyGuard AI Workspace Guidelines & Rules

Welcome to the PolicyGuard workspace. Below are the rules, architecture guidelines, and settings configurations specific to this directory.

---

## 🛠️ Project Architecture & Design System

1. **Plugin-Based Compliance**:
   * All regulatory framework files are loaded dynamically from `backend/compliance/frameworks/{framework_name}/`.
   * Never hardcode framework-specific evaluation patterns in the core engines (`rule_engine.py` or `analysis_service.py`).
   * When adding new compliance policies, create a folder under `backend/compliance/frameworks/` containing `rules.json` and `articles.json` files.

2. **Idempotent Document Audits**:
   * Storing and uploading files is idempotent. Same files (evaluated by SHA-256 hash) are mapped to existing DB entries to allow re-running framework analysis without duplication.

3. **Industry Detection Insights**:
   * Document analysis dynamically classifies policy texts into *Healthcare, Finance, E-commerce, Tech/SaaS, or Education* using keyword lists.
   * Tailored clauses and recommended template drafts are returned as part of the analysis payload.

---

## 🤖 LLM Models & Integrations

* **Default LLM Provider**: Groq AI (Llama 3.3).
* **Default Groq Model**: `llama-3.3-70b-versatile` (updated from decommissioned llama-3.1 models).
* **Client Overrides**: REST API endpoints `/api/rewrite` and `/api/chat` accept optional client overrides for `provider` (groq / openai / offline) and `model` preferences.

---

## 💻 Administrator Settings
* **Default Seeding**: On start-up, default credentials `admin` / `admin` (Role: admin) and `test1` / `test1` (Role: user) are auto-seeded.
* **Access Restricting**: Ensure `/admin` navigation routes and backend admin APIs (`stats`, `frameworks`, `reindex`) remain protected by checks on the user role.
