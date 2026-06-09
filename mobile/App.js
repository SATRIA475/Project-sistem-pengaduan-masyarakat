import 'react-native-gesture-handler';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import LandingScreen from './src/screens/LandingScreen';
import MapScreen from './src/screens/MapScreen';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import ForgotPasswordScreen from './src/screens/ForgotPasswordScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import HomeScreen from './src/screens/HomeScreen';
import CreateComplaintScreen from './src/screens/CreateComplaintScreen';
import DetailScreen from './src/screens/DetailScreen';

import AdminHomeScreen from './src/screens/AdminHomeScreen';

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Landing">
        <Stack.Screen name="Landing" component={LandingScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Map" component={MapScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Register" component={RegisterScreen} options={{ headerShown: false }} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Onboarding" component={OnboardingScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
        <Stack.Screen name="AdminHome" component={AdminHomeScreen} options={{ headerShown: false }} />
        <Stack.Screen name="CreateComplaint" component={CreateComplaintScreen} options={{ title: 'Buat Laporan', headerStyle: { backgroundColor: '#5B6E53' }, headerTintColor: '#fff' }} />
        <Stack.Screen name="Detail" component={DetailScreen} options={{ title: 'Detail Laporan', headerStyle: { backgroundColor: '#5B6E53' }, headerTintColor: '#fff' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
