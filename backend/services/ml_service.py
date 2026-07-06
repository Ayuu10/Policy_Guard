import os
from pathlib import Path
import torch
from torch import nn
from sentence_transformers import SentenceTransformer
import nltk

try:
    nltk.data.find('tokenizers/punkt_tab')
except LookupError:
    nltk.download('punkt_tab')

sbert_label_descriptions = {
    0: "Lawfulness, Fairness and Transparency",
    1: "Purpose Limitation",
    2: "Data Minimization",
    3: "Accuracy",
    4: "Storage Limitation",
    5: "Integrity and Confidentiality",
    6: "Accountability",
}

class SBertClassifier(nn.Module):
    def __init__(self, embedding_dim: int, num_labels: int):
        super(SBertClassifier, self).__init__()
        self.lstm = nn.LSTM(embedding_dim, 128, batch_first=True, bidirectional=True)
        self.fc = nn.Linear(256, num_labels)

    def forward(self, embeddings):
        _, (hidden, _) = self.lstm(embeddings.unsqueeze(1))
        hidden = torch.cat((hidden[-2, :, :], hidden[-1, :, :]), dim=1)
        out = self.fc(hidden)
        return out

_sbert_model = None
_classifier_model = None

def get_sbert_model():
    global _sbert_model
    if _sbert_model is None:
        _sbert_model = SentenceTransformer('all-MiniLM-L6-v2')
    return _sbert_model

def get_classifier_model():
    global _classifier_model
    if _classifier_model is None:
        sbert_model = get_sbert_model()
        dim = sbert_model.get_embedding_dimension()
        model = SBertClassifier(dim, num_labels=7)
        
        root_dir = Path(__file__).resolve().parent.parent.parent
        model_path = root_dir / "models" / "sentence_sbert_model_path.pth"
        if not model_path.exists():
            raise FileNotFoundError(f"ML Model file not found at: {model_path}")
            
        model.load_state_dict(torch.load(model_path, map_location=torch.device('cpu')))
        model.eval()
        _classifier_model = model
    return _classifier_model

def classify_sentences(sentences: list[str], threshold: float = 0.8) -> dict[str, dict]:
    """
    Classify a list of policy sentences against GDPR principles.
    Returns a dictionary mapping principle name to compliance status details.
    """
    sbert_model = get_sbert_model()
    classifier = get_classifier_model()
    
    best_matches = {}
    
    for sentence in sentences:
        if len(sentence.split()) > 11:
            embedding = sbert_model.encode(sentence, convert_to_tensor=True).to("cpu")
            with torch.no_grad():
                outputs = classifier(embedding.unsqueeze(0))
                probs = torch.sigmoid(outputs).squeeze(0)
            
            probs = probs.cpu().numpy()
            for idx, score in enumerate(probs):
                if score >= threshold:
                    label = sbert_label_descriptions.get(idx, "Unknown")
                    if label not in best_matches or score > best_matches[label]["score"]:
                        best_matches[label] = {
                            "compliant": True,
                            "example": sentence,
                            "score": float(score)
                        }
                        
    results = {}
    for idx, label in sbert_label_descriptions.items():
        if label in best_matches:
            results[label] = best_matches[label]
        else:
            results[label] = {
                "compliant": False,
                "example": "",
                "score": 0.0
            }
    return results
