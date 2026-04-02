import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Radius } from '../../constants/theme';

/**
 * Reusable gradient CTA button used across Cart, Checkout, Login, Register, etc.
 *
 * Props:
 *   label      {string}    – Button text
 *   onPress    {function}  – Press handler
 *   colors     {string[]}  – Gradient colours (default: Colors.gradRose)
 *   loading    {boolean}   – Shows spinner when true
 *   disabled   {boolean}   – Disables the button
 *   style      {object}    – Extra style for the gradient container
 *   textStyle  {object}    – Extra style for the label text
 */
export default function GradientButton({
  label,
  onPress,
  colors = Colors.gradRose,
  loading = false,
  disabled = false,
  style,
  textStyle,
}) {
  return (
    <TouchableOpacity onPress={onPress} disabled={disabled || loading} activeOpacity={0.85}>
      <LinearGradient colors={colors} style={[s.btn, style]}>
        {loading
          ? <ActivityIndicator color="#fff" />
          : <Text style={[s.label, textStyle]}>{label}</Text>
        }
      </LinearGradient>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  btn:   { borderRadius: Radius.lg, paddingVertical: 16, alignItems: 'center' },
  label: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
