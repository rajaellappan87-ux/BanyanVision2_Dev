import React, { useState, useEffect, useRef } from "react";
import { useBreakpoint } from "../hooks";
import { Ic } from "../utils/helpers";
import { AlertTriangle, AlertCircle, CheckCircle, Info, RefreshCw, Search, Trash2, Download, ChevronDown, ChevronUp, Filter, X } from "lucide-react";
import { apiGetLogs, apiGetLogStats, apiClearLogs } from "../api";

// ── Constants ─────────────────────────────────────────────
const LEVELS  = ["all","info","warn","error","fatal","debug"];
const CATS    = ["all","app","db","auth","payment","email","storage","api","frontend","system","security"];
const SOURCES = ["all","backend","frontend"];
const LIMIT   = 100;

const LEVEL_STYLE = {
  info:  { bg:"#EFF6FF", color:"#1D4ED8", border:"#BFDBFE" },
  warn:  { bg:"#FFFBEB", color:"#B45309", border:"#FDE68A" },
  error: { bg:"#FEF2F2", color:"#DC2626", border:"#FECACA" },
  fatal: { bg:"#FFF0F3", color:"#9F1239", border:"#FECDD3" },
  debug: { bg:"#F5F3FF", color:"#6D28D9", border:"#DDD6FE" },
};

const LEVEL_ICON = {
  info: Info, warn: AlertTriangle,
  error: AlertCircle, fatal: AlertCircle, debug: CheckCircle,
};

const CAT_COLOR = {
  app:"#C2185B", db:"#0369A1", auth:"#7C3AED", payment:"#D97706",
  email:"#0891B2", storage:"#0D9488", api:"#6D28D9", frontend:"#BE185D",
  system:"#374151", security:"#DC2626",
};

const relTime = (d) => {
  const s = Math.floor((Date.now() - new Date(d)) / 1000);
  if (s < 60)    return `${s}s ago`;
  if (s < 3600)  return `${Math.floor(s/60)}m ago`;
  if (s < 86400) return `${Math.floor(s/3600)}h ago`;
  return new Date(d).toLocaleDateString("en-IN");
};

const fmtTime = (d) => new Date(d).toLocaleString("en-IN", { dateStyle:"short", timeStyle:"medium" });

