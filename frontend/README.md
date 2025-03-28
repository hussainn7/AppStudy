# Study Companion App - Frontend

This is the React Native/Expo frontend for the Study Companion App, which provides a mobile interface for document processing, content summarization, quiz generation, and flashcard creation.

## Features

- Text input for study content
- PDF document upload
- Content summarization and key points extraction
- Interactive quizzes with multiple question types
- Flashcards with flip animations
- Modern, responsive UI for both iOS and Android

## Setup Instructions

1. Make sure you have Node.js and npm installed

2. Install Expo CLI:
   ```
   npm install -g expo-cli
   ```

3. Install dependencies:
   ```
   npm install
   ```

4. Replace the placeholder icon:
   - Add a PDF icon image to the `assets` folder with the name `pdf-icon.png`

5. Configure the API URL:
   - In each screen file that makes API calls, update the `API_URL` constant to point to your backend server:
     - For Android emulator: `http://10.0.2.2:8000`
     - For iOS simulator: `http://localhost:8000`
     - For physical device: The actual IP address of your backend server

6. Start the app:
   ```
   npm start
   ```

   This will open Expo DevTools in your browser, where you can run the app on:
   - iOS Simulator
   - Android Emulator
   - Physical device via Expo Go app (scan QR code)
   - Web browser

## Screens

- **HomeScreen**: Landing page with options to input text or upload PDF
- **TextInputScreen**: Text input for study content
- **PDFUploadScreen**: PDF document upload and processing
- **SummaryScreen**: Displays analyzed content with key points and concepts
- **QuizScreen**: Interactive quiz with multiple-choice, true/false, and open-ended questions
- **FlashcardsScreen**: Interactive flashcards with flip animations

## Notes

- The frontend relies on the backend Flask API for all content processing functionality
- The PDF upload feature requires proper permissions on mobile devices
- For a production deployment, additional configuration may be needed depending on the hosting environment 