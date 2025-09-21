const {onRequest} = require("firebase-functions/v2/https");
const {setGlobalOptions} = require("firebase-functions/v2");
const { SpeechClient } = require("@google-cloud/speech");
const { VertexAI } = require("@google-cloud/vertexai");

// Set global options for the function region
setGlobalOptions({ region: "us-central1" });

// Initialize clients
const speechClient = new SpeechClient();
const vertex_ai = new VertexAI({ project: "fine-phenomenon-456517-q2", location: "us-central1" });

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
    
    // Context-aware responses based on keywords
    if (text.includes('sad') || text.includes('down') || text.includes('depressed')) {
        return "I hear that you're feeling sad right now. It's okay to feel this way, and I want you to know that these feelings are temporary. You're stronger than you know.";
    }
    
    if (text.includes('anxious') || text.includes('worried') || text.includes('nervous')) {
        return "I understand you're feeling anxious. Take a deep breath with me. You're safe right now, and we can work through this together, one step at a time.";
    }
    
    if (text.includes('stressed') || text.includes('overwhelmed')) {
        return "It sounds like you're carrying a lot right now. Remember, it's okay to take breaks and ask for help. You don't have to handle everything on your own.";
    }
    
    if (text.includes('angry') || text.includes('mad') || text.includes('frustrated')) {
        return "I can sense your frustration, and those feelings are completely valid. It's important to acknowledge what you're feeling. Take your time to process this.";
    }
    
    if (text.includes('lonely') || text.includes('alone')) {
        return "You're not alone, even when it feels that way. I'm here with you, and there are people who care about you. Your feelings matter.";
    }
    
    if (text.includes('tired') || text.includes('exhausted')) {
        return "It sounds like you're really tired. Rest is so important for healing. Be gentle with yourself and take the time you need to recharge.";
    }
    
    if (text.includes('happy') || text.includes('good') || text.includes('great')) {
        return "I'm so glad to hear there's some positivity in your day! It's wonderful when we can recognize and celebrate the good moments, even the small ones.";
    }
    
    // Default empathetic response
    return getRandomFallbackResponse();
}

exports.mitraTalks = onRequest({
        cors: true,
        invoker: "public",
        serviceAccount: "mitra-function-runner@fine-phenomenon-456517-q2.iam.gserviceaccount.com",
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
        
        // Try speech recognition first
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

        if (!transcription || transcription.trim().length === 0) {
            res.status(200).json({responseText: "I'm sorry, I couldn't hear anything clearly. Please try again, and make sure you're speaking close to your microphone."});
            return;
        }

        console.log("Transcribed text:", transcription);

        // Try to use AI, but fall back to predefined responses if it fails
        let responseText;
        try {
            const generativeModel = vertex_ai.getGenerativeModel({ model: "gemini-1.5-flash" });
            const prompt = `You are Mitra, an empathetic wellness companion. A user said this: "${transcription}". Respond in a short, kind, and supportive way.`;
            const result = await generativeModel.generateContent(prompt);
            responseText = result.response.candidates[0].content.parts[0].text;
            console.log("AI response generated successfully");
        } catch (aiError) {
            console.log("AI model not available, using fallback response:", aiError.message);
            // Use a contextual fallback response based on transcription
            responseText = getContextualResponse(transcription);
        }

        res.status(200).json({responseText: responseText});
    } catch (error) {
        console.error("ERROR in mitraTalks function:", error);
        res.status(500).json({error: "An error occurred while processing the request."});
    }
});