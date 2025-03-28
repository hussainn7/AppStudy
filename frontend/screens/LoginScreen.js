import React, { useState, useEffect } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Image } from 'react-native';
import { TextInput, Button, Title, Paragraph, Card, Surface, Text, useTheme, Snackbar, Switch, Divider } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useApi } from '../contexts/ApiContext';

const LoginScreen = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const theme = useTheme();

  // Check if the user is already logged in
  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const userData = await AsyncStorage.getItem('userData');
        if (userData) {
          // User is already logged in, navigate to home screen
          navigation.replace('Home');
        }
      } catch (error) {
        console.error('Error checking login status:', error);
      }
    };

    checkLoginStatus();
  }, []);

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      setError('Please enter both username and password');
      setSnackbarVisible(true);
      return;
    }

    setLoading(true);
    setError('');

    try {
      // For demo purposes, using a simple hard-coded admin check
      // In a real app, this would be a server API call
      const isAdmin = username === 'hussain-admin' && password === 'admin';
      
      // Normally would call a login API here
      // For this demo, we'll just simulate a successful login
      
      // Login is successful
      const userData = {
        username,
        isAdmin,
        loginTime: new Date().toISOString()
      };
      
      // Save user data if remember me is checked
      if (rememberMe) {
        await AsyncStorage.setItem('userData', JSON.stringify(userData));
      } else {
        // Use a temporary storage method that clears when the app closes
        global.tempUserData = userData;
      }
      
      // Simulate a delay for the login process
      setTimeout(() => {
        setLoading(false);
        // Navigate to home screen
        navigation.replace('Home');
      }, 1000);
    } catch (error) {
      console.error('Login error:', error);
      setError('Failed to login. Please check your credentials and try again.');
      setSnackbarVisible(true);
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    // Validate inputs
    if (!username.trim() || !password.trim() || !confirmPassword.trim()) {
      setError('Please fill in all fields');
      setSnackbarVisible(true);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setSnackbarVisible(true);
      return;
    }

    setLoading(true);
    setError('');

    try {
      // For demo purposes, we'll simulate registration by storing the user in AsyncStorage
      // In a real app, this would be a server API call
      
      // Check if the username is already taken
      const existingUsers = await AsyncStorage.getItem('registeredUsers');
      let users = existingUsers ? JSON.parse(existingUsers) : [];
      
      if (users.some(user => user.username === username)) {
        setError('Username already exists. Please choose a different one.');
        setSnackbarVisible(true);
        setLoading(false);
        return;
      }
      
      // Add the new user
      const newUser = {
        username,
        password, // In a real app, you would never store passwords in plaintext
        isAdmin: false,
        registered: new Date().toISOString()
      };
      
      users.push(newUser);
      await AsyncStorage.setItem('registeredUsers', JSON.stringify(users));
      
      // Auto-login after registration
      const userData = {
        username,
        isAdmin: false,
        loginTime: new Date().toISOString()
      };
      
      if (rememberMe) {
        await AsyncStorage.setItem('userData', JSON.stringify(userData));
      } else {
        global.tempUserData = userData;
      }
      
      // Simulate a delay for the registration process
      setTimeout(() => {
        setLoading(false);
        // Navigate to home screen
        navigation.replace('Home');
      }, 1000);
    } catch (error) {
      console.error('Registration error:', error);
      setError('Failed to register. Please try again later.');
      setSnackbarVisible(true);
      setLoading(false);
    }
  };

  const toggleLoginRegister = () => {
    setIsRegistering(!isRegistering);
    setError('');
    setPassword('');
    setConfirmPassword('');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <LinearGradient
          colors={[theme.colors.primary, theme.colors.accent]}
          style={styles.header}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Title style={styles.appTitle}>Study Companion</Title>
          <Paragraph style={styles.appSubtitle}>
            Your intelligent learning partner
          </Paragraph>
        </LinearGradient>

        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.cardTitle}>{isRegistering ? 'Create Account' : 'Welcome Back'}</Title>
            <Paragraph style={styles.cardSubtitle}>
              {isRegistering ? 'Sign up to start using Study Companion' : 'Sign in to continue learning'}
            </Paragraph>

            <TextInput
              label="Username"
              value={username}
              onChangeText={setUsername}
              mode="outlined"
              style={styles.input}
              left={<TextInput.Icon icon="account" />}
              autoCapitalize="none"
            />

            <TextInput
              label="Password"
              value={password}
              onChangeText={setPassword}
              mode="outlined"
              style={styles.input}
              secureTextEntry
              left={<TextInput.Icon icon="lock" />}
            />

            {isRegistering && (
              <TextInput
                label="Confirm Password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                mode="outlined"
                style={styles.input}
                secureTextEntry
                left={<TextInput.Icon icon="lock-check" />}
              />
            )}

            <View style={styles.rememberContainer}>
              <View style={styles.rememberRow}>
                <Switch
                  value={rememberMe}
                  onValueChange={setRememberMe}
                  color={theme.colors.primary}
                />
                <Text style={styles.rememberText}>Remember me</Text>
              </View>
              {!isRegistering && (
                <Text style={styles.forgotPassword}>Forgot Password?</Text>
              )}
            </View>

            <Button
              mode="contained"
              onPress={isRegistering ? handleRegister : handleLogin}
              loading={loading}
              disabled={loading}
              style={styles.button}
            >
              {isRegistering ? 'Register' : 'Login'}
            </Button>

            <Divider style={styles.divider} />

            <Button
              mode="outlined"
              onPress={toggleLoginRegister}
              style={styles.toggleButton}
            >
              {isRegistering ? 'Already have an account? Login' : 'New user? Create account'}
            </Button>
            
            {/* Admin login hint (for demo purposes) */}
            <Surface style={styles.hintContainer}>
              <Text style={styles.hintTitle}>Demo Credentials:</Text>
              <Text style={styles.hintText}>Admin login: hussain-admin / admin</Text>
              <Text style={styles.hintText}>Or create a new user account</Text>
            </Surface>
          </Card.Content>
        </Card>
      </ScrollView>

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
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f6f6',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  header: {
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
  },
  appTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  appSubtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 16,
  },
  card: {
    margin: 16,
    borderRadius: 12,
    elevation: 4,
  },
  cardTitle: {
    fontSize: 24,
    marginBottom: 8,
    textAlign: 'center',
  },
  cardSubtitle: {
    textAlign: 'center',
    marginBottom: 24,
    opacity: 0.7,
  },
  input: {
    marginBottom: 16,
  },
  rememberContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rememberText: {
    marginLeft: 8,
  },
  forgotPassword: {
    color: '#4361ee',
  },
  button: {
    padding: 6,
    borderRadius: 12,
  },
  divider: {
    marginVertical: 24,
  },
  toggleButton: {
    borderRadius: 12,
  },
  hintContainer: {
    marginTop: 24,
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
  },
  hintTitle: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  hintText: {
    fontSize: 12,
    opacity: 0.7,
  },
});

export default LoginScreen; 