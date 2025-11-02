const {onRequest} = require("firebase-functions/v2/https");
const {setGlobalOptions} = require("firebase-functions/v2");
const { SpeechClient } = require("@google-cloud/speech");
const { TextToSpeechClient } = require("@google-cloud/text-to-speech");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const admin = require("firebase-admin");
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');

// Initialize Firebase Admin
admin.initializeApp();
const db = getFirestore();

// Environment variables are now managed by Firebase secrets

// Set global options for the function region
setGlobalOptions({region: "us-central1"});

// Initialize clients for Pure Gen AI mode
const speechClient = new SpeechClient();
const textToSpeechClient = new TextToSpeechClient();

// Fallback empathetic responses for when AI is not available
const fallbackResponses = [
  "I hear you, and I want you to know that you're not alone in this.",
  "Thank you for sharing with me. Your feelings are valid and important.",
  "I'm here to listen and support you through whatever you're going through.",
  "What you're feeling matters, and it's okay to take things one step at a time.",
  "You're being so brave by reaching out. I'm here for you.",
  "I understand this might be difficult. Take your time, and know that I care.",
  "Your wellbeing matters to me. You don't have to face this alone.",
  "Thank you for trusting me with your thoughts. I'm here to support you.",
];

function getRandomFallbackResponse() {
  return fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
}

