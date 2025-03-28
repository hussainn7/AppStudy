import React, { createContext, useState, useEffect, useContext } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Create the context
export const ApiContext = createContext();

// Default API endpoint based on platform
const getDefaultApiUrl = () => {
  if (Platform.OS === 'ios') {
    // For iOS devices, we need to use the actual network IP address
    // When testing on a real device, localhost refers to the device itself
    const isSimulator = !!/simulator/i.test(navigator.userAgent) || !!(window.navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    if (isSimulator) {
      return 'http://localhost:8000'; // iOS simulator
    } else {
      // Use your computer's actual network IP address when testing on a physical device
      return 'http://172.20.10.7:8000'; // Updated IP address
    }
  } else if (Platform.OS === 'android') {
    return 'http://172.20.10.7:8000'; // Updated for Android
  } else if (Platform.OS === 'web') {
    return 'http://localhost:8000'; // Use localhost for web
  } else {
    return 'http://172.20.10.7:8000'; // Updated default fallback
  }
};

// Provider component
export const ApiProvider = ({ children }) => {
  const [apiUrl, setApiUrl] = useState(getDefaultApiUrl());
  const [isAiPowered, setIsAiPowered] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [serverInfo, setServerInfo] = useState(null);

  useEffect(() => {
    // Load saved API URL from AsyncStorage on component mount
    const loadApiUrl = async () => {
      try {
        const savedApiUrl = await AsyncStorage.getItem('apiUrl');
        if (savedApiUrl) {
          console.log('ApiContext - Loaded custom API URL:', savedApiUrl);
          setApiUrl(savedApiUrl);
        } else {
          // If no saved URL, use the default one
          const defaultUrl = getDefaultApiUrl();
          console.log('ApiContext - Using default API URL:', defaultUrl);
          setApiUrl(defaultUrl);
        }
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to load API URL from storage:', error);
        setApiUrl(getDefaultApiUrl());
        setIsInitialized(true);
      }
    };

    loadApiUrl();
  }, []);

  // Save API URL to AsyncStorage whenever it changes
  useEffect(() => {
    const saveApiUrl = async () => {
      try {
        if (isInitialized) {
          await AsyncStorage.setItem('apiUrl', apiUrl);
          console.log('ApiContext - Saved API URL to storage:', apiUrl);
        }
      } catch (error) {
        console.error('Failed to save API URL to storage:', error);
      }
    };

    saveApiUrl();
  }, [apiUrl, isInitialized]);

  // Update API URL with custom server IP and port
  const updateApiUrl = async (serverIp, serverPort, useCustomIp) => {
    try {
      const newApiUrl = useCustomIp 
        ? `http://${serverIp}:${serverPort}` 
        : getDefaultApiUrl();
      
      setApiUrl(newApiUrl);
      await AsyncStorage.setItem('apiUrl', newApiUrl);
      await AsyncStorage.setItem('serverIp', serverIp);
      await AsyncStorage.setItem('serverPort', serverPort);
      await AsyncStorage.setItem('useCustomIp', useCustomIp.toString());
      
      console.log('ApiContext - Updated API URL:', newApiUrl);
      return true;
    } catch (error) {
      console.error('Failed to update API URL:', error);
      return false;
    }
  };

  // Check server status and AI capabilities
  const checkServerStatus = async () => {
    try {
      console.log(`ApiContext - Checking server status at ${apiUrl}/api/status`);
      const response = await fetch(`${apiUrl}/api/status`);
      const data = await response.json();
      
      setIsAiPowered(data.ai_powered || false);
      setServerInfo(data);
      
      return {
        success: true,
        data: data
      };
    } catch (error) {
      console.error('Error checking server status:', error);
      return {
        success: false,
        error: error.message
      };
    }
  };

  // Check if AI is enabled on the server root endpoint
  const checkAiStatus = async () => {
    try {
      console.log(`ApiContext - Checking AI status at ${apiUrl}/`);
      const response = await fetch(`${apiUrl}/`);
      const data = await response.json();
      
      const isAi = data && data.hasOwnProperty('ai_powered') ? data.ai_powered : false;
      setIsAiPowered(isAi);
      
      return {
        success: true,
        isAiPowered: isAi
      };
    } catch (error) {
      console.error('Could not determine AI status:', error);
      setIsAiPowered(false);
      return {
        success: false,
        error: error.message,
        isAiPowered: false
      };
    }
  };

  // Custom hook for using the API context
  return (
    <ApiContext.Provider value={{ 
      apiUrl, 
      isAiPowered, 
      isInitialized,
      serverInfo,
      updateApiUrl,
      checkServerStatus,
      checkAiStatus
    }}>
      {children}
    </ApiContext.Provider>
  );
};

// Custom hook for using the API context
export const useApi = () => {
  const context = useContext(ApiContext);
  if (!context) {
    throw new Error('useApi must be used within an ApiProvider');
  }
  return context;
}; 