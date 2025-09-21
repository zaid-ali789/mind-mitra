const recordButton = document.getElementById('recordButton');
const statusText = document.getElementById('status');
const responseContainer = document.getElementById('responseContainer');

let mediaRecorder;
let audioChunks = [];
let stream; // To hold the microphone stream

// Get your local function URL from the emulator startup logs
// It will look like: http://127.0.0.1:5001/your-project-name/us-central1/mitraTalks
const functionUrl = 'http://127.0.0.1:5001/fine-phenomenon-456517-q2/asia-southeast1/mitraTalks';

recordButton.addEventListener('mousedown', async () => {
    try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
        mediaRecorder.start();
        statusText.textContent = "Listening...";
        audioChunks = [];

        mediaRecorder.ondataavailable = event => {
            audioChunks.push(event.data);
        };
    } catch (error) {
        console.error("Error accessing microphone:", error);
        statusText.textContent = "Could not access microphone.";
    }
});

recordButton.addEventListener('mouseup', () => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
        statusText.textContent = "Thinking...";

        // Stop the microphone stream tracks to turn off the browser's recording indicator and release the resource
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }

        mediaRecorder.onstop = async () => {
            const audioBlob = new Blob(audioChunks, { type: 'audio/webm;codecs=opus' });

            const reader = new FileReader();
            reader.readAsDataURL(audioBlob);
            reader.onloadend = async () => {
                const base64Audio = reader.result.split(',')[1];

                try {
                    const response = await fetch(functionUrl, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ audioData: base64Audio })
                    });

                    const result = await response.json();

                    if (!response.ok) {
                        // Use the server's error message if available, otherwise a generic one
                        const errorMessage = result.error || `HTTP error! status: ${response.status}`;
                        throw new Error(errorMessage);
                    }

                    statusText.textContent = "Mitra has responded. Hold to speak again.";
                    responseContainer.textContent = result.responseText;
                } catch (error) {
                    console.error("Error calling Cloud Function:", error);
                    statusText.textContent = "Sorry, something went wrong.";
                    responseContainer.textContent = `Error: ${error.message}`;
                }
            };
        };
    }
});