// ── Log Row ───────────────────────────────────────────────
const LogRow = ({ log: l }) => {
  const [open, setOpen] = useState(false);
  const st      = LEVEL_STYLE[l.level] || LEVEL_STYLE.info;
  const catCol  = CAT_COLOR[l.category] || "#555";

  return (
    <div style={{ borderBottom:"1px solid var(--border)", background: open ? "var(--ivory2)" : "#fff" }}>
      <div onClick={() => setOpen(o => !o)}
        style={{ display:"grid", gridTemplateColumns:"90px 90px 110px 1fr 100px 24px",
                 gap:8, alignItems:"center", padding:"10px 14px", cursor:"pointer" }}>

        <div style={{ display:"flex", alignItems:"center", gap:5 }}>
          <div style={{ width:7, height:7, borderRadius:"50%", background:st.color, flexShrink:0 }}/>
          <span style={{ fontSize:11, fontWeight:700, color:st.color, textTransform:"uppercase", letterSpacing:.5 }}>
            {l.level}
          </span>
        </div>

        <span style={{ fontSize:11, fontWeight:700, color:catCol, background:catCol+"18",
                        padding:"2px 8px", borderRadius:6, textAlign:"center",
                        textTransform:"uppercase", letterSpacing:.3 }}>
          {l.category}
        </span>

        <span style={{ fontSize:11, color:"var(--muted)", fontWeight:500 }}>
          {l.source === "frontend" ? "🌐 Browser" : "⚙️ Server"}
        </span>

        <span style={{ fontSize:13, color:"var(--text)", fontWeight:500,
                        overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
          {l.message}
        </span>

        <span style={{ fontSize:11, color:"var(--muted)", textAlign:"right" }} title={fmtTime(l.createdAt)}>
          {relTime(l.createdAt)}
        </span>

        <Ic icon={open ? ChevronUp : ChevronDown} size={13} color="var(--muted)"/>
      </div>

      {open && (
        <div style={{ padding:"12px 18px 16px", background:"var(--ivory2)", borderTop:"1px solid var(--border)" }}>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))", gap:10, marginBottom:12 }}>
            {[
              ["Time",     fmtTime(l.createdAt)],
              l.userEmail && ["User",     l.userEmail],
              l.ip        && ["IP",       l.ip],
              l.path      && ["Path",     `${l.method||""} ${l.path}`],
              l.statusCode&& ["Status",   l.statusCode],
              l.duration  && ["Duration", `${l.duration}ms`],
              ["Env",      l.env],
            ].filter(Boolean).map(([k, v]) => (
              <div key={k}>
                <div style={{ fontSize:10, color:"var(--muted)", fontWeight:700, letterSpacing:.5, marginBottom:2 }}>{k}</div>
                <div style={{ fontSize:12, color:"var(--text)", fontWeight:500, wordBreak:"break-all" }}>{String(v)}</div>
              </div>
            ))}
          </div>

          {l.details && Object.keys(l.details).length > 0 && (
            <div style={{ marginBottom:10 }}>
              <div style={{ fontSize:10, color:"var(--muted)", fontWeight:700, marginBottom:4 }}>DETAILS</div>
              <pre style={{ fontSize:11, background:"#fff", border:"1px solid var(--border)",
                             borderRadius:8, padding:"8px 12px", overflow:"auto",
                             margin:0, maxHeight:180, color:"var(--text)" }}>
                {JSON.stringify(l.details, null, 2)}
              </pre>
            </div>
          )}

          {l.stack && (
            <div>
              <div style={{ fontSize:10, color:"#DC2626", fontWeight:700, marginBottom:4 }}>STACK TRACE</div>
              <pre style={{ fontSize:10, background:"#FEF2F2", border:"1px solid #FECACA",
                             borderRadius:8, padding:"8px 12px", overflow:"auto",
                             margin:0, maxHeight:180, color:"#991B1B", whiteSpace:"pre-wrap" }}>
                {l.stack}
              </pre>
            </div>
          )}

          <div style={{ fontSize:10, color:"var(--muted)", marginTop:8 }}>ID: {l._id}</div>
        </div>
      )}
    </div>
  );
};

