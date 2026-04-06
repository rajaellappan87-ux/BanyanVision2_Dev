import React, { useState } from 'react';
import {
  View, ScrollView, TouchableOpacity, StyleSheet,
  Dimensions, Modal, StatusBar, Text,
} from 'react-native';
import { Image } from 'expo-image';
import { Colors, Radius } from '../../constants/theme';
import { discPct } from '../../utils/helpers';

const { width: W, height: H } = Dimensions.get('window');

/* ── Full-screen zoom modal ──────────────────────────────────────────────── */
function ZoomModal({ images, startIndex, onClose }) {
  const [idx, setIdx] = useState(startIndex);
  const current = images[idx]?.url || images[idx] || '';

  return (
    <Modal visible animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <StatusBar backgroundColor="#000" barStyle="light-content" />
      <View style={m.overlay}>

        {/* Close */}
        <TouchableOpacity style={m.closeBtn} onPress={onClose}>
          <Text style={m.closeTxt}>✕</Text>
        </TouchableOpacity>

        {/* Counter */}
        <View style={m.counter}>
          <Text style={m.counterTxt}>{idx + 1} / {images.length}</Text>
        </View>

        {/* Pinch-to-zoom via ScrollView */}
        <ScrollView
          contentContainerStyle={m.zoomContent}
          minimumZoomScale={1}
          maximumZoomScale={4}
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          centerContent
          bouncesZoom
        >
          <Image
            source={{ uri: current }}
            style={m.zoomImg}
            contentFit="contain"
          />
        </ScrollView>

        {/* Hint */}
        <View style={m.hint}>
          <Text style={m.hintTxt}>Pinch to zoom · Swipe left/right to navigate</Text>
        </View>

        {/* Prev / Next */}
        {images.length > 1 && (
          <View style={m.navRow}>
            <TouchableOpacity
              style={[m.navBtn, idx === 0 && m.navBtnDisabled]}
              onPress={() => setIdx(i => Math.max(0, i - 1))}
              disabled={idx === 0}>
              <Text style={m.navTxt}>‹</Text>
            </TouchableOpacity>

            {/* Dot indicators */}
            <View style={m.dots}>
              {images.map((_, i) => (
                <TouchableOpacity key={i} onPress={() => setIdx(i)}>
                  <View style={[m.dot, i === idx && m.dotActive]} />
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={[m.navBtn, idx === images.length - 1 && m.navBtnDisabled]}
              onPress={() => setIdx(i => Math.min(images.length - 1, i + 1))}
              disabled={idx === images.length - 1}>
              <Text style={m.navTxt}>›</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </Modal>
  );
}

/* ── Image Gallery (product detail) ─────────────────────────────────────── */
export default function ImageGallery({ images = [], imgIdx, setImgIdx, wished, onWishlist, originalPrice, price }) {
  const [zoomOpen, setZoomOpen] = useState(false);
  const disc = discPct(originalPrice, price);
  const current = images[imgIdx]?.url || images[imgIdx] || '';

  return (
    <View style={s.container}>
      {/* Main image — tap to open zoom */}
      <TouchableOpacity activeOpacity={0.95} onPress={() => setZoomOpen(true)}>
        <Image source={{ uri: current }} style={s.mainImg} contentFit="contain" />

        {/* Zoom hint */}
        <View style={s.zoomHint}>
          <Text style={s.zoomHintTxt}>🔍 Pinch to zoom</Text>
        </View>
      </TouchableOpacity>

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

      {zoomOpen && (
        <ZoomModal
          images={images}
          startIndex={imgIdx}
          onClose={() => setZoomOpen(false)}
        />
      )}
    </View>
  );
}

/* ── Gallery styles ──────────────────────────────────────────────────────── */
const s = StyleSheet.create({
  container:    { position: 'relative', backgroundColor: Colors.ivory2 },
  mainImg:      { width: W, height: W * 1.1 },
  zoomHint:     { position: 'absolute', bottom: 12, left: 12, backgroundColor: 'rgba(0,0,0,0.5)',
                  borderRadius: 99, paddingHorizontal: 10, paddingVertical: 4 },
  zoomHintTxt:  { color: 'rgba(255,255,255,0.85)', fontSize: 10, fontWeight: '700' },
  heartBtn:     { position: 'absolute', top: 16, right: 16, backgroundColor: '#ffffffcc',
                  borderRadius: 22, width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  discBadge:    { position: 'absolute', top: 16, left: 16, backgroundColor: '#EF4444',
                  borderRadius: Radius.sm, paddingHorizontal: 10, paddingVertical: 4 },
  discText:     { color: '#fff', fontSize: 11, fontWeight: '800' },
  thumbRow:     { padding: 10, backgroundColor: '#fff' },
  thumb:        { width: 56, height: 68, borderRadius: 8, marginRight: 8, borderWidth: 1.5, borderColor: Colors.border },
  thumbActive:  { borderColor: Colors.rose },
});

/* ── Zoom modal styles ───────────────────────────────────────────────────── */
const m = StyleSheet.create({
  overlay:      { flex: 1, backgroundColor: '#000', justifyContent: 'center' },
  closeBtn:     { position: 'absolute', top: 48, right: 18, zIndex: 10,
                  backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 22,
                  width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  closeTxt:     { color: '#fff', fontSize: 18, fontWeight: '700' },
  counter:      { position: 'absolute', top: 52, left: 0, right: 0, zIndex: 10, alignItems: 'center' },
  counterTxt:   { color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: '700',
                  backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 99, paddingHorizontal: 14, paddingVertical: 4 },
  zoomContent:  { flex: 1, justifyContent: 'center', alignItems: 'center', minHeight: H },
  zoomImg:      { width: W, height: H * 0.75 },
  hint:         { position: 'absolute', bottom: 90, left: 0, right: 0, alignItems: 'center' },
  hintTxt:      { color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: '600' },
  navRow:       { position: 'absolute', bottom: 30, left: 0, right: 0,
                  flexDirection: 'row', justifyContent: 'space-between',
                  alignItems: 'center', paddingHorizontal: 20 },
  navBtn:       { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 26,
                  width: 52, height: 52, justifyContent: 'center', alignItems: 'center' },
  navBtnDisabled: { opacity: 0.25 },
  navTxt:       { color: '#fff', fontSize: 28, fontWeight: '300' },
  dots:         { flexDirection: 'row', gap: 6 },
  dot:          { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.3)' },
  dotActive:    { backgroundColor: '#fff', width: 18 },
});
