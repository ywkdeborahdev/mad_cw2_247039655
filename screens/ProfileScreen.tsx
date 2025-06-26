import React, { useState, useEffect } from 'react';
import {
    View,
    StyleSheet,
    SafeAreaView,
    Alert,
    TouchableOpacity,
    Keyboard,
    TouchableWithoutFeedback,
    ScrollView,
    Platform
} from 'react-native';
import {
    Provider as PaperProvider,
    Text,
    Card,
    Avatar,
    Button,
    TextInput,
    IconButton,
    Dialog,
    Portal,
    Switch,
    Divider,
} from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import * as LocalAuthentication from 'expo-local-authentication';
import theme from '../theme/shared-theme';
import BottomNavBar from '../components/BottomNavBar';
import {
    getUserInfo,
    getAuthToken,
    removeAuthToken,
    storeUserSetting,
    storeUserPhotoURL,
    storeBiometricSetting,
    getBiometricSetting
} from '../utils/asyncStorage';
import { useNavigation } from '@react-navigation/native';
import { UserCredential, User } from '../modelsFrontend';
import * as ImageManipulator from 'expo-image-manipulator';
// @ts-ignore
import { BACKEND_URL } from '@env';
import { wp, hp, responsiveFontSize, responsiveSpacing } from '../utils/responsive';

// interface UserSettings {
//     waterTarget: number;
//     stepTarget: number;
//     profileImageUrl?: string;
// }

