// ── Format rupees ─────────────────────────────────────────────────────────────
export const fmt = (n) => '₹' + Number(n || 0).toLocaleString('en-IN');

// ── Discount percentage ───────────────────────────────────────────────────────
export const discPct = (orig, price) =>
  orig && price && orig > price ? Math.round((1 - price / orig) * 100) : 0;

// ── Get first product image URL ───────────────────────────────────────────────
export const getImageUrl = (product) => {
  if (!product) return null;
  const imgs = product.images;
  if (Array.isArray(imgs) && imgs.length > 0) {
    const first = imgs[0];
    return typeof first === 'string' ? first : first?.url || null;
  }
  return product.image || null;
};

// ── Truncate text ─────────────────────────────────────────────────────────────
export const truncate = (str, n = 50) =>
  str && str.length > n ? str.substring(0, n) + '...' : str;

// ── Star rating array ─────────────────────────────────────────────────────────
export const starArray = (rating) =>
  Array.from({ length: 5 }, (_, i) => i < Math.round(rating) ? 'full' : 'empty');

// ── Order status config ───────────────────────────────────────────────────────
export const ORDER_STATUS = {
  pending:    { label: 'Order Placed',     color: '#D97706', bg: '#FEF3C7', icon: '🕐' },
  processing: { label: 'Being Prepared',   color: '#2563EB', bg: '#EFF6FF', icon: '⚙️' },
  shipped:    { label: 'Out for Delivery', color: '#7C3AED', bg: '#F5F3FF', icon: '🚚' },
  delivered:  { label: 'Delivered',        color: '#16A34A', bg: '#F0FDF4', icon: '✅' },
  cancelled:  { label: 'Cancelled',        color: '#DC2626', bg: '#FEF2F2', icon: '❌' },
};
