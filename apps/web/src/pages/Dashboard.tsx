/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import API, { deleteCover, getActiveBroadcast } from "../api/auth";
import { useViewport } from "../hooks/useViewport";

export default function Dashboard() {
  const { user, token, logout } = useAuthStore();
  const navigate = useNavigate();
  const { isMobile, isTablet } = useViewport();
  const [profile, setProfile] = useState(null);
  const [covers, setCovers] = useState([]);
  const [coversLoading, setCoversLoading] = useState(true);
  const [deletingCoverId, setDeletingCoverId] = useState("");
  const [broadcast, setBroadcast] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [recentViewMode, setRecentViewMode] = useState("default");
  const [savedViewMode, setSavedViewMode] = useState("cards");
  const [mobileProfileOpen, setMobileProfileOpen] = useState(false);

  useEffect(() => {
    if (!user || !token) {
      logout();
      navigate("/login");
      return;
    }

    let cancelled = false;
    const loadDashboardData = async () => {
      setLoadError("");
      setCoversLoading(true);

      const [profileRes, coversRes, broadcastRes] = await Promise.allSettled([
        API.get("/profile"),
        API.get("/covers"),
        getActiveBroadcast(),
      ]);

      if (cancelled) return;

      if (profileRes.status === "fulfilled") {
        setProfile(profileRes.value.data);
      } else {
        setProfile(null);
      }

      if (coversRes.status === "fulfilled") {
        setCovers(coversRes.value.data || []);
      } else {
        setCovers([]);
        setLoadError("Could not load dashboard data. Please ensure backend server is running on port 5000.");
      }

      if (broadcastRes.status === "fulfilled") {
        setBroadcast(broadcastRes.value.data);
      } else {
        setBroadcast(null);
      }

      setCoversLoading(false);
    };

    loadDashboardData();
    return () => {
      cancelled = true;
    };
  }, [user, token, logout, navigate]);

  useEffect(() => {
    if (isMobile) {
      setRecentViewMode("list");
      setSavedViewMode("list");
      return;
    }
    setRecentViewMode("default");
    setSavedViewMode("cards");
    setMobileProfileOpen(false);
  }, [isMobile]);

  const handleLogout = () => { logout(); navigate("/login"); };

  const handleDuplicate = (cover) => {
    const coverForm = cover?.coverData || {};
    localStorage.setItem(
      "covercraft_draft",
      JSON.stringify({
        form: coverForm,
        selectedTemplate: Number(cover?.templateId) || 1,
        selectedPalette: cover?.paletteId || "blue",
      })
    );
    navigate("/create");
  };

  const handleDeleteCover = async (coverId) => {
    if (!window.confirm("Are you sure you want to delete this saved cover?")) return;
    setDeletingCoverId(coverId);
    try {
      await deleteCover(coverId);
      setCovers((prev) => prev.filter((cover) => cover.id !== coverId));
    } catch (error) {
      alert(error?.response?.data?.message || "Failed to delete cover.");
    } finally {
      setDeletingCoverId("");
    }
  };

  const stats = [
    { label:"Covers Created", value: covers.length || 0, icon:"📄", color:"#2563eb" },
    { label:"Templates Used", value: new Set(covers.map(c=>c.templateId)).size || 0, icon:"🎨", color:"#0d9488" },
    { label:"University", value: profile?.university?.shortName || "—", icon:"🏛️", color:"#7c3aed" },
    { label:"Semester", value: profile?.semester || "—", icon:"📅", color:"#b91c1c" },
  ];

  const getExpiryDate = (cover) => {
    if (cover?.expiresAt) return new Date(cover.expiresAt);
    const createdAt = new Date(cover.createdAt);
    return new Date(createdAt.getTime() + 30 * 24 * 60 * 60 * 1000);
  };

  const previewCovers = covers.slice(0, 6);
  const recentCovers = covers.slice(0, 5);

  return (
    <div style={{ minHeight:"100vh", background:"#f1f5f9", fontFamily:"'Segoe UI',sans-serif" }}>
      {/* Navbar */}
      <nav style={{ background:"#fff", borderBottom:"1px solid #e2e8f0", padding:isMobile?"10px 14px":"0 32px", minHeight:64, display:"flex", flexDirection:isMobile?"column":"row", alignItems:isMobile?"stretch":"center", justifyContent:"space-between", gap:isMobile?10:0, position:"sticky", top:0, zIndex:140, boxShadow:"0 1px 4px rgba(0,0,0,0.04)" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <span style={{ fontSize:22 }}>📄</span>
          <span style={{ fontSize:16, fontWeight:900, color:"#1a3a6b" }}>CoverCraft BD</span>
        </div>
        <div style={{ display:"flex", alignItems:"center", justifyContent:isMobile?"space-between":"flex-end", flexWrap:"wrap", gap:isMobile?8:20 }}>
          <Link to="/create" style={{ textDecoration:"none", background:"linear-gradient(135deg,#1a3a6b,#2563eb)", color:"#fff", padding:"8px 18px", borderRadius:8, fontSize:13, fontWeight:700 }}>+ New Cover</Link>
          <div style={{ position: "relative", display:"flex", alignItems:"center", gap:10 }}>
            <button
              type="button"
              onClick={() => {
                if (isMobile) setMobileProfileOpen((prev) => !prev);
              }}
              style={{ width:36, height:36, borderRadius:"50%", background:"linear-gradient(135deg,#1a3a6b,#2563eb)", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontSize:14, fontWeight:700, border:"none", cursor:isMobile?"pointer":"default" }}
              aria-label="Open mobile profile menu"
            >
              {user?.name?.charAt(0)?.toUpperCase()}
            </button>
            <div style={{ display:isMobile?"none":"block" }}>
              <div style={{ fontSize:13, fontWeight:700, color:"#1e293b" }}>{user?.name}</div>
              <div style={{ fontSize:10.5, color:"#94a3b8" }}>{user?.role}</div>
            </div>
          </div>
          <button onClick={handleLogout} style={{ background:"none", border:"1px solid #e2e8f0", borderRadius:7, padding:"6px 14px", fontSize:12, color:"#64748b", cursor:"pointer", fontWeight:600 }}>Sign Out</button>
        </div>
      </nav>

      <div style={{ maxWidth:1100, margin:"0 auto", padding:isMobile?"16px 12px 24px":isTablet?"24px 16px":"32px 24px" }}>
        {loadError && (
          <div style={{ background:"#fef2f2", border:"1px solid #fecaca", borderRadius:8, padding:"10px 14px", marginBottom:16, color:"#dc2626", fontSize:13, fontWeight:700 }}>
            {loadError}
          </div>
        )}

        {isMobile && mobileProfileOpen && (
          <div style={{ background:"#fff", borderRadius:14, padding:"14px 12px", marginBottom:16, boxShadow:"0 1px 4px rgba(0,0,0,0.05)", border:"1px solid #e2e8f0" }}>
            <h3 style={{ fontSize:14, fontWeight:800, color:"#1e293b", margin:"0 0 12px" }}>Your Profile</h3>
            {profile ? (
              <>
                <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12, paddingBottom:10, borderBottom:"1px solid #f1f5f9" }}>
                  <img src={profile.university?.logoUrl} alt="" style={{ width:40, height:40, objectFit:"contain", borderRadius:8, background:"#f8fafc", padding:4 }} onError={e => {e.target.style.display="none";}}/>
                  <div>
                    <div style={{ fontSize:12.5, fontWeight:700, color:"#1e293b" }}>{profile.university?.shortName || "University"}</div>
                    <div style={{ fontSize:11, color:"#94a3b8" }}>{profile.university?.type || "Student"}</div>
                  </div>
                </div>
                {[{ label:"Student ID", value:profile.studentId }, { label:"Department", value:profile.department }, { label:"Semester", value:profile.semester }].map((item, idx) => (
                  <div key={idx} style={{ display:"flex", justifyContent:"space-between", gap:12, marginBottom:6 }}>
                    <span style={{ fontSize:11.5, color:"#94a3b8" }}>{item.label}</span>
                    <span style={{ fontSize:11.5, fontWeight:700, color:"#1e293b", textAlign:"right" }}>{item.value || "—"}</span>
                  </div>
                ))}
                <button
                  onClick={() => { setMobileProfileOpen(false); navigate("/profile/setup"); }}
                  style={{ width:"100%", marginTop:10, padding:"8px", borderRadius:7, border:"1px solid #e2e8f0", background:"#fff", fontSize:12, fontWeight:700, color:"#64748b", cursor:"pointer" }}
                >
                  ✏️ Edit Profile
                </button>
              </>
            ) : (
              <div style={{ textAlign:"center" }}>
                <div style={{ fontSize:12.5, color:"#64748b", marginBottom:10 }}>Profile not set up yet</div>
                <button
                  onClick={() => { setMobileProfileOpen(false); navigate("/profile/setup"); }}
                  style={{ width:"100%", border:"none", background:"linear-gradient(135deg,#1a3a6b,#2563eb)", color:"#fff", borderRadius:8, padding:"9px 12px", fontSize:12.5, fontWeight:700, cursor:"pointer" }}
                >
                  Setup Profile
                </button>
              </div>
            )}
          </div>
        )}

        {broadcast?.isActive && (
          <div
            style={{
              background: broadcast.type === "warning" ? "#fef08a" : broadcast.type === "success" ? "#bbf7d0" : "#bfdbfe",
              color: broadcast.type === "warning" ? "#854d0e" : broadcast.type === "success" ? "#166534" : "#1e40af",
              padding: "12px 20px",
              borderRadius: 8,
              marginBottom: 24,
              display: "flex",
              alignItems: "center",
              gap: 12,
              fontWeight: 700,
              border: "1px solid rgba(0,0,0,0.05)",
            }}
          >
            <span style={{ fontSize: 18 }}>{broadcast.type === "warning" ? "🔥" : broadcast.type === "success" ? "🎉" : "📢"}</span>
            {broadcast.message}
          </div>
        )}

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
          <div style={{ background:"#fff", borderRadius:14, padding:isMobile ? "18px 14px" : "24px", boxShadow:"0 1px 4px rgba(0,0,0,0.05)" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", gap:10, marginBottom:20, flexWrap:"wrap" }}>
              <h2 style={{ fontSize:16, fontWeight:800, color:"#1e293b", margin:0 }}>Recent Covers</h2>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginLeft:"auto" }}>
                <div style={{ display:"flex", background:"#f1f5f9", borderRadius:8, padding:3 }}>
                  <button
                    onClick={() => setRecentViewMode("default")}
                    style={{ border:"none", background: recentViewMode === "default" ? "#fff" : "transparent", color: recentViewMode === "default" ? "#1e293b" : "#64748b", fontSize:11.5, fontWeight:700, borderRadius:6, padding:"6px 10px", cursor:"pointer" }}
                  >
                    Default
                  </button>
                  <button
                    onClick={() => setRecentViewMode("list")}
                    style={{ border:"none", background: recentViewMode === "list" ? "#fff" : "transparent", color: recentViewMode === "list" ? "#1e293b" : "#64748b", fontSize:11.5, fontWeight:700, borderRadius:6, padding:"6px 10px", cursor:"pointer" }}
                  >
                    List
                  </button>
                </div>
                <button onClick={() => navigate("/create")} style={{ background:"#f0f5ff", color:"#2563eb", border:"none", padding:"7px 14px", borderRadius:7, fontSize:12, fontWeight:700, cursor:"pointer" }}>+ New</button>
              </div>
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
            ) : recentViewMode === "default" ? (
              recentCovers.map((cover) => (
                <div key={cover.id} style={{ display:"flex", alignItems:isMobile?"flex-start":"center", flexDirection:isMobile?"column":"row", gap:14, padding:"12px 0", borderBottom:"1px solid #f1f5f9" }}>
                  <div style={{ width:40, height:48, background:"#f0f5ff", borderRadius:6, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, flexShrink:0 }}>📄</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13.5, fontWeight:700, color:"#1e293b" }}>{cover.coverData?.courseCode || "Cover Page"}</div>
                    <div style={{ fontSize:11.5, color:"#94a3b8" }}>{cover.coverData?.courseTitle} · Template {cover.templateId}</div>
                  </div>
                  <div style={{ fontSize:11, color:"#cbd5e1", alignSelf:isMobile?"flex-start":"auto" }}>{new Date(cover.createdAt).toLocaleDateString()}</div>
                </div>
              ))
            ) : (
              <div style={{ display:"flex", flexDirection:"column", gap:2 }}>
                {recentCovers.map((cover) => (
                  <div key={cover.id} style={{ padding:"10px 0", borderBottom:"1px solid #f1f5f9" }}>
                    <div style={{ fontSize:14, fontWeight:800, color:"#1e293b" }}>{cover.coverData?.courseCode || "Cover Page"}</div>
                    <div style={{ fontSize:12, color:"#64748b", marginTop:3, lineHeight:1.4 }}>{cover.coverData?.courseTitle || cover.coverData?.topicName || "Untitled Assignment"}</div>
                    <div style={{ fontSize:11.5, color:"#94a3b8", marginTop:6 }}>{new Date(cover.createdAt).toLocaleDateString()} · Template {cover.templateId}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {!isMobile && (
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
          )}
        </div>

        <div style={{ marginTop: 26, background: "#fff", borderRadius: 14, padding: isMobile ? "18px 14px" : "24px", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 18, borderBottom: "2px solid #e2e8f0", paddingBottom: 10 }}>
            <h2 style={{ fontSize: 18, color: "#64748b", margin: 0 }}>
              ☁️ My Saved Covers ({covers.length})
            </h2>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: "auto" }}>
              <div style={{ display:"flex", background:"#f1f5f9", borderRadius:8, padding:3 }}>
                <button
                  onClick={() => setSavedViewMode("cards")}
                  style={{ border:"none", background: savedViewMode === "cards" ? "#fff" : "transparent", color: savedViewMode === "cards" ? "#1e293b" : "#64748b", fontSize:11.5, fontWeight:700, borderRadius:6, padding:"6px 10px", cursor:"pointer" }}
                >
                  Default
                </button>
                <button
                  onClick={() => setSavedViewMode("list")}
                  style={{ border:"none", background: savedViewMode === "list" ? "#fff" : "transparent", color: savedViewMode === "list" ? "#1e293b" : "#64748b", fontSize:11.5, fontWeight:700, borderRadius:6, padding:"6px 10px", cursor:"pointer" }}
                >
                  List
                </button>
              </div>
              <button
                type="button"
                onClick={() => navigate("/covers")}
                style={{ background: "#eff6ff", color: "#2563eb", border: "1px solid #bfdbfe", borderRadius: 8, padding: "7px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
              >
                See All →
              </button>
            </div>
          </div>

          {coversLoading ? (
            <div style={{ color: "#64748b", fontWeight: 700 }}>Loading your cloud library...</div>
          ) : covers.length === 0 ? (
            <div style={{ background: "#f8fafc", padding: "40px", textAlign: "center", borderRadius: "12px", border: "1px dashed #cbd5e1" }}>
              <div style={{ fontSize: "40px", marginBottom: "10px" }}>📁</div>
              <div style={{ color: "#64748b", fontWeight: "bold" }}>No covers saved yet!</div>
              <p style={{ color: "#94a3b8", fontSize: "14px" }}>Generate your first cover and it will appear here forever.</p>
            </div>
          ) : savedViewMode === "cards" ? (
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : isTablet ? "1fr 1fr" : "repeat(3, minmax(0, 1fr))", gap: "16px" }}>
              {previewCovers.map((cover) => (
                <div key={cover.id} style={{ background: "#fff", padding: "18px", borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 4px 6px rgba(0,0,0,0.02)" }}>
                  <div style={{ fontSize: "12px", color: "#2563eb", fontWeight: "bold", textTransform: "uppercase", marginBottom: "8px" }}>
                    Course: {cover.coverData?.courseCode || "N/A"}
                  </div>
                  <h3 style={{ margin: "0 0 10px", fontSize: "16px", color: "#0f172a" }}>{cover.coverData?.topicName || "Untitled Assignment"}</h3>
                  <div style={{ fontSize: "13px", color: "#64748b", marginBottom: "6px" }}>
                    Created: {new Date(cover.createdAt).toLocaleDateString()}
                  </div>
                  <div style={{ fontSize: "12px", color: "#b45309", marginBottom: "16px", fontWeight: 700 }}>
                    Expires: {getExpiryDate(cover).toLocaleDateString()}
                  </div>

                  <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: "10px" }}>
                    <button onClick={() => handleDuplicate(cover)} style={{ flex: isMobile ? "none" : 1, width: isMobile ? "100%" : "auto", padding: "8px", background: "#f1f5f9", color: "#334155", border: "none", borderRadius: "6px", fontWeight: "bold", cursor: "pointer" }}>
                      🔄 Duplicate & Edit
                    </button>
                    <button onClick={() => navigate(`/share/${cover.id}`)} style={{ width: isMobile ? "100%" : "auto", padding: "8px 14px", background: "#e0e7ff", color: "#4f46e5", border: "none", borderRadius: "6px", fontWeight: "bold", cursor: "pointer" }}>
                      🔗 Link
                    </button>
                    <button
                      onClick={() => handleDeleteCover(cover.id)}
                      disabled={deletingCoverId === cover.id}
                      style={{ width: isMobile ? "100%" : "auto", padding: "8px 14px", background: "#fee2e2", color: "#dc2626", border: "none", borderRadius: "6px", fontWeight: "bold", cursor: deletingCoverId === cover.id ? "not-allowed" : "pointer", opacity: deletingCoverId === cover.id ? 0.7 : 1 }}
                    >
                      {deletingCoverId === cover.id ? "Deleting..." : "🗑 Delete"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {previewCovers.map((cover) => (
                <div key={cover.id} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: isMobile ? "12px 10px" : "14px 12px", display: "flex", flexDirection: isMobile ? "column" : "row", gap: 12, alignItems: isMobile ? "stretch" : "center", justifyContent: "space-between" }}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: 12, color: "#2563eb", fontWeight: 800, textTransform: "uppercase", marginBottom: 4 }}>
                      {cover.coverData?.courseCode || "N/A"}
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: "#0f172a", marginBottom: 4, lineHeight: 1.35 }}>
                      {cover.coverData?.topicName || "Untitled Assignment"}
                    </div>
                    <div style={{ fontSize: 12, color: "#64748b" }}>
                      Created: {new Date(cover.createdAt).toLocaleDateString()} · Expires: {getExpiryDate(cover).toLocaleDateString()}
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: 8, width: isMobile ? "100%" : "auto" }}>
                    <button onClick={() => handleDuplicate(cover)} style={{ padding: "8px 10px", background: "#f1f5f9", color: "#334155", border: "none", borderRadius: 6, fontWeight: 700, cursor: "pointer", width: isMobile ? "100%" : "auto" }}>
                      🔄 Duplicate
                    </button>
                    <button onClick={() => navigate(`/share/${cover.id}`)} style={{ padding: "8px 10px", background: "#e0e7ff", color: "#4f46e5", border: "none", borderRadius: 6, fontWeight: 700, cursor: "pointer", width: isMobile ? "100%" : "auto" }}>
                      🔗 Link
                    </button>
                    <button
                      onClick={() => handleDeleteCover(cover.id)}
                      disabled={deletingCoverId === cover.id}
                      style={{ padding: "8px 10px", background: "#fee2e2", color: "#dc2626", border: "none", borderRadius: 6, fontWeight: 700, cursor: deletingCoverId === cover.id ? "not-allowed" : "pointer", opacity: deletingCoverId === cover.id ? 0.7 : 1, width: isMobile ? "100%" : "auto" }}
                    >
                      {deletingCoverId === cover.id ? "Deleting..." : "🗑 Delete"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
