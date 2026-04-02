import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet,
  RefreshControl, TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Colors, Spacing, Radius, Shadow } from '../constants/theme';
import { fmt, ORDER_STATUS } from '../utils/helpers';
import { useAuth } from '../context/AuthContext';
import { apiGetMyOrders } from '../api';
import AuthPrompt  from '../components/common/AuthPrompt';
import EmptyState  from '../components/common/EmptyState';
import LoadingView from '../components/common/LoadingView';

// Progress steps for active orders (excludes cancelled)
const STEPS = [
  { key: 'pending',    icon: '🕐', label: 'Order Placed' },
  { key: 'processing', icon: '⚙️', label: 'Preparing' },
  { key: 'shipped',    icon: '🚚', label: 'On the Way' },
  { key: 'delivered',  icon: '✅', label: 'Delivered' },
];
const STEP_INDEX = { pending: 0, processing: 1, shipped: 2, delivered: 3 };

function DeliveryTracker({ status }) {
  const current = STEP_INDEX[status] ?? 0;
  return (
    <View style={t.wrap}>
      {STEPS.map((step, i) => {
        const done    = i < current;
        const active  = i === current;
        return (
          <View key={step.key} style={t.stepWrap}>
            {/* Connector line before */}
            {i > 0 && (
              <View style={[t.line, done || active ? t.lineDone : t.lineEmpty]} />
            )}
            <View style={[t.circle, active && t.circleActive, done && t.circleDone]}>
              <Text style={t.circleIcon}>{step.icon}</Text>
            </View>
            <Text style={[t.stepLabel, active && t.stepLabelActive]}>{step.label}</Text>
          </View>
        );
      })}
    </View>
  );
}

