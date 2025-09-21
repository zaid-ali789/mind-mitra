const {onRequest} = require("firebase-functions/v2/https");
const {setGlobalOptions} = require("firebase-functions/v2");
const { SpeechClient } = require("@google-cloud/speech");
const { VertexAI } = require("@google-cloud/vertexai");

// Set global options for the function region
setGlobalOptions({ region: "asia-southeast1" });

// Initialize clients
const speechClient = new SpeechClient();
const vertex_ai = new VertexAI({ project: "fine-phenomenon-456517-q2", location: "asia-southeast1" });
const generativeModel = vertex_ai.getGenerativeModel({ model: "gemini-1.5-flash-001" });

exports.mitraTalks = onRequest({
        cors: true,
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

        const audio = {content: base64Audio};
        const config = {
            encoding: "WEBM_OPUS",
            sampleRateHertz: 48000,
            languageCode: "en-US",
        };
        const request = {audio: audio, config: config};
        const [response] = await speechClient.recognize(request);
        const transcription = response.results
            .map((result) => result.alternatives[0].transcript)
            .join("\n");

        if (!transcription) {
            res.status(200).json({responseText: "I'm sorry, I couldn't hear anything. Please try again."});
            return;
        }

        const prompt = `You are Mitra, an empathetic wellness companion. A user said this: "${transcription}". Respond in a short, kind, and supportive way.`;
        const result = await generativeModel.generateContent(prompt);
        const geminiResponse = result.response.candidates[0].content.parts[0].text;

        res.status(200).json({responseText: geminiResponse});
    } catch (error) {
        console.error("ERROR in mitraTalks function:", error);
        res.status(500).json({error: "An error occurred while processing the request."});
    }
});