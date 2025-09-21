const recordButton = document.getElementById('recordButton');
const statusText = document.getElementById('status');
const responseContainer = document.getElementById('responseContainer');
const audioVisualizer = document.getElementById('audioVisualizer');

let mediaRecorder;
let audioChunks = [];
let stream;
let isRecording = false;

// Auto-detect environment - use localhost for development
const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const functionUrl = isDevelopment 
    ? 'http://127.0.0.1:5001/fine-phenomenon-456517-q2/us-central1/mitraTalks'
    : 'https://us-central1-fine-phenomenon-456517-q2.cloudfunctions.net/mitraTalks';

function showLoading() {
    responseContainer.innerHTML = `
        <div class="loading">
            <div class="loading-dots">
                <div></div>
                <div></div>
                <div></div>
            </div>
        </div>
    `;
}

function showResponse(text) {
    responseContainer.innerHTML = `<div class="response-text">${text}</div>`;
}

function showError(message) {
    responseContainer.innerHTML = `<div class="response-text" style="color: #e74c3c; border-left-color: #e74c3c;">${message}</div>`;
}

// Mouse events for desktop
recordButton.addEventListener('mousedown', startRecording);
recordButton.addEventListener('mouseup', stopRecording);
recordButton.addEventListener('mouseleave', stopRecording); // Stop if mouse leaves button

// Touch events for mobile
recordButton.addEventListener('touchstart', (e) => {
    e.preventDefault();
    startRecording();
});
recordButton.addEventListener('touchend', (e) => {
    e.preventDefault();
    stopRecording();
});
recordButton.addEventListener('touchcancel', (e) => {
    e.preventDefault();
    stopRecording();
});

async function startRecording() {
    if (isRecording) return;
    
    try {
        // Request microphone access
        stream = await navigator.mediaDevices.getUserMedia({ 
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                sampleRate: 48000
            } 
        });
        
        mediaRecorder = new MediaRecorder(stream, { 
            mimeType: 'audio/webm;codecs=opus' 
        });
        
        isRecording = true;
        audioChunks = [];
        
        // Update UI
        recordButton.classList.add('recording');
        statusText.textContent = "Listening... (Release to send)";
        audioVisualizer.classList.add('active');
        
        mediaRecorder.ondataavailable = event => {
            if (event.data.size > 0) {
                audioChunks.push(event.data);
            }
        };
        
        mediaRecorder.start();
        
    } catch (error) {
        console.error("Error accessing microphone:", error);
        statusText.textContent = "Could not access microphone. Please check permissions.";
        showError("Microphone access denied. Please allow microphone access and refresh the page.");
        isRecording = false;
    }
}

function stopRecording() {
    if (!isRecording || !mediaRecorder) return;
    
    if (mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
        
        // Update UI immediately
        recordButton.classList.remove('recording');
        statusText.textContent = "Processing your message...";
        audioVisualizer.classList.remove('active');
        showLoading();
        
        // Stop microphone stream
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
        
        mediaRecorder.onstop = async () => {
            try {
                const audioBlob = new Blob(audioChunks, { type: 'audio/webm;codecs=opus' });
                
                if (audioBlob.size === 0) {
                    throw new Error("No audio data recorded");
                }
                
                const reader = new FileReader();
                reader.readAsDataURL(audioBlob);
                reader.onloadend = async () => {
                    try {
                        const base64Audio = reader.result.split(',')[1];
                        
                        statusText.textContent = "Mitra is thinking...";
                        
                        const response = await fetch(functionUrl, {
                            method: 'POST',
                            headers: { 
                                'Content-Type': 'application/json',
                                'Accept': 'application/json'
                            },
                            body: JSON.stringify({ audioData: base64Audio })
                        });
                        
                        const result = await response.json();
                        
                        if (!response.ok) {
                            const errorMessage = result.error || `Server error: ${response.status}`;
                            throw new Error(errorMessage);
                        }
                        
                        statusText.textContent = "Hold the microphone to speak to Mitra";
                        showResponse(result.responseText);
                        
                    } catch (error) {
                        console.error("Error calling Cloud Function:", error);
                        statusText.textContent = "Something went wrong. Please try again.";
                        showError(`Error: ${error.message}`);
                    }
                };
                
                reader.onerror = () => {
                    statusText.textContent = "Error processing audio. Please try again.";
                    showError("Failed to process audio data");
                };
                
            } catch (error) {
                console.error("Error processing recording:", error);
                statusText.textContent = "Error processing recording. Please try again.";
                showError(error.message);
            } finally {
                isRecording = false;
            }
        };
    }
}

// Keyboard accessibility
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && !isRecording) {
        e.preventDefault();
        startRecording();
    }
});

document.addEventListener('keyup', (e) => {
    if (e.code === 'Space' && isRecording) {
        e.preventDefault();
        stopRecording();
    }
});

// Environment info for debugging
console.log('🌍 Environment:', isDevelopment ? 'Development' : 'Production');
console.log('🔗 Function URL:', functionUrl);
console.log('📅 App loaded at:', new Date().toISOString());
console.log('🌐 Current hostname:', window.location.hostname);
console.log('📍 Current URL:', window.location.href);