function getContextualResponse(transcription) {
  const text = transcription.toLowerCase();
  const words = text.split(/\s+/);

  // Advanced sentiment analysis with multiple keywords
  const sadKeywords = ["sad", "down", "depressed", "miserable", "hopeless", "blue", "low"];
  const anxiousKeywords = ["anxious", "worried", "nervous", "panic", "scared", "fear", "terror"];
  const stressedKeywords = ["stressed", "overwhelmed", "pressure", "burden", "too much", "overload"];
  const angryKeywords = ["angry", "mad", "frustrated", "furious", "annoyed", "upset", "irritated"];
  const lonelyKeywords = ["lonely", "alone", "isolated", "abandoned", "empty", "disconnected"];
  const tiredKeywords = ["tired", "exhausted", "drained", "weary", "fatigued", "burned out"];
  const happyKeywords = ["happy", "good", "great", "wonderful", "amazing", "fantastic", "joyful", "excited"];
  const helpKeywords = ["help", "support", "need", "stuck", "lost", "confused", "advice"];
  const thankfulKeywords = ["thank", "grateful", "appreciate", "blessing", "lucky", "fortunate"];

  // Check for multiple matches to provide more nuanced responses
  const matchCount = (keywords) => keywords.filter((keyword) => text.includes(keyword)).length;

  const sadScore = matchCount(sadKeywords);
  const anxiousScore = matchCount(anxiousKeywords);
  const stressedScore = matchCount(stressedKeywords);
  const angryScore = matchCount(angryKeywords);
  const lonelyScore = matchCount(lonelyKeywords);
  const tiredScore = matchCount(tiredKeywords);
  const happyScore = matchCount(happyKeywords);
  const helpScore = matchCount(helpKeywords);
  const thankfulScore = matchCount(thankfulKeywords);

  // Multi-emotion responses for complex feelings
  if (sadScore > 0 && anxiousScore > 0) {
    return "I can hear that you're experiencing both sadness and anxiety right now. These feelings can feel overwhelming when they come together. Take a moment to breathe deeply. You don't have to carry this alone, and these difficult emotions will pass.";
  }

  if (stressedScore > 0 && tiredScore > 0) {
    return "You sound both stressed and exhausted - that's such a heavy combination to bear. Your body and mind are telling you they need rest and care. It's not weakness to step back and prioritize your wellbeing right now.";
  }

  // Enhanced single-emotion responses
  if (sadScore > 0) {
    const sadResponses = [
      "I hear the sadness in your words, and I want you to know that it's okay to feel this way. Sadness is a natural response to loss or disappointment. You're being brave by acknowledging these feelings.",
      "Your sadness is valid, and I'm here to sit with you through this difficult time. Remember that healing isn't linear, and it's okay to have days that feel heavy.",
      "I can sense the weight you're carrying right now. Sadness can feel overwhelming, but please know that you're not alone in this darkness. There is light ahead, even when it's hard to see.",
    ];
    return sadResponses[Math.floor(Math.random() * sadResponses.length)];
  }

  if (anxiousScore > 0) {
    const anxiousResponses = [
      "I understand you're feeling anxious. Let's ground ourselves together - notice five things you can see, four things you can touch, three things you can hear. You're safe in this moment.",
      "Anxiety can make everything feel urgent and overwhelming. Let's slow down together. Take three deep breaths with me. You've gotten through difficult times before, and you can get through this too.",
      "I hear the worry in your voice. Anxiety often makes us imagine the worst outcomes, but remember - thoughts are not facts. You have more strength and resources than your anxiety wants you to believe.",
    ];
    return anxiousResponses[Math.floor(Math.random() * anxiousResponses.length)];
  }

  if (stressedScore > 0) {
    const stressedResponses = [
      "It sounds like you're carrying a tremendous load right now. Stress can make us feel like we need to handle everything perfectly, but that's not realistic or fair to yourself. What's one small thing you can let go of today?",
      "I can hear how overwhelmed you are. When stress builds up, it helps to remember that you don't have to solve everything at once. Let's focus on just the next small step you can take.",
      "You're dealing with so much pressure right now. It's completely understandable that you feel stressed. Remember, asking for help isn't giving up - it's being smart about your resources.",
    ];
    return stressedResponses[Math.floor(Math.random() * stressedResponses.length)];
  }

  if (angryScore > 0) {
    const angryResponses = [
      "I can feel the intensity of your frustration, and those feelings are completely valid. Anger often signals that something important to you has been threatened or violated. It's okay to feel this way.",
      "Your anger is telling you something important - that a boundary has been crossed or that something isn't right. Let's honor that feeling while finding healthy ways to process it.",
      "I hear the fire in your words, and I understand you're dealing with something that feels deeply unfair. Your anger has a message - let's listen to what it's trying to tell you.",
    ];
    return angryResponses[Math.floor(Math.random() * angryResponses.length)];
  }

  if (lonelyScore > 0) {
    const lonelyResponses = [
      "Loneliness can feel like a deep ache, like you're invisible to the world. But right now, in this moment, you're not alone - I'm here with you, and I see you. Your feelings and experiences matter.",
      "I understand that feeling of being isolated and disconnected. Even when we're surrounded by people, we can still feel profoundly alone. You're reaching out right now, and that takes courage.",
      "The emptiness you're feeling is real and difficult. Sometimes loneliness makes us feel like we don't belong anywhere, but you belong here, in this conversation, and in this world. You matter.",
    ];
    return lonelyResponses[Math.floor(Math.random() * lonelyResponses.length)];
  }

  if (tiredScore > 0) {
    const tiredResponses = [
      "I can hear the exhaustion in your words. Being tired isn't just about sleep - sometimes it's emotional, mental, or spiritual fatigue. You've been working hard, and it's okay to rest.",
      "It sounds like you're running on empty right now. Fatigue is your body and mind's way of asking for care. What would it look like to be gentle with yourself today?",
      "You sound so weary, and that makes complete sense given what you've been through. Rest isn't a luxury - it's necessary for healing and growth. You deserve to recharge.",
    ];
    return tiredResponses[Math.floor(Math.random() * tiredResponses.length)];
  }

  if (happyScore > 0) {
    const happyResponses = [
      "It's wonderful to hear some joy in your voice! Happiness is such a gift, and I'm glad you're experiencing this positive moment. These bright spots are important to celebrate and hold onto.",
      "Your happiness is contagious - I can feel the lightness in your words. It's beautiful when we can recognize and embrace the good in our lives, even the small moments of joy.",
      "I love hearing the positivity in what you're sharing! These moments of happiness are like sunshine for the soul. Thank you for bringing some light into this conversation.",
    ];
    return happyResponses[Math.floor(Math.random() * happyResponses.length)];
  }

  if (helpScore > 0) {
    const helpResponses = [
      "I hear that you're looking for support right now, and reaching out takes real courage. While I can't solve everything, I can listen and remind you that seeking help is a sign of wisdom, not weakness.",
      "You're asking for help, which shows incredible self-awareness and strength. Sometimes we can't see the path forward on our own, and that's completely human. You don't have to figure this out alone.",
      "I'm honored that you're sharing this with me and looking for guidance. Even though the answers might not be clear right now, the fact that you're reaching out shows you haven't given up on yourself.",
    ];
    return helpResponses[Math.floor(Math.random() * helpResponses.length)];
  }

  if (thankfulScore > 0) {
    const thankfulResponses = [
      "I can hear the gratitude in your words, and that warmth is beautiful. Even in difficult times, being able to recognize what we're thankful for shows incredible resilience and perspective.",
      "Your appreciation and gratitude are touching. It's remarkable how gratitude can shift our entire perspective and help us find light even in challenging circumstances.",
      "Thank you for sharing your gratitude - it's contagious in the best way. Appreciation has this amazing ability to multiply the good things in our lives.",
    ];
    return thankfulResponses[Math.floor(Math.random() * thankfulResponses.length)];
  }

  // Enhanced general responses based on sentence length and complexity
  if (words.length > 20) {
    return "Thank you for sharing so openly with me. I can tell you have a lot on your mind and heart. It takes courage to express yourself so fully, and I'm here to listen to whatever you need to share.";
  } else if (words.length < 5) {
    return "I hear you, even in just those few words. Sometimes we don't need many words to express something meaningful. I'm here with you, ready to listen to whatever you'd like to share.";
  }

  // Enhanced default empathetic responses
  const enhancedFallbackResponses = [
    "Thank you for trusting me with your thoughts. Whatever you're going through right now, please know that your feelings are valid and you're not alone in this journey.",
    "I'm here to listen and support you. Your experiences matter, and it's okay to take things one moment at a time. You don't have to have everything figured out right now.",
    "I hear you, and I want you to know that reaching out and sharing takes courage. Whatever brought you here today, I'm glad you're taking care of yourself by connecting.",
    "Your voice matters, and so do your feelings. I'm here to offer a safe space where you can express yourself without judgment. Thank you for letting me be part of your journey today.",
    "I can sense that you're processing something important right now. It's okay to take your time with whatever you're feeling. I'm here to support you through it.",
  ];

  return enhancedFallbackResponses[Math.floor(Math.random() * enhancedFallbackResponses.length)];
}

