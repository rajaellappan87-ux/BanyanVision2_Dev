import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, RefreshControl,
  StyleSheet, Dimensions, FlatList, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { apiGetProducts, apiGetConfig } from '../api';
import { Colors, Spacing, Radius, Shadow } from '../constants/theme';
import { DEFAULT_CATEGORIES } from '../constants/categories';
import ProductCard from '../components/ProductCard';

const { width: W } = Dimensions.get('window');

export default function HomeScreen() {
  const nav = useNavigation();

  const [featured,    setFeatured]    = useState([]);
  const [trending,    setTrending]    = useState([]);
  const [marquee,     setMarquee]     = useState(null);
  const [promo,       setPromo]       = useState(null);
  const [siteSettings,setSiteSettings]= useState({});
  const [categories,  setCategories]  = useState(DEFAULT_CATEGORIES);
  const [loading,     setLoading]     = useState(true);
  const [refreshing,  setRefreshing]  = useState(false);

  const load = useCallback(async () => {
    try {
      const [feat, trend, mqRes, catRes, promoRes, settingsRes] = await Promise.allSettled([
        apiGetProducts({ featured: true,  limit: 8 }),
        apiGetProducts({ trending: true,  limit: 8 }),
        apiGetConfig('marquee'),
        apiGetConfig('categories'),
        apiGetConfig('offer'),
        apiGetConfig('siteSettings'),
      ]);
      if (feat.status     === 'fulfilled') setFeatured(feat.value.data.products   || []);
      if (trend.status    === 'fulfilled') setTrending(trend.value.data.products  || []);
      if (mqRes.status    === 'fulfilled') setMarquee(mqRes.value.data.value);
      if (catRes.status   === 'fulfilled' && catRes.value.data.value) setCategories(catRes.value.data.value);
      if (promoRes.status === 'fulfilled') setPromo(promoRes.value.data.value);
      if (settingsRes.status === 'fulfilled') setSiteSettings(settingsRes.value.data.value || {});
    } catch {}
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { load(); }, []);
  const onRefresh = () => { setRefreshing(true); load(); };

  const marqueeItems = marquee?.items?.length
    ? marquee.items
    : ['FREE SHIPPING ABOVE ₹2000', 'WELCOME20 — 20% OFF', 'BRIDAL COLLECTION NOW LIVE'];

  const whyItems = [
    { icon: '🎨', title: 'Authentic',     desc: 'Verified Indian artisans only' },
    { icon: '🌿', title: 'Sustainable',   desc: 'Eco-conscious packaging' },
    { icon: '⚡', title: 'Fast Delivery', desc: `${siteSettings.standardDays || '3–7 business days'}` },
    ...(siteSettings.returnsEnabled
      ? [{ icon: '❤️', title: 'Free Returns', desc: `${siteSettings.returnDays || 7}-day easy returns` }]
      : []),
  ];

  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color={Colors.rose} />
      </View>
    );
  }

  return (
    <ScrollView
      style={s.container}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.rose} />}
    >
      {/* ── Marquee Banner ── */}
      <LinearGradient colors={[Colors.rose, Colors.saffron, '#7B1FA2', Colors.rose]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.marquee}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <Text style={s.marqueeText}>
            {[0, 1].map(() => marqueeItems.map(t => `${marquee?.separator || '✦'}  ${t}  `).join('')).join('')}
          </Text>
        </ScrollView>
      </LinearGradient>

      {/* ── Hero ── */}
      <LinearGradient colors={['#FDF8F3', '#F5EFE8', '#FDF8F3']} style={s.hero}>
        <Text style={s.heroTag}>🌿  New Arrivals 2025</Text>
        <Text style={s.heroTitle}>
          Wear India's{'\n'}<Text style={{ color: Colors.rose, fontStyle: 'italic' }}>Soul</Text> in{'\n'}Every Thread
        </Text>
        <Text style={s.heroSub}>
          Handpicked from master artisans — Varanasi silk, Rajasthan block prints, Jaipur embroidery.
        </Text>
        <View style={s.heroBtns}>
          <TouchableOpacity onPress={() => nav.navigate('Shop')}>
            <LinearGradient colors={Colors.gradRose} style={s.heroCTA}>
              <Text style={s.heroCTAText}>Shop Collection</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Stats row */}
        <View style={s.statsRow}>
          {[
            ['12K+', 'Curated Styles'],
            ['98%',  'Happy Clients'],
            ['25+',  'Artisans'],
            ...(siteSettings.returnsEnabled ? [['Free', 'Easy Returns']] : []),
          ].map(([val, label]) => (
            <View key={label} style={s.stat}>
              <LinearGradient colors={[Colors.rose, Colors.saffron]} style={s.statGrad}>
                <Text style={s.statVal}>{val}</Text>
              </LinearGradient>
              <Text style={s.statLabel}>{label}</Text>
            </View>
          ))}
        </View>
      </LinearGradient>

      {/* ── Categories ── */}
      <View style={[s.section, { backgroundColor: '#F5EFE8' }]}>
        <Text style={s.sectionSub}>EXPLORE</Text>
        <Text style={s.sectionTitle}>Shop by <Text style={{ color: Colors.rose }}>Category</Text></Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.catRow}>
          {Object.entries(categories).map(([name, cfg]) => (
            <TouchableOpacity
              key={name}
              style={[s.catBtn, { backgroundColor: cfg.light || '#FCE4EC', borderColor: '#E8D5D5' }]}
              onPress={() => nav.navigate('Shop', { category: name })}
            >
              <View style={[s.catIcon, { backgroundColor: cfg.color || Colors.rose }]}>
                <Text style={s.catEmoji}>{cfg.icon || '👗'}</Text>
              </View>
              <Text style={s.catName}>{name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* ── Trending Picks ── */}
      {trending.length > 0 && (
        <View style={s.section}>
          <Text style={s.sectionSub}>HOT RIGHT NOW</Text>
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>Trending <Text style={{ color: Colors.rose }}>Picks</Text></Text>
            <TouchableOpacity onPress={() => nav.navigate('Shop', { trending: true })}>
              <Text style={s.seeAll}>View All →</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={trending}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={i => i._id}
            contentContainerStyle={{ paddingHorizontal: Spacing.md }}
            renderItem={({ item }) => (
              <ProductCard product={item} onPress={() => nav.navigate('ProductDetail', { id: item._id })} compact />
            )}
          />
        </View>
      )}

      {/* ── Promo / Offer Banner ── */}
      {promo?.active && (
        <LinearGradient
          colors={['#1A0A00', '#2D1200', '#3D1500']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={s.promo}
        >
          {/* decorative circles */}
          <View style={s.promoCircle1} />
          <View style={s.promoCircle2} />

          <View style={{ position: 'relative' }}>
            {promo.tag ? (
              <View style={s.promoTag}>
                <Text style={s.promoTagText}>{promo.tag}</Text>
              </View>
            ) : null}
            <Text style={s.promoHeading}>
              {promo.heading}{' '}
              <Text style={{ color: '#F9A825', fontStyle: 'italic' }}>{promo.subheading}</Text>
            </Text>
            {promo.body ? <Text style={s.promoBody}>{promo.body}</Text> : null}
            {promo.code ? (
              <View style={s.promoCodeRow}>
                <Text style={s.promoBodyMuted}>Use code </Text>
                <View style={s.promoCode}>
                  <Text style={s.promoCodeText}>{promo.code}</Text>
                </View>
                {promo.codeDesc ? <Text style={s.promoBodyMuted}> {promo.codeDesc}</Text> : null}
              </View>
            ) : null}
            <TouchableOpacity onPress={() => nav.navigate('Shop')} style={s.promoCTA}>
              <LinearGradient colors={[Colors.saffron, '#E65100']} style={s.promoCTAGrad}>
                <Text style={s.promoCTAText}>{promo.btnLabel || 'Shop Now'}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      )}

      {/* ── Editor's Picks (Featured) ── */}
      {featured.length > 0 && (
        <View style={[s.section, { backgroundColor: '#F5EFE8' }]}>
          <Text style={s.sectionSub}>CURATED FOR YOU</Text>
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>Editor's <Text style={{ color: Colors.rose }}>Picks</Text></Text>
            <TouchableOpacity onPress={() => nav.navigate('Shop', { featured: true })}>
              <Text style={s.seeAll}>All Products →</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={featured}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={i => i._id}
            contentContainerStyle={{ paddingHorizontal: Spacing.md }}
            renderItem={({ item }) => (
              <ProductCard product={item} onPress={() => nav.navigate('ProductDetail', { id: item._id })} compact />
            )}
          />
        </View>
      )}

      {/* ── Why Choose BanyanVision ── */}
      <View style={s.section}>
        <Text style={s.sectionSub}>THE DIFFERENCE</Text>
        <Text style={[s.sectionTitle, { textAlign: 'center', marginBottom: Spacing.lg }]}>
          Why Choose <Text style={{ color: Colors.rose }}>BanyanVision</Text>
        </Text>
        <View style={s.whyGrid}>
          {whyItems.map((item, i) => (
            <View key={item.title} style={[s.whyCard, i % 2 === 0 ? { marginRight: 6 } : { marginLeft: 6 }]}>
              <Text style={s.whyIcon}>{item.icon}</Text>
              <Text style={s.whyTitle}>{item.title}</Text>
              <Text style={s.whyDesc}>{item.desc}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container:      { flex: 1, backgroundColor: Colors.ivory },
  center:         { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.ivory },

  // Marquee
  marquee:        { paddingVertical: 10, paddingHorizontal: Spacing.md },
  marqueeText:    { color: '#fff', fontSize: 11, fontWeight: '700', letterSpacing: 1 },

  // Hero
  hero:           { padding: Spacing.xl, paddingTop: Spacing.xxl, paddingBottom: Spacing.xl },
  heroTag:        { fontSize: 12, color: Colors.rose, fontWeight: '700', letterSpacing: 1, marginBottom: 10 },
  heroTitle:      { fontSize: 38, fontWeight: '800', color: Colors.dark, lineHeight: 44, marginBottom: 14 },
  heroSub:        { fontSize: 14, color: Colors.text2, lineHeight: 22, marginBottom: 24 },
  heroBtns:       { flexDirection: 'row', gap: 12, marginBottom: 28 },
  heroCTA:        { borderRadius: Radius.full, paddingVertical: 14, paddingHorizontal: 32 },
  heroCTAText:    { color: '#fff', fontSize: 15, fontWeight: '700' },

  // Stats
  statsRow:       { flexDirection: 'row', gap: 20, paddingTop: 20, borderTopWidth: 1.5, borderTopColor: 'rgba(194,24,91,0.15)', flexWrap: 'wrap' },
  stat:           { alignItems: 'flex-start' },
  statGrad:       { borderRadius: 4, paddingHorizontal: 2 },
  statVal:        { fontSize: 22, fontWeight: '800', color: '#fff', lineHeight: 26 },
  statLabel:      { fontSize: 9, color: Colors.muted, fontWeight: '600', letterSpacing: 0.5, marginTop: 3, textTransform: 'uppercase' },

  // Sections
  section:        { marginBottom: Spacing.md, backgroundColor: Colors.ivory, paddingVertical: Spacing.lg },
  sectionSub:     { fontSize: 10, color: Colors.muted, fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase', textAlign: 'center', marginBottom: 4, paddingHorizontal: Spacing.md },
  sectionHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.md, marginBottom: Spacing.sm },
  sectionTitle:   { fontSize: 22, fontWeight: '700', color: Colors.dark, paddingHorizontal: Spacing.md, marginBottom: 4 },
  seeAll:         { fontSize: 13, color: Colors.rose, fontWeight: '600' },

  // Categories
  catRow:         { paddingHorizontal: Spacing.md, gap: 12 },
  catBtn:         { alignItems: 'center', padding: 14, borderRadius: Radius.xl, width: 88, borderWidth: 1.5 },
  catIcon:        { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  catEmoji:       { fontSize: 22 },
  catName:        { fontSize: 10, fontWeight: '700', color: Colors.dark, textAlign: 'center', letterSpacing: 0.3 },

  // Promo Banner
  promo:          { margin: Spacing.md, borderRadius: 24, padding: Spacing.xl, overflow: 'hidden', position: 'relative' },
  promoCircle1:   { position: 'absolute', top: -40, right: -40, width: 180, height: 180, borderRadius: 90, backgroundColor: 'rgba(249,168,37,0.12)' },
  promoCircle2:   { position: 'absolute', bottom: -30, left: '40%', width: 140, height: 140, borderRadius: 70, backgroundColor: 'rgba(194,24,91,0.1)' },
  promoTag:       { alignSelf: 'flex-start', backgroundColor: 'rgba(249,168,37,0.15)', borderWidth: 1, borderColor: 'rgba(249,168,37,0.25)', borderRadius: Radius.full, paddingHorizontal: 12, paddingVertical: 4, marginBottom: 14 },
  promoTagText:   { color: '#F9A825', fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  promoHeading:   { fontSize: 26, fontWeight: '700', color: '#fff', lineHeight: 32, marginBottom: 12 },
  promoBody:      { color: 'rgba(255,255,255,0.7)', fontSize: 13, lineHeight: 20, marginBottom: 10 },
  promoCodeRow:   { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', marginBottom: 20 },
  promoBodyMuted: { color: 'rgba(255,255,255,0.7)', fontSize: 13 },
  promoCode:      { backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 2, marginHorizontal: 4 },
  promoCodeText:  { color: '#F9A825', fontSize: 14, fontWeight: '700', fontFamily: 'monospace', letterSpacing: 1 },
  promoCTA:       { alignSelf: 'flex-start' },
  promoCTAGrad:   { borderRadius: 16, paddingVertical: 13, paddingHorizontal: 28 },
  promoCTAText:   { color: '#fff', fontSize: 15, fontWeight: '700' },

  // Why Choose
  whyGrid:        { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: Spacing.md },
  whyCard:        { width: (W - Spacing.md * 2 - 12) / 2, backgroundColor: '#fff', borderRadius: Radius.lg, padding: 20, alignItems: 'center', marginBottom: 12, ...Shadow.sm },
  whyIcon:        { fontSize: 32, marginBottom: 10 },
  whyTitle:       { fontSize: 15, fontWeight: '700', color: Colors.dark, marginBottom: 6 },
  whyDesc:        { fontSize: 11, color: Colors.muted, textAlign: 'center', lineHeight: 16 },
});
