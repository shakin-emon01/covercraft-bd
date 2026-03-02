import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import API from "../api/auth";
import { useViewport } from "../hooks/useViewport";
import { useThemeMode } from "../hooks/useThemeMode";

const profileUiTheme = {
  light: {
    pageBg: "linear-gradient(135deg,#f0f5ff 0%,#ffffff 60%)",
    cardBg: "#ffffff",
    cardBorder: "#dbe4f3",
    cardShadow: "0 20px 60px rgba(0,0,0,0.1)",
    bodyText: "#0f172a",
    subText: "#64748b",
    label: "#374151",
    inputBg: "#ffffff",
    inputText: "#0f172a",
    inputBorder: "#cbd5e1",
    inputFocus: "#2563eb",
    softPanel: "#f8fafc",
    softPanelBorder: "#e2e8f0",
    uniCardBg: "#f0f5ff",
    uniCardText: "#1a3a6b",
    listItemHover: "#f0f5ff",
    warningBg: "#fffbeb",
    warningBorder: "#f59e0b",
    warningText: "#92400e",
  },
  dark: {
    pageBg: "linear-gradient(135deg,#020617 0%,#0f172a 70%)",
    cardBg: "#0f172a",
    cardBorder: "#1e293b",
    cardShadow: "0 20px 60px rgba(2,6,23,0.65)",
    bodyText: "#e2e8f0",
    subText: "#94a3b8",
    label: "#cbd5e1",
    inputBg: "#111827",
    inputText: "#f8fafc",
    inputBorder: "#334155",
    inputFocus: "#60a5fa",
    softPanel: "#111827",
    softPanelBorder: "#334155",
    uniCardBg: "#172554",
    uniCardText: "#dbeafe",
    listItemHover: "#1e293b",
    warningBg: "#3f2600",
    warningBorder: "#b45309",
    warningText: "#fed7aa",
  },
};

