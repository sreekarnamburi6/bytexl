import re

def preprocess_text(text):
    """
    Basic text preprocessing utility.

    Current use:
    - Acts as a placeholder for future NLP-based features
      (symptom analysis, chatbot input, medical reports).

    Operations performed:
    - Lowercasing
    - Trimming extra spaces
    """

    if not isinstance(text, str):
        return ""

    # Convert to lowercase
    text = text.lower()

    # Remove extra spaces
    text = re.sub(r"\s+", " ", text).strip()

    return text
