import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Radius, Spacing, Shadow } from '../../constants/theme';
import { fmt } from '../../utils/helpers';

/**
 * Price breakdown card shared by CartScreen and CheckoutScreen.
 *
 * Props:
 *   subtotal    {number}
 *   discountAmt {number}
 *   shipping    {number}  – 0 = FREE
 *   total       {number}
 *   title       {string}  – Card heading (default 'Price Details')
 *   savingLabel {string}  – Row label for discount (default 'Saving')
 */
export default function PriceSummary({
  subtotal,
  discountAmt,
  shipping,
  total,
  title = 'Price Details',
  savingLabel = 'Saving',
}) {
  const rows = [
    ['Subtotal', fmt(subtotal), false],
    discountAmt > 0 ? [savingLabel, `−${fmt(discountAmt)}`, true] : null,
    ['Delivery', shipping === 0 ? 'FREE ✓' : fmt(shipping), shipping === 0],
  ].filter(Boolean);

  return (
    <View style={s.card}>
      <Text style={s.heading}>{title}</Text>
      {rows.map(([key, val, green]) => (
        <View key={key} style={s.row}>
          <Text style={s.key}>{key}</Text>
          <Text style={[s.val, green && { color: Colors.success }]}>{val}</Text>
        </View>
      ))}
      <View style={s.totalRow}>
        <Text style={s.totalKey}>Total</Text>
        <Text style={s.totalVal}>{fmt(total)}</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  card:     { backgroundColor: '#fff', borderRadius: Radius.lg, padding: Spacing.md, marginBottom: 12, ...Shadow.sm },
  heading:  { fontSize: 15, fontWeight: '700', color: Colors.dark, marginBottom: 12 },
  row:      { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  key:      { fontSize: 13, color: Colors.text2 },
  val:      { fontSize: 13, fontWeight: '600', color: Colors.dark },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1.5, borderTopColor: Colors.border2, paddingTop: 12, marginTop: 4 },
  totalKey: { fontSize: 16, fontWeight: '700', color: Colors.dark },
  totalVal: { fontSize: 20, fontWeight: '800', color: Colors.rose },
});
