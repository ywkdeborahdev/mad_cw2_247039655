import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, ScrollView } from 'react-native';
import { PaperProvider, DefaultTheme, Button, TextInput, Text, Divider, Title } from 'react-native-paper'; // Import Button and TextInput
import React, { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { storeAuthToken, storeUserInfo } from '../utils/asyncStorage'; // Import your utility functions
import theme from '../theme/shared-theme'; // Import your shared theme
// @ts-ignore
import { BACKEND_URL } from '@env';

export default function LoginScreen() {
    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);
    const navigation = useNavigation();

    const handleSignIn = async () => {
        setLoading(true);
        try {
            const response = await fetch(`http://${BACKEND_URL}/users/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email,
                    password
                })
            });

            const { data } = await response.json();
            const { user, token } = data;
            if (token) {
                // Store the token in AsyncStorage
                await storeAuthToken(token);
                await storeUserInfo(user);

                console.log('Authentication data stored successfully');
            }
            navigation.navigate('home');
        } catch (error) {
            console.error('Sign in error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        try {
            // Add your Google sign-in logic here
            console.log('Google sign-in pressed');
        } catch (error) {
            console.error('Google sign-in error:', error);
        }
    };

    const navigateToRegister = () => {
        navigation.navigate('Register'); // Adjust this to your actual register screen name
    };

    return (
        <PaperProvider theme={theme}>
            <View style={styles.container}>
                <ScrollView contentContainerStyle={styles.container}>
                    <Title style={styles.title}>Welcome Back</Title>
                    <Text style={styles.subtitle}>Sign in to your account</Text>

                    <TextInput
                        label="Email"
                        value={email}
                        onChangeText={setEmail}
                        mode="outlined"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        style={styles.input}
                        left={<TextInput.Icon icon="email" />}
                    />

                    <TextInput
                        label="Password"
                        value={password}
                        onChangeText={setPassword}
                        mode="outlined"
                        secureTextEntry
                        style={styles.input}
                        left={<TextInput.Icon icon="lock" />}
                    />

                    <Button
                        mode="contained"
                        onPress={handleSignIn}
                        loading={loading}
                        disabled={!email || !password || loading}
                        style={styles.signInButton}
                        contentStyle={styles.buttonContent}
                    >
                        Sign In
                    </Button>

                    <Divider style={styles.divider} />

                    <Button
                        mode="outlined"
                        onPress={handleGoogleSignIn}
                        icon="google"
                        style={styles.googleButton}
                        contentStyle={styles.buttonContent}
                        buttonColor="#ffffff"
                        textColor="#db4437"
                    >
                        Sign in with Google
                    </Button>

                    <View style={styles.noAccountContainer}>
                        <Text style={styles.noAccountText}>No account? </Text>
                        <Button
                            mode="text"
                            onPress={navigateToRegister}
                            compact
                            style={styles.createAccountButton}
                            labelStyle={styles.createAccountText}
                        >
                            Create new user
                        </Button>

                    </View>
                </ScrollView>

                <StatusBar style="auto" />
            </View>
        </PaperProvider>
    );
}

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 20,
        backgroundColor: '#f5f5f5',
    },
    card: {
        padding: 20,
        borderRadius: 12,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 8,
        color: '#333',
    },
    subtitle: {
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 30,
        color: '#666',
    },
    input: {
        marginBottom: 16,
        backgroundColor: 'white',
    },
    signInButton: {
        marginTop: 10,
        marginBottom: 20,
    },
    buttonContent: {
        paddingVertical: 8,
    },
    divider: {
        marginVertical: 20,
        backgroundColor: '#e0e0e0',
    },
    googleButton: {
        borderColor: '#db4437',
        borderWidth: 2,
    },
    noAccountContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 20,
        flexWrap: 'wrap',
    },
    noAccountText: {
        fontSize: 16,
        color: '#666',
    },
    createAccountButton: {
        marginLeft: -8,
        marginVertical: 0,
    },
    createAccountText: {
        fontSize: 16,
        fontWeight: '600',
        textDecorationLine: 'underline',
    },
});
