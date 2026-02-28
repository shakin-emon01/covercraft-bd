import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getSharedCover } from "../api/auth";
import { CoverPage, THEMES, COLOR_PALETTES } from "./CoverDesigner"; 
import { useViewport } from "../hooks/useViewport";

export default function SharedCover() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isMobile, isTablet } = useViewport();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchCover = async () => {
      try {
        const res = await getSharedCover(id);
        setData(res.data);
      } catch (err) {
        setError("This cover link is invalid or has been deleted.");
      } finally {
        setLoading(false);
      }
    };
    fetchCover();
  }, [id]);

  if (loading) return <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", background: "#f8fafc", fontFamily: "'Segoe UI', sans-serif", fontWeight: 700, color: "#64748b" }}>Loading Cover...</div>;
  if (error) return <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", background: "#f8fafc", color: "#ef4444", fontWeight: "bold", fontFamily: "'Segoe UI', sans-serif" }}>{error}</div>;

  const form = data.coverData;
  const palette = COLOR_PALETTES.find(p => p.id === form.paletteId) || COLOR_PALETTES[0];
  const theme = THEMES[data.templateId] || THEMES[1];
  const previewScale = isMobile ? 0.42 : isTablet ? 0.68 : 0.9;

  return (
    <div style={{ minHeight: "100vh", background: "#edf1f5", display: "flex", flexDirection: "column", alignItems: "center", padding: isMobile ? "18px 10px" : "40px 20px", fontFamily: "'Segoe UI', sans-serif", boxSizing: "border-box" }}>
      
      {/* 🚀 Viral Marketing CTA Header */}
      <div style={{ background: "#fff", padding: isMobile ? "14px 12px" : "16px 24px", borderRadius: 12, boxShadow: "0 4px 20px rgba(0,0,0,0.05)", marginBottom: 30, display: "flex", flexDirection: isMobile ? "column" : "row", alignItems: isMobile ? "stretch" : "center", gap: 14, flexWrap: "wrap", justifyContent: "center", width: "100%", maxWidth: 794, boxSizing: "border-box" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: "#0f172a" }}>CoverCraft BD</div>
          <div style={{ fontSize: 13, color: "#64748b", wordBreak: "break-word" }}><strong>{data.user?.name}</strong> shared this assignment cover with you.</div>
        </div>
        <button onClick={() => navigate("/register")} style={{ width: isMobile ? "100%" : "auto", padding: "10px 20px", background: "#2563eb", color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 10px rgba(37,99,235,0.3)" }}>
          ✨ Create Your Own for Free
        </button>
      </div>

      {/* Render The Exact Same High-Quality Cover */}
      <div style={{ transform: `scale(${previewScale})`, transformOrigin: "top center", boxShadow: "0 20px 40px rgba(0,0,0,0.15)", marginBottom: isMobile ? -360 : isTablet ? -240 : -100 }}>
         <CoverPage form={form} palette={palette} theme={theme} />
      </div>

    </div>
  );
}
