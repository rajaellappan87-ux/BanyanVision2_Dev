import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { Colors, Spacing, Radius } from '../constants/theme';
import { useAuth } from '../context/AuthContext';

export default function RegisterScreen() {
  const nav = useNavigation();
  const { register } = useAuth();

  const [form,    setForm]    = useState({ name: '', email: '', password: '', confirm: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors,  setErrors]  = useState({});

  const setVal = (k, v) => {
    setForm(f => ({ ...f, [k]: v }));
    setErrors(e => ({ ...e, [k]: '', general: '' }));
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim())     e.name     = 'Full Name is required';
    if (!form.email.trim())    e.email    = 'Email is required';
    else if (!/^[^@]+@[^@]+\.[^@]+$/.test(form.email)) e.email = 'Enter a valid email';
    if (!form.password.trim()) e.password = 'Password is required';
    else if (form.password.length < 6) e.password = 'Minimum 6 characters';
    if (form.password !== form.confirm)  e.confirm  = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await register(form.name.trim(), form.email.trim().toLowerCase(), form.password);
      nav.goBack();
    } catch (err) {
      setErrors({ general: err.response?.data?.message || 'Registration failed. Please try again.' });
    }
    setLoading(false);
  };

  const FIELDS = [
    { key: 'name',     label: 'Full Name',       placeholder: 'Your full name',         keyboard: 'default',       secure: false },
    { key: 'email',    label: 'Email',             placeholder: 'your@email.com',         keyboard: 'email-address', secure: false },
    { key: 'password', label: 'Password',          placeholder: 'Minimum 6 characters',   keyboard: 'default',       secure: true  },
    { key: 'confirm',  label: 'Confirm Password',  placeholder: 'Re-enter your password', keyboard: 'default',       secure: true  },
  ];

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView
        style={s.container}
        contentContainerStyle={s.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <LinearGradient colors={Colors.gradDark} style={s.header}>
          <Text style={s.brand}>BanyanVision</Text>
          <Text style={s.tagline}>Create your account</Text>
        </LinearGradient>

        <View style={s.form}>
          <Text style={s.title}>Join BanyanVision</Text>
          <Text style={s.sub}>Discover authentic Indian fashion</Text>

          {errors.general && (
            <View style={s.errorBanner}>
              <Text style={s.errorBannerTxt}>{errors.general}</Text>
            </View>
          )}

          {FIELDS.map(f => (
            <View key={f.key} style={s.field}>
              <Text style={s.label}>{f.label}</Text>
              {f.secure ? (
                <View style={[s.pwdRow, errors[f.key] && s.inputErr]}>
                  <TextInput
                    style={s.pwdInput}
                    placeholder={f.placeholder}
                    placeholderTextColor={Colors.muted}
                    value={form[f.key]}
                    onChangeText={v => setVal(f.key, v)}
                    secureTextEntry={!showPwd}
                    autoCapitalize="none"
                  />
                  {f.key === 'password' && (
                    <TouchableOpacity style={s.eyeBtn} onPress={() => setShowPwd(v => !v)}>
                      <Text style={{ fontSize: 18 }}>{showPwd ? '🙈' : '👁️'}</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ) : (
                <TextInput
                  style={[s.input, errors[f.key] && s.inputErr]}
                  placeholder={f.placeholder}
                  placeholderTextColor={Colors.muted}
                  value={form[f.key]}
                  onChangeText={v => setVal(f.key, v)}
                  keyboardType={f.keyboard}
                  autoCapitalize={f.keyboard === 'email-address' ? 'none' : 'words'}
                  autoCorrect={false}
                />
              )}
              {errors[f.key] && <Text style={s.errTxt}>{errors[f.key]}</Text>}
            </View>
          ))}

          <TouchableOpacity onPress={handleRegister} disabled={loading} style={{ marginTop: Spacing.md }}>
            <LinearGradient colors={Colors.gradRose} style={s.registerBtn}>
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={s.registerBtnTxt}>Create Account</Text>
              }
            </LinearGradient>
          </TouchableOpacity>

          <View style={s.divider}>
            <View style={s.dividerLine} />
            <Text style={s.dividerTxt}>or</Text>
            <View style={s.dividerLine} />
          </View>

          <TouchableOpacity style={s.loginLink} onPress={() => nav.navigate('Login')}>
            <Text style={s.loginLinkTxt}>
              Already have an account? <Text style={{ color: Colors.rose, fontWeight: '700' }}>Sign In</Text>
            </Text>
          </TouchableOpacity>

          <Text style={s.terms}>
            By creating an account, you agree to our{' '}
            <Text style={{ color: Colors.rose }}>Terms of Service</Text> and{' '}
            <Text style={{ color: Colors.rose }}>Privacy Policy</Text>
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container:      { flex: 1, backgroundColor: Colors.ivory },
  content:        { paddingBottom: 40 },
  header:         { padding: Spacing.xl, paddingTop: 60, alignItems: 'center' },
  brand:          { fontSize: 32, fontWeight: '800', color: '#fff', letterSpacing: 0.5, marginBottom: 6 },
  tagline:        { fontSize: 12, color: 'rgba(255,255,255,0.65)', letterSpacing: 1.5, textTransform: 'uppercase' },
  form:           { padding: Spacing.xl },
  title:          { fontSize: 26, fontWeight: '700', color: Colors.dark, marginBottom: 4 },
  sub:            { fontSize: 14, color: Colors.muted, marginBottom: 24 },
  errorBanner:    { backgroundColor: '#FEF2F2', borderRadius: Radius.md, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: '#FECACA' },
  errorBannerTxt: { color: Colors.error, fontSize: 13, fontWeight: '600', textAlign: 'center' },
  field:          { marginBottom: 16 },
  label:          { fontSize: 11, fontWeight: '700', color: Colors.muted, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 6 },
  input:          { backgroundColor: '#fff', borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radius.md, paddingHorizontal: 14, height: 50, fontSize: 15, color: Colors.dark },
  inputErr:       { borderColor: Colors.error },
  errTxt:         { fontSize: 11, color: Colors.error, marginTop: 4, fontWeight: '600' },
  pwdRow:         { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radius.md, height: 50 },
  pwdInput:       { flex: 1, paddingHorizontal: 14, fontSize: 15, color: Colors.dark },
  eyeBtn:         { padding: 12 },
  registerBtn:    { borderRadius: Radius.lg, paddingVertical: 16, alignItems: 'center' },
  registerBtnTxt: { color: '#fff', fontSize: 16, fontWeight: '700' },
  divider:        { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  dividerLine:    { flex: 1, height: 1, backgroundColor: Colors.border },
  dividerTxt:     { marginHorizontal: 12, color: Colors.muted, fontSize: 13 },
  loginLink:      { alignItems: 'center', paddingVertical: 8 },
  loginLinkTxt:   { fontSize: 14, color: Colors.text2 },
  terms:          { fontSize: 11, color: Colors.muted, textAlign: 'center', lineHeight: 18, marginTop: 16 },
});
