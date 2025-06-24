import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    SafeAreaView,
    ScrollView,
    View,
    Dimensions,
    ActivityIndicator
} from 'react-native';
import {
    Provider as PaperProvider,
    Text,
    Card,
    ToggleButton,
    IconButton,
} from 'react-native-paper';
import { BarChart, PieChart } from 'react-native-chart-kit';
import theme from '../theme/shared-theme';
import BottomNavBar from '../components/BottomNavBar';
import { responsiveFontSize, responsiveSpacing } from '../utils/responsive';
import { getAuthToken } from '../utils/asyncStorage';
// @ts-ignore
import { BACKEND_URL } from '@env';

const screenWidth = Dimensions.get('window').width;

const chartConfig = {
    backgroundColor: '#ffffff',
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: {
        borderRadius: 16,
    },
    barPercentage: 0.2,
    propsForDots: {
        r: '6',
        strokeWidth: '2',
        stroke: '#ffa726',
    },
};

const emotionColorMap: { [key: string]: string } = {
    'Joy': '#A5D6A7',
    'Sadness': '#90CAF9',
    'Surprise': '#FFF59D',
    'Neutral': '#E0E0E0',
    'Anger': '#EF9A9A',
    'Love': '#F48FB1',
    'default': '#BDBDBD'
};

const mapEmotionDataForPieChart = (emotions: { name: string; count: number }[]) => {
    return emotions.map(emotion => ({
        ...emotion,
        color: emotionColorMap[emotion.name] || emotionColorMap.default,
        legendFontColor: '#7F7F7F',
        legendFontSize: 14,
    }));
};

const emptyChartData = {
    labels: [],
    datasets: [{ data: [] }]
};

