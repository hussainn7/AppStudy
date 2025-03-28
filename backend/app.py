import os
import ssl
from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.utils import secure_filename
import PyPDF2
import nltk
from nltk.tokenize import sent_tokenize, word_tokenize
from nltk.corpus import stopwords
from nltk.probability import FreqDist
import json
import re
import random
import pdfplumber
from dotenv import load_dotenv
import openai
import logging
import socket
import platform
from youtube_transcript_api import YouTubeTranscriptApi, TranscriptsDisabled, NoTranscriptFound
import speech_recognition as sr
from pydub import AudioSegment
import base64

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)
logger.info("Starting Study Companion API...")

# Load environment variables
load_dotenv()
logger.info("Environment variables loaded")

# Configure OpenAI
openai_api_key = os.getenv("OPENAI_API_KEY")
logger.info(f"OpenAI API key {'found' if openai_api_key else 'not found'}")

if openai_api_key:
    # Initialize the OpenAI client with the API key
    # Use the Client class directly for OpenAI API v1.x
    try:
        from openai import OpenAI
        client = OpenAI(api_key=openai_api_key)
        # Store the client in the openai module for backwards compatibility
        openai.client = client
        logger.info("OpenAI client initialized successfully with OpenAI v1.x API")
    except (ImportError, Exception) as e:
        # Fallback to legacy approach
        openai.api_key = openai_api_key
        logger.info(f"Using legacy OpenAI initialization: {e}")
    
    logger.info("OpenAI API key loaded successfully")
else:
    logger.warning("OpenAI API key not found! Using fallback local processing.")

# Download necessary NLTK data
try:
    # Fix for SSL certificate issues on macOS
    try:
        _create_unverified_https_context = ssl._create_unverified_context
    except AttributeError:
        pass
    else:
        ssl._create_default_https_context = _create_unverified_https_context
    
    # Now download NLTK data
    nltk.download('punkt')
    nltk.download('stopwords')
    nltk.download('wordnet')
    nltk.download('averaged_perceptron_tagger')
    logger.info("NLTK data downloaded successfully")
except Exception as e:
    logger.warning(f"Failed to download NLTK data: {e}")

app = Flask(__name__)
CORS(app)
logger.info("Flask app created with CORS enabled")

# Configure upload folder
UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'uploads')
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)
    logger.info(f"Created upload folder: {UPLOAD_FOLDER}")
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

@app.route('/')
def index():
    """Root endpoint that returns API info and AI status"""
    logger.info("Root endpoint accessed")
    # Check if OpenAI is configured properly
    is_ai_powered = bool(openai_api_key) 
    
    response = {
        "message": "Welcome to the Study Companion API",
        "ai_powered": is_ai_powered,
        "version": "1.1.0",
        "endpoints": [
            {"path": "/api/process-text", "method": "POST", "description": "Process text to generate summary and analysis"},
            {"path": "/api/upload-pdf", "method": "POST", "description": "Upload and process PDF file"},
            {"path": "/api/generate-quiz", "method": "POST", "description": "Generate quiz questions from text"},
            {"path": "/api/generate-flashcards", "method": "POST", "description": "Generate flashcards from text"},
            {"path": "/api/process-youtube", "method": "POST", "description": "Process YouTube video transcript"},
            {"path": "/api/process-voice", "method": "POST", "description": "Process voice recordings, perform speech-to-text, and analyze the content"}
        ]
    }
    logger.info(f"Returning response with AI powered: {is_ai_powered}")
    return jsonify(response)

@app.route('/api/process-text', methods=['POST'])
def process_text():
    """Process plain text input"""
    logger.info("process-text endpoint called")
    data = request.json
    if not data or 'text' not in data:
        logger.error("No text provided in request")
        return jsonify({"error": "No text provided"}), 400
    
    text = data['text']
    logger.info(f"Received text of length: {len(text)}")
    
    # Use OpenAI if available, otherwise fall back to local processing
    if openai_api_key:
        logger.info("Using OpenAI for text analysis")
        try:
            result = analyze_text_with_openai(text)
            logger.info("OpenAI analysis completed successfully")
        except Exception as e:
            logger.error(f"OpenAI analysis failed: {e}")
            logger.info("Falling back to local processing")
            result = analyze_text_local(text)
    else:
        logger.info("Using local processing for text analysis")
        result = analyze_text_local(text)
        
    return jsonify(result)

@app.route('/api/upload-pdf', methods=['POST'])
def upload_pdf():
    """Process PDF file upload"""
    logger.info("upload-pdf endpoint called")
    if 'file' not in request.files:
        logger.error("No file part in request")
        return jsonify({"error": "No file part"}), 400
    
    file = request.files['file']
    if file.filename == '':
        logger.error("No file selected")
        return jsonify({"error": "No file selected"}), 400
    
    if file and file.filename.endswith('.pdf'):
        filename = secure_filename(file.filename)
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(file_path)
        logger.info(f"PDF saved to {file_path}")
        
        # Extract text from PDF
        text = extract_text_from_pdf(file_path)
        logger.info(f"Extracted {len(text)} characters from PDF")
        
        # Process the extracted text
        if openai_api_key:
            logger.info("Using OpenAI for PDF analysis")
            try:
                result = analyze_text_with_openai(text)
                logger.info("OpenAI analysis completed successfully")
            except Exception as e:
                logger.error(f"OpenAI analysis failed: {e}")
                logger.info("Falling back to local processing")
                result = analyze_text_local(text)
        else:
            logger.info("Using local processing for PDF analysis")
            result = analyze_text_local(text)
        
        return jsonify(result)
    
    logger.error("Invalid file format")
    return jsonify({"error": "Invalid file format. Please upload a PDF file."}), 400

