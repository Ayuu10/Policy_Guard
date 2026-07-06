import os
import uuid
import logging
import json
from typing import Optional, List, Dict, Any, Tuple
from sqlalchemy.orm import Session

from backend.core.config import settings
from backend.models.finding import Finding
from backend.models.chat import ChatMessage, ChatSession
from backend.services import rag_service

logger = logging.getLogger(__name__)

try:
    from openai import OpenAI
    HAS_OPENAI = True
except ImportError:
    HAS_OPENAI = False
    logger.warning("openai package not found. Using local template engine exclusively.")

def get_llm_client_and_model(provider: Optional[str] = None, model: Optional[str] = None) -> Tuple[Optional[Any], str]:
    if not HAS_OPENAI or provider == "offline":
        return None, ""
    try:
        # Determine provider: explicitly requested, or auto-selected based on active keys
        prov = provider.lower() if provider else None
        if not prov:
            if settings.GROQ_API_KEY:
                prov = "groq"
            elif settings.OPENAI_API_KEY:
                prov = "openai"

        if prov == "groq" and settings.GROQ_API_KEY:
            logger.info("Initializing Groq API client dynamically...")
            client = OpenAI(
                base_url="https://api.groq.com/openai/v1",
                api_key=settings.GROQ_API_KEY
            )
            return client, model or settings.GROQ_MODEL or "llama-3.3-70b-versatile"
        elif prov == "openai" and settings.OPENAI_API_KEY:
            logger.info("Initializing OpenAI API client dynamically...")
            client = OpenAI(api_key=settings.OPENAI_API_KEY)
            return client, model or "gpt-4o"
    except Exception as e:
        logger.error(f"Failed to initialize LLM client dynamically: {e}")
    return None, ""


def generate_rewrite(
    db: Session,
    text: str,
    framework: str,
    finding_id: Optional[uuid.UUID] = None,
    provider: Optional[str] = None,
    model: Optional[str] = None
) -> Dict[str, str]:
    """
    Rewrite a section of policy text to make it compliant.
    Returns {"rewritten_text": str, "explanation": str}
    """
    finding_details = ""
    suggested_fix = ""
    category = "General"
    
    if finding_id:
        finding = db.query(Finding).filter(Finding.id == finding_id).first()
        if finding:
            category = finding.category
            suggested_fix = finding.suggested_fix
            finding_details = (
                f"Violation details: {finding.explanation}\n"
                f"Suggested Fix: {finding.suggested_fix}\n"
                f"Regulatory Clause: {finding.article} ({finding.regulation})"
            )

    client, active_model = get_llm_client_and_model(provider, model)
    if client:
        try:
            prompt = (
                f"You are a compliance legal expert. Rewrite the following privacy policy section to comply with {framework}.\n\n"
                f"Original text:\n\"\"\"\n{text}\n\"\"\"\n\n"
                f"{finding_details}\n\n"
                "Return a JSON response containing two fields:\n"
                "- 'rewritten_text': The updated compliant version of the text.\n"
                "- 'explanation': A summary of what changes were made and why they make the text compliant."
            )
            
            response = client.chat.completions.create(
                model=active_model,
                messages=[
                    {"role": "system", "content": "You are a professional legal auditor. You must respond strictly in JSON format matching the schema: {\"rewritten_text\": string, \"explanation\": string}"},
                    {"role": "user", "content": prompt}
                ],
                response_format={"type": "json_object"}
            )
            
            result = json.loads(response.choices[0].message.content)
            return {
                "rewritten_text": result.get("rewritten_text", ""),
                "explanation": result.get("explanation", "")
            }
        except Exception as e:
            logger.error(f"LLM rewrite generation failed: {e}. Falling back to template generator.")

    cat_lower = category.lower()
    if "cookie" in cat_lower or "transparency" in cat_lower:
        rewritten = (
            "We collect cookies and other tracking indicators (such as web beacons, local storage, and tracking pixels) "
            "to store your preferences, personalize your experience, and run site analytics. You can manage your preferences "
            "through our Cookie Settings panel."
        )
        explanation = (
            "This rewrite explicitly details cookie usage and tracking identifiers, satisfying the transparency "
            "requirements under Article 12 of the GDPR / CCPA notice guidelines."
        )
    elif "consent" in cat_lower:
        rewritten = (
            "We process your personal information only when we have obtained your clear, affirmative consent for specified purposes. "
            "You have the right to withdraw your consent at any time by contacting us."
        )
        explanation = (
            "This clause introduces affirmative opt-in consent and a direct withdrawal mechanism, meeting the conditions of Article 7."
        )
    elif "security" in cat_lower:
        rewritten = (
            "We implement robust technical and organizational security controls, including SSL/TLS transit encryption and AES-256 storage hashing, "
            "to safeguard your data against unauthorized access or disclosure."
        )
        explanation = (
            "This section specifies encryption standards and technical safeguards, complying with Article 32 GDPR / HIPAA 45 CFR Section 164.312."
        )
    elif "retention" in cat_lower or "storage" in cat_lower:
        rewritten = (
            "We retain your personal data only for as long as necessary to fulfill the transactions and purposes described in this policy, "
            "typically not exceeding 12 months after your last active login."
        )
        explanation = (
            "This establishes concrete retention boundaries, satisfying Article 5(1)(e) storage limitations."
        )
    else:
        rewritten = (
            f"We process your personal data in accordance with the legal requirements of {framework}. "
            "All processes are transparent, secure, and respect data subject rights."
        )
        explanation = (
            f"Updated text to align with general {framework} principles. "
            f"Suggested fix incorporated: {suggested_fix or 'General compliance formatting.'}"
        )
        
    return {
        "rewritten_text": rewritten,
        "explanation": explanation
    }

