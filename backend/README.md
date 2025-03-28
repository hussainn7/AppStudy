# Study Companion App - Backend

This is the Flask backend for the Study Companion App, which handles document processing, text analysis, quiz generation, and flashcard creation.

## Features

- PDF document processing and text extraction
- YouTube video transcript extraction
- Voice recording transcription and analysis
- Text analysis and summarization
- Quiz generation (multiple choice, true/false, open-ended)
- Flashcard creation
- RESTful API for frontend integration

## Setup Instructions

1. Make sure you have Python 3.7+ installed

2. Set up a virtual environment:
   ```
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

4. Run the application:
   ```
   python app.py
   ```

The server will start on `http://localhost:8000`

## API Endpoints

- `GET /` - Check if the API is running
- `POST /api/process-text` - Process plain text input
- `POST /api/upload-pdf` - Upload and process a PDF file
- `POST /api/process-youtube` - Process YouTube video transcript
- `POST /api/process-voice` - Process voice recordings and convert to text
- `POST /api/generate-quiz` - Generate quiz questions from text
- `POST /api/generate-flashcards` - Generate flashcards from text

## Request Examples

### Process Text
```json
POST /api/process-text
{
  "text": "Your study text goes here. This is some example content that will be processed."
}
```

### Process YouTube Video
```json
POST /api/process-youtube
{
  "video_url": "https://www.youtube.com/watch?v=VIDEO_ID"
}
```

### Process Voice Recording
```json
POST /api/process-voice
{
  "audio_data": "base64_encoded_audio_data"
}
```

### Generate Quiz
```json
POST /api/generate-quiz
{
  "text": "Your study text goes here.",
  "quiz_type": "all",  // "multiple-choice", "true-false", "open-ended", or "all"
  "num_questions": 5
}
```

### Generate Flashcards
```json
POST /api/generate-flashcards
{
  "text": "Your study text goes here.",
  "num_cards": 10
}
``` 