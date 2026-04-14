import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Dimensions, Share,
} from 'react-native';
import { Image } from 'expo-image';
import { Colors, Radius, Shadow, Spacing } from '../constants/theme';
import { fmt, discPct, getImageUrl } from '../utils/helpers';
import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../context/AuthContext';

const shareProduct = async (p) => {
  const url = `https://www.banyanvision.com/?product=${p._id}`;
  try {
    await Share.share({
      title: p.name,
      message: `Check out "${p.name}" on BanyanVision!\n${url}`,
      url,
    });
  } catch {}
};

const { width: W } = Dimensions.get('window');
const CARD_W = (W - Spacing.md * 2 - 10) / 2; // 2 columns with gap

export default function ProductCard({ product: p, onPress, compact = false, style }) {
  const { toggle, isWished } = useWishlist();
  const { user } = useAuth();

  if (!p) return null;

  const disc   = discPct(p.originalPrice, p.price);
  const imgUrl = getImageUrl(p) || `https://placehold.co/400x500/F5EFE8/C2185B?text=${encodeURIComponent(p.name || 'Product')}`;
  const wished = isWished(p._id);

  if (compact) {
    // Horizontal scroll card (used in Home featured/trending rows)
    return (
      <TouchableOpacity onPress={onPress} style={[cs.compact, style]} activeOpacity={0.85}>
        <View style={cs.compactImgWrap}>
          <Image source={{ uri: imgUrl }} style={cs.compactImg} contentFit="contain" />
          {disc > 0 && (
            <View style={cs.discBadge}>
              <Text style={cs.discText}>−{disc}%</Text>
            </View>
          )}
          {p.badge && (
            <View style={cs.tagBadge}>
              <Text style={cs.tagText}>{p.badge}</Text>
            </View>
          )}
          {user && (
            <TouchableOpacity style={cs.heartBtn} onPress={() => toggle(p._id)}>
              <Text style={{ fontSize: 16 }}>{wished ? '❤️' : '🤍'}</Text>
            </TouchableOpacity>
          )}
        </View>
        <View style={cs.compactInfo}>
          <Text style={cs.cat}>{p.category}</Text>
          <Text style={cs.name} numberOfLines={2}>{p.name}</Text>
          <View style={cs.priceRow}>
            <Text style={cs.price}>{fmt(p.price)}</Text>
            {p.originalPrice > p.price && (
              <Text style={cs.origPrice}>{fmt(p.originalPrice)}</Text>
            )}
          </View>
          {p.rating > 0 && (
            <Text style={cs.rating}>{'★'.repeat(Math.round(p.rating))} ({p.numReviews})</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  }

  // Grid card (used in Shop screen)
  return (
    <TouchableOpacity onPress={onPress} style={[gs.card, style]} activeOpacity={0.85}>
      <View style={gs.imgWrap}>
        <Image source={{ uri: imgUrl }} style={gs.img} contentFit="contain" />
        {disc > 0 && (
          <View style={gs.discBadge}>
            <Text style={gs.discText}>−{disc}%</Text>
          </View>
        )}
        {p.badge && (
          <View style={gs.tagBadge}>
            <Text style={gs.tagText}>{p.badge}</Text>
          </View>
        )}
        {user && (
          <TouchableOpacity style={gs.heartBtn} onPress={() => toggle(p._id)}>
            <Text style={{ fontSize: 16 }}>{wished ? '❤️' : '🤍'}</Text>
          </TouchableOpacity>
        )}
        {p.stock <= 5 && p.stock > 0 && (
          <View style={gs.stockWarn}>
            <Text style={gs.stockWarnTxt}>Only {p.stock} left</Text>
          </View>
        )}
      </View>
      <View style={gs.info}>
        <Text style={gs.cat} numberOfLines={1}>{p.category}</Text>
        <Text style={gs.name} numberOfLines={2}>{p.name}</Text>
        <View style={gs.priceRow}>
          <Text style={gs.price}>{fmt(p.price)}</Text>
          {p.originalPrice > p.price && (
            <Text style={gs.origPrice}>{fmt(p.originalPrice)}</Text>
          )}
        </View>
        <View style={gs.infoFooter}>
          {p.rating > 0 && (
            <Text style={gs.rating}>⭐ {p.rating?.toFixed(1)} ({p.numReviews})</Text>
          )}
          <TouchableOpacity onPress={e => { e?.stopPropagation?.(); shareProduct(p); }} style={gs.shareBtn} hitSlop={8}>
            <Text style={gs.shareBtnTxt}>⬆ Share</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// Compact (horizontal scroll) styles
const cs = StyleSheet.create({
  compact:        { width: 160, backgroundColor: '#fff', borderRadius: Radius.lg, marginRight: 12, ...Shadow.sm, overflow: 'hidden' },
  compactImgWrap: { position: 'relative', backgroundColor: Colors.ivory2 },
  compactImg:     { width: 160, height: 196, },
  discBadge:      { position: 'absolute', top: 8, left: 8, backgroundColor: '#EF4444', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 3 },
  discText:       { color: '#fff', fontSize: 9, fontWeight: '800' },
  tagBadge:       { position: 'absolute', bottom: 8, left: 8, backgroundColor: Colors.rose, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 3 },
  tagText:        { color: '#fff', fontSize: 9, fontWeight: '700' },
  heartBtn:       { position: 'absolute', top: 8, right: 8, backgroundColor: '#ffffffcc', borderRadius: 16, width: 32, height: 32, justifyContent: 'center', alignItems: 'center' },
  compactInfo:    { padding: 10 },
  cat:            { fontSize: 9, fontWeight: '700', color: Colors.rose, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 3 },
  name:           { fontSize: 12, fontWeight: '700', color: Colors.dark, lineHeight: 16, marginBottom: 5 },
  priceRow:       { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3 },
  price:          { fontSize: 14, fontWeight: '800', color: Colors.rose },
  origPrice:      { fontSize: 10, color: Colors.muted, textDecorationLine: 'line-through' },
  rating:         { fontSize: 10, color: Colors.gold },
});

// Grid styles
const gs = StyleSheet.create({
  card:        { backgroundColor: '#fff', borderRadius: Radius.lg, overflow: 'hidden', ...Shadow.sm },
  imgWrap:     { position: 'relative', backgroundColor: Colors.ivory2 },
  img:         { width: '100%', aspectRatio: 0.82 },
  discBadge:   { position: 'absolute', top: 8, right: 8, backgroundColor: '#EF4444', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 },
  discText:    { color: '#fff', fontSize: 9, fontWeight: '800' },
  tagBadge:    { position: 'absolute', top: 8, left: 8, backgroundColor: Colors.rose, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 },
  tagText:     { color: '#fff', fontSize: 9, fontWeight: '700' },
  heartBtn:    { position: 'absolute', bottom: 8, right: 8, backgroundColor: '#ffffffcc', borderRadius: 17, width: 34, height: 34, justifyContent: 'center', alignItems: 'center' },
  stockWarn:   { position: 'absolute', bottom: 8, left: 8, backgroundColor: '#FEF3C7', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 3 },
  stockWarnTxt:{ fontSize: 9, color: '#92400E', fontWeight: '700' },
  info:        { padding: 10 },
  cat:         { fontSize: 9, fontWeight: '700', color: Colors.rose, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 3 },
  name:        { fontSize: 13, fontWeight: '700', color: Colors.dark, lineHeight: 18, marginBottom: 5 },
  priceRow:    { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3 },
  price:       { fontSize: 15, fontWeight: '800', color: Colors.rose },
  origPrice:   { fontSize: 10, color: Colors.muted, textDecorationLine: 'line-through' },
  infoFooter:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 },
  rating:      { fontSize: 10, color: Colors.muted },
  shareBtn:    { flexDirection: 'row', alignItems: 'center', gap: 3 },
  shareBtnTxt: { fontSize: 10, color: Colors.rose, fontWeight: '700' },
});