@app.route('/api/generate-quiz', methods=['POST'])
def generate_quiz():
    """Generate quiz questions from provided text"""
    data = request.get_json()
    
    if not data or 'text' not in data:
        return jsonify({"error": "No text provided"}), 400
    
    text = data['text']
    quiz_type = data.get('quiz_type', 'all')
    num_questions = data.get('num_questions', 5)
    source = data.get('source', 'text')  # New parameter to identify source
    
    # If the source is YouTube and the text is a raw transcript, process it first
    if source == 'youtube' and openai_api_key:
        processed_text = refine_youtube_transcript_with_openai(text)
        if processed_text:
            text = processed_text
        
    if openai_api_key:
        quiz = create_quiz_with_openai(text, quiz_type, num_questions)
    else:
        quiz = create_quiz_local(text, quiz_type, num_questions)
    
    return jsonify(quiz)

@app.route('/api/generate-flashcards', methods=['POST'])
def generate_flashcards():
    """Generate flashcards from provided text"""
    data = request.get_json()
    
    if not data or 'text' not in data:
        return jsonify({"error": "No text provided"}), 400
    
    text = data['text']
    num_cards = data.get('num_cards', 10)
    source = data.get('source', 'text')  # New parameter to identify source
    
    # If the source is YouTube and the text is a raw transcript, process it first
    if source == 'youtube' and openai_api_key:
        processed_text = refine_youtube_transcript_with_openai(text)
        if processed_text:
            text = processed_text
    
    if openai_api_key:
        flashcards = create_flashcards_with_openai(text, num_cards)
    else:
        flashcards = create_flashcards_local(text, num_cards)
    
    return jsonify(flashcards)

@app.route('/api/process-youtube', methods=['POST'])
def process_youtube():
    """Process YouTube video transcript"""
    try:
        data = request.get_json()
        video_url = data.get('video_url')
        
        if not video_url:
            return jsonify({'error': 'No YouTube URL provided'}), 400
        
        # Extract video ID from URL
        if 'v=' in video_url:
            video_id = video_url.split('v=')[-1].split('&')[0]
        elif 'youtu.be/' in video_url:
            video_id = video_url.split('youtu.be/')[-1].split('?')[0]
        else:
            return jsonify({'error': 'Invalid YouTube URL format'}), 400
        
        try:
            # Get transcript
            transcript = YouTubeTranscriptApi.get_transcript(video_id)
            
            # Process the transcript to create a more readable and structured text
            processed_text = process_transcript_text(transcript)
            
            # Log the size of the transcript
            logger.info(f"YouTube transcript size: {len(processed_text)} characters")
            
            # Truncate for analysis if necessary
            analysis_text = processed_text
            if len(processed_text) > 14000:
                analysis_text = processed_text[:14000] + "..."
                logger.info(f"Truncated YouTube transcript to {len(analysis_text)} characters for analysis")
            
            # Process the text with your existing functions
            if openai_api_key:
                # First run analysis to get the summary, key points, etc.
                result = analyze_text_with_openai(analysis_text)
                
                # Create a refined, condensed version of the transcript via OpenAI
                refined_text = refine_youtube_transcript_with_openai(analysis_text)
                
                # Use the refined text for the preview, not the raw transcript
                if refined_text:
                    # Include only the first 500 characters as a preview
                    result['text_preview'] = refined_text[:500] + ('...' if len(refined_text) > 500 else '')
                else:
                    # Fallback if refinement fails
                    result['text_preview'] = processed_text[:500] + ('...' if len(processed_text) > 500 else '')
            else:
                result = analyze_text_local(analysis_text)
                # Include only first 500 characters of the text as a preview
                result['text_preview'] = processed_text[:500] + ('...' if len(processed_text) > 500 else '')
            
            # Add metadata but don't include full text in response
            result['source'] = 'youtube'
            result['video_id'] = video_id
            result['transcript_size'] = len(processed_text)
            
            return jsonify(result)
            
        except TranscriptsDisabled:
            return jsonify({'error': 'Transcripts are disabled for this video'}), 400
        except NoTranscriptFound:
            return jsonify({'error': 'No transcript found for this video'}), 400
        except Exception as e:
            app.logger.error(f"Error processing YouTube transcript: {e}")
            return jsonify({'error': f'Failed to process YouTube transcript: {str(e)}'}), 500
            
    except Exception as e:
        app.logger.error(f"Error in process_youtube: {e}")
        return jsonify({'error': f'Server error: {str(e)}'}), 500

