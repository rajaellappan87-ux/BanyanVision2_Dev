import React, { useState, useEffect, useCallback } from "react";
import { useBreakpoint } from "../hooks";
import { useCatConfig } from "../store/catStore";
import { Ic, fmt } from "../utils/helpers";
import { apiGetProducts } from "../api";
import ProductCard from "../components/ui/ProductCard";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { Spinner, SecLabel } from "../components/ui/Common";

const PER_PAGE = 12;

/* ── Pagination bar ─────────────────────────────────────────────────────────── */
const Pagination = ({ page, pages, onChange }) => {
  if (pages <= 1) return null;

  // Build page number list: always show first, last, current ±1, with "…" gaps
  const nums = [];
  for (let i = 1; i <= pages; i++) {
    if (i === 1 || i === pages || (i >= page - 1 && i <= page + 1)) {
      nums.push(i);
    } else if (nums[nums.length - 1] !== "…") {
      nums.push("…");
    }
  }

  const btn = (label, target, active = false, disabled = false) => (
    <button
      key={label}
      onClick={() => !disabled && target && onChange(target)}
      disabled={disabled}
      style={{
        minWidth: 38, height: 38, padding: "0 10px",
        borderRadius: 10, border: "1.5px solid",
        borderColor: active ? "var(--rose)" : "var(--border2)",
        background:  active ? "linear-gradient(135deg,var(--rose),var(--saffron))" : "#fff",
        color:       active ? "#fff" : disabled ? "var(--border2)" : "var(--text2)",
        fontSize: 13, fontWeight: active ? 700 : 500,
        cursor: disabled ? "not-allowed" : "pointer",
        display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
        transition: "all .15s",
        boxShadow: active ? "0 4px 14px rgba(194,24,91,.25)" : "none",
      }}
    >
      {label}
    </button>
  );

  return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:6, marginTop:36, flexWrap:"wrap" }}>
      {btn(<><Ic icon={ChevronLeft} size={14}/> Prev</>, page - 1, false, page === 1)}
      {nums.map((n, i) =>
        n === "…"
          ? <span key={`e${i}`} style={{ color:"var(--muted)", fontSize:13, padding:"0 4px" }}>…</span>
          : btn(n, n, n === page)
      )}
      {btn(<>Next <Ic icon={ChevronRight} size={14}/></>, page + 1, false, page === pages)}
    </div>
  );
};