// ══════════════════════════════════════════════════════════
const LogViewer = ({ toast }) => {
  const { isMobile } = useBreakpoint();

  // Data
  const [logs,    setLogs]    = useState([]);
  const [stats,   setStats]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [total,   setTotal]   = useState(0);
  const [page,    setPage]    = useState(1);

  // Filter state — NOT connected to useEffect directly
  // Filters only apply when user clicks Apply or presses Enter
  const [level,    setLevel]    = useState("all");
  const [category, setCategory] = useState("all");
  const [source,   setSource]   = useState("all");
  const [search,   setSearch]   = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo,   setDateTo]   = useState("");

  // Applied filters — what was last fetched with
  const [applied, setApplied] = useState({
    level:"all", category:"all", source:"all",
    search:"", dateFrom:"", dateTo:"",
  });

  const [autoRefresh, setAutoRefresh] = useState(false);
  const timerRef = useRef(null);

  // ── Core fetch — uses applied filters, not live state ──
  const fetchLogs = async (pg = 1, overrideFilters = null) => {
    setLoading(true);
    try {
      const f = overrideFilters || applied;
      const params = { page: pg, limit: LIMIT };
      if (f.level    !== "all") params.level    = f.level;
      if (f.category !== "all") params.category = f.category;
      if (f.source   !== "all") params.source   = f.source;
      if (f.search)              params.search   = f.search;
      if (f.dateFrom)            params.from     = f.dateFrom;
      if (f.dateTo)              params.to       = f.dateTo;

      const [logsRes, statsRes] = await Promise.all([
        apiGetLogs(params),
        apiGetLogStats(),
      ]);

      setLogs(logsRes.data.logs || []);
      setTotal(logsRes.data.total || 0);
      setStats(statsRes.data);
      setPage(pg);
    } catch (e) {
      toast("Failed to load logs — " + (e.response?.data?.message || e.message));
    } finally {
      setLoading(false);
    }
  };

  // ── Apply filters explicitly ───────────────────────────
  const applyFilters = () => {
    const f = { level, category, source, search, dateFrom, dateTo };
    setApplied(f);
    fetchLogs(1, f);
  };

  const clearFilters = () => {
    const f = { level:"all", category:"all", source:"all", search:"", dateFrom:"", dateTo:"" };
    setLevel("all"); setCategory("all"); setSource("all");
    setSearch(""); setDateFrom(""); setDateTo("");
    setApplied(f);
    fetchLogs(1, f);
  };

  // Stats bar quick-filter — single click on a level badge
  const quickFilter = (lvl) => {
    const f = { level:lvl, category:"all", source:"all", search:"", dateFrom:"", dateTo:"" };
    setLevel(lvl); setCategory("all"); setSource("all");
    setSearch(""); setDateFrom(""); setDateTo("");
    setApplied(f);
    fetchLogs(1, f);
  };

  // ── Initial load ───────────────────────────────────────
  useEffect(() => { fetchLogs(1); }, []); // eslint-disable-line

  // ── Auto-refresh every 30s ─────────────────────────────
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (!autoRefresh) return;
    timerRef.current = setInterval(() => fetchLogs(1), 30000);
    return () => clearInterval(timerRef.current);
  }, [autoRefresh, applied]); // eslint-disable-line

  // ── Pagination ─────────────────────────────────────────
  const goPage = (pg) => fetchLogs(pg);
  const pages  = Math.ceil(total / LIMIT);

  // ── Actions ────────────────────────────────────────────
  const clearAll = async () => {
    if (!window.confirm("Clear ALL logs permanently?")) return;
    try {
      await apiClearLogs();
      toast("All logs cleared");
      fetchLogs(1);
    } catch { toast("Failed to clear logs"); }
  };

  const exportCSV = () => {
    if (!logs.length) { toast("No logs to export"); return; }
    const rows = logs.map(l => [
      `"${fmtTime(l.createdAt)}"`,
      l.level, l.category, l.source,
      `"${(l.message||"").replace(/"/g,'""')}"`,
      l.userEmail||"", l.ip||"",
      `"${l.path||""}"`,
      l.statusCode||"", l.duration||"",
    ].join(","));
    const csv = ["Time,Level,Category,Source,Message,User,IP,Path,Status,Duration(ms)", ...rows].join("\n");
    const a   = document.createElement("a");
    a.href    = "data:text/csv;charset=utf-8," + encodeURIComponent(csv);
    a.download= `BV_Logs_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  // ── Active filter count badge ──────────────────────────
  const activeCount = [
    applied.level    !== "all",
    applied.category !== "all",
    applied.source   !== "all",
    !!applied.search,
    !!applied.dateFrom,
    !!applied.dateTo,
  ].filter(Boolean).length;

  const pill = {
    padding:"7px 14px", borderRadius:99, fontSize:12, fontWeight:600,
    cursor:"pointer", border:"1.5px solid var(--border2)", transition:"all .15s",
    display:"flex", alignItems:"center", gap:5,
  };

  const sel = {
    width:"100%", padding:"8px 10px", borderRadius:9,
    border:"1.5px solid var(--border2)", background:"#fff",
    fontSize:12, fontWeight:600, color:"var(--text)", outline:"none",
  };

  // ── Stats bar ──────────────────────────────────────────
  const counts = { info:0, warn:0, error:0, fatal:0 };
  (stats?.byLevel || []).forEach(s => { counts[s._id] = s.count; });

  return (
    <div style={{ padding: isMobile ? "12px" : "24px 28px" }}>

      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
                    flexWrap:"wrap", gap:10, marginBottom:16 }}>
        <div>
          <h2 style={{ fontFamily:"var(--font-d)", color:"var(--dark)", margin:0,
                        fontSize:24, fontWeight:700 }}>Log Audit Viewer</h2>
          <p style={{ color:"var(--muted)", fontSize:13, margin:"3px 0 0" }}>
            {total.toLocaleString()} logs · 30-day purge
            {autoRefresh && <span style={{ color:"var(--rose)", marginLeft:8 }}>● Live</span>}
          </p>
        </div>
        <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
          <button onClick={() => setAutoRefresh(a => !a)}
            style={{ ...pill, background: autoRefresh ? "var(--roseL)" : "var(--ivory2)",
                     color: autoRefresh ? "var(--rose)" : "var(--muted)",
                     borderColor: autoRefresh ? "var(--rose)" : "var(--border2)" }}>
            {autoRefresh ? "⏸ Pause" : "▶ Live"}
          </button>
          <button onClick={() => fetchLogs(page)}
            style={{ ...pill, background:"var(--ivory2)", color:"var(--muted)" }}>
            <Ic icon={RefreshCw} size={12}/> Refresh
          </button>
          <button onClick={exportCSV}
            style={{ ...pill, background:"var(--ivory2)", color:"var(--muted)" }}>
            <Ic icon={Download} size={12}/> CSV
          </button>
          <button onClick={clearAll}
            style={{ ...pill, background:"#FEF2F2", color:"#DC2626", borderColor:"#FECACA" }}>
            <Ic icon={Trash2} size={12}/> Clear All
          </button>
        </div>
      </div>

      {/* Stats bar — click to quick-filter */}
      <div style={{ display:"flex", gap:10, flexWrap:"wrap", marginBottom:16 }}>
        {Object.entries(counts).map(([lvl, cnt]) => {
          const st = LEVEL_STYLE[lvl];
          const active = applied.level === lvl;
          return (
            <button key={lvl} onClick={() => active ? quickFilter("all") : quickFilter(lvl)}
              style={{ display:"flex", alignItems:"center", gap:8, padding:"9px 16px",
                        borderRadius:12, cursor:"pointer", transition:"all .15s",
                        border: `1.5px solid ${active ? st.color : st.border}`,
                        background: active ? st.color : st.bg,
                        boxShadow: active ? `0 4px 12px ${st.color}40` : "none" }}>
              <span style={{ fontSize:12, fontWeight:700,
                              color: active ? "#fff" : st.color,
                              textTransform:"capitalize" }}>{lvl}</span>
              <span style={{ fontSize:16, fontWeight:800,
                              color: active ? "#fff" : st.color }}>{cnt}</span>
            </button>
          );
        })}
        <div style={{ marginLeft:"auto", fontSize:11, color:"var(--muted)", alignSelf:"center" }}>
          Last 24 hours
        </div>
      </div>

      {/* Filters */}
      <div style={{ background:"#fff", border:"1.5px solid var(--border)",
                    borderRadius:14, padding:"14px 16px", marginBottom:16 }}>
        <div style={{ display:"grid",
                       gridTemplateColumns: isMobile ? "1fr 1fr" : "1fr 1fr 1fr 1fr 1fr 2fr",
                       gap:10, alignItems:"end" }}>

          <div>
            <div style={{ fontSize:10, fontWeight:700, color:"var(--muted)", marginBottom:4 }}>LEVEL</div>
            <select value={level} onChange={e => setLevel(e.target.value)} style={sel}>
              {LEVELS.map(l => (
                <option key={l} value={l}>{l === "all" ? "All Levels" : l.toUpperCase()}</option>
              ))}
            </select>
          </div>

          <div>
            <div style={{ fontSize:10, fontWeight:700, color:"var(--muted)", marginBottom:4 }}>CATEGORY</div>
            <select value={category} onChange={e => setCategory(e.target.value)} style={sel}>
              {CATS.map(c => (
                <option key={c} value={c}>{c === "all" ? "All Categories" : c.charAt(0).toUpperCase() + c.slice(1)}</option>
              ))}
            </select>
          </div>

          <div>
            <div style={{ fontSize:10, fontWeight:700, color:"var(--muted)", marginBottom:4 }}>SOURCE</div>
            <select value={source} onChange={e => setSource(e.target.value)} style={sel}>
              {SOURCES.map(s => (
                <option key={s} value={s}>{s === "all" ? "All Sources" : s.charAt(0).toUpperCase() + s.slice(1)}</option>
              ))}
            </select>
          </div>

          <div>
            <div style={{ fontSize:10, fontWeight:700, color:"var(--muted)", marginBottom:4 }}>FROM DATE</div>
            <input type="datetime-local" value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
              style={{ ...sel, boxSizing:"border-box" }}/>
          </div>

          <div>
            <div style={{ fontSize:10, fontWeight:700, color:"var(--muted)", marginBottom:4 }}>TO DATE</div>
            <input type="datetime-local" value={dateTo}
              onChange={e => setDateTo(e.target.value)}
              style={{ ...sel, boxSizing:"border-box" }}/>
          </div>

          <div>
            <div style={{ fontSize:10, fontWeight:700, color:"var(--muted)", marginBottom:4 }}>SEARCH</div>
            <div style={{ position:"relative" }}>
              <Ic icon={Search} size={13} color="var(--muted)"
                style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)" }}/>
              <input value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyDown={e => e.key === "Enter" && applyFilters()}
                placeholder="message, email, path..."
                style={{ ...sel, paddingLeft:30, boxSizing:"border-box", width:"100%" }}/>
            </div>
          </div>
        </div>

        <div style={{ display:"flex", gap:8, marginTop:10, justifyContent:"space-between", alignItems:"center" }}>
          <div style={{ fontSize:12, color:"var(--muted)" }}>
            {activeCount > 0 && (
              <span style={{ background:"var(--roseL)", color:"var(--rose)", padding:"2px 10px",
                              borderRadius:99, fontWeight:700, fontSize:11 }}>
                {activeCount} filter{activeCount > 1 ? "s" : ""} active
              </span>
            )}
          </div>
          <div style={{ display:"flex", gap:8 }}>
            <button onClick={clearFilters}
              style={{ ...pill, fontSize:11, background:"var(--ivory2)", color:"var(--muted)" }}>
              <Ic icon={X} size={11}/> Clear
            </button>
            <button onClick={applyFilters}
              style={{ ...pill, fontSize:11, background:"var(--rose)", color:"#fff",
                        border:"none", padding:"8px 18px" }}>
              <Ic icon={Filter} size={11}/> Apply Filters
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div style={{ background:"#fff", border:"1.5px solid var(--border)",
                    borderRadius:14, overflow:"hidden" }}>

        {/* Column header */}
        <div style={{ display:"grid",
                       gridTemplateColumns:"90px 90px 110px 1fr 100px 24px",
                       gap:8, padding:"8px 14px", background:"var(--ivory2)",
                       borderBottom:"1px solid var(--border)" }}>
          {["Level","Category","Source","Message","Time",""].map((h,i) => (
            <div key={i} style={{ fontSize:10, fontWeight:700, color:"var(--muted)",
                                   letterSpacing:.5, textTransform:"uppercase" }}>{h}</div>
          ))}
        </div>

        {loading && (
          <div style={{ padding:48, textAlign:"center", color:"var(--muted)" }}>
            <div style={{ fontSize:28, marginBottom:8 }}>⏳</div>
            Loading logs...
          </div>
        )}

        {!loading && logs.length === 0 && (
          <div style={{ padding:48, textAlign:"center", color:"var(--muted)" }}>
            <div style={{ fontSize:32, marginBottom:8 }}>📋</div>
            No logs match the current filters
            {activeCount > 0 && (
              <div style={{ marginTop:10 }}>
                <button onClick={clearFilters}
                  style={{ ...pill, fontSize:12, margin:"0 auto", background:"var(--rose)",
                            color:"#fff", border:"none" }}>
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        )}

        {!loading && logs.map(l => <LogRow key={l._id} log={l}/>)}
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div style={{ display:"flex", justifyContent:"center", gap:8,
                       marginTop:16, flexWrap:"wrap", alignItems:"center" }}>
          <button disabled={page <= 1} onClick={() => goPage(page - 1)}
            style={{ ...pill, opacity: page <= 1 ? .4 : 1 }}>← Prev</button>
          <span style={{ fontSize:12, color:"var(--muted)", padding:"0 4px" }}>
            Page {page} of {pages} &nbsp;·&nbsp; {total} total
          </span>
          <button disabled={page >= pages} onClick={() => goPage(page + 1)}
            style={{ ...pill, opacity: page >= pages ? .4 : 1 }}>Next →</button>
        </div>
      )}
    </div>
  );
};

export default LogViewer;
