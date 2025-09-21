# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

Mitra by Awaaz AI is a voice-enabled wellness companion web application. It consists of:
- **Frontend**: Static web application (`public/`) that captures audio via browser MediaRecorder API
- **Backend**: Firebase Cloud Functions (`functions/`) that process speech-to-text and generate AI responses
- **Hosting**: Firebase Hosting for static content delivery

## Architecture

### Core Components
1. **Audio Processing Pipeline**: Browser → MediaRecorder (WebM/Opus) → Base64 encoding → Cloud Function
2. **Speech Recognition**: Google Cloud Speech API for transcribing audio to text
3. **AI Response Generation**: Google Vertex AI (Gemini 1.5 Flash) for generating empathetic responses
4. **Service Integration**: Firebase ecosystem (Functions v2, Hosting, with us-central1 region)

### Key Files
- `functions/index.js` - Main Cloud Function (`mitraTalks`) handling the complete pipeline
- `public/app.js` - Frontend JavaScript managing audio recording and API communication
- `public/index.html` - Simple UI with push-to-talk functionality
- `firebase.json` - Firebase project configuration including hosting and functions setup

## Development Commands

### Local Development
```bash
# Install Firebase CLI globally (if not installed)
npm install -g firebase-tools

# Install function dependencies
cd functions && npm install

# Start local emulator (functions + hosting)
firebase emulators:start

# Start only functions emulator
firebase emulators:start --only functions

# Start only hosting emulator
firebase emulators:start --only hosting
```

### Testing & Linting
```bash
# Lint Cloud Functions code
cd functions && npm run lint

# Run function in interactive shell
cd functions && npm run shell

# View function logs (local)
firebase emulators:logs

# View deployed function logs
cd functions && npm run logs
```

### Deployment
```bash
# Deploy everything (functions + hosting)
firebase deploy

# Deploy only functions
cd functions && npm run deploy
# OR: firebase deploy --only functions

# Deploy only hosting
firebase deploy --only hosting
```

### Project Management
```bash
# Login to Firebase
firebase login

# Set active project
firebase use fine-phenomenon-456517-q2

# View current project status
firebase projects:list
```

## Architecture Patterns

### Audio Processing Flow
1. **Capture**: MediaRecorder API captures audio in WebM/Opus format (48kHz sample rate)
2. **Encoding**: FileReader converts audio blob to base64 for transmission
3. **Transmission**: POST request to Cloud Function with base64 audio payload
4. **Processing**: Cloud Function decodes, sends to Speech API, processes with Vertex AI
5. **Response**: JSON response with generated text displayed in frontend

### Error Handling Strategy
- Frontend handles microphone access errors and network failures gracefully
- Cloud Function includes comprehensive try-catch with specific error messages
- CORS enabled for cross-origin requests during development

### Service Account Configuration
- Functions use specific service account: `mitra-function-runner@fine-phenomenon-456517-q2.iam.gserviceaccount.com`
- Region locked to `us-central1` for both functions and AI services

## Firebase Configuration

### Project Details
- **Project ID**: fine-phenomenon-456517-q2
- **Functions Region**: us-central1
- **Hosting**: Single-page application with catch-all routing

### Local Development URLs
- **Frontend**: http://localhost:5000 (Firebase Hosting emulator)
- **Functions**: http://127.0.0.1:5001/fine-phenomenon-456517-q2/us-central1/mitraTalks

### Dependencies
**Cloud Functions**:
- `@google-cloud/speech`: ^7.2.0 (Speech-to-text)
- `@google-cloud/vertexai`: ^1.10.0 (AI text generation)
- `firebase-admin`: ^12.6.0 (Firebase services)
- `firebase-functions`: ^6.0.1 (Functions runtime v2)

**Development**:
- `eslint`: ^8.15.0 (Code linting)
- `eslint-config-google`: ^0.14.0 (Google coding standards)

## AI Model Configuration

### Speech Recognition Settings
- **Encoding**: WEBM_OPUS
- **Sample Rate**: 48000 Hz
- **Language**: en-US
- **API**: Google Cloud Speech-to-Text

### Text Generation Settings
- **Model**: gemini-1.5-flash
- **Persona**: Empathetic wellness companion named "Mitra"
- **Response Style**: Short, kind, and supportive
- **Service**: Google Vertex AI

## Development Workflow

### Making Changes to Functions
1. Edit `functions/index.js`
2. Run `cd functions && npm run lint` to check code style
3. Test locally with `firebase emulators:start --only functions`
4. Deploy with `cd functions && npm run deploy`

### Making Changes to Frontend
1. Edit files in `public/` directory
2. Test locally with `firebase emulators:start --only hosting`
3. Deploy with `firebase deploy --only hosting`

### Testing the Complete Flow
1. Start full emulator: `firebase emulators:start`
2. Open browser to http://localhost:5000
3. Click and hold "Hold to Speak" button
4. Speak into microphone
5. Release button and wait for Mitra's response

## Debugging

### Common Issues
- **Microphone not accessible**: Check browser permissions and HTTPS requirements
- **Function timeout**: Audio files too long (increase function timeout if needed)
- **CORS errors**: Ensure `cors: true` is set in function configuration
- **Empty transcription**: Check audio format compatibility and Speech API configuration

### Log Monitoring
- Local: `firebase emulators:logs`
- Production: `firebase functions:log` or Google Cloud Console