const ProfileScreen: React.FC = () => {
    const [userInfo, setUserInfo] = useState<User | null>(null);
    const [profileImageUrl, setProfileImageUrl] = useState<string>('');
    const [waterTargetText, setWaterTargetText] = useState<string>('8');
    const [stepsTargetText, setStepsTargetText] = useState<string>('10000');
    const [loading, setLoading] = useState<boolean>(false);
    const [showImageDialog, setShowImageDialog] = useState<boolean>(false);
    const [showLogoutDialog, setShowLogoutDialog] = useState<boolean>(false);
    const navigation = useNavigation();

    const [isBiometricEnabled, setIsBiometricEnabled] = useState<boolean>(false);
    const [hasBiometricHardware, setHasBiometricHardware] = useState<boolean>(false);


    const dismissKeyboard = () => {
        Keyboard.dismiss();
    };

    const pickImage = async (useCamera: boolean = false): Promise<void> => {
        try {
            setShowImageDialog(false);

            let result;

            if (useCamera) {
                const { status } = await ImagePicker.requestCameraPermissionsAsync();
                if (status !== 'granted') {
                    Alert.alert('Permission needed', 'Camera permission is required');
                    return;
                }
                result = await ImagePicker.launchCameraAsync({
                    mediaTypes: ImagePicker.MediaTypeOptions.Images,
                    allowsEditing: true,
                    aspect: [1, 1],
                    quality: 0.8,
                });
            } else {
                const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
                if (status !== 'granted') {
                    Alert.alert('Permission needed', 'Photo library permission is required');
                    return;
                }
                result = await ImagePicker.launchImageLibraryAsync({
                    mediaTypes: ImagePicker.MediaTypeOptions.Images,
                    allowsEditing: true,
                    aspect: [1, 1],
                    quality: 0.8,
                });
            }

            if (!result.canceled && result.assets[0]) {
                const imageUri = result.assets[0].uri;
                const compressedImage = await ImageManipulator.manipulateAsync(
                    imageUri,
                    [
                        { resize: { width: 800, height: 800 } }, // Resize to max 800x800
                    ],
                    {
                        compress: 0.7, // 70% quality
                        format: ImageManipulator.SaveFormat.JPEG,
                    }
                );

                // Check file size and compress further if needed
                const response = await fetch(compressedImage.uri);
                const blob = await response.blob();

                if (blob.size > 1024 * 1024) { // If still > 1MB
                    const furtherCompressed = await ImageManipulator.manipulateAsync(
                        compressedImage.uri,
                        [],
                        {
                            compress: 0.5, // Reduce to 50% quality
                            format: ImageManipulator.SaveFormat.JPEG,
                        }
                    );
                    await uploadProfileImage(furtherCompressed.uri);
                } else {
                    await uploadProfileImage(compressedImage.uri);
                }
            }
        } catch (error) {
            console.error('Error picking image:', error);
            Alert.alert('Error', 'Failed to select image');
        }
    };

    const uploadProfileImage = async (imageUri: string): Promise<void> => {
        console.log('Uploading profile image:', imageUri);
        try {
            setLoading(true);

            // Create FormData for image upload
            const formData = new FormData();
            formData.append('profileImage', {
                uri: imageUri,
                type: 'image/jpeg',
                name: 'profile.jpg',
            } as any);
            console.log('FormData created:', formData);
            const token = await getAuthToken();

            const response = await fetch(`http://${BACKEND_URL}/users/upload-profile-image`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data',
                },
                body: formData,
            });
            console.log('Response status:', response.status);
            const result = await response.json();

            if (result.data) {
                setUserInfo(prev =>
                    prev ? { ...prev, photoURL: result.data.photoURL } : null);
                await storeUserPhotoURL(result.data.photoURL);
                Alert.alert('Success', 'Profile image updated successfully');
            } else {
                throw new Error(result.error || 'Failed to upload image');
            }
        } catch (error) {
            console.error('Error uploading image:', error);
            Alert.alert('Error', 'Failed to upload image');
        } finally {
            setLoading(false);
        }
    };

    const handleWaterTargetChange = async (): Promise<void> => {
        const token = await getAuthToken();
        const waterTarget = parseInt(waterTargetText);
        if (waterTarget < 1 || waterTarget > 10) {
            Alert.alert('Invalid Target', 'Water target must be between 1 and 20 glasses');
            return;
        }
        // await updateUserSettings({ waterTarget });
        try {
            setLoading(true);
            const response = await fetch(`http://${BACKEND_URL}/habit/water/settings`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ waterTarget: waterTargetText }),
            });
            console.log(response);
            await storeUserSetting(waterTarget, parseInt(stepsTargetText));
            if (response.ok) {
                console.log('water settings updated successfully');
            }
        } catch (error) {
            console.error('Error updating water settings:', error);
            Alert.alert('Error', 'Failed to update water settings');
        } finally {
            setLoading(false);
        }

        Alert.alert('Success', 'Water target updated successfully');
    };

    const handleStepTargetChange = async (): Promise<void> => {
        const token = await getAuthToken();
        const stepsTarget = parseInt(stepsTargetText);
        if (stepsTarget < 1000 || stepsTarget > 20000) {
            Alert.alert('Invalid Target', 'Step target must be between 1,000 and 50,000 steps');
            return;
        }
        try {
            setLoading(true);
            const response = await fetch(`http://${BACKEND_URL}/habit/steps/settings`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ stepsTarget: stepsTargetText }),
            });

            await storeUserSetting(parseInt(waterTargetText), stepsTarget);
            if (response.ok) {
                console.log('steps settings updated successfully');
            }
        } catch (error) {
            console.error('Error updating steps settings:', error);
            Alert.alert('Error', 'Failed to update steps settings');
        } finally {
            setLoading(false);
        }
        Alert.alert('Success', 'Step target updated successfully');
    };

    const handleLogout = async (): Promise<void> => {
        try {
            setShowLogoutDialog(false);
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
            navigation.navigate('Login');
        } catch (error) {
            console.error('Error logging out:', error);
            Alert.alert('Error', 'Failed to logout');
        }
    };

    useEffect(() => {
        const loadSettings = async () => {
            // Check for biometric hardware
            const hasHardware = await LocalAuthentication.hasHardwareAsync();
            console.log('has HARDWARE?', hasHardware);
            setHasBiometricHardware(hasHardware);

            // Load saved settings
            const user = await getUserInfo();
            const biometricSetting = await getBiometricSetting();

            if (user) {
                setUserInfo(user);
                setWaterTargetText(user.waterTarget || '8');
                setStepsTargetText(user.stepsTarget || '10000');
            }
            if (Platform.OS === 'android' && hasHardware) {
                setIsBiometricEnabled(biometricSetting);
            }
        };
        loadSettings();
    }, []);

    const handleToggleBiometrics = async () => {
        // This function will now only be effectively called on Android
        const newValue = !isBiometricEnabled;

        if (newValue) {
            const isEnrolled = await LocalAuthentication.isEnrolledAsync();
            if (!isEnrolled) {
                Alert.alert(
                    'No Biometrics Enrolled',
                    'You have not set up fingerprint or face unlock on this device.'
                );
                return;
            }
        }

        setIsBiometricEnabled(newValue);
        await storeBiometricSetting(newValue);
    };

    return (
        <PaperProvider theme={theme}>
            <SafeAreaView style={styles.safeArea}>
                <ScrollView>
                    <TouchableWithoutFeedback onPress={dismissKeyboard}>
                        <View style={styles.container}>
                            {/* Profile Avatar Section */}
                            <View style={styles.avatarSection}>
                                <TouchableOpacity
                                    onPress={() => setShowImageDialog(true)}
                                    disabled={loading}
                                >
                                    {userInfo?.photoURL ? (
                                        <Avatar.Image
                                            size={120}
                                            source={{ uri: userInfo?.photoURL }}
                                            style={styles.avatar}
                                        />
                                    ) : (
                                        <Avatar.Text
                                            size={120}
                                            label={userInfo?.displayName?.charAt(0).toUpperCase() || 'U'}
                                            style={styles.avatar}
                                        />
                                    )}
                                    <View style={styles.cameraIcon}>
                                        <IconButton
                                            icon="camera"
                                            size={20}
                                            iconColor="#fff"
                                            style={styles.cameraButton}
                                        />
                                    </View>
                                </TouchableOpacity>
                                <Text style={styles.userName}>{userInfo?.displayName || 'User'}</Text>
                                <Text style={styles.userEmail}>{userInfo?.email || ''}</Text>
                            </View>

                            {hasBiometricHardware && (
                                <Card style={styles.settingCard}>
                                    <Card.Content>
                                        <Text style={styles.cardTitle}>Security</Text>
                                        <View style={styles.securityRow}>
                                            <Text
                                                style={[
                                                    styles.settingLabel,
                                                    Platform.OS === 'ios' && styles.disabledText
                                                ]}
                                            >
                                                Require Biometric Lock
                                            </Text>
                                            <Switch
                                                value={isBiometricEnabled}
                                                onValueChange={handleToggleBiometrics}
                                                // Disable the switch on iOS
                                                disabled={Platform.OS === 'ios'}
                                            />
                                        </View>
                                        {Platform.OS === 'ios' && (
                                            <Text style={styles.iosNote}>
                                                This feature is not available in Expo Go on iOS but will be active in the final app.
                                            </Text>
                                        )}
                                    </Card.Content>
                                </Card>
                            )}



                            {/* Water Target Card */}
                            <Card style={styles.settingCard}>
                                <Card.Content>
                                    <Text style={styles.cardTitle}>Daily Water Target</Text>
                                    <View style={styles.settingRow}>
                                        <TextInput
                                            mode="outlined"
                                            value={waterTargetText}
                                            onChangeText={(text) => setWaterTargetText(text || '')}
                                            keyboardType="numeric"
                                            style={styles.targetInput}
                                            right={<TextInput.Affix text="glasses" />}
                                        />
                                        <Button
                                            mode="contained"
                                            onPress={handleWaterTargetChange}
                                            loading={loading}
                                            style={styles.updateButton}
                                        >
                                            Update
                                        </Button>
                                    </View>
                                </Card.Content>
                            </Card>

                            {/* Step Target Card */}
                            <Card style={styles.settingCard}>
                                <Card.Content>
                                    <Text style={styles.cardTitle}>Daily Step Target</Text>
                                    <View style={styles.settingRow}>
                                        <TextInput
                                            mode="outlined"
                                            value={stepsTargetText}
                                            onChangeText={(text) => setStepsTargetText(text || '')}
                                            keyboardType="numeric"
                                            style={styles.targetInput}
                                            right={<TextInput.Affix text="steps" />}
                                        />
                                        <Button
                                            mode="contained"
                                            onPress={handleStepTargetChange}
                                            loading={loading}
                                            style={styles.updateButton}
                                        >
                                            Update
                                        </Button>
                                    </View>
                                </Card.Content>
                            </Card>

                            {/* Logout Button */}
                            <Button
                                mode="outlined"
                                onPress={() => setShowLogoutDialog(true)}
                                icon="logout"
                                style={styles.logoutButton}
                                textColor="#FF5722"
                            >
                                Logout
                            </Button>

                            {/* Image Selection Dialog */}
                            <Portal>
                                <Dialog visible={showImageDialog} onDismiss={() => setShowImageDialog(false)}>
                                    <Dialog.Title>Select Profile Photo</Dialog.Title>
                                    <Dialog.Content>
                                        <View style={styles.dialogButtons}>
                                            <Button
                                                mode="outlined"
                                                onPress={() => pickImage(true)}
                                                icon="camera"
                                                style={styles.dialogButton}
                                            >
                                                Take Photo
                                            </Button>
                                            <Button
                                                mode="outlined"
                                                onPress={() => pickImage(false)}
                                                icon="image"
                                                style={styles.dialogButton}
                                            >
                                                Choose from Gallery
                                            </Button>
                                        </View>
                                    </Dialog.Content>
                                    <Dialog.Actions>
                                        <Button onPress={() => setShowImageDialog(false)}>Cancel</Button>
                                    </Dialog.Actions>
                                </Dialog>
                            </Portal>

                            {/* Logout Confirmation Dialog */}
                            <Portal>
                                <Dialog visible={showLogoutDialog} onDismiss={() => setShowLogoutDialog(false)}>
                                    <Dialog.Title>Confirm Logout</Dialog.Title>
                                    <Dialog.Content>
                                        <Text>Are you sure you want to logout?</Text>
                                    </Dialog.Content>
                                    <Dialog.Actions>
                                        <Button onPress={() => setShowLogoutDialog(false)}>Cancel</Button>
                                        <Button onPress={handleLogout} textColor="#FF5722">Logout</Button>
                                    </Dialog.Actions>
                                </Dialog>
                            </Portal>
                        </View>

                    </TouchableWithoutFeedback>
                </ScrollView>
                <BottomNavBar />
            </SafeAreaView>
        </PaperProvider >
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#F5F5F5',
    },
    container: {
        flex: 1,
        padding: responsiveSpacing(16),
        backgroundColor: '#F5F5F5',
    },
    avatarSection: {
        alignItems: 'center',
        marginBottom: responsiveSpacing(24),
        paddingVertical: responsiveSpacing(20),
    },
    avatar: {
        backgroundColor: '#129990',
    },
    cameraIcon: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#129990',
        borderRadius: responsiveSpacing(20),
    },
    cameraButton: {
        margin: 0,
    },
    userName: {
        fontSize: responsiveFontSize(24),
        fontWeight: 'bold',
        color: '#333',
        marginTop: responsiveSpacing(16),
    },
    userEmail: {
        fontSize: responsiveFontSize(16),
        color: '#666',
        marginTop: responsiveSpacing(4),
    },
    settingCard: {
        marginBottom: responsiveSpacing(16),
        elevation: 4,
    },
    cardTitle: {
        fontSize: responsiveFontSize(18),
        fontWeight: 'bold',
        color: '#333',
        marginBottom: responsiveSpacing(12),
    },
    settingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: responsiveSpacing(12),
    },
    targetInput: {
        flex: 1,
        backgroundColor: '#fff',
    },
    updateButton: {
        minWidth: responsiveSpacing(80),
    },
    logoutButton: {
        marginTop: responsiveSpacing(20),
        borderColor: '#FF5722',
    },
    dialogButtons: {
        flexDirection: 'row',
        gap: responsiveSpacing(12),
    },
    dialogButton: {
        flex: 1,
    },
    securityRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: responsiveSpacing(8),
    },
    settingLabel: {
        fontSize: responsiveFontSize(16),
        color: '#333',
    },
    disabledText: {
        color: '#9E9E9E', // Grey out text on iOS
    },
    iosNote: {
        fontSize: responsiveFontSize(12),
        color: '#666',
        marginTop: responsiveSpacing(8),
        fontStyle: 'italic',
    }
});

export default ProfileScreen;
