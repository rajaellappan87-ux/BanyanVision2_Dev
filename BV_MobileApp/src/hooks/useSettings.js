import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiGetConfig } from '../api';

const SETTINGS_KEY = 'bv_mobile_settings_v1';

const DEFAULT_SETTINGS = {
  phone:           '',
  whatsapp:        '',
  whatsappMsg:     'Hi BanyanVision! I need help.',
  shippingCharge:  99,
  freeShippingAbove: 2000,
  expressCharge:   199,
  standardDays:    '3–5 business days',
  expressDays:     '1–2 business days',
  returnsEnabled:  false,
  returnDays:      7,
};

export const useSettings = () => {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);

  useEffect(() => {
    // Load from cache immediately
    AsyncStorage.getItem(SETTINGS_KEY).then(s => {
      if (s) {
        try { setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(s) }); } catch {}
      }
    });

    // Fetch fresh from backend (same /api/config/settings as website)
    apiGetConfig('settings')
      .then(res => {
        const val = res?.data?.value;
        if (val && typeof val === 'object') {
          const merged = { ...DEFAULT_SETTINGS, ...val };
          setSettings(merged);
          AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(merged)).catch(() => {});
        }
      })
      .catch(() => {});
  }, []);

  return settings;
};
