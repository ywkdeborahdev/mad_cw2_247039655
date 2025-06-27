import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, ScrollView, Image, Platform } from 'react-native';
import { PaperProvider, Button, TextInput, Text, Divider, Title, HelperText } from 'react-native-paper';
import React, { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { storeAuthToken, storeUserInfo, getBiometricSetting } from '../utils/asyncStorage';
import theme from '../theme/shared-theme';

// @ts-ignore
import { BACKEND_URL, SALT_ROUND } from '@env';

export default function LoginScreen() {
    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [showPassword, setShowPassword] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>(''); // State to hold error messages
    const navigation = useNavigation<any>();

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    const navigateToNextScreen = async () => {
        const isBiometricEnabled = await getBiometricSetting();

        // ONLY check for biometrics on Android
        if (Platform.OS === 'android' && isBiometricEnabled) {
            navigation.replace('BiometricLock');
        } else {
            // On iOS, or if the setting is off, go directly home
            navigation.replace('home');
        }
    };

    const handleSignIn = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await fetch(`http://${BACKEND_URL}/users/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'An unknown error occurred.');
            }

            const { user, token } = result.data;
            if (token) {
                await storeAuthToken(token);
                await storeUserInfo(user);
                await navigateToNextScreen();
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const navigateToRegister = () => {
        navigation.navigate('Register' as never);
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
                    <Text style={styles.subtitle}>Sign in to your account</Text>

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
                        onPress={handleSignIn}
                        loading={loading}
                        disabled={!email || !password || loading}
                        style={styles.signInButton}
                        contentStyle={styles.buttonContent}
                    >
                        Sign In
                    </Button>

                    <Divider style={styles.divider} />

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
        marginBottom: 4, // Reduced margin to make space for helper text
        backgroundColor: 'white',
    },
    errorText: {
        fontSize: 14,
        marginBottom: 10, // Add margin below the error text
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