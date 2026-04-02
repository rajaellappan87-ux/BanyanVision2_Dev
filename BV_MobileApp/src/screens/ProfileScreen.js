import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, Alert, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { Colors, Spacing, Radius, Shadow } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { apiUpdateProfile } from '../api';
import AuthPrompt from '../components/common/AuthPrompt';

export default function ProfileScreen() {
  const nav = useNavigation();
  const { user, logout, updateUser } = useAuth();

  const [editing, setEditing] = useState(false);
  const [saving,  setSaving]  = useState(false);
  const [form, setForm] = useState({
    name:    user?.name    || '',
    phone:   user?.phone   || '',
    address: user?.address || '',
  });

  const save = async () => {
    if (!form.name.trim()) { Alert.alert('Name is required'); return; }
    setSaving(true);
    try {
      const r = await apiUpdateProfile(form);
      updateUser(r.data.user);
      setEditing(false);
      Alert.alert('✓', 'Profile updated successfully');
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Update failed');
    }
    setSaving(false);
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: async () => { await logout(); nav.navigate('Home'); } },
    ]);
  };

  if (!user) {
    return <AuthPrompt icon="👤" message="Sign in to manage your profile and orders" />;
  }

  return (
    <ScrollView style={s.container} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Header */}
      <LinearGradient colors={Colors.gradDark} style={s.header}>
        <View style={s.avatar}>
          <Text style={s.avatarText}>{user.name?.[0]?.toUpperCase() || 'U'}</Text>
        </View>
        <Text style={s.userName}>{user.name}</Text>
        <Text style={s.userEmail}>{user.email}</Text>
        {user.role === 'admin' && (
          <View style={s.adminBadge}><Text style={s.adminBadgeTxt}>⚙️ Admin</Text></View>
        )}
      </LinearGradient>

      {/* Quick links */}
      <View style={s.quickLinks}>
        {[
          { icon: '📦', label: 'My Orders',   onPress: () => nav.navigate('Orders') },
          { icon: '❤️', label: 'Wishlist',    onPress: () => nav.navigate('Wishlist') },
          { icon: '🛍', label: 'Cart',        onPress: () => nav.navigate('Cart') },
        ].map(item => (
          <TouchableOpacity key={item.label} style={s.quickLink} onPress={item.onPress}>
            <Text style={s.quickLinkIcon}>{item.icon}</Text>
            <Text style={s.quickLinkLabel}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Profile form */}
      <View style={s.card}>
        <View style={s.cardHeader}>
          <Text style={s.cardTitle}>Personal Information</Text>
          {!editing && (
            <TouchableOpacity onPress={() => setEditing(true)}>
              <Text style={s.editBtn}>Edit</Text>
            </TouchableOpacity>
          )}
        </View>

        {[
          { key: 'name',    label: 'Full Name',    keyboard: 'default' },
          { key: 'phone',   label: 'Phone Number', keyboard: 'phone-pad' },
          { key: 'address', label: 'Address',      keyboard: 'default', multi: true },
        ].map(f => (
          <View key={f.key} style={s.field}>
            <Text style={s.fieldLabel}>{f.label}</Text>
            {editing ? (
              <TextInput
                style={[s.input, f.multi && s.inputMulti]}
                value={form[f.key]}
                onChangeText={v => setForm(prev => ({ ...prev, [f.key]: v }))}
                keyboardType={f.keyboard}
                multiline={f.multi}
                placeholderTextColor={Colors.muted}
              />
            ) : (
              <Text style={s.fieldVal}>{form[f.key] || '—'}</Text>
            )}
          </View>
        ))}

        {editing && (
          <View style={s.editActions}>
            <TouchableOpacity style={s.cancelBtn} onPress={() => {
              setForm({ name: user.name || '', phone: user.phone || '', address: user.address || '' });
              setEditing(false);
            }}>
              <Text style={s.cancelBtnTxt}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={save} disabled={saving}>
              <LinearGradient colors={Colors.gradRose} style={s.saveBtn}>
                {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={s.saveBtnTxt}>Save</Text>}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Account info */}
      <View style={s.card}>
        <Text style={s.cardTitle}>Account</Text>
        <View style={s.field}>
          <Text style={s.fieldLabel}>Email</Text>
          <Text style={s.fieldVal}>{user.email}</Text>
        </View>
        <View style={s.field}>
          <Text style={s.fieldLabel}>Account Type</Text>
          <Text style={s.fieldVal}>{user.role === 'admin' ? 'Administrator' : 'Customer'}</Text>
        </View>
      </View>

      {/* Sign out */}
      <TouchableOpacity style={s.logoutBtn} onPress={handleLogout}>
        <Text style={s.logoutTxt}>Sign Out</Text>
      </TouchableOpacity>

      <Text style={s.versionTxt}>BanyanVision v1.0.0</Text>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container:       { flex: 1, backgroundColor: Colors.ivory },
  header:          { padding: Spacing.xl, alignItems: 'center', paddingBottom: Spacing.xxl },
  avatar:          { width: 72, height: 72, borderRadius: 36, backgroundColor: Colors.rose, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  avatarText:      { fontSize: 30, color: '#fff', fontWeight: '800' },
  userName:        { fontSize: 22, fontWeight: '700', color: '#fff', marginBottom: 4 },
  userEmail:       { fontSize: 13, color: 'rgba(255,255,255,0.7)' },
  adminBadge:      { marginTop: 8, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: Radius.full, paddingHorizontal: 14, paddingVertical: 5 },
  adminBadgeTxt:   { color: '#fff', fontSize: 12, fontWeight: '700' },
  quickLinks:      { flexDirection: 'row', backgroundColor: '#fff', marginTop: -20, marginHorizontal: Spacing.md, borderRadius: Radius.lg, padding: Spacing.md, ...Shadow.md, marginBottom: Spacing.md },
  quickLink:       { flex: 1, alignItems: 'center', gap: 6 },
  quickLinkIcon:   { fontSize: 26 },
  quickLinkLabel:  { fontSize: 11, fontWeight: '700', color: Colors.text2 },
  card:            { backgroundColor: '#fff', borderRadius: Radius.lg, padding: Spacing.md, marginHorizontal: Spacing.md, marginBottom: 12, ...Shadow.sm },
  cardHeader:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  cardTitle:       { fontSize: 15, fontWeight: '700', color: Colors.dark },
  editBtn:         { fontSize: 14, color: Colors.rose, fontWeight: '700' },
  field:           { marginBottom: 14 },
  fieldLabel:      { fontSize: 10, fontWeight: '700', color: Colors.muted, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 5 },
  fieldVal:        { fontSize: 14, color: Colors.dark, fontWeight: '500' },
  input:           { borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radius.md, paddingHorizontal: 12, height: 44, fontSize: 14, color: Colors.dark },
  inputMulti:      { height: 72, paddingTop: 10, textAlignVertical: 'top' },
  editActions:     { flexDirection: 'row', gap: 10, marginTop: 4 },
  cancelBtn:       { flex: 1, borderWidth: 1.5, borderColor: Colors.border2, borderRadius: Radius.md, paddingVertical: 12, alignItems: 'center' },
  cancelBtnTxt:    { color: Colors.muted, fontWeight: '600' },
  saveBtn:         { flex: 1, borderRadius: Radius.md, paddingVertical: 12, paddingHorizontal: 24, alignItems: 'center' },
  saveBtnTxt:      { color: '#fff', fontWeight: '700' },
  logoutBtn:       { marginHorizontal: Spacing.md, borderWidth: 2, borderColor: Colors.error, borderRadius: Radius.lg, paddingVertical: 14, alignItems: 'center', marginBottom: 12 },
  logoutTxt:       { color: Colors.error, fontSize: 15, fontWeight: '700' },
  versionTxt:      { textAlign: 'center', fontSize: 11, color: Colors.muted, marginBottom: 8 },
});
