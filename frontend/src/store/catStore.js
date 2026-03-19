import { useState, useEffect } from "react";
import { DEFAULT_CAT_CONFIG } from "../constants/categories";

const CAT_STORAGE_KEY = "bv_categories_v2";

const loadCatConfig = () => {
  try {
    const saved = localStorage.getItem(CAT_STORAGE_KEY);

    // No saved data yet — use defaults
    if (!saved) return { ...DEFAULT_CAT_CONFIG };

    const parsed = JSON.parse(saved);

    // Empty object saved (all categories deleted) — respect that
    if (typeof parsed !== "object" || parsed === null) return { ...DEFAULT_CAT_CONFIG };

    // Migration: fix any categories that have old 2-char initials as icons
    const fixed = {};
    Object.entries(parsed).forEach(([cat, data]) => {
      const icon = data?.icon;
      const isInitials = icon && icon.length <= 2 && /^[A-Z]/.test(icon);
      fixed[cat] = {
        ...data,
        icon: isInitials
          ? (DEFAULT_CAT_CONFIG[cat]?.icon || "🛒")
          : icon,
      };
    });

    // Return ONLY what was saved — do NOT merge with defaults
    // This is critical: merging with defaults re-adds deleted categories on reload
    return fixed;

  } catch {
    return { ...DEFAULT_CAT_CONFIG };
  }
};

const saveCatConfig = (cfg) => {
  try {
    localStorage.setItem(CAT_STORAGE_KEY, JSON.stringify(cfg));
  } catch {}
};

let _globalCatConfig = loadCatConfig();
let _catListeners = [];

export const subscribeCat     = fn  => { _catListeners.push(fn); return () => { _catListeners = _catListeners.filter(f => f !== fn); }; };
export const updateGlobalCat  = cfg => { _globalCatConfig = cfg; saveCatConfig(cfg); _catListeners.forEach(fn => fn(cfg)); };
export const useCatConfig     = ()  => { const [cfg, setCfg] = useState(_globalCatConfig); useEffect(() => subscribeCat(setCfg), []); return cfg; };
export const getGlobalCatConfig = () => _globalCatConfig;
