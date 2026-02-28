import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import API, { getPendingLogos, resolveLogo } from "../api/auth";

export default function AdminPanel() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [universities, setUniversities] = useState([]);
  const [selectedUniId, setSelectedUniId] = useState("");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [pendingRequests, setPendingRequests] = useState([]);

  useEffect(() => {
    if (!user || user.role !== "ADMIN") {
      navigate("/dashboard");
      return;
    }
    fetchUniversities();
    loadRequests();
  }, [user, navigate]);

  const fetchUniversities = async () => {
    try {
      const { data } = await API.get("/universities");
      setUniversities(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch universities", err);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedUniId || !file) {
      setMessage("Please select a university and an image file.");
      return;
    }

    setLoading(true);
    setMessage("");

    const formData = new FormData();
    formData.append("logo", file);

    try {
      await API.post(`/admin/universities/${selectedUniId}/logo`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setMessage("Logo uploaded successfully.");
      setFile(null);
      fetchUniversities();
    } catch (err) {
      console.error("Logo upload failed", err);
      setMessage("Upload failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const loadRequests = async () => {
    try {
      const { data } = await getPendingLogos();
      setPendingRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleResolve = async (id, action) => {
    try {
      await resolveLogo(id, action);
      loadRequests();
      alert(`Logo ${action}D successfully!`);
    } catch (err) {
      alert('Failed to process request.');
    }
  };

  const selectedUni = useMemo(
    () => universities.find((u) => u.id === selectedUniId),
    [universities, selectedUniId]
  );

  return (
    <div style={{ minHeight: "100vh", background: "#f1f5f9", padding: "40px 20px", fontFamily: "'Segoe UI',sans-serif" }}>
      <div style={{ maxWidth: 680, margin: "0 auto", background: "#fff", borderRadius: 14, padding: 30, boxShadow: "0 4px 6px rgba(0,0,0,0.05)" }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: "#1e293b", marginBottom: 20 }}>Admin Portal - Logo Upload</h1>

        {message && (
          <div
            style={{
              padding: 12,
              borderRadius: 8,
              marginBottom: 20,
              background: message.toLowerCase().includes("success") ? "#dcfce7" : "#fee2e2",
              color: message.toLowerCase().includes("success") ? "#166534" : "#991b1b",
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            {message}
          </div>
        )}

        <form onSubmit={handleUpload}>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 8 }}>SELECT UNIVERSITY</label>
            <select
              value={selectedUniId}
              onChange={(e) => setSelectedUniId(e.target.value)}
              style={{ width: "100%", padding: 12, borderRadius: 8, border: "1.5px solid #cbd5e1", outline: "none", fontSize: 14 }}
            >
              <option value="">-- Choose a University --</option>
              {universities.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.shortName})
                </option>
              ))}
            </select>
          </div>

          {selectedUni && (
            <div style={{ marginBottom: 20, padding: 16, background: "#f8fafc", borderRadius: 8, display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ width: 60, height: 60, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                {selectedUni.logoUrl ? (
                  <img src={selectedUni.logoUrl} alt="Logo" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                ) : (
                  <span style={{ fontSize: 10, color: "#94a3b8" }}>No Logo</span>
                )}
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700 }}>Current Logo Status</div>
                <div style={{ fontSize: 12, color: selectedUni.logoUrl ? "#16a34a" : "#dc2626" }}>
                  {selectedUni.logoUrl ? "Active and Uploaded" : "Missing Logo"}
                </div>
              </div>
            </div>
          )}

          <div style={{ marginBottom: 24 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 8 }}>UPLOAD NEW LOGO (PNG/JPG)</label>
            <input
              type="file"
              accept="image/png, image/jpeg"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              style={{ width: "100%", padding: 10, border: "1.5px dashed #cbd5e1", borderRadius: 8, background: "#f8fafc", cursor: "pointer" }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{ width: "100%", padding: 14, background: "#2563eb", color: "#fff", border: "none", borderRadius: 8, fontSize: 15, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer" }}
          >
            {loading ? "Uploading..." : "Upload Logo to Database"}
          </button>
        </form>

        <div style={{ marginTop: 40 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: '#1e293b', borderBottom: '2px solid #e2e8f0', paddingBottom: 10 }}>📥 Pending Logo Approvals ({pendingRequests.length})</h2>

          {pendingRequests.map((req) => (
            <div key={req.id} style={{ display: 'flex', alignItems: 'center', gap: 15, padding: 15, background: '#f8fafc', borderRadius: 8, marginTop: 10, border: '1px solid #cbd5e1' }}>
              <img src={req.pendingLogoUrl} alt="Pending" style={{ width: 60, height: 60, objectFit: 'contain', background: '#fff', padding: 5, borderRadius: 6, border: '1px solid #e2e8f0' }} crossOrigin="anonymous" />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{req.name} ({req.shortName})</div>
                <div style={{ fontSize: 11, color: '#64748b' }}>User suggested a new logo.</div>
              </div>
              <button onClick={() => handleResolve(req.id, 'REJECT')} style={{ padding: '8px 12px', background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: 6, fontWeight: 700, cursor: 'pointer' }}>Reject</button>
              <button onClick={() => handleResolve(req.id, 'APPROVE')} style={{ padding: '8px 12px', background: '#dcfce7', color: '#16a34a', border: 'none', borderRadius: 6, fontWeight: 700, cursor: 'pointer' }}>Approve & Publish</button>
            </div>
          ))}
          {pendingRequests.length === 0 && <div style={{ fontSize: 13, color: '#64748b', marginTop: 10 }}>No pending requests.</div>}
        </div>
      </div>
    </div>
  );
}
