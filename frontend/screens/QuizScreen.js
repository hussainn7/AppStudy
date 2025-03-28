import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Platform, SafeAreaView, TouchableOpacity } from 'react-native';
import { 
  Card, 
  Title, 
  Paragraph, 
  Button, 
  RadioButton, 
  Checkbox,
  ProgressBar,
  IconButton, 
  Text,
  Divider,
  useTheme,
  Badge
} from 'react-native-paper';
import { useApi } from '../contexts/ApiContext';

// Log the platform for debugging
console.log('QuizScreen - Platform:', Platform.OS);

export default function QuizScreen({ route, navigation }) {
  const { quizData, original, isAiPowered } = route.params;
  const questions = quizData.questions || [];
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [selectedAnswers, setSelectedAnswers] = useState([]); // For multiple-select questions
  const [textAnswer, setTextAnswer] = useState('');
  const [showExplanation, setShowExplanation] = useState(false);
  const [answered, setAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const [userAnswers, setUserAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [isCorrect, setIsCorrect] = useState(null);
  const theme = useTheme();
  const { apiUrl } = useApi();
  
  // No longer needed as ApiContext handles this
  // useEffect(() => {
  //   const loadApiUrl = async () => {
  //     try {
  //       const savedApiUrl = await AsyncStorage.getItem('apiUrl');
  //       if (savedApiUrl) {
  //         API_URL = savedApiUrl;
  //         console.log('QuizScreen - Loaded custom API URL:', API_URL);
  //       }
  //     } catch (error) {
  //       console.error('Failed to load API URL from storage:', error);
  //     }
  //   };
  //   
  //   loadApiUrl();
  // }, []);

  const currentQuestion = questions[currentQuestionIndex];

  const handleAnswerSelection = (answer) => {
    setSelectedAnswer(answer);
    if (currentQuestion.type === 'multiple-choice') {
      setSelectedOption(answer);
    }
  };

  const checkAnswer = () => {
    if (!selectedAnswer && currentQuestion.type !== 'open-ended') {
      return; // Don't proceed if no answer selected for MC or T/F
    }

    let correct = false;
    if (currentQuestion.type === 'multiple-choice') {
      correct = selectedAnswer === currentQuestion.answer;
    } else if (currentQuestion.type === 'true-false') {
      correct = selectedAnswer === currentQuestion.answer;
    } else {
      // For open-ended questions, always mark as reviewed
      correct = null;
    }

    setIsCorrect(correct);
    setShowAnswer(true);

    // Store user's answer
    setUserAnswers({
      ...userAnswers,
      [currentQuestionIndex]: {
        question: currentQuestion.question,
        userAnswer: selectedAnswer,
        correctAnswer: currentQuestion.answer,
        isCorrect: correct,
        type: currentQuestion.type
      }
    });

    // Update score
    if (correct === true) {
      setScore(score + 1);
    }
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
      setSelectedOption(null);
      setIsCorrect(null);
      setShowAnswer(false);
    } else {
      // Quiz completed
      setQuizCompleted(true);
    }
  };

  const restartQuiz = () => {
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setSelectedOption(null);
    setIsCorrect(null);
    setShowAnswer(false);
    setUserAnswers({});
    setScore(0);
    setQuizCompleted(false);
  };

  const renderQuestion = () => {
    if (!currentQuestion) return null;

    return (
      <Card style={styles.questionCard}>
        <Card.Content>
          <View style={styles.questionHeader}>
            <View style={styles.questionTypeContainer}>
              <Text style={styles.questionType}>
                {currentQuestion.type === 'multiple-choice' ? 'Multiple Choice' : 
                currentQuestion.type === 'true-false' ? 'True/False' : 'Open-ended'}
              </Text>
              {isAiPowered && (
                <View style={styles.aiBadgeContainer}>
                  <Badge style={styles.aiBadge}>AI</Badge>
                </View>
              )}
            </View>
            <Text style={styles.questionCounter}>
              {currentQuestionIndex + 1}/{questions.length}
            </Text>
          </View>

          <Title style={styles.questionText}>{currentQuestion.question}</Title>

          {renderAnswerOptions()}

          {showAnswer && renderAnswer()}
        </Card.Content>

        <Card.Actions style={styles.cardActions}>
          {!showAnswer ? (
            <Button 
              mode="contained" 
              onPress={checkAnswer}
              disabled={currentQuestion.type !== 'open-ended' && !selectedAnswer}
              style={styles.actionButton}
            >
              Check Answer
            </Button>
          ) : (
            <Button 
              mode="contained" 
              onPress={nextQuestion}
              style={[styles.actionButton, { backgroundColor: theme.colors.accent }]}
            >
              {currentQuestionIndex < questions.length - 1 ? 'Next Question' : 'Finish Quiz'}
            </Button>
          )}
        </Card.Actions>
      </Card>
    );
  };

  const renderAnswerOptions = () => {
    if (!currentQuestion) return null;

    if (currentQuestion.type === 'multiple-choice') {
      return (
        <View style={styles.optionsContainer}>
          {currentQuestion.options.map((option, index) => (
            <TouchableOpacity 
              key={index} 
              style={[
                styles.optionTouchable,
                showAnswer && option === currentQuestion.answer && styles.correctOptionTouchable,
                showAnswer && selectedOption === option && option !== currentQuestion.answer && styles.incorrectOptionTouchable
              ]}
              onPress={() => !showAnswer && handleAnswerSelection(option)}
              activeOpacity={0.7}
              disabled={showAnswer}
            >
              <View style={styles.optionInner}>
                <View style={[
                  styles.radioOuter,
                  selectedOption === option ? styles.radioOuterSelected : {},
                  showAnswer && option === currentQuestion.answer ? styles.radioOuterCorrect : {},
                  showAnswer && selectedOption === option && option !== currentQuestion.answer ? styles.radioOuterIncorrect : {}
                ]}>
                  {selectedOption === option && (
                    <View style={[
                      styles.radioInner,
                      showAnswer && option === currentQuestion.answer ? styles.radioInnerCorrect : {},
                      showAnswer && option !== currentQuestion.answer ? styles.radioInnerIncorrect : {}
                    ]} />
                  )}
                </View>
                <Text style={[
                  styles.optionText,
                  showAnswer && option === currentQuestion.answer && styles.correctOptionText,
                  showAnswer && selectedOption === option && option !== currentQuestion.answer && styles.incorrectOptionText
                ]}>
                  {option}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      );
    } else if (currentQuestion.type === 'true-false') {
      return (
        <View style={styles.trueFalseContainer}>
          <TouchableOpacity 
            onPress={() => !showAnswer && handleAnswerSelection(true)}
            disabled={showAnswer}
            style={styles.trueFalseOptionContainer}
            activeOpacity={0.7}
          >
            <View style={[
              styles.trueFalseOption,
              selectedAnswer === true ? styles.trueFalseSelected : {},
              showAnswer && currentQuestion.answer === true && styles.correctOption,
              showAnswer && selectedAnswer === true && currentQuestion.answer !== true && styles.incorrectOption
            ]}>
              <Text style={styles.trueFalseText}>True</Text>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity 
            onPress={() => !showAnswer && handleAnswerSelection(false)}
            disabled={showAnswer}
            style={styles.trueFalseOptionContainer}
            activeOpacity={0.7}
          >
            <View style={[
              styles.trueFalseOption,
              selectedAnswer === false ? styles.trueFalseSelected : {},
              showAnswer && currentQuestion.answer === false && styles.correctOption,
              showAnswer && selectedAnswer === false && currentQuestion.answer !== false && styles.incorrectOption
            ]}>
              <Text style={styles.trueFalseText}>False</Text>
            </View>
          </TouchableOpacity>
        </View>
      );
    } else if (currentQuestion.type === 'open-ended') {
      return (
        <View style={styles.openEndedContainer}>
          <Paragraph style={styles.contextText}>
            Context: {currentQuestion.context}
          </Paragraph>
          <Title style={styles.openEndedPrompt}>Your response:</Title>
          <Text style={styles.openEndedNote}>
            (Note: For open-ended questions, review the suggested answer to assess your understanding)
          </Text>
        </View>
      );
    }
  };

  const renderAnswer = () => {
    if (!currentQuestion) return null;

    let answerContent;
    if (currentQuestion.type === 'multiple-choice' || currentQuestion.type === 'true-false') {
      answerContent = (
        <View>
          <Text style={styles.resultText}>
            {isCorrect === true 
              ? '✓ Correct!' 
              : '✗ Incorrect'}
          </Text>
          {!isCorrect && (
            <Text style={styles.correctAnswerText}>
              Correct answer: {
                currentQuestion.type === 'true-false' 
                  ? (currentQuestion.answer ? 'True' : 'False')
                  : currentQuestion.answer
              }
            </Text>
          )}
        </View>
      );
    } else if (currentQuestion.type === 'open-ended') {
      answerContent = (
        <View>
          <Divider style={styles.divider} />
          <Title style={styles.suggestedAnswerTitle}>Suggested Answer:</Title>
          <Paragraph style={styles.suggestedAnswerText}>
            {currentQuestion.suggested_answer}
          </Paragraph>
        </View>
      );
    }

    return (
      <View style={styles.answerContainer}>
        {answerContent}
      </View>
    );
  };

  const renderQuizResults = () => {
    const scorePercentage = (score / questions.length) * 100;
    
    return (
      <ScrollView style={styles.container}>
        <View style={styles.resultsContainer}>
          {isAiPowered && (
            <View style={styles.aiPoweredBanner}>
              <IconButton icon="robot" size={20} />
              <Text style={styles.aiPoweredText}>
                Enhanced with AI
              </Text>
              <IconButton icon="check-circle" size={20} color="#4CAF50" />
            </View>
          )}
          
          <Card style={styles.resultsCard}>
            <Card.Content>
              <Title style={styles.resultsTitle}>Quiz Results</Title>
              <View style={styles.scoreContainer}>
                <Text style={styles.scoreText}>
                  {score}/{questions.length} correct
                </Text>
                <Text style={styles.percentageText}>
                  ({scorePercentage.toFixed(0)}%)
                </Text>
              </View>
              
              <ProgressBar 
                progress={scorePercentage / 100} 
                color={
                  scorePercentage >= 80 ? '#4CAF50' : 
                  scorePercentage >= 60 ? '#FFC107' : 
                  '#F44336'
                } 
                style={styles.progressBar} 
              />
              
              <Divider style={styles.divider} />
              
              <Title style={styles.reviewTitle}>Question Review</Title>
              
              {questions.map((question, index) => {
                const answer = userAnswers[index];
                if (!answer) return null;
                
                return (
                  <View key={index} style={styles.reviewItem}>
                    <View style={styles.reviewQuestionContainer}>
                      <Text style={styles.reviewQuestion}>
                        {index + 1}. {answer.question}
                      </Text>
                      {isAiPowered && (
                        <Badge style={styles.aiBadgeMini}>AI</Badge>
                      )}
                    </View>
                    
                    {answer.type !== 'open-ended' ? (
                      <View style={styles.reviewAnswers}>
                        <Text style={styles.yourAnswerText}>
                          Your answer: {
                            answer.type === 'true-false' 
                              ? (answer.userAnswer ? 'True' : 'False')
                              : answer.userAnswer
                          }
                        </Text>
                        
                        {answer.isCorrect === false && (
                          <Text style={styles.correctAnswerText}>
                            Correct answer: {
                              answer.type === 'true-false' 
                                ? (answer.correctAnswer ? 'True' : 'False')
                                : answer.correctAnswer
                            }
                          </Text>
                        )}
                        
                        <Text style={[
                          styles.resultIndicator,
                          answer.isCorrect ? styles.correctIndicator : styles.incorrectIndicator
                        ]}>
                          {answer.isCorrect ? '✓ Correct' : '✗ Incorrect'}
                        </Text>
                      </View>
                    ) : (
                      <Text style={styles.openEndedReviewText}>
                        Open-ended question (self-assessed)
                      </Text>
                    )}
                    
                    <Divider style={styles.reviewDivider} />
                  </View>
                );
              })}
            </Card.Content>
          </Card>
          
          <View style={styles.actionButtonsContainer}>
            <Button 
              mode="contained" 
              onPress={restartQuiz}
              style={[styles.actionButton, { backgroundColor: theme.colors.primary }]}
            >
              Retake Quiz
            </Button>
            <Button 
              mode="outlined" 
              onPress={() => navigation.goBack()}
              style={styles.actionButton}
            >
              Back to Summary
            </Button>
          </View>
        </View>
      </ScrollView>
    );
  };

  // Create styles with the theme
  const styles = makeStyles(theme);

  return (
    <SafeAreaView style={styles.safeArea}>
      {!quizCompleted ? (
        <View style={styles.container}>
          {isAiPowered && (
            <View style={styles.aiPoweredHeader}>
              <IconButton icon="robot" size={16} />
              <Text style={styles.aiPoweredHeaderText}>
                Enhanced with AI
              </Text>
            </View>
          )}
          <View style={styles.progressContainer}>
            <ProgressBar 
              progress={(currentQuestionIndex) / questions.length} 
              color={theme.colors.primary} 
              style={styles.progressBar} 
            />
          </View>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            {renderQuestion()}
          </ScrollView>
        </View>
      ) : (
        renderQuizResults()
      )}
    </SafeAreaView>
  );
}

const makeStyles = (theme) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 24,
  },
  aiPoweredHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f8ff',
    paddingVertical: 6,
  },
  aiPoweredHeaderText: {
    fontWeight: 'bold',
    color: '#2c3e50',
    fontSize: 12,
  },
  progressContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  questionCard: {
    margin: 16,
    elevation: 4,
    borderRadius: 12,
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  questionTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  questionType: {
    opacity: 0.6,
    fontStyle: 'italic',
  },
  aiBadgeContainer: {
    marginLeft: 8,
  },
  aiBadge: {
    backgroundColor: '#00bcd4',
  },
  aiBadgeMini: {
    backgroundColor: '#00bcd4',
    marginLeft: 8,
    transform: [{ scale: 0.8 }],
  },
  questionCounter: {
    fontWeight: 'bold',
  },
  questionText: {
    fontSize: 18,
    marginBottom: 16,
  },
  optionsContainer: {
    marginTop: 8,
    width: '100%',
  },
  optionTouchable: {
    marginBottom: 12,
    width: '100%',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    overflow: 'hidden',
  },
  optionInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    width: '100%',
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#757575',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  radioOuterSelected: {
    borderColor: theme.colors.primary,
  },
  radioOuterCorrect: {
    borderColor: '#4CAF50',
  },
  radioOuterIncorrect: {
    borderColor: '#F44336',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.colors.primary,
  },
  radioInnerCorrect: {
    backgroundColor: '#4CAF50',
  },
  radioInnerIncorrect: {
    backgroundColor: '#F44336',
  },
  optionText: {
    flex: 1,
    fontSize: 16,
  },
  correctOptionTouchable: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderColor: '#4CAF50',
  },
  incorrectOptionTouchable: {
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
    borderColor: '#F44336',
  },
  correctOptionText: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  incorrectOptionText: {
    color: '#F44336',
    fontWeight: 'bold',
  },
  trueFalseContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 16,
  },
  trueFalseOptionContainer: {
    width: '45%',
  },
  trueFalseOption: {
    width: '100%',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    height: 48,
  },
  trueFalseSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: 'rgba(67, 97, 238, 0.1)',
  },
  correctOption: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderColor: '#4CAF50',
  },
  incorrectOption: {
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
    borderColor: '#F44336',
  },
  trueFalseText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  openEndedContainer: {
    marginVertical: 16,
  },
  contextText: {
    fontStyle: 'italic',
    marginBottom: 16,
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
  },
  openEndedPrompt: {
    fontSize: 16,
    marginBottom: 8,
  },
  openEndedNote: {
    fontStyle: 'italic',
    fontSize: 12,
    opacity: 0.7,
  },
  answerContainer: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
  },
  resultText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  correctAnswerText: {
    fontWeight: 'bold',
  },
  suggestedAnswerTitle: {
    fontSize: 16,
    marginBottom: 8,
  },
  suggestedAnswerText: {
    fontStyle: 'italic',
  },
  divider: {
    marginVertical: 16,
  },
  cardActions: {
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  actionButton: {
    marginHorizontal: 8,
  },
  
  // Results Styles
  resultsContainer: {
    padding: 16,
  },
  aiPoweredBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f8ff',
    borderRadius: 8,
    padding: 8,
    marginBottom: 16,
  },
  aiPoweredText: {
    fontWeight: 'bold',
    color: '#2c3e50',
    flex: 1,
    textAlign: 'center',
  },
  resultsCard: {
    marginBottom: 16,
    elevation: 2,
  },
  resultsTitle: {
    fontSize: 24,
    marginBottom: 16,
    textAlign: 'center',
  },
  scoreContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  scoreText: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  percentageText: {
    fontSize: 20,
    opacity: 0.7,
  },
  reviewTitle: {
    fontSize: 18,
    marginVertical: 8,
  },
  reviewItem: {
    marginBottom: 16,
  },
  reviewQuestionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  reviewQuestion: {
    fontWeight: 'bold',
    flex: 1,
  },
  reviewAnswers: {
    marginLeft: 16,
  },
  yourAnswerText: {
    marginBottom: 4,
  },
  resultIndicator: {
    fontWeight: 'bold',
    marginTop: 4,
  },
  correctIndicator: {
    color: '#4CAF50',
  },
  incorrectIndicator: {
    color: '#F44336',
  },
  openEndedReviewText: {
    marginLeft: 16,
    fontStyle: 'italic',
  },
  reviewDivider: {
    marginTop: 12,
  },
  actionButtonsContainer: {
    marginTop: 8,
    marginBottom: 24,
  },
}); 