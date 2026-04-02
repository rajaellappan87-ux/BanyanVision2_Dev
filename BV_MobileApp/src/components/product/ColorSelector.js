import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, Radius } from '../../constants/theme';

/**
 * Horizontal colour-pill selector.
 *
 * Props:
 *   colors   {string[]} – Available colour names
 *   selected {string}   – Currently selected colour
 *   onSelect {function} – Called with the selected colour string
 */
export default function ColorSelector({ colors = [], selected, onSelect }) {
  if (!colors.length) return null;
  return (
    <View style={s.section}>
      <Text style={s.label}>Colour</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.row}>
        {colors.map(cl => (
          <TouchableOpacity
            key={cl}
            onPress={() => onSelect(cl)}
            style={[s.pill, cl === selected && s.pillActive]}
          >
            <Text style={[s.pillTxt, cl === selected && s.pillTxtActive]}>{cl}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  section:     { marginBottom: 18 },
  label:       { fontSize: 11, fontWeight: '700', color: Colors.muted, letterSpacing: 0.8, textTransform: 'uppercase' },
  row:         { marginTop: 8 },
  pill:        { paddingHorizontal: 14, paddingVertical: 7, borderRadius: Radius.full, borderWidth: 1.5, borderColor: Colors.border, marginRight: 8, backgroundColor: '#fff' },
  pillActive:  { borderColor: Colors.rose },
  pillTxt:     { fontSize: 12, fontWeight: '600', color: Colors.text2 },
  pillTxtActive: { color: Colors.rose },
});
