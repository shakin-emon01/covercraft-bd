import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import API from "../api/auth";
import { useViewport } from "../hooks/useViewport";

export default function Dashboard() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const { isMobile, isTablet } = useViewport();
  const [profile, setProfile] = useState(null);
  const [covers, setCovers] = useState([]);

  useEffect(() => {
    if (!user) { navigate("/login"); return; }
    API.get("/profile").then(r => setProfile(r.data)).catch(() => {});
    API.get("/covers").then(r => setCovers(r.data || [])).catch(() => {});
  }, [user]);

  const handleLogout = () => { logout(); navigate("/login"); };

  const stats = [
    { label:"Covers Created", value: covers.length || 0, icon:"📄", color:"#2563eb" },
    { label:"Templates Used", value: new Set(covers.map(c=>c.templateId)).size || 0, icon:"🎨", color:"#0d9488" },
    { label:"University", value: profile?.university?.shortName || "—", icon:"🏛️", color:"#7c3aed" },
    { label:"Semester", value: profile?.semester || "—", icon:"📅", color:"#b91c1c" },
  ];

  return (
    <div style={{ minHeight:"100vh", background:"#f1f5f9", fontFamily:"'Segoe UI',sans-serif" }}>
      {/* Navbar */}
      <nav style={{ background:"#fff", borderBottom:"1px solid #e2e8f0", padding:isMobile?"10px 14px":"0 32px", minHeight:64, display:"flex", flexDirection:isMobile?"column":"row", alignItems:isMobile?"stretch":"center", justifyContent:"space-between", gap:isMobile?10:0, position:"sticky", top:0, zIndex:100, boxShadow:"0 1px 4px rgba(0,0,0,0.04)" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <span style={{ fontSize:22 }}>📄</span>
          <span style={{ fontSize:16, fontWeight:900, color:"#1a3a6b" }}>CoverCraft BD</span>
        </div>
        <div style={{ display:"flex", alignItems:"center", justifyContent:isMobile?"space-between":"flex-end", flexWrap:"wrap", gap:isMobile?8:20 }}>
          <Link to="/create" style={{ textDecoration:"none", background:"linear-gradient(135deg,#1a3a6b,#2563eb)", color:"#fff", padding:"8px 18px", borderRadius:8, fontSize:13, fontWeight:700 }}>+ New Cover</Link>
          <div style={{ display:"flex", alignItems:"center", gap:10, cursor:"pointer" }}>
            <div style={{ width:36, height:36, borderRadius:"50%", background:"linear-gradient(135deg,#1a3a6b,#2563eb)", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontSize:14, fontWeight:700 }}>
              {user?.name?.charAt(0)?.toUpperCase()}
            </div>
            <div style={{ display:isMobile?"none":"block" }}>
              <div style={{ fontSize:13, fontWeight:700, color:"#1e293b" }}>{user?.name}</div>
              <div style={{ fontSize:10.5, color:"#94a3b8" }}>{user?.role}</div>
            </div>
          </div>
          <button onClick={handleLogout} style={{ background:"none", border:"1px solid #e2e8f0", borderRadius:7, padding:"6px 14px", fontSize:12, color:"#64748b", cursor:"pointer", fontWeight:600 }}>Sign Out</button>
        </div>
      </nav>

      <div style={{ maxWidth:1100, margin:"0 auto", padding:isMobile?"16px 12px 24px":isTablet?"24px 16px":"32px 24px" }}>
        {/* Welcome banner */}
        <div style={{ background:"linear-gradient(135deg,#1a3a6b 0%,#2563eb 60%,#60a5fa 100%)", borderRadius:16, padding:isMobile?"20px 16px":"28px 32px", marginBottom:28, position:"relative", overflow:"hidden" }}>
          <div style={{ position:"absolute", top:-60, right:-60, width:240, height:240, borderRadius:"50%", background:"rgba(255,255,255,0.06)" }}/>
          <div style={{ position:"absolute", bottom:-40, right:100, width:160, height:160, borderRadius:"50%", background:"rgba(255,255,255,0.04)" }}/>
          <div style={{ position:"relative", zIndex:1 }}>
            <div style={{ fontSize:13, color:"rgba(255,255,255,0.65)", marginBottom:6 }}>Welcome back,</div>
            <h1 style={{ fontSize:isMobile?22:26, fontWeight:900, color:"#fff", margin:"0 0 8px" }}>{user?.name} 👋</h1>
            <p style={{ fontSize:13.5, color:"rgba(255,255,255,0.7)", margin:"0 0 18px" }}>
              {profile ? `${profile.university?.name} · ${profile.department}` : "Complete your profile to get started"}
            </p>
            <div style={{ display:"flex", flexDirection:isMobile?"column":"row", gap:10 }}>
              <button onClick={() => navigate("/create")} style={{ background:"#fff", color:"#1a3a6b", border:"none", padding:"10px 22px", borderRadius:8, fontSize:13, fontWeight:800, cursor:"pointer" }}>
                🎨 Create Cover Page
              </button>
              {!profile && (
                <button onClick={() => navigate("/profile/setup")} style={{ background:"rgba(255,255,255,0.15)", color:"#fff", border:"1px solid rgba(255,255,255,0.3)", padding:"10px 22px", borderRadius:8, fontSize:13, fontWeight:600, cursor:"pointer" }}>
                  👤 Setup Profile
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display:"grid", gridTemplateColumns:isMobile?"1fr 1fr":isTablet?"repeat(2,1fr)":"repeat(4,1fr)", gap:16, marginBottom:28 }}>
          {stats.map((s,i) => (
            <div key={i} style={{ background:"#fff", borderRadius:12, padding:"20px", boxShadow:"0 1px 4px rgba(0,0,0,0.05)", borderTop:`3px solid ${s.color}` }}>
              <div style={{ fontSize:24, marginBottom:8 }}>{s.icon}</div>
              <div style={{ fontSize:22, fontWeight:900, color:"#1e293b", marginBottom:2 }}>{s.value}</div>
              <div style={{ fontSize:12, color:"#94a3b8", fontWeight:600 }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display:"grid", gridTemplateColumns:isTablet || isMobile ? "1fr" : "2fr 1fr", gap:20 }}>
          {/* Recent covers */}
          <div style={{ background:"#fff", borderRadius:14, padding:"24px", boxShadow:"0 1px 4px rgba(0,0,0,0.05)" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
              <h2 style={{ fontSize:16, fontWeight:800, color:"#1e293b", margin:0 }}>Recent Covers</h2>
              <button onClick={() => navigate("/create")} style={{ background:"#f0f5ff", color:"#2563eb", border:"none", padding:"7px 14px", borderRadius:7, fontSize:12, fontWeight:700, cursor:"pointer" }}>+ New</button>
            </div>
            {covers.length === 0 ? (
              <div style={{ textAlign:"center", padding:"40px 20px" }}>
                <div style={{ fontSize:40, marginBottom:12 }}>📋</div>
                <div style={{ fontSize:14, fontWeight:700, color:"#1e293b", marginBottom:6 }}>No covers yet</div>
                <div style={{ fontSize:13, color:"#94a3b8", marginBottom:18 }}>Create your first academic cover page</div>
                <button onClick={() => navigate("/create")} style={{ background:"linear-gradient(135deg,#1a3a6b,#2563eb)", color:"#fff", border:"none", padding:"10px 22px", borderRadius:8, fontSize:13, fontWeight:700, cursor:"pointer" }}>
                  Get Started
                </button>
              </div>
            ) : covers.slice(0,5).map(cover => (
              <div key={cover.id} style={{ display:"flex", alignItems:isMobile?"flex-start":"center", flexDirection:isMobile?"column":"row", gap:14, padding:"12px 0", borderBottom:"1px solid #f1f5f9" }}>
                <div style={{ width:40, height:48, background:"#f0f5ff", borderRadius:6, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, flexShrink:0 }}>📄</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13.5, fontWeight:700, color:"#1e293b" }}>{cover.coverData?.courseCode || "Cover Page"}</div>
                  <div style={{ fontSize:11.5, color:"#94a3b8" }}>{cover.coverData?.courseTitle} · Template {cover.templateId}</div>
                </div>
                <div style={{ fontSize:11, color:"#cbd5e1", alignSelf:isMobile?"flex-start":"auto" }}>{new Date(cover.createdAt).toLocaleDateString()}</div>
              </div>
            ))}
          </div>

          {/* Profile card */}
          <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
            <div style={{ background:"#fff", borderRadius:14, padding:"22px", boxShadow:"0 1px 4px rgba(0,0,0,0.05)" }}>
              <h3 style={{ fontSize:14, fontWeight:800, color:"#1e293b", margin:"0 0 16px" }}>Your Profile</h3>
              {profile ? (
                <div>
                  <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:16, paddingBottom:14, borderBottom:"1px solid #f1f5f9" }}>
                    <img src={profile.university?.logoUrl} alt="" style={{ width:48, height:48, objectFit:"contain", borderRadius:8, background:"#f8fafc", padding:4 }} onError={e => {e.target.style.display="none"}}/>
                    <div>
                      <div style={{ fontSize:12.5, fontWeight:700, color:"#1e293b" }}>{profile.university?.shortName}</div>
                      <div style={{ fontSize:11, color:"#94a3b8" }}>{profile.university?.type}</div>
                    </div>
                  </div>
                  {[
                    { label:"Student ID", value:profile.studentId },
                    { label:"Department", value:profile.department },
                    { label:"Semester", value:profile.semester },
                    { label:"Session", value:profile.session },
                  ].map((item,i) => (
                    <div key={i} style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
                      <span style={{ fontSize:11.5, color:"#94a3b8" }}>{item.label}</span>
                      <span style={{ fontSize:11.5, fontWeight:700, color:"#1e293b" }}>{item.value || "—"}</span>
                    </div>
                  ))}
                  <button onClick={() => navigate("/profile/setup")} style={{ width:"100%", marginTop:10, padding:"8px", borderRadius:7, border:"1px solid #e2e8f0", background:"#fff", fontSize:12, fontWeight:600, color:"#64748b", cursor:"pointer" }}>
                    ✏️ Edit Profile
                  </button>
                </div>
              ) : (
                <div style={{ textAlign:"center", padding:"20px 0" }}>
                  <div style={{ fontSize:28, marginBottom:10 }}>👤</div>
                  <div style={{ fontSize:13, color:"#64748b", marginBottom:14 }}>Profile not set up yet</div>
                  <button onClick={() => navigate("/profile/setup")} style={{ background:"linear-gradient(135deg,#1a3a6b,#2563eb)", color:"#fff", border:"none", padding:"9px 18px", borderRadius:8, fontSize:12.5, fontWeight:700, cursor:"pointer" }}>
                    Setup Profile
                  </button>
                </div>
              )}
            </div>

            <div style={{ background:"linear-gradient(135deg,#134e4a,#0d9488)", borderRadius:14, padding:"22px", color:"#fff" }}>
              <div style={{ fontSize:20, marginBottom:10 }}>🚀</div>
              <div style={{ fontSize:14, fontWeight:800, marginBottom:6 }}>Ready to create?</div>
              <div style={{ fontSize:12, opacity:0.75, marginBottom:14, lineHeight:1.6 }}>Pick from multiple templates and generate your cover page in seconds.</div>
              <button onClick={() => navigate("/create")} style={{ background:"rgba(255,255,255,0.2)", border:"1px solid rgba(255,255,255,0.3)", color:"#fff", padding:"9px 18px", borderRadius:8, fontSize:12.5, fontWeight:700, cursor:"pointer", width:"100%" }}>
                Start Creating →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
