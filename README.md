# 🤗 Mitra - Your Empathetic Wellness Companion

<div align="center">

![Mitra Logo](https://img.shields.io/badge/Mitra-Wellness_Companion-ff6b6b?style=for-the-badge&logo=heart&logoColor=white)

**An AI-powered voice wellness companion that listens, understands, and provides empathetic support**

[![Firebase](https://img.shields.io/badge/Firebase-Hosting-orange?style=flat&logo=firebase)](https://firebase.google.com/)
[![Google Cloud](https://img.shields.io/badge/Google_Cloud-AI_APIs-4285f4?style=flat&logo=google-cloud)](https://cloud.google.com/)
[![Node.js](https://img.shields.io/badge/Node.js-20+-green?style=flat&logo=node.js)](https://nodejs.org/)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-yellow?style=flat&logo=javascript)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)

**🌐 [Live Demo](https://fine-phenomenon-456517-q2.web.app)**

</div>

---

## 🌟 Features

### 🎤 **Voice Interaction**
- **Push-to-talk interface** - Hold the microphone button to speak
- **Real-time audio processing** - Instant speech-to-text conversion
- **Cross-platform support** - Works on desktop, tablet, and mobile
- **Keyboard accessibility** - Use spacebar for hands-free operation

### 🤖 **Intelligent Responses**
- **AI-powered empathy** - Vertex AI (Gemini) generates contextual responses
- **Emotion recognition** - Detects sadness, anxiety, stress, and more
- **Fallback system** - Smart contextual responses when AI is unavailable
- **Always supportive** - Never leaves users without caring feedback

### 🎨 **Beautiful Design**
- **Modern gradient UI** - Calming purple/blue wellness theme
- **Responsive design** - Adapts perfectly to all screen sizes
- **Smooth animations** - Recording indicators and loading states
- **Accessibility focused** - Screen reader friendly and keyboard navigation

### ⚡ **Technical Excellence**
- **Real-time processing** - Fast speech recognition and response
- **Error resilience** - Graceful degradation at every step
- **Cache optimization** - Always fresh, never stale content
- **Production ready** - Deployed with Firebase hosting and functions

---

## 🚀 Quick Start

### 1. **Try It Live**
Visit **[https://fine-phenomenon-456517-q2.web.app](https://fine-phenomenon-456517-q2.web.app)** and start talking to Mitra!

### 2. **Local Development**

```bash
# Clone the repository
git clone https://github.com/zaid-ali789/mind-mitra.git
cd mind-mitra

# Install Firebase CLI
npm install -g firebase-tools

# Install function dependencies
cd functions && npm install && cd ..

# Start local development
firebase emulators:start
```

### 3. **Deploy Your Own**

```bash
# Login to Firebase
firebase login

# Initialize your Firebase project
firebase init

# Deploy to Firebase
firebase deploy
```

---

## 🏗️ Architecture

### **Frontend (Vanilla JavaScript)**
```
public/
├── index.html      # Main UI with modern design
├── app.js          # Voice recording and API communication
├── styles.css      # Beautiful responsive styling
└── test.html       # API testing utility
```

### **Backend (Firebase Functions)**
```
functions/
├── index.js        # Cloud Function with AI integration
├── package.json    # Node.js dependencies
└── .eslintrc.js    # Code style configuration
```

### **Configuration**
```
├── firebase.json   # Firebase project configuration
├── .firebaserc     # Firebase project settings
├── WARP.md         # Development guidance
└── README.md       # Project documentation
```

---

## 🛠️ Technology Stack

<table>
<tr>
<td><strong>Frontend</strong></td>
<td>

- **HTML5** - MediaRecorder API for audio capture
- **CSS3** - Modern responsive design with animations  
- **JavaScript (ES6+)** - Async/await, fetch API
- **Web APIs** - getUserMedia, FileReader

</td>
</tr>
<tr>
<td><strong>Backend</strong></td>
<td>

- **Firebase Functions** - Serverless Node.js runtime
- **Google Cloud Speech API** - Speech-to-text conversion
- **Google Vertex AI** - Gemini 1.5 Flash for empathetic responses
- **Firebase Hosting** - Global CDN and SSL

</td>
</tr>
<tr>
<td><strong>Development</strong></td>
<td>

- **Firebase CLI** - Local development and deployment
- **ESLint** - Code quality and Google style guide
- **Git** - Version control and GitHub integration

</td>
</tr>
</table>

---

## 💬 How It Works

### **1. Voice Capture**
```javascript
// User holds microphone button
navigator.mediaDevices.getUserMedia({ audio: true })
mediaRecorder.start() // WebM/Opus format, 48kHz
```

### **2. Speech Processing** 
```javascript
// Convert to base64 and send to Cloud Function
const base64Audio = reader.result.split(',')[1]
fetch(functionUrl, { body: JSON.stringify({ audioData: base64Audio }) })
```

### **3. AI Response Pipeline**
```javascript
// Speech-to-text → AI generation → Contextual fallback
const transcription = await speechClient.recognize(audioData)
const response = await vertexAI.generateContent(prompt)
|| getContextualResponse(transcription) // Fallback system
```

### **4. User Experience**
```javascript
// Display response with smooth animations
showResponse(result.responseText)
// Always empathetic, never judgmental
```

---

## 🎯 Example Interactions

| **User Input** | **Mitra's Response** |
|----------------|---------------------|
| *"I'm feeling really sad today"* | "I hear that you're feeling sad right now. It's okay to feel this way, and I want you to know that these feelings are temporary. You're stronger than you know." |
| *"I'm so stressed about work"* | "It sounds like you're carrying a lot right now. Remember, it's okay to take breaks and ask for help. You don't have to handle everything on your own." |
| *"I feel anxious about tomorrow"* | "I understand you're feeling anxious. Take a deep breath with me. You're safe right now, and we can work through this together, one step at a time." |
| *"I had a great day today!"* | "I'm so glad to hear there's some positivity in your day! It's wonderful when we can recognize and celebrate the good moments, even the small ones." |

---

## 🔧 Development Guide

### **Local Development Commands**

```bash
# Start all services locally
firebase emulators:start

# Deploy only functions
firebase deploy --only functions

# Deploy only hosting  
firebase deploy --only hosting

# View function logs
firebase functions:log

# Test single function
firebase functions:shell
```

### **Project Structure**

- **`public/`** - Static web files served by Firebase Hosting
- **`functions/`** - Node.js Cloud Functions for backend processing  
- **`firebase.json`** - Firebase services configuration
- **`WARP.md`** - Detailed development guidance for AI assistants

### **Environment Variables**

The project uses Firebase's built-in service account authentication. No manual API keys required!

---

## 🤝 Contributing

We welcome contributions to make Mitra even better!

### **Getting Started**
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Test locally with `firebase emulators:start`
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### **Development Guidelines**
- Follow the existing code style (ESLint with Google config)
- Test all changes locally before submitting
- Update documentation for new features
- Maintain empathetic, supportive tone in all responses

---

## 📋 Roadmap

### **Planned Features**
- [ ] **Multi-language support** - Support for different languages
- [ ] **Voice response** - Text-to-speech for Mitra's replies
- [ ] **Conversation history** - Optional session memory
- [ ] **Wellness resources** - Links to helpful content
- [ ] **Mood tracking** - Optional emotional state tracking
- [ ] **Offline mode** - Local fallback responses

### **Technical Improvements**
- [ ] **WebRTC integration** - Better audio quality
- [ ] **Progressive Web App** - Installable mobile experience
- [ ] **A/B testing** - Response effectiveness optimization
- [ ] **Analytics dashboard** - Usage insights and improvements

---

## 🛡️ Privacy & Security

### **Privacy First**
- **No data storage** - Conversations are not saved or logged
- **Secure transmission** - All communication over HTTPS
- **No tracking** - No analytics or user identification
- **Local processing** - Audio stays in your browser until sent for processing

### **Security Features**
- **CORS protection** - Prevents unauthorized API access
- **Input validation** - Sanitizes all user inputs
- **Rate limiting** - Prevents abuse of AI services
- **Service isolation** - Each component runs in isolation

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

### **Technologies**
- **Firebase** - For hosting and serverless functions
- **Google Cloud** - For Speech API and Vertex AI
- **Web APIs** - For browser audio recording capabilities

### **Inspiration**
Built with the belief that technology should support human wellbeing and emotional health. Mitra aims to provide a safe, judgment-free space for people to express themselves and receive caring support.

---

## 📞 Support

### **Need Help?**
- **Issues** - Report bugs or request features via [GitHub Issues](https://github.com/zaid-ali789/mind-mitra/issues)
- **Discussions** - Join community conversations in [Discussions](https://github.com/zaid-ali789/mind-mitra/discussions)
- **Documentation** - Check out `WARP.md` for detailed development guidance

### **Emergency Resources**
If you're experiencing a mental health crisis, please reach out to:
- **National Suicide Prevention Lifeline**: 988 (US)
- **Crisis Text Line**: Text HOME to 741741
- **International**: [Find local resources](https://findahelpline.com)

---

<div align="center">

**Made with ❤️ for mental health and wellbeing**

[![Star this repo](https://img.shields.io/github/stars/zaid-ali789/mind-mitra?style=social)](https://github.com/zaid-ali789/mind-mitra/stargazers)
[![Follow on GitHub](https://img.shields.io/github/followers/zaid-ali789?style=social)](https://github.com/zaid-ali789)

**[🌐 Try Mitra Live](https://fine-phenomenon-456517-q2.web.app) | [📚 View Documentation](WARP.md) | [🐛 Report Issues](https://github.com/zaid-ali789/mind-mitra/issues)**

</div>