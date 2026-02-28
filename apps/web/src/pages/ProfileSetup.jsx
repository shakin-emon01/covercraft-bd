import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import API from "../api/auth"; 
import { useViewport } from "../hooks/useViewport";

export default function ProfileSetup() {
  const [unis, setUnis] = useState([]);
  const [form, setForm] = useState({ studentName:"", studentId:"", department:"", semester:"", universityId:"" });
  const [logoFile, setLogoFile] = useState(null); 
  const [loading, setLoading] = useState(false);
  const [bootLoading, setBootLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  
  // 🚀 Fetch token to use in our bulletproof native API call
  const { user, setAuth, token } = useAuthStore();
  const navigate = useNavigate();
  const { isMobile } = useViewport();

  useEffect(() => {
    const loadInitial = async () => {
      let loadFailed = false;
      try {
        const [unisRes, profileRes] = await Promise.allSettled([
          API.get("/universities"),
          API.get("/profile"),
        ]);

        if (unisRes.status === "fulfilled") {
          setUnis(unisRes.value.data || []);
        } else {
          setUnis([]);
          loadFailed = true;
        }

        if (profileRes.status === "fulfilled" && profileRes.value?.data) {
          const profile = profileRes.value.data;
          setForm({
            studentName: profile.user?.name || user?.name || "",
            studentId: profile.studentId || "",
            department: profile.department || "",
            semester: profile.semester || "",
            universityId: profile.universityId || "",
          });
        } else {
          const status = profileRes.status === "rejected" ? profileRes.reason?.response?.status : null;
          // New users won't have a profile yet; 404 is expected and not an error.
          if (status && status !== 404) {
            loadFailed = true;
          }
          setForm((p) => ({ ...p, studentName: user?.name || "" }));
        }

        if (loadFailed) {
          setError("Failed to load profile setup data. Please try again.");
        }
      } catch {
        setError("Failed to load profile setup data. Please try again.");
      } finally {
        setBootLoading(false);
      }
    };

    loadInitial();
  }, [user]);

  const filtered = unis.filter(u => u.name.toLowerCase().includes(search.toLowerCase()) || u.shortName.toLowerCase().includes(search.toLowerCase()));
  const selectedUni = unis.find(u => u.id === form.universityId);
  const update = (k,v) => setForm(p => ({...p,[k]:v}));

  // 🚀 Convert File to Base64 Text
  const toBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.universityId) { setError("Please select your university"); return; }
    setLoading(true); setError("");
    
    try {
      // 1. Save Profile Data
      console.log('🔄 Step 1: Saving profile...', form);
      await API.put("/profile", form);
      console.log('✅ Step 1: Profile saved successfully!');

      // 2. 🚀 BULLETPROOF UPLOAD: Send file as JSON String
      if (logoFile && form.universityId) {
        console.log('🔄 Step 2: Converting file to Base64...', logoFile.name);
        const base64String = await toBase64(logoFile);
        console.log('✅ Step 2a: Base64 conversion done. Length:', base64String?.length);
        console.log('🔄 Step 2b: Uploading to:', `/universities/${form.universityId}/logo-request`);
        
        const uploadResponse = await API.post(`/universities/${form.universityId}/logo-request`, {
          fileBase64: base64String,
          fileName: logoFile.name
        });
        console.log('✅ Step 2: Upload successful!', uploadResponse.data);
      }

      // 3. Update global user state
      console.log('🔄 Step 3: Updating auth state and redirecting...');
      setAuth({ ...user, name: form.studentName }, token); 
      navigate("/dashboard");
    } catch (err) {
      console.error('❌ Error occurred:', err);
      console.error('❌ Error response:', err.response);
      setError(err.response?.data?.message || err.message || "Failed to save profile or logo");
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight:"100vh", background:"linear-gradient(135deg,#f0f5ff 0%,#fff 60%)", fontFamily:"'Segoe UI',sans-serif", display:"flex", alignItems:"center", justifyContent:"center", padding:isMobile?"16px 12px":"30px 20px" }}>
      <div style={{ width:"100%", maxWidth:680, background:"#fff", borderRadius:20, boxShadow:"0 20px 60px rgba(0,0,0,0.1)", overflow:"hidden" }}>
        <div style={{ background:"linear-gradient(135deg,#1a3a6b,#2563eb)", padding:isMobile?"24px 18px":"32px 40px" }}>
          <div style={{ fontSize:10, color:"rgba(255,255,255,0.6)", letterSpacing:3, fontWeight:700, marginBottom:6 }}>STEP 2 OF 2</div>
          <h1 style={{ color:"#fff", fontSize:24, fontWeight:900, margin:"0 0 6px" }}>Complete Your Profile</h1>
          <p style={{ color:"rgba(255,255,255,0.65)", fontSize:13.5, margin:0 }}>
            Hi {user?.name}! This info will auto-fill your cover pages so you never have to type it again.
          </p>
        </div>

        <div style={{ padding:isMobile?"22px 16px":"32px 40px" }}>
          {bootLoading && <div style={{ background:"#eff6ff", border:"1px solid #bfdbfe", borderRadius:8, padding:"10px 14px", marginBottom:18, fontSize:13, color:"#1e40af" }}>Loading your saved profile...</div>}
          {error && <div style={{ background:"#fef2f2", border:"1px solid #fecaca", borderRadius:8, padding:"10px 14px", marginBottom:18, fontSize:13, color:"#dc2626", fontWeight: "bold" }}>⚠️ {error}</div>}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom:22 }}>
              <label style={{ display:"block", fontSize:11, fontWeight:700, color:"#374151", letterSpacing:1, marginBottom:8 }}>SELECT YOUR UNIVERSITY *</label>
              
              {selectedUni ? (
                <div>
                  <div style={{ display:"flex", alignItems:"center", gap:14, background:"#f0f5ff", border:"2px solid #2563eb", borderRadius:10, padding:"12px 16px", marginBottom:8 }}>
                    <img src={selectedUni.logoUrl} alt="" style={{ width:44, height:44, objectFit:"contain", borderRadius:6, background:"#fff", padding:4 }} onError={e => { e.target.style.display="none"; }}/>
                    <div>
                      <div style={{ fontSize:14, fontWeight:700, color:"#1a3a6b" }}>{selectedUni.name}</div>
                      <div style={{ fontSize:11, color:"#64748b" }}>{selectedUni.type === "PUBLIC" ? "🏛️ Public University" : "🏢 Private University"}</div>
                    </div>
                    <button type="button" onClick={() => { update("universityId",""); setLogoFile(null); }} style={{ marginLeft:"auto", background:"none", border:"none", cursor:"pointer", color:"#94a3b8", fontSize:18 }}>✕</button>
                  </div>
                  
                  {!selectedUni.logoUrl && (
                    <div style={{ marginTop: 10, padding: 12, background: "#fffbeb", border: "1px dashed #f59e0b", borderRadius: 8 }}>
                      <div style={{ fontSize: 11, color: "#d97706", fontWeight: 700, marginBottom: 5 }}>⚠️ We don't have your university logo yet!</div>
                      <div style={{ fontSize: 10, color: "#92400e", marginBottom: 8 }}>Upload a clean PNG logo to help us (Admin will review it).</div>
                      <input type="file" accept="image/png, image/jpeg" onChange={(e) => setLogoFile(e.target.files[0])} style={{ fontSize: 11, width: "100%" }} />
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <input type="text" placeholder="Search university name..." value={search} onChange={e => setSearch(e.target.value)}
                    style={{ width:"100%", padding:"10px 14px", borderRadius:9, border:"1.5px solid #e2e8f0", fontSize:13.5, boxSizing:"border-box", marginBottom:8, background:"#f8fafc", outline:"none" }}
                    onFocus={e => e.target.style.border="1.5px solid #2563eb"} onBlur={e => e.target.style.border="1.5px solid #e2e8f0"}/>
                  <div style={{ maxHeight:220, overflowY:"auto", border:"1.5px solid #e2e8f0", borderRadius:9, background:"#fff" }}>
                    {filtered.length === 0 ? <div style={{ padding:"16px", textAlign:"center", color:"#94a3b8", fontSize:13 }}>No universities found</div> : filtered.map(u => (
                      <div key={u.id} onClick={() => { update("universityId",u.id); setSearch(""); }} style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 14px", cursor:"pointer", borderBottom:"1px solid #f1f5f9" }} onMouseEnter={e => e.currentTarget.style.background="#f0f5ff"} onMouseLeave={e => e.currentTarget.style.background="#fff"}>
                        <img src={u.logoUrl} alt="" style={{ width:36, height:36, objectFit:"contain", background:"#f8fafc", borderRadius:6, padding:3, flexShrink:0 }} onError={e => { e.target.style.display="none"; }}/>
                        <div><div style={{ fontSize:13, fontWeight:600, color:"#1e293b" }}>{u.name}</div><div style={{ fontSize:10.5, color:"#94a3b8" }}>{u.shortName} · {u.type}</div></div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            <div style={{ display:"grid", gridTemplateColumns:isMobile?"1fr":"1fr 1fr", gap:16, marginBottom:16 }}>
              {[
                { label:"STUDENT NAME *", key:"studentName", placeholder:"e.g. Shakin Ahammed Emon" },
                { label:"STUDENT ID *", key:"studentId", placeholder:"e.g. 241-15-111" },
                { label:"DEPARTMENT *", key:"department", placeholder:"e.g. Computer Science" },
                { label:"SEMESTER", key:"semester", placeholder:"e.g. Spring '26" },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ display:"block", fontSize:11, fontWeight:700, color:"#374151", letterSpacing:1, marginBottom:5 }}>{f.label}</label>
                  <input type="text" value={form[f.key]} onChange={e => update(f.key, e.target.value)} placeholder={f.placeholder} required={f.label.includes("*")}
                    style={{ width:"100%", padding:"10px 12px", borderRadius:8, border:"1.5px solid #e2e8f0", fontSize:13.5, boxSizing:"border-box", background:"#f8fafc", outline:"none" }}
                    onFocus={e => e.target.style.border="1.5px solid #2563eb"} onBlur={e => e.target.style.border="1.5px solid #e2e8f0"}/>
                </div>
              ))}
            </div>

            <div style={{ display:"flex", flexDirection:isMobile?"column":"row", gap:12, marginTop:6 }}>
              <button type="button" onClick={() => navigate("/dashboard")} style={{ flex:1, padding:"12px", borderRadius:9, border:"1.5px solid #e2e8f0", cursor:"pointer", background:"#fff", fontSize:13.5, fontWeight:600, color:"#64748b" }}>Skip for now</button>
              <button type="submit" disabled={loading} style={{ flex:2, padding:"12px", borderRadius:9, border:"none", cursor:"pointer", background:"linear-gradient(135deg,#1a3a6b,#2563eb)", color:"#fff", fontSize:14, fontWeight:700, opacity:loading?0.7:1 }}>{loading ? "Saving & Uploading..." : "Save & Continue →"}</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
