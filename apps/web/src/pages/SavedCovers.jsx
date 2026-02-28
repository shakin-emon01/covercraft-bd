import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import API, { deleteCover } from "../api/auth";
import { useViewport } from "../hooks/useViewport";

export default function SavedCovers() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const { isMobile, isTablet } = useViewport();

  const [covers, setCovers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingCoverId, setDeletingCoverId] = useState("");

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    setLoading(true);
    API.get("/covers")
      .then((res) => setCovers(res.data || []))
      .catch(() => setCovers([]))
      .finally(() => setLoading(false));
  }, [user, navigate]);

  const handleDuplicate = (cover) => {
    localStorage.setItem(
      "covercraft_draft",
      JSON.stringify({
        form: cover?.coverData || {},
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
      setCovers((prev) => prev.filter((item) => item.id !== coverId));
    } catch (error) {
      alert(error?.response?.data?.message || "Failed to delete cover.");
    } finally {
      setDeletingCoverId("");
    }
  };

  const getExpiryDate = (cover) => {
    if (cover?.expiresAt) return new Date(cover.expiresAt);
    const createdAt = new Date(cover.createdAt);
    return new Date(createdAt.getTime() + 30 * 24 * 60 * 60 * 1000);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f1f5f9", fontFamily: "'Segoe UI',sans-serif", padding: isMobile ? "16px 12px" : "30px 20px" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, flexWrap: "wrap", gap: 10 }}>
          <h1 style={{ margin: 0, fontSize: isMobile ? 22 : 28, color: "#1e293b", fontWeight: 900 }}>
            ☁️ My Saved Covers ({covers.length})
          </h1>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => navigate("/dashboard")} style={{ border: "1px solid #cbd5e1", background: "#fff", color: "#334155", borderRadius: 8, padding: "9px 14px", fontWeight: 700, cursor: "pointer" }}>
              ← Back
            </button>
            <button onClick={() => navigate("/create")} style={{ border: "none", background: "linear-gradient(135deg,#1a3a6b,#2563eb)", color: "#fff", borderRadius: 8, padding: "9px 14px", fontWeight: 700, cursor: "pointer" }}>
              + New Cover
            </button>
          </div>
        </div>

        <div style={{ fontSize: 13, color: "#64748b", marginBottom: 16 }}>
          Covers auto-expire after 30 days from generated date.
        </div>

        {loading ? (
          <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", padding: 24, color: "#64748b", fontWeight: 700 }}>
            Loading your saved covers...
          </div>
        ) : covers.length === 0 ? (
          <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", padding: 34, textAlign: "center" }}>
            <div style={{ fontSize: 42, marginBottom: 8 }}>📁</div>
            <div style={{ fontWeight: 800, color: "#1e293b", marginBottom: 4 }}>No saved covers found</div>
            <div style={{ fontSize: 13, color: "#94a3b8" }}>Generate a new cover to see it here.</div>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : isTablet ? "1fr 1fr" : "repeat(3, minmax(0, 1fr))", gap: 16 }}>
            {covers.map((cover) => (
              <div key={cover.id} style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", padding: 18 }}>
                <div style={{ fontSize: 12, color: "#2563eb", fontWeight: 800, marginBottom: 8, textTransform: "uppercase" }}>
                  Course: {cover.coverData?.courseCode || "N/A"}
                </div>
                <h3 style={{ margin: "0 0 10px", fontSize: 18, color: "#0f172a", lineHeight: 1.35 }}>
                  {cover.coverData?.topicName || "Untitled Assignment"}
                </h3>
                <div style={{ fontSize: 13, color: "#64748b", marginBottom: 5 }}>
                  Created: {new Date(cover.createdAt).toLocaleDateString()}
                </div>
                <div style={{ fontSize: 12, color: "#b45309", fontWeight: 700, marginBottom: 14 }}>
                  Expires: {getExpiryDate(cover).toLocaleDateString()}
                </div>
                <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: 10 }}>
                  <button onClick={() => handleDuplicate(cover)} style={{ flex: isMobile ? "none" : 1, width: isMobile ? "100%" : "auto", padding: "8px", background: "#f1f5f9", color: "#334155", border: "none", borderRadius: 6, fontWeight: 700, cursor: "pointer" }}>
                    🔄 Duplicate
                  </button>
                  <button onClick={() => navigate(`/share/${cover.id}`)} style={{ width: isMobile ? "100%" : "auto", padding: "8px 12px", background: "#e0e7ff", color: "#4f46e5", border: "none", borderRadius: 6, fontWeight: 700, cursor: "pointer" }}>
                    🔗 Link
                  </button>
                  <button
                    onClick={() => handleDeleteCover(cover.id)}
                    disabled={deletingCoverId === cover.id}
                    style={{ width: isMobile ? "100%" : "auto", padding: "8px 12px", background: "#fee2e2", color: "#dc2626", border: "none", borderRadius: 6, fontWeight: 700, cursor: deletingCoverId === cover.id ? "not-allowed" : "pointer", opacity: deletingCoverId === cover.id ? 0.7 : 1 }}
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
  );
}
