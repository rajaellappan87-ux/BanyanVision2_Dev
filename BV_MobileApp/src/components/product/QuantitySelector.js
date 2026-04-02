import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, Radius } from '../../constants/theme';

/**
 * ± quantity stepper with stock indicator.
 *
 * Props:
 *   qty      {number}   – Current quantity
 *   stock    {number}   – Available stock (caps the max)
 *   onChange {function} – Called with the new quantity
 */
export default function QuantitySelector({ qty, stock = 10, onChange }) {
  return (
    <View style={s.section}>
      <Text style={s.label}>Quantity</Text>
      <View style={s.row}>
        <TouchableOpacity
          style={s.btn}
          onPress={() => onChange(Math.max(1, qty - 1))}
        >
          <Text style={s.btnTxt}>−</Text>
        </TouchableOpacity>
        <Text style={s.val}>{qty}</Text>
        <TouchableOpacity
          style={s.btn}
          onPress={() => onChange(Math.min(qty + 1, stock || 10))}
        >
          <Text style={s.btnTxt}>+</Text>
        </TouchableOpacity>
        <Text style={s.stockTxt}>{stock} in stock</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  section:  { marginBottom: 18 },
  label:    { fontSize: 11, fontWeight: '700', color: Colors.muted, letterSpacing: 0.8, textTransform: 'uppercase' },
  row:      { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 8 },
  btn:      { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.ivory2, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  btnTxt:   { fontSize: 20, color: Colors.dark, lineHeight: 22 },
  val:      { fontSize: 18, fontWeight: '700', color: Colors.dark, minWidth: 28, textAlign: 'center' },
  stockTxt: { fontSize: 12, color: Colors.success, fontWeight: '600' },
});
