import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, ScrollView } from 'react-native';
import { PaperProvider, Button, TextInput, Text, Divider, Title } from 'react-native-paper'; // Import Button and TextInput
import React, { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { storeAuthToken, storeUserInfo } from '../utils/asyncStorage'; // Import your utility functions
import theme from '../theme/shared-theme'; // Import your shared theme
// @ts-ignore
import { BACKEND_URL } from '@env';


export default function RegisterScreen() {
    const [username, setUsername] = useState<string>('');
    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [showPassword, setShowPassword] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(false);
    const navigation = useNavigation();

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    const handleRegister = async (): Promise<void> => {
        setLoading(true);
        console.log('Registering user:', { username, email, password });
        try {
            const response = await fetch(`http://${BACKEND_URL}/users/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username,
                    email,
                    password
                })
            });

            const { data } = await response.json();
            const { newUser, token } = data;
            if (token) {
                // Store the token in AsyncStorage
                await storeAuthToken(token);
                await storeUserInfo(newUser);

                console.log('Authentication data stored successfully');
            }
            navigation.navigate('home');
        } catch (error) {
            console.error('Register error:', error);
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

    const navigateToLogin = () => {
        navigation.navigate('Login'); // Adjust this to your actual register screen name
    };

    return (
        <PaperProvider theme={theme}>
            <View style={styles.container}>
                <ScrollView contentContainerStyle={styles.container}>
                    <Title style={styles.title}>Wellness App</Title>
                    <Text style={styles.subtitle}>Create an account to start your journey</Text>

                    <TextInput
                        label="Username"
                        value={username}
                        onChangeText={setUsername}
                        mode="outlined"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        style={styles.input}
                        left={<TextInput.Icon icon="account" />}
                    />

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
                        secureTextEntry={!showPassword}
                        style={styles.input}
                        left={<TextInput.Icon icon="lock" />}
                        right={<TextInput.Icon icon={showPassword ? "eye-off" : "eye"} onPress={togglePasswordVisibility} />}
                    />

                    <Button
                        mode="contained"
                        onPress={handleRegister}
                        loading={loading}
                        disabled={!email || !password || loading}
                        style={styles.signInButton}
                        contentStyle={styles.buttonContent}
                    >
                        Register
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
                        <Text style={styles.noAccountText}>Already have an account? </Text>
                        <Button
                            mode="text"
                            onPress={navigateToLogin}
                            compact
                            style={styles.createAccountButton}
                            labelStyle={styles.createAccountText}
                        >
                            Sign in
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
