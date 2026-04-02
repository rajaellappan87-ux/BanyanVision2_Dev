import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { Colors, Spacing, Radius } from '../../constants/theme';

/**
 * Full-screen prompt shown whenever a screen requires authentication.
 * Navigates to the Auth → Login stack on press.
 *
 * Props:
 *   icon     {string} – Emoji (default '🔒')
 *   message  {string} – Descriptive line below the title
 */
export default function AuthPrompt({ icon = '🔒', message = 'Sign in to continue' }) {
  const nav = useNavigation();
  return (
    <View style={s.container}>
      <Text style={s.icon}>{icon}</Text>
      <Text style={s.title}>Sign In Required</Text>
      <Text style={s.message}>{message}</Text>
      <TouchableOpacity onPress={() => nav.navigate('Auth', { screen: 'Login' })}>
        <LinearGradient colors={Colors.gradRose} style={s.btn}>
          <Text style={s.btnTxt}>Sign In</Text>
        </LinearGradient>
      </TouchableOpacity>
      <TouchableOpacity
        style={s.registerLink}
        onPress={() => nav.navigate('Auth', { screen: 'Register' })}
      >
        <Text style={s.registerTxt}>
          New here? <Text style={{ color: Colors.rose, fontWeight: '700' }}>Create Account</Text>
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  container:    { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.ivory, padding: Spacing.xl },
  icon:         { fontSize: 56, marginBottom: 16 },
  title:        { fontSize: 22, fontWeight: '700', color: Colors.dark, marginBottom: 8 },
  message:      { fontSize: 14, color: Colors.muted, textAlign: 'center', marginBottom: 28 },
  btn:          { borderRadius: Radius.lg, paddingVertical: 14, paddingHorizontal: 40 },
  btnTxt:       { color: '#fff', fontSize: 15, fontWeight: '700' },
  registerLink: { marginTop: 16 },
  registerTxt:  { fontSize: 14, color: Colors.text2 },
});