def process_transcript_text(transcript):
    """Process YouTube transcript to create better structured text for analysis"""
    # Extract text entries and timestamps
    entries = []
    current_paragraph = []
    current_time = 0
    
    for entry in transcript:
        text = entry['text'].strip()
        start = entry['start']
        
        # Start a new paragraph if there's a significant time gap (>3 seconds)
        if start - current_time > 3 and current_paragraph:
            entries.append(' '.join(current_paragraph))
            current_paragraph = []
        
        current_paragraph.append(text)
        current_time = start
    
    # Add the last paragraph
    if current_paragraph:
        entries.append(' '.join(current_paragraph))
    
    # Join paragraphs with proper spacing
    processed_text = '\n\n'.join(entries)
    
    # Clean up common transcript issues
    processed_text = re.sub(r'\[.*?\]', '', processed_text)  # Remove brackets content like [Music]
    processed_text = re.sub(r'\s+', ' ', processed_text)     # Normalize spacing
    processed_text = re.sub(r'\.{2,}', '.', processed_text)  # Replace multiple periods
    processed_text = re.sub(r'\n{3,}', '\n\n', processed_text)  # Normalize paragraph breaks
    
    return processed_text

@app.route('/api/test', methods=['GET', 'POST'])
def test_endpoint():
    return jsonify({
        "status": "success",
        "message": "Test endpoint working"
    })

@app.route('/api/status', methods=['GET'])
def server_status():
    # Get network interfaces for troubleshooting
    # Get hostname
    hostname = socket.gethostname()
    
    # Get all IP addresses
    ip_addresses = []
    try:
        # Get all network interfaces
        addrs = socket.getaddrinfo(socket.gethostname(), None)
        
        # Extract unique IP addresses
        for addr in addrs:
            ip = addr[4][0]
            if ip not in ip_addresses and not ip.startswith('127.') and ':' not in ip:  # Exclude localhost and IPv6
                ip_addresses.append(ip)
    except Exception as e:
        ip_addresses = ["Error getting IP addresses: " + str(e)]
    
    return jsonify({
        "status": "online",
        "version": "1.0.0",
        "ai_powered": bool(openai_api_key),
        "hostname": hostname,
        "ip_addresses": ip_addresses,
        "platform": platform.platform(),
        "python_version": platform.python_version(),
        "flask_port": int(os.environ.get("PORT", 8000)),
        "cors_enabled": True
    })

def extract_text_from_pdf(file_path):
    """Extract text from a PDF file"""
    text = ""
    try:
        with pdfplumber.open(file_path) as pdf:
            for page in pdf.pages:
                text += page.extract_text() or ""
    except Exception as e:
        print(f"Error extracting text from PDF: {e}")
    
    return text

# OpenAI-powered functions

def analyze_text_with_openai(text):
    """Analyze text using OpenAI API"""
    try:
        # Truncate text if needed
        max_length = 14000  # Leaving room for prompt and response
        if len(text) > max_length:
            text = text[:max_length] + "..."
        
        prompt = f"""
        You are a precise, meticulous academic analyst. Your task is to perform a comprehensive analysis of the provided text, focusing ONLY on the most important and relevant information.

        IMPORTANT: 
        - Remove any useless, redundant, or tangential information
        - Focus only on the core concepts and essential points
        - Filter out any examples or details that don't add significant value
        - Be highly selective - include only what's truly important
        
        Provide the following WITHOUT additional commentary:
        
        1. A concise yet comprehensive summary (3-5 sentences) that captures ONLY the most critical information
        2. Exactly 5 key points (use precise, factual statements - focus on the most important concepts only)
        3. 10 specific key concepts or terms (choose only the most significant ones)
        4. Exact word count and sentence count (calculate these accurately)
        
        Requirements:
        - The summary must be factually precise, covering ONLY the main thesis and core arguments
        - Key points must represent the most important content only
        - Key concepts must be the most essential technical/domain-specific terms mentioned
        - All calculations must be accurate and based only on the provided text
        
        Format your response as a JSON object with the following structure:
        {{
            "summary": "string",
            "key_points": ["string", "string", ...],
            "key_concepts": ["string", "string", ...],
            "word_count": number,
            "sentence_count": number
        }}
        
        Text to analyze:
        {text}
        """
        
        logger.info("Sending request to OpenAI API")
        
        # Use the client object if available
        if hasattr(openai, 'client') and openai.client:
            response = openai.client.chat.completions.create(
                model="gpt-3.5-turbo-0125",
                response_format={"type": "json_object"},
                messages=[
                    {"role": "system", "content": "You are a precise academic analyzer that produces factually accurate, concise summaries and extracts key information. You focus only on what's truly important and relevant, removing any useless or tangential information."},
                    {"role": "user", "content": prompt}
                ]
            )
        else:
            # Fallback to the old approach
            response = openai.chat.completions.create(
                model="gpt-3.5-turbo-0125",
                response_format={"type": "json_object"},
                messages=[
                    {"role": "system", "content": "You are a precise academic analyzer that produces factually accurate, concise summaries and extracts key information. You focus only on what's truly important and relevant, removing any useless or tangential information."},
                    {"role": "user", "content": prompt}
                ]
            )
        
        logger.info("Received response from OpenAI API")
        
        # Parse the JSON response
        result = json.loads(response.choices[0].message.content)
        
        # Add the full text to the result
        result["full_text"] = text
        
        return result
    
    except Exception as e:
        logger.error(f"Error using OpenAI API for text analysis: {e}")
        # Fall back to local processing if OpenAI fails
        return analyze_text_local(text)

