// ── BanyanVision Mobile Theme ──────────────────────────────────────────────────
// Mirrors the website CSS variables exactly

export const Colors = {
  // Brand
  rose:      '#C2185B',
  saffron:   '#E65100',
  teal:      '#00695C',
  purple:    '#6A1B9A',
  gold:      '#F9A825',

  // Backgrounds
  ivory:     '#FDF8F3',
  ivory2:    '#F5EFE8',
  ivory3:    '#EDE4D8',

  // Text
  dark:      '#1A0A00',
  text:      '#2D1A0A',
  text2:     '#5C3A1E',
  muted:     '#9C7A5A',

  // UI
  border:    '#E8D5C4',
  border2:   '#D4B89A',
  white:     '#FFFFFF',

  // Status
  success:   '#16A34A',
  error:     '#DC2626',
  warning:   '#D97706',
  info:      '#2563EB',

  // Gradients (use with LinearGradient)
  gradRose:    ['#C2185B', '#E65100'],
  gradSaffron: ['#E65100', '#F9A825'],
  gradDark:    ['#1A0A00', '#3D1500'],
  gradTeal:    ['#00695C', '#26A69A'],
};

export const Fonts = {
  display:  'PlayfairDisplay-Bold',
  body:     'DMSans-Regular',
  medium:   'DMSans-Medium',
  bold:     'DMSans-Bold',
};

export const Spacing = {
  xs:   4,
  sm:   8,
  md:   16,
  lg:   24,
  xl:   32,
  xxl:  48,
};

export const Radius = {
  sm:   8,
  md:   12,
  lg:   16,
  xl:   20,
  full: 999,
};

export const Shadow = {
  sm: {
    shadowColor: '#1A0A00',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#C2185B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 12,
    elevation: 4,
  },
  lg: {
    shadowColor: '#C2185B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
};
