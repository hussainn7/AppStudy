import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Create the context
export const AuthContext = createContext();

// Provider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Load user data from storage when the app starts
  useEffect(() => {
    const loadUserData = async () => {
      try {
        // Check AsyncStorage first
        const userData = await AsyncStorage.getItem('userData');
        
        if (userData) {
          // User data found in AsyncStorage
          const parsedUserData = JSON.parse(userData);
          setUser(parsedUserData);
          setIsAdmin(parsedUserData.isAdmin);
        } else if (global.tempUserData) {
          // Check temporary storage (used when "Remember me" is off)
          setUser(global.tempUserData);
          setIsAdmin(global.tempUserData.isAdmin);
        }
      } catch (error) {
        console.error('Failed to load user data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadUserData();
  }, []);
  
  // Login function
  const login = async (userData, remember = false) => {
    try {
      setUser(userData);
      setIsAdmin(userData.isAdmin);
      
      // Save to persistent storage if remember is true
      if (remember) {
        await AsyncStorage.setItem('userData', JSON.stringify(userData));
      } else {
        // Use temporary storage that clears when app is closed
        global.tempUserData = userData;
      }
      
      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };
  
  // Logout function
  const logout = async () => {
    try {
      // Clear user data from state
      setUser(null);
      setIsAdmin(false);
      
      // Clear from storage
      await AsyncStorage.removeItem('userData');
      global.tempUserData = null;
      
      return true;
    } catch (error) {
      console.error('Logout error:', error);
      return false;
    }
  };
  
  // Register function (simplified for demo)
  const register = async (username, password, remember = false) => {
    try {
      // Get existing users
      const existingUsers = await AsyncStorage.getItem('registeredUsers');
      let users = existingUsers ? JSON.parse(existingUsers) : [];
      
      // Check if username exists
      if (users.some(user => user.username === username)) {
        return { success: false, message: 'Username already exists' };
      }
      
      // Add new user
      const newUser = {
        username,
        password, // In a real app, you would NEVER store plaintext passwords
        isAdmin: false,
        registered: new Date().toISOString()
      };
      
      users.push(newUser);
      await AsyncStorage.setItem('registeredUsers', JSON.stringify(users));
      
      // Auto login after registration
      const userData = {
        username,
        isAdmin: false,
        loginTime: new Date().toISOString()
      };
      
      await login(userData, remember);
      
      return { success: true };
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, message: 'Registration failed' };
    }
  };
  
  // Value to be provided by the context
  const authContextValue = {
    user,
    isAdmin,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    register
  };
  
  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook for using the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 