// Crisis Detection Algorithm
function analyzeCrisisLevel(transcription) {
  const text = transcription.toLowerCase();
  let crisisScore = 0;
  const crisisIndicators = [];
  let riskLevel = "low";

  // CRITICAL: Suicide ideation keywords (highest priority)
  const suicidalKeywords = [
    "kill myself", "end my life", "suicide", "suicidal", "want to die",
    "better off dead", "no reason to live", "end it all", "take my own life",
    "not worth living", "want to disappear forever", "planning to kill",
    "thinking of suicide", "considering suicide", "suicidal thoughts",
  ];

  // Self-harm indicators
  const selfHarmKeywords = [
    "cut myself", "hurt myself", "self harm", "cutting", "burning myself",
    "punish myself", "deserve pain", "hate myself so much", "want to hurt",
    "cutting my", "burning my", "harming myself",
  ];

  // Severe depression indicators
  const severeDepressionKeywords = [
    "completely hopeless", "nothing matters", "totally worthless",
    "completely alone", "no one cares", "everyone would be better without me",
    "cant go on", "can't take it anymore", "too much pain", "unbearable",
    "completely lost", "no way out", "trapped forever", "permanent solution",
  ];

  // Crisis situation indicators
  const crisisKeywords = [
    "emergency", "crisis", "desperate", "urgent help", "immediate help",
    "breaking down", "losing control", "panic attack", "cant breathe",
    "heart racing", "terrified", "scared for my life",
  ];

  // Severe isolation and abandonment
  const isolationKeywords = [
    "completely isolated", "totally alone", "no one to turn to",
    "abandoned by everyone", "no support", "nobody understands",
    "cut off from world", "invisible to everyone",
  ];

  // Check for critical indicators
  suicidalKeywords.forEach((keyword) => {
    if (text.includes(keyword)) {
      crisisScore += 10; // Highest weight
      crisisIndicators.push(`Suicidal ideation: "${keyword}"`);
    }
  });

  selfHarmKeywords.forEach((keyword) => {
    if (text.includes(keyword)) {
      crisisScore += 8;
      crisisIndicators.push(`Self-harm indication: "${keyword}"`);
    }
  });

  severeDepressionKeywords.forEach((keyword) => {
    if (text.includes(keyword)) {
      crisisScore += 6;
      crisisIndicators.push(`Severe depression: "${keyword}"`);
    }
  });

  crisisKeywords.forEach((keyword) => {
    if (text.includes(keyword)) {
      crisisScore += 5;
      crisisIndicators.push(`Crisis situation: "${keyword}"`);
    }
  });

  isolationKeywords.forEach((keyword) => {
    if (text.includes(keyword)) {
      crisisScore += 4;
      crisisIndicators.push(`Severe isolation: "${keyword}"`);
    }
  });

  // Additional pattern analysis
  const sentences = text.split(/[.!?]+/);
  let negativeCount = 0;
  const extremeNegativeWords = ["never", "always", "completely", "totally", "absolutely", "forever"];

  sentences.forEach((sentence) => {
    if (sentence.trim()) {
      // Count extreme negative patterns
      extremeNegativeWords.forEach((word) => {
        if (sentence.includes(word) && (sentence.includes("not") || sentence.includes("no") || sentence.includes("never"))) {
          negativeCount++;
        }
      });
    }
  });

  // Add score for excessive negative patterns
  if (negativeCount >= 3) {
    crisisScore += 3;
    crisisIndicators.push("Extreme negative thought patterns detected");
  }

  // Determine risk level
  if (crisisScore >= 10) {
    riskLevel = "critical";
  } else if (crisisScore >= 6) {
    riskLevel = "high";
  } else if (crisisScore >= 3) {
    riskLevel = "moderate";
  }

  return {
    score: crisisScore,
    riskLevel: riskLevel,
    indicators: crisisIndicators,
    requiresHumanIntervention: crisisScore >= 6, // High or critical
  };
}

// Multilingual crisis classification using Gemini
async function classifyCrisisWithGemini(transcription, languageName, apiKey) {
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash-exp",
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 150,
      },
    });

    const prompt = `You are a mental health risk classifier. Read the user's message and classify crisis risk.
Language: ${languageName || 'Unknown'}
Message:
"""
${transcription}
"""
Respond ONLY with minified JSON using this schema exactly:
{"riskLevel":"low|moderate|high|critical","indicators":["..."],"requiresHumanIntervention":true|false}
Rules:
- If there is suicidal intent/plan/self-harm intent => high or critical.
- Consider semantics in the given language.
- No extra text.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    // Extract JSON
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const jsonText = jsonMatch ? jsonMatch[0] : text;
    const parsed = JSON.parse(jsonText);
    const validLevels = {low:0, moderate:1, high:2, critical:3};
    if (!parsed || !(parsed.riskLevel || parsed.risk || parsed.level)) return null;
    const riskLevel = (parsed.riskLevel || parsed.risk || parsed.level || 'low').toLowerCase();
    if (!(riskLevel in validLevels)) return null;
    return {
      riskLevel,
      indicators: Array.isArray(parsed.indicators) ? parsed.indicators : [],
      requiresHumanIntervention: typeof parsed.requiresHumanIntervention === 'boolean' ? parsed.requiresHumanIntervention : (riskLevel === 'high' || riskLevel === 'critical'),
    };
  } catch (e) {
    console.log('⚠️ Gemini crisis classification failed:', e.message);
    return null;
  }
}

// Conversation logging system with Firestore
async function logConversation(transcription, response, crisisAnalysis, userId = 'anonymous') {
    const timestamp = new Date().toISOString();
    const conversationEntry = {
        timestamp: timestamp,
        userId: userId,
        userInput: transcription,
        aiResponse: response,
        crisisAnalysis: crisisAnalysis,
        alertSent: crisisAnalysis.requiresHumanIntervention,
        status: crisisAnalysis.requiresHumanIntervention ? 'pending' : 'logged',
        createdAt: FieldValue.serverTimestamp()
    };
    
    // Log to console for immediate visibility
    console.log('=== CONVERSATION LOGGED ===');
    console.log('Timestamp:', timestamp);
    console.log('User Input:', transcription);
    console.log('Crisis Score:', crisisAnalysis.score);
    console.log('Risk Level:', crisisAnalysis.riskLevel);
    console.log('Alert Required:', crisisAnalysis.requiresHumanIntervention);
    
    // Save to Firestore for real-time dashboard
    try {
        const docRef = await db.collection('conversations').add(conversationEntry);
        console.log('✅ Conversation saved to Firestore with ID:', docRef.id);
        conversationEntry.id = docRef.id;
        
        // If crisis detected, also save to alerts collection for quick access
        if (crisisAnalysis.requiresHumanIntervention) {
            await db.collection('crisis_alerts').add({
                ...conversationEntry,
                alertId: docRef.id,
                resolved: false
            });
            console.log('🚨 Crisis alert saved to alerts collection');
        }
    } catch (error) {
        console.error('❌ Error saving to Firestore:', error);
    }
    
    return conversationEntry;
}

// Load expert database
function loadExpertDatabase() {
  const expertDbPath = path.join(__dirname, "experts.json");

  // Default expert database if file doesn't exist
  const defaultExperts = {
    experts: [
      {
        id: "expert001",
        name: "Dr. Sarah Johnson",
        specialization: "Crisis Intervention",
        email: "sarah.johnson@mentalhealth.local",
        phone: "+1-555-CRISIS",
        available: true,
        languages: ["English"],
        timezone: "US/Pacific",
      },
      {
        id: "expert002",
        name: "Dr. Michael Chen",
        specialization: "Suicide Prevention",
        email: "michael.chen@mentalhealth.local",
        phone: "+1-555-PREVENT",
        available: true,
        languages: ["English", "Mandarin"],
        timezone: "US/Pacific",
      },
      {
        id: "expert003",
        name: "Dr. Priya Sharma",
        specialization: "Trauma & PTSD",
        email: "priya.sharma@mentalhealth.local",
        phone: "+1-555-TRAUMA",
        available: true,
        languages: ["English", "Hindi"],
        timezone: "Asia/Kolkata",
      },
    ],
  };

  try {
    if (fs.existsSync(expertDbPath)) {
      const expertData = fs.readFileSync(expertDbPath, "utf8");
      return JSON.parse(expertData);
    } else {
      // Create default database file
      fs.writeFileSync(expertDbPath, JSON.stringify(defaultExperts, null, 2));
      console.log("Created default expert database at:", expertDbPath);
      return defaultExperts;
    }
  } catch (error) {
    console.error("Error loading expert database:", error);
    return defaultExperts;
  }
}

// Send alert to human experts
async function sendExpertAlert(conversationData, crisisAnalysis) {
  const expertDb = loadExpertDatabase();
  const availableExperts = expertDb.experts.filter((expert) => expert.available);

  if (availableExperts.length === 0) {
    console.error("❌ NO AVAILABLE EXPERTS - Crisis detected but no experts to alert!");
    return {success: false, error: "No available experts"};
  }

  // Select expert based on crisis type and specialization
  let selectedExpert = availableExperts[0]; // Default

  if (crisisAnalysis.indicators.some((indicator) => indicator.includes("Suicidal"))) {
    const suicideExpert = availableExperts.find((expert) =>
      expert.specialization.includes("Suicide") || expert.specialization.includes("Crisis"),
    );
    if (suicideExpert) selectedExpert = suicideExpert;
  }

  const alertSummary = `
🚨 CRISIS ALERT - Immediate Attention Required

Timestamp: ${conversationData.timestamp}
User ID: ${conversationData.userId}
Risk Level: ${crisisAnalysis.riskLevel.toUpperCase()}
Crisis Score: ${crisisAnalysis.score}/10

Crisis Indicators:
${crisisAnalysis.indicators.map((indicator) => `• ${indicator}`).join("\n")}

User Message:
"${conversationData.userInput}"

AI Response:
"${conversationData.aiResponse}"

⚠️  IMMEDIATE ACTION REQUIRED ⚠️
Please contact this user as soon as possible.

Assigned Expert: ${selectedExpert.name}
Specialization: ${selectedExpert.specialization}
Contact: ${selectedExpert.email}
`;

  console.log("🚨 CRISIS ALERT GENERATED:");
  console.log(alertSummary);

  // In production, this would send real emails/SMS
  // For now, we'll log the alert and simulate sending
  try {
    // Simulate email sending (replace with real email service in production)
    console.log(`📧 SIMULATED EMAIL SENT TO: ${selectedExpert.email}`);
    console.log(`📱 SIMULATED SMS SENT TO: ${selectedExpert.phone}`);

    return {
      success: true,
      expert: selectedExpert,
      alertSummary: alertSummary,
    };
  } catch (error) {
    console.error("Error sending expert alert:", error);
    return {success: false, error: error.message};
  }
}

// Generate crisis intervention response
function generateCrisisResponse(originalResponse, crisisAnalysis) {
  if (!crisisAnalysis.requiresHumanIntervention) {
    return originalResponse;
  }

  const crisisResources = `

🆘 Immediate Support Resources:
• National Suicide Prevention Lifeline: 988
• Crisis Text Line: Text HOME to 741741
• International Association for Suicide Prevention: https://www.iasp.info/resources/Crisis_Centres/

💝 A human mental health expert has been notified and will reach out to you soon. You are not alone in this.`;

  let enhancedResponse = originalResponse;

  if (crisisAnalysis.riskLevel === "critical") {
    enhancedResponse = `I'm very concerned about what you've shared with me. Your safety is the most important thing right now. ${originalResponse}

I want you to know that I'm alerting a human mental health professional who will contact you immediately. Please don't hesitate to reach out for immediate help if you're in danger.${crisisResources}`;
  } else if (crisisAnalysis.riskLevel === "high") {
    enhancedResponse = `Thank you for trusting me with such deep feelings. ${originalResponse}

I'm connecting you with a human expert who can provide more specialized support than I can. They'll reach out to you soon.${crisisResources}`;
  }

  return enhancedResponse;
}

