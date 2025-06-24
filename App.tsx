import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import LoginScreen from './screens/LoginScreen'; // Import your LoginScreen component
import RegisterScreen from './screens/RegisterScreen';
import HomeScreen from './screens/HomeScreen';
import ProfileScreen from './screens/ProfileScreen';
import PhotosScreen from './screens/PhotosScreen';
import AnalyticsScreen from './screens/AnalyticsScreen';
// You can customize your theme here

const Stack = createStackNavigator();


export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login" id="main-navigator">
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="home" component={HomeScreen} options={{
          headerLeft: () => null,
        }} />
        <Stack.Screen name="profile" component={ProfileScreen} options={{
          headerLeft: () => null,
        }} />
        <Stack.Screen name="photos" component={PhotosScreen} options={{
          headerLeft: () => null,
        }} />
        <Stack.Screen name="analytics" component={AnalyticsScreen} options={{
          headerLeft: () => null,
        }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
