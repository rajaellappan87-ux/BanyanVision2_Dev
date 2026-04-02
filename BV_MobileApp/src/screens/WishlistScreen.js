import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { useNavigation } from '@react-navigation/native';
import { Colors, Spacing, Radius, Shadow } from '../constants/theme';
import { fmt, discPct, getImageUrl } from '../utils/helpers';
import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import AuthPrompt from '../components/common/AuthPrompt';
import EmptyState from '../components/common/EmptyState';

export default function WishlistScreen() {
  const nav  = useNavigation();
  const { user } = useAuth();
  const { wishlist, toggle } = useWishlist();
  const { addToCart } = useCart();

  if (!user) {
    return <AuthPrompt icon="🤍" message="Sign in to view and manage your wishlist" />;
  }

  if (wishlist.length === 0) {
    return (
      <EmptyState
        icon="🤍"
        title="Your wishlist is empty"
        subtitle="Save products you love for later"
        btnLabel="Browse Collections"
        onPress={() => nav.navigate('Shop')}
      />
    );
  }

  return (
    <FlatList
      data={wishlist}
      numColumns={2}
      keyExtractor={i => i._id || i}
      contentContainerStyle={{ padding: Spacing.md, paddingBottom: 40, gap: 10 }}
      columnWrapperStyle={{ gap: 10 }}
      showsVerticalScrollIndicator={false}
      ListHeaderComponent={
        <Text style={s.header}>My Wishlist ({wishlist.length})</Text>
      }
      renderItem={({ item: p }) => {
        const disc = discPct(p.originalPrice, p.price);
        return (
          <TouchableOpacity
            style={s.card}
            onPress={() => nav.navigate('ProductDetail', { id: p._id })}
          >
            <View>
              <Image source={{ uri: getImageUrl(p) }} style={s.img} contentFit="contain" />
              <TouchableOpacity style={s.heartBtn} onPress={() => toggle(p._id)}>
                <Text style={{ fontSize: 18 }}>❤️</Text>
              </TouchableOpacity>
              {disc > 0 && (
                <View style={s.discBadge}><Text style={s.discText}>−{disc}%</Text></View>
              )}
            </View>
            <View style={s.info}>
              <Text style={s.name} numberOfLines={2}>{p.name}</Text>
              <Text style={s.price}>{fmt(p.price)}</Text>
              {p.originalPrice && <Text style={s.origPrice}>{fmt(p.originalPrice)}</Text>}
              <TouchableOpacity
                style={s.addBtn}
                onPress={() => {
                  addToCart(p, 1, p.sizes?.[0] || '', p.colors?.[0] || '');
                  nav.navigate('Cart');
                }}
              >
                <Text style={s.addBtnTxt}>Add to Bag</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        );
      }}
    />
  );
}

const s = StyleSheet.create({
  header:      { fontSize: 22, fontWeight: '700', color: Colors.dark, marginBottom: 14, width: '100%' },
  card:        { flex: 1, backgroundColor: '#fff', borderRadius: Radius.lg, overflow: 'hidden', ...Shadow.sm },
  img:         { width: '100%', aspectRatio: 0.82, backgroundColor: Colors.ivory2 },
  heartBtn:    { position: 'absolute', top: 8, right: 8, backgroundColor: '#ffffffcc', borderRadius: 18, width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },
  discBadge:   { position: 'absolute', top: 8, left: 8, backgroundColor: '#EF4444', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 },
  discText:    { color: '#fff', fontSize: 10, fontWeight: '800' },
  info:        { padding: 10 },
  name:        { fontSize: 12, fontWeight: '700', color: Colors.dark, marginBottom: 4, lineHeight: 17 },
  price:       { fontSize: 15, fontWeight: '800', color: Colors.rose },
  origPrice:   { fontSize: 11, color: Colors.muted, textDecorationLine: 'line-through', marginBottom: 8 },
  addBtn:      { borderWidth: 1.5, borderColor: Colors.rose, borderRadius: Radius.sm, paddingVertical: 7, alignItems: 'center' },
  addBtnTxt:   { color: Colors.rose, fontSize: 11, fontWeight: '700' },
});
