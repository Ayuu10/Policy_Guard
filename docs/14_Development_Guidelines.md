# Development Guidelines

## Goal

Build production-quality software.

Avoid quick fixes.

Favor maintainability over shortcuts.

---

# Coding Standards

Python

- Type hints
- Black formatting
- Ruff linting
- Pydantic validation
- SQLAlchemy ORM

Frontend

- TypeScript only
- Functional components
- React Query
- TailwindCSS
- shadcn/ui

---

# Architecture

Follow Clean Architecture.

Presentation

↓

API

↓

Services

↓

Repositories

↓

Database

Never mix business logic with API routes.

---

# Naming

Classes

PascalCase

Variables

snake_case

React Components

PascalCase

Files

snake_case

Constants

UPPER_CASE

---

# Error Handling

Never suppress exceptions.

Return meaningful API errors.

Log unexpected failures.

---

# Logging

Log

Uploads

Analyses

Reports

Errors

Authentication

LLM requests

Do not log sensitive user data.

---

# Testing

Unit Tests

Integration Tests

API Tests

End-to-End Tests

Target

>80% coverage.

---

# Git Workflow

Feature branches

Pull requests

Code review

Semantic commits

Examples

feat:

fix:

refactor:

docs:

test:

---

# Documentation

Every module should contain

README

Architecture

Usage

Examples

Public APIs should include OpenAPI documentation.

---

# Security

Validate uploads.

Limit file size.

Sanitize HTML.

Escape user input.

Protect secrets.

Rotate API keys.

Implement JWT expiration.

---

# Performance

Lazy loading

Caching

Background workers

Batch embeddings

Connection pooling

Streaming responses

---

# AI Guidelines

Never let the LLM decide compliance alone.

Always combine

Rule Engine

+

ML

+

RAG

+

LLM

Every AI response should include

Confidence

Evidence

References

Suggested Fix

---

# Code Quality

Prefer modular code.

Avoid duplicated logic.

Avoid hardcoded values.

Write reusable services.

Separate interfaces from implementations.

---

# Future Contributions

Every new feature should include

Documentation

Tests

Configuration

Migration (if required)

Example usage

The project should remain extensible, readable, and production-ready as it grows.