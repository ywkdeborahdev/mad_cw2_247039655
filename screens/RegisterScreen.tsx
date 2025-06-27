import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, ScrollView, Image } from 'react-native';
import { PaperProvider, Button, TextInput, Text, Divider, Title, HelperText } from 'react-native-paper';
import React, { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { storeAuthToken, storeUserInfo } from '../utils/asyncStorage';
import theme from '../theme/shared-theme';

// @ts-ignore
import { BACKEND_URL, SALT_ROUND } from '@env';

export default function RegisterScreen() {
    const [username, setUsername] = useState<string>('');
    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [showPassword, setShowPassword] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>(''); // State to hold error messages
    const navigation = useNavigation();

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    const handleRegister = async (): Promise<void> => {
        setLoading(true);
        setError(''); // Clear previous errors
        try {
            const response = await fetch(`http://${BACKEND_URL}/users/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, email, password })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'An unknown error occurred.');
            }

            const { newUser, token } = result.data;
            if (token) {
                await storeAuthToken(token);
                await storeUserInfo(newUser);
                navigation.navigate('profile' as never);
            }
        } catch (err: any) {
            setError(err.message); // Set the error message to display in the UI
        } finally {
            setLoading(false);
        }
    };


    const navigateToLogin = () => {
        navigation.navigate('Login' as never);
    };

    return (
        <PaperProvider theme={theme}>
            <View style={styles.container}>
                <ScrollView contentContainerStyle={styles.container}>
                    <View style={styles.logoContainer}>
                        <Image
                            source={require('../assets/wellness.png')}
                            style={{ width: 50, height: 50 }}
                        />
                    </View>
                    <Title style={styles.title}>Wellness App</Title>
                    <Text style={styles.subtitle}>Create an account to start your journey</Text>

                    <TextInput
                        label="Username"
                        value={username}
                        onChangeText={setUsername}
                        mode="outlined"
                        autoCapitalize="none"
                        style={styles.input}
                        error={!!error}
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
                        error={!!error}
                        left={<TextInput.Icon icon="email" />}
                    />

                    <TextInput
                        label="Password"
                        value={password}
                        onChangeText={setPassword}
                        mode="outlined"
                        secureTextEntry={!showPassword}
                        style={styles.input}
                        error={!!error}
                        left={<TextInput.Icon icon="lock" />}
                        right={<TextInput.Icon icon={showPassword ? "eye" : "eye-off"} onPress={togglePasswordVisibility} />}
                    />

                    <HelperText type="error" visible={!!error} style={styles.errorText}>
                        {error}
                    </HelperText>

                    <Button
                        mode="contained"
                        onPress={handleRegister}
                        loading={loading}
                        disabled={!username || !email || !password || loading}
                        style={styles.signInButton}
                        contentStyle={styles.buttonContent}
                    >
                        Register
                    </Button>

                    <Divider style={styles.divider} />

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
    logoContainer: {
        alignItems: 'center'
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
        marginBottom: 4,
        backgroundColor: 'white',
    },
    errorText: {
        fontSize: 14,
        marginBottom: 10,
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