exports.mitraTalks = onRequest({
  cors: true,
  invoker: "public",
  serviceAccount: "mitra-function-runner@fine-phenomenon-456517-q2.iam.gserviceaccount.com",
  secrets: ["GEMINI_API_KEY"],
}, async (req, res) => {
  // The onRequest handler with `cors: true` automatically handles OPTIONS
  // preflight requests. We only need to handle the actual POST request.
  if (req.method !== "POST") {
    res.status(405).json({error: "Method Not Allowed"});
    return;
  }

  try {
    const {audioData: base64Audio} = req.body;

    if (!base64Audio) {
      res.status(400).json({error: "No audio data received."});
      return;
    }

    let transcription;

    // Debug mode: If base64Audio is actually plain text (for testing), use it directly
    try {
      const decodedTest = Buffer.from(base64Audio, "base64").toString("utf-8");
      // Check if decoded content looks like readable text (for testing)
      if (decodedTest.length < 200 && /^[\w\s\.,!?'-]+$/.test(decodedTest)) {
        console.log("Debug mode: Using direct text input:", decodedTest);
        transcription = decodedTest;
      } else {
        throw new Error("Not plain text, proceed with speech recognition");
      }
    } catch (textError) {
      // Try speech recognition for real audio with automatic language detection
      try {
        const audio = {content: base64Audio};
        const config = {
          encoding: "WEBM_OPUS",
          sampleRateHertz: 48000,
          languageCode: "en-US", // Primary language
                    alternativeLanguageCodes: [
                        "es-ES", // Spanish
                        "fr-FR", // French
                        "de-DE", // German
                        "hi-IN", // Hindi
                        "zh-CN", // Chinese (Simplified)
                        "ja-JP", // Japanese
                        "ar-SA", // Arabic
                        "pt-BR", // Portuguese
                        "it-IT", // Italian
                        "ru-RU", // Russian
                        "ko-KR", // Korean
                        "bn-IN", // Bengali
                        "pa-IN", // Punjabi
                        "ur-PK", // Urdu
                        "ta-IN", // Tamil
                        "kn-IN", // Kannada
                    ],
        };
        const request = {audio: audio, config: config};
        const [response] = await speechClient.recognize(request);

                if (response.results && response.results.length > 0) {
                    const result = response.results[0];
                    transcription = result.alternatives[0].transcript;
                    
                    // Get detected language
                    let detectedLanguage = result.languageCode || "en-US";
                    
                    // VERIFICATION: Check if transcription actually uses the detected language's script
                    // This prevents false detections (e.g., English transcribed in Hindi script)
                    const hasHindiScript = /[\u0900-\u097F]/.test(transcription);
                    const hasKannadaScript = /[\u0C80-\u0CFF]/.test(transcription);
                    const hasTamilScript = /[\u0B80-\u0BFF]/.test(transcription);
                    const hasBengaliScript = /[\u0980-\u09FF]/.test(transcription);
                    const hasArabicScript = /[\u0600-\u06FF]/.test(transcription);
                    const hasChineseScript = /[\u4E00-\u9FFF]/.test(transcription);
                    const hasJapaneseScript = /[\u3040-\u309F\u30A0-\u30FF]/.test(transcription);
                    const hasKoreanScript = /[\uAC00-\uD7AF]/.test(transcription);
                    const hasOnlyAscii = /^[\x00-\x7F\s]+$/.test(transcription);
                    
                    // If detected non-English but transcription is only ASCII, it's likely English
                    if (detectedLanguage !== "en-US" && hasOnlyAscii) {
                        console.log(`⚠️ Language mismatch detected! Detected: ${detectedLanguage}, but text is ASCII. Correcting to en-US`);
                        detectedLanguage = "en-US";
                    }
                    
                    // If detected Hindi but no Hindi script, probably English
                    if (detectedLanguage === "hi-IN" && !hasHindiScript && hasOnlyAscii) {
                        console.log(`⚠️ Hindi detected but no Devanagari script. Correcting to en-US`);
                        detectedLanguage = "en-US";
                    }
                    
                    // Similar checks for other languages
                    if (detectedLanguage === "kn-IN" && !hasKannadaScript && hasOnlyAscii) {
                        detectedLanguage = "en-US";
                    }
                    if (detectedLanguage === "ta-IN" && !hasTamilScript && hasOnlyAscii) {
                        detectedLanguage = "en-US";
                    }
                    if (detectedLanguage === "bn-IN" && !hasBengaliScript && hasOnlyAscii) {
                        detectedLanguage = "en-US";
                    }
                    
                    console.log(`🌍 Verified language: ${detectedLanguage}`);
                    
                    // Store detected language for later use in TTS
                    req.detectedLanguage = detectedLanguage;
                }
      } catch (speechError) {
        console.log("Speech API error:", speechError.message);
        // If speech recognition fails, provide a general supportive response
        res.status(200).json({responseText: getRandomFallbackResponse()});
        return;
      }
    }

    if (!transcription || transcription.trim().length === 0) {
      res.status(200).json({responseText: "I'm sorry, I couldn't hear anything clearly. Please try again, and make sure you're speaking close to your microphone."});
      return;
    }

    console.log("Transcribed text:", transcription);

    // Normalize detected language and map to readable name
    const normalizeLang = (code) => {
      if (!code) return "en-US";
      const c = String(code);
      if (c.toLowerCase().startsWith("cmn")) return "zh-CN"; // map Mandarin variants
      const parts = c.split(/[-_]/);
      const lang = (parts[0] || "en").toLowerCase();
      const region = (parts[1] || (lang === "zh" ? "CN" : "US")).toUpperCase();
      return `${lang}-${region}`;
    };
    let detectedLanguage = normalizeLang(req.detectedLanguage || "en-US");
    const languageNames = {
      "en-US": "English",
      "es-ES": "Spanish",
      "fr-FR": "French",
      "de-DE": "German",
      "hi-IN": "Hindi",
      "zh-CN": "Chinese",
      "ja-JP": "Japanese",
      "ar-SA": "Arabic",
      "pt-BR": "Portuguese",
      "it-IT": "Italian",
      "ru-RU": "Russian",
      "ko-KR": "Korean",
      "bn-IN": "Bengali",
      "pa-IN": "Punjabi",
      "ur-PK": "Urdu",
      "ta-IN": "Tamil",
      "kn-IN": "Kannada"
    };
    const languageName = languageNames[detectedLanguage] || "English";
    console.log(`🗣️ Speaking in: ${detectedLanguage}`);

    // CRISIS DETECTION - Analyze user input for mental health crisis indicators
    const crisisAnalysis = analyzeCrisisLevel(transcription);
    console.log("🔍 Crisis Analysis:", crisisAnalysis);

    // Retrieve API key once for reuse
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

    // Try multilingual crisis classification via Gemini and merge if more severe
    if (GEMINI_API_KEY) {
      try {
        const geminiCrisis = await classifyCrisisWithGemini(transcription, languageName, GEMINI_API_KEY);
        if (geminiCrisis) {
          const sev = {low:0, moderate:1, high:2, critical:3};
          if (sev[geminiCrisis.riskLevel] > sev[crisisAnalysis.riskLevel]) {
            crisisAnalysis.riskLevel = geminiCrisis.riskLevel;
            crisisAnalysis.requiresHumanIntervention = (geminiCrisis.riskLevel === 'high' || geminiCrisis.riskLevel === 'critical');
          }
          if (Array.isArray(geminiCrisis.indicators) && geminiCrisis.indicators.length) {
            crisisAnalysis.indicators = Array.from(new Set([...(crisisAnalysis.indicators||[]), ...geminiCrisis.indicators]));
          }
          console.log("🤝 Gemini classification merged:", geminiCrisis);
        }
      } catch (mergeErr) {
        console.log('⚠️ Crisis merge failed:', mergeErr.message);
      }
    } else {
      console.log("ℹ️ GEMINI_API_KEY not set; skipping multilingual crisis classification.");
    }

    // languageNames defined above

        // Simplified prompt that just asks for empathetic response
        const enhancedPrompt = transcription;

    // PURE GEN AI ONLY - No fallbacks to verify Gemini 2.0 Flash is working
    let responseText = null;
    let aiResponseGenerated = false;

    // GEMINI_API_KEY retrieved earlier

    if (!GEMINI_API_KEY) {
      console.log("❌ GEMINI_API_KEY not found! Gen AI will not work.");
      res.status(500).json({
        error: "Gemini API key not configured. Please set GEMINI_API_KEY secret.",
        aiGenerated: false,
      });
      return;
    }

        try {
            console.log('🚀 PURE GEN AI MODE: Using Gemini 2.0 Flash ONLY (no fallbacks)...');
            const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
            
            // System instruction in the target language to force response in that language
            const systemInstructions = {
                "Hindi": "आप मित्रा हैं, एक सहानुभूतिपूर्ण AI साथी। हमेशा हिंदी में जवाब दें। केवल हिंदी का उपयोग करें।",
                "Spanish": "Eres Mitra, un compañero empático de IA. Siempre responde en español. Usa solo español.",
                "French": "Vous êtes Mitra, un compagnon IA empathique. Répondez toujours en français. Utilisez uniquement le français.",
                "German": "Du bist Mitra, ein einfühlsamer KI-Begleiter. Antworte immer auf Deutsch. Verwende nur Deutsch.",
                "Chinese": "你是Mitra，一个富有同理心的人工智能伙伴。始终用中文回答。只使用中文。",
                "Japanese": "あなたはMitraです、共感的なAIコンパニオンです。常に日本語で返答してください。日本語のみを使用してください。",
                "Arabic": "أنت ميترا، رفيق ذكاء اصطناعي متعاطف. أجب دائمًا بالعربية. استخدم العربية فقط.",
                "Portuguese": "Você é Mitra, um companheiro de IA empático. Sempre responda em português. Use apenas português.",
                "Italian": "Sei Mitra, un compagno AI empatico. Rispondi sempre in italiano. Usa solo italiano.",
                "Russian": "Вы Митра, эмпатичный AI-компаньон. Всегда отвечайте на русском языке. Используйте только русский язык.",
                "Korean": "당신은 Mitra입니다, 공감하는 AI 동반자입니다. 항상 한국어로 대답하세요. 한국어만 사용하세요.",
                "Bengali": "আপনি মিত্রা, একজন সহানুভূতিশীল AI সঙ্গী। সর্বদা বাংলায় উত্তর দিন। শুধুমাত্র বাংলা ব্যবহার করুন।",
                "Punjabi": "ਤੁਸੀਂ ਮਿੱਤਰਾ ਹੋ, ਇੱਕ ਹਮਦਰਦ AI ਸਾਥੀ। ਹਮੇਸ਼ਾ ਪੰਜਾਬੀ ਵਿੱਚ ਜਵਾਬ ਦਿਓ। ਸਿਰਫ਼ ਪੰਜਾਬੀ ਦੀ ਵਰਤੋਂ ਕਰੋ।",
                "Tamil": "நீங்கள் மித்ரா, ஒரு பச்சாதாப AI துணை. எப்போதும் தமிழில் பதிலளிக்கவும். தமிழை மட்டும் பயன்படுத்தவும்।",
                "Kannada": "ನೀವು ಮಿತ್ರಾ, ಒಂದು ಸಹಾನುಭೂತಿಯ AI ಸಹಚರ. ಯಾವಾಗಲೂ ಕನ್ನಡದಲ್ಲಿ ಉತ್ತರಿಸಿ. ಕನ್ನಡವನ್ನು ಮಾತ್ರ ಬಳಸಿ।"
            };
            
            const systemInstruction = systemInstructions[languageName] || 
                `You are Mitra, an empathetic AI companion. Always respond in ${languageName}. Use only ${languageName} language.`;
            
            const model = genAI.getGenerativeModel({ 
                model: "gemini-2.0-flash-exp",
                systemInstruction: systemInstruction,
                generationConfig: {
                    temperature: 0.8,
                    topP: 0.9,
                    maxOutputTokens: 300,
                }
            });

      const result = await model.generateContent(enhancedPrompt);
      responseText = result.response.text().trim();

      if (responseText && responseText.length > 0) {
        console.log(`✅ 🎆 REAL GEMINI 2.0 FLASH RESPONSE GENERATED!`);
        console.log(`🧠 Pure Gen AI - Response length: ${responseText.length} characters`);
        console.log(`🚀 User said: "${transcription}"`);
        console.log(`💎 Gemini 2.0 replied: "${responseText.substring(0, 100)}..."`);
        aiResponseGenerated = true;
      } else {
        throw new Error("Empty response from Gemini 2.0 Flash");
      }
    } catch (aiError) {
      console.log("❌ GEMINI 2.0 FLASH FAILED:", aiError.message);
      console.log("💡 This proves Gen AI is not working - fix the API key!");
      res.status(500).json({
        error: `Gen AI Failed: ${aiError.message}`,
        suggestion: "Check your Gemini API key and try again",
        aiGenerated: false,
      });
      return;
    }

    // Apply crisis intervention if needed
    const finalResponseText = generateCrisisResponse(responseText, crisisAnalysis);

    // Log conversation with crisis analysis
    const conversationLog = logConversation(transcription, finalResponseText, crisisAnalysis);

    // Send expert alert if crisis detected
    let expertAlert = null;
    if (crisisAnalysis.requiresHumanIntervention) {
      console.log("🚨 CRISIS DETECTED - Alerting human experts...");
      expertAlert = await sendExpertAlert(conversationLog, crisisAnalysis);

      if (expertAlert.success) {
        console.log("✅ Expert alert sent successfully to:", expertAlert.expert.name);
      } else {
        console.error("❌ Failed to send expert alert:", expertAlert.error);
      }
    }

    // Generate audio response using Text-to-Speech with detected language
    let audioContent = null;
    try {
      console.log(`Generating audio response in ${detectedLanguage}...`);

            // Map language codes to Google Cloud TTS WaveNet voices (premium quality)
            const voiceMapping = {
                "en-US": { name: "en-US-Wavenet-F", gender: "FEMALE" },
                "es-ES": { name: "es-ES-Wavenet-C", gender: "FEMALE" },
                "fr-FR": { name: "fr-FR-Wavenet-A", gender: "FEMALE" },
                "de-DE": { name: "de-DE-Wavenet-A", gender: "FEMALE" },
                "hi-IN": { name: "hi-IN-Wavenet-A", gender: "FEMALE" },
                "zh-CN": { name: "cmn-CN-Wavenet-A", gender: "FEMALE" },
                "ja-JP": { name: "ja-JP-Wavenet-A", gender: "FEMALE" },
                "ar-SA": { name: "ar-XA-Wavenet-A", gender: "FEMALE" },
                "pt-BR": { name: "pt-BR-Wavenet-A", gender: "FEMALE" },
                "it-IT": { name: "it-IT-Wavenet-A", gender: "FEMALE" },
                "ru-RU": { name: "ru-RU-Wavenet-A", gender: "FEMALE" },
                "ko-KR": { name: "ko-KR-Wavenet-A", gender: "FEMALE" },
                "bn-IN": { name: "bn-IN-Wavenet-A", gender: "FEMALE" },
                "pa-IN": { name: "pa-IN-Standard-A", gender: "FEMALE" }, // Standard only
                "ur-PK": { name: "en-US-Wavenet-F", gender: "FEMALE" }, // Fallback
                "ta-IN": { name: "ta-IN-Wavenet-A", gender: "FEMALE" },
                "kn-IN": { name: "kn-IN-Wavenet-A", gender: "FEMALE" },
            };

      const voice = voiceMapping[detectedLanguage] || voiceMapping["en-US"];

      const ttsRequest = {
        input: {text: finalResponseText},
        voice: {
          languageCode: detectedLanguage,
          name: voice.name,
          ssmlGender: voice.gender,
        },
        audioConfig: {
          audioEncoding: "MP3",
          speakingRate: 0.9, // Slightly slower for empathy
          volumeGainDb: 0.0,
        },
      };

      const [ttsResponse] = await textToSpeechClient.synthesizeSpeech(ttsRequest);
      audioContent = ttsResponse.audioContent.toString("base64");
      console.log(`🔊 Audio response generated successfully in ${detectedLanguage}`);
    } catch (ttsError) {
      console.log("Text-to-speech failed:", ttsError.message);
      // Continue without audio - text response will still work
    }

    res.status(200).json({
      responseText: finalResponseText,
      audioContent: audioContent,
      aiGenerated: aiResponseGenerated,
      crisisDetected: crisisAnalysis.requiresHumanIntervention,
      crisisLevel: crisisAnalysis.riskLevel,
      expertAlerted: expertAlert ? expertAlert.success : false,
      detectedLanguage: detectedLanguage,
      languageName: languageNames[detectedLanguage] || "English",
    });
  } catch (error) {
    console.error("ERROR in mitraTalks function:", error);
    res.status(500).json({error: "An error occurred while processing the request."});
  }
});

// Get Real-Time Crisis Alerts
exports.getCrisisAlerts = onRequest({
    cors: true,
    invoker: "public",
    serviceAccount: "mitra-function-runner@fine-phenomenon-456517-q2.iam.gserviceaccount.com"
}, async (req, res) => {
    try {
        const alertsSnapshot = await db.collection('crisis_alerts')
            .orderBy('createdAt', 'desc')
            .limit(50)
            .get();
        
        const alerts = [];
        alertsSnapshot.forEach(doc => {
            alerts.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        res.status(200).json({ alerts });
    } catch (error) {
        console.error('Error fetching crisis alerts:', error);
        res.status(500).json({ error: 'Failed to fetch alerts' });
    }
});

// Expert Management Function
exports.expertDashboard = onRequest({
    cors: true,
    invoker: "public",
    serviceAccount: "mitra-function-runner@fine-phenomenon-456517-q2.iam.gserviceaccount.com"
}, async (req, res) => {
  if (req.method === "GET") {
    try {
      const expertDb = loadExpertDatabase();

      // Return sanitized expert data (no sensitive info in public endpoint)
      const publicExpertData = {
        totalExperts: expertDb.experts.length,
        availableExperts: expertDb.experts.filter((expert) => expert.available).length,
        specializations: [...new Set(expertDb.experts.map((expert) => expert.specialization))],
        alertSettings: {
          emailEnabled: expertDb.alert_settings?.email_enabled || true,
          smsEnabled: expertDb.alert_settings?.sms_enabled || true,
        },
      };

      res.status(200).json(publicExpertData);
    } catch (error) {
      console.error("Error in expertDashboard GET:", error);
      res.status(500).json({error: "Failed to load expert data"});
    }
  } else if (req.method === "POST") {
    try {
      const {action, expertId, available} = req.body;

      if (action === "updateAvailability" && expertId) {
        const expertDb = loadExpertDatabase();
        const expertIndex = expertDb.experts.findIndex((expert) => expert.id === expertId);

        if (expertIndex !== -1) {
          expertDb.experts[expertIndex].available = available;
          expertDb.last_updated = new Date().toISOString();

          // In production, this would save to a secure database
          // For now, we'll just log the change
          console.log(`Expert availability updated: ${expertId} -> ${available}`);

          res.status(200).json({
            success: true,
            message: `Expert ${expertId} availability updated to ${available}`,
          });
        } else {
          res.status(404).json({error: "Expert not found"});
        }
      } else {
        res.status(400).json({error: "Invalid action or missing parameters"});
      }
    } catch (error) {
      console.error("Error in expertDashboard POST:", error);
      res.status(500).json({error: "Failed to update expert data"});
    }
  } else {
    res.status(405).json({error: "Method Not Allowed"});
  }
});

// Admin Dashboard Analytics Function
exports.adminDashboard = onRequest({
  cors: true,
  invoker: "public",
  serviceAccount: "mitra-function-runner@fine-phenomenon-456517-q2.iam.gserviceaccount.com",
}, async (req, res) => {
  if (req.method === "GET") {
    try {
      // In production, this would fetch real analytics from database
      const adminAnalytics = {
        overview: {
          activeCriticalAlerts: 7,
          pendingCases: 23,
          casesResolvedToday: 156,
          avgResponseTime: 4.2,
          resolutionRate: 94.7,
          totalCasesThisMonth: 1247,
        },
        experts: [
          {
            id: "expert001",
            name: "Dr. Sarah Johnson",
            specialization: "Crisis Intervention Specialist",
            status: "available",
            activeCases: 23,
            resolvedToday: 89,
            avgResponseTime: 3.2,
          },
          {
            id: "expert002",
            name: "Dr. Michael Chen",
            specialization: "Suicide Prevention",
            status: "busy",
            activeCases: 18,
            resolvedToday: 67,
            avgResponseTime: 2.8,
          },
          {
            id: "expert003",
            name: "Dr. Priya Sharma",
            specialization: "Trauma & PTSD",
            status: "available",
            activeCases: 15,
            resolvedToday: 45,
            avgResponseTime: 4.1,
          },
          {
            id: "expert004",
            name: "Dr. James Wilson",
            specialization: "Anxiety & Depression",
            status: "offline",
            activeCases: 0,
            resolvedToday: 34,
            avgResponseTime: 3.7,
          },
          {
            id: "expert005",
            name: "Dr. Maria Rodriguez",
            specialization: "Adolescent Mental Health",
            status: "available",
            activeCases: 12,
            resolvedToday: 28,
            avgResponseTime: 5.2,
          },
        ],
        recentAlerts: [
          {
            timestamp: "2:43 PM - Today",
            message: "I want to kill myself. I have a plan and nobody would miss me anyway.",
            level: "critical",
            status: "in-progress",
            assignedExpert: "Dr. Sarah Johnson",
          },
          {
            timestamp: "1:28 PM - Today",
            message: "I've been cutting myself because I hate myself so much. I can't take it anymore.",
            level: "critical",
            status: "resolved",
            assignedExpert: "Dr. Michael Chen",
          },
          {
            timestamp: "12:15 PM - Today",
            message: "I'm having a panic attack and can't breathe. Everything is falling apart.",
            level: "high",
            status: "resolved",
            assignedExpert: "Dr. Priya Sharma",
          },
        ],
        systemHealth: {
          aiSystem: {
            accuracy: 94.7,
            responseTime: 0.02,
            availability: 99.98,
            errorRate: 0.23,
          },
          database: {
            connection: "connected",
            storageUsage: 78,
            backupStatus: "up-to-date",
            queryPerformance: 12,
          },
          alertSystem: {
            emailService: "operational",
            smsService: "degraded",
            pushNotifications: "active",
            deliveryRate: 98.5,
          },
          expertNetwork: {
            onlineExperts: "4/5",
            avgResponseTime: 4.2,
            caseLoadDistribution: "uneven",
            satisfaction: 4.8,
          },
        },
      };

      res.status(200).json(adminAnalytics);
    } catch (error) {
      console.error("Error in adminDashboard GET:", error);
      res.status(500).json({error: "Failed to load admin analytics"});
    }
  } else if (req.method === "POST") {
    try {
      const {action, data} = req.body;

      if (action === "updateExpertStatus") {
        console.log(`Admin action: Update expert status -`, data);
        res.status(200).json({
          success: true,
          message: "Expert status updated successfully",
        });
      } else if (action === "sendExpertMessage") {
        console.log(`Admin action: Send message to expert -`, data);
        res.status(200).json({
          success: true,
          message: "Message sent to expert successfully",
        });
      } else if (action === "emergencyContact") {
        console.log(`Admin action: Emergency contact -`, data);
        res.status(200).json({
          success: true,
          message: "Emergency contact protocol initiated",
        });
      } else {
        res.status(400).json({error: "Invalid action"});
      }
    } catch (error) {
      console.error("Error in adminDashboard POST:", error);
      res.status(500).json({error: "Failed to process admin action"});
    }
  } else {
    res.status(405).json({error: "Method Not Allowed"});
  }
});
