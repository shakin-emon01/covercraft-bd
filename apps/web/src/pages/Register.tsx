import type { FormEvent } from "react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerUser, googleAuth } from "../api/auth";
import { useAuthStore } from "../store/authStore";
import { GoogleLogin } from "@react-oauth/google";
import { useViewport } from "../hooks/useViewport";
import { isGoogleAuthConfigured } from "../config/authConfig";

export default function Register() {
  type FormState = { name: string; email: string; password: string; confirm: string };
  const [form, setForm] = useState<FormState>({ name:"", email:"", password:"", confirm:"" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();
  const { isMobile, isTablet, width } = useViewport();
  const mobileGoogleWidth = Math.max(240, Math.min(340, width - 44));

  const update = (k: keyof FormState, v: string) => setForm((p) => ({ ...p, [k]: v }));
  const getApiErrorMessage = (error: unknown, fallback: string) => {
    if (typeof error === "object" && error !== null) {
      const maybeError = error as { response?: { data?: { message?: string } } };
      const message = maybeError.response?.data?.message;
      if (typeof message === "string" && message.trim()) return message;
    }
    return fallback;
  };

  const handleRegister = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (form.password !== form.confirm) { setError("Passwords do not match"); return; }
    if (form.password.length < 6) { setError("Password must be at least 6 characters"); return; }
    setLoading(true); setError("");
    try {
      const { data } = await registerUser({ name:form.name, email:form.email, password:form.password });
      setAuth(data.user, data.accessToken || data.token);
      navigate("/profile/setup");
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, "Registration failed"));
    } finally { setLoading(false); }
  };

  const handleGoogle = async (credentialResponse: { credential?: string }) => {
    const credential = credentialResponse?.credential;
    if (!credential) {
      setError("Google sign-up failed. No credential received.");
      return;
    }

    try {
      const { data } = await googleAuth({ credential });
      setAuth(data.user, data.accessToken || data.token);
      navigate("/profile/setup");
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, "Google sign-up failed. Please try again."));
    }
  };

  const strength = form.password.length === 0 ? 0 : form.password.length < 6 ? 1 : form.password.length < 10 ? 2 : 3;
  const strengthColor = ["#e2e8f0","#ef4444","#f59e0b","#22c55e"][strength];
  const strengthLabel = ["","Weak","Good","Strong"][strength];
  const showIntroPanel = !isTablet && !isMobile;

  if (isMobile) {
    return (
      <div className="mobile-auth-shell mobile-auth-shell-register">
        <div className="mobile-auth-orb mobile-auth-orb-a" />
        <div className="mobile-auth-orb mobile-auth-orb-b" />
        <div className="mobile-auth-grid" />

        <div className="mobile-auth-card">
          <div className="mobile-auth-brand-row">
            <img src="/logo.png" alt="CoverCraft BD" className="mobile-auth-logo" />
            <div>
              <h1 className="mobile-auth-brand-title">CoverCraft BD</h1>
              <p className="mobile-auth-brand-subtitle">Create premium covers in minutes</p>
            </div>
          </div>

          <div className="mobile-auth-feature-stack">
            {[
              { icon: "01", text: "Create your account" },
              { icon: "02", text: "Set up your profile" },
              { icon: "03", text: "Generate cover pages" },
            ].map((step) => (
              <div key={step.text} className="mobile-auth-feature-item mobile-auth-feature-item-register">
                <span className="mobile-auth-feature-icon mobile-auth-feature-icon-register">{step.icon}</span>
                <span className="mobile-auth-feature-text">{step.text}</span>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 8, marginBottom: 14 }}>
            <div style={{ fontSize: 11, color: "#a7f3d0", letterSpacing: 3, fontWeight: 700, marginBottom: 8 }}>GET STARTED FREE</div>
            <h2 style={{ fontSize: 31, fontWeight: 900, color: "#ffffff", margin: "0 0 4px", lineHeight: 1.08, letterSpacing: -0.7 }}>Create account</h2>
            <p style={{ fontSize: 13, color: "rgba(220,252,231,0.85)", margin: 0 }}>
              Already registered? <Link to="/login" style={{ color: "#5eead4", fontWeight: 700, textDecoration: "none" }}>Sign in</Link>
            </p>
          </div>

          {error && (
            <div style={{ background: "rgba(127, 29, 29, 0.45)", border: "1px solid rgba(252,165,165,0.55)", borderRadius: 10, padding: "9px 11px", marginBottom: 11, fontSize: 12.5, color: "#fecaca", display: "flex", alignItems: "center", gap: 7 }}>
              <span>⚠️</span> {error}
            </div>
          )}

          <form onSubmit={handleRegister}>
            {[
              { label: "FULL NAME", key: "name", type: "text", placeholder: "Your full name" },
              { label: "EMAIL ADDRESS", key: "email", type: "email", placeholder: "you@example.com" },
            ].map((field) => (
              <div key={field.key} style={{ marginBottom: 10 }}>
                <label style={{ display: "block", fontSize: 10.5, fontWeight: 700, color: "#dcfce7", letterSpacing: 1.1, marginBottom: 5 }}>{field.label}</label>
                <input
                  type={field.type}
                  value={form[field.key as keyof FormState]}
                  onChange={(e) => update(field.key as keyof FormState, e.target.value)}
                  placeholder={field.placeholder}
                  required
                  className="mobile-auth-input"
                  onFocus={(e) => e.target.style.border = "1.5px solid #34d399"}
                  onBlur={(e) => e.target.style.border = "1.5px solid rgba(148,163,184,0.35)"}
                />
              </div>
            ))}

            <div style={{ marginBottom: 8 }}>
              <label style={{ display: "block", fontSize: 10.5, fontWeight: 700, color: "#dcfce7", letterSpacing: 1.1, marginBottom: 5 }}>PASSWORD</label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPass ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => update("password", e.target.value)}
                  placeholder="Min. 6 characters"
                  required
                  className="mobile-auth-input"
                  style={{ paddingRight: 42 }}
                  onFocus={(e) => e.target.style.border = "1.5px solid #34d399"}
                  onBlur={(e) => e.target.style.border = "1.5px solid rgba(148,163,184,0.35)"}
                />
                <button type="button" onClick={() => setShowPass(!showPass)} style={{ position: "absolute", right: 11, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: 15, color: "#bbf7d0" }}>
                  {showPass ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            {form.password.length > 0 && (
              <div style={{ marginBottom: 9 }}>
                <div style={{ display: "flex", gap: 4, marginBottom: 4 }}>
                  {[1, 2, 3].map((i) => (
                    <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= strength ? strengthColor : "rgba(148,163,184,0.35)", transition: "background 0.3s" }} />
                  ))}
                </div>
                <div style={{ fontSize: 10.5, color: strengthColor, fontWeight: 700 }}>{strengthLabel}</div>
              </div>
            )}

            <div style={{ marginBottom: 12 }}>
              <label style={{ display: "block", fontSize: 10.5, fontWeight: 700, color: "#dcfce7", letterSpacing: 1.1, marginBottom: 5 }}>CONFIRM PASSWORD</label>
              <input
                type="password"
                value={form.confirm}
                onChange={(e) => update("confirm", e.target.value)}
                placeholder="Re-enter your password"
                required
                className="mobile-auth-input"
                style={{ border: `1.5px solid ${form.confirm && form.confirm !== form.password ? "rgba(248,113,113,0.75)" : "rgba(148,163,184,0.35)"}` }}
                onFocus={(e) => e.target.style.border = "1.5px solid #34d399"}
                onBlur={(e) => e.target.style.border = form.confirm && form.confirm !== form.password ? "1.5px solid rgba(248,113,113,0.75)" : "1.5px solid rgba(148,163,184,0.35)"}
              />
              {form.confirm && form.confirm !== form.password && <div style={{ fontSize: 11, color: "#fca5a5", marginTop: 4 }}>Passwords don't match</div>}
            </div>

            <button type="submit" disabled={loading} className="mobile-auth-primary-btn mobile-auth-primary-btn-register">
              {loading ? "Creating account..." : "Create Account →"}
            </button>
          </form>

          <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "12px 0 10px" }}>
            <div style={{ flex: 1, height: 1, background: "rgba(148,163,184,0.35)" }} />
            <span style={{ fontSize: 10.5, color: "#bbf7d0", fontWeight: 700 }}>OR</span>
            <div style={{ flex: 1, height: 1, background: "rgba(148,163,184,0.35)" }} />
          </div>

          <div style={{ display: "flex", justifyContent: "center" }}>
            {isGoogleAuthConfigured ? (
              <GoogleLogin onSuccess={handleGoogle} onError={() => setError("Google sign-up failed")} theme="outline" size="large" width={mobileGoogleWidth} />
            ) : (
              <div style={{ width: "100%", border: "1px solid rgba(148,163,184,0.35)", borderRadius: 10, padding: "10px 12px", textAlign: "center", fontSize: 12, color: "#d1fae5", background: "rgba(15,23,42,0.34)", lineHeight: 1.5 }}>
                Google sign-up is not configured yet. Set a valid <code>VITE_GOOGLE_CLIENT_ID</code> in <code>apps/web/.env</code>.
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

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
          {/* 🚀 PREMIUM "HOW IT WORKS" SECTION (Glassmorphism & Hover Effects) */}
          <div style={{ 
            marginTop: '30px', 
            maxWidth: '420px',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '16px',
            padding: '24px',
            backdropFilter: 'blur(12px)',
            boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ 
              textAlign: 'center', 
              fontSize: '12px', 
              fontWeight: '700', 
              color: '#94a3b8', 
              letterSpacing: '2px', 
              marginBottom: '20px' 
            }}>
              HOW IT WORKS
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                { num: "01", title: "Create your account", desc: "Register with email or Google" },
                { num: "02", title: "Set up your profile", desc: "Add your student info once" },
                { num: "03", title: "Generate cover pages", desc: "Pick template, fill details, download" }
              ].map((step, idx) => (
                <div 
                  key={idx} 
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    cursor: 'default',
                    background: 'transparent'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                    e.currentTarget.style.transform = 'translateX(6px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.transform = 'translateX(0)';
                  }}
                >
                  {/* Elegant Number Circle (Green Theme) */}
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, rgba(16,185,129,0.15) 0%, rgba(5,150,105,0.25) 100%)',
                    border: '1px solid rgba(16,185,129,0.4)',
                    color: '#34d399',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '14px',
                    fontWeight: '800',
                    flexShrink: 0,
                    boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.05)'
                  }}>
                    {step.num}
                  </div>
                  
                  {/* Text Content */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={{ color: '#f8fafc', fontSize: '15px', fontWeight: '700', letterSpacing: '0.3px' }}>
                      {step.title}
                    </span>
                    <span style={{ color: '#94a3b8', fontSize: '13px' }}>
                      {step.desc}
                    </span>
                  </div>
                </div>
              ))}
            </div>
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
          {([
            { label:"FULL NAME", key:"name", type:"text", placeholder:"Your full name" },
            { label:"EMAIL ADDRESS", key:"email", type:"email", placeholder:"you@example.com" },
          ] as Array<{ label: string; key: keyof FormState; type: string; placeholder: string }>).map((field) => (
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
          {isGoogleAuthConfigured ? (
            <GoogleLogin onSuccess={handleGoogle} onError={() => setError("Google sign-up failed")} theme="outline" size="large" width={isMobile ? "280" : "380"}/>
          ) : (
            <div style={{ width:"100%", border:"1px solid #e2e8f0", borderRadius:9, padding:"12px", textAlign:"center", fontSize:12.5, color:"#64748b", background:"#f8fafc" }}>
              Google sign-up is not configured yet. Set a valid <code>VITE_GOOGLE_CLIENT_ID</code> in <code>apps/web/.env</code>.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
