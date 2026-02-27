import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import API from "../api/auth";
import { useViewport } from "../hooks/useViewport";

export default function ProfileSetup() {
  const [unis, setUnis] = useState([]);
  const [form, setForm] = useState({ studentId:"", department:"", semester:"", session:"", universityId:"" });
  const [loading, setLoading] = useState(false);
  const [bootLoading, setBootLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const { isMobile } = useViewport();

  useEffect(() => {
    const loadInitial = async () => {
      try {
        const [unisRes, profileRes] = await Promise.all([
          API.get("/universities"),
          API.get("/profile"),
        ]);

        setUnis(unisRes.data || []);

        if (profileRes?.data) {
          const profile = profileRes.data;
          setForm({
            studentId: profile.studentId || "",
            department: profile.department || "",
            semester: profile.semester || "",
            session: profile.session || "",
            universityId: profile.universityId || "",
          });
        }
      } catch {
        setError("Failed to load your saved profile. Please try again.");
      } finally {
        setBootLoading(false);
      }
    };

    loadInitial();
  }, []);

  const filtered = unis.filter(u => u.name.toLowerCase().includes(search.toLowerCase()) || u.shortName.toLowerCase().includes(search.toLowerCase()));
  const selectedUni = unis.find(u => u.id === form.universityId);
  const update = (k,v) => setForm(p => ({...p,[k]:v}));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.universityId) { setError("Please select your university"); return; }
    setLoading(true); setError("");
    try {
      await API.put("/profile", form);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save profile");
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight:"100vh", background:"linear-gradient(135deg,#f0f5ff 0%,#fff 60%)", fontFamily:"'Segoe UI',sans-serif", display:"flex", alignItems:"center", justifyContent:"center", padding:isMobile?"16px 12px":"30px 20px" }}>
      <div style={{ width:"100%", maxWidth:680, background:"#fff", borderRadius:20, boxShadow:"0 20px 60px rgba(0,0,0,0.1)", overflow:"hidden" }}>
        {/* Header */}
        <div style={{ background:"linear-gradient(135deg,#1a3a6b,#2563eb)", padding:isMobile?"24px 18px":"32px 40px" }}>
          <div style={{ fontSize:10, color:"rgba(255,255,255,0.6)", letterSpacing:3, fontWeight:700, marginBottom:6 }}>STEP 2 OF 2</div>
          <h1 style={{ color:"#fff", fontSize:24, fontWeight:900, margin:"0 0 6px" }}>Complete Your Profile</h1>
          <p style={{ color:"rgba(255,255,255,0.65)", fontSize:13.5, margin:0 }}>
            Hi {user?.name}! This info will auto-fill your cover pages so you never have to type it again.
          </p>
          <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginTop:16 }}>
            {["Account Created ✓","Profile Setup","Start Creating"].map((s,i) => (
              <div key={i} style={{ display:"flex", alignItems:"center", gap:6 }}>
                <div style={{ padding:"4px 12px", borderRadius:20, background: i===1?"rgba(255,255,255,0.2)":"rgba(255,255,255,0.08)", border: i===1?"1px solid rgba(255,255,255,0.4)":"1px solid rgba(255,255,255,0.15)", fontSize:11, color: i===0?"#86efac": i===1?"#fff":"rgba(255,255,255,0.45)", fontWeight: i===1?700:400 }}>{s}</div>
                {i<2 && <div style={{ color:"rgba(255,255,255,0.25)", fontSize:14 }}>›</div>}
              </div>
            ))}
          </div>
        </div>

        <div style={{ padding:isMobile?"22px 16px":"32px 40px" }}>
          {bootLoading && (
            <div style={{ background:"#eff6ff", border:"1px solid #bfdbfe", borderRadius:8, padding:"10px 14px", marginBottom:18, fontSize:13, color:"#1e40af" }}>
              Loading your saved profile...
            </div>
          )}

          {error && (
            <div style={{ background:"#fef2f2", border:"1px solid #fecaca", borderRadius:8, padding:"10px 14px", marginBottom:18, fontSize:13, color:"#dc2626" }}>⚠️ {error}</div>
          )}

          <form onSubmit={handleSubmit}>
            {/* University selector */}
            <div style={{ marginBottom:22 }}>
              <label style={{ display:"block", fontSize:11, fontWeight:700, color:"#374151", letterSpacing:1, marginBottom:8 }}>SELECT YOUR UNIVERSITY *</label>
              {selectedUni ? (
                <div style={{ display:"flex", alignItems:"center", gap:14, background:"#f0f5ff", border:"2px solid #2563eb", borderRadius:10, padding:"12px 16px", marginBottom:8 }}>
                  <img src={selectedUni.logoUrl} alt="" style={{ width:44, height:44, objectFit:"contain", borderRadius:6, background:"#fff", padding:4 }} onError={e => { e.target.style.display="none"; }}/>
                  <div>
                    <div style={{ fontSize:14, fontWeight:700, color:"#1a3a6b" }}>{selectedUni.name}</div>
                    <div style={{ fontSize:11, color:"#64748b" }}>{selectedUni.type === "PUBLIC" ? "🏛️ Public University" : "🏢 Private University"}</div>
                  </div>
                  <button type="button" onClick={() => update("universityId","")} style={{ marginLeft:"auto", background:"none", border:"none", cursor:"pointer", color:"#94a3b8", fontSize:18 }}>✕</button>
                </div>
              ) : (
                <>
                  <input type="text" placeholder="Search university name..." value={search} onChange={e => setSearch(e.target.value)}
                    style={{ width:"100%", padding:"10px 14px", borderRadius:9, border:"1.5px solid #e2e8f0", fontSize:13.5, boxSizing:"border-box", marginBottom:8, background:"#f8fafc", outline:"none" }}
                    onFocus={e => e.target.style.border="1.5px solid #2563eb"}
                    onBlur={e => e.target.style.border="1.5px solid #e2e8f0"}/>
                  <div style={{ maxHeight:220, overflowY:"auto", border:"1.5px solid #e2e8f0", borderRadius:9, background:"#fff" }}>
                    {filtered.length === 0 ? (
                      <div style={{ padding:"16px", textAlign:"center", color:"#94a3b8", fontSize:13 }}>No universities found</div>
                    ) : filtered.map(u => (
                      <div key={u.id} onClick={() => { update("universityId",u.id); setSearch(""); }}
                        style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 14px", cursor:"pointer", borderBottom:"1px solid #f1f5f9" }}
                        onMouseEnter={e => e.currentTarget.style.background="#f0f5ff"}
                        onMouseLeave={e => e.currentTarget.style.background="#fff"}>
                        <img src={u.logoUrl} alt="" style={{ width:36, height:36, objectFit:"contain", background:"#f8fafc", borderRadius:6, padding:3, flexShrink:0 }} onError={e => { e.target.style.display="none"; }}/>
                        <div>
                          <div style={{ fontSize:13, fontWeight:600, color:"#1e293b" }}>{u.name}</div>
                          <div style={{ fontSize:10.5, color:"#94a3b8" }}>{u.shortName} · {u.type}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            <div style={{ display:"grid", gridTemplateColumns:isMobile?"1fr":"1fr 1fr", gap:16, marginBottom:16 }}>
              {[
                { label:"STUDENT ID *", key:"studentId", placeholder:"e.g. 241-15-111" },
                { label:"DEPARTMENT *", key:"department", placeholder:"e.g. Computer Science" },
                { label:"SEMESTER", key:"semester", placeholder:"e.g. Spring '26" },
                { label:"SESSION", key:"session", placeholder:"e.g. 2024-2025" },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ display:"block", fontSize:11, fontWeight:700, color:"#374151", letterSpacing:1, marginBottom:5 }}>{f.label}</label>
                  <input type="text" value={form[f.key]} onChange={e => update(f.key, e.target.value)} placeholder={f.placeholder}
                    required={f.label.includes("*")}
                    style={{ width:"100%", padding:"10px 12px", borderRadius:8, border:"1.5px solid #e2e8f0", fontSize:13.5, boxSizing:"border-box", background:"#f8fafc", outline:"none" }}
                    onFocus={e => e.target.style.border="1.5px solid #2563eb"}
                    onBlur={e => e.target.style.border="1.5px solid #e2e8f0"}/>
                </div>
              ))}
            </div>

            <div style={{ display:"flex", flexDirection:isMobile?"column":"row", gap:12, marginTop:6 }}>
              <button type="button" onClick={() => navigate("/dashboard")}
                style={{ flex:1, padding:"12px", borderRadius:9, border:"1.5px solid #e2e8f0", cursor:"pointer", background:"#fff", fontSize:13.5, fontWeight:600, color:"#64748b" }}>
                Skip for now
              </button>
              <button type="submit" disabled={loading}
                style={{ flex:2, padding:"12px", borderRadius:9, border:"none", cursor:"pointer", background:"linear-gradient(135deg,#1a3a6b,#2563eb)", color:"#fff", fontSize:14, fontWeight:700, opacity:loading?0.7:1 }}>
                {loading ? "Saving..." : "Save & Continue →"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
