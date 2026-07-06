import re
from typing import List, Dict, Any

# Map keyword scoring to industry sectors
INDUSTRY_KEYWORDS = {
    "Healthcare / Medicine": [
        "patient", "health", "medical", "clinical", "hospital", "phi", "treatment", "doctor",
        "hipaa", "healthcare", "diagnostic", "prescription", "health records"
    ],
    "Finance / Banking": [
        "credit card", "bank", "account number", "financial", "payment", "cardholder",
        "glba", "transaction", "billing", "credit rating", "loan", "pci dss", "wire transfer"
    ],
    "E-commerce / Retail": [
        "purchase", "order", "shipping", "delivery", "shopping cart", "product", "retail",
        "buyer", "seller", "checkout", "store", "merchant", "customer profile"
    ],
    "Technology / SaaS": [
        "software", "app", "application", "platform", "saas", "api", "account registration",
        "cookies", "log data", "device details", "ip address", "browser", "dashboard", "sdk"
    ],
    "Education": [
        "student", "school", "university", "college", "course", "ferpa", "education",
        "teacher", "classroom", "grade", "academic", "enrollment"
    ]
}

# Recommendations and sector-specific privacy clauses
INDUSTRY_SUGGESTIONS = {
    "Healthcare / Medicine": [
        {
            "clause_name": "Protected Health Information (PHI) Notice",
            "requirement": "Explicitly identify PHI handling separate from regular personal data, citing patient rights under 45 CFR Section 164.520.",
            "sample_text": "We are committed to safeguarding your Protected Health Information (PHI) in accordance with the HIPAA Privacy Rule. Your health records are stored separately and are accessible only to authorized medical personnel."
        },
        {
            "clause_name": "Consent for Treatment & Diagnostics",
            "requirement": "Obtain separate, explicit consent before transmitting diagnostic data to third-party labs or providers.",
            "sample_text": "By using our diagnostic portals, you explicitly authorize the transmission of diagnostic samples and test results to certified clinical laboratories."
        }
    ],
    "Finance / Banking": [
        {
            "clause_name": "GLBA Financial Information Disclosure",
            "requirement": "Clearly state consumer rights to opt-out of sharing non-public personal financial information with non-affiliated companies.",
            "sample_text": "In compliance with the Gramm-Leach-Bliley Act (GLBA), we do not share non-public personal financial information with non-affiliated third parties except as permitted or required by law."
        },
        {
            "clause_name": "PCI DSS Cardholder Data Policy",
            "requirement": "Specify that payment details are processed through encrypted channels without storing the CVV or full PAN directly.",
            "sample_text": "All cardholder data is processed by PCI DSS Compliant payment gateways. We do not store your complete credit card number or CVV code on our servers."
        }
    ],
    "E-commerce / Retail": [
        {
            "clause_name": "Order Fulfillment & Shipping Disclosure",
            "requirement": "Explicitly mention which shipping/fulfillment partners (e.g. FedEx, UPS) receive client address details.",
            "sample_text": "To fulfill your orders, we share your name, delivery address, and phone number with third-party courier services (e.g., UPS, DHL)."
        },
        {
            "clause_name": "Transaction & Tax Recording",
            "requirement": "State data retention duration for billing addresses and purchase history required for tax audit compliance.",
            "sample_text": "Transaction details, including purchase history and billing address, are retained for up to 7 years to comply with regulatory tax auditing requirements."
        }
    ],
    "Technology / SaaS": [
        {
            "clause_name": "Automatic Log Data & Device Collection",
            "requirement": "Disclose collection of IP addresses, browser types, and device attributes used for operational logs under CCPA/GDPR rules.",
            "sample_text": "When you access our platform, our servers automatically collect log details, including your IP address, browser type, device details, and operating system configuration."
        },
        {
            "clause_name": "Sub-processor Disclosure",
            "requirement": "Disclose that cloud hosting platforms (e.g., AWS, GCP) act as sub-processors for application runtime database storage.",
            "sample_text": "We utilize AWS and Google Cloud Platform for secure application hosting and database storage. These sub-processors comply with strict security and privacy standards."
        }
    ],
    "Education": [
        {
            "clause_name": "Student Educational Records (FERPA)",
            "requirement": "Detail parent/student rights to review, inspect, and request correction of educational profiles under FERPA regulations.",
            "sample_text": "Under the Family Educational Rights and Privacy Act (FERPA), students and parents have the right to inspect, review, and request amendment of their educational profiles."
        },
        {
            "clause_name": "Children's Privacy Protection (COPPA)",
            "requirement": "If offering products to students under 13, explicitly outline parental verification and opt-in consent steps.",
            "sample_text": "We do not knowingly collect personal information from children under 13 without verified parental or educational institution consent."
        }
    ]
}

def detect_industry(text: str) -> str:
    """
    Scans the policy text and scores matches against keyword lists to detect the industry sector.
    """
    if not text:
        return "General / Non-specified"
        
    scores = {industry: 0 for industry in INDUSTRY_KEYWORDS}
    text_lower = text.lower()
    
    for industry, keywords in INDUSTRY_KEYWORDS.items():
        for keyword in keywords:
            # Use regex for word boundaries to avoid false partial matches
            matches = len(re.findall(r'\b' + re.escape(keyword) + r'\b', text_lower))
            scores[industry] += matches
            
    # Find the top scoring industry
    top_industry = max(scores, key=scores.get)
    # If the top score is extremely low (e.g., <= 2 matches), fallback to General
    if scores[top_industry] <= 2:
        return "General / Non-specified"
        
    return top_industry

def get_industry_suggestions(industry: str) -> List[Dict[str, str]]:
    """
    Return list of recommended clauses/suggestions for the given industry.
    """
    return INDUSTRY_SUGGESTIONS.get(industry, [
        {
            "clause_name": "Standard Data Protection Policy",
            "requirement": "Provide clear information regarding data collection purposes, retention periods, and user access rights.",
            "sample_text": "We process personal data only for specified, transparent purposes. You have the right to request access to and correction or deletion of your data."
        }
    ])
