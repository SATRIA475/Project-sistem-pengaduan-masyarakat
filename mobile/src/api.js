import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Get host IP dynamically from Expo's Metro server to handle different Wi-Fi networks automatically
const getDevIp = () => {
  const hostUri = Constants.expoConfig?.hostUri || Constants.manifest?.debuggerHost;
  if (hostUri) {
    const ip = hostUri.split(':')[0];
    if (ip && ip !== 'localhost' && ip !== '127.0.0.1') {
      return ip;
    }
  }
  return '192.168.1.9'; // Fallback to current detected LAN IP
};

const DEV_IP = getDevIp();
const API_URL = Platform.OS === 'web' ? 'http://localhost:5000' : `http://${DEV_IP}:5000`; 

console.log(`[API Config] Target API URL: ${API_URL}`);

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export { API_URL };
export default api;
