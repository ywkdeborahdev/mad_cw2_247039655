import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Provider as PaperProvider, Text, Button, ActivityIndicator, IconButton } from 'react-native-paper';
import * as LocalAuthentication from 'expo-local-authentication';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import theme from '../theme/shared-theme';
import { responsiveFontSize, responsiveSpacing } from '../utils/responsive';
import { getAuthToken, removeAuthToken, storeBiometricSetting } from '../utils/asyncStorage'
// @ts-ignore
import { BACKEND_URL } from '@env';

const BiometricLockScreen: React.FC = () => {
    const navigation = useNavigation<any>();
    const [isAuthenticating, setIsAuthenticating] = useState(false);

    const handleBiometricAuth = async () => {
        // Prevent multiple auth prompts at once
        if (isAuthenticating) return;

        setIsAuthenticating(true);
        try {
            const result = await LocalAuthentication.authenticateAsync({
                promptMessage: 'Verify your identity',
                cancelLabel: 'Logout',
                disableDeviceFallback: true, // Does not allow passcode fallback
            });

            if (result.success) {
                // On success, replace the lock screen with the home screen
                navigation.replace('home');
            } else {
                // User cancelled or authentication failed
                // Stay on the screen to allow retry
                Alert.alert(
                    'Authentication Failed',
                    'Please verify your identity to continue.'
                );
            }
        } catch (error) {
            console.error(error);
            Alert.alert(
                'Authentication Error',
                'An error occurred. Please try logging in again.',
                [{ text: 'Logout', onPress: () => navigation.replace('Login'), style: 'destructive' }]
            );
        } finally {
            setIsAuthenticating(false);
        }
    };

    const handleLogout = async (): Promise<void> => {
        try {
            const token = await getAuthToken();
            const response = await fetch(`http://${BACKEND_URL}/users/logout`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });
            console.log('Response status:', response.status);

            if (!response.ok) {
                throw new Error('Failed to logout');
            }
            // Remove local token
            await removeAuthToken();
            Alert.alert('Success', 'Logged out successfully');

            // Navigate to login screen or reset app state
            navigation.replace('Login');
        } catch (error) {
            console.error('Error logging out:', error);
            Alert.alert('Error', 'Failed to logout');
        }
    };

    // useFocusEffect will run the authentication prompt every time the screen comes into view
    useFocusEffect(
        useCallback(() => {
            handleBiometricAuth();
        }, [])
    );

    return (
        <PaperProvider theme={theme}>
            <View style={styles.container}>
                <Text style={styles.title}>Verification Required</Text>
                <IconButton
                    icon="fingerprint"
                    size={64}
                    iconColor={theme.colors.primary}
                    style={styles.icon}
                />
                <Text style={styles.subtitle}>Please use Face ID or Touch ID to unlock.</Text>
                {isAuthenticating ? (
                    <ActivityIndicator animating={true} size="large" />
                ) : (
                    <Button mode="contained" onPress={handleBiometricAuth} style={styles.button}>
                        Try Again
                    </Button>
                )}
                <Button
                    mode="text"
                    onPress={handleLogout}
                    style={styles.button}
                    textColor={theme.colors.primary}
                >
                    Logout
                </Button>
            </View>
        </PaperProvider>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F5F5F5',
        padding: responsiveSpacing(20),
    },
    title: {
        fontSize: responsiveFontSize(24),
        fontWeight: 'bold',
        color: '#333',
        marginBottom: responsiveSpacing(12),
    },
    subtitle: {
        fontSize: responsiveFontSize(16),
        color: '#666',
        textAlign: 'center',
        marginBottom: responsiveSpacing(40),
    },
    icon: {
        marginBottom: responsiveSpacing(20),
    },
    button: {
        marginTop: responsiveSpacing(12),
        width: '80%',
    }
});

export default BiometricLockScreen;