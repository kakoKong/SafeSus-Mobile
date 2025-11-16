import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function SubmitScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Ionicons name="add-circle" size={64} color="#667eea" />
        <Text style={styles.title}>Submit Report</Text>
        <Text style={styles.subtitle}>
          Help keep the community safe by reporting incidents
        </Text>
        <Text style={styles.description}>
          This feature will allow you to submit safety reports, incidents, and share your experiences to help other travelers.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
});
