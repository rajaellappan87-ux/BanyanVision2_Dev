import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute } from '@react-navigation/native';

import { apiGetProduct, apiCreateReview } from '../api';
import { Colors, Spacing, Radius, Shadow } from '../constants/theme';
import { fmt, discPct } from '../utils/helpers';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../context/AuthContext';

import LoadingView      from '../components/common/LoadingView';
import ImageGallery     from '../components/product/ImageGallery';
import SizeSelector     from '../components/product/SizeSelector';
import ColorSelector    from '../components/product/ColorSelector';
import QuantitySelector from '../components/product/QuantitySelector';
import DeliveryInfo     from '../components/product/DeliveryInfo';
import ReviewCard       from '../components/product/ReviewCard';

export default function ProductDetailScreen() {
  const nav         = useNavigation();
  const { id }      = useRoute().params;
  const { addToCart } = useCart();
  const { toggle, isWished } = useWishlist();
  const { user }    = useAuth();

  const [product,  setProduct]  = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [imgIdx,   setImgIdx]   = useState(0);
  const [size,     setSize]     = useState('');
  const [color,    setColor]    = useState('');
  const [qty,      setQty]      = useState(1);
  const [addedMsg,     setAddedMsg]     = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText,   setReviewText]   = useState('');
  const [reviewLoading,setReviewLoading]= useState(false);
  const [reviewMsg,    setReviewMsg]    = useState('');

  useEffect(() => {
    apiGetProduct(id)
      .then(r => {
        const p = r.data.product;
        setProduct(p);
        if (p.sizes?.length)  setSize(p.sizes[0]);
        if (p.colors?.length) setColor(p.colors[0]);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <LoadingView />;
  if (!product) return (
    <View style={s.center}>
      <Text style={{ color: Colors.muted }}>Product not found</Text>
    </View>
  );

  const disc   = discPct(product.originalPrice, product.price);
  const wished = isWished(product._id);

  const requireSize = () => {
    if (product.sizes?.length && !size) {
      Alert.alert('Select Size', 'Please select a size');
      return false;
    }
    return true;
  };

  const handleAddToCart = () => {
    if (!requireSize()) return;
    addToCart(product, qty, size, color);
    setAddedMsg('Added to bag! ✓');
    setTimeout(() => setAddedMsg(''), 2000);
  };

  const handleSubmitReview = async () => {
    if (!user) { Alert.alert('Sign in required', 'Please sign in to write a review.'); return; }
    if (!reviewText.trim()) { Alert.alert('Review required', 'Please write a comment.'); return; }
    setReviewLoading(true);
    setReviewMsg('');
    try {
      await apiCreateReview({ productId: product._id, rating: reviewRating, comment: reviewText.trim() });
      setReviewMsg('✓ Review submitted! Thank you.');
      setReviewText('');
      setReviewRating(5);
      // Reload product to show new review
      const r = await apiGetProduct(id);
      setProduct(r.data.product);
    } catch (e) {
      setReviewMsg(e.response?.data?.message || 'Could not submit review. Try again.');
    }
    setReviewLoading(false);
  };

  const handleBuyNow = () => {
    if (!requireSize()) return;
    addToCart(product, qty, size, color);
    nav.navigate('Cart');
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.ivory }}>
      <ScrollView showsVerticalScrollIndicator={false}>

        <ImageGallery
          images={product.images || []}
          imgIdx={imgIdx}
          setImgIdx={setImgIdx}
          wished={wished}
          onWishlist={() => toggle(product._id)}
          originalPrice={product.originalPrice}
          price={product.price}
        />

        <View style={s.body}>
          {/* Name & Price */}
          <Text style={s.category}>{product.category}</Text>
          <Text style={s.name}>{product.name}</Text>
          <View style={s.priceRow}>
            <Text style={s.price}>{fmt(product.price)}</Text>
            {product.originalPrice && (
              <Text style={s.origPrice}>{fmt(product.originalPrice)}</Text>
            )}
            {disc > 0 && (
              <View style={s.saveBadge}><Text style={s.saveText}>{disc}% OFF</Text></View>
            )}
          </View>

          {/* Rating */}
          {product.rating > 0 && (
            <View style={s.ratingRow}>
              <Text style={s.stars}>{'★'.repeat(Math.round(product.rating))}{'☆'.repeat(5 - Math.round(product.rating))}</Text>
              <Text style={s.ratingCount}>({product.numReviews} reviews)</Text>
            </View>
          )}

          <SizeSelector
            sizes={product.sizes || []}
            selected={size}
            onSelect={setSize}
          />

          <ColorSelector
            colors={product.colors || []}
            selected={color}
            onSelect={setColor}
          />

          <QuantitySelector
            qty={qty}
            stock={product.stock}
            onChange={setQty}
          />

          <DeliveryInfo />

          {/* Description */}
          {product.description && (
            <View style={s.section}>
              <Text style={s.sectionLabel}>About this product</Text>
              <Text style={s.desc}>{product.description}</Text>
            </View>
          )}

          {/* Product details */}
          {[
            product.fabric   && ['Fabric',   product.fabric],
            product.occasion && ['Occasion', product.occasion],
            product.care     && ['Care',     product.care],
            product.category && ['Category', product.category],
          ].filter(Boolean).length > 0 && (
            <View style={s.detailsCard}>
              {[
                product.fabric   && ['Fabric',   product.fabric],
                product.occasion && ['Occasion', product.occasion],
                product.care     && ['Care',     product.care],
                product.category && ['Category', product.category],
              ].filter(Boolean).map(([k, v]) => (
                <View key={k} style={s.detailRow}>
                  <Text style={s.detailKey}>{k}</Text>
                  <Text style={s.detailVal}>{v}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Reviews */}
          <View style={s.section}>
            <Text style={s.sectionLabel}>Customer Reviews</Text>
            {product.reviews?.length > 0
              ? product.reviews.map((rev, i) => <ReviewCard key={i} review={rev} />)
              : <Text style={s.noReviews}>No reviews yet. Be the first!</Text>
            }
          </View>

          {/* Write a Review */}
          <View style={s.reviewForm}>
            <Text style={s.sectionLabel}>Write a Review</Text>
            {/* Star picker */}
            <View style={s.starPicker}>
              {[1, 2, 3, 4, 5].map(n => (
                <TouchableOpacity key={n} onPress={() => setReviewRating(n)}>
                  <Text style={[s.starPick, n <= reviewRating && s.starPickActive]}>★</Text>
                </TouchableOpacity>
              ))}
              <Text style={s.starPickLabel}>{reviewRating} / 5</Text>
            </View>
            <TextInput
              style={s.reviewInput}
              placeholder="Share your experience with this product..."
              placeholderTextColor={Colors.muted}
              value={reviewText}
              onChangeText={setReviewText}
              multiline
              numberOfLines={4}
              maxLength={500}
              textAlignVertical="top"
            />
            {reviewMsg ? (
              <Text style={[s.reviewMsg, { color: reviewMsg.startsWith('✓') ? Colors.success : Colors.error }]}>
                {reviewMsg}
              </Text>
            ) : null}
            <TouchableOpacity onPress={handleSubmitReview} disabled={reviewLoading}>
              <LinearGradient colors={Colors.gradRose} style={s.reviewSubmit}>
                <Text style={s.reviewSubmitTxt}>
                  {reviewLoading ? 'Submitting…' : 'Submit Review'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <View style={{ height: 120 }} />
        </View>
      </ScrollView>

      {/* Bottom action bar */}
      <View style={s.bottomBar}>
        {addedMsg ? (
          <View style={s.addedMsg}>
            <Text style={{ color: Colors.success, fontWeight: '700' }}>{addedMsg}</Text>
          </View>
        ) : (
          <>
            <TouchableOpacity style={s.addBtn} onPress={handleAddToCart}>
              <Text style={s.addBtnText}>Add to Bag</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleBuyNow} style={{ flex: 1.5 }}>
              <LinearGradient colors={Colors.gradRose} style={s.buyBtn}>
                <Text style={s.buyBtnText}>Buy Now</Text>
              </LinearGradient>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  center:      { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.ivory },
  body:        { padding: Spacing.md },
  category:    { fontSize: 11, color: Colors.rose, fontWeight: '700', letterSpacing: 1, marginBottom: 4 },
  name:        { fontSize: 22, fontWeight: '700', color: Colors.dark, marginBottom: 10, lineHeight: 28 },
  priceRow:    { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  price:       { fontSize: 26, fontWeight: '800', color: Colors.rose },
  origPrice:   { fontSize: 16, color: Colors.muted, textDecorationLine: 'line-through' },
  saveBadge:   { backgroundColor: '#DCFCE7', borderRadius: Radius.sm, paddingHorizontal: 8, paddingVertical: 3 },
  saveText:    { color: Colors.success, fontSize: 11, fontWeight: '700' },
  ratingRow:   { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  stars:       { color: Colors.gold, fontSize: 16 },
  ratingCount: { fontSize: 12, color: Colors.muted },
  section:     { marginBottom: 18 },
  sectionLabel:{ fontSize: 11, fontWeight: '700', color: Colors.muted, letterSpacing: 0.8, textTransform: 'uppercase' },
  desc:        { fontSize: 14, color: Colors.text2, lineHeight: 22, marginTop: 8 },
  detailsCard: { backgroundColor: '#fff', borderRadius: Radius.lg, padding: Spacing.md, marginBottom: 18, ...Shadow.sm },
  detailRow:   { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.border },
  detailKey:   { fontSize: 12, color: Colors.muted, fontWeight: '600' },
  detailVal:   { fontSize: 12, color: Colors.dark, fontWeight: '600', maxWidth: '60%', textAlign: 'right' },
  bottomBar:   { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', backgroundColor: '#fff', padding: Spacing.md, gap: 10, borderTopWidth: 1, borderTopColor: Colors.border },
  addBtn:      { flex: 1, borderWidth: 2, borderColor: Colors.rose, borderRadius: Radius.lg, paddingVertical: 14, alignItems: 'center' },
  addBtnText:  { color: Colors.rose, fontSize: 14, fontWeight: '700' },
  buyBtn:      { borderRadius: Radius.lg, paddingVertical: 14, alignItems: 'center' },
  buyBtnText:  { color: '#fff', fontSize: 14, fontWeight: '700' },
  addedMsg:    { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 14 },

  noReviews:   { fontSize: 13, color: Colors.muted, fontStyle: 'italic', marginTop: 8 },
  reviewForm:  { marginBottom: 18, backgroundColor: '#fff', borderRadius: Radius.lg, padding: Spacing.md, ...Shadow.sm },
  starPicker:  { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12, marginTop: 8 },
  starPick:    { fontSize: 28, color: Colors.border },
  starPickActive:{ color: Colors.gold },
  starPickLabel: { fontSize: 12, color: Colors.muted, marginLeft: 4, fontWeight: '600' },
  reviewInput: { borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radius.md, padding: 12, fontSize: 14, color: Colors.dark, minHeight: 90, marginBottom: 10 },
  reviewMsg:   { fontSize: 12, fontWeight: '600', marginBottom: 10 },
  reviewSubmit:{ borderRadius: Radius.lg, paddingVertical: 13, alignItems: 'center' },
  reviewSubmitTxt: { color: '#fff', fontSize: 14, fontWeight: '700' },
});
