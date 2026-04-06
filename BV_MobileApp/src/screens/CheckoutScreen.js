import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import RazorpayCheckout from 'react-native-razorpay';

import { Colors, Spacing, Radius } from '../constants/theme';
import { fmt, getImageUrl } from '../utils/helpers';
import { validateAddress, hasNoErrors } from '../utils/validation';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { apiCreatePayment, apiCreateOrder, apiUpdateProfile } from '../api';

import StepIndicator  from '../components/checkout/StepIndicator';
import AddressSummary from '../components/checkout/AddressSummary';
import PriceSummary   from '../components/checkout/PriceSummary';
import FormField      from '../components/common/FormField';

const STEPS = ['Delivery', 'Payment'];

const ADDRESS_FIELDS = [
  { key: 'name',         label: 'Full Name',                          placeholder: 'As on government ID',       keyboard: 'default' },
  { key: 'email',        label: 'Email',                              placeholder: 'your@email.com',            keyboard: 'email-address' },
  { key: 'phone',        label: 'Phone Number',                       placeholder: '10-digit mobile number',    keyboard: 'phone-pad' },
  { key: 'addressLine1', label: 'Address Line 1',                     placeholder: 'House No., Street, Area',   keyboard: 'default' },
  { key: 'addressLine2', label: 'Address Line 2 (Landmark / Flat No.)', placeholder: 'Optional',               keyboard: 'default', optional: true },
  { key: 'city',         label: 'City',                               placeholder: 'City',                      keyboard: 'default' },
  { key: 'state',        label: 'State',                              placeholder: 'State',                     keyboard: 'default' },
  { key: 'pin',          label: 'PIN Code',                           placeholder: '6-digit PIN',               keyboard: 'numeric', maxLength: 6 },
];

