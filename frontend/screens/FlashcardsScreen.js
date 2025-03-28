import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, TouchableWithoutFeedback, Platform, ScrollView, SafeAreaView } from 'react-native';
import { Card, Title, Paragraph, Button, IconButton, Text, useTheme, Surface, Badge, Chip } from 'react-native-paper';
import { Dimensions } from 'react-native';
import { useApi } from '../contexts/ApiContext';

const { width, height } = Dimensions.get('window');
const cardWidth = width * 0.9;
const cardHeight = Math.min(height * 0.5, 400); // Limit max height for better scrolling

// Log the platform for debugging
console.log('FlashcardsScreen - Platform:', Platform.OS);

export default function FlashcardsScreen({ route, navigation }) {
  const { flashcardsData, original, isAiPowered } = route.params;
  const flashcards = flashcardsData.flashcards || [];
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const flipAnimation = useRef(new Animated.Value(0)).current;
  const theme = useTheme();
  const { apiUrl } = useApi();
  
  // No longer needed as ApiContext handles this
  // useEffect(() => {
  //   const loadApiUrl = async () => {
  //     try {
  //       const savedApiUrl = await AsyncStorage.getItem('apiUrl');
  //       if (savedApiUrl) {
  //         API_URL = savedApiUrl;
  //         console.log('FlashcardsScreen - Loaded custom API URL:', API_URL);
  //       }
  //     } catch (error) {
  //       console.error('Failed to load API URL from storage:', error);
  //     }
  //   };
  //   
  //   loadApiUrl();
  // }, []);

  const frontInterpolate = flipAnimation.interpolate({
    inputRange: [0, 180],
    outputRange: ['0deg', '180deg'],
  });

  const backInterpolate = flipAnimation.interpolate({
    inputRange: [0, 180],
    outputRange: ['180deg', '360deg'],
  });

  const frontOpacity = flipAnimation.interpolate({
    inputRange: [89, 90],
    outputRange: [1, 0],
  });

  const backOpacity = flipAnimation.interpolate({
    inputRange: [89, 90],
    outputRange: [0, 1],
  });

  const frontAnimatedStyle = {
    transform: [{ rotateY: frontInterpolate }],
    opacity: frontOpacity,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  };

  const backAnimatedStyle = {
    transform: [{ rotateY: backInterpolate }],
    opacity: backOpacity,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  };

  const flipCard = () => {
    if (isFlipped) {
      Animated.spring(flipAnimation, {
        toValue: 0,
        friction: 8,
        tension: 10,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.spring(flipAnimation, {
        toValue: 180,
        friction: 8,
        tension: 10,
        useNativeDriver: true,
      }).start();
    }
    setIsFlipped(!isFlipped);
  };

  const nextCard = () => {
    if (currentCardIndex < flashcards.length - 1) {
      if (isFlipped) {
        flipCard(); // Flip back before showing next card
      }
      setCurrentCardIndex(currentCardIndex + 1);
    }
  };

  const prevCard = () => {
    if (currentCardIndex > 0) {
      if (isFlipped) {
        flipCard(); // Flip back before showing previous card
      }
      setCurrentCardIndex(currentCardIndex - 1);
    }
  };

  const renderCardContent = () => {
    if (!flashcards || flashcards.length === 0) {
      return (
        <View style={styles.cardContainer}>
          <Text>No flashcards available.</Text>
        </View>
      );
    }
    
    const currentCard = flashcards[currentCardIndex];
    
    return (
      <View style={styles.cardContainer}>
        <TouchableWithoutFeedback onPress={flipCard}>
          <View style={styles.cardWrapper}>
            <Animated.View style={[styles.card, frontAnimatedStyle]}>
              <Surface style={styles.cardSurface}>
                <View style={styles.termLabelContainer}>
                  <Text style={styles.termLabel}>TERM</Text>
                </View>
                {isAiPowered && (
                  <View style={styles.aiBadgeContainer}>
                    <Badge style={styles.aiBadge}>AI</Badge>
                  </View>
                )}
                <Paragraph style={styles.cardContent}>
                  {currentCard.front}
                </Paragraph>
                
                {currentCard.context && (
                  <Paragraph style={styles.cardContext}>
                    Context: {currentCard.context}
                  </Paragraph>
                )}
                
                <Text style={styles.cardInstruction}>
                  Tap to flip
                </Text>
              </Surface>
            </Animated.View>
            
            <Animated.View style={[styles.card, backAnimatedStyle]}>
              <Surface style={styles.cardSurface}>
                <View style={styles.definitionContainer}>
                  <Text style={styles.definitionLabel}>DEFINITION</Text>
                </View>
                {isAiPowered && (
                  <View style={styles.aiBadgeContainer}>
                    <Badge style={styles.aiBadge}>AI</Badge>
                  </View>
                )}
                <Paragraph style={styles.cardContent}>
                  {currentCard.back}
                </Paragraph>
                
                {currentCard.example && (
                  <View style={styles.exampleContainer}>
                    <Text style={styles.exampleLabel}>EXAMPLE:</Text>
                    <Paragraph style={styles.exampleText}>
                      {currentCard.example}
                    </Paragraph>
                  </View>
                )}
                
                {currentCard.related_concepts && currentCard.related_concepts.length > 0 && (
                  <View style={styles.relatedContainer}>
                    <Text style={styles.relatedLabel}>RELATED CONCEPTS:</Text>
                    <View style={styles.relatedChipsContainer}>
                      {currentCard.related_concepts.map((concept, index) => (
                        <Chip key={index} style={styles.relatedChip} small>
                          {concept}
                        </Chip>
                      ))}
                    </View>
                  </View>
                )}
                
                <Text style={styles.tapInstruction}>
                  Tap to flip back
                </Text>
              </Surface>
            </Animated.View>
          </View>
        </TouchableWithoutFeedback>
      </View>
    );
  };

  // Create styles with the theme
  const styles = makeStyles(theme);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContainer} bounces={false}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.progress}>
              Card {currentCardIndex + 1} of {flashcards.length}
            </Text>
            {isAiPowered && (
              <View style={styles.aiPoweredBanner}>
                <IconButton icon="robot" size={16} />
                <Text style={styles.aiPoweredText}>
                  Enhanced with AI
                </Text>
              </View>
            )}
          </View>
          
          {renderCardContent()}
          
          <View style={styles.controls}>
            <IconButton 
              icon="arrow-left" 
              size={30}
              onPress={prevCard}
              disabled={currentCardIndex === 0}
              style={[styles.navButton, currentCardIndex === 0 ? styles.disabledButton : null]}
            />
            
            <Button 
              mode="text" 
              onPress={flipCard}
              style={styles.flipButton}
            >
              Flip
            </Button>
            
            <IconButton 
              icon="arrow-right" 
              size={30}
              onPress={nextCard}
              disabled={currentCardIndex === flashcards.length - 1}
              style={[styles.navButton, currentCardIndex === flashcards.length - 1 ? styles.disabledButton : null]}
            />
          </View>
          
          <View style={styles.footer}>
            <Button 
              mode="outlined" 
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
              Back to Summary
            </Button>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (theme) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f6f6f6',
  },
  scrollContainer: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    backgroundColor: '#f6f6f6',
    minHeight: height - 100, // Ensure enough space for scrolling
  },
  header: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  progress: {
    fontSize: 18,
    opacity: 0.7,
  },
  aiPoweredBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 8,
    backgroundColor: 'rgba(67, 97, 238, 0.1)',
  },
  aiPoweredText: {
    fontSize: 12,
    marginLeft: 4,
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
  cardContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    height: cardHeight + 40, // Add some extra height
  },
  cardWrapper: {
    width: cardWidth,
    height: cardHeight,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    width: '100%',
    height: '100%',
    backfaceVisibility: 'hidden',
  },
  cardSurface: {
    padding: 24,
    elevation: 4,
    borderRadius: 12,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  cardFront: {
    backgroundColor: 'white',
  },
  cardBack: {
    backgroundColor: 'white',
  },
  termLabelContainer: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: '#e0e0e0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  termLabel: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  aiBadgeContainer: {
    position: 'absolute',
    top: 16,
    right: 16,
  },
  aiBadge: {
    backgroundColor: '#00bcd4',
  },
  definitionContainer: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: '#e1f5fe',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  definitionLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#0277bd',
  },
  cardTitle: {
    fontSize: 24,
    marginBottom: 16,
    textAlign: 'center',
  },
  cardContent: {
    fontSize: 18,
    textAlign: 'center',
    lineHeight: 24,
  },
  cardContext: {
    textAlign: 'center',
    marginTop: 20,
    fontStyle: 'italic',
    fontSize: 14,
    paddingHorizontal: 12,
    color: '#666',
  },
  cardInstruction: {
    position: 'absolute',
    bottom: 24,
    opacity: 0.5,
    fontStyle: 'italic',
  },
  tapInstruction: {
    position: 'absolute',
    bottom: 24,
    opacity: 0.5,
    fontStyle: 'italic',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 16,
  },
  navButton: {
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  disabledButton: {
    opacity: 0.3,
  },
  flipButton: {
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  footer: {
    padding: 16,
    alignItems: 'center',
  },
  backButton: {
    marginBottom: 16,
  },
  errorCard: {
    margin: 16,
    padding: 8,
  },
  errorTitle: {
    textAlign: 'center',
    marginBottom: 16,
  },
  cardActions: {
    justifyContent: 'center',
    padding: 16,
  },
  exampleContainer: {
    marginTop: 16,
    marginBottom: 16,
    width: '100%',
    backgroundColor: 'rgba(0,0,0,0.03)',
    padding: 12,
    borderRadius: 8,
  },
  exampleLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4,
    color: theme.colors.primary,
  },
  exampleText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  relatedContainer: {
    marginTop: 8,
    marginBottom: 16,
    width: '100%',
  },
  relatedLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
    color: theme.colors.primary,
  },
  relatedChipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  relatedChip: {
    margin: 4,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
}); 