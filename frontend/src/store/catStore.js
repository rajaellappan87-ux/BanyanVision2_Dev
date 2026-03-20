import { useState, useEffect } from "react";
import { DEFAULT_CAT_CONFIG } from "../constants/categories";
import { apiGetConfig, apiSaveConfig } from "../api";

const CAT_KEY = "categories";
const LS_KEY  = "bv_categories_v2"; // localStorage fallback

// ── Load from localStorage (instant, used while DB loads) ────────────────────
const loadLocal = () => {
  try {
    const saved = localStorage.getItem(LS_KEY);
    if (!saved) return { ...DEFAULT_CAT_CONFIG };
    const parsed = JSON.parse(saved);
    if (typeof parsed !== "object" || parsed === null) return { ...DEFAULT_CAT_CONFIG };
    // Migrate old 2-char initials
    const fixed = {};
    Object.entries(parsed).forEach(([cat, data]) => {
      const icon = data?.icon;
      const isInitials = icon && icon.length <= 2 && /^[A-Z]/.test(icon);
      fixed[cat] = { ...data, icon: isInitials ? (DEFAULT_CAT_CONFIG[cat]?.icon || "🛒") : icon };
    });
    return fixed;
  } catch { return { ...DEFAULT_CAT_CONFIG }; }
};

const saveLocal = (cfg) => {
  try { localStorage.setItem(LS_KEY, JSON.stringify(cfg)); } catch {}
};

// ── In-memory state ───────────────────────────────────────────────────────────
let _globalCatConfig = loadLocal();
let _catListeners    = [];

const notify = () => _catListeners.forEach(fn => fn({ ..._globalCatConfig }));

export const subscribeCat      = fn  => { _catListeners.push(fn); return () => { _catListeners = _catListeners.filter(f => f !== fn); }; };
export const getGlobalCatConfig = () => _globalCatConfig;

// ── Save to both DB and localStorage ─────────────────────────────────────────
export const updateGlobalCat = async (cfg) => {
  _globalCatConfig = cfg;
  saveLocal(cfg);
  notify();
  try { await apiSaveConfig(CAT_KEY, cfg); } catch (e) { console.warn("Config save failed:", e.message); }
};

// ── On app start: load from DB and sync ──────────────────────────────────────
export const loadCatConfigFromDB = async () => {
  try {
    const res = await apiGetConfig(CAT_KEY);
    if (res?.data?.value && typeof res.data.value === "object") {
      _globalCatConfig = res.data.value;
      saveLocal(res.data.value);
      notify();
    }
  } catch { /* use localStorage fallback silently */ }
};

// ── React hook ────────────────────────────────────────────────────────────────
export const useCatConfig = () => {
  const [cfg, setCfg] = useState(_globalCatConfig);
  useEffect(() => {
    loadCatConfigFromDB(); // sync from DB on mount
    return subscribeCat(setCfg);
  }, []);
  return cfg;
};
