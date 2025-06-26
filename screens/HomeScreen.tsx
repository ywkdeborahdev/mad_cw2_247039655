import React, { useState, useEffect } from 'react';
import {
    View,
    StyleSheet,
    SafeAreaView,
    Platform,
    Alert,
    TouchableOpacity,
    Image,
    ScrollView
} from 'react-native';
import {
    Provider as PaperProvider,
    Text,
    Card,
    Avatar,
    IconButton,
    ProgressBar,
    Button,
    TextInput,
    Dialog,
    Portal
} from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import * as Device from 'expo-device';
import * as Location from 'expo-location';
import { Pedometer } from 'expo-sensors';
import theme from '../theme/shared-theme';
import BottomNavBar from '../components/BottomNavBar';
import { getUserInfo, getAuthToken, storeUserSetting, getUserSetting } from '../utils/asyncStorage';
import { UserCredential, User } from '../modelsFrontend';
// @ts-ignore
import { BACKEND_URL } from '@env';
import { getEmotionIcon } from '../server/src/utils/getEmotionIcon';
import { wp, hp, responsiveFontSize, responsiveSpacing } from '../utils/responsive';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface PhotoOfTheDay {
    photoURL: string;
    photoLocation: string;
    photoCaption: string;
    date: string;
    emotionAnalysis?: string;
}

