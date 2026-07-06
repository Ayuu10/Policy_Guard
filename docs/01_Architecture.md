# System Architecture

## Pipeline

User Upload

↓

Document Parser

↓

Chunking Engine

↓

Industry Detection

↓

ML Classifier

↓

Rule Engine

↓

RAG Retrieval

↓

LLM Verification

↓

Scoring Engine

↓

Dashboard + Reports

## Components

### Parser

Supported:

- PDF
- DOCX
- TXT
- HTML
- Markdown
- URLs

### ML Layer

Purpose:

Predict likely violated compliance principles.

Outputs:

- Principle
- Confidence

### Rule Engine

Deterministic checks.

Examples:

- Missing retention clause
- Missing cookie policy
- Missing access control

### RAG

Stores legal knowledge.

Sources:

- GDPR
- HIPAA
- PCI DSS
- CCPA
- UK GDPR

### LLM

Responsibilities:

- Verify findings
- Explain violations
- Suggest fixes
- Rewrite sections

### Scoring

Produces:

- Overall score
- Framework score
- Risk score

## Extensibility

Each regulation must be implemented as a plugin.