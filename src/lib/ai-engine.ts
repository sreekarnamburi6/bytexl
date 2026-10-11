// MEDISCOPE AI's multilingual health guide is rule-based; local disease models live in ai_service/.

export type Language = "en" | "te" | "hi";

export function guessCategory(fileName: string): string {
  const name = fileName.toLowerCase();
  if (/(cbc|lab|blood|thyroid|lipid|glucose|report)/.test(name)) return "Lab Report";
  if (/(rx|prescription|medicine|script)/.test(name)) return "Prescription";
  if (/(xray|x-ray|mri|ct|scan|radiology)/.test(name)) return "Radiology Scan";
  if (/(discharge|summary)/.test(name)) return "Discharge Summary";
  return "General";
}

// ---------------------------------------------------------------------
// Conversational Copilot (rule-based, multilingual, context-aware)
// ---------------------------------------------------------------------

export type CopilotContext = {
  userName: string;
  documentCount: number;
  latestDocumentSummary?: string;
  latestVitals?: { type: string; value: number; unit: string }[];
  riskLevel?: string;
};

const DISCLAIMER: Record<Language, string> = {
  en: "⚠️ MEDISCOPE AI is a hackathon prototype. This is not medical advice — always consult a licensed clinician.",
  te: "⚠️ మెడిస్కోప్ AI ఒక హ్యాకథాన్ ప్రోటోటైప్. ఇది వైద్య సలహా కాదు — దయచేసి అర్హత కలిగిన వైద్యుడిని సంప్రదించండి.",
  hi: "⚠️ मेडिस्कोप AI एक हैकथॉन प्रोटोटाइप है। यह चिकित्सीय सलाह नहीं है — कृपया किसी योग्य डॉक्टर से सलाह लें।",
};

const GREETINGS: Record<Language, string> = {
  en: "Hello {name}! I'm your MEDISCOPE AI Copilot. I can summarize your reports, explain medical terms, and walk you through your unified health timeline.",
  te: "నమస్కారం {name}! నేను మీ మెడిస్కోప్ AI కోపైలట్. నేను మీ రిపోర్టులను సంగ్రహించగలను, వైద్య పదాలను వివరించగలను.",
  hi: "नमस्ते {name}! मैं आपका मेडिस्कोप AI कोपायलट हूँ। मैं आपकी रिपोर्ट्स का सारांश दे सकता हूँ और मेडिकल शब्दों को समझा सकता हूँ।",
};

const NO_DOCS: Record<Language, string> = {
  en: "You haven't uploaded any reports yet. Head to Upload Center to add a lab report, prescription, or scan — I'll summarize it instantly.",
  te: "మీరు ఇంకా ఏ రిపోర్టులను అప్‌లోడ్ చేయలేదు. లాబ్ రిపోర్ట్ లేదా స్కాన్ జోడించడానికి అప్‌లోడ్ సెంటర్‌కి వెళ్లండి.",
  hi: "आपने अभी तक कोई रिपोर्ट अपलोड नहीं की है। लैब रिपोर्ट या स्कैन जोड़ने के लिए अपलोड सेंटर पर जाएँ।",
};

const SUMMARY_INTRO: Record<Language, string> = {
  en: "Here's a plain-language summary of your most recent document:",
  te: "మీ ఇటీవలి పత్రం యొక్క సాధారణ భాషా సారాంశం ఇక్కడ ఉంది:",
  hi: "यहाँ आपके नवीनतम दस्तावेज़ का सरल भाषा में सारांश है:",
};

const SOURCE_NOTE: Record<Language, string> = {
  en: "Source text below is copied from your uploaded document, not translated or clinically interpreted. Verify OCR against the original.",
  te: "క్రింది మూల పాఠ్యం మీ అప్‌లోడ్ చేసిన పత్రం నుండి యథాతథంగా తీసుకోబడింది; అనువాదం లేదా వైద్య అర్థీకరణ కాదు. OCR‌ను అసలు పత్రంతో ధృవీకరించండి.",
  hi: "नीचे दिया गया स्रोत-पाठ आपके अपलोड किए दस्तावेज़ से ज्यों का त्यों है; इसका अनुवाद या चिकित्सीय अर्थ नहीं निकाला गया है। OCR को मूल दस्तावेज़ से जाँचें।",
};

const VITALS_INTRO: Record<Language, string> = {
  en: "Here are your latest recorded vitals:",
  te: "మీ తాజా వైటల్స్ ఇక్కడ ఉన్నాయి:",
  hi: "यहाँ आपके नवीनतम वाइटल्स दर्ज हैं:",
};

