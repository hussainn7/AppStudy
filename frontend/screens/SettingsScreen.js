import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Platform, KeyboardAvoidingView, Alert, Keyboard } from 'react-native';
import { Button, Text, TextInput, Card, Title, Subheading, Paragraph, Divider, List, Switch } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Network from 'expo-network';
import { useApi } from '../contexts/ApiContext';

// Define the screen component
const SettingsScreen = ({ navigation }) => {
  const { apiUrl, updateApiUrl, checkServerStatus, serverInfo } = useApi();
  const [serverIp, setServerIp] = useState('');
  const [serverPort, setServerPort] = useState('8000');
  const [deviceIp, setDeviceIp] = useState('Loading...');
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [useCustomIp, setUseCustomIp] = useState(false);

  // Load saved settings on component mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const savedIp = await AsyncStorage.getItem('serverIp');
        const savedPort = await AsyncStorage.getItem('serverPort');
        const savedUseCustom = await AsyncStorage.getItem('useCustomIp');
        
        if (savedIp) setServerIp(savedIp);
        if (savedPort) setServerPort(savedPort);
        if (savedUseCustom) setUseCustomIp(savedUseCustom === 'true');
        
        // Get device IP
        const ipAddress = await Network.getIpAddressAsync();
        setDeviceIp(ipAddress);
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    };
    
    loadSettings();
  }, []);

  // Save settings using the ApiContext
  const saveSettings = async () => {
    try {
      Keyboard.dismiss();
      setIsLoading(true);

      const success = await updateApiUrl(serverIp, serverPort, useCustomIp);
      
      setIsLoading(false);
      if (success) {
        Alert.alert(
          'Settings Saved',
          `Your connection settings have been saved. API URL: ${useCustomIp ? `http://${serverIp}:${serverPort}` : apiUrl}\n\nYou may need to restart the app for changes to take effect.`
        );
      } else {
        Alert.alert('Error', 'Failed to save settings');
      }
    } catch (error) {
      setIsLoading(false);
      Alert.alert('Error', 'Failed to save settings: ' + error.message);
    }
  };

  // Get default IP based on platform
  const getDefaultIp = () => {
    if (Platform.OS === 'ios') {
      return Platform.OS === 'ios' && !Platform.isSimulator ? 'YOUR_COMPUTER_IP' : 'localhost';
    } else if (Platform.OS === 'android') {
      return '10.0.2.2'; // Android emulator
    } else {
      return 'localhost'; // Web
    }
  };

  // Test connection to server using the ApiContext
  const testConnection = async () => {
    try {
      setIsLoading(true);
      setTestResult(null);
      
      const result = await checkServerStatus();
      
      if (result.success) {
        setTestResult({
          success: true,
          message: `Connected successfully! Server status: ${result.data.status || 'OK'}`,
          details: JSON.stringify(result.data, null, 2)
        });
      } else {
        setTestResult({
          success: false,
          message: 'Connection failed',
          details: result.error
        });
      }
      
      setIsLoading(false);
    } catch (error) {
      setTestResult({
        success: false,
        message: 'Connection failed',
        details: error.message
      });
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView style={styles.scrollView}>
        <Card style={styles.card}>
          <Card.Content>
            <Title>Connection Settings</Title>
            <Paragraph>Configure how your app connects to the backend server</Paragraph>
            
            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                Your device IP: {deviceIp}
                {Platform.OS === 'ios' ? '\nRunning on: ' + (Platform.isSimulator ? 'iOS Simulator' : 'Physical iOS device') : ''}
              </Text>
            </View>
            
            <Divider style={styles.divider} />
            
            <List.Item
              title="Use custom server IP"
              description="Toggle this on if you need to specify a custom server IP address"
              left={props => <List.Icon {...props} icon="server" />}
              right={props => <Switch 
                value={useCustomIp} 
                onValueChange={setUseCustomIp} 
              />}
            />
            
            {useCustomIp && (
              <>
                <TextInput
                  label="Server IP Address"
                  value={serverIp}
                  onChangeText={setServerIp}
                  mode="outlined"
                  style={styles.input}
                  placeholder="e.g., 192.168.1.5"
                  keyboardType="default"
                  autoCapitalize="none"
                />
                <Paragraph style={styles.hint}>
                  Enter your computer's IP address. Find it in the Metro bundler console or by running 'ipconfig' (Windows) or 'ifconfig' (Mac/Linux).
                </Paragraph>
              </>
            )}
            
            <TextInput
              label="Server Port"
              value={serverPort}
              onChangeText={setServerPort}
              mode="outlined"
              style={styles.input}
              placeholder="e.g., 8000"
              keyboardType="number-pad"
            />
            
            <Divider style={styles.divider} />
            
            <Subheading>Default Connection</Subheading>
            <Paragraph>
              {!useCustomIp ? 'Using default connection settings:' : 'Default settings (when custom IP is disabled):'}
            </Paragraph>
            <View style={styles.infoBox}>
              <Text>
                {Platform.OS === 'ios' && 'iOS: ' + (Platform.isSimulator ? 'localhost:' : 'YOUR_COMPUTER_IP:') + serverPort}
                {Platform.OS === 'android' && '\nAndroid: 10.0.2.2:' + serverPort}
                {Platform.OS === 'web' && '\nWeb: localhost:' + serverPort}
              </Text>
            </View>
            
            <Button 
              mode="contained" 
              onPress={saveSettings}
              loading={isLoading}
              disabled={isLoading}
              style={styles.button}
              icon="content-save"
            >
              Save Settings
            </Button>
            
            <Button 
              mode="outlined" 
              onPress={testConnection}
              loading={isLoading}
              disabled={isLoading}
              style={styles.button}
              icon="server-network"
            >
              Test Connection
            </Button>
            
            {testResult && (
              <Card style={[styles.resultCard, { backgroundColor: testResult.success ? '#e7f3e8' : '#fbe9e7' }]}>
                <Card.Content>
                  <Title style={{ color: testResult.success ? '#2e7d32' : '#c62828' }}>
                    {testResult.success ? 'Success!' : 'Connection Failed'}
                  </Title>
                  <Paragraph>{testResult.message}</Paragraph>
                  <Paragraph style={styles.detailText}>{testResult.details}</Paragraph>
                </Card.Content>
              </Card>
            )}
          </Card.Content>
        </Card>
        
        <Card style={styles.card}>
          <Card.Content>
            <Title>Troubleshooting Tips</Title>
            <List.Item
              title="Different Network"
              description="Ensure your phone and computer are on the same WiFi network"
              left={props => <List.Icon {...props} icon="wifi" />}
            />
            <List.Item
              title="Firewall Issues"
              description="Check if your computer's firewall is blocking connections"
              left={props => <List.Icon {...props} icon="shield" />}
            />
            <List.Item
              title="Backend Server"
              description="Make sure the Flask backend is running on the correct port"
              left={props => <List.Icon {...props} icon="server" />}
            />
            <List.Item
              title="Restart App"
              description="Restart both the backend server and this app"
              left={props => <List.Icon {...props} icon="restart" />}
            />
          </Card.Content>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f6f6',
  },
  scrollView: {
    flex: 1,
  },
  card: {
    margin: 16,
    elevation: 4,
  },
  input: {
    marginVertical: 8,
  },
  button: {
    marginTop: 16,
    marginBottom: 8,
  },
  divider: {
    marginVertical: 16,
  },
  infoBox: {
    backgroundColor: '#e3f2fd',
    padding: 12,
    borderRadius: 4,
    marginVertical: 12,
  },
  infoText: {
    fontSize: 14,
  },
  hint: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  resultCard: {
    marginTop: 16,
  },
  detailText: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 12,
    marginTop: 8,
    padding: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 4,
  },
});

export default SettingsScreen; 