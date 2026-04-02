import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { Colors, Radius } from '../../constants/theme';

/**
 * Labelled text input with inline error message.
 * Used in Login, Register, Checkout, and Profile screens.
 *
 * Props:
 *   label        {string}    – Field label (displayed uppercase)
 *   value        {string}    – Controlled value
 *   onChangeText {function}  – Change handler
 *   error        {string}    – Validation error message (empty = no error)
 *   placeholder  {string}
 *   keyboard     {string}    – keyboardType (default 'default')
 *   secure       {boolean}   – secureTextEntry
 *   multiline    {boolean}   – Multiline input
 *   maxLength    {number}
 *   autoCapitalize {string}  – default 'words'
 *   style        {object}    – Extra style for the input
 */
export default function FormField({
  label,
  value,
  onChangeText,
  error = '',
  placeholder = '',
  keyboard = 'default',
  secure = false,
  multiline = false,
  maxLength,
  autoCapitalize,
  style,
}) {
  const capMode = autoCapitalize ?? (keyboard === 'email-address' ? 'none' : 'words');
  return (
    <View style={s.block}>
      <Text style={s.label}>{label}</Text>
      <TextInput
        style={[s.input, multiline && s.multiline, error && s.inputError, style]}
        placeholder={placeholder}
        placeholderTextColor={Colors.muted}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboard}
        secureTextEntry={secure}
        multiline={multiline}
        maxLength={maxLength}
        autoCapitalize={capMode}
        autoCorrect={false}
      />
      {error ? <Text style={s.errorTxt}>{error}</Text> : null}
    </View>
  );
}

const s = StyleSheet.create({
  block:      { marginBottom: 14 },
  label:      { fontSize: 11, fontWeight: '700', color: Colors.muted, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 6 },
  input:      { backgroundColor: '#fff', borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radius.md, paddingHorizontal: 14, height: 48, fontSize: 14, color: Colors.dark },
  multiline:  { height: 80, paddingTop: 12, textAlignVertical: 'top' },
  inputError: { borderColor: Colors.error },
  errorTxt:   { fontSize: 11, color: Colors.error, marginTop: 4, fontWeight: '600' },
});
