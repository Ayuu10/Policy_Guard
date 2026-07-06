# System Design

## High-Level Architecture

                User
                  │
                  ▼
          React Frontend
                  │
                  ▼
             FastAPI API
                  │
    ┌─────────────┼─────────────┐
    ▼             ▼             ▼
 Parser      Compliance      AI Engine
               Engine
    │             │             │
    ▼             ▼             ▼
Document      Rule Engine     LLM
Chunking      ML Model        RAG
Embedding     Scoring         Chatbot
                  │
                  ▼
            Report Generator
                  │
                  ▼
             PostgreSQL
                  │
                  ▼
              Vector DB

---

# Components

## Frontend

Responsibilities

- Authentication
- Dashboard
- Reports
- Upload
- Chat
- Settings

---

## Backend

Responsibilities

- Authentication
- Upload API
- Analysis API
- Report API
- Chat API

---

## Parser

Responsible for

- Reading PDFs
- DOCX
- HTML
- Markdown
- URLs

Output

Structured text.

---

## Chunking Engine

Splits documents.

Maintains

- headings
- sections
- metadata

---

## Embedding Layer

Creates embeddings.

Stores

- chunks
- metadata

---

## Vector Database

Stores

- GDPR
- HIPAA
- PCI DSS
- CCPA
- UK GDPR

Supports

semantic retrieval.

---

## ML Layer

Purpose

Prioritize likely compliance issues.

Outputs

Top candidate violations.

---

## Rule Engine

Deterministic validation.

Independent from AI.

---

## LLM Layer

Receives

ML

+

Rule Engine

+

Retrieved Articles

Produces

- explanations
- fixes
- rewritten text
- summaries

---

## Reporting Engine

Generates

- PDF
- HTML
- JSON

---

# Scalability

Each component should be independent.

Parser

↓

Queue

↓

Analysis Workers

↓

LLM Workers

↓

Reporting

Support asynchronous processing.

---

# Security

JWT

HTTPS

Role Based Access

Input validation

Rate limiting

Audit logging

Encryption at rest

Secrets management

---

# Extensibility

Adding a regulation should require

Plugin Folder

↓

Rule JSON

↓

Embeddings

↓

Registration

No backend modifications.