def create_quiz_with_openai(text, quiz_type="all", num_questions=5):
    """Create quiz questions from text using OpenAI"""
    try:
        # Truncate text if needed
        max_length = 14000  # Leaving room for prompt and response
        if len(text) > max_length:
            text = text[:max_length] + "..."
        
        prompt = f"""
        As an expert educator, create a pedagogically sound, challenging quiz with precisely {num_questions} questions based on the provided text.
        
        Quiz type: {quiz_type} (multiple-choice, true-false, open-ended, or all types mixed)
        
        IMPORTANT FOCUS INSTRUCTIONS:
        1. Focus ONLY on the most important and relevant information in the text
        2. Ignore tangential details, useless examples, or non-essential information
        3. Concentrate on testing understanding of core concepts and key ideas
        4. Create questions that evaluate comprehension of the most crucial content
        
        REQUIREMENTS:
        1. Questions must test deep conceptual understanding, not mere recall
        2. Include questions across all cognitive levels (knowledge, comprehension, application, analysis)
        3. For multiple-choice:
           - Provide exactly 4 options with only 1 correct answer
           - All distractors must be plausible and related to the content
           - Avoid "all/none of the above" options
        4. For true-false:
           - Create complete, contextually rich sentences
           - Avoid simplistic or obvious statements
           - Include subtle distinctions that require careful reading
        5. For open-ended:
           - Questions must require analytical thinking
           - Provide rich context to frame the question
           - Include a model answer that demonstrates depth of understanding
        
        Format the response as a JSON object with this EXACT structure:
        {{
            "questions": [
                {{
                    "type": "multiple-choice",
                    "question": "string",
                    "options": ["string", "string", "string", "string"],
                    "answer": "exact text of correct option",
                    "explanation": "string explaining why this answer is correct"
                }},
                {{
                    "type": "true-false",
                    "question": "string (a complete sentence statement)",
                    "answer": boolean,
                    "explanation": "string explaining why the statement is true/false"
                }},
                {{
                    "type": "open-ended",
                    "question": "string",
                    "context": "string providing background for the question",
                    "suggested_answer": "string - a comprehensive model answer",
                    "key_points": ["point 1", "point 2", "point 3"]
                }}
            ]
        }}
        
        Text to create quiz from:
        {text}
        """
        
        # Use the client object if available
        if hasattr(openai, 'client') and openai.client:
            response = openai.client.chat.completions.create(
                model="gpt-3.5-turbo-0125",
                response_format={"type": "json_object"},
                messages=[
                    {"role": "system", "content": "You are a master educator who creates cognitively demanding, pedagogically sound assessments that focus only on truly important information. You ignore irrelevant details and test only what matters most."},
                    {"role": "user", "content": prompt}
                ]
            )
        else:
            # Fallback to the old approach
            response = openai.chat.completions.create(
                model="gpt-3.5-turbo-0125",
                response_format={"type": "json_object"},
                messages=[
                    {"role": "system", "content": "You are a master educator who creates cognitively demanding, pedagogically sound assessments that focus only on truly important information. You ignore irrelevant details and test only what matters most."},
                    {"role": "user", "content": prompt}
                ]
            )
        
        # Parse the JSON response
        return json.loads(response.choices[0].message.content)
    
    except Exception as e:
        print(f"Error using OpenAI API for quiz generation: {e}")
        # Fall back to local processing if OpenAI fails
        return create_quiz_local(text, quiz_type, num_questions)

def create_flashcards_with_openai(text, num_cards=10):
    """Generate flashcards from text using OpenAI"""
    try:
        # Truncate text if needed
        max_length = 14000  # Leaving room for prompt and response
        if len(text) > max_length:
            text = text[:max_length] + "..."
        
        prompt = f"""
        As a cognitive science expert specializing in effective learning methods, create exactly {num_cards} high-quality flashcards based on the provided text.
        
        FOCUS REQUIREMENTS:
        1. Focus ONLY on the most significant concepts and ideas from the text
        2. Eliminate any flashcards about trivial, tangential, or non-essential information
        3. Concentrate exclusively on the content that will maximize learning value
        4. Filter out any examples or details that don't add significant educational value
        
        REQUIREMENTS FOR PERFECT FLASHCARDS:
        1. Identify the most important concepts, terms, principles, and relationships in the text
        2. Front side:
           - Precise, clear phrasing framed as a direct question or concept prompt
           - Focused on a single, discrete concept
           - Provide cued recall rather than simple recognition
        3. Back side:
           - Concise yet complete explanation (2-3 sentences max)
           - Use precise language and technical terminology correctly
           - Include a concrete example or application where applicable
        4. Each flashcard must:
           - Follow cognitive science principles for optimal learning
           - Be self-contained but interconnected with other concepts
           - Include specific page/timestamp reference if available
           - Use exact terminology from the source material
        
        Format the response as a JSON object with this EXACT structure:
        {{
            "flashcards": [
                {{
                    "front": "specific concept question or prompt",
                    "back": "precise, concise explanation",
                    "key_term": "the central term or concept",
                    "context": "specific context where this concept appears",
                    "example": "concrete application or example of the concept",
                    "related_concepts": ["related term 1", "related term 2"]
                }},
                ...
            ]
        }}
        
        Text to create flashcards from:
        {text}
        """
        
        # Use the client object if available
        if hasattr(openai, 'client') and openai.client:
            response = openai.client.chat.completions.create(
                model="gpt-3.5-turbo-0125",
                response_format={"type": "json_object"},
                messages=[
                    {"role": "system", "content": "You are a flashcard creation expert who focuses only on the most important information. You ruthlessly eliminate flashcards about trivial details and ensure each card delivers maximum educational value."},
                    {"role": "user", "content": prompt}
                ]
            )
        else:
            # Fallback to the old approach
            response = openai.chat.completions.create(
                model="gpt-3.5-turbo-0125",
                response_format={"type": "json_object"},
                messages=[
                    {"role": "system", "content": "You are a flashcard creation expert who focuses only on the most important information. You ruthlessly eliminate flashcards about trivial details and ensure each card delivers maximum educational value."},
                    {"role": "user", "content": prompt}
                ]
            )
        
        # Parse the JSON response
        return json.loads(response.choices[0].message.content)
    
    except Exception as e:
        print(f"Error using OpenAI API for flashcard generation: {e}")
        # Fall back to local processing if OpenAI fails
        return create_flashcards_local(text, num_cards)

