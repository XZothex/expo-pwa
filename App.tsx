import React from 'react';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';

export default function App() {
  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.card}>
        <Text style={styles.title}>Expo PWA + Firebase</Text>
        <Text style={styles.subtitle}>Checkpoint 1: estrutura inicial do projeto.</Text>
        <Text style={styles.note}>Próximo passo: configurar e validar o PWA.</Text>
      </View>
      <StatusBar style="auto" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f1f5f9', justifyContent: 'center', padding: 24 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 24, maxWidth: 520, width: '100%', alignSelf: 'center' },
  title: { fontSize: 26, fontWeight: '700', color: '#0f172a', marginBottom: 12 },
  subtitle: { fontSize: 16, color: '#334155', marginBottom: 8 },
  note: { fontSize: 14, color: '#64748b' },
});