const HomeScreen: React.FC = () => {
    const [waterCount, setWaterCount] = useState<number>(0);
    const [userInfo, setUserInfo] = useState<User | null>();
    const [waterTarget, setWaterTarget] = useState<number>(8);
    const [stepsTarget, setStepsTarget] = useState<number>(10000);
    const [stepCount, setStepCount] = useState<number>(0);
    const [isPedometerAvailable, setIsPedometerAvailable] = useState<boolean>(false);
    const [permissionStatus, setPermissionStatus] = useState<string>('checking');

    // New state for Photo of the Day
    const [photoOfTheDay, setPhotoOfTheDay] = useState<PhotoOfTheDay | null>(null);
    const [showPhotoDialog, setShowPhotoDialog] = useState<boolean>(false);
    const [selectedPhotoUri, setSelectedPhotoUri] = useState<string | null>(null);
    const [photoCaption, setPhotoCaption] = useState<string>('');
    const [photoLocation, setPhotoLocation] = useState<string>('');
    const [uploadingPhoto, setUploadingPhoto] = useState<boolean>(false);

    const insets = useSafeAreaInsets();

    const addWater = async (): Promise<void> => {
        setWaterCount(prevCount => prevCount + 1);
        try {
            const token = await getAuthToken();
            const response = await fetch(`http://${BACKEND_URL}/habit/water/add`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                }
            });
        } catch (error) {
            console.error('Error adding water:', error);
        }
    };


    const getTodayWater = async (): Promise<void> => {
        try {
            const token = await getAuthToken();
            const response = await fetch(`http://${BACKEND_URL}/habit/water/today`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                }
            });

            const { data } = await response.json();
            setWaterCount(data === undefined ? 0 : data);
        } catch (error) {
            console.error('getTodayWater error:', error);
        }
    };

    const getTodaySteps = async (): Promise<void> => {
        try {

            // if (Platform.OS === 'ios' && __DEV__) {
            //     const mockSteps = Math.floor(Math.random() * 12000) + 3000;
            //     setStepCount(mockSteps);
            //     setIsPedometerAvailable(true);
            //     setPermissionStatus('granted');
            //     return;
            // }
            const isAvailable = await Pedometer.isAvailableAsync();

            console.log('Pedometer available:', isAvailable);
            setIsPedometerAvailable(isAvailable);

            // Request permission
            const hasPermission = await requestMotionPermission();
            console.log('Motion permission status:', hasPermission);
            if (!hasPermission) {
                return;
            }

            if (isAvailable) {
                const end = new Date();
                const start = new Date();
                start.setHours(0, 0, 0, 0); // Start of today

                const pastStepCountResult = await Pedometer.getStepCountAsync(start, end);
                if (pastStepCountResult) {
                    setStepCount(pastStepCountResult.steps);
                }

                try {
                    const token = await getAuthToken();
                    const response = await fetch(`http://${BACKEND_URL}/habit/steps/add`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`,
                        },
                        body: JSON.stringify({
                            stepCount: pastStepCountResult.steps,
                        })
                    });
                } catch (error) {
                    console.error('Error adding water:', error);
                }
            }
        } catch (error) {
            console.error('Error getting step count:', error);
        }
    };

    const calculateStepProgress = (): number => {
        return Math.min(stepCount / stepsTarget, 1);
    };


    const getStepProgressColor = (): string => {
        const progress = calculateStepProgress();
        if (progress >= 1) return '#4CAF50'; // Green when goal reached
        if (progress >= 0.7) return '#FF9800'; // Orange when close
        return theme.colors.primary; // Default theme color
    };
    const requestMotionPermission = async (): Promise<boolean> => {
        try {
            if (Platform.OS === 'ios') {
                // Test pedometer availability by making a small query
                const end = new Date();
                const start = new Date(end.getTime() - 1000); // 1 second ago

                await Pedometer.getStepCountAsync(start, end);
                return true;
            }
            return false;
        } catch (error: any) {
            // console.error('Permission check failed:', error);
            if (error.code === 'E_MOTION_UNAVAILABLE') {
                setPermissionStatus('denied');
                Alert.alert(
                    'Motion Access Required',
                    'Please enable Motion & Fitness access in Settings → Privacy & Security → Motion & Fitness',
                    [{ text: 'OK' }]
                );
            }
            return false;
        }
    };

    const getCurrentLocation = async (): Promise<string> => {
        try {
            // 1. Check if location services are enabled on the device
            const enabled = await Location.hasServicesEnabledAsync();
            if (!enabled) {
                Alert.alert('Location Services Disabled', 'Please enable location services in your device settings.');
                return 'Location not enabled';
            }

            // 2. Request permission from the user
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission Denied', 'Location permission is needed to tag your photo.');
                return 'Permission not granted';
            }

            // 3. Get the location with a timeout
            const location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced,
            });

            // 4. Reverse geocode to get a human-readable address
            const reverseGeocode = await Location.reverseGeocodeAsync({
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
            });

            if (reverseGeocode.length > 0) {
                const { city, region, country } = reverseGeocode[0];
                return `${city}, ${region}, ${country}`;
            }
            return 'Location found'; // Fallback if geocoding fails
        } catch (error: any) {
            console.error('Error getting location:', error);
            // Handle specific errors like timeout
            if (error.code === 'E_LOCATION_TIMEOUT') {
                return 'Could not get location in time';
            }
            return 'Location unavailable';
        }
    };

    const pickPhotoOfTheDay = async (): Promise<void> => {
        try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission needed', 'Photo library permission is required');
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.8,
            });

            if (!result.canceled && result.assets[0]) {
                openPhotoDialog(result.assets[0].uri);
            }
        } catch (error) {
            console.error('Error picking photo:', error);
            Alert.alert('Error', 'Failed to select photo');
        }
    };

    const takePhotoOfTheDay = async (): Promise<void> => {
        try {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission needed', 'Camera permission is required');
                return;
            }

            const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.8,
            });

            if (!result.canceled && result.assets[0]) {
                openPhotoDialog(result.assets[0].uri);
            }
        } catch (error) {
            console.error('Error taking photo:', error);
            Alert.alert('Error', 'Failed to take photo');
        }
    };

    const uploadPhotoOfTheDay = async (): Promise<void> => {
        if (!selectedPhotoUri) return;

        setUploadingPhoto(true);
        try {
            const formData = new FormData();
            formData.append('photoOfTheDay', {
                uri: selectedPhotoUri,
                type: 'image/jpeg',
                name: 'photo-of-the-day.jpg',
            } as any);
            formData.append('caption', photoCaption);
            formData.append('location', photoLocation);

            const token = await getAuthToken();
            const response = await fetch(`http://${BACKEND_URL}/habit/photo-of-the-day`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data',
                },
                body: formData,
            });

            const result = await response.json();

            if (response.ok) {
                getTodayPhotoOfTheDay();
                setShowPhotoDialog(false);
                setPhotoCaption('');
                setSelectedPhotoUri(null);
                Alert.alert('Success', 'Photo of the day uploaded!');
            } else {
                throw new Error(result.message || 'Failed to upload photo');
            }
        } catch (error: any) {
            console.error('Error uploading photo:', error);
            Alert.alert('Error', error.message || 'Failed to upload photo of the day');
        } finally {
            setUploadingPhoto(false);
        }
    };

    const getTodayPhotoOfTheDay = async (): Promise<void> => {
        try {
            const token = await getAuthToken();
            const response = await fetch(`http://${BACKEND_URL}/habit/photo-of-the-day/today`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                }
            });

            const { data } = await response.json();
            if (data) {
                setPhotoOfTheDay(data);
            }
        } catch (error) {
            console.error('Error getting today\'s photo:', error);
        }
    };

    const openPhotoDialog = (imageUri: string) => {
        setSelectedPhotoUri(imageUri); // Set the URI
        setShowPhotoDialog(true);      // THEN show the dialog
    };


    useEffect(() => {
        console.log("fetching info");
        const fetchInfo = async () => {
            const user = await getUserInfo();
            setUserInfo(user);
            setWaterTarget(parseInt(user!.waterTarget));
            setStepsTarget(parseInt(user!.stepsTarget));
            getTodayWater();
            getTodayPhotoOfTheDay();
        };
        fetchInfo();
    }, []); // Run only once on mount

    useEffect(() => {
        let subscription: any;

        const setupStepTracking = async () => {
            // Get initial step count first
            await getTodaySteps();

            // Then set up incremental tracking
            if (isPedometerAvailable) {
                subscription = Pedometer.watchStepCount(result => {
                    // Add only the NEW steps detected
                    setStepCount(prevSteps => prevSteps + result.steps);
                });
            }
        };

        setupStepTracking();

        return () => {
            if (subscription) {
                subscription.remove();
            }
        };
    }, [isPedometerAvailable]);

    useEffect(() => {
        const fetchLocation = async () => {
            setPhotoLocation('Fetching location...');
            const location = await getCurrentLocation();
            setPhotoLocation(location);
        };

        if (showPhotoDialog && selectedPhotoUri) {
            fetchLocation();
        }
    }, [showPhotoDialog, selectedPhotoUri]);


    return (
        <PaperProvider theme={theme}>
            <SafeAreaView style={styles.safeArea}>
                <ScrollView
                    style={styles.scrollContainer}
                    contentContainerStyle={[
                        styles.container,
                        { paddingBottom: hp(7.5) + responsiveSpacing(20) }
                    ]}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Profile Card */}
                    <Card style={styles.profileCard}>
                        <Card.Content style={styles.profileContent}>
                            {userInfo?.photoURL ? (
                                <Avatar.Image
                                    size={60}
                                    source={{ uri: userInfo.photoURL }}
                                    style={styles.avatar}
                                />
                            ) : (
                                <Avatar.Text
                                    size={60}
                                    label={userInfo?.displayName?.charAt(0).toUpperCase() || 'U'}
                                    style={styles.avatar}
                                />
                            )}
                            <View style={styles.profileTextContainer}>
                                <Text style={styles.nameText}>{userInfo?.displayName || 'User'}</Text>
                                <Text style={styles.subtitleText}>Welcome back!</Text>
                            </View>
                        </Card.Content>
                    </Card>

                    {/* Water Tracking Card */}
                    <Card style={styles.waterCard}>
                        <Card.Content style={styles.waterContent}>
                            <View style={styles.waterInfo}>
                                <Text style={styles.waterLabel}>Water Intake</Text>
                                <Text style={styles.waterCount}>{waterCount} glasses</Text>
                                <Text style={styles.waterResult}>
                                    {waterCount >= waterTarget ? 'Daily goal reached!' : `${waterTarget - waterCount} glass(es) to go!`}
                                </Text>
                            </View>
                            <IconButton
                                icon="plus-circle"
                                size={40}
                                iconColor={theme.colors.primary}
                                onPress={addWater}
                                style={styles.addButton}
                            />
                        </Card.Content>
                    </Card>

                    {/* Step Counter Card */}
                    <Card style={styles.stepCard}>
                        <Card.Content style={styles.stepContent}>
                            <View style={styles.stepInfo}>
                                <Text style={styles.stepLabel}>Steps Today</Text>
                                <Text style={styles.stepCount}>
                                    {stepCount.toLocaleString()} steps
                                </Text>
                                <Text style={styles.stepResult}>
                                    {stepCount >= stepsTarget
                                        ? 'Daily goal achieved!'
                                        : `${(stepsTarget - stepCount).toLocaleString()} steps to go`
                                    }
                                </Text>
                                <View style={styles.progressContainer}>
                                    <ProgressBar
                                        progress={calculateStepProgress()}
                                        color={getStepProgressColor()}
                                        style={styles.progressBar}
                                    />
                                    <Text style={styles.progressText}>
                                        {Math.round(calculateStepProgress() * 100)}% of daily goal
                                    </Text>
                                </View>
                            </View>
                            <IconButton
                                icon="walk"
                                size={40}
                                iconColor={getStepProgressColor()}
                                style={styles.stepIcon}
                                disabled
                            />
                        </Card.Content>
                    </Card>

                    {/* NEW: Photo of the Day Card */}
                    <Card style={styles.photoCard}>
                        <Card.Content style={styles.photoContent}>
                            {/* Header with title and emotion */}
                            <View style={styles.photoHeader}>
                                <Text style={styles.stepLabel}>Photo of the day</Text>
                                {photoOfTheDay?.emotionAnalysis && (
                                    <View style={styles.headerEmotionDisplay}>
                                        <Text style={styles.emotionIcon}>
                                            {getEmotionIcon(photoOfTheDay.emotionAnalysis)}
                                        </Text>
                                        <Text style={styles.emotionText}>
                                            {photoOfTheDay.emotionAnalysis}
                                        </Text>
                                    </View>
                                )}
                            </View>

                            {photoOfTheDay ? (
                                <View style={styles.photoContainer}>
                                    {/* Left side - Square Image */}
                                    <Image
                                        source={{ uri: photoOfTheDay.photoURL }}
                                        style={styles.photoImageSquare}
                                        resizeMode="cover"
                                    />

                                    {/* Right side - Photo Details */}
                                    <View style={styles.photoRightSection}>
                                        <View style={styles.photoDetails}>
                                            <Text style={styles.photoCaption}>{photoOfTheDay.photoCaption}</Text>
                                            <Text style={styles.photoLocation}>📍 {photoOfTheDay.photoLocation}</Text>
                                        </View>
                                    </View>
                                </View>
                            ) : (
                                <View style={styles.emptyPhotoContainer}>
                                    <Text style={styles.photoLabel}>Record today!</Text>
                                    <TouchableOpacity
                                        style={styles.addPhotoButton}
                                        onPress={() => Alert.alert(
                                            'Add Photo',
                                            'Choose an option',
                                            [
                                                { text: 'Camera', onPress: takePhotoOfTheDay },
                                                { text: 'Gallery', onPress: pickPhotoOfTheDay },
                                                { text: 'Cancel', style: 'cancel' }
                                            ]
                                        )}
                                    >
                                        <IconButton
                                            icon="plus"
                                            size={30}
                                            iconColor="#fff"
                                        />
                                    </TouchableOpacity>
                                    <Text style={styles.addPhotoText}>Add your photo of the day</Text>
                                </View>
                            )}
                        </Card.Content>
                    </Card>


                    {/* Photo Upload Dialog */}
                    <Portal>
                        <Dialog visible={showPhotoDialog} onDismiss={() => setShowPhotoDialog(false)}>
                            <Dialog.Title>Add Photo of the Day</Dialog.Title>
                            <Dialog.Content>
                                {selectedPhotoUri && <Image source={{ uri: selectedPhotoUri }} style={styles.dialogImage} />}
                                <TextInput
                                    label="Caption"
                                    value={photoCaption}
                                    onChangeText={setPhotoCaption}
                                    mode="outlined"
                                    style={styles.captionInput}
                                    placeholder="What's happening today?"
                                />
                                <Text style={styles.locationText}>📍 {photoLocation}</Text>
                            </Dialog.Content>
                            <Dialog.Actions>
                                <Button onPress={() => setShowPhotoDialog(false)}>Cancel</Button>
                                <Button
                                    onPress={uploadPhotoOfTheDay}
                                    loading={uploadingPhoto}
                                    mode="contained"
                                >
                                    Share
                                </Button>
                            </Dialog.Actions>
                        </Dialog>
                    </Portal>

                    {!isPedometerAvailable && (
                        <Text style={styles.errorText}>
                            Step counter not available on this device
                        </Text>
                    )}
                </ScrollView>

                <BottomNavBar />
            </SafeAreaView>
        </PaperProvider>
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
    profileCard: {
        marginBottom: responsiveSpacing(16),
        elevation: 4,
    },
    profileContent: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: responsiveSpacing(16),
    },
    avatar: {
        backgroundColor: '#129990',
        marginRight: responsiveSpacing(16),
    },
    profileTextContainer: {
        flex: 1,
    },
    nameText: {
        fontSize: responsiveFontSize(20),
        fontWeight: 'bold',
        color: '#333',
        marginBottom: responsiveSpacing(4),
    },
    subtitleText: {
        fontSize: responsiveFontSize(14),
        color: '#666',
    },
    waterCard: {
        marginBottom: responsiveSpacing(16),
        elevation: 4,
    },
    waterContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: responsiveSpacing(16),
    },
    waterInfo: {
        flex: 1,
    },
    waterLabel: {
        fontSize: responsiveFontSize(16),
        color: '#666',
        marginBottom: responsiveSpacing(4),
    },
    waterCount: {
        fontSize: responsiveFontSize(24),
        fontWeight: 'bold',
        color: '#129990',
    },
    waterResult: {
        fontSize: responsiveFontSize(12),
        color: '#666',
        marginTop: responsiveSpacing(4),
    },
    addButton: {
        margin: 0,
    },
    stepCard: {
        marginBottom: responsiveSpacing(16),
        elevation: 4,
    },
    stepContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: responsiveSpacing(16),
    },
    stepInfo: {
        flex: 1,
    },
    stepLabel: {
        fontSize: responsiveFontSize(16),
        color: '#666',
        marginBottom: responsiveSpacing(4),
    },
    stepCount: {
        fontSize: responsiveFontSize(24),
        fontWeight: 'bold',
        color: '#129990',
    },
    stepResult: {
        fontSize: responsiveFontSize(12),
        color: '#666',
        marginTop: responsiveSpacing(4),
        marginBottom: responsiveSpacing(8),
    },
    progressContainer: {
        marginTop: responsiveSpacing(8),
    },
    progressBar: {
        height: responsiveSpacing(6),
        borderRadius: responsiveSpacing(3),
        backgroundColor: '#E0E0E0',
    },
    progressText: {
        fontSize: responsiveFontSize(10),
        color: '#999',
        marginTop: responsiveSpacing(4),
        textAlign: 'right',
    },
    stepIcon: {
        margin: 0,
    },
    errorText: {
        fontSize: responsiveFontSize(12),
        color: '#FF5722',
        textAlign: 'center',
        marginTop: responsiveSpacing(10),
    },
    photoCard: {
        marginBottom: responsiveSpacing(16),
        elevation: 4,
    },
    photoContent: {
        paddingVertical: responsiveSpacing(16),
    },
    photoContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginTop: responsiveSpacing(12),
        gap: responsiveSpacing(16),
    },
    emptyPhotoContainer: {
        alignItems: 'center',
        paddingVertical: responsiveSpacing(0),
    },
    photoLabel: {
        fontSize: responsiveFontSize(18),
        fontWeight: 'bold',
        color: '#333',
        marginBottom: responsiveSpacing(16),
    },
    addPhotoButton: {
        width: responsiveSpacing(80),
        height: responsiveSpacing(80),
        borderRadius: responsiveSpacing(40),
        backgroundColor: '#129990',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: responsiveSpacing(12),
    },
    addPhotoText: {
        fontSize: responsiveFontSize(14),
        color: '#666',
        textAlign: 'center',
    },
    captionInput: {
        marginBottom: responsiveSpacing(12),
        backgroundColor: '#fff',
    },
    locationText: {
        fontSize: responsiveFontSize(14),
        color: '#666',
        fontStyle: 'italic',
    },
    photoImageSquare: {
        width: responsiveSpacing(100),
        height: responsiveSpacing(100),
        borderRadius: responsiveSpacing(12),
    },
    photoRightSection: {
        flex: 1,
        justifyContent: 'space-between',
        height: responsiveSpacing(100),
    },
    photoDetails: {
        flex: 1,
    },
    photoCaption: {
        fontSize: responsiveFontSize(14),
        color: '#333',
        marginBottom: responsiveSpacing(4),
        lineHeight: responsiveFontSize(18),
    },
    photoLocation: {
        fontSize: responsiveFontSize(12),
        color: '#666',
        lineHeight: responsiveFontSize(16),
    },
    photoHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: responsiveSpacing(12),
    },
    headerEmotionDisplay: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: responsiveSpacing(6),
    },
    emotionIcon: {
        fontSize: responsiveFontSize(20),
    },
    emotionText: {
        fontSize: responsiveFontSize(12),
        fontWeight: '600',
        color: '#129990',
        textTransform: 'capitalize',
    },
    scrollContainer: {
        flex: 1,
    },
    dialogImage: {
        width: '100%',
        height: 200,
        borderRadius: 8,
        marginBottom: 16,
    }
});

export default HomeScreen;