def refine_youtube_transcript_with_openai(text):
    """Use OpenAI to create a refined, condensed version of the transcript"""
    try:
        # Truncate text if needed to accommodate token limits
        max_length = 14000  # Leaving room for prompt and response
        if len(text) > max_length:
            text = text[:max_length] + "..."
        
        prompt = f"""
        You are a transcript editor and summarizer. Your task is to take a raw YouTube video transcript and transform it into a well-structured, 
        coherent summary that captures ONLY the key information.
        
        CRITICAL INSTRUCTIONS:
        1. REMOVE all useless information, filler content, and tangential remarks
        2. FOCUS exclusively on the most important and relevant content
        3. ELIMINATE speech artifacts, repetitions, filler words, and other issues common in spoken language
        4. FILTER OUT any examples or details that don't add significant educational value
        5. KEEP ONLY the core concepts, crucial explanations, and essential points
        6. ORGANIZE the remaining content into a coherent, readable format with proper flow
        7. CREATE a concise yet comprehensive representation of ONLY the valuable content
        
        Raw YouTube transcript:
        {text}
        """
        
        logger.info("Sending request to OpenAI API for transcript refinement")
        
        # Use the client object if available
        if hasattr(openai, 'client') and openai.client:
            response = openai.client.chat.completions.create(
                model="gpt-3.5-turbo-0125",
                messages=[
                    {"role": "system", "content": "You are a transcript editor who transforms raw transcripts into clear, coherent text. You ruthlessly eliminate useless information and focus only on what's truly important and educational."},
                    {"role": "user", "content": prompt}
                ]
            )
        else:
            # Fallback to the old approach
            response = openai.chat.completions.create(
                model="gpt-3.5-turbo-0125",
                messages=[
                    {"role": "system", "content": "You are a transcript editor who transforms raw transcripts into clear, coherent text. You ruthlessly eliminate useless information and focus only on what's truly important and educational."},
                    {"role": "user", "content": prompt}
                ]
            )
        
        logger.info("Received response from OpenAI API for transcript refinement")
        
        # Extract the refined text
        refined_text = response.choices[0].message.content
        return refined_text
    
    except Exception as e:
        logger.error(f"Error using OpenAI API for transcript refinement: {e}")
        return None

def process_voice_transcription_with_openai(text):
    """Process voice note transcriptions to ensure accurate information extraction and analysis"""
    try:
        # Truncate text if needed
        max_length = 14000  # Leaving room for prompt and response
        if len(text) > max_length:
            text = text[:max_length] + "..."
        
        prompt = f"""
        You are a highly accurate voice note processor. Your task is to analyze the voice transcription and produce content that STRICTLY represents what was actually said, ensuring no fabricated information is added.

        CRITICAL INSTRUCTIONS:
        1. NEVER add information that was not explicitly stated in the voice recording
        2. ONLY work with information that is clearly present in the transcription
        3. MAINTAIN the integrity of the original content - do not embellish or extrapolate
        4. CLARIFY any ambiguities if possible, but DO NOT invent explanations
        5. PRESERVE the exact meaning of what the user said, not what you think they might have meant
        6. EXCLUDE anything that sounds like filler words or speech artifacts
        
        Provide the following in your analysis:
        
        1. A factually accurate summary that represents ONLY what was actually said (3-4 sentences)
        2. 3-5 key points that were EXPLICITLY stated in the recording (not inferred)
        3. 5-8 specific key concepts or terms that were ACTUALLY mentioned
        4. Brief statistics about the content (word count, general subject matter)
        
        Format your response as a JSON object with the following structure:
        {{
            "summary": "string - factually accurate based ONLY on what was said",
            "key_points": ["string - point explicitly stated", ...],
            "key_concepts": ["string - concept actually mentioned", ...],
            "word_count": number,
            "subject": "brief description of the actual subject discussed"
        }}
        
        Voice transcription to analyze:
        {text}
        """
        
        logger.info("Sending request to OpenAI API for voice note processing")
        
        # Use the client object if available
        if hasattr(openai, 'client') and openai.client:
            response = openai.client.chat.completions.create(
                model="gpt-3.5-turbo-0125",
                response_format={"type": "json_object"},
                messages=[
                    {"role": "system", "content": "You are a precise voice transcription analyst that ensures all information is factually derived from the recording. You never add information that wasn't explicitly stated and you prioritize accuracy over completeness."},
                    {"role": "user", "content": prompt}
                ]
            )
        else:
            # Fallback to the old approach
            response = openai.chat.completions.create(
                model="gpt-3.5-turbo-0125",
                response_format={"type": "json_object"},
                messages=[
                    {"role": "system", "content": "You are a precise voice transcription analyst that ensures all information is factually derived from the recording. You never add information that wasn't explicitly stated and you prioritize accuracy over completeness."},
                    {"role": "user", "content": prompt}
                ]
            )
        
        logger.info("Received response from OpenAI API for voice note processing")
        
        # Parse the JSON response
        result = json.loads(response.choices[0].message.content)
        
        # Add the full text to the result
        result["full_text"] = text
        
        return result
    
    except Exception as e:
        logger.error(f"Error using OpenAI API for voice note processing: {e}")
        # Fall back to regular text analysis if voice-specific processing fails
        return analyze_text_with_openai(text)

