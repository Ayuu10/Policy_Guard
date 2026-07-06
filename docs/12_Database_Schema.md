# Database Schema

## Overview

PolicyGuard AI stores users, projects, uploaded documents, compliance analyses, reports, framework plugins, and chat history.

The schema should support multi-user, multi-project, and future SaaS deployment.

---

# Entity Relationship Diagram

User
│
├── Projects
│       │
│       ├── Documents
│       │       │
│       │       ├── Analyses
│       │       │       │
│       │       │       ├── Findings
│       │       │       ├── Scores
│       │       │       └── Reports
│       │       │
│       │       └── Chat Sessions
│       │
│       └── Settings

---

# Users

Stores registered users.

Fields

- id
- username
- email
- password_hash
- role
- created_at
- updated_at

---

# Projects

A user may have multiple projects.

Fields

- id
- user_id
- project_name
- description
- created_at
- updated_at

Relationship

User

↓

Projects

---

# Documents

Stores uploaded files.

Supported

- PDF
- DOCX
- TXT
- HTML
- Markdown

Fields

- id
- project_id
- filename
- original_filename
- file_type
- upload_date
- storage_path
- checksum

---

# Analyses

Each uploaded document may have multiple analyses.

Example

GDPR Analysis

HIPAA Analysis

Fields

- id
- document_id
- framework
- version
- status
- created_at

---

# Findings

Stores every detected issue.

Fields

- id
- analysis_id
- severity
- category
- regulation
- article
- explanation
- confidence
- suggested_fix
- evidence

---

# Scores

Stores calculated scores.

Fields

- id
- analysis_id
- overall_score
- framework_score
- transparency_score
- consent_score
- security_score
- retention_score
- risk_score

---

# Reports

Generated reports.

Fields

- id
- analysis_id
- pdf_path
- html_path
- json_path
- generated_at

---

# Chat Sessions

Stores AI assistant conversations.

Fields

- id
- project_id
- title
- created_at

---

# Chat Messages

Fields

- id
- session_id
- role
- message
- timestamp

---

# Framework Registry

Stores installed compliance plugins.

Fields

- id
- framework_name
- version
- enabled
- embedding_collection
- rules_path

---

# Audit Logs

Track important actions.

Fields

- id
- user_id
- action
- timestamp
- metadata

---

# Future Tables

- Notifications
- Teams
- Organizations
- Billing
- API Keys
- Compliance Monitoring Jobs
- Scheduled Scans
- Regulation Updates

---

# Design Principles

- Normalize where practical.
- Soft delete important entities.
- UUID primary keys.
- Foreign key constraints.
- Index frequently queried fields.
- Version analysis results.
- Store immutable reports.