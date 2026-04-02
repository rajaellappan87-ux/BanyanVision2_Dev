import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, Radius, Spacing, Shadow } from '../../constants/theme';

/**
 * Read-only address summary card shown in checkout step 2.
 *
 * Props:
 *   form    { name, phone, address, city, state, pin }
 *   onEdit  {function} – Called when user taps "Change"
 */
export default function AddressSummary({ form, onEdit }) {
  return (
    <View style={s.card}>
      <Text style={s.title}>📍 Delivering to</Text>
      <Text style={s.name}>{form.name}</Text>
      <Text style={s.text}>{form.address}</Text>
      <Text style={s.text}>{form.city}, {form.state} — {form.pin}</Text>
      <Text style={s.text}>📱 {form.phone}</Text>
      <TouchableOpacity onPress={onEdit} style={s.changeBtn}>
        <Text style={s.changeTxt}>Change</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  card:      { backgroundColor: '#fff', borderRadius: Radius.lg, padding: Spacing.md, marginBottom: 12, ...Shadow.sm },
  title:     { fontSize: 12, fontWeight: '700', color: Colors.muted, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 8 },
  name:      { fontSize: 15, fontWeight: '700', color: Colors.dark, marginBottom: 4 },
  text:      { fontSize: 13, color: Colors.text2, lineHeight: 20 },
  changeBtn: { marginTop: 10, alignSelf: 'flex-start' },
  changeTxt: { fontSize: 13, color: Colors.rose, fontWeight: '700' },
});
