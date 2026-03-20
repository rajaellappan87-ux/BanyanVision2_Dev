import { useState, useEffect } from "react";
import { DEFAULT_PROMO, DEFAULT_ABOUT, DEFAULT_SETTINGS, DEFAULT_MARQUEE, DEFAULT_TOPBAR } from "../constants/defaults";
import { apiGetConfig, apiSaveConfig } from "../api";

// ── Pending save queue ────────────────────────────────────────────────────────
// If DB save fails (backend down), queue it and retry automatically
const _pendingQueue = {}; // { dbKey: { val, retries } }
let _retryTimer = null;

const schedulePendingRetry = () => {
  if (_retryTimer) return; // already scheduled
  _retryTimer = setInterval(async () => {
    const keys = Object.keys(_pendingQueue);
    if (keys.length === 0) {
      clearInterval(_retryTimer);
      _retryTimer = null;
      return;
    }
    for (const key of keys) {
      try {
        await apiSaveConfig(key, _pendingQueue[key].val);
        delete _pendingQueue[key];
        console.info(`[${key}] ✅ DB sync recovered — saved successfully`);
      } catch {
        _pendingQueue[key].retries = (_pendingQueue[key].retries || 0) + 1;
        // Give up after 20 retries (~10 min) to avoid infinite loop
        if (_pendingQueue[key].retries > 20) {
          console.warn(`[${key}] Gave up retrying after 20 attempts`);
          delete _pendingQueue[key];
        }
      }
    }
  }, 30000); // retry every 30 seconds
};

// ── Generic persistent store factory ─────────────────────────────────────────
// Priority:  MongoDB (source of truth) → localStorage (instant cache) → defaults
const makeStore = (dbKey, lsKey, defaultVal) => {

  const loadLocal = () => {
    try {
      const s = localStorage.getItem(lsKey);
      if (!s) return null;
      const parsed = JSON.parse(s);
      return parsed && typeof parsed === "object" && Object.keys(parsed).length > 0
        ? parsed : null;
    } catch { return null; }
  };

  const saveLocal = (v) => {
    try { localStorage.setItem(lsKey, JSON.stringify(v)); } catch {}
  };

  let _data      = loadLocal() || { ...defaultVal };
  let _listeners = [];
  let _dbSynced  = false; // track if we have successfully saved to DB

  const notify = () => _listeners.forEach(fn => fn({ ..._data }));

  const subscribe = fn => {
    _listeners.push(fn);
    return () => { _listeners = _listeners.filter(f => f !== fn); };
  };

  // ── Save: always saves to localStorage instantly, then tries DB ────────────
  const update = async (val) => {
    _data = { ...val };
    saveLocal(_data);
    notify();

    try {
      await apiSaveConfig(dbKey, val);
      _dbSynced = true;
      // Remove from pending queue if it was there
      delete _pendingQueue[dbKey];
      return { saved: true, db: true };
    } catch (e) {
      const reason = e?.response?.status
        ? `Server error ${e.response.status}: ${e.response.data?.message || e.message}`
        : "Backend not reachable — will retry automatically";

      console.warn(`[${dbKey}] DB save failed — ${reason}`);

      // Queue for automatic retry
      _pendingQueue[dbKey] = { val, retries: 0 };
      schedulePendingRetry();

      return { saved: true, db: false, error: reason };
    }
  };

  // ── Load from DB on mount ─────────────────────────────────────────────────
  const loadFromDB = async () => {
    try {
      const res = await apiGetConfig(dbKey);
      const dbVal = res?.data?.value;
      if (dbVal && typeof dbVal === "object" && Object.keys(dbVal).length > 0) {
        _data = { ...dbVal };
        saveLocal(_data);
        _dbSynced = true;
        notify();
      }
    } catch {
      // Backend not running — use localStorage silently
    }
  };

  // ── React hook ────────────────────────────────────────────────────────────
  const useStore = () => {
    const [d, setD] = useState({ ..._data });
    useEffect(() => {
      loadFromDB();
      return subscribe(setD);
    }, []);
    return d;
  };

  return {
    update,
    useStore,
    loadFromDB,
    getData:    () => ({ ..._data }),
    isDbSynced: () => _dbSynced,
    hasPending: () => !!_pendingQueue[dbKey],
  };
};

// ── Promo Banner ──────────────────────────────────────────────────────────────
const promoStore    = makeStore("promo",    "bv_promo_v1",    DEFAULT_PROMO);
export const updatePromo   = promoStore.update;
export const usePromoData  = promoStore.useStore;

// ── About Page ────────────────────────────────────────────────────────────────
const aboutStore    = makeStore("about",    "bv_about_v1",    DEFAULT_ABOUT);
export const updateAbout   = aboutStore.update;
export const useAboutData  = aboutStore.useStore;

// ── Site Settings ─────────────────────────────────────────────────────────────
export const settingsStore  = makeStore("settings", "bv_settings_v1", DEFAULT_SETTINGS);
export const updateSettings = settingsStore.update;
export const useSettings    = settingsStore.useStore;

// ── Marquee Banner ────────────────────────────────────────────────────────────
const marqueeStore  = makeStore("marquee",  "bv_marquee_v1",  DEFAULT_MARQUEE);
export const updateMarquee  = marqueeStore.update;
export const useMarqueeData = marqueeStore.useStore;

// ── Top Announcement Bar ──────────────────────────────────────────────────────
const topbarStore   = makeStore("topbar",   "bv_topbar_v1",   DEFAULT_TOPBAR);
export const updateTopbar   = topbarStore.update;
export const useTopbarData  = topbarStore.useStore;

// _settings kept for backward compatibility
export const _settings = DEFAULT_SETTINGS;