const AnalyticsScreen: React.FC = () => {
    const [timeRange, setTimeRange] = useState<'weekly' | 'monthly'>('weekly');
    const [dateOffset, setDateOffset] = useState(0);
    const [chartData, setChartData] = useState<any>(null);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        const fetchAnalyticsData = async () => {
            setLoading(true);
            try {
                const token = await getAuthToken();
                const response = await fetch(`http://${BACKEND_URL}/habit/analytics/${timeRange}?offset=${dateOffset}`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                const result = await response.json();
                if (result.data) {
                    setChartData({
                        ...result.data,
                        emotionData: mapEmotionDataForPieChart(result.data.emotionData)
                    });
                } else {
                    setChartData({
                        displayRange: 'No Data',
                        waterData: emptyChartData,
                        stepData: emptyChartData,
                        emotionData: []
                    });
                }
            } catch (error) {
                console.error('Error fetching analytics:', error);
                setChartData(null);
            } finally {
                setLoading(false);
            }
        };

        fetchAnalyticsData();
    }, [timeRange, dateOffset]);

    useEffect(() => {
        setDateOffset(0);
    }, [timeRange]);

    const handlePrevious = () => {
        setDateOffset(prev => prev - 1);
    };

    const handleNext = () => {
        if (dateOffset < 0) {
            setDateOffset(prev => prev + 1);
        }
    };

    const renderContent = () => {
        if (loading) {
            return (
                <View style={styles.placeholder}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                    <Text style={{ marginTop: 10 }}>Loading Analytics...</Text>
                </View>
            );
        }

        if (!chartData) {
            return (
                <View style={styles.placeholder}>
                    <Text>Could not load analytics data.</Text>
                </View>
            );
        }

        const hasWaterData = chartData.waterData.datasets[0].data.some((v: number) => v > 0);
        const hasStepData = chartData.stepData.datasets[0].data.some((v: number) => v > 0);

        return (
            <>
                <Card style={styles.chartCard}>
                    <Card.Content>
                        <Text style={styles.chartTitle}>Water Intake</Text>
                        <Text style={styles.chartSubtitle}>Glasses per day</Text>
                        {hasWaterData ? (
                            <BarChart
                                data={chartData.waterData}
                                width={screenWidth - responsiveSpacing(64)}
                                height={250}
                                yAxisLabel=""
                                yAxisSuffix=""
                                fromNumber={10}
                                chartConfig={chartConfig}
                                // verticalLabelRotation={timeRange === 'monthly' ? 90 : 0}
                                fromZero
                            />
                        ) : (
                            <View style={styles.placeholder}>
                                <Text>No water intake recorded for this period.</Text>
                            </View>
                        )}
                    </Card.Content>
                </Card>

                <Card style={styles.chartCard}>
                    <Card.Content>
                        <Text style={styles.chartTitle}>Step Count</Text>
                        <Text style={styles.chartSubtitle}>Steps per day</Text>
                        {hasStepData ? (
                            <BarChart
                                data={chartData.stepData}
                                width={screenWidth - responsiveSpacing(64)}
                                height={250}
                                yAxisLabel=""
                                yAxisSuffix=""
                                fromNumber={20000}
                                chartConfig={{
                                    ...chartConfig,
                                    color: (opacity = 1) => `rgba(3, 218, 197, ${opacity})`,
                                }}
                                // verticalLabelRotation={timeRange === 'monthly' ? 90 : 0}
                                fromZero
                            />
                        ) : (
                            <View style={styles.placeholder}>
                                <Text>No steps recorded for this period.</Text>
                            </View>
                        )}
                    </Card.Content>
                </Card>

                <Card style={styles.chartCard}>
                    <Card.Content>
                        <Text style={styles.chartTitle}>Emotion Summary</Text>
                        <Text style={styles.chartSubtitle}>Based on your daily photos</Text>
                        {chartData.emotionData.length > 0 ? (
                            <PieChart
                                data={chartData.emotionData}
                                width={screenWidth - responsiveSpacing(64)}
                                height={220}
                                chartConfig={chartConfig}
                                accessor={"count"}
                                backgroundColor={"transparent"}
                                paddingLeft={"15"}
                                absolute
                            />
                        ) : (
                            <View style={styles.placeholder}>
                                <Text>No emotion data to display.</Text>
                            </View>
                        )}
                    </Card.Content>
                </Card>
            </>
        );
    };

    return (
        <PaperProvider theme={theme}>
            <SafeAreaView style={styles.safeArea}>
                <ScrollView style={styles.container}>
                    <View style={styles.header}>
                        <Text style={styles.headerTitle}>Your Wellness Analytics</Text>
                    </View>

                    <View style={styles.toggleContainer}>
                        <ToggleButton.Row
                            onValueChange={(value) => {
                                if (value !== null) {
                                    setTimeRange(value as 'weekly' | 'monthly');
                                }
                            }}
                            value={timeRange}
                        >
                            <ToggleButton icon="calendar-week" value="weekly" />
                            <ToggleButton icon="calendar-month" value="monthly" />
                        </ToggleButton.Row>
                    </View>

                    <View style={styles.periodNavigator}>
                        <IconButton icon="chevron-left" onPress={handlePrevious} size={28} />
                        <Text style={styles.periodText}>{loading ? ' ' : chartData?.displayRange}</Text>
                        <IconButton icon="chevron-right" onPress={handleNext} disabled={dateOffset >= 0} size={28} />
                    </View>

                    {renderContent()}

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
    },
    header: {
        paddingVertical: responsiveSpacing(12),
        marginBottom: responsiveSpacing(12),
    },
    headerTitle: {
        fontSize: responsiveFontSize(16),
        fontWeight: 'bold',
        color: '#333',
        textAlign: 'center',
    },
    toggleContainer: {
        marginBottom: responsiveSpacing(10),
        alignItems: 'center',
    },
    periodNavigator: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: responsiveSpacing(16),
        marginBottom: responsiveSpacing(20),
    },
    periodText: {
        fontSize: responsiveFontSize(16),
        fontWeight: '600',
        color: theme.colors.primary,
    },
    chartCard: {
        marginHorizontal: responsiveSpacing(16),
        marginBottom: responsiveSpacing(20),
        elevation: 4,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
    },
    chartTitle: {
        fontSize: responsiveFontSize(18),
        fontWeight: 'bold',
        color: '#333',
        marginBottom: responsiveSpacing(4),
    },
    chartSubtitle: {
        fontSize: responsiveFontSize(14),
        color: '#666',
        marginBottom: responsiveSpacing(16),
    },
    placeholder: {
        height: 250,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fafafa',
        borderRadius: 8,
    },
});

export default AnalyticsScreen;