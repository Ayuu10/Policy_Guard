from typing import List, Dict, Any

SEVERITY_WEIGHTS = {
    "critical": 1.0,
    "high": 0.7,
    "medium": 0.4,
    "low": 0.1
}

def calculate_scores(findings: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Calculate compliance, category, and risk scores from evaluation findings.
    """
    if not findings:
        return {
            "overall_score": 1.0,
            "framework_score": 1.0,
            "risk_score": 0.0,
            "categories": {}
        }
        
    total_rules = len(findings)
    compliant_rules = sum(1 for f in findings if f["compliant"])
    
    # 1. Framework Score (simple ratio)
    framework_score = compliant_rules / total_rules
    
    # 2. Risk Score (severity weighted sum of violations relative to total potential weight)
    total_weight = sum(SEVERITY_WEIGHTS.get(f["severity"].lower(), 0.1) for f in findings)
    violation_weight = sum(SEVERITY_WEIGHTS.get(f["severity"].lower(), 0.1) for f in findings if not f["compliant"])
    
    risk_score = (violation_weight / total_weight) if total_weight > 0 else 0.0
    
    # 3. Overall Score (inversely proportional to risk)
    overall_score = 1.0 - risk_score
    
    # 4. Category Scores
    category_map = {}
    for f in findings:
        cat = f["category"]
        if cat not in category_map:
            category_map[cat] = []
        category_map[cat].append(f)
        
    categories = {}
    for cat, cat_findings in category_map.items():
        cat_total = len(cat_findings)
        cat_compliant = sum(1 for f in cat_findings if f["compliant"])
        categories[cat] = cat_compliant / cat_total
        
    return {
        "overall_score": overall_score,
        "framework_score": framework_score,
        "risk_score": risk_score,
        "categories": categories
    }
