import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing } from '../constants/theme';
import { useCart } from '../context/CartContext';

export default function Header({ title, showBack = false, showCart = true }) {
  const nav = useNavigation();
  const { cartCount } = useCart();

  return (
    <View style={s.header}>
      <View style={s.left}>
        {showBack && (
          <TouchableOpacity onPress={() => nav.goBack()} style={s.backBtn}>
            <Text style={s.backArrow}>←</Text>
          </TouchableOpacity>
        )}
        {!showBack && (
          <Text style={s.brand}>BanyanVision</Text>
        )}
        {showBack && title && (
          <Text style={s.title} numberOfLines={1}>{title}</Text>
        )}
      </View>
      {showCart && (
        <TouchableOpacity style={s.cartBtn} onPress={() => nav.navigate('Cart')}>
          <Text style={s.cartIcon}>🛍</Text>
          {cartCount > 0 && (
            <View style={s.badge}>
              <Text style={s.badgeTxt}>{cartCount > 99 ? '99+' : cartCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  header:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.md, paddingVertical: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: Colors.border },
  left:     { flexDirection: 'row', alignItems: 'center', flex: 1 },
  brand:    { fontSize: 20, fontWeight: '800', color: Colors.dark, letterSpacing: 0.3 },
  title:    { fontSize: 17, fontWeight: '700', color: Colors.dark, flex: 1 },
  backBtn:  { marginRight: 10, padding: 4 },
  backArrow:{ fontSize: 22, color: Colors.dark },
  cartBtn:  { position: 'relative', padding: 4 },
  cartIcon: { fontSize: 24 },
  badge:    { position: 'absolute', top: 0, right: 0, backgroundColor: Colors.rose, borderRadius: 10, minWidth: 18, height: 18, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 3 },
  badgeTxt: { color: '#fff', fontSize: 10, fontWeight: '800' },
});
