import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, TextInput,
  StyleSheet, ActivityIndicator, ScrollView, Modal, Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute } from '@react-navigation/native';
import { apiGetProducts, apiGetConfig } from '../api';
import { Colors, Spacing, Radius, Shadow } from '../constants/theme';
import { DEFAULT_CATEGORIES } from '../constants/categories';
import ProductCard from '../components/ProductCard';

const SORTS = ['Latest', 'Price ↑', 'Price ↓', 'Rating'];
const PRICE_STEPS = [500, 1000, 2000, 3000, 5000, 10000, 15000, 25000];

export default function ShopScreen() {
  const nav   = useNavigation();
  const route = useRoute();

  const [products,    setProducts]    = useState([]);
  const [total,       setTotal]       = useState(0);
  const [loading,     setLoading]     = useState(true);
  const [search,      setSearch]      = useState('');
  const [category,    setCategory]    = useState(route.params?.category || 'All');
  const [sort,        setSort]        = useState('Latest');
  const [maxPrice,    setMaxPrice]    = useState(null);
  const [showFilter,  setShowFilter]  = useState(false);
  const [page,        setPage]        = useState(1);
  const [hasMore,     setHasMore]     = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const LIMIT = 12;
  const [categoryMap, setCategoryMap] = useState(DEFAULT_CATEGORIES);
  const cats = ['All', ...Object.keys(categoryMap)];

  useEffect(() => {
    apiGetConfig('categories')
      .then(r => { if (r.data?.value) setCategoryMap(r.data.value); })
      .catch(() => {});
  }, []);

  const load = useCallback(async (pg = 1, reset = false) => {
    if (pg === 1) setLoading(true); else setLoadingMore(true);
    try {
      const params = { limit: LIMIT, page: pg };
      if (category !== 'All')      params.category = category;
      if (search)                  params.search   = search;
      if (sort === 'Price ↑')      params.sort = 'price_asc';
      if (sort === 'Price ↓')      params.sort = 'price_desc';
      if (sort === 'Rating')        params.sort = 'rating';
      if (maxPrice)                params.maxPrice = maxPrice;
      if (route.params?.featured)  params.featured = true;
      if (route.params?.trending)  params.trending = true;

      const res  = await apiGetProducts(params);
      const data = res.data.products || [];
      const tot  = res.data.total    || 0;
      if (reset || pg === 1) setProducts(data);
      else setProducts(prev => [...prev, ...data]);
      setTotal(tot);
      setHasMore(data.length === LIMIT);
      setPage(pg);
    } catch {}
    setLoading(false);
    setLoadingMore(false);
  }, [category, search, sort, maxPrice, route.params]);

  useEffect(() => { load(1, true); }, [category, sort, maxPrice]);

  const onEndReached   = () => { if (!loadingMore && hasMore) load(page + 1); };
  const onSearchSubmit = () => load(1, true);

  const filterActive = maxPrice !== null;

  return (
    <View style={s.container}>
      {/* Search + Filter row */}
      <View style={s.topRow}>
        <View style={s.searchBox}>
          <TextInput
            style={s.searchInput}
            placeholder="Search sarees, kurtas..."
            placeholderTextColor={Colors.muted}
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={onSearchSubmit}
            returnKeyType="search"
          />
          {search ? (
            <TouchableOpacity onPress={() => { setSearch(''); load(1, true); }} style={s.clearBtn}>
              <Text style={{ color: Colors.muted, fontSize: 18 }}>×</Text>
            </TouchableOpacity>
          ) : null}
        </View>
        <TouchableOpacity onPress={() => setShowFilter(true)} style={[s.filterBtn, filterActive && s.filterBtnActive]}>
          {filterActive ? (
            <LinearGradient colors={Colors.gradRose} style={s.filterBtnInner}>
              <Text style={[s.filterBtnTxt, { color: '#fff' }]}>⊞ Filter</Text>
            </LinearGradient>
          ) : (
            <View style={s.filterBtnInner}>
              <Text style={s.filterBtnTxt}>⊞ Filter</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Product count */}
      {!loading && (
        <Text style={s.countTxt}>{total} styles available</Text>
      )}

      {/* Category chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.catScroll} contentContainerStyle={{ paddingHorizontal: Spacing.md, gap: 8 }}>
        {cats.map(c => (
          <TouchableOpacity
            key={c}
            onPress={() => setCategory(c)}
            style={[s.catChip, category === c && s.catChipActive]}
          >
            <Text style={[s.catChipText, category === c && s.catChipTextActive]}>{c}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Sort pills */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }} contentContainerStyle={{ paddingHorizontal: Spacing.md, gap: 8 }}>
        {SORTS.map(sv => (
          <TouchableOpacity
            key={sv}
            onPress={() => setSort(sv)}
            style={[s.sortBtn, sort === sv && s.sortBtnActive]}
          >
            <Text style={[s.sortText, sort === sv && s.sortTextActive]}>{sv}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color={Colors.rose} />
        </View>
      ) : products.length === 0 ? (
        <View style={s.center}>
          <Text style={{ fontSize: 40, marginBottom: 12 }}>🔍</Text>
          <Text style={{ color: Colors.muted, fontSize: 15 }}>No products found</Text>
          {filterActive && (
            <TouchableOpacity onPress={() => setMaxPrice(null)} style={{ marginTop: 12 }}>
              <Text style={{ color: Colors.rose, fontWeight: '600' }}>Clear price filter</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={i => i._id}
          numColumns={2}
          columnWrapperStyle={{ gap: 10, paddingHorizontal: Spacing.md }}
          contentContainerStyle={{ paddingBottom: 80, gap: 10 }}
          showsVerticalScrollIndicator={false}
          onEndReached={onEndReached}
          onEndReachedThreshold={0.4}
          renderItem={({ item }) => (
            <ProductCard
              product={item}
              onPress={() => nav.navigate('ProductDetail', { id: item._id })}
              style={{ flex: 1 }}
            />
          )}
          ListFooterComponent={loadingMore ? <ActivityIndicator color={Colors.rose} style={{ marginVertical: 16 }} /> : null}
        />
      )}

      {/* Price Filter Modal */}
      <Modal visible={showFilter} transparent animationType="slide" onRequestClose={() => setShowFilter(false)}>
        <Pressable style={s.modalOverlay} onPress={() => setShowFilter(false)}>
          <Pressable style={s.filterSheet} onPress={e => e.stopPropagation()}>
            <View style={s.filterHandle} />
            <Text style={s.filterTitle}>Filter by Price</Text>
            <Text style={s.filterSub}>Maximum price</Text>
            <View style={s.priceGrid}>
              <TouchableOpacity
                style={[s.priceChip, maxPrice === null && s.priceChipActive]}
                onPress={() => setMaxPrice(null)}
              >
                <Text style={[s.priceChipTxt, maxPrice === null && s.priceChipTxtActive]}>Any</Text>
              </TouchableOpacity>
              {PRICE_STEPS.map(p => (
                <TouchableOpacity
                  key={p}
                  style={[s.priceChip, maxPrice === p && s.priceChipActive]}
                  onPress={() => setMaxPrice(p)}
                >
                  <Text style={[s.priceChipTxt, maxPrice === p && s.priceChipTxtActive]}>
                    ₹{(p / 1000).toFixed(p % 1000 === 0 ? 0 : 1)}K
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity onPress={() => setShowFilter(false)}>
              <LinearGradient colors={Colors.gradRose} style={s.applyFilter}>
                <Text style={s.applyFilterTxt}>Apply Filter</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  container:        { flex: 1, backgroundColor: Colors.ivory },
  center:           { flex: 1, justifyContent: 'center', alignItems: 'center' },

  topRow:           { flexDirection: 'row', alignItems: 'center', margin: Spacing.md, gap: 10 },
  searchBox:        { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: Radius.md, paddingHorizontal: 14, borderWidth: 1.5, borderColor: Colors.border, ...Shadow.sm },
  searchInput:      { flex: 1, height: 44, fontSize: 14, color: Colors.dark },
  clearBtn:         { padding: 6 },
  filterBtn:        { borderRadius: Radius.md, overflow: 'hidden', borderWidth: 1.5, borderColor: Colors.border },
  filterBtnActive:  { borderColor: Colors.rose },
  filterBtnInner:   { paddingHorizontal: 14, paddingVertical: 10 },
  filterBtnTxt:     { fontSize: 12, fontWeight: '700', color: Colors.text2 },

  countTxt:         { fontSize: 11, color: Colors.muted, fontWeight: '600', paddingHorizontal: Spacing.md, marginBottom: 8 },

  catScroll:        { marginBottom: 8 },
  catChip:          { paddingHorizontal: 16, paddingVertical: 7, borderRadius: Radius.full, backgroundColor: '#fff', borderWidth: 1.5, borderColor: Colors.border },
  catChipActive:    { backgroundColor: Colors.rose, borderColor: Colors.rose },
  catChipText:      { fontSize: 12, fontWeight: '600', color: Colors.text2 },
  catChipTextActive:{ color: '#fff' },

  sortBtn:          { paddingHorizontal: 14, paddingVertical: 6, borderRadius: Radius.full, backgroundColor: Colors.ivory2, borderWidth: 1, borderColor: Colors.border },
  sortBtnActive:    { borderColor: Colors.rose },
  sortText:         { fontSize: 11, fontWeight: '600', color: Colors.muted },
  sortTextActive:   { color: Colors.rose },

  // Filter modal
  modalOverlay:     { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  filterSheet:      { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: Spacing.xl, paddingBottom: 40 },
  filterHandle:     { width: 40, height: 4, backgroundColor: Colors.border, borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  filterTitle:      { fontSize: 20, fontWeight: '700', color: Colors.dark, marginBottom: 4 },
  filterSub:        { fontSize: 12, color: Colors.muted, marginBottom: 16, fontWeight: '600' },
  priceGrid:        { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  priceChip:        { paddingHorizontal: 16, paddingVertical: 8, borderRadius: Radius.full, backgroundColor: Colors.ivory2, borderWidth: 1.5, borderColor: Colors.border },
  priceChipActive:  { backgroundColor: Colors.rose, borderColor: Colors.rose },
  priceChipTxt:     { fontSize: 13, fontWeight: '700', color: Colors.text2 },
  priceChipTxtActive:{ color: '#fff' },
  applyFilter:      { borderRadius: Radius.lg, paddingVertical: 15, alignItems: 'center' },
  applyFilterTxt:   { color: '#fff', fontSize: 15, fontWeight: '700' },
});
