import React from 'react';
import { View, StyleSheet, ScrollView, Platform, Alert } from 'react-native';
import { Card, Title, Paragraph, Button, Surface, Text, useTheme, Avatar, Divider, List, Badge } from 'react-native-paper';
import { useAuth } from '../contexts/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';

const ProfileScreen = ({ navigation }) => {
  const { user, isAdmin, logout } = useAuth();
  const theme = useTheme();

  const handleLogout = async () => {
    Alert.alert(
      'Confirm Logout',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: async () => {
            const success = await logout();
            if (success) {
              navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
              });
            }
          }
        },
      ]
    );
  };

  // Calculate the time since registration
  const getTimeSinceLogin = () => {
    if (!user || !user.loginTime) return 'Unknown';
    
    const loginTime = new Date(user.loginTime);
    const now = new Date();
    const diffMs = now - loginTime;
    const diffMins = Math.round(diffMs / 60000);
    
    if (diffMins < 60) {
      return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    } else {
      const diffHours = Math.floor(diffMins / 60);
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    }
  };

  return (
    <ScrollView style={styles.container}>
      <LinearGradient
        colors={[theme.colors.primary, theme.colors.accent]}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.avatarContainer}>
          <Avatar.Text 
            size={80} 
            label={user?.username?.substring(0, 2)?.toUpperCase() || 'U'} 
            backgroundColor="#fff"
            color={theme.colors.primary}
            style={styles.avatar}
          />
          {isAdmin && (
            <Badge style={styles.adminBadge}>Admin</Badge>
          )}
        </View>
        <Title style={styles.username}>{user?.username || 'User'}</Title>
        <Paragraph style={styles.userStatus}>
          {isAdmin ? 'Administrator Account' : 'Standard User'}
        </Paragraph>
      </LinearGradient>

      <Card style={styles.infoCard}>
        <Card.Content>
          <Title style={styles.sectionTitle}>Account Information</Title>
          
          <List.Item
            title="Username"
            description={user?.username || 'Not available'}
            left={props => <List.Icon {...props} icon="account" />}
          />
          
          <Divider style={styles.divider} />
          
          <List.Item
            title="Account Type"
            description={isAdmin ? 'Administrator' : 'Standard User'}
            left={props => <List.Icon {...props} icon={isAdmin ? "shield-account" : "account-outline"} />}
          />
          
          <Divider style={styles.divider} />
          
          <List.Item
            title="Last Login"
            description={getTimeSinceLogin()}
            left={props => <List.Icon {...props} icon="clock-outline" />}
          />
        </Card.Content>
      </Card>

      {isAdmin && (
        <Card style={styles.adminCard}>
          <Card.Content>
            <Title style={styles.sectionTitle}>Administrator Tools</Title>
            <Paragraph style={styles.adminText}>
              As an administrator, you have additional privileges:
            </Paragraph>
            
            <View style={styles.adminToolsContainer}>
              <Surface style={styles.adminTool}>
                <List.Icon icon="account-multiple" color={theme.colors.primary} />
                <Text style={styles.adminToolText}>User Management</Text>
              </Surface>
              
              <Surface style={styles.adminTool}>
                <List.Icon icon="cog" color={theme.colors.primary} />
                <Text style={styles.adminToolText}>System Settings</Text>
              </Surface>
              
              <Surface style={styles.adminTool}>
                <List.Icon icon="chart-bar" color={theme.colors.primary} />
                <Text style={styles.adminToolText}>Usage Analytics</Text>
              </Surface>
            </View>
          </Card.Content>
        </Card>
      )}

      <Card style={styles.actionsCard}>
        <Card.Content>
          <Title style={styles.sectionTitle}>Account Actions</Title>
          
          <Button 
            mode="contained" 
            icon="home"
            style={[styles.actionButton, { backgroundColor: theme.colors.primary }]}
            onPress={() => navigation.navigate('Home')}
          >
            Go to Home
          </Button>
          
          <Button 
            mode="contained" 
            icon="cog"
            style={[styles.actionButton, { backgroundColor: theme.colors.accent }]}
            onPress={() => navigation.navigate('Settings')}
          >
            Connection Settings
          </Button>
          
          <Button 
            mode="outlined" 
            icon="logout"
            style={styles.logoutButton}
            onPress={handleLogout}
          >
            Logout
          </Button>
        </Card.Content>
      </Card>
      
      <View style={styles.footer}>
        <Text style={styles.footerText}>Study Companion v2.0</Text>
        <Text style={styles.footerText}>Made with ❤️ for learning</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f6f6',
  },
  header: {
    padding: 32,
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    elevation: 4,
  },
  adminBadge: {
    position: 'absolute',
    bottom: 0,
    right: -5,
    backgroundColor: '#ff6b6b',
  },
  username: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  userStatus: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  infoCard: {
    margin: 16,
    marginTop: 0,
    borderRadius: 12,
    elevation: 2,
  },
  adminCard: {
    margin: 16,
    marginTop: 0,
    borderRadius: 12,
    elevation: 2,
    backgroundColor: '#fdf9e8',
  },
  actionsCard: {
    margin: 16,
    marginTop: 0,
    borderRadius: 12,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    marginBottom: 16,
  },
  divider: {
    marginVertical: 8,
  },
  adminText: {
    marginBottom: 16,
  },
  adminToolsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  adminTool: {
    width: '30%',
    padding: 12,
    alignItems: 'center',
    borderRadius: 8,
    marginBottom: 12,
    elevation: 1,
  },
  adminToolText: {
    marginTop: 4,
    fontSize: 12,
    textAlign: 'center',
  },
  actionButton: {
    marginBottom: 12,
    borderRadius: 4,
  },
  logoutButton: {
    marginTop: 8,
    borderColor: '#ff6b6b',
    borderRadius: 4,
  },
  footer: {
    padding: 24,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#888',
    marginBottom: 4,
  },
});

export default ProfileScreen; 