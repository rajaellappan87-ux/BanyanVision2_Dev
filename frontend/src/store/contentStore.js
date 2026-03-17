import { useState, useEffect } from "react";
import { DEFAULT_PROMO, DEFAULT_ABOUT, DEFAULT_SETTINGS } from "../constants/defaults";

const loadJSON = (key, def) => { try { const s=localStorage.getItem(key); return s?{...def,...JSON.parse(s)}:def; } catch { return def; } };
const saveJSON = (key, val) => { try { localStorage.setItem(key, JSON.stringify(val)); } catch {} };

// ── Promo ──────────────────────────────────────────────────────────────────────
const PROMO_KEY = "bv_promo_v1";
let _promoData = loadJSON(PROMO_KEY, DEFAULT_PROMO);
let _promoListeners = [];
const subscribePromo = fn => { _promoListeners.push(fn); return () => { _promoListeners = _promoListeners.filter(f => f !== fn); }; };
export const updatePromo = v => { _promoData=v; saveJSON(PROMO_KEY,v); _promoListeners.forEach(f=>f(v)); };
export const usePromoData = () => { const [d,setD]=useState(_promoData); useEffect(()=>subscribePromo(setD),[]); return d; };

// ── About ──────────────────────────────────────────────────────────────────────
const ABOUT_KEY = "bv_about_v1";
let _aboutData = loadJSON(ABOUT_KEY, DEFAULT_ABOUT);
if (_aboutData.features && _aboutData.features.some(f => typeof f.icon !== "string")) {
  _aboutData.features = DEFAULT_ABOUT.features;
  saveJSON(ABOUT_KEY, _aboutData);
}
let _aboutListeners = [];
const subscribeAbout = fn => { _aboutListeners.push(fn); return () => { _aboutListeners = _aboutListeners.filter(f => f !== fn); }; };
export const updateAbout = v => { _aboutData=v; saveJSON(ABOUT_KEY,v); _aboutListeners.forEach(f=>f(v)); };
export const useAboutData = () => { const [d,setD]=useState(_aboutData); useEffect(()=>subscribeAbout(setD),[]); return d; };

// ── Settings ───────────────────────────────────────────────────────────────────
const SETTINGS_KEY = "bv_settings_v1";
export let _settings = loadJSON(SETTINGS_KEY, DEFAULT_SETTINGS);
let _settingsListeners = [];
const subscribeSettings = fn => { _settingsListeners.push(fn); return () => { _settingsListeners = _settingsListeners.filter(f => f !== fn); }; };
export const updateSettings = v => { _settings=v; saveJSON(SETTINGS_KEY,v); _settingsListeners.forEach(f=>f(v)); };
export const useSettings = () => { const [d,setD]=useState(_settings); useEffect(()=>subscribeSettings(setD),[]); return d; };
