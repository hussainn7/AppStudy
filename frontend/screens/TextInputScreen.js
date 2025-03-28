import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Button, TextInput, Title, Snackbar, ActivityIndicator, useTheme, Text, Card, Banner, Surface, ProgressBar } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';
import { useApi } from '../contexts/ApiContext';

// Log the platform for debugging
console.log('TextInputScreen - Platform:', Platform.OS);

export default function TextInputScreen({ navigation }) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [debugInfo, setDebugInfo] = useState(null);
  const [showDebug, setShowDebug] = useState(false);
  const theme = useTheme();
  const { apiUrl, isAiPowered } = useApi();
  
  // Create styles with the theme
  const styles = makeStyles(theme);

  const handleSubmit = async () => {
    if (!text.trim()) {
      setError('Please enter some text');
      setSnackbarVisible(true);
      return;
    }

    setLoading(true);
    setError('');
    setDebugInfo(null);

    try {
      console.log(`Sending request to ${apiUrl}/api/process-text`);
      console.log('Text length:', text.length);
      
      // Send text to backend for processing
      const response = await axios.post(`${apiUrl}/api/process-text`, {
        text: text
      });

      console.log('Response received:', response.status);
      console.log('Response data:', response.data);
      
      // Navigate to summary screen with the response data
      navigation.navigate('Summary', { data: response.data });
    } catch (err) {
      console.error('Error processing text:', err);
      let errorMessage = 'Failed to process text. Please try again.';
      
      // More detailed error message based on the error type
      if (err.response) {
        // The request was made and the server responded with a status code
        console.error('Response data:', err.response.data);
        console.error('Response status:', err.response.status);
        
        if (err.response.status === 404) {
          errorMessage = 'Backend server not found. Please check if the server is running.';
        } else if (err.response.data && err.response.data.error) {
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
          errorMessage = 'Network error: Cannot connect to the server. Make sure your iPhone and computer are on the same WiFi network. The API URL may need to be your computer\'s actual IP address instead of "localhost".';
        } else {
          errorMessage = 'No response from server. Please check your network connection.';
        }
        
        setDebugInfo({
          type: 'Network Error',
          message: 'No response from server',
          platform: Platform.OS,
          api_url: apiUrl,
          info: Platform.OS === 'ios' 
            ? 'The iPhone cannot connect to "localhost" on your computer. Make sure your phone and computer are on the same WiFi network and use your computer\'s actual IP address.'
            : 'The request was sent but no response was received. This usually indicates a network connectivity issue or that the server is not running.'
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

  const testConnection = async () => {
    setLoading(true);
    setError('');
    setDebugInfo(null);
    
    try {
      console.log(`Testing connection to ${apiUrl}/api/test`);
      const response = await axios.post(`${apiUrl}/api/test`, {
        test: 'data',
        timestamp: new Date().toISOString(),
        platform: Platform.OS
      });
      
      console.log('Test response:', response.data);
      setDebugInfo({
        type: 'Connection Test Successful',
        status: response.status,
        data: JSON.stringify(response.data, null, 2),
        platform: Platform.OS,
        api_url: apiUrl
      });
      
      setError('Connection test successful');
      setSnackbarVisible(true);
      setShowDebug(true);
    } catch (err) {
      console.error('Test connection error:', err);
      
      if (err.response) {
        setDebugInfo({
          type: 'Server Error',
          status: err.response.status,
          data: JSON.stringify(err.response.data, null, 2),
          platform: Platform.OS,
          api_url: apiUrl
        });
      } else if (err.request) {
        setDebugInfo({
          type: 'Network Error',
          message: 'No response from server',
          request: JSON.stringify(err.request, null, 2),
          platform: Platform.OS,
          api_url: apiUrl,
          note: Platform.OS === 'ios' ? 'iOS devices need to use the computer\'s actual IP address (not localhost) and ensure proper network permissions' : ''
        });
      } else {
        setDebugInfo({
          type: 'Request Setup Error',
          message: err.message,
          stack: err.stack,
          platform: Platform.OS,
          api_url: apiUrl
        });
      }
      
      setError('Connection test failed');
      setSnackbarVisible(true);
      setShowDebug(true);
    } finally {
      setLoading(false);
    }
  };

  // Function to help users find their IP address
  const showIpHelp = () => {
    const helpMessage = Platform.OS === 'ios' ? 
      'To connect from your iPhone, update the API_URL in each screen file to use your computer\'s actual IP address instead of "localhost". You can find your IP address by:\n\n1. On your computer, look at the Metro Bundler output which shows the IP address\n2. Or run "ipconfig" (Windows) or "ifconfig" (Mac/Linux) in terminal\n\nMake sure your phone and computer are on the same WiFi network.' 
      : 
      'Network configuration appears to be correct for your device type. If you\'re having connection issues, make sure the backend server is running.';
    
    setError(helpMessage);
    setSnackbarVisible(true);
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <Title style={styles.title}>Enter Your Study Text</Title>
          
          {isAiPowered && (
            <View style={styles.aiNotice}>
              <Text style={styles.aiNoticeText}>
                Powered by AI for better results
              </Text>
            </View>
          )}
          
          <View 
            onStartShouldSetResponder={() => true}
            onResponderGrant={(e) => {
              // Prevent any default behavior
              e.preventDefault && e.preventDefault();
              return true;
            }}
          >
            <TextInput
              mode="outlined"
              multiline
              numberOfLines={10}
              value={text}
              onChangeText={setText}
              placeholder="Paste or type your study content here..."
              style={styles.textInput}
              blurOnSubmit={false}
              returnKeyType="default"
              onSubmitEditing={(e) => {
                // Prevent default form submission
                e.preventDefault && e.preventDefault();
                setText(text + '\n');
              }}
            />
          </View>

          {loading && (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Processing text...</Text>
              <ProgressBar indeterminate color={theme.colors.primary} />
            </View>
          )}

          <View style={styles.buttonContainer}>
            <Button
              mode="contained"
              onPress={handleSubmit}
              loading={loading}
              disabled={loading}
              style={styles.button}
              icon={isAiPowered ? "brain" : undefined}
            >
              {isAiPowered ? "Process with AI" : "Process Text"}
            </Button>
            
            <Button
              mode="outlined"
              onPress={testConnection}
              loading={loading}
              disabled={loading}
              style={[styles.button, styles.debugButton]}
              icon="web"
            >
              Test API Connection
            </Button>
            
            <Button
              mode="text"
              onPress={() => setShowDebug(!showDebug)}
              style={styles.toggleButton}
              icon={showDebug ? "eye-off" : "eye"}
            >
              {showDebug ? "Hide Debug Info" : "Show Debug Info"}
            </Button>
            
            {Platform.OS === 'ios' && (
              <Button
                mode="text"
                onPress={showIpHelp}
                style={styles.toggleButton}
                icon="help-network"
              >
                iOS Connection Help
              </Button>
            )}
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
              value="• Enter at least a few paragraphs for best results\n• Include headings and key terms\n• The more context you provide, the better the study aids will be"
              style={styles.tipsText}
            />
          </View>
          
          <View style={styles.apiInfoContainer}>
            <Text style={styles.apiInfoText}>
              API URL: {apiUrl}
            </Text>
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
  title: {
    fontSize: 20,
    marginBottom: 16,
  },
  paragraph: {
    marginBottom: 16,
  },
  textInput: {
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  buttonContainer: {
    marginTop: 8,
    marginBottom: 24,
  },
  button: {
    marginBottom: 12,
    paddingVertical: 6,
    borderRadius: 30,
  },
  debugCard: {
    marginTop: 16,
    marginBottom: 16,
  },
  debugInfo: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 12,
    padding: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    marginTop: 8,
  },
  loadingContainer: {
    marginTop: 24,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    textAlign: 'center',
    fontSize: 16,
  },
  header: {
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    padding: 24,
  },
  headerTitle: {
    fontSize: 24,
    color: '#fff',
    marginBottom: 8,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  headerSubtitle: {
    color: '#fff',
    opacity: 0.9,
    textAlign: 'center',
  },
  card: {
    marginBottom: 16,
    borderRadius: 12,
    elevation: 4,
  },
  aiEnabledBanner: {
    borderRadius: 8,
    marginBottom: 16,
  },
  buttonIcon: {
    marginRight: 8,
  },
  aiChip: {
    backgroundColor: theme.colors.accent,
    marginLeft: 8,
  },
  placeholderText: {
    marginBottom: 16,
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    fontStyle: 'italic',
    color: '#666',
  },
  aiNotice: {
    backgroundColor: '#f0f8ff',
    borderRadius: 8,
    padding: 8,
    marginBottom: 16,
    alignItems: 'center',
  },
  aiNoticeText: {
    color: '#2c3e50',
    fontWeight: 'bold',
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
    borderRadius: 4,
  },
  tipsContainer: {
    marginTop: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 16,
  },
  tipsTitle: {
    fontSize: 16,
    marginBottom: 8,
  },
  tipsText: {
    backgroundColor: 'transparent',
  },
  apiInfoContainer: {
    marginTop: 16,
    padding: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  apiInfoText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  debugButton: {
    marginTop: 8,
  },
  toggleButton: {
    marginTop: 4,
  },
}); 