export default function ProfileSetup() {
  const [unis, setUnis] = useState([]);
  const [form, setForm] = useState({ studentName: "", studentId: "", department: "", semester: "", universityId: "" });
  const [logoFile, setLogoFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [bootLoading, setBootLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const { user, setAuth, token } = useAuthStore();
  const navigate = useNavigate();
  const { isMobile } = useViewport();
  const { isDark, toggleTheme } = useThemeMode();
  const ui = isDark ? profileUiTheme.dark : profileUiTheme.light;

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
          if (status && status !== 404) {
            loadFailed = true;
          }
          setForm((prev) => ({ ...prev, studentName: user?.name || "" }));
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

  const filtered = (unis || []).filter((uni) => {
    const query = search.toLowerCase();
    return String(uni.name || "").toLowerCase().includes(query) || String(uni.shortName || "").toLowerCase().includes(query);
  });
  const selectedUni = (unis || []).find((uni) => uni.id === form.universityId);
  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const toBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (readError) => reject(readError);
    });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.universityId) {
      setError("Please select your university");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await API.put("/profile", form);

      if (logoFile && form.universityId) {
        const base64String = await toBase64(logoFile);
        await API.post(`/universities/${form.universityId}/logo-request`, {
          fileBase64: base64String,
          fileName: logoFile.name,
        });
      }

      setAuth({ ...user, name: form.studentName }, token);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to save profile or logo");
    } finally {
      setLoading(false);
    }
  };

  const inputBaseStyle = {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 8,
    border: `1.5px solid ${ui.inputBorder}`,
    fontSize: 13.5,
    boxSizing: "border-box",
    background: ui.inputBg,
    color: ui.inputText,
    outline: "none",
  };

  return (
    <div style={{ minHeight: "100vh", background: ui.pageBg, color: ui.bodyText, fontFamily: "'Segoe UI',sans-serif", display: "flex", alignItems: "center", justifyContent: "center", padding: isMobile ? "16px 12px" : "30px 20px", transition: "background-color 0.3s ease, color 0.3s ease" }}>
      <div style={{ width: "100%", maxWidth: 700, background: ui.cardBg, borderRadius: 20, boxShadow: ui.cardShadow, overflow: "hidden", border: `1px solid ${ui.cardBorder}` }}>
        <div style={{ background: "linear-gradient(135deg,#1a3a6b,#2563eb)", padding: isMobile ? "24px 18px" : "32px 40px", position: "relative" }}>
          <button
            type="button"
            onClick={toggleTheme}
            style={{ position: "absolute", top: 18, right: 18, border: "1px solid rgba(255,255,255,0.35)", background: "rgba(255,255,255,0.14)", color: "#fff", fontSize: 13, fontWeight: 700, borderRadius: 999, padding: "5px 10px", cursor: "pointer" }}
            title={isDark ? "Switch to light mode" : "Switch to dark mode"}
          >
            {isDark ? "☀ Light" : "☾ Dark"}
          </button>

          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.6)", letterSpacing: 3, fontWeight: 700, marginBottom: 6 }}>STEP 2 OF 2</div>
          <h1 style={{ color: "#fff", fontSize: 24, fontWeight: 900, margin: "0 0 6px" }}>Complete Your Profile</h1>
          <p style={{ color: "rgba(255,255,255,0.78)", fontSize: 13.5, margin: 0 }}>
            Hi {user?.name}! This info will auto-fill your cover pages so you never have to type it again.
          </p>
        </div>

        <div style={{ padding: isMobile ? "22px 16px" : "32px 40px" }}>
          {bootLoading && <div style={{ background: ui.softPanel, border: `1px solid ${ui.softPanelBorder}`, borderRadius: 8, padding: "10px 14px", marginBottom: 18, fontSize: 13, color: ui.subText }}>Loading your saved profile...</div>}
          {error && <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "10px 14px", marginBottom: 18, fontSize: 13, color: "#dc2626", fontWeight: "bold" }}>⚠️ {error}</div>}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 22 }}>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: ui.label, letterSpacing: 1, marginBottom: 8 }}>SELECT YOUR UNIVERSITY *</label>

              {selectedUni ? (
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 14, background: ui.uniCardBg, border: `2px solid ${ui.inputFocus}`, borderRadius: 10, padding: "12px 16px", marginBottom: 8 }}>
                    <img src={selectedUni.logoUrl} alt="" style={{ width: 44, height: 44, objectFit: "contain", borderRadius: 6, background: ui.cardBg, padding: 4 }} onError={(e) => { e.target.style.display = "none"; }} />
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: ui.uniCardText }}>{selectedUni.name}</div>
                      <div style={{ fontSize: 11, color: ui.subText }}>{selectedUni.type === "PUBLIC" ? "🏛️ Public University" : "🏢 Private University"}</div>
                    </div>
                    <button type="button" onClick={() => { update("universityId", ""); setLogoFile(null); }} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: ui.subText, fontSize: 18 }}>✕</button>
                  </div>

                  {!selectedUni.logoUrl && (
                    <div style={{ marginTop: 10, padding: 12, background: ui.warningBg, border: `1px dashed ${ui.warningBorder}`, borderRadius: 8 }}>
                      <div style={{ fontSize: 11, color: ui.warningText, fontWeight: 700, marginBottom: 5 }}>⚠️ We don't have your university logo yet!</div>
                      <div style={{ fontSize: 10, color: ui.warningText, marginBottom: 8 }}>Upload a clean PNG logo to help us (Admin will review it).</div>
                      <input type="file" accept="image/png, image/jpeg" onChange={(e) => setLogoFile(e.target.files[0])} style={{ fontSize: 11, width: "100%", color: ui.bodyText }} />
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <input
                    type="text"
                    placeholder="Search university name..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{ ...inputBaseStyle, marginBottom: 8 }}
                  />

                  <div style={{ maxHeight: 220, overflowY: "auto", border: `1.5px solid ${ui.inputBorder}`, borderRadius: 9, background: ui.cardBg }}>
                    {filtered.length === 0 ? (
                      <div style={{ padding: "16px", textAlign: "center", color: ui.subText, fontSize: 13 }}>No universities found</div>
                    ) : (
                      filtered.map((uni) => (
                        <div
                          key={uni.id}
                          onClick={() => { update("universityId", uni.id); setSearch(""); }}
                          style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", cursor: "pointer", borderBottom: `1px solid ${ui.softPanelBorder}`, background: ui.cardBg }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = ui.listItemHover; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = ui.cardBg; }}
                        >
                          <img src={uni.logoUrl} alt="" style={{ width: 36, height: 36, objectFit: "contain", background: ui.softPanel, borderRadius: 6, padding: 3, flexShrink: 0 }} onError={(e) => { e.target.style.display = "none"; }} />
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: ui.bodyText }}>{uni.name}</div>
                            <div style={{ fontSize: 10.5, color: ui.subText }}>{uni.shortName} · {uni.type}</div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </>
              )}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16, marginBottom: 16 }}>
              {[
                { label: "STUDENT NAME *", key: "studentName", placeholder: "Your Name..." },
                { label: "STUDENT ID *", key: "studentId", placeholder: "Your Student ID..." },
                { label: "DEPARTMENT *", key: "department", placeholder: "e.g. Computer Science and Engineering" },
                { label: "SEMESTER", key: "semester", placeholder: "e.g. Spring 2026" },
              ].map((field) => (
                <div key={field.key}>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: ui.label, letterSpacing: 1, marginBottom: 5 }}>{field.label}</label>
                  <input
                    type="text"
                    value={form[field.key]}
                    onChange={(e) => update(field.key, e.target.value)}
                    placeholder={field.placeholder}
                    required={field.label.includes("*")}
                    style={inputBaseStyle}
                  />
                </div>
              ))}
            </div>

            <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: 12, marginTop: 6 }}>
              <button type="button" onClick={() => navigate("/dashboard")} style={{ flex: 1, padding: "12px", borderRadius: 9, border: `1.5px solid ${ui.inputBorder}`, cursor: "pointer", background: ui.cardBg, fontSize: 13.5, fontWeight: 700, color: ui.subText }}>
                Skip for now
              </button>
              <button type="submit" disabled={loading} style={{ flex: 2, padding: "12px", borderRadius: 9, border: "none", cursor: "pointer", background: "linear-gradient(135deg,#1a3a6b,#2563eb)", color: "#fff", fontSize: 14, fontWeight: 700, opacity: loading ? 0.7 : 1 }}>
                {loading ? "Saving & Uploading..." : "Save & Continue →"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