export default function CheckoutScreen() {
  const nav  = useNavigation();
  const { user } = useAuth();
  const {
    cart, subtotal, discountAmt, shipping, total,
    couponCode, clearCart,
  } = useCart();

  const [step,       setStep]       = useState(1);
  const [processing, setProcessing] = useState(false);
  const [form, setForm] = useState({
    name:         user?.name         || '',
    email:        user?.email        || '',
    phone:        user?.phone        || '',
    addressLine1: user?.addressLine1 || '',
    addressLine2: user?.addressLine2 || '',
    city:         user?.city         || '',
    state:        user?.state        || '',
    pin:          user?.pin          || '',
  });
  const [errors, setErrors] = useState({});

  const setVal = (key, value) => {
    setForm(f => ({ ...f, [key]: value }));
    if (errors[key]) setErrors(e => ({ ...e, [key]: '' }));
  };

  const validateStep1 = async () => {
    const errs = validateAddress(form);
    setErrors(errs);
    if (!hasNoErrors(errs)) return false;
    // Silently save address to profile for next-time pre-fill
    try {
      await apiUpdateProfile({
        name: form.name, phone: form.phone,
        addressLine1: form.addressLine1, addressLine2: form.addressLine2,
        city: form.city, state: form.state, pin: form.pin,
      });
    } catch (_) {}
    return true;
  };

  const pay = async () => {
    setProcessing(true);
    try {
      const pr = await apiCreatePayment({ total });
      const { orderId, amount, currency, keyId } = pr.data;

      const options = {
        description: 'BanyanVision — Handcrafted Indian Fashion',
        image:       'https://www.banyanvision.com/bv.jpg',
        currency,
        key:         keyId,
        amount:      String(amount),
        order_id:    orderId,
        name:        'BanyanVision',
        prefill:     { email: form.email, contact: form.phone, name: form.name },
        theme:       { color: '#C2185B' },
      };

      RazorpayCheckout.open(options)
        .then(async rzpData => {
          const or = await apiCreateOrder({
            items: cart.map(i => ({
              product:  i._id,
              name:     i.name,
              image:    getImageUrl(i) || '',
              price:    i.price,
              qty:      i.qty,
              size:     i.size,
              color:    i.color,
              category: i.category,
            })),
            shippingAddress: {
              fullName: form.name,
              phone:    form.phone,
              address:  [form.addressLine1, form.addressLine2].filter(Boolean).join(', '),
              city:     form.city,
              state:    form.state,
              pin:      form.pin,
            },
            subtotal,
            discount:         discountAmt,
            shipping,
            total,
            coupon:           couponCode || null,
            paymentId:        rzpData.razorpay_payment_id,
            paymentOrderId:   rzpData.razorpay_order_id,
            paymentSignature: rzpData.razorpay_signature,
          });
          clearCart();
          nav.replace('OrderSuccess', { orderId: or.data.order._id });
        })
        .catch(err => {
          if (err.code !== 0) {
            Alert.alert('Payment Failed', err.description || 'Payment was not completed');
          }
          setProcessing(false);
        });

    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Something went wrong');
      setProcessing(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.ivory }}>
      <ScrollView contentContainerStyle={{ padding: Spacing.md, paddingBottom: 120 }}>

        <StepIndicator steps={STEPS} current={step} />

        {step === 1 ? (
          <>
            <Text style={s.sectionTitle}>Delivery Address</Text>
            {ADDRESS_FIELDS.map(f => (
              <FormField
                key={f.key}
                label={f.label}
                placeholder={f.placeholder}
                value={form[f.key]}
                onChangeText={v => setVal(f.key, v)}
                keyboard={f.keyboard}
                multiline={f.multiline}
                maxLength={f.maxLength}
                error={errors[f.key]}
              />
            ))}
          </>
        ) : (
          <>
            <AddressSummary form={form} onEdit={() => setStep(1)} />

            {/* Order items */}
            <View style={s.itemsCard}>
              <Text style={s.itemsTitle}>Your Order ({cart.length} items)</Text>
              {cart.map(item => (
                <View key={`${item._id}-${item.size}`} style={s.orderItem}>
                  <Text style={s.orderItemName} numberOfLines={1}>{item.name}</Text>
                  <Text style={s.orderItemMeta}>{[item.size, item.color].filter(Boolean).join(' · ')} × {item.qty}</Text>
                  <Text style={s.orderItemPrice}>{fmt(item.price * item.qty)}</Text>
                </View>
              ))}
            </View>

            <PriceSummary
              subtotal={subtotal}
              discountAmt={discountAmt}
              shipping={shipping}
              total={total}
              savingLabel="Saving"
            />

            <Text style={s.secureNote}>🔒 Your payment is secured by Razorpay · UPI · Cards · EMI · NetBanking</Text>
          </>
        )}
      </ScrollView>

      {/* Bottom CTA */}
      <View style={s.footer}>
        {step === 2 && (
          <TouchableOpacity style={s.backBtn} onPress={() => setStep(1)}>
            <Text style={s.backBtnTxt}>← Back</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          onPress={() => step === 1 ? validateStep1().then(ok => ok && setStep(2)) : pay()}
          disabled={processing}
          style={{ flex: 1 }}
        >
          <LinearGradient
            colors={step === 2 ? ['#1565C0', '#1976D2'] : Colors.gradRose}
            style={s.ctaBtn}
          >
            {processing
              ? <ActivityIndicator color="#fff" />
              : <Text style={s.ctaTxt}>{step === 1 ? 'Continue →' : `Pay ${fmt(total)} via Razorpay`}</Text>
            }
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  sectionTitle: { fontSize: 18, fontWeight: '700', color: Colors.dark, marginBottom: 14 },
  itemsCard:    { backgroundColor: '#fff', borderRadius: Radius.lg, padding: Spacing.md, marginBottom: 12 },
  itemsTitle:   { fontSize: 14, fontWeight: '700', color: Colors.dark, marginBottom: 10 },
  orderItem:    { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.border },
  orderItemName:{ flex: 1, fontSize: 13, color: Colors.dark, fontWeight: '600' },
  orderItemMeta:{ fontSize: 11, color: Colors.muted, marginHorizontal: 8 },
  orderItemPrice:{ fontSize: 13, fontWeight: '700', color: Colors.rose },
  secureNote:   { fontSize: 11, color: Colors.muted, textAlign: 'center', lineHeight: 18 },
  footer:       { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', backgroundColor: '#fff', padding: Spacing.md, paddingBottom: 28, gap: 10, borderTopWidth: 1, borderTopColor: Colors.border },
  backBtn:      { borderWidth: 1.5, borderColor: Colors.border2, borderRadius: Radius.lg, paddingVertical: 14, paddingHorizontal: 20, justifyContent: 'center' },
  backBtnTxt:   { color: Colors.muted, fontSize: 14, fontWeight: '600' },
  ctaBtn:       { borderRadius: Radius.lg, paddingVertical: 16, alignItems: 'center' },
  ctaTxt:       { color: '#fff', fontSize: 15, fontWeight: '700' },
});