# Local fallback functions

def analyze_text_local(text):
    """Analyze text to create a summary and key points (local fallback)"""
    # Basic text preprocessing
    sentences = sent_tokenize(text)
    words = word_tokenize(text.lower())
    stop_words = set(stopwords.words('english'))
    filtered_words = [word for word in words if word.isalnum() and word not in stop_words]
    
    # Get most common words for key concepts
    fdist = FreqDist(filtered_words)
    key_words = [word for word, _ in fdist.most_common(10)]
    
    # Create a simple summary (first 3 sentences or less)
    summary = " ".join(sentences[:min(3, len(sentences))])
    
    # Extract key sentences (containing most frequent words)
    key_sentences = []
    for sentence in sentences:
        for word in key_words:
            if word in sentence.lower():
                key_sentences.append(sentence)
                break
    
    # Limit to top 5 key sentences
    key_sentences = key_sentences[:min(5, len(key_sentences))]
    
    return {
        "summary": summary,
        "key_points": key_sentences,
        "word_count": len(words),
        "sentence_count": len(sentences),
        "key_concepts": key_words,
        "full_text": text
    }

def create_quiz_local(text, quiz_type="all", num_questions=5):
    """Create quiz questions from text (local fallback)"""
    sentences = sent_tokenize(text)
    
    if len(sentences) < 3:
        return {"error": "Text is too short to generate meaningful quiz questions"}
    
    # Select random sentences to base questions on
    selected_sentences = random.sample(sentences, min(num_questions * 2, len(sentences)))
    
    quiz_questions = []
    
    if quiz_type in ["multiple-choice", "all"]:
        # Generate multiple choice questions
        for i in range(min(num_questions // 2, len(selected_sentences))):
            sentence = selected_sentences[i]
            words = word_tokenize(sentence)
            
            # Find nouns or important words to ask about
            filtered_words = [word for word in words if len(word) > 4 and word.isalpha()]
            
            if filtered_words:
                key_word = random.choice(filtered_words)
                question = sentence.replace(key_word, "____")
                
                # Generate options (including the correct answer)
                options = [key_word]
                
                # Add 3 random different words as distractors
                other_words = [w for w in filtered_words if w != key_word]
                if len(other_words) >= 3:
                    options.extend(random.sample(other_words, 3))
                else:
                    # If not enough words in the same sentence, get some from the whole text
                    all_words = [w for w in word_tokenize(text) 
                                if len(w) > 4 and w.isalpha() and w != key_word]
                    options.extend(random.sample(all_words, min(3, len(all_words))))
                
                random.shuffle(options)
                
                quiz_questions.append({
                    "type": "multiple-choice",
                    "question": question,
                    "options": options,
                    "answer": key_word
                })
    
    if quiz_type in ["true-false", "all"]:
        # Generate true/false questions
        for i in range(min(num_questions // 2, len(selected_sentences))):
            index = i + num_questions // 2
            if index < len(selected_sentences):
                sentence = selected_sentences[index]
                
                # 50% chance to create a false statement by altering the sentence
                is_true = random.choice([True, False])
                
                if is_true:
                    question = sentence
                else:
                    words = word_tokenize(sentence)
                    if len(words) > 5:
                        # Replace a random word to make it false
                        replace_idx = random.randint(2, len(words) - 2)
                        all_words = [w for w in word_tokenize(text) 
                                    if len(w) > 4 and w.isalpha() and w != words[replace_idx]]
                        if all_words:
                            words[replace_idx] = random.choice(all_words)
                        
                        question = " ".join(words)
                    else:
                        question = sentence
                        is_true = True  # Too short to modify safely
                
                quiz_questions.append({
                    "type": "true-false",
                    "question": question,
                    "answer": is_true
                })
    
    if quiz_type in ["open-ended", "all"]:
        # Generate open-ended questions
        for i in range(min(num_questions // 3, len(selected_sentences))):
            index = i + 2 * (num_questions // 3)
            if index < len(selected_sentences):
                sentence = selected_sentences[index]
                
                # Create a simple question by turning a statement into a question
                words = word_tokenize(sentence)
                if len(words) > 5:
                    # Find important words to ask about
                    key_words = [word for word in words if len(word) > 4 and word.isalpha()]
                    
                    if key_words:
                        key_word = random.choice(key_words)
                        context = sentence
                        question = f"What is the significance of '{key_word}' in the given context?"
                        
                        quiz_questions.append({
                            "type": "open-ended",
                            "question": question,
                            "context": context,
                            "suggested_answer": f"The term '{key_word}' in this context refers to an important concept related to the subject matter."
                        })
    
    return {"questions": quiz_questions[:num_questions]}

def create_flashcards_local(text, num_cards=10):
    """Generate flashcards from text (local fallback)"""
    sentences = sent_tokenize(text)
    
    if len(sentences) < 3:
        return {"error": "Text is too short to generate meaningful flashcards"}
    
    # Select random sentences to base flashcards on
    selected_sentences = random.sample(sentences, min(num_cards, len(sentences)))
    
    flashcards = []
    
    for sentence in selected_sentences:
        words = word_tokenize(sentence)
        
        # Find nouns or important words to create flashcards
        filtered_words = [word for word in words if len(word) > 4 and word.isalpha()]
        
        if filtered_words:
            key_word = random.choice(filtered_words)
            
            # Create front (question) and back (answer) of flashcard
            front = f"Define or explain: {key_word}"
            back = sentence
            
            # Find some context from another sentence if possible
            context = ""
            for other_sentence in sentences:
                if other_sentence != sentence and key_word.lower() in other_sentence.lower():
                    context = other_sentence
                    break
            
            if not context and len(sentences) > 1:
                # If no specific context found, use another sentence as general context
                other_sentences = [s for s in sentences if s != sentence]
                context = random.choice(other_sentences)
            
            # Find related terms based on word proximity
            related_terms = []
            for word in filtered_words:
                if word != key_word and len(word) > 4:
                    related_terms.append(word)
            
            # Limit to 3 related terms
            related_terms = related_terms[:3]
            
            # Create a simple example by finding a sentence with the key word
            example = ""
            for ex_sentence in sentences:
                if ex_sentence != sentence and ex_sentence != context and key_word.lower() in ex_sentence.lower():
                    example = ex_sentence
                    break
            
            flashcards.append({
                "front": front,
                "back": back,
                "key_term": key_word,
                "context": context,
                "example": example,
                "related_concepts": related_terms
            })
    
    return {"flashcards": flashcards[:num_cards]}

@app.route('/api/process-voice', methods=['POST'])
def process_voice():
    """Process voice recordings, perform speech-to-text, and analyze the content"""
    try:
        data = request.get_json()
        audio_data = data.get('audio_data')
        preview_only = data.get('preview_only', False)
        
        if not audio_data:
            return jsonify({'error': 'No audio data provided'}), 400
        
        # Debug information for ffmpeg
        logger.info("Checking ffmpeg availability...")
        
        # Check for ffmpeg in common paths
        ffmpeg_locations = [
            '/usr/local/bin/ffmpeg',
            '/usr/bin/ffmpeg',
            '/bin/ffmpeg',
            '/opt/homebrew/bin/ffmpeg'  # Common for macOS with Homebrew
        ]
        
        # Log ffmpeg search results
        for loc in ffmpeg_locations:
            if os.path.exists(loc):
                logger.info(f"Found ffmpeg at: {loc}")
            else:
                logger.info(f"ffmpeg not found at: {loc}")
        
        # Try to find ffmpeg in PATH
        try:
            import subprocess
            result = subprocess.run(['which', 'ffmpeg'], capture_output=True, text=True)
            if result.returncode == 0:
                ffmpeg_in_path = result.stdout.strip()
                logger.info(f"ffmpeg found in PATH at: {ffmpeg_in_path}")
                # Add this to our locations if not already there
                if ffmpeg_in_path not in ffmpeg_locations:
                    ffmpeg_locations.append(ffmpeg_in_path)
            else:
                logger.info("ffmpeg not found in PATH")
        except Exception as e:
            logger.warning(f"Error checking for ffmpeg in PATH: {e}")
            
        # Decode base64 audio data
        try:
            # Remove data URL prefix if present
            if ',' in audio_data:
                audio_data = audio_data.split(',')[1]
                
            audio_bytes = base64.b64decode(audio_data)
        except Exception as e:
            logger.error(f"Error decoding audio data: {e}")
            return jsonify({'error': 'Invalid audio data format'}), 400
        
        # Save audio to a temporary file
        temp_audio_path = os.path.join(UPLOAD_FOLDER, 'temp_audio.webm')
        with open(temp_audio_path, 'wb') as f:
            f.write(audio_bytes)
        
        # Flag to track if conversion worked
        conversion_successful = False
        wav_path = os.path.join(UPLOAD_FOLDER, 'temp_audio.wav')
        
        # Try to find a working ffmpeg
        found_ffmpeg_path = None
        for loc in ffmpeg_locations:
            if os.path.exists(loc):
                found_ffmpeg_path = loc
                logger.info(f"Will try ffmpeg at: {found_ffmpeg_path}")
                break
        
        # Try direct ffmpeg conversion if we found a path
        if found_ffmpeg_path:
            try:
                # Use subprocess to call ffmpeg directly with absolute path
                cmd = [found_ffmpeg_path, '-i', temp_audio_path, wav_path]
                logger.info(f"Running ffmpeg command: {' '.join(cmd)}")
                result = subprocess.run(cmd, check=True, stderr=subprocess.PIPE, stdout=subprocess.PIPE)
                logger.info(f"ffmpeg stdout: {result.stdout}")
                logger.info(f"ffmpeg stderr: {result.stderr}")
                if os.path.exists(wav_path):
                    conversion_successful = True
                    logger.info("Successfully converted audio to WAV using direct ffmpeg call")
                else:
                    logger.warning("ffmpeg ran but did not produce the expected output file")
            except Exception as e:
                logger.warning(f"Error using direct ffmpeg call: {e}")
                # Continue with pydub attempt
        
        # If direct ffmpeg call didn't work, try using pydub
        if not conversion_successful:
            try:
                # Try to set ffmpeg path for pydub if we found it
                import pydub.utils
                if found_ffmpeg_path:
                    # Set the ffmpeg path for pydub
                    pydub.utils.set_ffmpeg(found_ffmpeg_path)
                    logger.info(f"Set pydub ffmpeg path to: {found_ffmpeg_path}")
                    
                # Try the conversion with pydub
                audio = AudioSegment.from_file(temp_audio_path)
                audio.export(wav_path, format="wav")
                conversion_successful = True
                logger.info("Successfully converted audio to WAV format using pydub")
            except Exception as e:
                logger.warning(f"Error converting audio to WAV using pydub: {e}")
                logger.info("Will try direct speech recognition instead")
                # Continue without conversion - we'll try to use the raw file directly
        
        # Perform speech recognition
        recognizer = sr.Recognizer()
        try:
            if conversion_successful:
                # Use the converted WAV file
                with sr.AudioFile(wav_path) as source:
                    audio_data = recognizer.record(source)
                    text = recognizer.recognize_google(audio_data)
            else:
                # Get the platform-specific install instructions
                platform_instructions = ""
                if platform.system() == "Darwin":  # macOS
                    platform_instructions = "Run 'brew install ffmpeg' in Terminal to install."
                elif platform.system() == "Linux":
                    platform_instructions = "Run 'sudo apt-get install ffmpeg' on Ubuntu/Debian or 'sudo yum install ffmpeg' on CentOS/RHEL."
                elif platform.system() == "Windows":
                    platform_instructions = "Download and install from https://ffmpeg.org/download.html#build-windows or use a package manager like Chocolatey ('choco install ffmpeg')."
                
                # Since direct recognition from binary data isn't straightforward with the library,
                # we'll provide a helpful error message
                text = f"Audio conversion is required to process voice notes. Please install ffmpeg on your system or make sure it's available in the PATH. {platform_instructions}"
                logger.warning("Unable to process audio without ffmpeg")
            
            logger.info(f"Transcribed text length: {len(text)} characters")
            
            # Clean up temporary files
            if os.path.exists(temp_audio_path):
                os.remove(temp_audio_path)
            if os.path.exists(wav_path) and conversion_successful:
                os.remove(wav_path)
            
            # If preview_only is True, return just the transcription without OpenAI analysis
            if preview_only:
                logger.info("Returning transcription preview only")
                return jsonify({
                    'source': 'voice_note_preview',
                    'full_text': text,
                    'transcript_size': len(text),
                    'conversion_successful': conversion_successful,
                    'ffmpeg_missing': not conversion_successful,
                    'ffmpeg_message': f"For full voice note functionality, please install ffmpeg on your system and ensure it's in the PATH. {platform_instructions if not conversion_successful else ''}"
                })
            
            # Process the transcribed text with existing analysis functions
            if openai_api_key:
                # First run analysis to get the summary, key points, etc. using the voice-specific function
                result = process_voice_transcription_with_openai(text)
                
                # Include the transcribed text
                result['source'] = 'voice_note'
                result['full_text'] = text
                result['transcript_size'] = len(text)
                # Add a preview of the text
                result['text_preview'] = text[:500] + ('...' if len(text) > 500 else '')
                
                # Add information about ffmpeg status
                result['conversion_successful'] = conversion_successful
                if not conversion_successful:
                    result['ffmpeg_missing'] = True
                    result['ffmpeg_message'] = f"For full voice note functionality, please install ffmpeg on your system and ensure it's in the PATH. {platform_instructions}"
            else:
                result = analyze_text_local(text)
                result['source'] = 'voice_note'
                result['full_text'] = text
                result['transcript_size'] = len(text)
                result['text_preview'] = text[:500] + ('...' if len(text) > 500 else '')
                result['conversion_successful'] = conversion_successful
                if not conversion_successful:
                    result['ffmpeg_missing'] = True
                    result['ffmpeg_message'] = f"For full voice note functionality, please install ffmpeg on your system and ensure it's in the PATH. {platform_instructions}"
            
            return jsonify(result)
                
        except sr.UnknownValueError:
            logger.error("Speech recognition could not understand audio")
            return jsonify({
                'error': 'Could not understand the audio. Please speak clearly.',
                'ffmpeg_status': 'missing' if not conversion_successful else 'available',
                'conversion_successful': conversion_successful
            }), 400
        except sr.RequestError as e:
            logger.error(f"Could not request results from Speech Recognition service: {e}")
            return jsonify({
                'error': 'Speech recognition service unavailable. Please try again later.',
                'ffmpeg_status': 'missing' if not conversion_successful else 'available',
                'conversion_successful': conversion_successful
            }), 500
        except Exception as e:
            logger.error(f"Error in speech recognition: {e}")
            return jsonify({
                'error': f'Failed to process speech: {str(e)}',
                'ffmpeg_status': 'missing' if not conversion_successful else 'available',
                'conversion_successful': conversion_successful
            }), 500
    
    except Exception as e:
        logger.error(f"Error in process_voice: {e}")
        return jsonify({'error': f'Server error: {str(e)}'}), 500

if __name__ == '__main__':
    logger.info("Starting Flask server on port 8000...")
    app.run(debug=True, host='0.0.0.0', port=8000) 