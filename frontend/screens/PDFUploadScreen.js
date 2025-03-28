import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Platform } from 'react-native';
import { Button, Text, Card, Title, Paragraph, ActivityIndicator, useTheme, Banner, Surface, IconButton, Divider } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { useApi } from '../contexts/ApiContext';

// Log the platform for debugging
console.log('PDFUploadScreen - Platform:', Platform.OS);

export default function PDFUploadScreen({ navigation }) {
  const [pdfFile, setPdfFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const theme = useTheme();
  const { apiUrl, isAiPowered, checkAiStatus } = useApi();
  
  // Create styles with the theme
  const styles = makeStyles(theme);
  
  // No longer needed as ApiContext handles this
  // useEffect(() => {
  //   const loadApiUrl = async () => {
  //     try {
  //       const savedApiUrl = await AsyncStorage.getItem('apiUrl');
  //       if (savedApiUrl) {
  //         API_URL = savedApiUrl;
  //         console.log('PDFUploadScreen - Loaded custom API URL:', API_URL);
  //       }
  //     } catch (error) {
  //       console.error('Failed to load API URL from storage:', error);
  //     }
  //   };
  //   
  //   loadApiUrl();
  //   checkAiStatus();
  // }, []);

  const pickPDF = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });

      if (result.canceled === false && result.assets && result.assets.length > 0) {
        const selectedFile = result.assets[0];
        setPdfFile(selectedFile);
        setError('');
      }
    } catch (err) {
      console.error('Error picking document:', err);
      setError('Failed to select PDF file. Please try again.');
    }
  };

  const uploadPDF = async () => {
    if (!pdfFile) {
      setError('Please select a PDF file first.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Create FormData object for file upload
      const formData = new FormData();
      
      // Add the file to the form data
      const fileUri = pdfFile.uri;
      const fileName = pdfFile.name || 'document.pdf';
      
      // Create the file object
      const fileToUpload = {
        uri: fileUri,
        name: fileName,
        type: 'application/pdf'
      };
      
      formData.append('file', fileToUpload);

      // Send the request
      const response = await axios.post(`${apiUrl}/api/upload-pdf`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Navigate to the Summary screen with the response data
      navigation.navigate('Summary', { data: response.data });
    } catch (err) {
      console.error('Error uploading PDF:', err);
      setError('Failed to upload PDF. Please check your file and connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <LinearGradient
          colors={[theme.colors.primary, theme.colors.accent]}
          style={styles.header}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <IconButton
            icon="file-pdf-box"
            size={40}
            iconColor="#fff"
            style={styles.headerIcon}
          />
          <Title style={styles.headerTitle}>PDF Upload</Title>
          <Paragraph style={styles.headerSubtitle}>
            Convert PDF documents into interactive study materials
          </Paragraph>
        </LinearGradient>
      
        <Card style={styles.card} mode="elevated">
          <Card.Content>
            <Title style={styles.title}>Upload PDF Document</Title>
            <Paragraph style={styles.paragraph}>
              Select a PDF file from your device to analyze and create study materials.
              {isAiPowered && ' Our AI will generate high-quality summaries, quizzes, and flashcards.'}
            </Paragraph>
            
            {isAiPowered && (
              <Banner
                visible={true}
                style={styles.aiBanner}
                icon="brain"
              >
                AI will analyze your document for better results
              </Banner>
            )}
            
            <Button 
              mode="contained" 
              onPress={pickPDF}
              icon="file-pdf-box"
              style={styles.button}
              contentStyle={styles.buttonContent}
              disabled={loading}
            >
              Select PDF File
            </Button>
            
            {pdfFile && (
              <Surface style={styles.fileInfo}>
                <Title style={styles.fileInfoTitle}>Selected File</Title>
                <View style={styles.fileDetails}>
                  <IconButton 
                    icon="file-pdf-box" 
                    size={40} 
                    iconColor={theme.colors.primary}
                    style={styles.fileIcon}
                  />
                  <View style={styles.fileTextInfo}>
                    <Text style={styles.fileName}>{pdfFile.name}</Text>
                    <Text style={styles.fileSize}>Size: {(pdfFile.size / 1024).toFixed(2)} KB</Text>
                  </View>
                </View>
                <Divider style={styles.divider} />
              </Surface>
            )}
            
            {error ? (
              <Text style={styles.errorText}>{error}</Text>
            ) : null}
            
            <Button 
              mode="contained" 
              onPress={uploadPDF}
              disabled={!pdfFile || loading}
              loading={loading}
              icon="upload"
              style={[styles.uploadButton, { backgroundColor: theme.colors.primary }]}
              contentStyle={styles.buttonContent}
            >
              {loading ? 'Processing...' : 'Upload & Analyze'}
            </Button>
          </Card.Content>
        </Card>
        
        <Card style={styles.infoCard} mode="elevated">
          <Card.Content>
            <Title style={styles.infoTitle}>How it works</Title>
            <View style={styles.stepsContainer}>
              <View style={styles.stepContainer}>
                <Surface style={[styles.stepNumber, { backgroundColor: theme.colors.primary }]}>
                  <Text style={styles.stepNumberText}>1</Text>
                </Surface>
                <View style={styles.stepTextContainer}>
                  <Text style={styles.stepHeading}>Select PDF</Text>
                  <Paragraph style={styles.stepText}>Choose a PDF document from your device</Paragraph>
                </View>
              </View>
              
              <View style={styles.stepContainer}>
                <Surface style={[styles.stepNumber, { backgroundColor: theme.colors.primary }]}>
                  <Text style={styles.stepNumberText}>2</Text>
                </Surface>
                <View style={styles.stepTextContainer}>
                  <Text style={styles.stepHeading}>Upload File</Text>
                  <Paragraph style={styles.stepText}>Upload the file to our secure server</Paragraph>
                </View>
              </View>
              
              <View style={styles.stepContainer}>
                <Surface style={[styles.stepNumber, { backgroundColor: theme.colors.primary }]}>
                  <Text style={styles.stepNumberText}>3</Text>
                </Surface>
                <View style={styles.stepTextContainer}>
                  <Text style={styles.stepHeading}>AI Analysis</Text>
                  <Paragraph style={styles.stepText}>
                    {isAiPowered 
                      ? 'Our AI analyzes the content and extracts key information'
                      : 'Our system analyzes the content and extracts key information'}
                  </Paragraph>
                </View>
              </View>
              
              <View style={styles.stepContainer}>
                <Surface style={[styles.stepNumber, { backgroundColor: theme.colors.primary }]}>
                  <Text style={styles.stepNumberText}>4</Text>
                </Surface>
                <View style={styles.stepTextContainer}>
                  <Text style={styles.stepHeading}>Create Study Aids</Text>
                  <Paragraph style={styles.stepText}>Review the summary and create study aids</Paragraph>
                </View>
              </View>
            </View>
          </Card.Content>
        </Card>
      </View>
    </ScrollView>
  );
}

const makeStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
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
  card: {
    marginBottom: 16,
    elevation: 4,
    borderRadius: 12,
  },
  title: {
    marginBottom: 8,
    fontSize: 20,
  },
  paragraph: {
    marginBottom: 16,
  },
  button: {
    marginTop: 16,
    borderRadius: 30,
  },
  buttonContent: {
    height: 48,
    paddingHorizontal: 8,
  },
  fileInfo: {
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    elevation: 1,
  },
  fileInfoTitle: {
    fontSize: 16,
    marginBottom: 16,
  },
  fileDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fileIcon: {
    margin: 0,
    marginRight: 8,
  },
  fileTextInfo: {
    flex: 1,
  },
  fileName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  fileSize: {
    fontSize: 14,
    color: '#666',
  },
  divider: {
    marginTop: 16,
  },
  errorText: {
    color: theme.colors.error,
    marginTop: 16,
  },
  uploadButton: {
    marginTop: 24,
    borderRadius: 30,
  },
  infoCard: {
    marginBottom: 16,
    elevation: 2,
    borderRadius: 12,
  },
  infoTitle: {
    marginBottom: 16,
    fontSize: 20,
  },
  stepsContainer: {
    marginTop: 8,
  },
  stepContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  stepNumber: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    elevation: 2,
  },
  stepNumberText: {
    color: 'white',
    fontWeight: 'bold',
  },
  stepTextContainer: {
    flex: 1,
  },
  stepHeading: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  stepText: {
    flex: 1,
    color: '#666',
  },
  aiBanner: {
    marginVertical: 16,
    backgroundColor: 'rgba(67, 97, 238, 0.1)',
    borderRadius: 12,
  },
}); 