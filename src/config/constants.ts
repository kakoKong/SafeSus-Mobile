import Constants from 'expo-constants';
import { Platform } from 'react-native';

const DEV_API =
  Platform.OS === 'android'
    ? 'https://safesus.app/api' // Android emulator loopback
    : 'https://safesus.app/api'; // iOS simulator/mac loopback
const PROD_FALLBACK_API = 'http://safesus.app/api';

export const config = {
  // Use localhost in development; otherwise prefer configured API or production fallback.
  apiUrl: __DEV__
    ? DEV_API
    : (Constants.expoConfig?.extra?.apiUrl || PROD_FALLBACK_API),
  supabaseUrl: Constants.expoConfig?.extra?.supabaseUrl || '',
  supabaseAnonKey: Constants.expoConfig?.extra?.supabaseAnonKey || '',
};
