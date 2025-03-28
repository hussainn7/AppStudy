import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Image, Platform, StatusBar, Dimensions, ScrollView, SafeAreaView } from 'react-native';
import { Button, Title, Card, Paragraph, useTheme, Banner, Chip, IconButton, Surface, Text, Divider, Avatar } from 'react-native-paper';
import axios from 'axios';
import { useApi } from '../contexts/ApiContext';
import { useAuth } from '../contexts/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');
const cardWidth = width > 600 ? (width - 64) / 2 : width - 32;

export default function HomeScreen({ navigation }) {
  const theme = useTheme();
  const { apiUrl, isAiPowered, checkAiStatus } = useApi();
  const { user, isAdmin } = useAuth();
  const [bannerVisible, setBannerVisible] = useState(true);
  const [connectionTested, setConnectionTested] = useState(false);
  
  // Create styles with the theme
  const styles = makeStyles(theme);

  // Add profile button to the header
  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <IconButton
          icon="account-circle"
          iconColor="white"
          size={24}
          onPress={() => navigation.navigate('Profile')}
        />
      ),
    });
  }, [navigation]);

  // Check AI status when component mounts or API URL changes
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const result = await checkAiStatus();
        setConnectionTested(true);
      } catch (err) {
        console.error('Could not determine AI status:', err);
        
        // If connection fails on first load and we're on iOS, suggest checking settings
        if (Platform.OS === 'ios' && !connectionTested) {
          navigation.navigate('Settings');
        }
      }
    };
    
    checkStatus();
  }, [apiUrl]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar backgroundColor={theme.colors.primary} barStyle="light-content" />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <LinearGradient
          colors={[theme.colors.primary, theme.colors.accent]}
          style={styles.header}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Title style={styles.title}>Study Companion</Title>
          <View style={styles.subtitleContainer}>
            <View style={styles.welcomeContainer}>
              <Text style={styles.welcomeText}>
                Welcome, {user?.username || 'User'}!
              </Text>
              {isAdmin && (
                <Chip 
                  icon="shield-account" 
                  mode="outlined" 
                  style={styles.adminChip}
                  textStyle={{ color: '#fff' }}
                >
                  Admin
                </Chip>
              )}
            </View>
            <Paragraph style={styles.subtitle}>
              Transform content into interactive study aids
            </Paragraph>
            {isAiPowered && (
              <Chip 
                icon="brain" 
                mode="outlined" 
                style={styles.aiChip}
                textStyle={{ color: '#fff' }}
              >
                AI Enhanced
              </Chip>
            )}
          </View>
        </LinearGradient>

        {isAiPowered && bannerVisible && (
          <Banner
            visible={true}
            actions={[
              {
                label: 'Learn More',
                onPress: () => console.log('Learn more about AI features'),
              },
              {
                label: 'Dismiss',
                onPress: () => setBannerVisible(false),
              },
            ]}
            icon={({size}) => (
              <IconButton
                icon="robot"
                size={size}
                iconColor={theme.colors.accent}
              />
            )}
            style={styles.banner}
          >
            This app is now powered by AI! Experience enhanced summaries, quizzes, and flashcards.
          </Banner>
        )}

        <View style={styles.cardsContainer}>
          <Surface style={styles.cardsWrapper}>
            <Card style={styles.card} mode="elevated">
              <Card.Content style={styles.cardContent}>
                <IconButton
                  icon="text-box" 
                  size={36}
                  iconColor={theme.colors.primary}
                  style={styles.cardIcon}
                />
                <Title style={styles.cardTitle}>Text Input</Title>
                <Paragraph style={styles.cardDesc}>
                  Paste your text to generate summaries, quizzes, and flashcards
                </Paragraph>
              </Card.Content>
              <Card.Actions style={styles.cardActions}>
                <Button 
                  mode="contained" 
                  onPress={() => navigation.navigate('TextInput')}
                  style={styles.button}
                  contentStyle={styles.buttonContent}
                  icon={isAiPowered ? "text-box-check" : undefined}
                >
                  Enter Text
                </Button>
              </Card.Actions>
            </Card>

            <Card style={styles.card} mode="elevated">
              <Card.Content style={styles.cardContent}>
                <IconButton
                  icon="file-pdf-box" 
                  size={36}
                  iconColor={theme.colors.accent}
                  style={styles.cardIcon}
                />
                <Title style={styles.cardTitle}>PDF Upload</Title>
                <Paragraph style={styles.cardDesc}>
                  Upload PDF documents to extract content and create study materials
                </Paragraph>
              </Card.Content>
              <Card.Actions style={styles.cardActions}>
                <Button 
                  mode="contained"
                  onPress={() => navigation.navigate('PDFUpload')}
                  style={[styles.button, {backgroundColor: theme.colors.accent}]}
                  contentStyle={styles.buttonContent}
                  icon={isAiPowered ? "file-document-check" : undefined}
                >
                  Upload PDF
                </Button>
              </Card.Actions>
            </Card>
            
            <Card style={styles.card} mode="elevated">
              <Card.Content style={styles.cardContent}>
                <IconButton
                  icon="youtube" 
                  size={36}
                  iconColor="#FF0000"
                  style={styles.cardIcon}
                />
                <Title style={styles.cardTitle}>YouTube Video</Title>
                <Paragraph style={styles.cardDesc}>
                  Extract transcript from YouTube videos for learning materials
                </Paragraph>
              </Card.Content>
              <Card.Actions style={styles.cardActions}>
                <Button 
                  mode="contained"
                  onPress={() => navigation.navigate('YouTube')}
                  style={[styles.button, {backgroundColor: '#FF0000'}]}
                  contentStyle={styles.buttonContent}
                  icon="play"
                >
                  Analyze Video
                </Button>
              </Card.Actions>
            </Card>
            
            <Card style={styles.card} mode="elevated">
              <Card.Content style={styles.cardContent}>
                <IconButton
                  icon="microphone" 
                  size={36}
                  iconColor="#9C27B0"
                  style={styles.cardIcon}
                />
                <Title style={styles.cardTitle}>Voice Note</Title>
                <Paragraph style={styles.cardDesc}>
                  Record your voice and convert to study materials
                </Paragraph>
              </Card.Content>
              <Card.Actions style={styles.cardActions}>
                <Button 
                  mode="contained"
                  onPress={() => navigation.navigate('VoiceNote')}
                  style={[styles.button, {backgroundColor: '#9C27B0'}]}
                  contentStyle={styles.buttonContent}
                  icon="record"
                >
                  Record Voice
                </Button>
              </Card.Actions>
            </Card>
            
            <Card style={styles.card} mode="elevated">
              <Card.Content style={styles.cardContent}>
                <IconButton
                  icon="account-circle" 
                  size={36}
                  iconColor={theme.colors.primary}
                  style={styles.cardIcon}
                />
                <Title style={styles.cardTitle}>Profile</Title>
                <Paragraph style={styles.cardDesc}>
                  View your account information and manage your profile
                </Paragraph>
              </Card.Content>
              <Card.Actions style={styles.cardActions}>
                <Button 
                  mode="contained"
                  onPress={() => navigation.navigate('Profile')}
                  style={[styles.button, {backgroundColor: theme.colors.primary}]}
                  contentStyle={styles.buttonContent}
                  icon="account"
                >
                  My Profile
                </Button>
              </Card.Actions>
            </Card>
            
            <Card style={styles.card} mode="elevated">
              <Card.Content style={styles.cardContent}>
                <IconButton
                  icon="cog" 
                  size={36}
                  iconColor={theme.colors.text}
                  style={styles.cardIcon}
                />
                <Title style={styles.cardTitle}>Settings</Title>
                <Paragraph style={styles.cardDesc}>
                  Configure how the app connects to the backend server
                </Paragraph>
              </Card.Content>
              <Card.Actions style={styles.cardActions}>
                <Button 
                  mode="outlined"
                  onPress={() => navigation.navigate('Settings')}
                  style={styles.settingsButton}
                  contentStyle={styles.buttonContent}
                  icon="cog"
                >
                  Settings
                </Button>
              </Card.Actions>
            </Card>
          </Surface>
        </View>

        <View style={styles.footer}>
          <Divider style={styles.footerDivider} />
          <Text style={styles.footerText}>
            {isAiPowered 
              ? 'Supercharged with AI for intelligent learning'
              : 'Your comprehensive learning partner'}
          </Text>
          <Text style={styles.versionText}>Version 2.0</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (theme) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 40,
    paddingBottom: 30,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  banner: {
    marginHorizontal: 16,
    marginTop: -20,
    marginBottom: 16,
    borderRadius: 12,
    elevation: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
    color: '#fff',
  },
  subtitleContainer: {
    alignItems: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.9,
    marginBottom: 8,
    color: '#fff',
  },
  aiChip: {
    borderColor: '#fff',
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  cardsContainer: {
    flex: 1,
    padding: 16,
  },
  cardsWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    width: cardWidth,
    marginBottom: 16,
    borderRadius: 16,
    elevation: 4,
    overflow: 'hidden',
  },
  cardContent: {
    padding: 16,
    alignItems: 'center',
  },
  cardIcon: {
    marginBottom: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 40,
  },
  cardTitle: {
    fontSize: 18,
    marginBottom: 8,
    textAlign: 'center',
  },
  cardDesc: {
    textAlign: 'center',
    fontSize: 14,
    color: '#666',
  },
  cardActions: {
    justifyContent: 'center',
    padding: 16,
    paddingTop: 0,
  },
  button: {
    width: '100%',
    borderRadius: 30,
    elevation: 0,
  },
  buttonContent: {
    height: 44,
  },
  settingsButton: {
    width: '100%',
    borderRadius: 30,
  },
  footer: {
    padding: 16,
    alignItems: 'center',
  },
  footerDivider: {
    width: '100%',
    marginBottom: 16,
  },
  footerText: {
    opacity: 0.7,
    fontSize: 13,
  },
  versionText: {
    fontSize: 12,
    opacity: 0.5,
    marginTop: 4,
  },
  welcomeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  welcomeText: {
    color: 'white',
    fontSize: 16,
    marginRight: 8,
  },
  adminChip: {
    borderColor: '#fff',
    backgroundColor: 'rgba(255,0,0,0.2)',
  },
}); 