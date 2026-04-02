import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, Radius } from '../../constants/theme';

/**
 * Horizontal size-pill selector.
 *
 * Props:
 *   sizes    {string[]} – Available sizes
 *   selected {string}   – Currently selected size
 *   onSelect {function} – Called with the selected size string
 */
export default function SizeSelector({ sizes = [], selected, onSelect }) {
  if (!sizes.length) return null;
  return (
    <View style={s.section}>
      <Text style={s.label}>Size</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.row}>
        {sizes.map(sz => (
          <TouchableOpacity
            key={sz}
            onPress={() => onSelect(sz)}
            style={[s.pill, sz === selected && s.pillActive]}
          >
            <Text style={[s.pillTxt, sz === selected && s.pillTxtActive]}>{sz}</Text>
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
  pill:        { paddingHorizontal: 16, paddingVertical: 8, borderRadius: Radius.md, borderWidth: 2, borderColor: Colors.border, marginRight: 8, backgroundColor: '#fff' },
  pillActive:  { borderColor: Colors.rose, backgroundColor: Colors.ivory2 },
  pillTxt:     { fontSize: 13, fontWeight: '600', color: Colors.text2 },
  pillTxtActive: { color: Colors.rose },
});
