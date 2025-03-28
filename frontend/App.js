import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Provider as PaperProvider, DefaultTheme } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ApiProvider } from './contexts/ApiContext';
import { AuthProvider } from './contexts/AuthContext';

// Import screens
import LoginScreen from './screens/LoginScreen';
import HomeScreen from './screens/HomeScreen';
import TextInputScreen from './screens/TextInputScreen';
import PDFUploadScreen from './screens/PDFUploadScreen';
import SummaryScreen from './screens/SummaryScreen';
import QuizScreen from './screens/QuizScreen';
import FlashcardsScreen from './screens/FlashcardsScreen';
import SettingsScreen from './screens/SettingsScreen';
import YouTubeScreen from './screens/YouTubeScreen';
import VoiceNoteScreen from './screens/VoiceNoteScreen';
import ProfileScreen from './screens/ProfileScreen';

const Stack = createNativeStackNavigator();

// Updated theme with a more modern color palette
const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#4361ee',
    accent: '#3bc9db',
    background: '#f8f9fa',
    surface: '#ffffff',
    text: '#212529',
    error: '#e63946',
    success: '#2a9d8f',
    warning: '#f77f00',
    info: '#4cc9f0',
  },
  roundness: 12,
  animation: {
    scale: 1.0,
  },
};

export default function App() {
  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <ApiProvider>
          <AuthProvider>
            <NavigationContainer>
              <Stack.Navigator 
                initialRouteName="Login"
                screenOptions={{
                  headerStyle: {
                    backgroundColor: theme.colors.primary,
                  },
                  headerTintColor: '#fff',
                  headerTitleStyle: {
                    fontWeight: 'bold',
                  },
                  headerShadowVisible: false,
                  contentStyle: {
                    backgroundColor: theme.colors.background,
                  },
                }}
              >
                <Stack.Screen 
                  name="Login" 
                  component={LoginScreen} 
                  options={{ headerShown: false }} 
                />
                <Stack.Screen 
                  name="Home" 
                  component={HomeScreen} 
                  options={{ title: 'Study Companion' }} 
                />
                <Stack.Screen 
                  name="TextInput" 
                  component={TextInputScreen} 
                  options={{ title: 'Enter Study Text' }} 
                />
                <Stack.Screen 
                  name="PDFUpload" 
                  component={PDFUploadScreen} 
                  options={{ title: 'Upload PDF' }} 
                />
                <Stack.Screen 
                  name="YouTube" 
                  component={YouTubeScreen} 
                  options={{ title: 'YouTube Analysis' }} 
                />
                <Stack.Screen 
                  name="VoiceNote" 
                  component={VoiceNoteScreen} 
                  options={{ title: 'Voice Note Taker' }} 
                />
                <Stack.Screen 
                  name="Summary" 
                  component={SummaryScreen} 
                  options={{ title: 'Study Summary' }} 
                />
                <Stack.Screen 
                  name="Quiz" 
                  component={QuizScreen} 
                  options={{ title: 'Study Quiz' }} 
                />
                <Stack.Screen 
                  name="Flashcards" 
                  component={FlashcardsScreen} 
                  options={{ title: 'Study Flashcards' }} 
                />
                <Stack.Screen 
                  name="Settings" 
                  component={SettingsScreen} 
                  options={{ title: 'Connection Settings' }} 
                />
                <Stack.Screen 
                  name="Profile" 
                  component={ProfileScreen} 
                  options={{ title: 'Your Profile' }} 
                />
              </Stack.Navigator>
            </NavigationContainer>
          </AuthProvider>
        </ApiProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
}