export default function OrdersScreen() {
  const nav  = useNavigation();
  const { user } = useAuth();
  const [orders,     setOrders]     = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expanded,   setExpanded]   = useState({});

  const load = useCallback(async () => {
    try {
      const r = await apiGetMyOrders();
      setOrders(r.data.orders || []);
    } catch {}
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { if (user) load(); else setLoading(false); }, [user]);
  const onRefresh = () => { setRefreshing(true); load(); };

  const toggleExpand = (id) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

  if (!user)           return <AuthPrompt icon="📦" message="Sign in to view your order history" />;
  if (loading)         return <LoadingView />;
  if (orders.length === 0) {
    return (
      <EmptyState
        icon="📦"
        title="No orders yet"
        subtitle="Your order history will appear here"
        btnLabel="Start Shopping"
        onPress={() => nav.navigate('Shop')}
      />
    );
  }

  const renderOrder = ({ item: ord }) => {
    const sc      = ORDER_STATUS[ord.status] || ORDER_STATUS.pending;
    const shortId = ord._id.toString().slice(-8).toUpperCase();
    const isCancelled = ord.status === 'cancelled';
    const showTracker = !isCancelled;
    const isExpanded  = expanded[ord._id];

    return (
      <View style={s.orderCard}>
        {/* Header */}
        <View style={s.orderTop}>
          <View>
            <Text style={s.orderId}>#{shortId}</Text>
            <Text style={s.orderDate}>
              {new Date(ord.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </Text>
          </View>
          <View style={[s.statusBadge, { backgroundColor: sc.bg }]}>
            <Text style={[s.statusText, { color: sc.color }]}>{sc.icon} {sc.label}</Text>
          </View>
        </View>

        {/* Cancelled alert */}
        {isCancelled && (
          <View style={s.cancelAlert}>
            <Text style={s.cancelAlertTxt}>
              ❌ This order was cancelled. For help, contact support.
            </Text>
          </View>
        )}

        {/* Delivery progress tracker */}
        {showTracker && <DeliveryTracker status={ord.status} />}

        {/* Status message */}
        {!isCancelled && (
          <Text style={s.statusMsg}>
            {ord.status === 'pending'    && '⏳ Your order has been placed and is awaiting confirmation.'}
            {ord.status === 'processing' && '🏭 Your items are being carefully prepared by our artisans.'}
            {ord.status === 'shipped'    && '🚀 Your package is on its way! Track your delivery soon.'}
            {ord.status === 'delivered'  && '🎉 Order delivered! We hope you love your purchase.'}
          </Text>
        )}

        {/* Items list */}
        <View style={s.itemsList}>
          {(isExpanded ? ord.items : ord.items.slice(0, 2)).map((it, i) => (
            <View key={i} style={s.itemRow}>
              <Text style={s.itemDot}>•</Text>
              <Text style={s.itemLine} numberOfLines={1}>
                {it.name}{it.size ? ` (${it.size})` : ''}{it.color ? ` · ${it.color}` : ''} × {it.qty}
              </Text>
              <Text style={s.itemPrice}>{fmt(it.price * it.qty)}</Text>
            </View>
          ))}
          {ord.items.length > 2 && (
            <TouchableOpacity onPress={() => toggleExpand(ord._id)}>
              <Text style={s.toggleItems}>
                {isExpanded ? '▲ Show less' : `▼ +${ord.items.length - 2} more items`}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Footer */}
        <View style={s.orderBottom}>
          <View>
            <Text style={s.orderTotal}>{fmt(ord.total)}</Text>
            <Text style={s.orderPayment}>
              {ord.paymentId ? '💳 Paid via Razorpay' : '💵 Cash on Delivery'}
            </Text>
          </View>
          {ord.discount > 0 && (
            <View style={s.savedBadge}>
              <Text style={s.savedText}>Saved {fmt(ord.discount)}</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <FlatList
      data={orders}
      keyExtractor={o => o._id}
      contentContainerStyle={{ padding: Spacing.md, paddingBottom: 40 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.rose} />}
      renderItem={renderOrder}
      showsVerticalScrollIndicator={false}
      ListHeaderComponent={
        <Text style={s.header}>My Orders ({orders.length})</Text>
      }
    />
  );
}

// Tracker styles
const t = StyleSheet.create({
  wrap:           { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12, paddingVertical: 12, borderTopWidth: 1, borderBottomWidth: 1, borderColor: Colors.border },
  stepWrap:       { flex: 1, alignItems: 'center', position: 'relative' },
  line:           { position: 'absolute', top: 14, right: '50%', left: '-50%', height: 2, zIndex: 0 },
  lineDone:       { backgroundColor: Colors.rose },
  lineEmpty:      { backgroundColor: Colors.border },
  circle:         { width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.ivory2, borderWidth: 2, borderColor: Colors.border, justifyContent: 'center', alignItems: 'center', zIndex: 1 },
  circleActive:   { borderColor: Colors.rose, backgroundColor: '#FFF0F5' },
  circleDone:     { borderColor: Colors.rose, backgroundColor: Colors.rose },
  circleIcon:     { fontSize: 12 },
  stepLabel:      { fontSize: 9, color: Colors.muted, fontWeight: '600', textAlign: 'center', marginTop: 4, letterSpacing: 0.2 },
  stepLabelActive:{ color: Colors.rose },
});

const s = StyleSheet.create({
  header:       { fontSize: 22, fontWeight: '700', color: Colors.dark, marginBottom: 14 },
  orderCard:    { backgroundColor: '#fff', borderRadius: Radius.lg, padding: Spacing.md, marginBottom: 12, ...Shadow.sm },
  orderTop:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  orderId:      { fontSize: 15, fontWeight: '800', color: Colors.dark, fontFamily: 'monospace', letterSpacing: 1 },
  orderDate:    { fontSize: 12, color: Colors.muted, marginTop: 3 },
  statusBadge:  { borderRadius: Radius.full, paddingHorizontal: 12, paddingVertical: 5 },
  statusText:   { fontSize: 11, fontWeight: '700', letterSpacing: 0.3 },

  cancelAlert:     { backgroundColor: '#FEF2F2', borderRadius: Radius.md, padding: 12, marginBottom: 12 },
  cancelAlertTxt:  { fontSize: 13, color: '#DC2626', lineHeight: 20 },

  statusMsg:    { fontSize: 12, color: Colors.text2, lineHeight: 18, marginBottom: 10, fontStyle: 'italic' },

  itemsList:    { borderTopWidth: 1, borderBottomWidth: 1, borderColor: Colors.border, paddingVertical: 10, marginBottom: 10 },
  itemRow:      { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  itemDot:      { fontSize: 10, color: Colors.muted },
  itemLine:     { flex: 1, fontSize: 12, color: Colors.text2, lineHeight: 20 },
  itemPrice:    { fontSize: 12, color: Colors.dark, fontWeight: '700' },
  moreItems:    { fontSize: 11, color: Colors.muted, marginTop: 2 },
  toggleItems:  { fontSize: 11, color: Colors.rose, fontWeight: '600', marginTop: 4 },

  orderBottom:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  orderTotal:   { fontSize: 20, fontWeight: '800', color: Colors.rose },
  orderPayment: { fontSize: 11, color: Colors.muted, marginTop: 2 },
  savedBadge:   { backgroundColor: '#DCFCE7', borderRadius: Radius.sm, paddingHorizontal: 8, paddingVertical: 3 },
  savedText:    { fontSize: 10, color: Colors.success, fontWeight: '700' },
});
