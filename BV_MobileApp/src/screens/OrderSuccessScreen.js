import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Colors, Spacing, Radius } from '../constants/theme';

export default function OrderSuccessScreen() {
  const nav   = useNavigation();
  const route = useRoute();
  const orderId = route.params?.orderId || '';
  const shortId = orderId.toString().slice(-8).toUpperCase();

  return (
    <View style={s.container}>
      <LinearGradient colors={['#F0FDF4', '#DCFCE7']} style={s.card}>
        <Text style={s.icon}>🎉</Text>
        <Text style={s.title}>Order Placed!</Text>
        <Text style={s.sub}>Thank you for shopping with BanyanVision</Text>
        <View style={s.idBox}>
          <Text style={s.idLabel}>Order ID</Text>
          <Text style={s.idVal}>#{shortId}</Text>
        </View>
        <Text style={s.note}>
          You will receive a confirmation email shortly.{'\n'}
          Your order will be delivered in 3–5 business days.
        </Text>
      </LinearGradient>

      <View style={s.actions}>
        <TouchableOpacity style={s.ordersBtn} onPress={() => nav.navigate('Orders')}>
          <Text style={s.ordersBtnTxt}>View My Orders</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => nav.navigate('Home')}>
          <LinearGradient colors={Colors.gradRose} style={s.homeBtn}>
            <Text style={s.homeBtnTxt}>Continue Shopping</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container:  { flex: 1, backgroundColor: Colors.ivory, justifyContent: 'center', padding: Spacing.xl },
  card:       { borderRadius: 24, padding: Spacing.xl, alignItems: 'center', marginBottom: Spacing.xl },
  icon:       { fontSize: 64, marginBottom: 16 },
  title:      { fontSize: 30, fontWeight: '800', color: '#166534', marginBottom: 8 },
  sub:        { fontSize: 15, color: '#15803D', textAlign: 'center', marginBottom: 24, lineHeight: 22 },
  idBox:      { backgroundColor: '#fff', borderRadius: Radius.lg, paddingVertical: 14, paddingHorizontal: 28, alignItems: 'center', marginBottom: 16, width: '100%' },
  idLabel:    { fontSize: 11, color: Colors.muted, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 },
  idVal:      { fontSize: 22, fontWeight: '800', color: Colors.dark, fontFamily: 'monospace', letterSpacing: 2 },
  note:       { fontSize: 13, color: '#15803D', textAlign: 'center', lineHeight: 20 },
  actions:    { gap: 12 },
  ordersBtn:  { borderWidth: 2, borderColor: Colors.rose, borderRadius: Radius.lg, paddingVertical: 14, alignItems: 'center' },
  ordersBtnTxt: { color: Colors.rose, fontSize: 15, fontWeight: '700' },
  homeBtn:    { borderRadius: Radius.lg, paddingVertical: 14, alignItems: 'center' },
  homeBtnTxt: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
