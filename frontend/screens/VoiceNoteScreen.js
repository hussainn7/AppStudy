import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, ScrollView, Platform, KeyboardAvoidingView, Alert, ActivityIndicator, Animated } from 'react-native';
import { 
  Button, 
  Text, 
  Card, 
  Title, 
  Paragraph, 
  ProgressBar, 
  useTheme, 
  Surface,
  IconButton,
  Snackbar
} from 'react-native-paper';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';
import { useApi } from '../contexts/ApiContext';

export default function VoiceNoteScreen({ navigation }) {
  const [recording, setRecording] = useState(null);
  const [recordingStatus, setRecordingStatus] = useState('idle');
  const [audioPermission, setAudioPermission] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [recordingPath, setRecordingPath] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const theme = useTheme();
  const { apiUrl, isAiPowered } = useApi();
  
  // Add ffmpeg warning state
  const [ffmpegWarning, setFfmpegWarning] = useState(false);
  const [ffmpegMessage, setFfmpegMessage] = useState('');
  
  // Add transcription preview state
  const [transcriptionPreview, setTranscriptionPreview] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  
  // Timer for tracking recording duration
  const [durationTimer, setDurationTimer] = useState(null);
  
  // Add state for audio visualization
  const [audioLevels, setAudioLevels] = useState([0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.5, 0.4, 0.3, 0.2]);
  const animationRef = useRef(null);
  
  // Create styles with the theme
  const styles = makeStyles(theme);
  
  // Request permission to access the microphone
  useEffect(() => {
    // Check if running on web platform and show a warning message
    if (Platform.OS === 'web') {
      setFfmpegWarning(true);
      setFfmpegMessage('Voice recording is not fully supported in web browsers. For the best experience, please use a mobile device.');
      return;
    }
    
    getPermission();
    
    // Cleanup function to ensure recording is stopped
    return () => {
      if (recording) {
        stopRecording();
      }
      if (durationTimer) {
        clearInterval(durationTimer);
      }
    };
  }, []);
  
  // Use effect to animate the audio levels when recording
  useEffect(() => {
    let intervalId;
    
    if (recordingStatus === 'recording') {
      intervalId = setInterval(() => {
        // Simulate audio levels with random values
        const newLevels = Array(10).fill(0).map(() => Math.random() * 0.8 + 0.1);
        setAudioLevels(newLevels);
      }, 150); // Update every 150ms for a realistic effect
    }
    
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [recordingStatus]);
  
  const getPermission = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      setAudioPermission(status === 'granted');
      
      if (status !== 'granted') {
        setError('Permission to access microphone is required for voice notes.');
        setSnackbarVisible(true);
      } else {
        // Set up audio mode
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
        });
      }
    } catch (err) {
      console.error('Failed to get audio permission:', err);
      setError('Failed to get microphone permission.');
      setSnackbarVisible(true);
    }
  };
  
  // Format seconds to mm:ss
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Start recording function
  const startRecording = async () => {
    try {
      // Check if running on web platform
      if (Platform.OS === 'web') {
        setError('Voice recording is not available in web browsers. Please use a mobile device with Expo Go or a native build.');
        setSnackbarVisible(true);
        return;
      }
      
      if (!audioPermission) {
        await getPermission();
        if (!audioPermission) return;
      }
      
      // Create a new recording
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      
      setRecording(recording);
      setRecordingStatus('recording');
      
      // Start timer for tracking duration
      const timer = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
      
      setDurationTimer(timer);
      
    } catch (err) {
      console.error('Failed to start recording:', err);
      setError('Failed to start recording. Please try again.');
      setSnackbarVisible(true);
    }
  };
  
  // Pause recording function
  const pauseRecording = async () => {
    try {
      // Check if running on web platform
      if (Platform.OS === 'web') {
        setError('Voice recording is not available in web browsers. Please use a mobile device with Expo Go or a native build.');
        setSnackbarVisible(true);
        return;
      }
      
      if (recording && recordingStatus === 'recording') {
        await recording.pauseAsync();
        setRecordingStatus('paused');
        
        // Clear the duration timer
        if (durationTimer) {
          clearInterval(durationTimer);
          setDurationTimer(null);
        }
      }
    } catch (err) {
      console.error('Failed to pause recording:', err);
      setError('Failed to pause recording. Please try again.');
      setSnackbarVisible(true);
    }
  };
  
  // Resume recording function
  const resumeRecording = async () => {
    try {
      // Check if running on web platform
      if (Platform.OS === 'web') {
        setError('Voice recording is not available in web browsers. Please use a mobile device with Expo Go or a native build.');
        setSnackbarVisible(true);
        return;
      }
      
      if (recording && recordingStatus === 'paused') {
        await recording.startAsync();
        setRecordingStatus('recording');
        
        // Restart the timer
        const timer = setInterval(() => {
          setRecordingDuration(prev => prev + 1);
        }, 1000);
        
        setDurationTimer(timer);
      }
    } catch (err) {
      console.error('Failed to resume recording:', err);
      setError('Failed to resume recording. Please try again.');
      setSnackbarVisible(true);
    }
  };
  
  // Stop recording function
  const stopRecording = async () => {
    try {
      // Check if running on web platform
      if (Platform.OS === 'web') {
        setError('Voice recording is not available in web browsers. Please use a mobile device with Expo Go or a native build.');
        setSnackbarVisible(true);
        return;
      }
      
      if (recording) {
        if (recordingStatus === 'paused') {
          // If paused, resume first before stopping to ensure proper file saving
          await recording.startAsync();
        }
        
        await recording.stopAndUnloadAsync();
        const uri = recording.getURI();
        console.log('Recording stopped and stored at', uri);
        
        // Clear the timer
        if (durationTimer) {
          clearInterval(durationTimer);
          setDurationTimer(null);
        }
        
        // Save the uri for later processing
        setRecordingPath(uri);
        setRecording(null);
        setRecordingStatus('stopped');
        
        // Start transcribing immediately to get a preview
        getTranscriptionPreview(uri);
        setShowPreview(true); // Always show preview automatically
      }
    } catch (err) {
      console.error('Failed to stop recording:', err);
      setError('Failed to stop recording. Please try again.');
      setSnackbarVisible(true);
      
      // Reset state even if error
      setRecording(null);
      setRecordingStatus('idle');
      
      if (durationTimer) {
        clearInterval(durationTimer);
        setDurationTimer(null);
      }
    }
  };
  
  // Get a transcription preview of the recording
  const getTranscriptionPreview = async (uri) => {
    if (!uri) return;
    
    setTranscribing(true);
    setTranscriptionPreview('');
    
    try {
      // Check if running on web platform
      if (Platform.OS === 'web') {
        setTranscriptionPreview('Transcription preview is not available in web browsers. Voice recording features require a mobile device with Expo Go or a native build.');
        setShowPreview(true);
        setFfmpegWarning(true);
        setFfmpegMessage('Voice note functionality is limited on web browsers. For full functionality, please use a mobile device.');
        return;
      }
      
      // Read the file as base64
      const base64Audio = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      
      // Send a request to the server to get the transcription only
      const response = await axios.post(`${apiUrl}/api/process-voice`, {
        audio_data: base64Audio,
        preview_only: true // Tell the server we just want the transcription
      });
      
      // Check if there's a warning about ffmpeg
      if (response.data && response.data.ffmpeg_missing) {
        setFfmpegWarning(true);
        setFfmpegMessage(response.data.ffmpeg_message || 'For full voice note functionality, please install ffmpeg on your server.');
        
        // Log more info for debugging
        console.log('FFmpeg issue details:', {
          conversion_successful: response.data.conversion_successful || false,
          ffmpeg_missing: response.data.ffmpeg_missing,
          transcript_size: response.data.transcript_size
        });
      } else {
        setFfmpegWarning(false);
      }
      
      // Set the transcription preview
      if (response.data && response.data.full_text) {
        setTranscriptionPreview(response.data.full_text);
        setShowPreview(true);
      }
    } catch (err) {
      console.error('Error getting transcription preview:', err);
      if (err.name === 'UnavailabilityError') {
        setTranscriptionPreview('Transcription preview is not available on this platform. Voice recording features require a mobile device.');
      } else if (err.response && err.response.data && err.response.data.error) {
        setTranscriptionPreview(`Error: ${err.response.data.error}`);
      } else {
        setTranscriptionPreview('Could not transcribe audio. Try processing anyway.');
      }
      setShowPreview(true);
    } finally {
      setTranscribing(false);
    }
  };
  
  // Reset all state
  const resetRecording = () => {
    setRecording(null);
    setRecordingPath(null);
    setRecordingStatus('idle');
    setRecordingDuration(0);
    setTranscriptionPreview('');
    setShowPreview(false);
    
    if (durationTimer) {
      clearInterval(durationTimer);
      setDurationTimer(null);
    }
  };
  
  // Process the recording by sending it to the backend
  const processRecording = async () => {
    if (!recordingPath) {
      setError('No recording available to process. Please record something first.');
      setSnackbarVisible(true);
      return;
    }
    
    setIsLoading(true);
    setError('');
    setFfmpegWarning(false);
    setFfmpegMessage('');
    
    try {
      // Check if running on web platform
      if (Platform.OS === 'web') {
        setError('Voice note processing is not available in web browsers. Please use a mobile device with Expo Go or a native build.');
        setSnackbarVisible(true);
        setIsLoading(false);
        return;
      }
      
      // Read the file as base64
      const base64Audio = await FileSystem.readAsStringAsync(recordingPath, {
        encoding: FileSystem.EncodingType.Base64,
      });
      
      // Make API request to process the recording
      const response = await axios.post(`${apiUrl}/api/process-voice`, {
        audio_data: base64Audio
      });
      
      // Check if there's a warning about ffmpeg
      if (response.data && response.data.ffmpeg_missing) {
        setFfmpegWarning(true);
        setFfmpegMessage(response.data.ffmpeg_message || 'For full voice note functionality, please install ffmpeg on your server.');
      }
      
      // Navigate to summary screen with the result
      navigation.navigate('Summary', { data: response.data });
      
    } catch (err) {
      console.error('Error processing voice recording:', err);
      
      let errorMessage = 'Failed to process voice recording. Please try again.';
      
      if (err.name === 'UnavailabilityError') {
        errorMessage = 'Voice recording features are not available on this platform. Please use a mobile device.';
      } else if (err.response && err.response.data) {
        // Check for ffmpeg errors in the response
        if (err.response.data.ffmpeg_status === 'missing') {
          setFfmpegWarning(true);
          setFfmpegMessage('FFmpeg is missing on the server. This is required for audio processing. Ask your administrator to install it.');
        }
        
        if (err.response.data.error) {
          errorMessage = err.response.data.error;
        }
      } else if (err.request) {
        // The request was made but no response was received
        if (Platform.OS === 'ios') {
          errorMessage = 'Network error: Cannot connect to the server. Make sure your device and the server are connected.';
        } else {
          errorMessage = 'No response from server. Please check your network connection.';
        }
      }
      
      setError(errorMessage);
      setSnackbarVisible(true);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Add a component for the audio waveform visualization
  const AudioWaveform = ({ levels }) => {
    return (
      <View style={styles.waveformContainer}>
        {levels.map((level, index) => (
          <Animated.View 
            key={index} 
            style={[
              styles.waveformBar,
              { 
                height: level * 60, // Scale the level to a reasonable height
                backgroundColor: level > 0.6 ? theme.colors.error : level > 0.3 ? theme.colors.primary : theme.colors.accent,
                marginHorizontal: 3,
              }
            ]} 
          />
        ))}
      </View>
    );
  };
  
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          {Platform.OS === 'web' && (
            <Card style={styles.warningCard}>
              <Card.Content style={styles.warningCardContent}>
                <IconButton icon="web" size={24} color={theme.colors.warning} style={styles.warningIcon} />
                <View style={styles.warningTextContainer}>
                  <Text style={styles.warningTitle}>Web Browser Limitations</Text>
                  <Text style={styles.warningText}>
                    Voice recording functionality is limited in web browsers. For the best experience, please use the app on a mobile device.
                  </Text>
                </View>
              </Card.Content>
            </Card>
          )}
          
          <LinearGradient
            colors={[theme.colors.primary, theme.colors.accent]}
            style={styles.header}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <IconButton
              icon="microphone"
              size={40}
              iconColor="#fff"
              style={styles.headerIcon}
            />
            <Title style={styles.headerTitle}>Voice Note Taker</Title>
            <Paragraph style={styles.headerSubtitle}>
              Record your thoughts and convert them to study materials
            </Paragraph>
          </LinearGradient>
          
          {isAiPowered && (
            <Card style={styles.aiCard}>
              <Card.Content style={styles.aiCardContent}>
                <IconButton icon="brain" size={24} style={styles.aiIcon} />
                <Text style={styles.aiText}>
                  Enhanced with AI for better transcription and analysis
                </Text>
              </Card.Content>
            </Card>
          )}
          
          {ffmpegWarning && (
            <Card style={styles.warningCard}>
              <Card.Content style={styles.warningCardContent}>
                <IconButton icon="alert" size={24} color={theme.colors.warning} style={styles.warningIcon} />
                <View style={styles.warningTextContainer}>
                  <Text style={styles.warningTitle}>Server Configuration Issue</Text>
                  <Text style={styles.warningText}>{ffmpegMessage}</Text>
                  <Text style={styles.warningNote}>Voice notes will still work, but without proper audio processing.</Text>
                  <Button 
                    mode="outlined" 
                    icon="information-outline" 
                    style={styles.warningButton}
                    onPress={() => {
                      Alert.alert(
                        "FFmpeg Installation",
                        "FFmpeg is an open-source tool for processing audio and video files. It's needed for proper voice note functionality.\n\nInstallation Instructions:\n\n• macOS: Run 'brew install ffmpeg' in Terminal\n• Ubuntu/Debian: Run 'sudo apt-get install ffmpeg'\n• Windows: Download from ffmpeg.org or use Chocolatey: 'choco install ffmpeg'\n\nVerification:\n1. Open Terminal/Command Prompt\n2. Run 'ffmpeg -version'\n3. If installed correctly, you'll see version information\n\nNOTE: If you've installed ffmpeg but still see this warning, your server may need to be restarted or the PATH environment variable may not include the ffmpeg location.",
                        [{ text: "OK", style: "default" }]
                      );
                    }}
                  >
                    Installation Help
                  </Button>
                </View>
              </Card.Content>
            </Card>
          )}
          
          <Card style={styles.recordingCard}>
            <Card.Content>
              <Title style={styles.cardTitle}>Record Voice Note</Title>
              
              <Surface style={styles.recordingSurface}>
                <View style={styles.durationContainer}>
                  <Text style={styles.durationText}>
                    {formatTime(recordingDuration)}
                  </Text>
                  <Text style={styles.statusText}>
                    {recordingStatus === 'recording' ? 'Recording...' : 
                     recordingStatus === 'paused' ? 'Paused' : 
                     recordingStatus === 'stopped' ? 'Recorded' : 'Ready'}
                  </Text>
                </View>
                
                {recordingStatus === 'recording' && (
                  <AudioWaveform levels={audioLevels} />
                )}
              </Surface>
              
              {/* Add transcription preview */}
              {showPreview && (
                <Surface style={styles.previewSurface}>
                  <View style={styles.previewHeader}>
                    <View style={styles.previewTitleContainer}>
                      <IconButton icon="text-to-speech" size={20} color={theme.colors.primary} style={styles.previewIcon} />
                      <Text style={styles.previewTitle}>Transcription Preview</Text>
                    </View>
                    <IconButton 
                      icon="close-circle" 
                      size={20}
                      onPress={() => setShowPreview(false)}
                      style={styles.closePreviewButton}
                    />
                  </View>
                  {transcribing ? (
                    <View style={styles.transcribingContainer}>
                      <ActivityIndicator animating={true} color={theme.colors.primary} size="large" />
                      <Text style={styles.transcribingText}>Transcribing your recording...</Text>
                    </View>
                  ) : (
                    <View>
                      {transcriptionPreview ? (
                        <View style={styles.previewContentContainer}>
                          <ScrollView style={styles.previewScroll}>
                            <Text style={[
                              styles.previewText, 
                              (transcriptionPreview.includes('ffmpeg') || ffmpegWarning) && styles.previewTextWarning
                            ]}>
                              {transcriptionPreview}
                            </Text>
                          </ScrollView>
                          <View style={styles.previewActions}>
                            <Button 
                              mode="text" 
                              icon="check" 
                              onPress={() => processRecording()}
                              style={styles.previewActionButton}
                              disabled={isLoading}
                            >
                              Looks Good
                            </Button>
                          </View>
                        </View>
                      ) : (
                        <View style={styles.transcribingContainer}>
                          <Text style={styles.noTranscriptionText}>No transcription available yet.</Text>
                        </View>
                      )}
                      {(transcriptionPreview.includes('ffmpeg') || ffmpegWarning) && (
                        <Text style={styles.previewNote}>
                          Note: You can still proceed with processing the recording, but the transcription may not be accurate.
                        </Text>
                      )}
                    </View>
                  )}
                </Surface>
              )}
              
              {/* Recording controls */}
              <View style={styles.controlsContainer}>
                {recordingStatus === 'idle' && (
                  <IconButton
                    icon="microphone"
                    size={64}
                    iconColor={theme.colors.primary}
                    style={styles.mainButton}
                    onPress={startRecording}
                    disabled={isLoading || !audioPermission}
                  />
                )}
                
                {recordingStatus === 'recording' && (
                  <View style={styles.activeControls}>
                    <IconButton
                      icon="pause"
                      size={48}
                      iconColor={theme.colors.accent}
                      style={styles.controlButton}
                      onPress={pauseRecording}
                    />
                    <IconButton
                      icon="stop"
                      size={64}
                      iconColor={theme.colors.error}
                      style={styles.mainButton}
                      onPress={stopRecording}
                    />
                  </View>
                )}
                
                {recordingStatus === 'paused' && (
                  <View style={styles.activeControls}>
                    <IconButton
                      icon="play"
                      size={48}
                      iconColor={theme.colors.primary}
                      style={styles.controlButton}
                      onPress={resumeRecording}
                    />
                    <IconButton
                      icon="stop"
                      size={64}
                      iconColor={theme.colors.error}
                      style={styles.mainButton}
                      onPress={stopRecording}
                    />
                  </View>
                )}
                
                {recordingStatus === 'stopped' && (
                  <View style={styles.activeControls}>
                    <IconButton
                      icon="refresh"
                      size={48}
                      iconColor={theme.colors.accent}
                      style={styles.controlButton}
                      onPress={resetRecording}
                      disabled={isLoading}
                    />
                    <IconButton
                      icon="check"
                      size={64}
                      iconColor={theme.colors.primary}
                      style={styles.mainButton}
                      onPress={processRecording}
                      disabled={isLoading}
                    />
                  </View>
                )}
              </View>
              
              {recordingStatus === 'stopped' && !showPreview && (
                <Button 
                  mode="outlined"
                  icon="text"
                  onPress={() => getTranscriptionPreview(recordingPath)}
                  style={styles.previewButton}
                  disabled={transcribing || isLoading}
                >
                  Show Transcription
                </Button>
              )}
              
              {recordingStatus === 'stopped' && !isLoading && (
                <Button
                  mode="contained"
                  onPress={processRecording}
                  style={styles.processButton}
                  icon="brain"
                >
                  Process Recording
                </Button>
              )}
              
              {isLoading && (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={theme.colors.primary} />
                  <Text style={styles.loadingText}>Processing your recording...</Text>
                </View>
              )}
              
              <View style={styles.instructionsContainer}>
                <Text style={styles.instructionTitle}>Instructions:</Text>
                <Text style={styles.instructionText}>
                  1. Tap the microphone button to start recording
                </Text>
                <Text style={styles.instructionText}>
                  2. Speak clearly to ensure accurate transcription
                </Text>
                <Text style={styles.instructionText}>
                  3. Use pause/resume as needed during recording
                </Text>
                <Text style={styles.instructionText}>
                  4. Tap the stop button when you're finished
                </Text>
                <Text style={styles.instructionText}>
                  5. Process the recording to create study materials
                </Text>
              </View>
            </Card.Content>
          </Card>
          
          <Card style={styles.infoCard}>
            <Card.Content>
              <Title style={styles.infoTitle}>About Voice Note Taker</Title>
              <Paragraph style={styles.infoParagraph}>
                This feature uses speech recognition to convert your voice recordings into text, 
                which is then analyzed to create summaries, key points, and other study materials.
              </Paragraph>
              
              <View style={styles.tipContainer}>
                <IconButton icon="lightbulb-outline" size={24} color={theme.colors.accent} />
                <View style={styles.tipTextContainer}>
                  <Text style={styles.tipTitle}>Tips for better results:</Text>
                  <Text style={styles.tipText}>• Speak clearly and at a moderate pace</Text>
                  <Text style={styles.tipText}>• Record in a quiet environment</Text>
                  <Text style={styles.tipText}>• Focus on key information only</Text>
                  <Text style={styles.tipText}>• Structure your thoughts before recording</Text>
                </View>
              </View>
            </Card.Content>
          </Card>
          
          {Platform.OS === 'web' && (
            <Card style={styles.webAlternativeCard}>
              <Card.Content>
                <Title style={styles.webAlternativeTitle}>Try Other Features Instead</Title>
                <Paragraph style={styles.webAlternativeParagraph}>
                  Voice recording isn't available on web, but you can try these other features:
                </Paragraph>
                <View style={styles.webButtonsContainer}>
                  <Button 
                    mode="contained" 
                    icon="text-box" 
                    style={styles.webButton}
                    onPress={() => navigation.navigate('TextInput')}
                  >
                    Text Input
                  </Button>
                  <Button 
                    mode="contained" 
                    icon="youtube" 
                    style={[styles.webButton, {backgroundColor: '#FF0000'}]}
                    onPress={() => navigation.navigate('YouTube')}
                  >
                    YouTube
                  </Button>
                  <Button 
                    mode="contained" 
                    icon="file-pdf-box" 
                    style={[styles.webButton, {backgroundColor: theme.colors.accent}]}
                    onPress={() => navigation.navigate('PDFUpload')}
                  >
                    PDF Upload
                  </Button>
                </View>
              </Card.Content>
            </Card>
          )}
        </View>
      </ScrollView>
      
      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={5000}
        action={{
          label: 'OK',
          onPress: () => setSnackbarVisible(false),
        }}
      >
        {error}
      </Snackbar>
    </KeyboardAvoidingView>
  );
}

const makeStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    padding: 24,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: 'center',
    elevation: 4,
  },
  headerIcon: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 40,
    margin: 0,
    marginBottom: 12,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 24,
    marginBottom: 8,
    textAlign: 'center',
  },
  headerSubtitle: {
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
  },
  aiCard: {
    marginBottom: 16,
    backgroundColor: 'rgba(67, 97, 238, 0.1)',
    borderRadius: 12,
  },
  aiCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  aiIcon: {
    margin: 0,
  },
  aiText: {
    flex: 1,
    marginLeft: 8,
    fontWeight: 'bold',
  },
  recordingCard: {
    marginBottom: 16,
    elevation: 4,
    borderRadius: 12,
    overflow: 'visible',
  },
  cardTitle: {
    marginBottom: 16,
    textAlign: 'center',
  },
  recordingSurface: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: '#f6f6f6',
    elevation: 2,
    marginBottom: 24,
  },
  durationContainer: {
    alignItems: 'center',
  },
  durationText: {
    fontSize: 48,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    color: theme.colors.primary,
  },
  statusText: {
    marginTop: 8,
    fontSize: 16,
    opacity: 0.7,
  },
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 70,
    width: '100%',
    marginTop: 16,
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderRadius: 12,
    padding: 5,
  },
  waveformBar: {
    width: 4,
    borderRadius: 2,
    flex: 1,
    maxWidth: 8,
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
    marginTop: 8,
  },
  activeControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  mainButton: {
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 50,
    margin: 0,
  },
  controlButton: {
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 40,
    margin: 0,
    marginHorizontal: 24,
  },
  processButton: {
    marginBottom: 16,
    marginTop: 8,
    borderRadius: 30,
    elevation: 2,
    padding: 4,
  },
  instructionsContainer: {
    marginTop: 8,
    marginBottom: 16,
    backgroundColor: '#f6f6f6',
    padding: 16,
    borderRadius: 12,
  },
  instructionTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 8,
  },
  instructionText: {
    marginBottom: 4,
    fontSize: 14,
  },
  infoCard: {
    marginBottom: 16,
    elevation: 2,
    borderRadius: 12,
  },
  infoTitle: {
    marginBottom: 8,
  },
  infoParagraph: {
    marginBottom: 16,
  },
  tipContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.03)',
    padding: 12,
    borderRadius: 12,
  },
  tipTextContainer: {
    flex: 1,
  },
  tipTitle: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  tipText: {
    marginBottom: 2,
    fontSize: 14,
  },
  warningCard: {
    marginBottom: 16,
    backgroundColor: 'rgba(247, 127, 0, 0.1)',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.warning,
  },
  warningCardContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 8,
  },
  warningIcon: {
    margin: 0,
  },
  warningTextContainer: {
    flex: 1,
    marginLeft: 8,
  },
  warningTitle: {
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 4,
  },
  warningText: {
    fontSize: 12,
    opacity: 0.8,
    marginBottom: 4,
  },
  warningNote: {
    fontSize: 12,
    fontStyle: 'italic',
    opacity: 0.7,
    marginBottom: 8,
  },
  warningButton: {
    marginTop: 8,
    alignSelf: 'flex-start',
    borderColor: theme.colors.warning,
  },
  previewSurface: {
    marginTop: 8,
    marginBottom: 24,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#f0f4ff', 
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(67, 97, 238, 0.3)',
    maxHeight: 280,
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  previewTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  previewIcon: {
    margin: 0,
    marginRight: 4,
  },
  previewTitle: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  closePreviewButton: {
    margin: 0,
  },
  previewContentContainer: {
    backgroundColor: 'white',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  previewScroll: {
    maxHeight: 120,
    borderRadius: 8,
    backgroundColor: 'white',
    padding: 8,
    marginTop: 4,
    marginBottom: 0,
  },
  previewActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 4,
    backgroundColor: 'rgba(67, 97, 238, 0.05)',
  },
  previewActionButton: {
    margin: 0,
  },
  previewText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#333',
  },
  previewTextWarning: {
    color: theme.colors.warning,
  },
  previewNote: {
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 8,
    opacity: 0.7,
  },
  transcribingContainer: {
    alignItems: 'center',
    padding: 20,
  },
  transcribingText: {
    marginTop: 8,
    color: theme.colors.primary,
  },
  noTranscriptionText: {
    textAlign: 'center',
    padding: 24,
    opacity: 0.6,
    fontStyle: 'italic',
  },
  previewButton: {
    marginTop: 8,
    marginBottom: 16,
    borderRadius: 30,
    alignSelf: 'center',
    width: '80%',
  },
  webAlternativeCard: {
    marginBottom: 16,
    borderRadius: 12,
    elevation: 4,
  },
  webAlternativeTitle: {
    marginBottom: 8,
    textAlign: 'center',
  },
  webAlternativeParagraph: {
    marginBottom: 16,
    textAlign: 'center',
  },
  webButtonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
  },
  webButton: {
    marginBottom: 12,
    minWidth: '30%',
  },
  stoppedControlsContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 16,
    marginBottom: 16,
  },
  loadingText: {
    marginTop: 8,
    color: theme.colors.primary,
    fontWeight: '500',
  },
}); 