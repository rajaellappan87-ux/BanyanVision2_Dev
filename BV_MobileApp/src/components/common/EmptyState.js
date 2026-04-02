import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, Radius } from '../../constants/theme';

/**
 * Reusable empty-state card used by Cart, Wishlist, Orders, etc.
 *
 * Props:
 *   icon       {string}   – Emoji icon  (default '🛍️')
 *   title      {string}   – Bold heading
 *   subtitle   {string}   – Secondary text
 *   btnLabel   {string}   – CTA button label  (optional)
 *   onPress    {function} – CTA button handler (optional)
 */
export default function EmptyState({ icon = '🛍️', title, subtitle, btnLabel, onPress }) {
  return (
    <View style={s.container}>
      <Text style={s.icon}>{icon}</Text>
      <Text style={s.title}>{title}</Text>
      {subtitle ? <Text style={s.subtitle}>{subtitle}</Text> : null}
      {btnLabel && onPress ? (
        <TouchableOpacity onPress={onPress} style={s.btnWrap}>
          <LinearGradient colors={Colors.gradRose} style={s.btn}>
            <Text style={s.btnTxt}>{btnLabel}</Text>
          </LinearGradient>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.ivory,
    padding: Spacing.xl,
  },
  icon:     { fontSize: 64, marginBottom: 16 },
  title:    { fontSize: 22, fontWeight: '700', color: Colors.dark, marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 14, color: Colors.muted, textAlign: 'center', marginBottom: 24 },
  btnWrap:  { marginTop: 4 },
  btn:      { borderRadius: Radius.full, paddingVertical: 14, paddingHorizontal: 32 },
  btnTxt:   { color: '#fff', fontSize: 15, fontWeight: '700' },
});
