import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  TextInput, StyleSheet, Alert, ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';

import { Colors, Spacing, Radius, Shadow } from '../constants/theme';
import { fmt } from '../utils/helpers';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { apiValidateCoupon } from '../api';

import EmptyState   from '../components/common/EmptyState';
import PriceSummary from '../components/checkout/PriceSummary';

export default function CartScreen() {
  const nav = useNavigation();
  const { user } = useAuth();
  const {
    cart, updateCart, removeFromCart,
    subtotal, discountAmt, shipping, total,
    couponCode, setCouponCode, couponInfo, setCouponInfo,
    freeShippingAbove,
  } = useCart();

  const [couponInput,   setCouponInput]   = useState(couponCode || '');
  const [couponMsg,     setCouponMsg]     = useState('');
  const [couponLoading, setCouponLoading] = useState(false);

  const applyCoupon = async () => {
    if (!couponInput.trim()) return;
    setCouponLoading(true);
    setCouponMsg('');
    try {
      const r = await apiValidateCoupon(couponInput.trim().toUpperCase());
      setCouponInfo(r.data.coupon);
      setCouponCode(couponInput.trim().toUpperCase());
      setCouponMsg('✓ Coupon applied!');
    } catch (e) {
      setCouponMsg(e.response?.data?.message || 'Invalid coupon');
      setCouponInfo(null);
      setCouponCode('');
    }
    setCouponLoading(false);
  };

  const removeCoupon = () => {
    setCouponInfo(null);
    setCouponCode('');
    setCouponInput('');
    setCouponMsg('');
  };

  const needMore = freeShippingAbove > 0 && shipping > 0
    ? freeShippingAbove - (subtotal - discountAmt)
    : 0;

  if (cart.length === 0) {
    return (
      <EmptyState
        icon="🛍️"
        title="Your bag is empty"
        subtitle="Add some beautiful Indian wear to your bag"
        btnLabel="Browse Collections"
        onPress={() => nav.navigate('Shop')}
      />
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: Colors.ivory }}>
      <ScrollView contentContainerStyle={{ padding: Spacing.md, paddingBottom: 160 }}>

        {/* Free shipping nudge */}
        {needMore > 0 && (
          <View style={s.nudge}>
            <Text style={s.nudgeTxt}>
              Add <Text style={s.nudgeAmt}>{fmt(needMore)}</Text> more for FREE delivery
            </Text>
          </View>
        )}

        {/* Cart items */}
        {cart.map(item => (
          <View key={`${item._id}-${item.size}-${item.color}`} style={s.itemCard}>
            <Image
              source={{ uri: item.images?.[0]?.url || item.images?.[0] || item.image || '' }}
              style={s.itemImg}
              contentFit="contain"
            />
            <View style={s.itemInfo}>
              <Text style={s.itemName} numberOfLines={2}>{item.name}</Text>
              <Text style={s.itemMeta}>{[item.size, item.color].filter(Boolean).join(' · ')}</Text>
              <Text style={s.itemPrice}>{fmt(item.price)}</Text>
              <View style={s.qtyRow}>
                <TouchableOpacity
                  style={s.qtyBtn}
                  onPress={() => updateCart(item._id, item.qty - 1, item.size, item.color)}
                >
                  <Text style={s.qtyBtnTxt}>−</Text>
                </TouchableOpacity>
                <Text style={s.qtyVal}>{item.qty}</Text>
                <TouchableOpacity
                  style={s.qtyBtn}
                  onPress={() => updateCart(item._id, item.qty + 1, item.size, item.color)}
                >
                  <Text style={s.qtyBtnTxt}>+</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={s.removeBtn}
                  onPress={() => Alert.alert('Remove item?', item.name, [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Remove', style: 'destructive', onPress: () => removeFromCart(item._id, item.size, item.color) },
                  ])}
                >
                  <Text style={s.removeTxt}>Remove</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}

        {/* Coupon */}
        <View style={s.couponCard}>
          <Text style={s.couponLabel}>🏷 Coupon Code</Text>
          {couponInfo ? (
            <View style={s.couponApplied}>
              <Text style={s.couponAppliedTxt}>✓ {couponInfo.desc}</Text>
              <TouchableOpacity onPress={removeCoupon}>
                <Text style={s.couponRemove}>Remove</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={s.couponRow}>
              <TextInput
                style={s.couponInput}
                placeholder="Enter coupon code"
                placeholderTextColor={Colors.muted}
                value={couponInput}
                onChangeText={t => setCouponInput(t.toUpperCase())}
                autoCapitalize="characters"
              />
              <TouchableOpacity style={s.applyBtn} onPress={applyCoupon} disabled={couponLoading}>
                {couponLoading
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <Text style={s.applyBtnTxt}>Apply</Text>
                }
              </TouchableOpacity>
            </View>
          )}
          {couponMsg ? (
            <Text style={[s.couponMsg, { color: couponInfo ? Colors.success : Colors.error }]}>
              {couponMsg}
            </Text>
          ) : null}
          {!couponInfo && (
            <Text style={s.couponHint}>Try: BANYAN10 · WELCOME20 · FLAT500</Text>
          )}
        </View>

        <PriceSummary
          subtotal={subtotal}
          discountAmt={discountAmt}
          shipping={shipping}
          total={total}
          title="Price Details"
          savingLabel="Coupon Saving"
        />

        <Text style={s.secureTxt}>🔒 Secure checkout powered by Razorpay</Text>
      </ScrollView>

      {/* Checkout footer */}
      <View style={s.footer}>
        <View>
          <Text style={s.footerTotal}>{fmt(total)}</Text>
          <Text style={s.footerItems}>{cart.length} item{cart.length > 1 ? 's' : ''}</Text>
        </View>
        <TouchableOpacity
          onPress={() => {
            if (!user) { nav.navigate('Auth', { screen: 'Login' }); return; }
            nav.navigate('Checkout');
          }}
        >
          <LinearGradient colors={Colors.gradRose} style={s.checkoutBtn}>
            <Text style={s.checkoutBtnTxt}>Proceed to Checkout →</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  nudge:          { backgroundColor: '#FEF3C7', borderRadius: Radius.md, padding: 12, marginBottom: 12 },
  nudgeTxt:       { fontSize: 13, color: '#92400E', textAlign: 'center' },
  nudgeAmt:       { color: Colors.rose, fontWeight: '700' },
  itemCard:       { flexDirection: 'row', backgroundColor: '#fff', borderRadius: Radius.lg, padding: 12, marginBottom: 10, gap: 12, ...Shadow.sm },
  itemImg:        { width: 80, height: 100, borderRadius: Radius.md, backgroundColor: Colors.ivory2 },
  itemInfo:       { flex: 1 },
  itemName:       { fontSize: 14, fontWeight: '700', color: Colors.dark, marginBottom: 4, lineHeight: 20 },
  itemMeta:       { fontSize: 11, color: Colors.muted, marginBottom: 4 },
  itemPrice:      { fontSize: 16, fontWeight: '800', color: Colors.rose, marginBottom: 8 },
  qtyRow:         { flexDirection: 'row', alignItems: 'center', gap: 10 },
  qtyBtn:         { width: 30, height: 30, borderRadius: 15, backgroundColor: Colors.ivory2, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  qtyBtnTxt:      { fontSize: 18, color: Colors.dark, lineHeight: 20 },
  qtyVal:         { fontSize: 15, fontWeight: '700', color: Colors.dark, minWidth: 22, textAlign: 'center' },
  removeBtn:      { marginLeft: 'auto' },
  removeTxt:      { fontSize: 12, color: Colors.error, fontWeight: '600' },
  couponCard:     { backgroundColor: '#fff', borderRadius: Radius.lg, padding: Spacing.md, marginBottom: 10, ...Shadow.sm },
  couponLabel:    { fontSize: 13, fontWeight: '700', color: Colors.dark, marginBottom: 10 },
  couponRow:      { flexDirection: 'row', gap: 10 },
  couponInput:    { flex: 1, height: 44, borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radius.md, paddingHorizontal: 12, fontSize: 14, color: Colors.dark, fontFamily: 'monospace', fontWeight: '700', letterSpacing: 1 },
  applyBtn:       { backgroundColor: Colors.rose, borderRadius: Radius.md, paddingHorizontal: 18, justifyContent: 'center', alignItems: 'center' },
  applyBtnTxt:    { color: '#fff', fontWeight: '700', fontSize: 13 },
  couponApplied:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F0FDF4', borderRadius: Radius.md, padding: 12 },
  couponAppliedTxt:{ fontSize: 13, color: Colors.success, fontWeight: '700' },
  couponRemove:   { fontSize: 12, color: Colors.error, fontWeight: '600' },
  couponMsg:      { fontSize: 12, marginTop: 6, fontWeight: '600' },
  couponHint:     { fontSize: 11, color: Colors.muted, marginTop: 8, fontFamily: 'monospace', letterSpacing: 0.5 },
  secureTxt:      { textAlign: 'center', fontSize: 12, color: Colors.muted, marginTop: 4 },
  footer:         { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.border, paddingBottom: 28 },
  footerTotal:    { fontSize: 20, fontWeight: '800', color: Colors.dark },
  footerItems:    { fontSize: 11, color: Colors.muted },
  checkoutBtn:    { borderRadius: Radius.lg, paddingVertical: 14, paddingHorizontal: 24 },
  checkoutBtnTxt: { color: '#fff', fontSize: 14, fontWeight: '700' },
});