def generate_chat_reply(
    db: Session,
    session_id: uuid.UUID,
    message: str,
    framework: Optional[str] = None,
    document_id: Optional[uuid.UUID] = None,
    provider: Optional[str] = None,
    model: Optional[str] = None
) -> Dict[str, Any]:
    """
    Conversational compliance assistant. Grounded in RAG.
    Returns {"response": str, "sources": List[Dict[str, Any]]}
    """
    reg = framework or "GDPR"
    rag_results = []
    try:
        rag_results = rag_service.retrieve_relevant_clauses(reg, message, k=3)
    except Exception as re:
        logger.error(f"RAG lookup failed: {re}")
        
    context_str = ""
    if rag_results:
        context_str = "\n\n".join(
            f"Source: {c['metadata']['article']} ({c['metadata']['title']})\nContent: {c['text']}"
            for c in rag_results
        )

    history = db.query(ChatMessage).filter(
        ChatMessage.session_id == session_id
    ).order_by(ChatMessage.timestamp.asc()).all()
    
    chat_history_formatted = []
    for msg in history:
        chat_history_formatted.append({"role": msg.role, "content": msg.message})

    client, active_model = get_llm_client_and_model(provider, model)
    if client:
        try:
            messages = [
                {
                    "role": "system",
                    "content": (
                        "You are PolicyGuard AI, a helpful conversational compliance assistant. "
                        "Ground your answers strictly in the retrieved regulatory documents provided in the context. "
                        "State the article or section you are citing. If the context does not contain relevant information, "
                        "state that you cannot find guidance on this topic from the official regulation but will provide general context."
                    )
                }
            ]
            
            for h in chat_history_formatted:
                messages.append(h)
                
            user_content = f"Question: {message}\n\nRetrieved Regulatory Context:\n{context_str}"
            messages.append({"role": "user", "content": user_content})
            
            response = client.chat.completions.create(
                model=active_model,
                messages=messages
            )
            
            reply_text = response.choices[0].message.content
            return {
                "response": reply_text,
                "sources": rag_results
            }
        except Exception as e:
            logger.error(f"LLM chat completion failed: {e}. Falling back to template answers.")

    if rag_results:
        reply_text = (
            f"Based on your question regarding '{message}' under {reg}, here is the relevant legal guidance:\n\n"
        )
        for c in rag_results:
            reply_text += (
                f"**{c['metadata']['article']}** - {c['metadata']['title']}\n"
                f"*Requirement:* {c['text']}\n"
                f"*Source:* {c['metadata']['source']}\n\n"
            )
        reply_text += (
            "Please ensure your policies and procedures strictly follow these criteria. "
            "Let me know if you would like me to clarify any of these requirements!"
        )
    else:
        reply_text = (
            f"I analyzed the regulatory registry for {reg} matching your query '{message}' but did not find any specific clauses.\n\n"
            "Common requirements usually cover:\n"
            "- Clearly disclosing data processing purposes.\n"
            "- Implementing encryption for data storage and transit.\n"
            "- Informing data subjects of their access and deletion rights.\n\n"
            "Could you specify another keyword or topic to search?"
        )
        
    return {
        "response": reply_text,
        "sources": rag_results
    }
