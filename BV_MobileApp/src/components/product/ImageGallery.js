import React from 'react';
import { View, ScrollView, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { Text } from 'react-native';
import { Colors, Radius } from '../../constants/theme';
import { discPct } from '../../utils/helpers';

const { width: W } = Dimensions.get('window');

/**
 * Full-width image carousel with thumbnail strip, wishlist heart, and discount badge.
 *
 * Props:
 *   images      {Array}    – Product images array ({ url } or string)
 *   imgIdx      {number}   – Current image index
 *   setImgIdx   {function} – Setter for imgIdx
 *   wished      {boolean}  – Whether product is in wishlist
 *   onWishlist  {function} – Toggle wishlist handler
 *   originalPrice {number} – Used to calculate discount %
 *   price        {number}
 */
export default function ImageGallery({ images = [], imgIdx, setImgIdx, wished, onWishlist, originalPrice, price }) {
  const disc = discPct(originalPrice, price);
  const current = images[imgIdx]?.url || images[imgIdx] || '';

  return (
    <View style={s.container}>
      <Image source={{ uri: current }} style={s.mainImg} contentFit="contain" />

      <TouchableOpacity style={s.heartBtn} onPress={onWishlist}>
        <Text style={{ fontSize: 22 }}>{wished ? '❤️' : '🤍'}</Text>
      </TouchableOpacity>

      {disc > 0 && (
        <View style={s.discBadge}>
          <Text style={s.discText}>−{disc}%</Text>
        </View>
      )}

      {images.length > 1 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.thumbRow}>
          {images.map((img, i) => (
            <TouchableOpacity key={i} onPress={() => setImgIdx(i)}>
              <Image
                source={{ uri: img?.url || img }}
                style={[s.thumb, i === imgIdx && s.thumbActive]}
                contentFit="cover"
              />
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container:  { position: 'relative', backgroundColor: Colors.ivory2 },
  mainImg:    { width: W, height: W * 1.1 },
  heartBtn:   { position: 'absolute', top: 16, right: 16, backgroundColor: '#ffffffcc', borderRadius: 22, width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  discBadge:  { position: 'absolute', top: 16, left: 16, backgroundColor: '#EF4444', borderRadius: Radius.sm, paddingHorizontal: 10, paddingVertical: 4 },
  discText:   { color: '#fff', fontSize: 11, fontWeight: '800' },
  thumbRow:   { padding: 10, backgroundColor: '#fff' },
  thumb:      { width: 56, height: 68, borderRadius: 8, marginRight: 8, borderWidth: 1.5, borderColor: Colors.border },
  thumbActive:{ borderColor: Colors.rose },
});
