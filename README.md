# Study Companion App

A comprehensive learning tool that transforms documents into interactive study aids. Whether you upload a PDF file, record your voice, or simply paste text, the app intelligently extracts key information and converts it into useful study tools like summaries, quizzes, and flashcards.

## Project Overview

This application is composed of two main parts:

1. **Frontend**: Built with Expo and React Native, providing a mobile-first experience for iOS and Android.
2. **Backend**: Powered by Flask, handling document processing, AI-driven summarization, and quiz/flashcard generation.

## Key Features

- **AI-Powered Analysis** ✨
  - Intelligent processing of text using advanced AI
  - High-quality summaries with improved accuracy
  - Better context understanding for more effective study materials

- **Multiple Content Sources**
  - PDF Upload: Import large PDF documents
  - Text Input: Directly paste text to quickly generate study aids
  - YouTube Videos: Extract transcripts from educational videos
  - Voice Notes: Record your thoughts and convert to study materials

- **Smart Summarization**
  - Automatically condenses lengthy documents into clear, concise summaries
  - Extracts key points and concepts

- **Interactive Quiz Generator**
  - Multiple choice questions
  - True/false questions
  - Open-ended questions

- **Dynamic Flashcards**
  - Transforms key concepts into interactive flashcards
  - Flip animation for question/answer review
  - Enhanced with related concepts and examples

- **Voice Note Taker**
  - Record voice with pause and resume capabilities
  - Speech-to-text conversion with live visualization
  - Focus on relevant information only

- **User Authentication**
  - Login and registration system
  - Admin and regular user accounts
  - Profile management
  - Remember me functionality

## Setup Instructions

### Backend Setup (Flask)

1. Navigate to the backend directory:
   ```
   cd backend
   ```

2. Set up a virtual environment:
   ```
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

4. Set up your OpenAI API key in a `.env` file:
   ```
   OPENAI_API_KEY=your_api_key_here
   ```
   You can get an API key from the [OpenAI platform](https://platform.openai.com/api-keys).

5. Run the Flask server:
   ```
   python app.py
   ```

The server will start on `http://localhost:8000`

### Frontend Setup (React Native/Expo)

1. Navigate to the frontend directory:
   ```
   cd frontend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the Expo development server:
   ```
   npm start
   ```

4. Run on your preferred platform:
   - Press `i` for iOS Simulator
   - Press `a` for Android Emulator
   - Scan QR code with Expo Go app on your device

## API Endpoints

- `GET /` - Get API info and AI status
- `POST /api/process-text` - Process plain text input
- `POST /api/upload-pdf` - Upload and process a PDF file
- `POST /api/process-youtube` - Process YouTube video transcript
- `POST /api/process-voice` - Process voice recordings and convert to text
- `POST /api/generate-quiz` - Generate quiz questions from text
- `POST /api/generate-flashcards` - Generate flashcards from text

## Technology Stack

- **Frontend**:
  - React Native
  - Expo
  - React Navigation
  - React Native Paper (UI components)
  - Expo AV (audio recording)
  - Axios (API calls)
  - Expo Linear Gradient (visual effects)

- **Backend**:
  - Flask
  - PyPDF2 / pdfplumber (PDF processing)
  - NLTK (Natural Language Processing)
  - OpenAI API (AI integration)
  - youtube_transcript_api (YouTube transcripts)
  - SpeechRecognition (voice transcription)
  - pydub (audio processing)

## Screenshots

*Screenshots will be added soon*

## License

MIT

## Acknowledgments

This project uses several open-source libraries and tools. See the package.json and requirements.txt files for a complete list of dependencies.

Special thanks to OpenAI for providing the API that powers the enhanced AI features of this application.

## Additional Configuration for Network Issues

If you're experiencing network connection problems, especially on iOS devices, the app now includes a dedicated Settings screen to help with network configuration. This screen allows you to:

1. View your device's IP address
2. Configure a custom server IP and port
3. Test the connection to the backend
4. Get detailed troubleshooting information

### Improved Connection Management

The app now includes a centralized API connection management system using React Context. This provides:

- Consistent API URL access across all screens
- Automatic loading and saving of connection settings
- Easy configuration through the Settings screen
- Better error handling with detailed diagnostics

### Required Packages

To use the Settings screen functionality, install the AsyncStorage and Network packages:

```bash
cd frontend
npm install @react-native-async-storage/async-storage expo-network
```

### Instructions for iOS Users

When running the app on a physical iOS device:

1. Make sure your iPhone and computer are on the same WiFi network
2. Open the app and you'll be automatically directed to the Settings screen if a connection cannot be established
3. In the Settings screen, toggle "Use custom server IP" and enter your computer's actual IP address
4. Save the settings and try the connection test
5. Return to the main screen once the connection is working

### Common Issues and Solutions

- **Cannot connect to server**: Your iPhone and computer might be on different networks, or your computer's firewall might be blocking connections
- **Connection timeout**: The server might not be running
- **iOS Connection**: iOS devices cannot connect to "localhost" when referring to your development computer. You must use your computer's actual IP address (can be found in System Preferences > Network or in the Metro Bundler console)
- **Android Emulator**: The Android emulator uses 10.0.2.2 as a special alias to reach the host machine's localhost
- **Web Browser**: The web version can use localhost as normal

The app will automatically adapt its network configuration based on the platform and environment. 