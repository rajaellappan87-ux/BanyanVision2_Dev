import { useState, useEffect } from "react";
import { DEFAULT_PROMO, DEFAULT_ABOUT, DEFAULT_SETTINGS } from "../constants/defaults";
import { apiGetConfig, apiSaveConfig } from "../api";

// ── Generic persistent store factory ─────────────────────────────────────────
// Priority order (highest wins):
//   1. MongoDB (source of truth — loaded async on mount)
//   2. localStorage (instant cache — used while DB loads)
//   3. DEFAULT values (only used on very first launch, never overwrite saved data)
const makeStore = (dbKey, lsKey, defaultVal) => {

  // Load from localStorage — returns null if nothing saved yet
  const loadLocal = () => {
    try {
      const s = localStorage.getItem(lsKey);
      if (!s) return null; // nothing saved — caller should use defaultVal
      const parsed = JSON.parse(s);
      // Only return if it looks like real saved data (has at least one key)
      return parsed && typeof parsed === "object" && Object.keys(parsed).length > 0
        ? parsed
        : null;
    } catch { return null; }
  };

  const saveLocal = (v) => {
    try { localStorage.setItem(lsKey, JSON.stringify(v)); } catch {}
  };

  // Start from localStorage if available, otherwise use defaults
  // NEVER merge with defaults — saved data is kept as-is
  let _data      = loadLocal() || { ...defaultVal };
  let _listeners = [];

  const notify = () => _listeners.forEach(fn => fn({ ..._data }));

  const subscribe = fn => {
    _listeners.push(fn);
    return () => { _listeners = _listeners.filter(f => f !== fn); };
  };

  // Save to DB + localStorage
  const update = async (val) => {
    _data = { ...val };
    saveLocal(_data);
    notify();
    try {
      await apiSaveConfig(dbKey, val);
    } catch (e) {
      console.warn(`[${dbKey}] DB save failed (changes kept in localStorage):`, e.message);
    }
  };

  // Load from DB — overwrites local only if DB has real data
  const loadFromDB = async () => {
    try {
      const res = await apiGetConfig(dbKey);
      const dbVal = res?.data?.value;
      // Only update if DB returned real data
      if (dbVal && typeof dbVal === "object" && Object.keys(dbVal).length > 0) {
        _data = { ...dbVal }; // DB is source of truth — do NOT merge with defaults
        saveLocal(_data);
        notify();
      }
      // If DB returns null (first launch), keep localStorage/defaults — do nothing
    } catch {
      // Network error — keep localStorage data silently
    }
  };

  // React hook — shows local data instantly, syncs DB in background
  const useStore = () => {
    const [d, setD] = useState({ ..._data });
    useEffect(() => {
      loadFromDB(); // background DB sync
      return subscribe(setD);
    }, []);
    return d;
  };

  return { update, useStore, loadFromDB, getData: () => ({ ..._data }) };
};

// ── Promo Banner ──────────────────────────────────────────────────────────────
const promoStore   = makeStore("promo",    "bv_promo_v1",    DEFAULT_PROMO);
export const updatePromo  = promoStore.update;
export const usePromoData = promoStore.useStore;

// ── About Page ────────────────────────────────────────────────────────────────
const aboutStore   = makeStore("about",    "bv_about_v1",    DEFAULT_ABOUT);
export const updateAbout  = aboutStore.update;
export const useAboutData = aboutStore.useStore;

// ── Site Settings ─────────────────────────────────────────────────────────────
const settingsStore  = makeStore("settings", "bv_settings_v1", DEFAULT_SETTINGS);
export const updateSettings = settingsStore.update;
export const useSettings    = settingsStore.useStore;

// _settings kept for backward compatibility — use useSettings() in components
export const _settings = DEFAULT_SETTINGS;
