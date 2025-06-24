import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserCredential, User } from '../modelsFrontend'; // Ensure you have firebase-admin installed
import { Component } from 'react';

interface UserSettings {
    waterTarget: string,
    stepsTarget: string
}

const storeAuthToken = async (token: string): Promise<void> => {
    try {
        await AsyncStorage.setItem('authToken', token);
        console.log('Token stored successfully');
    } catch (error) {
        console.error('Error storing token:', error);
        throw error;
    }
};

const storeUserInfo = async (user: User): Promise<void> => {
    try {
        await AsyncStorage.setItem('uid', user.uid);
        await AsyncStorage.setItem('email', user.email!);
        await AsyncStorage.setItem('displayName', user.displayName!);
        await AsyncStorage.setItem('photoURL', user.photoURL || '');
        await AsyncStorage.setItem('waterTarget', user.waterTarget || '8');
        await AsyncStorage.setItem('stepsTarget', user.stepsTarget || '10000');
        console.log('stored user info:', user);
    } catch (error) {
        console.error('Error storing token:', error);
        throw error;
    }
};

const storeUserPhotoURL = async (photoURL: string): Promise<void> => {
    try {
        await AsyncStorage.setItem('photoURL', photoURL || '');
        console.log('stored user info:', photoURL);
        return
    } catch (error) {
        console.error('Error storing token:', error);
        throw error;
    }
}

const storeUserSetting = async (waterTarget: number, stepsTarget: number): Promise<void> => {
    try {
        await AsyncStorage.setItem('waterTarget', waterTarget.toString());
        await AsyncStorage.setItem('stepsTarget', stepsTarget.toString());
    } catch (error) {
        console.error('Error storing token:', error);
        throw error;
    }
};

const getUserSetting = async (): Promise<UserSettings | null> => {
    try {
        const waterTarget = await AsyncStorage.getItem('waterTarget');
        const stepsTarget = await AsyncStorage.getItem('stepsTarget');
        if (waterTarget !== null && stepsTarget !== null) {
            return {
                waterTarget,
                stepsTarget
            };
        }
        return null;
    } catch (error) {
        console.error('Error retrieving user settings:', error);
        throw error;
    }
}
const getAuthToken = async (): Promise<string | null> => {
    try {
        const token = await AsyncStorage.getItem('authToken');
        return token;
    } catch (error) {
        console.error('Error retrieving token:', error);
        throw error;
    }
};

const getUserInfo = async (): Promise<User | null> => {
    try {
        const uid = await AsyncStorage.getItem('uid');
        const email = await AsyncStorage.getItem('email');
        const displayName = await AsyncStorage.getItem('displayName');
        const photoURL = await AsyncStorage.getItem('photoURL');
        const waterTarget = await AsyncStorage.getItem('waterTarget');
        const stepsTarget = await AsyncStorage.getItem('stepsTarget');
        if (uid && email && displayName) {
            return {
                uid,
                email,
                displayName,
                photoURL,
                waterTarget,
                stepsTarget
            } as User;
        }
        return null;
    } catch (error) {
        console.error('Error retrieving token:', error);
        throw error;
    }
};

const removeAuthToken = async (): Promise<void> => {
    try {
        await AsyncStorage.removeItem('authToken');
        console.log('Token removed successfully');
    } catch (error) {
        console.error('Error removing token:', error);
        throw error;
    }
};

export { storeAuthToken, storeUserInfo, getUserInfo, getAuthToken, removeAuthToken, storeUserSetting, getUserSetting, storeUserPhotoURL };