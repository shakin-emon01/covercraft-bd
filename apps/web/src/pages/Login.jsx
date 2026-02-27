import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginUser, googleAuth } from "../api/auth";
import { useAuthStore } from "../store/authStore";
import { GoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const { data } = await loginUser({ email, password });
      setAuth(data.user, data.token);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Invalid email or password");
    } finally { setLoading(false); }
  };

  const handleGoogle = async (credentialResponse) => {
    try {
      const decoded = jwtDecode(credentialResponse.credential);
      const { data } = await googleAuth({ googleId: decoded.sub, email: decoded.email, name: decoded.name });
      setAuth(data.user, data.token);
      navigate("/dashboard");
    } catch { setError("Google login failed. Please try again."); }
  };

  return (
    <div style={{ minHeight:"100vh", display:"flex", fontFamily:"'Segoe UI',sans-serif", background:"#0f172a" }}>
      {/* Left decorative panel */}
      <div style={{ flex:1, background:"linear-gradient(145deg,#1e3a5f 0%,#0f172a 50%,#1a3a6b 100%)", display:"flex", flexDirection:"column", justifyContent:"center", alignItems:"center", padding:"60px", position:"relative", overflow:"hidden" }}>
        {/* Decorative circles */}
        <div style={{ position:"absolute", top:-120, left:-80, width:400, height:400, borderRadius:"50%", background:"rgba(37,99,235,0.08)", border:"1px solid rgba(37,99,235,0.12)" }}/>
        <div style={{ position:"absolute", bottom:-80, right:-60, width:300, height:300, borderRadius:"50%", background:"rgba(96,165,250,0.06)", border:"1px solid rgba(96,165,250,0.1)" }}/>
        <div style={{ position:"absolute", top:"40%", right:"-5%", width:200, height:200, borderRadius:"50%", background:"rgba(37,99,235,0.05)" }}/>

        {/* Grid pattern */}
        <div style={{ position:"absolute", inset:0, backgroundImage:"linear-gradient(rgba(37,99,235,0.05) 1px,transparent 1px),linear-gradient(90deg,rgba(37,99,235,0.05) 1px,transparent 1px)", backgroundSize:"40px 40px" }}/>

        <div style={{ position:"relative", zIndex:1, textAlign:"center", maxWidth:420 }}>
          <div style={{ fontSize:52, marginBottom:20 }}>📄</div>
          <h1 style={{ fontSize:36, fontWeight:900, color:"#fff", margin:"0 0 12px", letterSpacing:-1, lineHeight:1.1 }}>
            CoverCraft <span style={{ color:"#60a5fa" }}>BD</span>
          </h1>
          <p style={{ fontSize:16, color:"rgba(255,255,255,0.55)", lineHeight:1.7, margin:"0 0 40px" }}>
            The smartest way to generate professional academic cover pages for Bangladeshi university students.
          </p>
          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
            {["10 beautiful cover templates","35+ universities supported","Instant PDF & PNG export","Auto-fill your profile data"].map((f,i) => (
              <div key={i} style={{ display:"flex", alignItems:"center", gap:12, background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:10, padding:"12px 18px" }}>
                <div style={{ width:22, height:22, borderRadius:"50%", background:"rgba(96,165,250,0.2)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, color:"#60a5fa", flexShrink:0 }}>✓</div>
                <span style={{ fontSize:13.5, color:"rgba(255,255,255,0.72)" }}>{f}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right login form */}
      <div style={{ width:480, background:"#fff", display:"flex", flexDirection:"column", justifyContent:"center", padding:"60px 50px", position:"relative" }}>
        <div style={{ marginBottom:36 }}>
          <div style={{ fontSize:11, color:"#94a3b8", letterSpacing:3, fontWeight:700, marginBottom:8 }}>WELCOME BACK</div>
          <h2 style={{ fontSize:28, fontWeight:900, color:"#0f172a", margin:"0 0 6px", letterSpacing:-0.5 }}>Sign in to your account</h2>
          <p style={{ fontSize:13.5, color:"#64748b", margin:0 }}>Don't have an account? <Link to="/register" style={{ color:"#2563eb", fontWeight:700, textDecoration:"none" }}>Create one free</Link></p>
        </div>

        {error && (
          <div style={{ background:"#fef2f2", border:"1px solid #fecaca", borderRadius:8, padding:"11px 14px", marginBottom:18, fontSize:13, color:"#dc2626", display:"flex", alignItems:"center", gap:8 }}>
            <span>⚠️</span> {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom:16 }}>
            <label style={{ display:"block", fontSize:11, fontWeight:700, color:"#374151", letterSpacing:1, marginBottom:6 }}>EMAIL ADDRESS</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required
              style={{ width:"100%", padding:"12px 14px", borderRadius:9, border:"1.5px solid #e2e8f0", fontSize:14, boxSizing:"border-box", outline:"none", transition:"border 0.2s", background:"#f8fafc" }}
              onFocus={e => e.target.style.border="1.5px solid #2563eb"}
              onBlur={e => e.target.style.border="1.5px solid #e2e8f0"}/>
          </div>
          <div style={{ marginBottom:22 }}>
            <label style={{ display:"block", fontSize:11, fontWeight:700, color:"#374151", letterSpacing:1, marginBottom:6 }}>PASSWORD</label>
            <div style={{ position:"relative" }}>
              <input type={showPass?"text":"password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter your password" required
                style={{ width:"100%", padding:"12px 44px 12px 14px", borderRadius:9, border:"1.5px solid #e2e8f0", fontSize:14, boxSizing:"border-box", outline:"none", background:"#f8fafc" }}
                onFocus={e => e.target.style.border="1.5px solid #2563eb"}
                onBlur={e => e.target.style.border="1.5px solid #e2e8f0"}/>
              <button type="button" onClick={() => setShowPass(!showPass)}
                style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", fontSize:16, color:"#94a3b8" }}>
                {showPass?"🙈":"👁️"}
              </button>
            </div>
          </div>
          <button type="submit" disabled={loading}
            style={{ width:"100%", padding:"13px", borderRadius:9, border:"none", cursor:"pointer", background:"linear-gradient(135deg,#1a3a6b,#2563eb)", color:"#fff", fontSize:14, fontWeight:700, letterSpacing:0.5, opacity: loading?0.7:1, transition:"opacity 0.2s" }}>
            {loading ? "Signing in..." : "Sign In →"}
          </button>
        </form>

        <div style={{ display:"flex", alignItems:"center", gap:12, margin:"20px 0" }}>
          <div style={{ flex:1, height:1, background:"#e2e8f0" }}/>
          <span style={{ fontSize:11, color:"#94a3b8", fontWeight:600 }}>OR CONTINUE WITH</span>
          <div style={{ flex:1, height:1, background:"#e2e8f0" }}/>
        </div>

        <div style={{ display:"flex", justifyContent:"center" }}>
          <GoogleLogin onSuccess={handleGoogle} onError={() => setError("Google login failed")} theme="outline" size="large" width="380"/>
        </div>

        <p style={{ textAlign:"center", fontSize:11, color:"#cbd5e1", marginTop:28 }}>
          By signing in, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}
