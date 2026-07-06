import json
import re
from pathlib import Path
from typing import List, Dict, Any, Tuple
import nltk
from nltk.tokenize import sent_tokenize

try:
    nltk.data.find('tokenizers/punkt_tab')
except LookupError:
    nltk.download('punkt_tab')

def get_plugin_path(framework: str) -> Path:
    # Path inside backend/compliance/frameworks
    root_dir = Path(__file__).resolve().parent.parent
    return root_dir / "compliance" / "frameworks" / framework.lower().replace(" ", "_")

def load_rules(framework: str) -> List[Dict[str, Any]]:
    plugin_dir = get_plugin_path(framework)
    rules_file = plugin_dir / "rules.json"
    if not rules_file.exists():
        raise FileNotFoundError(f"Rules configuration not found for framework: {framework} at {rules_file}")
    with open(rules_file, "r", encoding="utf-8") as f:
        return json.load(f)

def find_evidence_sentence(sentences: List[str], patterns: List[str]) -> Tuple[str, str]:
    """
    Finds the first sentence containing any of the patterns.
    Returns (matched_sentence, matched_pattern).
    """
    for sentence in sentences:
        for pattern in patterns:
            if pattern.lower() in sentence.lower():
                return sentence.strip(), pattern
            try:
                if re.search(r'\b' + re.escape(pattern.lower()) + r'\b', sentence.lower()):
                    return sentence.strip(), pattern
            except Exception:
                pass
    return "", ""

def evaluate_rules(text: str, framework: str) -> List[Dict[str, Any]]:
    """
    Evaluate policy text against dynamic rules defined in the framework plugin.
    Returns a list of finding dictionaries.
    """
    rules = load_rules(framework)
    sentences = sent_tokenize(text)
    findings = []
    
    for rule in rules:
        check = rule.get("check", {})
        check_type = check.get("type")
        patterns = check.get("patterns", [])
        
        violated = False
        evidence = ""
        matched_pattern = ""
        
        if check_type == "required_pattern":
            evidence_sentence, matched_pat = find_evidence_sentence(sentences, patterns)
            if not evidence_sentence:
                violated = True
                evidence = f"No matching clause found containing any required terms: {', '.join(patterns)}"
            else:
                violated = False
                evidence = evidence_sentence
                matched_pattern = matched_pat
                
        elif check_type == "forbidden_pattern":
            evidence_sentence, matched_pat = find_evidence_sentence(sentences, patterns)
            if evidence_sentence:
                violated = True
                evidence = evidence_sentence
                matched_pattern = matched_pat
            else:
                violated = False
                evidence = f"No forbidden clauses found (Checked for: {', '.join(patterns)})"
        
        findings.append({
            "rule_id": rule["id"],
            "title": rule["title"],
            "severity": rule["severity"],
            "category": rule["category"],
            "regulation": rule["regulation"],
            "article": rule["article"],
            "description": rule["description"],
            "fix": rule["fix"],
            "references": rule.get("references", []),
            "compliant": not violated,
            "evidence": evidence,
            "matched_pattern": matched_pattern,
            "confidence": 1.0
        })
        
    return findings
