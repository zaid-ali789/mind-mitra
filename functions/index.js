const {onRequest} = require("firebase-functions/v2/https");
const {setGlobalOptions} = require("firebase-functions/v2");
const { SpeechClient } = require("@google-cloud/speech");
const { TextToSpeechClient } = require("@google-cloud/text-to-speech");
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Environment variables are now managed by Firebase secrets

// Set global options for the function region
setGlobalOptions({ region: "us-central1" });

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
    "Thank you for trusting me with your thoughts. I'm here to support you."
];

function getRandomFallbackResponse() {
    return fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
}

function getContextualResponse(transcription) {
    const text = transcription.toLowerCase();
    const words = text.split(/\s+/);
    
    // Advanced sentiment analysis with multiple keywords
    const sadKeywords = ['sad', 'down', 'depressed', 'miserable', 'hopeless', 'blue', 'low'];
    const anxiousKeywords = ['anxious', 'worried', 'nervous', 'panic', 'scared', 'fear', 'terror'];
    const stressedKeywords = ['stressed', 'overwhelmed', 'pressure', 'burden', 'too much', 'overload'];
    const angryKeywords = ['angry', 'mad', 'frustrated', 'furious', 'annoyed', 'upset', 'irritated'];
    const lonelyKeywords = ['lonely', 'alone', 'isolated', 'abandoned', 'empty', 'disconnected'];
    const tiredKeywords = ['tired', 'exhausted', 'drained', 'weary', 'fatigued', 'burned out'];
    const happyKeywords = ['happy', 'good', 'great', 'wonderful', 'amazing', 'fantastic', 'joyful', 'excited'];
    const helpKeywords = ['help', 'support', 'need', 'stuck', 'lost', 'confused', 'advice'];
    const thankfulKeywords = ['thank', 'grateful', 'appreciate', 'blessing', 'lucky', 'fortunate'];
    
    // Check for multiple matches to provide more nuanced responses
    const matchCount = (keywords) => keywords.filter(keyword => text.includes(keyword)).length;
    
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
            "I can sense the weight you're carrying right now. Sadness can feel overwhelming, but please know that you're not alone in this darkness. There is light ahead, even when it's hard to see."
        ];
        return sadResponses[Math.floor(Math.random() * sadResponses.length)];
    }
    
    if (anxiousScore > 0) {
        const anxiousResponses = [
            "I understand you're feeling anxious. Let's ground ourselves together - notice five things you can see, four things you can touch, three things you can hear. You're safe in this moment.",
            "Anxiety can make everything feel urgent and overwhelming. Let's slow down together. Take three deep breaths with me. You've gotten through difficult times before, and you can get through this too.",
            "I hear the worry in your voice. Anxiety often makes us imagine the worst outcomes, but remember - thoughts are not facts. You have more strength and resources than your anxiety wants you to believe."
        ];
        return anxiousResponses[Math.floor(Math.random() * anxiousResponses.length)];
    }
    
    if (stressedScore > 0) {
        const stressedResponses = [
            "It sounds like you're carrying a tremendous load right now. Stress can make us feel like we need to handle everything perfectly, but that's not realistic or fair to yourself. What's one small thing you can let go of today?",
            "I can hear how overwhelmed you are. When stress builds up, it helps to remember that you don't have to solve everything at once. Let's focus on just the next small step you can take.",
            "You're dealing with so much pressure right now. It's completely understandable that you feel stressed. Remember, asking for help isn't giving up - it's being smart about your resources."
        ];
        return stressedResponses[Math.floor(Math.random() * stressedResponses.length)];
    }
    
    if (angryScore > 0) {
        const angryResponses = [
            "I can feel the intensity of your frustration, and those feelings are completely valid. Anger often signals that something important to you has been threatened or violated. It's okay to feel this way.",
            "Your anger is telling you something important - that a boundary has been crossed or that something isn't right. Let's honor that feeling while finding healthy ways to process it.",
            "I hear the fire in your words, and I understand you're dealing with something that feels deeply unfair. Your anger has a message - let's listen to what it's trying to tell you."
        ];
        return angryResponses[Math.floor(Math.random() * angryResponses.length)];
    }
    
    if (lonelyScore > 0) {
        const lonelyResponses = [
            "Loneliness can feel like a deep ache, like you're invisible to the world. But right now, in this moment, you're not alone - I'm here with you, and I see you. Your feelings and experiences matter.",
            "I understand that feeling of being isolated and disconnected. Even when we're surrounded by people, we can still feel profoundly alone. You're reaching out right now, and that takes courage.",
            "The emptiness you're feeling is real and difficult. Sometimes loneliness makes us feel like we don't belong anywhere, but you belong here, in this conversation, and in this world. You matter."
        ];
        return lonelyResponses[Math.floor(Math.random() * lonelyResponses.length)];
    }
    
    if (tiredScore > 0) {
        const tiredResponses = [
            "I can hear the exhaustion in your words. Being tired isn't just about sleep - sometimes it's emotional, mental, or spiritual fatigue. You've been working hard, and it's okay to rest.",
            "It sounds like you're running on empty right now. Fatigue is your body and mind's way of asking for care. What would it look like to be gentle with yourself today?",
            "You sound so weary, and that makes complete sense given what you've been through. Rest isn't a luxury - it's necessary for healing and growth. You deserve to recharge."
        ];
        return tiredResponses[Math.floor(Math.random() * tiredResponses.length)];
    }
    
    if (happyScore > 0) {
        const happyResponses = [
            "It's wonderful to hear some joy in your voice! Happiness is such a gift, and I'm glad you're experiencing this positive moment. These bright spots are important to celebrate and hold onto.",
            "Your happiness is contagious - I can feel the lightness in your words. It's beautiful when we can recognize and embrace the good in our lives, even the small moments of joy.",
            "I love hearing the positivity in what you're sharing! These moments of happiness are like sunshine for the soul. Thank you for bringing some light into this conversation."
        ];
        return happyResponses[Math.floor(Math.random() * happyResponses.length)];
    }
    
    if (helpScore > 0) {
        const helpResponses = [
            "I hear that you're looking for support right now, and reaching out takes real courage. While I can't solve everything, I can listen and remind you that seeking help is a sign of wisdom, not weakness.",
            "You're asking for help, which shows incredible self-awareness and strength. Sometimes we can't see the path forward on our own, and that's completely human. You don't have to figure this out alone.",
            "I'm honored that you're sharing this with me and looking for guidance. Even though the answers might not be clear right now, the fact that you're reaching out shows you haven't given up on yourself."
        ];
        return helpResponses[Math.floor(Math.random() * helpResponses.length)];
    }
    
    if (thankfulScore > 0) {
        const thankfulResponses = [
            "I can hear the gratitude in your words, and that warmth is beautiful. Even in difficult times, being able to recognize what we're thankful for shows incredible resilience and perspective.",
            "Your appreciation and gratitude are touching. It's remarkable how gratitude can shift our entire perspective and help us find light even in challenging circumstances.",
            "Thank you for sharing your gratitude - it's contagious in the best way. Appreciation has this amazing ability to multiply the good things in our lives."
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
        "I can sense that you're processing something important right now. It's okay to take your time with whatever you're feeling. I'm here to support you through it."
    ];
    
    return enhancedFallbackResponses[Math.floor(Math.random() * enhancedFallbackResponses.length)];
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
            const decodedTest = Buffer.from(base64Audio, 'base64').toString('utf-8');
            // Check if decoded content looks like readable text (for testing)
            if (decodedTest.length < 200 && /^[\w\s\.,!?'-]+$/.test(decodedTest)) {
                console.log("Debug mode: Using direct text input:", decodedTest);
                transcription = decodedTest;
            } else {
                throw new Error("Not plain text, proceed with speech recognition");
            }
        } catch (textError) {
            // Try speech recognition for real audio
            try {
                const audio = {content: base64Audio};
                const config = {
                    encoding: "WEBM_OPUS",
                    sampleRateHertz: 48000,
                    languageCode: "en-US",
                };
                const request = {audio: audio, config: config};
                const [response] = await speechClient.recognize(request);
                transcription = response.results
                    .map((result) => result.alternatives[0].transcript)
                    .join("\n");
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

        // Enhanced prompt for Gemini 2.0 Flash - leveraging latest AI capabilities
        const enhancedPrompt = `You are Mitra, powered by Google's cutting-edge Gemini 2.0 Flash model - an AI wellness companion with unprecedented emotional intelligence and therapeutic expertise.

User's emotional expression: "${transcription}"

As an advanced AI using Gemini 2.0's enhanced reasoning capabilities, provide a personalized therapeutic response that demonstrates your sophisticated understanding. Keep it natural and conversational (2-3 sentences), but show genuine AI-powered empathy and insight.

Respond as a caring AI companion:`;

        // PURE GEN AI ONLY - No fallbacks to verify Gemini 2.0 Flash is working
        let responseText = null;
        let aiResponseGenerated = false;
        
        const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
        
        if (!GEMINI_API_KEY) {
            console.log('❌ GEMINI_API_KEY not found! Gen AI will not work.');
            res.status(500).json({
                error: 'Gemini API key not configured. Please set GEMINI_API_KEY secret.',
                aiGenerated: false
            });
            return;
        }
        
        try {
            console.log('🚀 PURE GEN AI MODE: Using Gemini 2.0 Flash ONLY (no fallbacks)...');
            const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
            const model = genAI.getGenerativeModel({ 
                model: "gemini-2.0-flash-exp",
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
                throw new Error('Empty response from Gemini 2.0 Flash');
            }
        } catch (aiError) {
            console.log('❌ GEMINI 2.0 FLASH FAILED:', aiError.message);
            console.log('💡 This proves Gen AI is not working - fix the API key!');
            res.status(500).json({
                error: `Gen AI Failed: ${aiError.message}`,
                suggestion: 'Check your Gemini API key and try again',
                aiGenerated: false
            });
            return;
        }

        // Generate audio response using Text-to-Speech
        let audioContent = null;
        try {
            console.log("Generating audio response...");
            const ttsRequest = {
                input: { text: responseText },
                voice: {
                    languageCode: 'en-US',
                    name: 'en-US-Standard-F', // Standard female voice
                    ssmlGender: 'FEMALE'
                },
                audioConfig: {
                    audioEncoding: 'MP3',
                    speakingRate: 0.9, // Slightly slower for empathy
                    volumeGainDb: 0.0
                }
            };
            
            const [ttsResponse] = await textToSpeechClient.synthesizeSpeech(ttsRequest);
            audioContent = ttsResponse.audioContent.toString('base64');
            console.log("Audio response generated successfully");
        } catch (ttsError) {
            console.log("Text-to-speech failed:", ttsError.message);
            // Continue without audio - text response will still work
        }

        res.status(200).json({
            responseText: responseText,
            audioContent: audioContent,
            aiGenerated: aiResponseGenerated
        });
    } catch (error) {
        console.error("ERROR in mitraTalks function:", error);
        res.status(500).json({error: "An error occurred while processing the request."});
    }
});