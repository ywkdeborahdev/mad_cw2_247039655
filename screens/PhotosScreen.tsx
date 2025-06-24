import React, { useState, useEffect } from 'react';
import {
    View,
    StyleSheet,
    SafeAreaView,
    FlatList,
    Image,
    RefreshControl,
    ActivityIndicator,
} from 'react-native';
import {
    Provider as PaperProvider,
    Text,
    Card,
} from 'react-native-paper';
import theme from '../theme/shared-theme';
import BottomNavBar from '../components/BottomNavBar';
import { getUserInfo, getAuthToken } from '../utils/asyncStorage';
import { User } from '../modelsFrontend';
// @ts-ignore
import { BACKEND_URL } from '@env';
import { getEmotionIcon } from '../server/src/utils/getEmotionIcon';
import { wp, hp, responsiveFontSize, responsiveSpacing } from '../utils/responsive';

interface PhotoOfTheDay {
    photoURL: string;
    photoLocation: string;
    photoCaption: string;
    date: string;
    emotionAnalysis?: string;
}

const PhotoItem: React.FC<{ photo: PhotoOfTheDay }> = ({ photo }) => {
    return (
        <Card style={styles.photoCard}>
            <Card.Content style={styles.photoContent}>
                {/* Header with date and emotion */}
                <View style={styles.photoHeader}>
                    <Text style={styles.photoDate}>{photo.date}</Text>
                    {photo.emotionAnalysis && (
                        <View style={styles.emotionContainer}>
                            <Text style={styles.emotionIcon}>
                                {getEmotionIcon(photo.emotionAnalysis)}
                            </Text>
                            <Text style={styles.emotionText}>{photo.emotionAnalysis}</Text>
                        </View>
                    )}
                </View>

                {/* Photo */}
                <Image
                    source={{ uri: photo.photoURL }}
                    style={styles.photoImage}
                    resizeMode="cover"
                />

                {/* Caption and Location */}
                <View style={styles.photoDetails}>
                    <Text style={styles.photoCaption}>{photo.photoCaption}</Text>
                    <Text style={styles.photoLocation}>📍 {photo.photoLocation}</Text>
                </View>
            </Card.Content>
        </Card>
    );
};

const PhotosScreen: React.FC = () => {
    const [photos, setPhotos] = useState<PhotoOfTheDay[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [refreshing, setRefreshing] = useState<boolean>(false);
    const [lastDate, setLastDate] = useState<string | null>(null);
    const [hasMore, setHasMore] = useState<boolean>(true);
    const [userInfo, setUserInfo] = useState<User | null>(null);

    const fetchPhotos = async (isRefresh: boolean = false) => {
        if (loading || (!hasMore && !isRefresh)) return;

        setLoading(true);

        try {
            const token = await getAuthToken();
            let url = `http://${BACKEND_URL}/habit/photo-of-the-day/history?limit=10`;

            if (!isRefresh && lastDate) {
                url += `&startAfter=${lastDate}`;
            }

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const { data } = await response.json();


            if (data.photos.length > 0) {
                console.log(data.photos);
                if (isRefresh) {
                    setPhotos(data.photos);
                } else {
                    setPhotos(prev => [...prev, ...data.photos]);
                }

                setLastDate(data.photos[data.photos.length - 1].date);
                setHasMore(data.photos.length === 10);
            } else {
                setHasMore(false);
            }
        } catch (error) {
            console.error('Error fetching photos:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleRefresh = () => {
        setRefreshing(true);
        setLastDate(null);
        setHasMore(true);
        fetchPhotos(true);
    };

    const handleEndReached = () => {
        if (hasMore && !loading) {
            fetchPhotos(false);
        }
    };

    const renderItem = ({ item }: { item: PhotoOfTheDay }) => (
        <PhotoItem photo={item} />
    );

    const renderFooter = () => {
        if (!loading) return null;
        return (
            <View style={styles.loadingFooter}>
                <ActivityIndicator size="small" color="#129990" />
                <Text style={styles.loadingText}>Loading more photos...</Text>
            </View>
        );
    };

    const renderEmpty = () => (
        <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No photos yet</Text>
            <Text style={styles.emptySubtext}>Start capturing your daily moments!</Text>
        </View>
    );

    useEffect(() => {
        const initializeData = async () => {
            const user = await getUserInfo();
            setUserInfo(user);
            fetchPhotos(true);
        };

        initializeData();
    }, []);

    return (
        <PaperProvider theme={theme}>
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Photo Memories</Text>
                </View>

                <FlatList
                    data={photos}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.date}
                    onEndReached={handleEndReached}
                    onEndReachedThreshold={0.5}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={handleRefresh}
                            colors={['#129990']}
                        />
                    }
                    ListFooterComponent={renderFooter}
                    ListEmptyComponent={!loading ? renderEmpty : null}
                    contentContainerStyle={[
                        styles.container,
                        photos.length === 0 && styles.emptyListContainer
                    ]}
                    showsVerticalScrollIndicator={false}
                />

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
    header: {
        paddingHorizontal: responsiveSpacing(16),
        paddingVertical: responsiveSpacing(12),
        backgroundColor: '#FFFFFF',
        elevation: 2,
    },
    headerTitle: {
        fontSize: responsiveFontSize(24),
        fontWeight: 'bold',
        color: '#333',
        textAlign: 'center',
    },
    container: {
        padding: responsiveSpacing(16),
    },
    emptyListContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    photoCard: {
        marginBottom: responsiveSpacing(16),
        elevation: 4,
        backgroundColor: '#FFFFFF',
    },
    photoContent: {
        padding: 0,
    },
    photoHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: responsiveSpacing(16),
        paddingTop: responsiveSpacing(16),
        paddingBottom: responsiveSpacing(12),
    },
    photoDate: {
        fontSize: responsiveFontSize(14),
        fontWeight: '600',
        color: '#666',
    },
    emotionContainer: {
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
    photoImage: {
        width: '100%',
        height: responsiveSpacing(300),
        backgroundColor: '#f0f0f0',
    },
    photoDetails: {
        padding: responsiveSpacing(16),
    },
    photoCaption: {
        fontSize: responsiveFontSize(12),
        // fontWeight: 'bold',
        color: '#333',
        marginBottom: responsiveSpacing(4),
        lineHeight: responsiveFontSize(16),
    },
    photoLocation: {
        fontSize: responsiveFontSize(12),
        color: '#666',
        lineHeight: responsiveFontSize(14),
    },
    loadingFooter: {
        paddingVertical: responsiveSpacing(20),
        alignItems: 'center',
    },
    loadingText: {
        fontSize: responsiveFontSize(14),
        color: '#666',
        marginTop: responsiveSpacing(8),
    },
    emptyContainer: {
        alignItems: 'center',
        paddingVertical: responsiveSpacing(40),
    },
    emptyText: {
        fontSize: responsiveFontSize(18),
        fontWeight: 'bold',
        color: '#666',
        marginBottom: responsiveSpacing(8),
    },
    emptySubtext: {
        fontSize: responsiveFontSize(14),
        color: '#999',
        textAlign: 'center',
    },
});

export default PhotosScreen;
