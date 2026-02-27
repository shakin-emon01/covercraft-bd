import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerUser, googleAuth } from "../api/auth";
import { useAuthStore } from "../store/authStore";
import { GoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";
import { useViewport } from "../hooks/useViewport";

export default function Register() {
  const [form, setForm] = useState({ name:"", email:"", password:"", confirm:"" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();
  const { isMobile, isTablet } = useViewport();

  const update = (k,v) => setForm(p => ({...p,[k]:v}));

  const handleRegister = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) { setError("Passwords do not match"); return; }
    if (form.password.length < 6) { setError("Password must be at least 6 characters"); return; }
    setLoading(true); setError("");
    try {
      const { data } = await registerUser({ name:form.name, email:form.email, password:form.password });
      setAuth(data.user, data.token);
      navigate("/profile/setup");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    } finally { setLoading(false); }
  };

  const handleGoogle = async (credentialResponse) => {
    try {
      const decoded = jwtDecode(credentialResponse.credential);
      const { data } = await googleAuth({ googleId: decoded.sub, email: decoded.email, name: decoded.name });
      setAuth(data.user, data.token);
      navigate("/profile/setup");
    } catch { setError("Google sign-up failed. Please try again."); }
  };

  const strength = form.password.length === 0 ? 0 : form.password.length < 6 ? 1 : form.password.length < 10 ? 2 : 3;
  const strengthColor = ["#e2e8f0","#ef4444","#f59e0b","#22c55e"][strength];
  const strengthLabel = ["","Weak","Good","Strong"][strength];
  const showIntroPanel = !isTablet && !isMobile;

  return (
    <div style={{ minHeight:"100vh", display:"flex", flexDirection:isMobile?"column":"row", fontFamily:"'Segoe UI',sans-serif", background:"#0f172a" }}>
      {/* Left panel */}
      {showIntroPanel && <div style={{ flex:1, background:"linear-gradient(145deg,#134e4a 0%,#0f172a 50%,#14532d 100%)", display:"flex", flexDirection:"column", justifyContent:"center", alignItems:"center", padding:"60px", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", top:-120, left:-80, width:400, height:400, borderRadius:"50%", background:"rgba(13,148,136,0.08)", border:"1px solid rgba(13,148,136,0.12)" }}/>
        <div style={{ position:"absolute", bottom:-80, right:-60, width:300, height:300, borderRadius:"50%", background:"rgba(45,212,191,0.06)" }}/>
        <div style={{ position:"absolute", inset:0, backgroundImage:"linear-gradient(rgba(13,148,136,0.05) 1px,transparent 1px),linear-gradient(90deg,rgba(13,148,136,0.05) 1px,transparent 1px)", backgroundSize:"40px 40px" }}/>
        <div style={{ position:"relative", zIndex:1, textAlign:"center", maxWidth:420 }}>
          <div style={{ fontSize:52, marginBottom:20 }}>🎓</div>
          <h1 style={{ fontSize:36, fontWeight:900, color:"#fff", margin:"0 0 12px", letterSpacing:-1 }}>
            Join <span style={{ color:"#2dd4bf" }}>CoverCraft BD</span>
          </h1>
          <p style={{ fontSize:15, color:"rgba(255,255,255,0.55)", lineHeight:1.7, margin:"0 0 36px" }}>
            Create your free account and start generating professional cover pages in minutes.
          </p>
          <div style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:14, padding:"24px" }}>
            <div style={{ fontSize:13, color:"rgba(255,255,255,0.5)", marginBottom:16, fontWeight:600, letterSpacing:1 }}>HOW IT WORKS</div>
            {[
              { step:"01", title:"Create your account", desc:"Register with email or Google" },
              { step:"02", title:"Set up your profile", desc:"Add your student info once" },
              { step:"03", title:"Generate cover pages", desc:"Pick template, fill details, download" },
            ].map((s,i) => (
              <div key={i} style={{ display:"flex", gap:14, marginBottom: i<2?16:0, alignItems:"flex-start" }}>
                <div style={{ width:32, height:32, borderRadius:"50%", background:"rgba(45,212,191,0.15)", border:"1px solid rgba(45,212,191,0.3)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:800, color:"#2dd4bf", flexShrink:0 }}>{s.step}</div>
                <div style={{ textAlign:"left" }}>
                  <div style={{ fontSize:13.5, fontWeight:700, color:"rgba(255,255,255,0.85)" }}>{s.title}</div>
                  <div style={{ fontSize:12, color:"rgba(255,255,255,0.4)" }}>{s.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>}

      {/* Right register form */}
      <div style={{ width:isMobile?"100%":isTablet?"100%":480, maxWidth:isMobile||isTablet?"100%":"none", minHeight:isMobile?"100vh":"auto", background:"#fff", display:"flex", flexDirection:"column", justifyContent:"center", padding:isMobile?"32px 20px":isTablet?"40px 32px":"50px 50px", position:"relative", overflowY:"auto" }}>
        <div style={{ marginBottom:28 }}>
          <div style={{ fontSize:11, color:"#94a3b8", letterSpacing:3, fontWeight:700, marginBottom:8 }}>GET STARTED FREE</div>
          <h2 style={{ fontSize:26, fontWeight:900, color:"#0f172a", margin:"0 0 6px", letterSpacing:-0.5 }}>Create your account</h2>
          <p style={{ fontSize:13.5, color:"#64748b", margin:0 }}>Already registered? <Link to="/login" style={{ color:"#2563eb", fontWeight:700, textDecoration:"none" }}>Sign in here</Link></p>
        </div>

        {error && (
          <div style={{ background:"#fef2f2", border:"1px solid #fecaca", borderRadius:8, padding:"10px 13px", marginBottom:16, fontSize:13, color:"#dc2626", display:"flex", alignItems:"center", gap:8 }}>
            <span>⚠️</span> {error}
          </div>
        )}

        <form onSubmit={handleRegister}>
          {[
            { label:"FULL NAME", key:"name", type:"text", placeholder:"Your full name" },
            { label:"EMAIL ADDRESS", key:"email", type:"email", placeholder:"you@example.com" },
          ].map(field => (
            <div key={field.key} style={{ marginBottom:14 }}>
              <label style={{ display:"block", fontSize:11, fontWeight:700, color:"#374151", letterSpacing:1, marginBottom:5 }}>{field.label}</label>
              <input type={field.type} value={form[field.key]} onChange={e => update(field.key, e.target.value)} placeholder={field.placeholder} required
                style={{ width:"100%", padding:"11px 13px", borderRadius:9, border:"1.5px solid #e2e8f0", fontSize:13.5, boxSizing:"border-box", outline:"none", background:"#f8fafc" }}
                onFocus={e => e.target.style.border="1.5px solid #2563eb"}
                onBlur={e => e.target.style.border="1.5px solid #e2e8f0"}/>
            </div>
          ))}

          <div style={{ marginBottom:6 }}>
            <label style={{ display:"block", fontSize:11, fontWeight:700, color:"#374151", letterSpacing:1, marginBottom:5 }}>PASSWORD</label>
            <div style={{ position:"relative" }}>
              <input type={showPass?"text":"password"} value={form.password} onChange={e => update("password",e.target.value)} placeholder="Min. 6 characters" required
                style={{ width:"100%", padding:"11px 40px 11px 13px", borderRadius:9, border:"1.5px solid #e2e8f0", fontSize:13.5, boxSizing:"border-box", outline:"none", background:"#f8fafc" }}
                onFocus={e => e.target.style.border="1.5px solid #2563eb"}
                onBlur={e => e.target.style.border="1.5px solid #e2e8f0"}/>
              <button type="button" onClick={() => setShowPass(!showPass)} style={{ position:"absolute", right:11, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", fontSize:15, color:"#94a3b8" }}>{showPass?"🙈":"👁️"}</button>
            </div>
          </div>

          {/* Password strength */}
          {form.password.length > 0 && (
            <div style={{ marginBottom:14 }}>
              <div style={{ display:"flex", gap:4, marginBottom:4 }}>
                {[1,2,3].map(i => (
                  <div key={i} style={{ flex:1, height:3, borderRadius:2, background: i<=strength ? strengthColor : "#e2e8f0", transition:"background 0.3s" }}/>
                ))}
              </div>
              <div style={{ fontSize:10.5, color:strengthColor, fontWeight:700 }}>{strengthLabel}</div>
            </div>
          )}

          <div style={{ marginBottom:20 }}>
            <label style={{ display:"block", fontSize:11, fontWeight:700, color:"#374151", letterSpacing:1, marginBottom:5 }}>CONFIRM PASSWORD</label>
            <input type="password" value={form.confirm} onChange={e => update("confirm",e.target.value)} placeholder="Re-enter your password" required
              style={{ width:"100%", padding:"11px 13px", borderRadius:9, border:`1.5px solid ${form.confirm && form.confirm!==form.password?"#fecaca":"#e2e8f0"}`, fontSize:13.5, boxSizing:"border-box", outline:"none", background:"#f8fafc" }}
              onFocus={e => e.target.style.borderColor="#2563eb"}
              onBlur={e => e.target.style.borderColor=form.confirm&&form.confirm!==form.password?"#fecaca":"#e2e8f0"}/>
            {form.confirm && form.confirm!==form.password && <div style={{ fontSize:11, color:"#ef4444", marginTop:4 }}>Passwords don't match</div>}
          </div>

          <button type="submit" disabled={loading}
            style={{ width:"100%", padding:"12px", borderRadius:9, border:"none", cursor:"pointer", background:"linear-gradient(135deg,#134e4a,#0d9488)", color:"#fff", fontSize:14, fontWeight:700, opacity:loading?0.7:1 }}>
            {loading ? "Creating account..." : "Create Account →"}
          </button>
        </form>

        <div style={{ display:"flex", alignItems:"center", gap:12, margin:"18px 0" }}>
          <div style={{ flex:1, height:1, background:"#e2e8f0" }}/>
          <span style={{ fontSize:11, color:"#94a3b8", fontWeight:600 }}>OR</span>
          <div style={{ flex:1, height:1, background:"#e2e8f0" }}/>
        </div>

        <div style={{ display:"flex", justifyContent:"center" }}>
          <GoogleLogin onSuccess={handleGoogle} onError={() => setError("Google sign-up failed")} theme="outline" size="large" width={isMobile ? "280" : "380"}/>
        </div>
      </div>
    </div>
  );
}
