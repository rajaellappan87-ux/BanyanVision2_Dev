import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, KeyboardAvoidingView, Platform, TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';

import { Colors, Spacing, Radius } from '../constants/theme';
import { validateEmail } from '../utils/validation';
import { useAuth } from '../context/AuthContext';
import FormField      from '../components/common/FormField';
import GradientButton from '../components/common/GradientButton';

const TRUST_ITEMS = [
  ['🤝', 'Handcrafted',     'Verified Indian artisans'],
  ['🔒', 'Secure Payments', 'Razorpay · UPI · Cards · EMI'],
  ['🚚', 'Fast Delivery',   '3–5 business days'],
];

export default function LoginScreen() {
  const nav        = useNavigation();
  const { login }  = useAuth();

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPwd,  setShowPwd]  = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [errors,   setErrors]   = useState({});

  const validate = () => {
    const e = {
      email:    validateEmail(email),
      password: password.trim() ? '' : 'Password is required',
    };
    setErrors(e);
    return !e.email && !e.password;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await login(email.trim().toLowerCase(), password);
      nav.goBack();
    } catch (err) {
      setErrors({ general: err.response?.data?.message || 'Login failed. Please try again.' });
    }
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView
        style={s.container}
        contentContainerStyle={s.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient colors={Colors.gradDark} style={s.header}>
          <Text style={s.brand}>BanyanVision</Text>
          <Text style={s.tagline}>Empowering Dreams, Inspiring Innovations</Text>
        </LinearGradient>

        <View style={s.form}>
          <Text style={s.title}>Welcome Back</Text>
          <Text style={s.sub}>Sign in to your account</Text>

          {errors.general ? (
            <View style={s.errorBanner}>
              <Text style={s.errorBannerTxt}>{errors.general}</Text>
            </View>
          ) : null}

          <FormField
            label="Email"
            placeholder="your@email.com"
            value={email}
            onChangeText={v => { setEmail(v); setErrors(e => ({ ...e, email: '' })); }}
            keyboard="email-address"
            error={errors.email}
          />

          {/* Password field with show/hide toggle */}
          <View style={s.fieldBlock}>
            <Text style={s.fieldLabel}>Password</Text>
            <View style={[s.pwdRow, errors.password && s.pwdRowErr]}>
              <TextInput
                style={s.pwdInput}
                placeholder="Enter your password"
                placeholderTextColor={Colors.muted}
                value={password}
                onChangeText={v => { setPassword(v); setErrors(e => ({ ...e, password: '' })); }}
                secureTextEntry={!showPwd}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity style={s.eyeBtn} onPress={() => setShowPwd(v => !v)}>
                <Text style={{ fontSize: 18 }}>{showPwd ? '🙈' : '👁️'}</Text>
              </TouchableOpacity>
            </View>
            {errors.password ? <Text style={s.errTxt}>{errors.password}</Text> : null}
          </View>

          <GradientButton
            label="Sign In"
            onPress={handleLogin}
            loading={loading}
            style={s.loginBtn}
          />

          <View style={s.divider}>
            <View style={s.dividerLine} />
            <Text style={s.dividerTxt}>or</Text>
            <View style={s.dividerLine} />
          </View>

          <TouchableOpacity style={s.registerLink} onPress={() => nav.navigate('Register')}>
            <Text style={s.registerTxt}>
              New to BanyanVision?{' '}
              <Text style={{ color: Colors.rose, fontWeight: '700' }}>Create Account</Text>
            </Text>
          </TouchableOpacity>

          <View style={s.trustBox}>
            {TRUST_ITEMS.map(([icon, title, desc]) => (
              <View key={title} style={s.trustItem}>
                <Text style={s.trustIcon}>{icon}</Text>
                <View>
                  <Text style={s.trustTitle}>{title}</Text>
                  <Text style={s.trustDesc}>{desc}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container:     { flex: 1, backgroundColor: Colors.ivory },
  content:       { paddingBottom: 40 },
  header:        { padding: Spacing.xl, paddingTop: 60, alignItems: 'center' },
  brand:         { fontSize: 32, fontWeight: '800', color: '#fff', letterSpacing: 0.5, marginBottom: 6 },
  tagline:       { fontSize: 12, color: 'rgba(255,255,255,0.65)', letterSpacing: 1.5, textTransform: 'uppercase' },
  form:          { padding: Spacing.xl },
  title:         { fontSize: 26, fontWeight: '700', color: Colors.dark, marginBottom: 4 },
  sub:           { fontSize: 14, color: Colors.muted, marginBottom: 24 },
  errorBanner:   { backgroundColor: '#FEF2F2', borderRadius: Radius.md, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: '#FECACA' },
  errorBannerTxt:{ color: Colors.error, fontSize: 13, fontWeight: '600', textAlign: 'center' },
  fieldBlock:    { marginBottom: 14 },
  fieldLabel:    { fontSize: 11, fontWeight: '700', color: Colors.muted, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 6 },
  pwdRow:        { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radius.md, height: 50 },
  pwdRowErr:     { borderColor: Colors.error },
  pwdInput:      { flex: 1, height: 50, paddingHorizontal: 14, fontSize: 14, color: Colors.dark },
  eyeBtn:        { padding: 12 },
  errTxt:        { fontSize: 11, color: Colors.error, marginTop: 4, fontWeight: '600' },
  loginBtn:      { marginTop: Spacing.md },
  divider:       { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  dividerLine:   { flex: 1, height: 1, backgroundColor: Colors.border },
  dividerTxt:    { marginHorizontal: 12, color: Colors.muted, fontSize: 13 },
  registerLink:  { alignItems: 'center', paddingVertical: 8 },
  registerTxt:   { fontSize: 14, color: Colors.text2 },
  trustBox:      { marginTop: 28, backgroundColor: Colors.ivory2, borderRadius: Radius.lg, padding: Spacing.md, gap: 12 },
  trustItem:     { flexDirection: 'row', alignItems: 'center', gap: 12 },
  trustIcon:     { fontSize: 22 },
  trustTitle:    { fontSize: 13, fontWeight: '700', color: Colors.dark },
  trustDesc:     { fontSize: 11, color: Colors.muted },
});
