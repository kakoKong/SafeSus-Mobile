import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import HomeScreen from '../screens/HomeScreen';
import LiveScreen from '../screens/LiveScreen';
import SubmitScreen from '../screens/SubmitScreen';

const Tab = createBottomTabNavigator();

export default function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'Explore') {
            iconName = focused ? 'compass' : 'compass-outline';
          } else if (route.name === 'Live') {
            iconName = focused ? 'location' : 'location-outline';
          } else if (route.name === 'Submit') {
            iconName = focused ? 'add-circle' : 'add-circle-outline';
          } else {
            iconName = 'help-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#667eea',
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#e0e0e0',
          paddingBottom: 30,
          paddingTop: 10,
          height: 90,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="Explore" 
        component={HomeScreen}
        options={{
          title: 'Explore',
        }}
      />
      <Tab.Screen 
        name="Live" 
        component={LiveScreen}
        options={{
          title: 'Live',
        }}
      />
      <Tab.Screen 
        name="Submit" 
        component={SubmitScreen}
        options={{
          title: 'Submit',
        }}
      />
    </Tab.Navigator>
  );
}
