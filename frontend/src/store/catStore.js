import { useState, useEffect } from "react";
import { DEFAULT_CAT_CONFIG } from "../constants/categories";

const CAT_STORAGE_KEY = "bv_categories_v2";

const loadCatConfig = () => {
  try {
    const saved = localStorage.getItem(CAT_STORAGE_KEY);
    if (!saved) return DEFAULT_CAT_CONFIG;
    const parsed = JSON.parse(saved);
    const merged = { ...DEFAULT_CAT_CONFIG };
    Object.keys(parsed).forEach(cat => {
      const icon = parsed[cat]?.icon;
      const isInitials = icon && icon.length <= 2 && /^[A-Z]/.test(icon);
      merged[cat] = {
        ...(DEFAULT_CAT_CONFIG[cat] || {}),
        ...parsed[cat],
        icon: isInitials ? (DEFAULT_CAT_CONFIG[cat]?.icon || parsed[cat].icon) : icon,
      };
    });
    return merged;
  } catch { return DEFAULT_CAT_CONFIG; }
};

const saveCatConfig = (cfg) => {
  try { localStorage.setItem(CAT_STORAGE_KEY, JSON.stringify(cfg)); } catch {}
};

let _globalCatConfig = loadCatConfig();
let _catListeners = [];
export const subscribeCat = fn => { _catListeners.push(fn); return () => { _catListeners = _catListeners.filter(f => f !== fn); }; };
export const updateGlobalCat = (cfg) => { _globalCatConfig = cfg; saveCatConfig(cfg); _catListeners.forEach(fn => fn(cfg)); };
export const useCatConfig = () => { const [cfg,setCfg] = useState(_globalCatConfig); useEffect(() => subscribeCat(setCfg), []); return cfg; };
export const getGlobalCatConfig = () => _globalCatConfig;
