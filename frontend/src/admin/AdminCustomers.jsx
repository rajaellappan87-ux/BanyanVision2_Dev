import React, { useState } from "react";
import { useBreakpoint } from "../hooks";
import { Ic } from "../utils/helpers";
import { apiAdminCreateUser, apiAdminToggleUser, apiAdminChangeRole, apiAdminDeleteUser } from "../api";
import { Phone, Search, Trash2, User, UserPlus, Users } from "lucide-react";

/* ── ADMIN CUSTOMERS ─────────────────────────────────────────────────────────── */
const AdminCustomers = ({ users, setUsers, toast, isMobile }) => {
  const [search,  setSearch]  = useState("");
  const [roleF,   setRoleF]   = useState("all");
  const [statusF, setStatusF] = useState("all");
  const [showAdd, setShowAdd] = useState(false);
  const [confirmDel, setConfirmDel] = useState(null);
  const [saving, setSaving] = useState(false);
  const [newUser, setNewUser] = useState({ name:"", email:"", password:"", phone:"", role:"user" });

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    const matchQ = !q || u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q) || u.phone?.includes(q);
    const matchR = roleF==="all" || u.role===roleF;
    const matchS = statusF==="all" || (statusF==="active"?u.active!==false:u.active===false);
    return matchQ && matchR && matchS;
  });

  const toggleActive = async (id) => {
    try {
      const r = await apiAdminToggleUser(id);
      setUsers(us => us.map(u => u._id===id ? r.data.user : u));
      toast(r.data.user.active ? "Account activated ✓" : "Account deactivated");
    } catch(err) { toast(err.response?.data?.message||"Error","error"); }
  };

  const changeRole = async (id, role) => {
    try {
      const r = await apiAdminChangeRole(id, role);
      setUsers(us => us.map(u => u._id===id ? r.data.user : u));
      toast(`Role changed to ${role} ✓`);
    } catch(err) { toast(err.response?.data?.message||"Error","error"); }
  };

  const deleteUser = async (id) => {
    try {
      await apiAdminDeleteUser(id);
      setUsers(us => us.filter(u => u._id!==id));
      toast("User deleted");
      setConfirmDel(null);
    } catch(err) { toast(err.response?.data?.message||"Error","error"); }
  };

  const createUser = async () => {
    if(!newUser.name.trim()||!newUser.email.trim()||!newUser.password.trim()){
      toast("Name, email and password are required","error"); return;
    }
    setSaving(true);
    try {
      const r = await apiAdminCreateUser(newUser);
      setUsers(us => [r.data.user, ...us]);
      setNewUser({ name:"", email:"", password:"", phone:"", role:"user" });
      setShowAdd(false);
      toast(`${r.data.user.role==="admin"?"Admin":"Customer"} account created ✓`);
    } catch(err) { toast(err.response?.data?.message||"Error","error"); }
    setSaving(false);
  };

  const iS = { background:"#fff", border:"1.5px solid var(--border2)", color:"var(--text)", padding:"10px 13px", fontSize:13, borderRadius:10, outline:"none", width:"100%", boxSizing:"border-box", fontWeight:500 };

  const admins   = users.filter(u=>u.role==="admin").length;
  const active   = users.filter(u=>u.active!==false).length;
  const inactive = users.filter(u=>u.active===false).length;

  return (
    <div>
      {/* Header */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20,flexWrap:"wrap",gap:12}}>
        <div>
          <h2 style={{fontFamily:"var(--font-d)",color:"var(--dark)",margin:"0 0 6px",fontSize:28,fontWeight:700}}>Customers & Users</h2>
          <div style={{display:"flex",gap:16,flexWrap:"wrap"}}>
            {[["Total",users.length,"var(--rose)"],["Admins",admins,"var(--purple)"],["Active",active,"#16A34A"],["Inactive",inactive,"#DC2626"]].map(([l,v,c])=>(
              <span key={l} style={{fontSize:12,fontWeight:700,color:"var(--muted)"}}>
                {l}: <span style={{color:c}}>{v}</span>
              </span>
            ))}
          </div>
        </div>
        <button onClick={()=>setShowAdd(true)}
          style={{display:"inline-flex",alignItems:"center",gap:6,padding:"11px 20px",background:"linear-gradient(135deg,var(--rose),var(--saffron))",border:"none",borderRadius:11,color:"#fff",fontWeight:700,fontSize:13,cursor:"pointer",boxShadow:"0 4px 16px rgba(194,24,91,.3)"}}>
          <span style={{display:"flex",alignItems:"center",gap:6}}><Ic icon={UserPlus} size={14}/>Add User</span>
        </button>
      </div>

      {/* Filters */}
      <div style={{display:"flex",gap:10,marginBottom:16,flexWrap:"wrap"}}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search name, email, phone…"
          style={{...iS,flex:1,minWidth:180,padding:"9px 13px"}}/>
        <select value={roleF} onChange={e=>setRoleF(e.target.value)}
          style={{...iS,width:"auto",padding:"9px 13px"}}>
          <option value="all">All Roles</option>
          <option value="user">Customer</option>
          <option value="admin">Admin</option>
        </select>
        <select value={statusF} onChange={e=>setStatusF(e.target.value)}
          style={{...iS,width:"auto",padding:"9px 13px"}}>
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Table */}
      <div style={{background:"#fff",borderRadius:"16px",border:"1.5px solid var(--border)",overflow:"hidden",boxShadow:"0 4px 24px rgba(194,24,91,.06)"}}>
        {/* Table header */}
        {!isMobile&&(
          <div style={{display:"grid",gridTemplateColumns:"2fr 2fr 1fr 1fr 1fr 1fr",gap:0,background:"linear-gradient(135deg,var(--roseL),var(--saffronL))",borderBottom:"1.5px solid var(--border)",padding:"10px 16px"}}>
            {["Name","Email","Phone","Role","Status","Actions"].map(h=>(
              <div key={h} style={{fontSize:10,fontWeight:800,color:"var(--rose)",letterSpacing:1,textTransform:"uppercase"}}>{h}</div>
            ))}
          </div>
        )}

        {filtered.length===0?(
          <div style={{textAlign:"center",padding:"48px 0",color:"var(--muted)",fontSize:14}}>No users match the current filter.</div>
        ):filtered.map((u,idx)=>{
          const isActive = u.active !== false;
          const isAdmin  = u.role === "admin";
          return isMobile ? (
            /* ── Mobile card ── */
            <div key={u._id} style={{padding:"14px 16px",borderBottom:"1px solid var(--border)",background:isActive?"#fff":"#FEF2F2"}}>
              <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:10}}>
                <div style={{width:40,height:40,borderRadius:"50%",flexShrink:0,
                  background:isAdmin?"linear-gradient(135deg,var(--purple),#AB47BC)":"linear-gradient(135deg,var(--rose),var(--saffron))",
                  display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:800,fontSize:16}}>
                  {u.name?.[0]?.toUpperCase()||"?"}
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontWeight:700,fontSize:14,color:"var(--dark)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{u.name}</div>
                  <div style={{fontSize:11,color:"var(--muted)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{u.email}</div>
                  {u.phone&&<div style={{fontSize:11,color:"var(--muted)"}}>{u.phone}</div>}
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:4,alignItems:"flex-end"}}>
                  <span style={{padding:"2px 8px",borderRadius:99,fontSize:9,fontWeight:800,letterSpacing:.5,
                    background:isAdmin?"var(--purpleL)":"var(--tealL)",color:isAdmin?"var(--purple)":"var(--teal)"}}>
                    {isAdmin?"ADMIN":"CUSTOMER"}
                  </span>
                  <span style={{padding:"2px 8px",borderRadius:99,fontSize:9,fontWeight:800,
                    background:isActive?"#F0FDF4":"#FEF2F2",color:isActive?"#16A34A":"#DC2626"}}>
                    {isActive?"ACTIVE":"INACTIVE"}
                  </span>
                </div>
              </div>
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                <button onClick={()=>toggleActive(u._id)} style={{padding:"5px 12px",borderRadius:8,fontSize:11,fontWeight:700,border:"none",cursor:"pointer",
                  background:isActive?"#FEF2F2":"#F0FDF4",color:isActive?"#DC2626":"#16A34A"}}>
                  {isActive?"Deactivate":"Activate"}
                </button>
                <button onClick={()=>changeRole(u._id,isAdmin?"user":"admin")} style={{padding:"5px 12px",borderRadius:8,fontSize:11,fontWeight:700,border:"1.5px solid var(--border2)",cursor:"pointer",background:"#fff",color:"var(--text)"}}>
                  Make {isAdmin?"Customer":"Admin"}
                </button>
                <button onClick={()=>setConfirmDel(u)} style={{padding:"5px 12px",borderRadius:8,fontSize:11,fontWeight:700,border:"none",cursor:"pointer",background:"#FEF2F2",color:"#DC2626"}}>
                  Delete
                </button>
              </div>
            </div>
          ) : (
            /* ── Desktop table row ── */
            <div key={u._id} style={{display:"grid",gridTemplateColumns:"2fr 2fr 1fr 1fr 1fr 1fr",gap:0,padding:"12px 16px",borderBottom:"1px solid var(--border)",alignItems:"center",background:idx%2===0?"#fff":"#FAFAFA",transition:"background .15s"}}
              onMouseEnter={e=>e.currentTarget.style.background="var(--roseL)"}
              onMouseLeave={e=>e.currentTarget.style.background=idx%2===0?"#fff":"#FAFAFA"}>

              {/* Name */}
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <div style={{width:34,height:34,borderRadius:"50%",flexShrink:0,
                  background:isAdmin?"linear-gradient(135deg,var(--purple),#AB47BC)":"linear-gradient(135deg,var(--rose),var(--saffron))",
                  display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:800,fontSize:14}}>
                  {u.name?.[0]?.toUpperCase()||"?"}
                </div>
                <div>
                  <div style={{fontWeight:700,fontSize:13,color:"var(--dark)"}}>{u.name}</div>
                  <div style={{fontSize:10,color:"var(--muted)"}}>{new Date(u.createdAt).toLocaleDateString("en-IN")}</div>
                </div>
              </div>

              {/* Email */}
              <div style={{fontSize:12,color:"var(--text2)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",paddingRight:8}}>{u.email}</div>

              {/* Phone */}
              <div style={{fontSize:12,color:"var(--muted)"}}>{u.phone||"—"}</div>

              {/* Role */}
              <div>
                <span style={{padding:"3px 10px",borderRadius:99,fontSize:9,fontWeight:800,letterSpacing:.5,
                  background:isAdmin?"var(--purpleL)":"var(--tealL)",color:isAdmin?"var(--purple)":"var(--teal)"}}>
                  {isAdmin?"ADMIN":"CUSTOMER"}
                </span>
              </div>

              {/* Status */}
              <div>
                <span style={{padding:"3px 10px",borderRadius:99,fontSize:9,fontWeight:800,
                  background:isActive?"#F0FDF4":"#FEF2F2",color:isActive?"#16A34A":"#DC2626"}}>
                  {isActive?"● ACTIVE":"● INACTIVE"}
                </span>
              </div>

              {/* Actions */}
              <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                <button title={isActive?"Deactivate account":"Activate account"} onClick={()=>toggleActive(u._id)}
                  style={{padding:"4px 10px",borderRadius:7,fontSize:10,fontWeight:700,border:"none",cursor:"pointer",
                    background:isActive?"#FEF2F2":"#F0FDF4",color:isActive?"#DC2626":"#16A34A",transition:"opacity .15s"}}
                  onMouseEnter={e=>e.currentTarget.style.opacity=".75"}
                  onMouseLeave={e=>e.currentTarget.style.opacity="1"}>
                  {isActive?"Deactivate":"Activate"}
                </button>
                <button title={`Change to ${isAdmin?"Customer":"Admin"}`} onClick={()=>changeRole(u._id,isAdmin?"user":"admin")}
                  style={{padding:"4px 10px",borderRadius:7,fontSize:10,fontWeight:700,border:"1.5px solid var(--border2)",cursor:"pointer",background:"#fff",color:"var(--muted)",transition:"all .15s"}}
                  onMouseEnter={e=>{e.currentTarget.style.borderColor="var(--rose)";e.currentTarget.style.color="var(--rose)";}}
                  onMouseLeave={e=>{e.currentTarget.style.borderColor="var(--border2)";e.currentTarget.style.color="var(--muted)";}}>
                  {isAdmin?"→ Customer":"→ Admin"}
                </button>
                <button title="Delete user" onClick={()=>setConfirmDel(u)}
                  style={{padding:"4px 8px",borderRadius:7,fontSize:12,border:"none",cursor:"pointer",background:"none",color:"#EF4444",opacity:.6,transition:"opacity .15s"}}
                  onMouseEnter={e=>e.currentTarget.style.opacity="1"}
                  onMouseLeave={e=>e.currentTarget.style.opacity=".6"}>
                  <Ic icon={Trash2} size={14}/>
                </button>
              </div>
            </div>
          );
        })}

        {/* Footer */}
        <div style={{padding:"10px 16px",background:"var(--ivory2)",borderTop:"1.5px solid var(--border)",fontSize:11,color:"var(--muted)",fontWeight:500}}>
          Showing {filtered.length} of {users.length} users
        </div>
      </div>

      {/* ── Add User Modal ── */}
      {showAdd&&(
        <div style={{position:"fixed",inset:0,background:"rgba(26,10,0,.5)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:9999,backdropFilter:"blur(4px)",padding:16}}>
          <div style={{background:"#fff",borderRadius:"20px",padding:28,width:"100%",maxWidth:440,boxShadow:"0 24px 64px rgba(0,0,0,.2)"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
              <h3 style={{fontFamily:"var(--font-d)",fontSize:22,color:"var(--dark)",fontWeight:700,margin:0}}>Add New User</h3>
              <button onClick={()=>setShowAdd(false)} style={{background:"none",border:"none",fontSize:22,cursor:"pointer",color:"var(--muted)",lineHeight:1}}>×</button>
            </div>

            {[["Full Name","name","text","e.g. Priya Sharma"],["Email Address","email","email","e.g. priya@email.com"],["Password","password","password","Min 6 characters"],["Phone Number","phone","tel","e.g. 9876543210"]].map(([label,key,type,ph])=>(
              <div key={key} style={{marginBottom:14}}>
                <label style={{display:"block",fontSize:10,fontWeight:700,color:"var(--muted)",letterSpacing:.5,textTransform:"uppercase",marginBottom:6}}>
                  {label}{key!=="phone"&&<span style={{color:"#DC2626"}}> *</span>}
                </label>
                <input type={type} value={newUser[key]} onChange={e=>setNewUser(n=>({...n,[key]:e.target.value}))}
                  placeholder={ph} style={iS}
                  onFocus={e=>e.target.style.borderColor="var(--rose)"}
                  onBlur={e=>e.target.style.borderColor="var(--border2)"}/>
              </div>
            ))}

            <div style={{marginBottom:20}}>
              <label style={{display:"block",fontSize:10,fontWeight:700,color:"var(--muted)",letterSpacing:.5,textTransform:"uppercase",marginBottom:6}}>Account Role</label>
              <div style={{display:"flex",gap:10}}>
                {[["user","Customer"],["admin","Admin"]].map(([val,label])=>(
                  <button key={val} onClick={()=>setNewUser(n=>({...n,role:val}))}
                    style={{flex:1,padding:"10px 0",borderRadius:10,fontSize:13,fontWeight:700,cursor:"pointer",transition:"all .2s",
                      background:newUser.role===val?"linear-gradient(135deg,var(--rose),var(--saffron))":"#fff",
                      border:newUser.role===val?"none":"1.5px solid var(--border2)",
                      color:newUser.role===val?"#fff":"var(--muted)"}}>
                    {label}
                  </button>
                ))}
              </div>
              {newUser.role==="admin"&&(
                <div style={{marginTop:8,padding:"8px 12px",background:"#FFF3E0",borderRadius:8,fontSize:11,color:"#D97706",fontWeight:600}}>
                  ⚠ Admin users have full access to the admin dashboard.
                </div>
              )}
            </div>

            <div style={{display:"flex",gap:10}}>
              <button onClick={()=>setShowAdd(false)} style={{flex:1,padding:"12px 0",borderRadius:11,background:"var(--ivory2)",border:"1.5px solid var(--border2)",fontWeight:600,fontSize:13,cursor:"pointer",color:"var(--muted)"}}>Cancel</button>
              <button onClick={createUser} disabled={saving}
                style={{flex:2,padding:"12px 0",borderRadius:11,background:"linear-gradient(135deg,var(--rose),var(--saffron))",border:"none",fontWeight:700,fontSize:13,cursor:saving?"not-allowed":"pointer",color:"#fff",opacity:saving?.7:1,boxShadow:"0 4px 16px rgba(194,24,91,.3)"}}>
                {saving?"Creating…":"Create Account"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation Modal ── */}
      {confirmDel&&(
        <div style={{position:"fixed",inset:0,background:"rgba(26,10,0,.55)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:9999,backdropFilter:"blur(4px)",padding:16}}>
          <div style={{background:"#fff",borderRadius:"20px",padding:28,maxWidth:360,width:"100%",textAlign:"center",boxShadow:"0 24px 64px rgba(0,0,0,.25)"}}>
            <div style={{fontSize:44,marginBottom:12}}><Ic icon={Trash2} size={44}/></div>
            <h3 style={{fontFamily:"var(--font-d)",fontSize:22,color:"var(--dark)",marginBottom:8,fontWeight:700}}>Delete Account?</h3>
            <p style={{color:"var(--muted)",fontSize:13,lineHeight:1.75,marginBottom:20}}>
              Permanently delete <strong style={{color:"var(--rose)"}}>{confirmDel.name}</strong> ({confirmDel.email})? This cannot be undone.
            </p>
            <div style={{display:"flex",gap:10,justifyContent:"center"}}>
              <button onClick={()=>setConfirmDel(null)} style={{padding:"11px 24px",borderRadius:12,background:"var(--ivory2)",border:"1.5px solid var(--border2)",fontWeight:700,fontSize:13,cursor:"pointer",color:"var(--text)"}}>Cancel</button>
              <button onClick={()=>deleteUser(confirmDel._id)} style={{padding:"11px 24px",borderRadius:12,background:"linear-gradient(135deg,#EF4444,#DC2626)",border:"none",fontWeight:700,fontSize:13,cursor:"pointer",color:"#fff",boxShadow:"0 4px 16px rgba(239,68,68,.3)"}}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCustomers;