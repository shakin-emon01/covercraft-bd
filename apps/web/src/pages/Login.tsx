import type { FormEvent } from "react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginUser, googleAuth } from "../api/auth";
import { useAuthStore } from "../store/authStore";
import { GoogleLogin } from "@react-oauth/google";
import { useViewport } from "../hooks/useViewport";
import { isGoogleAuthConfigured } from "../config/authConfig";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();
  const { isMobile, isTablet } = useViewport();
  const showIntroPanel = !isMobile && !isTablet;
  const googleButtonWidth = isMobile ? 280 : isTablet ? 340 : 380;
  const getApiErrorMessage = (error: unknown, fallback: string) => {
    if (typeof error === "object" && error !== null) {
      const maybeError = error as { response?: { data?: { message?: string } } };
      const message = maybeError.response?.data?.message;
      if (typeof message === "string" && message.trim()) return message;
    }
    return fallback;
  };

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const { data } = await loginUser({ email, password });
      setAuth(data.user, data.accessToken || data.token);
      navigate("/dashboard");
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, "Invalid email or password"));
    } finally { setLoading(false); }
  };

  const handleGoogle = async (credentialResponse: { credential?: string }) => {
    const credential = credentialResponse?.credential;
    if (!credential) {
      setError("Google login failed. No credential received.");
      return;
    }

    try {
      const { data } = await googleAuth({ credential });
      setAuth(data.user, data.accessToken || data.token);
      navigate("/dashboard");
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, "Google login failed. Please try again."));
    }
  };

  return (
    <div style={{ minHeight:"100vh", display:"flex", flexDirection:showIntroPanel?"row":"column", fontFamily:"'Segoe UI',sans-serif", background:showIntroPanel?"#0f172a":"#f8fafc" }}>
      {/* Left decorative panel */}
      {showIntroPanel && <div style={{ flex:1, background:"linear-gradient(145deg,#1e3a5f 0%,#0f172a 50%,#1a3a6b 100%)", display:"flex", flexDirection:"column", justifyContent:"center", alignItems:"center", padding:"60px", position:"relative", overflow:"hidden" }}>
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
          {/* 🚀 PREMIUM FEATURE LIST (SEO FRIENDLY) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '30px', maxWidth: '420px' }}>
            {[
              { icon: "✨", text: "15+ Premium Studio-Quality Templates" },
              { icon: "🏛️", text: "Supports 170+ BD Universities" },
              { icon: "🚀", text: "Instant High-Res Export (PDF, PNG, ZIP)" },
              { icon: "⚡", text: "Smart Profile Auto-Fill Data" }
            ].map((feature, idx) => (
              <div 
                key={idx} 
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  padding: '16px 20px',
                  background: 'rgba(255, 255, 255, 0.04)', // Classy transparent background
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '12px',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
                  backdropFilter: 'blur(10px)', // Glassmorphism effect
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  cursor: 'default'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                  e.currentTarget.style.border = '1px solid rgba(255, 255, 255, 0.2)';
                  e.currentTarget.style.transform = 'translateY(-3px)';
                  e.currentTarget.style.boxShadow = '0 10px 25px rgba(0, 0, 0, 0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                  e.currentTarget.style.border = '1px solid rgba(255, 255, 255, 0.08)';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.1)';
                }}
              >
                {/* Icon Circle */}
                <div style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, rgba(37,99,235,0.2) 0%, rgba(14,165,233,0.3) 100%)',
                  border: '1px solid rgba(14,165,233,0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '15px',
                  flexShrink: 0,
                  boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.1)'
                }}>
                  {feature.icon}
                </div>
                
                {/* Feature Text */}
                <span style={{ 
                  color: '#f8fafc', 
                  fontSize: '15px', 
                  fontWeight: '600', 
                  letterSpacing: '0.4px',
                  textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                  fontFamily: "'Inter', 'Segoe UI', sans-serif"
                }}>
                  {feature.text}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>}

      {/* Right login form */}
      <div style={{ width:showIntroPanel?480:"100%", maxWidth:showIntroPanel?"none":540, margin:showIntroPanel?"0":"0 auto", background:"#fff", display:"flex", flexDirection:"column", justifyContent:"center", padding:isMobile?"34px 18px":isTablet?"42px 30px":"60px 50px", position:"relative", minHeight:showIntroPanel?"auto":"100vh", boxSizing:"border-box", boxShadow:showIntroPanel?"none":"0 12px 34px rgba(15,23,42,0.06)" }}>
        {!showIntroPanel && (
          <div style={{ marginBottom:20 }}>
            <div style={{ fontSize:22, fontWeight:900, color:"#1a3a6b", marginBottom:4 }}>CoverCraft BD</div>
            <div style={{ fontSize:12.5, color:"#64748b" }}>Generate professional academic cover pages from any device.</div>
          </div>
        )}
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
          {isGoogleAuthConfigured ? (
            <GoogleLogin onSuccess={handleGoogle} onError={() => setError("Google login failed")} theme="outline" size="large" width={googleButtonWidth}/>
          ) : (
            <div style={{ width:"100%", border:"1px solid #e2e8f0", borderRadius:9, padding:"12px", textAlign:"center", fontSize:12.5, color:"#64748b", background:"#f8fafc" }}>
              Google sign-in is not configured yet. Set a valid <code>VITE_GOOGLE_CLIENT_ID</code> in <code>apps/web/.env</code>.
            </div>
          )}
        </div>

        <p style={{ textAlign:"center", fontSize:11, color:"#cbd5e1", marginTop:28 }}>
          By signing in, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}