const NO_VITALS: Record<Language, string> = {
  en: "No manually entered vital readings are available yet.",
  te: "ఇంకా మాన్యువల్‌గా నమోదు చేసిన వైటల్స్ లేవు.",
  hi: "अभी तक कोई वाइटल रीडिंग मैन्युअल रूप से दर्ज नहीं की गई है।",
};

const RISK_EXPLAIN: Record<Language, string> = {
  en: "No validated clinical risk model is connected. Risk is not assessed.",
  te: "ధృవీకరించబడిన వైద్య ప్రమాద నమూనా అనుసంధానించబడలేదు. ప్రమాదం అంచనా వేయబడలేదు.",
  hi: "कोई मान्य चिकित्सीय जोखिम मॉडल जुड़ा नहीं है। जोखिम का आकलन नहीं किया गया है।",
};

const FALLBACK: Record<Language, string[]> = {
  en: [
    "I can help you understand lab values, explain prescriptions in simple terms, or summarize your health timeline. Try asking: \"Summarize my latest report\" or \"Explain my blood pressure\".",
    "I'm designed to turn complex medical jargon into plain language. Ask me about any uploaded report, vitals trend, or general wellness tip.",
  ],
  te: [
    "నేను ల్యాబ్ విలువలను అర్థం చేసుకోవడానికి సహాయం చేయగలను. 'నా తాజా రిపోర్ట్‌ను సంగ్రహించు' అని అడగండి.",
  ],
  hi: [
    "मैं लैब वैल्यू समझने और रिपोर्ट को सरल भाषा में समझाने में मदद कर सकता हूँ। पूछें: \"मेरी नवीनतम रिपोर्ट का सारांश दें\"।",
  ],
};

function fillName(template: string, name: string) {
  return template.replace("{name}", name);
}

function hashSeed(input: string): number {
  let hash = 2166136261;
  for (let index = 0; index < input.length; index++) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash);
}

export function copilotGreeting(language: Language, name: string): string {
  return `${fillName(GREETINGS[language], name)}\n\n${DISCLAIMER[language]}`;
}

export function copilotReply(
  message: string,
  language: Language,
  ctx: CopilotContext,
): string {
  const lower = message.toLowerCase();
  const lang: Language = language in DISCLAIMER ? language : "en";

  if (/(summar|report|document|lab|సంగ్రహ|రిపోర్ట్|పత్రం|ల్యాబ్|सारांश|रिपोर्ट|दस्तावेज़|लैब)/i.test(lower)) {
    if (!ctx.latestDocumentSummary) return `${NO_DOCS[lang]}\n\n${DISCLAIMER[lang]}`;
    return `${SUMMARY_INTRO[lang]}\n\n${SOURCE_NOTE[lang]}\n\n${ctx.latestDocumentSummary}\n\n${DISCLAIMER[lang]}`;
  }

  if (/(vital|bp|blood pressure|heart rate|pulse|spo2|glucose|sugar|వైటల్స్|రక్తపోటు|హృదయ స్పందన|పల్స్|ఆక్సిజన్|గ్లూకోజ్|वाइटल|रक्तचाप|दिल की धड़कन|ऑक्सीजन|ग्लूकोज़|शुगर)/i.test(lower)) {
    if (!ctx.latestVitals || ctx.latestVitals.length === 0) {
      return `${NO_VITALS[lang]}\n\n${DISCLAIMER[lang]}`;
    }
    const lines = ctx.latestVitals
      .map((v) => `• ${v.type}: ${v.value} ${v.unit}`)
      .join("\n");
    return `${VITALS_INTRO[lang]}\n\n${lines}\n\n${DISCLAIMER[lang]}`;
  }

  if (/(risk|danger|score|health profile|ప్రమాదం|రిస్క్|ఆరోగ్య ప్రొఫైల్|जोखिम|खतरा|स्वास्थ्य प्रोफ़ाइल)/i.test(lower)) {
    return `${RISK_EXPLAIN[lang]}\n\n${DISCLAIMER[lang]}`;
  }

  if (/(hello|hi|hey|namaste|నమస్కారం|नमस्ते)/.test(lower)) {
    return copilotGreeting(lang, ctx.userName);
  }

  const options = FALLBACK[lang];
  const pick = options[hashSeed(message) % options.length];
  return `${pick}\n\n${DISCLAIMER[lang]}`;
}
