import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Radius, Spacing, Shadow } from '../../constants/theme';

const ROWS = [
  ['🚚', 'Standard Delivery', '3–5 business days', 'Free above ₹2000'],
  ['⚡', 'Express Delivery',  '1–2 business days', '₹199'],
  ['🔒', 'Secure Payment',    'Razorpay',          'UPI · Cards · EMI'],
];

/**
 * Static delivery & payment info card shown on the product detail page.
 */
export default function DeliveryInfo() {
  return (
    <View style={s.card}>
      {ROWS.map(([icon, title, sub, val]) => (
        <View key={title} style={s.row}>
          <Text style={s.icon}>{icon}</Text>
          <View style={{ flex: 1 }}>
            <Text style={s.title}>{title}</Text>
            <Text style={s.sub}>{sub}</Text>
          </View>
          <Text style={s.val}>{val}</Text>
        </View>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  card:  { backgroundColor: '#fff', borderRadius: Radius.lg, padding: Spacing.md, marginBottom: 18, ...Shadow.sm },
  row:   { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.border },
  icon:  { fontSize: 20, width: 36 },
  title: { fontSize: 13, fontWeight: '700', color: Colors.dark },
  sub:   { fontSize: 11, color: Colors.muted, marginTop: 2 },
  val:   { fontSize: 11, color: Colors.text2, fontWeight: '600', maxWidth: 120, textAlign: 'right' },
});