/* ── SHOP PAGE ───────────────────────────────────────────────────────────────── */
const ShopPage = ({ setPage, toast, initialCat = "", initialSubCat = "", onSubCatChange }) => {
  const { isMobile } = useBreakpoint();
  const catCfg = useCatConfig();

  const [prods,   setProds]   = useState([]);
  const [total,   setTotal]   = useState(0);
  const [pages,   setPages]   = useState(1);
  const [loading, setLoading] = useState(true);

  // Filters
  const [cat,      setCat]      = useState(initialCat || "All");
  const [subCat,   setSubCat]   = useState(initialSubCat || "");
  const [sort,     setSort]     = useState("newest");
  const [search,   setSearch]   = useState("");
  const [maxPrice, setMaxPrice] = useState(25000);
  const [showF,    setShowF]    = useState(false);
  const [page,     setPageNum]  = useState(1);

  // Sync when parent navigates to shop with a specific category/subCategory
  useEffect(() => {
    const incoming = initialCat || "All";
    if (incoming !== cat) {
      setCat(incoming);
      setSubCat(initialSubCat || "");
      setPageNum(1);
    }
  }, [initialCat]); // eslint-disable-line

  // Available subs for selected category
  const subs = cat !== "All" ? (catCfg[cat]?.subs || []) : [];

  const load = useCallback(() => {
    setLoading(true);
    const p = { sort, limit: PER_PAGE, page };
    if (cat !== "All") p.category = cat;
    if (subCat)        p.subCategory = subCat;
    if (search)        p.search = search;
    if (maxPrice < 25000) p.maxPrice = maxPrice;
    apiGetProducts(p)
      .then(r => {
        setProds(Array.isArray(r?.data?.products) ? r.data.products : []);
        setTotal(r?.data?.total  || 0);
        setPages(r?.data?.pages  || 1);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [cat, subCat, sort, search, maxPrice, page]);

  useEffect(() => { load(); }, [load]);

  // Reset page to 1 whenever any filter changes (not page itself)
  const changeCat = (c) => { setCat(c); setSubCat(""); setPageNum(1); if (onSubCatChange) onSubCatChange(""); };
  const changeSubCat = (s) => {
    const next = subCat === s ? "" : s;
    setSubCat(next);
    setPageNum(1);
    if (onSubCatChange) onSubCatChange(next);
  };
  const changeSort = (s) => { setSort(s); setPageNum(1); };
  const changeSearch = (s) => { setSearch(s); setPageNum(1); };
  const changeMaxPrice = (v) => { setMaxPrice(v); setPageNum(1); };

  const iStyle = {
    background:"#fff", border:"1.5px solid var(--border2)", color:"var(--text)",
    padding:"11px 16px", fontSize:13, borderRadius:12, outline:"none",
    width:"100%", fontWeight:500,
  };

  const catPill = (label, active, onClick) => (
    <button key={label} onClick={onClick} style={{
      padding:"7px 16px", borderRadius:99,
      border:`1.5px solid ${active ? "var(--rose)" : "var(--border2)"}`,
      background: active ? "linear-gradient(135deg,var(--rose),var(--saffron))" : "#fff",
      color: active ? "#fff" : "var(--text2)",
      fontSize:12, fontWeight:600, cursor:"pointer", transition:"all .2s",
      boxShadow: active ? "0 4px 14px rgba(194,24,91,.25)" : "none",
      whiteSpace:"nowrap",
    }}>
      {label}
    </button>
  );

  const from = total === 0 ? 0 : (page - 1) * PER_PAGE + 1;
  const to   = Math.min(page * PER_PAGE, total);

  return (
    <div style={{ background:"var(--ivory)", minHeight:"100vh" }}>

      {/* Hero */}
      <div style={{ background:"linear-gradient(160deg,var(--roseL) 0%,var(--saffronL) 50%,var(--ivory) 100%)", borderBottom:"1.5px solid var(--border)", padding:isMobile?"36px 20px 28px":"52px 80px 36px" }}>
        <div style={{ maxWidth:1440, margin:"0 auto" }}>
          <SecLabel>Shop</SecLabel>
          <h1 style={{ fontFamily:"var(--font-d)", fontSize:isMobile?32:56, fontWeight:700, color:"var(--dark)", marginTop:8, letterSpacing:-.5 }}>
            All <span className="rose-text">Collections</span>
          </h1>
          <p style={{ color:"var(--muted)", marginTop:8, fontSize:13, fontWeight:500 }}>
            {total > 0 ? `${total} style${total !== 1 ? "s" : ""} available` : ""}
          </p>
        </div>
      </div>

      <div style={{ maxWidth:1440, margin:"0 auto", padding:isMobile?"16px 14px":"28px 80px" }}>

        {/* ── Search + Sort + Filter toggle ── */}
        <div style={{ display:"flex", gap:10, marginBottom:12, flexWrap:"wrap" }}>
          <div style={{ flex:1, minWidth:150, position:"relative" }}>
            <span style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)" }}>
              <Ic icon={Search} size={16} color="var(--muted)"/>
            </span>
            <input
              value={search}
              onChange={e => changeSearch(e.target.value)}
              placeholder="Search styles, fabrics…"
              style={{ ...iStyle, paddingLeft:40 }}
            />
          </div>
          <select value={sort} onChange={e => changeSort(e.target.value)} style={{ ...iStyle, width:"auto" }}>
            <option value="newest">Newest</option>
            <option value="price-asc">Price ↑</option>
            <option value="price-desc">Price ↓</option>
            <option value="rating">Top Rated</option>
          </select>
          <button onClick={() => setShowF(!showF)} style={{
            background: showF ? "linear-gradient(135deg,var(--rose),var(--saffron))" : "#fff",
            color: showF ? "#fff" : "var(--rose)",
            border:"1.5px solid var(--rose)", padding:"11px 18px",
            borderRadius:12, fontSize:13, fontWeight:700, cursor:"pointer", transition:"all .2s",
          }}>
            ⊞ Filter
          </button>
        </div>

        {/* ── Quick price filter pills ── */}
        <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:12, alignItems:"center" }}>
          <span style={{ fontSize:10, fontWeight:700, color:"var(--muted)", letterSpacing:.5, textTransform:"uppercase", alignSelf:"center", marginRight:2 }}>Price:</span>
          {[199, 299, 499, 999, 1999].map(p => {
            const active = maxPrice === p;
            return (
              <button key={p} onClick={() => changeMaxPrice(active ? 25000 : p)} style={{
                padding:"6px 14px", borderRadius:99, fontSize:12, fontWeight:700, cursor:"pointer",
                border:`1.5px solid ${active ? "var(--rose)" : "var(--border2)"}`,
                background: active ? "linear-gradient(135deg,var(--rose),var(--saffron))" : "#fff",
                color: active ? "#fff" : "var(--text2)",
                transition:"all .18s",
                boxShadow: active ? "0 3px 10px rgba(194,24,91,.25)" : "none",
                whiteSpace:"nowrap",
              }}>
                Under {fmt(p)}
              </button>
            );
          })}
          {maxPrice < 25000 && ![199,299,499,999,1999].includes(maxPrice) && (
            <span style={{ fontSize:11, color:"var(--rose)", fontWeight:700, padding:"6px 10px", borderRadius:99, border:"1.5px solid var(--rose)", background:"var(--roseL)" }}>
              Under {fmt(maxPrice)}
            </span>
          )}
          {maxPrice < 25000 && (
            <button onClick={() => changeMaxPrice(25000)} style={{ fontSize:11, color:"var(--muted)", background:"none", border:"none", cursor:"pointer", fontWeight:700, padding:"4px 2px" }}>
              Clear ×
            </button>
          )}
        </div>

        {/* ── Price filter panel (slider) ── */}
        {showF && (
          <div style={{ padding:"14px 20px", borderRadius:14, background:"#fff", marginBottom:12, display:"flex", alignItems:"center", gap:16, flexWrap:"wrap", border:"1.5px solid var(--border)" }}>
            <span style={{ fontSize:13, fontWeight:700, color:"var(--rose)", whiteSpace:"nowrap" }}>Max: {fmt(maxPrice)}</span>
            <input type="range" min={199} max={25000} step={100} value={maxPrice}
              onChange={e => changeMaxPrice(Number(e.target.value))}
              style={{ flex:1, accentColor:"var(--rose)", minWidth:100 }}/>
            <span style={{ fontSize:12, color:"var(--muted)", fontWeight:500 }}>₹25,000</span>
            {maxPrice < 25000 && (
              <button onClick={() => changeMaxPrice(25000)} style={{ fontSize:11, color:"var(--rose)", background:"none", border:"none", cursor:"pointer", fontWeight:700 }}>
                Clear ×
              </button>
            )}
          </div>
        )}

        {/* ── Category chips ── */}
        <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom: subs.length > 0 ? 8 : 14 }}>
          {catPill("All", cat === "All", () => changeCat("All"))}
          {Object.keys(catCfg).map(c => catPill(c, cat === c, () => changeCat(c)))}
        </div>

        {/* ── Sub-category chips (only when category has subs) ── */}
        {subs.length > 0 && (
          <div style={{ display:"flex", gap:7, flexWrap:"wrap", marginBottom:14, paddingLeft:4 }}>
            <span style={{ fontSize:10, fontWeight:700, color:"var(--muted)", letterSpacing:.5, textTransform:"uppercase", alignSelf:"center", marginRight:4 }}>
              Sub-category:
            </span>
            {subs.map(s => (
              <button key={s} onClick={() => changeSubCat(s)} style={{
                padding:"5px 14px", borderRadius:99, fontSize:12, fontWeight:600, cursor:"pointer",
                border:`1.5px solid ${subCat === s ? "var(--rose)" : "var(--border2)"}`,
                background: subCat === s ? "var(--roseL)" : "#fff",
                color: subCat === s ? "var(--rose)" : "var(--text2)",
                transition:"all .15s",
              }}>
                {s}
              </button>
            ))}
            {subCat && (
              <button onClick={() => changeSubCat("")} style={{ padding:"5px 10px", borderRadius:99, fontSize:11, fontWeight:700, cursor:"pointer", border:"1.5px solid var(--border2)", background:"#fff", color:"var(--muted)" }}>
                Clear ×
              </button>
            )}
          </div>
        )}

        {/* ── Active filter summary ── */}
        {!loading && total > 0 && (
          <div style={{ fontSize:12, color:"var(--muted)", fontWeight:500, marginBottom:14 }}>
            Showing <strong style={{ color:"var(--dark)" }}>{from}–{to}</strong> of <strong style={{ color:"var(--dark)" }}>{total}</strong> style{total !== 1 ? "s" : ""}
            {cat !== "All" && <> · <span style={{ color:"var(--rose)", fontWeight:700 }}>{cat}</span></>}
            {subCat && <> &rsaquo; <span style={{ color:"var(--rose)", fontWeight:700 }}>{subCat}</span></>}
          </div>
        )}

        {/* ── Product grid ── */}
        {loading ? (
          <Spinner/>
        ) : prods.length === 0 ? (
          <div style={{ textAlign:"center", padding:"80px 0" }}>
            <div style={{ fontSize:48, marginBottom:16 }}>🔍</div>
            <div style={{ fontFamily:"var(--font-d)", fontSize:22, color:"var(--muted)", marginBottom:8 }}>No results found</div>
            <div style={{ fontSize:13, color:"var(--muted)" }}>Try a different category or clear your filters</div>
            <button onClick={() => { changeCat("All"); changeSearch(""); changeMaxPrice(25000); }}
              style={{ marginTop:16, padding:"10px 24px", borderRadius:12, background:"linear-gradient(135deg,var(--rose),var(--saffron))", border:"none", color:"#fff", fontWeight:700, fontSize:13, cursor:"pointer" }}>
              Clear All Filters
            </button>
          </div>
        ) : (
          <>
            <div style={{ display:"grid", gridTemplateColumns:`repeat(${isMobile ? 2 : 4}, 1fr)`, gap:isMobile ? 10 : 20 }}>
              {prods.map(p => <ProductCard key={p._id} p={p} setPage={setPage} toast={toast}/>)}
            </div>

            {/* ── Pagination ── */}
            <Pagination page={page} pages={pages} onChange={setPageNum}/>

            {pages > 1 && (
              <div style={{ textAlign:"center", fontSize:12, color:"var(--muted)", marginTop:12 }}>
                Page {page} of {pages}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ShopPage;
