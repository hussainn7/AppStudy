import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { Button, TextInput, Title, Snackbar, ProgressBar, useTheme, Text, Card, Surface, Paragraph, Chip } from 'react-native-paper';
import axios from 'axios';
import { useApi } from '../contexts/ApiContext';

export default function YouTubeScreen({ navigation }) {
  const [videoUrl, setVideoUrl] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [videoId, setVideoId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [debugInfo, setDebugInfo] = useState(null);
  const [showDebug, setShowDebug] = useState(false);
  const theme = useTheme();
  const { apiUrl, isAiPowered } = useApi();
  
  // Create styles with the theme
  const styles = makeStyles(theme);

  // Extract video ID and update thumbnail
  const handleVideoUrlChange = (url) => {
    setVideoUrl(url);
    
    try {
      let id = '';
      
      if (url.includes('v=')) {
        id = url.split('v=')[1].split('&')[0];
      } else if (url.includes('youtu.be/')) {
        id = url.split('youtu.be/')[1].split('?')[0];
      }
      
      if (id) {
        setVideoId(id);
        setThumbnailUrl(`https://img.youtube.com/vi/${id}/maxresdefault.jpg`);
      } else {
        setThumbnailUrl('');
      }
    } catch (err) {
      setThumbnailUrl('');
    }
  };

  const handleSubmit = async () => {
    if (!videoUrl.trim()) {
      setError('Please enter a YouTube URL');
      setSnackbarVisible(true);
      return;
    }

    setLoading(true);
    setError('');
    setDebugInfo(null);

    try {
      console.log(`Sending request to ${apiUrl}/api/process-youtube`);
      
      // Send video URL to backend for processing
      const response = await axios.post(`${apiUrl}/api/process-youtube`, {
        video_url: videoUrl
      });

      console.log('Response received:', response.status);
      console.log('Response data:', response.data);
      
      // Navigate to summary screen with the response data
      navigation.navigate('Summary', { data: response.data });
    } catch (err) {
      console.error('Error processing YouTube URL:', err);
      let errorMessage = 'Failed to process YouTube video. Please try again.';
      
      // More detailed error message based on the error type
      if (err.response) {
        console.error('Response data:', err.response.data);
        console.error('Response status:', err.response.status);
        
        if (err.response.data && err.response.data.error) {
          errorMessage = err.response.data.error;
        }
        
        setDebugInfo({
          type: 'Server Error',
          status: err.response.status,
          data: JSON.stringify(err.response.data),
          headers: JSON.stringify(err.response.headers),
          api_url: apiUrl
        });
      } else if (err.request) {
        // The request was made but no response was received
        console.error('No response received:', err.request);
        
        if (Platform.OS === 'ios') {
          errorMessage = 'Network error: Cannot connect to the server. Make sure your iPhone and computer are on the same WiFi network.';
        } else {
          errorMessage = 'No response from server. Please check your network connection.';
        }
        
        setDebugInfo({
          type: 'Network Error',
          message: 'No response from server',
          platform: Platform.OS,
          api_url: apiUrl
        });
      } else {
        // Something happened in setting up the request that triggered an Error
        setDebugInfo({
          type: 'Request Setup Error',
          message: err.message,
          stack: err.stack,
          platform: Platform.OS,
          api_url: apiUrl
        });
      }
      
      setError(errorMessage);
      setSnackbarVisible(true);
      setShowDebug(true); // Always show debug info when there's an error
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <Title style={styles.title}>Analyze YouTube Video</Title>
          
          {isAiPowered && (
            <View style={styles.aiNotice}>
              <Text style={styles.aiNoticeText}>
                Powered by AI for better transcript analysis
              </Text>
            </View>
          )}
          
          <Card style={styles.card}>
            <Card.Content>
              <Paragraph style={styles.paragraph}>
                Enter a YouTube URL to extract the transcript and create study materials
              </Paragraph>
              
              <TextInput
                mode="outlined"
                value={videoUrl}
                onChangeText={handleVideoUrlChange}
                placeholder="https://www.youtube.com/watch?v=..."
                style={styles.textInput}
                autoCapitalize="none"
                autoCorrect={false}
                blurOnSubmit={true}
                returnKeyType="done"
                onSubmitEditing={(e) => {
                  // Prevent default form submission
                  e.preventDefault && e.preventDefault();
                  handleSubmit();
                }}
                left={<TextInput.Icon name="youtube" color={theme.colors.primary} />}
              />
              
              {thumbnailUrl ? (
                <View style={styles.thumbnailContainer}>
                  <Surface style={styles.thumbnailSurface}>
                    <Image
                      source={{ uri: thumbnailUrl }}
                      style={styles.thumbnail}
                      resizeMode="cover"
                    />
                    <View style={styles.youtubeOverlay}>
                      <Chip icon="youtube" mode="outlined" style={styles.youtubeChip}>YouTube</Chip>
                    </View>
                  </Surface>
                  <Text style={styles.thumbnailText}>Video ID: {videoId}</Text>
                </View>
              ) : null}
              
              <View style={styles.infoContainer}>
                <Text style={styles.infoText}>
                  * Only videos with available transcripts can be processed
                </Text>
                <Text style={styles.infoText}>
                  * Auto-generated captions must be enabled on the video
                </Text>
              </View>
            </Card.Content>
          </Card>

          {loading && (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Processing YouTube video transcript...</Text>
              <ProgressBar indeterminate color={theme.colors.primary} />
            </View>
          )}

          <View style={styles.buttonContainer}>
            <Button
              mode="contained"
              onPress={handleSubmit}
              loading={loading}
              disabled={loading || !videoId}
              style={styles.button}
              icon="youtube"
            >
              {isAiPowered ? "Process with AI" : "Process Video"}
            </Button>
          </View>
          
          {showDebug && debugInfo && (
            <Card style={styles.debugCard}>
              <Card.Title title="Debug Information" />
              <Card.Content>
                <Text style={styles.debugType}>Type: {debugInfo.type}</Text>
                {debugInfo.status && <Text>Status: {debugInfo.status}</Text>}
                {debugInfo.message && <Text>Message: {debugInfo.message}</Text>}
                {debugInfo.data && (
                  <View style={styles.debugDataContainer}>
                    <Text style={styles.debugDataTitle}>Response Data:</Text>
                    <ScrollView style={styles.debugDataScroll}>
                      <Text>{debugInfo.data}</Text>
                    </ScrollView>
                  </View>
                )}
              </Card.Content>
            </Card>
          )}

          <View style={styles.tipsContainer}>
            <Title style={styles.tipsTitle}>Tips:</Title>
            <TextInput
              mode="flat"
              multiline
              editable={false}
              value="• Make sure the video has closed captions available\n• Educational videos typically work best\n• Longer videos provide more context for better analysis\n• You can use both regular YouTube URLs and shortened youtu.be links"
              style={styles.tipsText}
            />
          </View>
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
  },
  card: {
    marginBottom: 16,
    elevation: 4,
    borderRadius: 12,
  },
  title: {
    fontSize: 24,
    marginBottom: 16,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  paragraph: {
    marginBottom: 12,
    fontSize: 16,
  },
  aiNotice: {
    backgroundColor: '#f0f8ff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e1f5fe',
  },
  aiNoticeText: {
    color: '#2c3e50',
    fontWeight: 'bold',
  },
  textInput: {
    marginBottom: 16,
  },
  thumbnailContainer: {
    marginBottom: 16,
    alignItems: 'center',
  },
  thumbnailSurface: {
    elevation: 4,
    borderRadius: 12,
    overflow: 'hidden',
    width: '100%',
    height: 200,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  thumbnailText: {
    marginTop: 8,
    fontSize: 12,
    color: '#555',
  },
  youtubeOverlay: {
    position: 'absolute',
    bottom: 12,
    right: 12,
  },
  youtubeChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  infoContainer: {
    marginVertical: 12,
  },
  infoText: {
    fontSize: 12,
    color: '#555',
    marginBottom: 4,
  },
  loadingContainer: {
    marginBottom: 16,
  },
  loadingText: {
    textAlign: 'center',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  buttonContainer: {
    marginTop: 8,
    marginBottom: 24,
  },
  button: {
    paddingVertical: 8,
    borderRadius: 12,
  },
  debugButton: {
    marginTop: 8,
  },
  toggleButton: {
    marginTop: 4,
  },
  tipsContainer: {
    marginTop: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 16,
  },
  tipsTitle: {
    fontSize: 16,
    marginBottom: 8,
  },
  tipsText: {
    backgroundColor: 'transparent',
  },
  debugCard: {
    marginTop: 16,
    marginBottom: 16,
    borderRadius: 12,
  },
  debugType: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  debugDataContainer: {
    marginTop: 8,
  },
  debugDataTitle: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  debugDataScroll: {
    maxHeight: 200,
    backgroundColor: '#f5f5f5',
    padding: 8,
    borderRadius: 8,
  },
}); 