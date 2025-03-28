import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Platform } from 'react-native';
import { 
  Card, 
  Title, 
  Paragraph, 
  Button, 
  Divider, 
  Chip, 
  Text,
  Dialog, 
  Portal,
  Snackbar,
  useTheme,
  Badge,
  IconButton,
  TextInput,
  Surface
} from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';
import { useApi } from '../contexts/ApiContext';

// Log the platform for debugging
console.log('SummaryScreen - Platform:', Platform.OS);

export default function SummaryScreen({ route, navigation }) {
  const { data } = route.params;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogType, setDialogType] = useState('quiz');
  const [numberOfItems, setNumberOfItems] = useState(5);
  const theme = useTheme();
  const { apiUrl, isAiPowered } = useApi();

  // No longer needed as it's provided by ApiContext
  // useEffect(() => {
  //   checkAiStatus();
  // }, []);

  const generateQuiz = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Use text_preview for YouTube sources or full_text for other sources
      const textToUse = data.source === 'youtube' ? 
        (data.text_preview || '').slice(0, 500) + '...' : 
        data.full_text;
      
      const response = await axios.post(`${apiUrl}/api/generate-quiz`, {
        text: textToUse,
        quiz_type: 'all',
        num_questions: numberOfItems,
        source: data.source || 'text'
      });
      
      navigation.navigate('Quiz', { 
        quizData: response.data,
        original: data,
        isAiPowered: isAiPowered
      });
    } catch (err) {
      console.error('Error generating quiz:', err);
      setError('Failed to generate quiz. Please try again.');
      setSnackbarVisible(true);
    } finally {
      setLoading(false);
      setDialogVisible(false);
    }
  };

  const generateFlashcards = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Use text_preview for YouTube sources or full_text for other sources
      const textToUse = data.source === 'youtube' ? 
        (data.text_preview || '').slice(0, 500) + '...' : 
        data.full_text;
      
      const response = await axios.post(`${apiUrl}/api/generate-flashcards`, {
        text: textToUse,
        num_cards: numberOfItems,
        source: data.source || 'text'
      });
      
      navigation.navigate('Flashcards', { 
        flashcardsData: response.data,
        original: data,
        isAiPowered: isAiPowered
      });
    } catch (err) {
      console.error('Error generating flashcards:', err);
      setError('Failed to generate flashcards. Please try again.');
      setSnackbarVisible(true);
    } finally {
      setLoading(false);
      setDialogVisible(false);
    }
  };

  const showDialog = (type) => {
    setDialogType(type);
    setDialogVisible(true);
  };

  const hideDialog = () => {
    setDialogVisible(false);
  };

  const handleSubmit = () => {
    if (dialogType === 'quiz') {
      generateQuiz();
    } else if (dialogType === 'flashcards') {
      generateFlashcards();
    }
  };

  // Component to show the AI badge
  const AiBadge = () => (
    <View style={styles.aiBadgeContainer}>
      <Badge style={styles.aiBadge}>AI</Badge>
      <Text style={styles.aiBadgeText}>AI Powered</Text>
    </View>
  );

  // Create styles with the theme
  const styles = makeStyles(theme);

  // Render a YouTube source indicator if applicable
  const renderSourceIndicator = () => {
    if (data.source === 'youtube') {
      return (
        <Card style={styles.sourceCard} mode="elevated">
          <Card.Content>
            <View style={styles.youtubeContainer}>
              <IconButton icon="youtube" size={24} iconColor="#FF0000" />
              <View style={styles.sourceInfo}>
                <Text style={styles.sourceTitle}>YouTube Video Transcript</Text>
                <Text style={styles.sourceSubtitle}>
                  {data.transcript_size ? `${Math.round(data.transcript_size / 1000)}K characters processed` : 'Transcript processed'}
                </Text>
              </View>
            </View>
            
            {data.text_preview && (
              <View style={styles.previewContainer}>
                <Text style={styles.previewTitle}>Transcript Preview:</Text>
                <Text style={styles.previewText} numberOfLines={3}>
                  {data.text_preview}
                </Text>
              </View>
            )}
          </Card.Content>
        </Card>
      );
    }
    return null;
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {isAiPowered && (
          <Surface style={styles.aiPoweredBanner}>
            <LinearGradient
              colors={[theme.colors.primary, theme.colors.accent]}
              style={styles.aiGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <IconButton icon="robot" size={24} iconColor="#fff" />
              <Text style={styles.aiPoweredText}>
                Enhanced with AI
              </Text>
              <IconButton 
                icon="information-outline"
                size={20}
                iconColor="#fff"
                onPress={() => {
                  setError('This summary is powered by advanced AI, providing higher quality analysis and learning materials.');
                  setSnackbarVisible(true);
                }}
              />
            </LinearGradient>
          </Surface>
        )}

        {/* Add the YouTube source indicator if applicable */}
        {renderSourceIndicator()}

        <Card style={styles.card} mode="elevated">
          <Card.Content>
            <View style={styles.cardHeader}>
              <Title style={styles.cardTitle}>Summary</Title>
              {isAiPowered && <AiBadge />}
            </View>
            <Paragraph style={styles.summaryText}>{data.summary}</Paragraph>
          </Card.Content>
        </Card>

        <Card style={styles.card} mode="elevated">
          <Card.Content>
            <View style={styles.cardHeader}>
              <Title style={styles.cardTitle}>Key Points</Title>
              {isAiPowered && <AiBadge />}
            </View>
            {data.key_points.map((point, index) => (
              <View key={index} style={styles.keyPointContainer}>
                <Surface style={styles.bulletPoint} />
                <Paragraph style={styles.keyPoint}>
                  {point}
                </Paragraph>
              </View>
            ))}
          </Card.Content>
        </Card>

        <Card style={styles.card} mode="elevated">
          <Card.Content>
            <View style={styles.cardHeader}>
              <Title style={styles.cardTitle}>Key Concepts</Title>
              {isAiPowered && <AiBadge />}
            </View>
            <View style={styles.chipContainer}>
              {data.key_concepts.map((concept, index) => (
                <Chip 
                  key={index} 
                  style={styles.chip} 
                  mode="outlined"
                  icon="lightbulb-outline"
                >
                  {concept}
                </Chip>
              ))}
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.card} mode="elevated">
          <Card.Content>
            <Title style={styles.cardTitle}>Statistics</Title>
            <View style={styles.statsContainer}>
              <Surface style={styles.statItem}>
                <Text style={styles.statValue}>{data.word_count}</Text>
                <Text style={styles.statLabel}>Words</Text>
              </Surface>
              <Surface style={styles.statItem}>
                <Text style={styles.statValue}>{data.sentence_count}</Text>
                <Text style={styles.statLabel}>Sentences</Text>
              </Surface>
              {data.source === 'youtube' && (
                <Surface style={styles.statItem}>
                  <Text style={styles.statValue}>
                    <IconButton icon="youtube" size={20} style={styles.inlineIcon} />
                  </Text>
                  <Text style={styles.statLabel}>YouTube</Text>
                </Surface>
              )}
            </View>
          </Card.Content>
        </Card>

        <View style={styles.buttonContainer}>
          <Button 
            mode="contained" 
            onPress={() => showDialog('quiz')} 
            style={[styles.button, { backgroundColor: theme.colors.primary }]}
            loading={loading && dialogType === 'quiz'}
            disabled={loading}
            icon={isAiPowered ? "brain" : "help-circle-outline"}
            contentStyle={styles.buttonContent}
          >
            Generate Quiz{isAiPowered ? " with AI" : ""}
          </Button>
          <Button 
            mode="contained" 
            onPress={() => showDialog('flashcards')} 
            style={[styles.button, { backgroundColor: theme.colors.accent }]}
            loading={loading && dialogType === 'flashcards'}
            disabled={loading}
            icon={isAiPowered ? "brain" : "cards-outline"}
            contentStyle={styles.buttonContent}
          >
            Create Flashcards{isAiPowered ? " with AI" : ""}
          </Button>
        </View>
      </View>

      <Portal>
        <Dialog visible={dialogVisible} onDismiss={hideDialog}>
          <Dialog.Title>
            {dialogType === 'quiz' ? 'Generate Quiz' : 'Create Flashcards'}
            {isAiPowered && <Text style={styles.dialogAiText}> with AI</Text>}
          </Dialog.Title>
          <Dialog.Content>
            {isAiPowered && (
              <View style={styles.aiNotice}>
                <IconButton icon="robot" size={20} />
                <Paragraph style={styles.aiNoticeText}>
                  Your {dialogType === 'quiz' ? 'questions' : 'flashcards'} will be generated using advanced AI for enhanced quality and accuracy.
                </Paragraph>
              </View>
            )}
            <Paragraph>
              {dialogType === 'quiz' 
                ? 'How many questions would you like in your quiz?' 
                : 'How many flashcards would you like to create?'}
            </Paragraph>
            <View style={styles.countSelector}>
              <Button 
                mode="outlined" 
                onPress={() => setNumberOfItems(Math.max(3, numberOfItems - 1))}
              >
                -
              </Button>
              <Text style={styles.count}>{numberOfItems}</Text>
              <Button 
                mode="outlined" 
                onPress={() => setNumberOfItems(Math.min(20, numberOfItems + 1))}
              >
                +
              </Button>
            </View>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={hideDialog}>Cancel</Button>
            <Button 
              onPress={handleSubmit} 
              loading={loading}
              disabled={loading}
            >
              Confirm
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        action={{
          label: 'OK',
          onPress: () => setSnackbarVisible(false),
        }}
      >
        {error}
      </Snackbar>
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
  card: {
    marginBottom: 16,
    elevation: 4,
    borderRadius: 12,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 20,
  },
  summaryText: {
    lineHeight: 22,
  },
  keyPointContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  bulletPoint: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.primary,
    marginTop: 6,
    marginRight: 10,
  },
  keyPoint: {
    flex: 1,
    lineHeight: 20,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  chip: {
    margin: 4,
    backgroundColor: 'rgba(0,0,0,0.03)',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
  },
  statItem: {
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    elevation: 2,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  statLabel: {
    opacity: 0.7,
    marginTop: 4,
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
  buttonContent: {
    height: 48,
  },
  countSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  count: {
    fontSize: 24,
    fontWeight: 'bold',
    marginHorizontal: 16,
  },
  aiPoweredBanner: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    elevation: 4,
  },
  aiGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  aiPoweredText: {
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
    textAlign: 'center',
  },
  aiBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  aiBadge: {
    backgroundColor: theme.colors.accent,
  },
  aiBadgeText: {
    fontSize: 12,
    marginLeft: 4,
    color: '#666',
  },
  dialogAiText: {
    fontSize: 14,
    fontStyle: 'italic',
    color: '#666',
  },
  aiNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    backgroundColor: 'rgba(67, 97, 238, 0.1)',
  },
  aiNoticeText: {
    flex: 1,
    fontSize: 14,
  },
  inlineIcon: {
    margin: 0,
    padding: 0,
  },
  sourceCard: {
    marginBottom: 16,
    elevation: 2,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FF0000',
  },
  youtubeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sourceInfo: {
    flex: 1,
  },
  sourceTitle: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  sourceSubtitle: {
    opacity: 0.7,
    fontSize: 12,
  },
  previewContainer: {
    marginTop: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
  },
  previewTitle: {
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 4,
  },
  previewText: {
    fontStyle: 'italic',
    fontSize: 13,
    color: '#555',
  }
}); 