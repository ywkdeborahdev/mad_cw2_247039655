import React, { useState, useEffect } from 'react';
import {
    View,
    StyleSheet,
    TouchableOpacity,
} from 'react-native';
import {
    Surface,
    Text,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useNavigationState } from '@react-navigation/native';
import { wp, hp, responsiveFontSize, responsiveSpacing } from '../utils/responsive';

// Type definitions
interface NavItem {
    key: string;
    title: string;
    focusedIcon: string;
    unfocusedIcon: string;
}

const BottomNavBar: React.FC = () => {
    const navigation = useNavigation();

    // Get current route name from navigation state
    const currentRouteName = useNavigationState(state => {
        const route = state?.routes[state.index];
        return route?.name || 'home';
    });

    const [activeTab, setActiveTab] = useState<string>(currentRouteName);

    const navItems: NavItem[] = [
        {
            key: 'home',
            title: 'Home',
            focusedIcon: 'home',
            unfocusedIcon: 'home-outline'
        },
        {
            key: 'photos',
            title: 'Photos',
            focusedIcon: 'image-multiple',
            unfocusedIcon: 'image'
        },
        {
            key: 'analytics',
            title: 'Analytics',
            focusedIcon: 'chart-line',
            unfocusedIcon: 'chart-line-variant'
        },
        // {
        //     key: 'workouts',
        //     title: 'Workouts',
        //     focusedIcon: 'dumbbell',
        //     unfocusedIcon: 'weight-lifter'
        // },
        {
            key: 'profile',
            title: 'Profile',
            focusedIcon: 'account',
            unfocusedIcon: 'account-outline'
        },
    ];

    // Sync local state with navigation state
    useEffect(() => {
        setActiveTab(currentRouteName);
    }, [currentRouteName]);

    const handleTabPress = (tabKey: string): void => {
        console.log(`Tab pressed: ${tabKey}`);

        // Update local state immediately for responsive UI
        setActiveTab(tabKey);

        try {
            navigation.navigate(tabKey as never);
        } catch (error) {
            console.error(`Navigation error for ${tabKey}:`, error);
            // Revert state if navigation fails
            setActiveTab(currentRouteName);
        }
    };

    return (
        <Surface style={styles.navBar}>
            <View style={styles.navContainer}>
                {navItems.map((item) => {
                    const isActive = activeTab === item.key;
                    return (
                        <TouchableOpacity
                            key={item.key}
                            style={styles.navItem}
                            onPress={() => handleTabPress(item.key)}
                            activeOpacity={0.7}
                        >
                            <View style={styles.iconContainer}>
                                <MaterialCommunityIcons
                                    name={isActive ? item.focusedIcon : item.unfocusedIcon}
                                    size={22}
                                    color={isActive ? '#129990' : '#666'}
                                />
                            </View>
                            <Text
                                style={[
                                    styles.label,
                                    {
                                        color: isActive ? '#129990' : '#666',
                                        fontWeight: isActive ? 'bold' : 'normal'
                                    }
                                ]}
                            >
                                {item.title}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </Surface>
    );
};

const styles = StyleSheet.create({
    navBar: {
        backgroundColor: '#FFFFFF',
        elevation: 8,
        height: hp(7.5), // ~7.5% of screen height
        paddingVertical: responsiveSpacing(4),
    },
    navContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        height: '100%',
    },
    navItem: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: responsiveSpacing(4),
    },
    iconContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        height: responsiveSpacing(28),
    },
    label: {
        fontSize: responsiveFontSize(11),
        textAlign: 'center',
        marginTop: responsiveSpacing(2),
    },
});

export default BottomNavBar;
