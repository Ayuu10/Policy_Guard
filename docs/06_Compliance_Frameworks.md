# Compliance Framework Plugins

## Structure

frameworks/

gdpr/

hipaa/

pci_dss/

ccpa/

uk_gdpr/

## Each Framework Contains

rules.json

severity.json

examples.json

references.json

prompts/

## Rule Format

{
  "id": "",
  "title": "",
  "severity": "",
  "description": "",
  "fix": "",
  "references": []
}

## Requirements

No framework-specific logic should exist in the core system.

Everything must be plugin-based.