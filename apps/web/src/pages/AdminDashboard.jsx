import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { useViewport } from "../hooks/useViewport";
import {
  getAdminStats,
  getAllUsers,
  getPendingLogos,
  resolveLogo,
  resolveLogoBulk,
  deleteUser,
  getAdminUnis,
  addUni,
  updateUni,
  deleteUni,
  getTemplateAnalytics,
  getTemplatePerformanceAnalytics,
  updateBroadcast,
  getActiveBroadcast,
  getAbuseRiskUsers,
  createAbuseSignal,
  getUniversityVerifications,
  reviewUniversityVerification,
  getOperationalAlerts,
  createOperationalAlert,
  resolveOperationalAlert,
  getFeatureFlags,
  upsertFeatureFlag,
  deleteFeatureFlag,
  getSupportTickets,
  getSupportTicketStats,
  createAdminSupportTicket,
  updateSupportTicket,
  getAuditLogs,
  getRoleMatrix,
  updateUserAccess,
  massUserAction,
} from "../api/auth";

export default function AdminDashboard() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const { isMobile, isTablet } = useViewport();
  const [activeTab, setActiveTab] = useState("overview");

  // Data states
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [unis, setUnis] = useState([]);
  const [analytics, setAnalytics] = useState([]);
  const [performanceAnalytics, setPerformanceAnalytics] = useState([]);
  const [abuseRisk, setAbuseRisk] = useState([]);
  const [verifications, setVerifications] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [flags, setFlags] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [ticketStats, setTicketStats] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [roleMatrix, setRoleMatrix] = useState({});

  // Broadcast state
  const [broadcast, setBroadcast] = useState({ message: "", isActive: false, type: "info" });

  // UI states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [warning, setWarning] = useState("");
  const [broadcasting, setBroadcasting] = useState(false);
  const [massActionLoading, setMassActionLoading] = useState(false);
  const [bulkLogoLoading, setBulkLogoLoading] = useState(false);

  // University form state
  const [uniForm, setUniForm] = useState({ name: "", shortName: "", logoUrl: "", type: "PUBLIC" });
  const [editingUniId, setEditingUniId] = useState(null);
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [alertForm, setAlertForm] = useState({ severity: "INFO", source: "manual", message: "" });
  const [flagForm, setFlagForm] = useState({ key: "", name: "", description: "", enabled: false, rollout: 100 });
  const [ticketForm, setTicketForm] = useState({ subject: "", message: "", priority: "NORMAL", email: user?.email || "" });
  const [abuseForm, setAbuseForm] = useState({ userId: "", type: "SPAM", score: 10, reason: "" });
  const [selectedLogoRequestIds, setSelectedLogoRequestIds] = useState([]);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    fetchData(true);
  }, [user, navigate]);

  useEffect(() => {
    setSelectedLogoRequestIds((prev) => prev.filter((id) => requests.some((req) => req.id === id)));
  }, [requests]);

  const fetchData = async (showLoader = false) => {
    if (showLoader) setLoading(true);
    try {
      const requests = [
        { label: "stats", run: getAdminStats },
        { label: "users", run: getAllUsers },
        { label: "logo requests", run: getPendingLogos },
        { label: "universities", run: getAdminUnis },
        { label: "template analytics", run: getTemplateAnalytics },
        { label: "broadcast", run: getActiveBroadcast },
        { label: "abuse risk", run: getAbuseRiskUsers },
        { label: "verifications", run: getUniversityVerifications },
        { label: "template performance", run: getTemplatePerformanceAnalytics },
        { label: "operational alerts", run: getOperationalAlerts },
        { label: "feature flags", run: getFeatureFlags },
        { label: "support tickets", run: getSupportTickets },
        { label: "ticket stats", run: getSupportTicketStats },
        { label: "audit logs", run: getAuditLogs },
        { label: "role matrix", run: getRoleMatrix },
      ];
      const responses = await Promise.allSettled(requests.map((item) => item.run()));

      const dataOrNull = (result) => (result.status === "fulfilled" ? result.value?.data : null);
      const failures = responses
        .map((result, index) => {
          if (result.status === "fulfilled") return null;
          const statusCode = result.reason?.response?.status;
          return {
            label: requests[index].label,
            statusCode,
          };
        })
        .filter(Boolean);

      const statsData = dataOrNull(responses[0]);
      const usersData = dataOrNull(responses[1]);
      const logosData = dataOrNull(responses[2]);
      const unisData = dataOrNull(responses[3]);
      const analyticsData = dataOrNull(responses[4]);
      const broadcastData = dataOrNull(responses[5]);
      const abuseData = dataOrNull(responses[6]);
      const verificationsData = dataOrNull(responses[7]);
      const performanceData = dataOrNull(responses[8]);
      const alertsData = dataOrNull(responses[9]);
      const flagsData = dataOrNull(responses[10]);
      const ticketsData = dataOrNull(responses[11]);
      const ticketStatsData = dataOrNull(responses[12]);
      const auditData = dataOrNull(responses[13]);
      const roleMatrixData = dataOrNull(responses[14]);

      if (statsData && typeof statsData === "object") setStats(statsData);
      if (Array.isArray(usersData)) setUsers(usersData);
      if (Array.isArray(logosData)) setRequests(logosData);
      if (Array.isArray(unisData)) setUnis(unisData);
      if (Array.isArray(analyticsData)) setAnalytics(analyticsData);
      if (Array.isArray(abuseData)) setAbuseRisk(abuseData);
      if (Array.isArray(verificationsData)) setVerifications(verificationsData);
      if (Array.isArray(performanceData?.leaderboard)) setPerformanceAnalytics(performanceData.leaderboard);
      if (Array.isArray(alertsData)) setAlerts(alertsData);
      if (Array.isArray(flagsData)) setFlags(flagsData);
      if (Array.isArray(ticketsData)) setTickets(ticketsData);
      if (ticketStatsData && typeof ticketStatsData === "object") setTicketStats(ticketStatsData);
      if (Array.isArray(auditData)) setAuditLogs(auditData);
      if (roleMatrixData && typeof roleMatrixData === "object" && !Array.isArray(roleMatrixData)) setRoleMatrix(roleMatrixData);

      if (broadcastData && typeof broadcastData === "object") {
        setBroadcast({
          message: broadcastData?.message || "",
          isActive: Boolean(broadcastData?.isActive),
          type: broadcastData?.type || "info",
        });
      }

      const hasAuthFailure = failures.some((item) => item?.statusCode === 401 || item?.statusCode === 403);
      const hasRateLimitFailure = failures.some((item) => item?.statusCode === 429);

      if (hasAuthFailure) {
        setError("Admin access check failed. Please login again.");
        setWarning("");
      } else if (failures.length > 0) {
        const failedLabels = failures.map((item) => item.label).join(", ");
        const baseMessage = hasRateLimitFailure
          ? "Some admin data is temporarily rate-limited. Showing available sections only."
          : "Some admin sections could not be loaded right now.";
        setWarning(`${baseMessage} Failed: ${failedLabels}.`);
        setError("");
      } else {
        setWarning("");
        setError("");
      }
    } catch (err) {
      console.error("Admin dashboard fetch failed:", err);
      setError("Failed to load admin data. Are you sure you are an Admin?");
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  const handleBroadcastSubmit = async (e) => {
    e.preventDefault();
    setBroadcasting(true);
    try {
      await updateBroadcast(broadcast);
      alert("Global broadcast updated successfully.");
    } catch {
      alert("Failed to update broadcast.");
    } finally {
      setBroadcasting(false);
    }
  };

  const handleResolveLogo = async (id, action) => {
    try {
      await resolveLogo(id, action);
      fetchData(false);
    } catch {
      alert("Failed to process request.");
    }
  };

  const toggleSelectedLogoRequest = (id) => {
    setSelectedLogoRequestIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAllLogoRequests = () => {
    if (selectedLogoRequestIds.length === requests.length) {
      setSelectedLogoRequestIds([]);
      return;
    }
    setSelectedLogoRequestIds(requests.map((item) => item.id));
  };

  const handleBulkResolveLogos = async (action, mode) => {
    if (bulkLogoLoading) return;

    const runAll = mode === "all";
    const targetCount = runAll ? requests.length : selectedLogoRequestIds.length;
    if (targetCount === 0) {
      alert("Select at least one logo request first.");
      return;
    }

    const confirmMessage = runAll
      ? `Are you sure you want to ${action.toLowerCase()} all pending logo requests (${targetCount})?`
      : `Are you sure you want to ${action.toLowerCase()} selected logo requests (${targetCount})?`;
    if (!window.confirm(confirmMessage)) return;

    setBulkLogoLoading(true);
    try {
      const payload = runAll
        ? { action, applyToAll: true }
        : { action, ids: selectedLogoRequestIds };

      const { data } = await resolveLogoBulk(payload);
      setSelectedLogoRequestIds([]);
      fetchData(false);
      alert(data?.message || `Bulk ${action.toLowerCase()} completed.`);
    } catch (err) {
      alert(err.response?.data?.message || "Bulk logo action failed.");
    } finally {
      setBulkLogoLoading(false);
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm("Are you sure you want to delete this user? This action cannot be undone.")) return;
    try {
      await deleteUser(id);
      fetchData(false);
      alert("User deleted successfully.");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete user.");
    }
  };

  const handleUniSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingUniId) {
        await updateUni(editingUniId, uniForm);
        alert("University updated!");
      } else {
        await addUni(uniForm);
        alert("University added!");
      }
      setUniForm({ name: "", shortName: "", logoUrl: "", type: "PUBLIC" });
      setEditingUniId(null);
      fetchData(false);
    } catch (err) {
      alert(err.response?.data?.message || "Operation failed.");
    }
  };

  const handleEditUni = (university) => {
    setEditingUniId(university.id);
    setUniForm({
      name: university.name,
      shortName: university.shortName,
      logoUrl: university.logoUrl || "",
      type: university.type,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDeleteUni = async (id) => {
    if (!window.confirm("Delete this university?")) return;
    try {
      await deleteUni(id);
      fetchData(false);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete university.");
    }
  };

  const toggleSelectedUser = (id) => {
    setSelectedUserIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  const handleMassAction = async (action) => {
    if (selectedUserIds.length === 0) {
      alert("Select at least one user first.");
      return;
    }
    if (!window.confirm(`Run mass action: ${action}?`)) return;
    setMassActionLoading(true);
    try {
      await massUserAction({ userIds: selectedUserIds, action });
      setSelectedUserIds([]);
      fetchData(false);
      alert(`Mass action ${action} completed.`);
    } catch (err) {
      alert(err.response?.data?.message || "Mass action failed.");
    } finally {
      setMassActionLoading(false);
    }
  };

  const handleUpdateUserAccess = async (item, patchData) => {
    try {
      await updateUserAccess(item.id, patchData);
      fetchData(false);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update access.");
    }
  };

  const handleCreateAbuseSignal = async (e) => {
    e.preventDefault();
    try {
      await createAbuseSignal({ ...abuseForm, score: Number(abuseForm.score) || 0 });
      setAbuseForm({ userId: "", type: "SPAM", score: 10, reason: "" });
      fetchData(false);
      alert("Abuse signal created.");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to create abuse signal.");
    }
  };

  const handleReviewVerification = async (verificationId, action) => {
    try {
      await reviewUniversityVerification(verificationId, action);
      fetchData(false);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to review verification.");
    }
  };

  const handleCreateAlert = async (e) => {
    e.preventDefault();
    try {
      await createOperationalAlert(alertForm);
      setAlertForm({ severity: "INFO", source: "manual", message: "" });
      fetchData(false);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to create alert.");
    }
  };

  const handleResolveAlert = async (id) => {
    try {
      await resolveOperationalAlert(id);
      fetchData(false);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to resolve alert.");
    }
  };

  const handleFlagSubmit = async (e) => {
    e.preventDefault();
    try {
      await upsertFeatureFlag({
        ...flagForm,
        rollout: Number(flagForm.rollout) || 0,
      });
      setFlagForm({ key: "", name: "", description: "", enabled: false, rollout: 100 });
      fetchData(false);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to save feature flag.");
    }
  };

  const handleDeleteFlag = async (key) => {
    if (!window.confirm(`Delete flag "${key}"?`)) return;
    try {
      await deleteFeatureFlag(key);
      fetchData(false);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete flag.");
    }
  };

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    try {
      await createAdminSupportTicket(ticketForm);
      setTicketForm({ subject: "", message: "", priority: "NORMAL", email: user?.email || "" });
      fetchData(false);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to create ticket.");
    }
  };

  const handleUpdateTicket = async (ticketId, patchData) => {
    try {
      await updateSupportTicket(ticketId, patchData);
      fetchData(false);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update ticket.");
    }
  };

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          background: "#f8fafc",
          fontWeight: 700,
        }}
      >
        Loading Command Center...
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          background: "#f8fafc",
          color: "#ef4444",
          fontWeight: 700,
        }}
      >
        {error}
      </div>
    );
  }

  const maxUsage = Math.max(...analytics.map((item) => item?._count?.templateId ?? 0), 1);
  const contentPadding = isMobile ? "16px 12px 22px" : isTablet ? "24px 18px 28px" : "40px";
  const headerPadding = isMobile ? "16px 14px" : isTablet ? "18px 24px" : "20px 40px";
  const tabsPadding = isMobile ? "0 12px" : isTablet ? "0 20px" : "0 40px";
  const twoColGrid = isMobile ? "1fr" : "1fr 1fr";
  const universityFormGrid = isMobile ? "1fr" : isTablet ? "1fr 1fr" : "1fr 1fr 1fr 1fr auto";

  return (
    <div style={{ minHeight: "100vh", background: "#f1f5f9", fontFamily: "'Segoe UI', sans-serif" }}>
      <div style={{ background: "#0f172a", color: "#fff", padding: headerPadding, display: "flex", flexDirection: isMobile ? "column" : "row", justifyContent: "space-between", alignItems: isMobile ? "flex-start" : "center", gap: isMobile ? 12 : 0 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: isMobile ? 20 : 24, fontWeight: 900 }}>CoverCraft Admin</h1>
          <div style={{ fontSize: 12, color: "#94a3b8", letterSpacing: 1 }}>SYSTEM COMMAND CENTER</div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={() => fetchData(false)}
            style={{ padding: "8px 16px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", borderRadius: 8, cursor: "pointer", fontWeight: 600 }}
          >
            Refresh Data
          </button>
          <button
            onClick={() => navigate("/dashboard")}
            style={{ padding: "8px 16px", background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", borderRadius: 8, cursor: "pointer", fontWeight: 600 }}
          >
            Exit Admin
          </button>
        </div>
      </div>

      <div style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", padding: tabsPadding, display: "flex", gap: isMobile ? 18 : 30, overflowX: "auto", whiteSpace: "nowrap" }}>
        {["overview", "users", "universities", "approvals", "moderation", "operations", "flags", "support", "audit"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: "16px 0",
              border: "none",
              background: "none",
              cursor: "pointer",
              fontSize: 14,
              fontWeight: 700,
              color: activeTab === tab ? "#2563eb" : "#64748b",
              borderBottom: activeTab === tab ? "3px solid #2563eb" : "3px solid transparent",
              textTransform: "capitalize",
              flexShrink: 0,
            }}
          >
            {tab === "approvals" ? `Logo Approvals (${requests.length})` : tab}
          </button>
        ))}
      </div>

      <div style={{ padding: contentPadding, maxWidth: 1200, margin: "0 auto" }}>
        {warning && (
          <div style={{ background: "#fef3c7", border: "1px solid #f59e0b", color: "#92400e", borderRadius: 10, padding: "10px 12px", marginBottom: 16, fontSize: 13, fontWeight: 600 }}>
            {warning}
          </div>
        )}

        {/* OVERVIEW & SYSTEM SETTINGS */}
        {activeTab === "overview" && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 20, marginBottom: 30 }}>
              <StatCard title="Total Users" value={stats?.totalUsers} color="#3b82f6" onClick={() => setActiveTab("users")} />
              <StatCard title="Covers Generated" value={stats?.totalCovers} color="#10b981" />
              <StatCard title="Universities" value={stats?.totalUnis} color="#8b5cf6" onClick={() => setActiveTab("universities")} />
              <StatCard title="Pending Logos" value={stats?.pendingLogos} color="#f59e0b" onClick={() => setActiveTab("approvals")} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: twoColGrid, gap: 30 }}>
              <div style={{ background: "#fff", padding: 24, borderRadius: 12, border: "1px solid #e2e8f0", boxShadow: "0 4px 6px rgba(0,0,0,0.02)" }}>
                <h2 style={{ fontSize: 16, fontWeight: 800, margin: "0 0 20px" }}>Global System Broadcast</h2>
                <form onSubmit={handleBroadcastSubmit}>
                  <textarea
                    value={broadcast.message}
                    onChange={(e) => setBroadcast({ ...broadcast, message: e.target.value })}
                    placeholder="Type announcement here..."
                    style={{ width: "100%", padding: 12, borderRadius: 8, border: "1px solid #cbd5e1", minHeight: 100, boxSizing: "border-box", marginBottom: 15, fontFamily: "inherit" }}
                    required
                  />

                  <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: 15, marginBottom: 20 }}>
                    <select value={broadcast.type} onChange={(e) => setBroadcast({ ...broadcast, type: e.target.value })} style={{ flex: 1, padding: 10, borderRadius: 8, border: "1px solid #cbd5e1" }}>
                      <option value="info">Info (Blue)</option>
                      <option value="warning">Warning/Offer (Yellow)</option>
                      <option value="success">Success (Green)</option>
                    </select>

                    <label
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        background: broadcast.isActive ? "#dcfce7" : "#f1f5f9",
                        padding: "0 15px",
                        borderRadius: 8,
                        cursor: "pointer",
                        border: `1px solid ${broadcast.isActive ? "#86efac" : "#cbd5e1"}`,
                      }}
                    >
                      <input type="checkbox" checked={broadcast.isActive} onChange={(e) => setBroadcast({ ...broadcast, isActive: e.target.checked })} style={{ width: 16, height: 16 }} />
                      <strong style={{ color: broadcast.isActive ? "#166534" : "#64748b" }}>Banner Active</strong>
                    </label>
                  </div>

                  <button type="submit" disabled={broadcasting} style={{ width: "100%", padding: 12, background: "#0f172a", color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, cursor: "pointer" }}>
                    {broadcasting ? "Publishing..." : "Publish Broadcast"}
                  </button>
                </form>
              </div>

              <div style={{ background: "#fff", padding: 24, borderRadius: 12, border: "1px solid #e2e8f0", boxShadow: "0 4px 6px rgba(0,0,0,0.02)", maxHeight: 400, overflowY: "auto" }}>
                <h2 style={{ fontSize: 16, fontWeight: 800, margin: "0 0 20px" }}>Template Popularity</h2>
                {analytics.length === 0 && (
                  <div style={{ fontSize: 13, color: "#64748b" }}>No template usage yet.</div>
                )}

                {analytics.map((item, index) => {
                  const usageCount = item?._count?.templateId ?? 0;
                  const percentage = Math.round((usageCount / maxUsage) * 100);
                  return (
                    <div key={item.templateId} style={{ marginBottom: 15 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 700, marginBottom: 5 }}>
                        <span>{`Template ${item.templateId}${index === 0 ? " (Top)" : ""}`}</span>
                        <span style={{ color: "#64748b" }}>{usageCount} Uses</span>
                      </div>
                      <div style={{ width: "100%", height: 10, background: "#f1f5f9", borderRadius: 10, overflow: "hidden" }}>
                        <div
                          style={{
                            width: `${percentage}%`,
                            height: "100%",
                            background: index === 0 ? "linear-gradient(90deg, #f59e0b, #fbbf24)" : "linear-gradient(90deg, #2563eb, #60a5fa)",
                            borderRadius: 10,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {activeTab === "users" && (
          <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: "0 4px 6px rgba(0,0,0,0.02)" }}>
            <div style={{ padding: 14, borderBottom: "1px solid #e2e8f0", display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button
                onClick={() => handleMassAction("SUSPEND")}
                disabled={massActionLoading}
                style={{ padding: "8px 12px", border: "none", borderRadius: 8, background: "#fef3c7", color: "#92400e", cursor: "pointer", fontWeight: 700 }}
              >
                Suspend Selected
              </button>
              <button
                onClick={() => handleMassAction("RESTORE")}
                disabled={massActionLoading}
                style={{ padding: "8px 12px", border: "none", borderRadius: 8, background: "#dcfce7", color: "#166534", cursor: "pointer", fontWeight: 700 }}
              >
                Restore Selected
              </button>
              <button
                onClick={() => handleMassAction("DELETE")}
                disabled={massActionLoading}
                style={{ padding: "8px 12px", border: "none", borderRadius: 8, background: "#fee2e2", color: "#991b1b", cursor: "pointer", fontWeight: 700 }}
              >
                Delete Selected
              </button>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", minWidth: 980, borderCollapse: "collapse", textAlign: "left" }}>
                <thead style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
                  <tr>
                    <th style={thStyle}>Select</th>
                    <th style={thStyle}>Name</th>
                    <th style={thStyle}>Email</th>
                    <th style={thStyle}>Role</th>
                    <th style={thStyle}>Admin Level</th>
                    <th style={thStyle}>Status</th>
                    <th style={thStyle}>Covers</th>
                    <th style={thStyle}>Joined</th>
                    <th style={thStyle}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((item) => (
                    <tr key={item.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={tdStyle}>
                        {item.role === "STUDENT" ? (
                          <input type="checkbox" checked={selectedUserIds.includes(item.id)} onChange={() => toggleSelectedUser(item.id)} />
                        ) : null}
                      </td>
                      <td style={tdStyle}><strong>{item.name || "Unknown"}</strong></td>
                      <td style={tdStyle}>{item.email}</td>
                      <td style={tdStyle}>
                        <span
                          style={{
                            background: item.role === "ADMIN" ? "#fee2e2" : "#e0e7ff",
                            color: item.role === "ADMIN" ? "#dc2626" : "#4f46e5",
                            padding: "4px 8px",
                            borderRadius: 6,
                            fontSize: 11,
                            fontWeight: 800,
                          }}
                        >
                          {item.role}
                        </span>
                      </td>
                      <td style={tdStyle}>{item.adminRole || "-"}</td>
                      <td style={tdStyle}>
                        <span style={{ fontWeight: 700, color: item.status === "SUSPENDED" ? "#b45309" : "#166534" }}>{item.status || "ACTIVE"}</span>
                      </td>
                      <td style={tdStyle}>{item._count?.covers ?? 0}</td>
                      <td style={tdStyle}>{new Date(item.createdAt).toLocaleDateString()}</td>
                      <td style={tdStyle}>
                        {item.role === "ADMIN" && (
                          <div style={{ display: "flex", gap: 6, marginBottom: 6, flexWrap: "wrap" }}>
                            <button onClick={() => handleUpdateUserAccess(item, { role: "ADMIN", adminRole: "SUPER_ADMIN" })} style={tinyBtn}>
                              Super
                            </button>
                            <button onClick={() => handleUpdateUserAccess(item, { role: "ADMIN", adminRole: "MODERATOR" })} style={tinyBtn}>
                              Moderator
                            </button>
                            <button onClick={() => handleUpdateUserAccess(item, { role: "ADMIN", adminRole: "SUPPORT" })} style={tinyBtn}>
                              Support
                            </button>
                          </div>
                        )}
                        {item.role === "STUDENT" && item.status !== "SUSPENDED" && (
                          <button
                            onClick={() => handleUpdateUserAccess(item, { status: "SUSPENDED" })}
                            style={{ marginRight: 8, padding: "6px 10px", background: "#fef3c7", color: "#92400e", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: "bold", fontSize: 12 }}
                          >
                            Suspend
                          </button>
                        )}
                        {item.role === "STUDENT" && item.status === "SUSPENDED" && (
                          <button
                            onClick={() => handleUpdateUserAccess(item, { status: "ACTIVE" })}
                            style={{ marginRight: 8, padding: "6px 10px", background: "#dcfce7", color: "#166534", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: "bold", fontSize: 12 }}
                          >
                            Restore
                          </button>
                        )}
                        {item.role !== "ADMIN" && (
                          <button
                            onClick={() => handleDeleteUser(item.id)}
                            style={{ padding: "6px 12px", background: "#fef2f2", color: "#ef4444", border: "1px solid #fecaca", borderRadius: 6, cursor: "pointer", fontWeight: "bold", fontSize: 12 }}
                          >
                            Delete
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "universities" && (
          <div>
            <form
              onSubmit={handleUniSubmit}
              style={{
                background: "#fff",
                padding: 24,
                borderRadius: 12,
                border: "1px solid #e2e8f0",
                marginBottom: 30,
                display: "grid",
                gridTemplateColumns: universityFormGrid,
                gap: 15,
                alignItems: "end",
              }}
            >
              <div>
                <label style={labelStyle}>University Name *</label>
                <input required type="text" value={uniForm.name} onChange={(e) => setUniForm({ ...uniForm, name: e.target.value })} style={inputStyle} placeholder="e.g. Dhaka University" />
              </div>
              <div>
                <label style={labelStyle}>Short Name *</label>
                <input required type="text" value={uniForm.shortName} onChange={(e) => setUniForm({ ...uniForm, shortName: e.target.value })} style={inputStyle} placeholder="e.g. DU" />
              </div>
              <div>
                <label style={labelStyle}>Logo URL (Optional)</label>
                <input type="text" value={uniForm.logoUrl} onChange={(e) => setUniForm({ ...uniForm, logoUrl: e.target.value })} style={inputStyle} placeholder="https://..." />
              </div>
              <div>
                <label style={labelStyle}>Type</label>
                <select value={uniForm.type} onChange={(e) => setUniForm({ ...uniForm, type: e.target.value })} style={inputStyle}>
                  <option value="PUBLIC">Public</option>
                  <option value="PRIVATE">Private</option>
                </select>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                {editingUniId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingUniId(null);
                      setUniForm({ name: "", shortName: "", logoUrl: "", type: "PUBLIC" });
                    }}
                    style={{ padding: "10px 15px", background: "#f1f5f9", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: "bold" }}
                  >
                    Cancel
                  </button>
                )}
                <button type="submit" style={{ padding: "10px 20px", background: editingUniId ? "#f59e0b" : "#2563eb", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: "bold" }}>
                  {editingUniId ? "Update" : "Add New"}
                </button>
              </div>
            </form>

            <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", overflow: "hidden" }}>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", minWidth: 680, borderCollapse: "collapse", textAlign: "left" }}>
                  <thead style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
                    <tr>
                      <th style={thStyle}>Logo</th>
                      <th style={thStyle}>Name</th>
                      <th style={thStyle}>Short Name</th>
                      <th style={thStyle}>Type</th>
                      <th style={thStyle}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {unis.map((item) => (
                      <tr key={item.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td style={tdStyle}>
                          <img src={item.logoUrl || "/vite.svg"} alt="logo" style={{ width: 40, height: 40, objectFit: "contain" }} />
                        </td>
                        <td style={tdStyle}><strong>{item.name}</strong></td>
                        <td style={tdStyle}>{item.shortName}</td>
                        <td style={tdStyle}>{item.type}</td>
                        <td style={tdStyle}>
                          <button
                            onClick={() => handleEditUni(item)}
                            style={{ marginRight: 10, padding: "6px 12px", background: "#eff6ff", color: "#2563eb", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: "bold", fontSize: 12 }}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteUni(item.id)}
                            style={{ padding: "6px 12px", background: "#fef2f2", color: "#ef4444", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: "bold", fontSize: 12 }}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === "approvals" && (
          <div>
            {requests.length === 0 ? (
              <div style={{ background: "#fff", padding: 40, textAlign: "center", borderRadius: 12, color: "#64748b", border: "1px dashed #cbd5e1" }}>
                No pending logo requests.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 15 }}>
                <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: isMobile ? 12 : 16, display: "flex", flexDirection: isMobile ? "column" : "row", alignItems: isMobile ? "flex-start" : "center", justifyContent: "space-between", gap: 10 }}>
                  <label style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700, color: "#334155" }}>
                    <input
                      type="checkbox"
                      checked={selectedLogoRequestIds.length > 0 && selectedLogoRequestIds.length === requests.length}
                      onChange={toggleSelectAllLogoRequests}
                    />
                    Select All ({requests.length})
                  </label>
                  <div style={{ fontSize: 12, color: "#64748b", fontWeight: 700 }}>
                    Selected: {selectedLogoRequestIds.length}
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    <button
                      onClick={() => handleBulkResolveLogos("REJECT", "selected")}
                      disabled={bulkLogoLoading || selectedLogoRequestIds.length === 0}
                      style={{ padding: "8px 12px", background: "#fee2e2", color: "#b91c1c", border: "1px solid #fecaca", borderRadius: 8, fontWeight: 700, cursor: "pointer" }}
                    >
                      Reject Selected
                    </button>
                    <button
                      onClick={() => handleBulkResolveLogos("APPROVE", "selected")}
                      disabled={bulkLogoLoading || selectedLogoRequestIds.length === 0}
                      style={{ padding: "8px 12px", background: "#dcfce7", color: "#15803d", border: "1px solid #bbf7d0", borderRadius: 8, fontWeight: 700, cursor: "pointer" }}
                    >
                      Approve Selected
                    </button>
                    <button
                      onClick={() => handleBulkResolveLogos("APPROVE", "all")}
                      disabled={bulkLogoLoading || requests.length === 0}
                      style={{ padding: "8px 12px", background: "#2563eb", color: "#fff", border: "1px solid #1d4ed8", borderRadius: 8, fontWeight: 700, cursor: "pointer" }}
                    >
                      Approve All
                    </button>
                  </div>
                </div>

                {requests.map((request) => (
                  <div key={request.id} style={{ display: "flex", flexDirection: isMobile ? "column" : "row", alignItems: isMobile ? "flex-start" : "center", gap: 20, padding: 20, background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0" }}>
                    <label style={{ display: "flex", alignItems: "center", marginRight: 2 }}>
                      <input
                        type="checkbox"
                        checked={selectedLogoRequestIds.includes(request.id)}
                        onChange={() => toggleSelectedLogoRequest(request.id)}
                      />
                    </label>
                    <img src={request.pendingLogoUrl} alt="Pending" style={{ width: 80, height: 80, objectFit: "contain", background: "#f8fafc", padding: 10, borderRadius: 8, border: "1px solid #cbd5e1" }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 800, fontSize: 18, color: "#0f172a" }}>{request.name}</div>
                      <div style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>Short Name: <strong>{request.shortName}</strong></div>
                    </div>
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap", width: isMobile ? "100%" : "auto" }}>
                      <button onClick={() => handleResolveLogo(request.id, "REJECT")} style={{ padding: "10px 20px", background: "#fee2e2", color: "#ef4444", border: "none", borderRadius: 8, fontWeight: 700, cursor: "pointer" }}>Reject</button>
                      <button onClick={() => handleResolveLogo(request.id, "APPROVE")} style={{ padding: "10px 20px", background: "#dcfce7", color: "#16a34a", border: "none", borderRadius: 8, fontWeight: 700, cursor: "pointer" }}>Approve & Publish</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "moderation" && (
          <div style={{ display: "grid", gridTemplateColumns: isMobile || isTablet ? "1fr" : "1.1fr 1fr", gap: 20 }}>
            <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", padding: 20 }}>
              <h3 style={{ marginTop: 0 }}>Abuse & Spam Risk</h3>
              {abuseRisk.length === 0 ? (
                <div style={{ color: "#64748b", fontSize: 13 }}>No risk data available yet.</div>
              ) : (
                <div style={{ maxHeight: 420, overflowY: "auto" }}>
                  {abuseRisk.slice(0, 30).map((item) => (
                    <div key={item.userId} style={{ borderBottom: "1px solid #f1f5f9", padding: "10px 0" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                        <div>
                          <div style={{ fontWeight: 700 }}>{item.name}</div>
                          <div style={{ fontSize: 12, color: "#64748b" }}>{item.email}</div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontWeight: 800, color: item.riskLevel === "HIGH" ? "#dc2626" : item.riskLevel === "MEDIUM" ? "#d97706" : "#16a34a" }}>
                            {item.riskLevel}
                          </div>
                          <div style={{ fontSize: 12, color: "#64748b" }}>Score: {item.score}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <form onSubmit={handleCreateAbuseSignal} style={panelStyle}>
                <h3 style={{ marginTop: 0 }}>Create Abuse Signal</h3>
                <select value={abuseForm.userId} onChange={(e) => setAbuseForm({ ...abuseForm, userId: e.target.value })} style={inputStyle} required>
                  <option value="">Select user</option>
                  {users.filter((u) => u.role !== "ADMIN").map((u) => (
                    <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                  ))}
                </select>
                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 10, marginTop: 10 }}>
                  <input value={abuseForm.type} onChange={(e) => setAbuseForm({ ...abuseForm, type: e.target.value })} style={inputStyle} placeholder="Type (SPAM/BOT/etc)" required />
                  <input type="number" min={1} max={100} value={abuseForm.score} onChange={(e) => setAbuseForm({ ...abuseForm, score: e.target.value })} style={inputStyle} placeholder="Score" required />
                </div>
                <textarea value={abuseForm.reason} onChange={(e) => setAbuseForm({ ...abuseForm, reason: e.target.value })} style={{ ...inputStyle, marginTop: 10, minHeight: 80 }} placeholder="Reason" required />
                <button type="submit" style={primaryBtn}>Save Signal</button>
              </form>

              <div style={panelStyle}>
                <h3 style={{ marginTop: 0 }}>University Verification Queue</h3>
                {verifications.length === 0 ? (
                  <div style={{ color: "#64748b", fontSize: 13 }}>No verification requests.</div>
                ) : (
                  <div style={{ maxHeight: 280, overflowY: "auto" }}>
                    {verifications.slice(0, 20).map((v) => (
                      <div key={v.id} style={{ borderBottom: "1px solid #f1f5f9", padding: "10px 0" }}>
                        <div style={{ fontWeight: 700 }}>{v.university?.shortName || "University"} · {v.requestType}</div>
                        <div style={{ fontSize: 12, color: "#64748b", marginBottom: 6 }}>Status: {v.status}</div>
                        {v.status === "PENDING" && (
                          <div style={{ display: "flex", gap: 8 }}>
                            <button onClick={() => handleReviewVerification(v.id, "REJECT")} style={dangerBtn}>Reject</button>
                            <button onClick={() => handleReviewVerification(v.id, "APPROVE")} style={successBtn}>Approve</button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "operations" && (
          <div style={{ display: "grid", gridTemplateColumns: twoColGrid, gap: 20 }}>
            <div style={panelStyle}>
              <h3 style={{ marginTop: 0 }}>Template Performance</h3>
              {performanceAnalytics.length === 0 ? (
                <div style={{ color: "#64748b", fontSize: 13 }}>No performance data yet.</div>
              ) : (
                <div style={{ maxHeight: 380, overflowY: "auto" }}>
                  {performanceAnalytics.slice(0, 12).map((item) => (
                    <div key={item.templateId} style={{ marginBottom: 12 }}>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <strong>Template {item.templateId}</strong>
                        <span style={{ fontSize: 12, color: "#64748b" }}>{item.marketShare}% share</span>
                      </div>
                      <div style={{ fontSize: 12, color: "#64748b" }}>
                        {item.totalUses} uses · {item.uniqueUsers} unique users · Top Uni: {item.topUniversity}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <form onSubmit={handleCreateAlert} style={panelStyle}>
                <h3 style={{ marginTop: 0 }}>Create Operational Alert</h3>
                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 10 }}>
                  <select value={alertForm.severity} onChange={(e) => setAlertForm({ ...alertForm, severity: e.target.value })} style={inputStyle}>
                    <option value="INFO">INFO</option>
                    <option value="WARNING">WARNING</option>
                    <option value="CRITICAL">CRITICAL</option>
                  </select>
                  <input value={alertForm.source} onChange={(e) => setAlertForm({ ...alertForm, source: e.target.value })} style={inputStyle} placeholder="source" required />
                </div>
                <textarea value={alertForm.message} onChange={(e) => setAlertForm({ ...alertForm, message: e.target.value })} style={{ ...inputStyle, marginTop: 10, minHeight: 80 }} placeholder="alert message" required />
                <button type="submit" style={primaryBtn}>Publish Alert</button>
              </form>

              <div style={panelStyle}>
                <h3 style={{ marginTop: 0 }}>Alert Center</h3>
                {alerts.length === 0 ? (
                  <div style={{ color: "#64748b", fontSize: 13 }}>No alerts found.</div>
                ) : (
                  <div style={{ maxHeight: 260, overflowY: "auto" }}>
                    {alerts.slice(0, 30).map((a) => (
                      <div key={a.id} style={{ borderBottom: "1px solid #f1f5f9", padding: "10px 0" }}>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                          <strong>{a.severity} · {a.source}</strong>
                          <span style={{ fontSize: 12, color: a.isResolved ? "#16a34a" : "#d97706" }}>{a.isResolved ? "Resolved" : "Open"}</span>
                        </div>
                        <div style={{ fontSize: 13, color: "#334155", marginTop: 2 }}>{a.message}</div>
                        {!a.isResolved && <button onClick={() => handleResolveAlert(a.id)} style={{ ...successBtn, marginTop: 8 }}>Resolve</button>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "flags" && (
          <div style={{ display: "grid", gridTemplateColumns: twoColGrid, gap: 20 }}>
            <form onSubmit={handleFlagSubmit} style={panelStyle}>
              <h3 style={{ marginTop: 0 }}>Feature Flag Console</h3>
              <input value={flagForm.key} onChange={(e) => setFlagForm({ ...flagForm, key: e.target.value })} style={inputStyle} placeholder="flag.key" required />
              <input value={flagForm.name} onChange={(e) => setFlagForm({ ...flagForm, name: e.target.value })} style={{ ...inputStyle, marginTop: 10 }} placeholder="Display name" required />
              <textarea value={flagForm.description} onChange={(e) => setFlagForm({ ...flagForm, description: e.target.value })} style={{ ...inputStyle, marginTop: 10, minHeight: 70 }} placeholder="Description" />
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 10, marginTop: 10 }}>
                <input type="number" min={0} max={100} value={flagForm.rollout} onChange={(e) => setFlagForm({ ...flagForm, rollout: e.target.value })} style={inputStyle} placeholder="Rollout %" />
                <label style={{ ...inputStyle, display: "flex", alignItems: "center", gap: 8 }}>
                  <input type="checkbox" checked={flagForm.enabled} onChange={(e) => setFlagForm({ ...flagForm, enabled: e.target.checked })} />
                  Enabled
                </label>
              </div>
              <button type="submit" style={primaryBtn}>Save Flag</button>
            </form>
            <div style={panelStyle}>
              <h3 style={{ marginTop: 0 }}>Flags</h3>
              {flags.length === 0 ? (
                <div style={{ color: "#64748b", fontSize: 13 }}>No flags yet.</div>
              ) : (
                <div style={{ maxHeight: 420, overflowY: "auto" }}>
                  {flags.map((f) => (
                    <div key={f.key} style={{ borderBottom: "1px solid #f1f5f9", padding: "10px 0", display: "flex", justifyContent: "space-between", gap: 10 }}>
                      <div>
                        <div style={{ fontWeight: 700 }}>{f.key}</div>
                        <div style={{ fontSize: 12, color: "#64748b" }}>{f.name} · {f.enabled ? "Enabled" : "Disabled"} · {f.rollout}%</div>
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button onClick={() => setFlagForm({ key: f.key, name: f.name, description: f.description || "", enabled: Boolean(f.enabled), rollout: f.rollout || 100 })} style={tinyBtn}>Edit</button>
                        <button onClick={() => handleDeleteFlag(f.key)} style={dangerBtn}>Delete</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "support" && (
          <div style={{ display: "grid", gridTemplateColumns: twoColGrid, gap: 20 }}>
            <div style={panelStyle}>
              <h3 style={{ marginTop: 0 }}>Support Desk</h3>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4,1fr)", gap: 10, marginBottom: 14 }}>
                <MiniStat label="Open" value={ticketStats?.open || 0} color="#ef4444" />
                <MiniStat label="In Progress" value={ticketStats?.inProgress || 0} color="#f59e0b" />
                <MiniStat label="Resolved" value={ticketStats?.resolved || 0} color="#16a34a" />
                <MiniStat label="Urgent" value={ticketStats?.urgent || 0} color="#7c3aed" />
              </div>
              <form onSubmit={handleCreateTicket}>
                <input value={ticketForm.email} onChange={(e) => setTicketForm({ ...ticketForm, email: e.target.value })} style={inputStyle} placeholder="requester email" required />
                <input value={ticketForm.subject} onChange={(e) => setTicketForm({ ...ticketForm, subject: e.target.value })} style={{ ...inputStyle, marginTop: 10 }} placeholder="subject" required />
                <textarea value={ticketForm.message} onChange={(e) => setTicketForm({ ...ticketForm, message: e.target.value })} style={{ ...inputStyle, marginTop: 10, minHeight: 80 }} placeholder="message" required />
                <select value={ticketForm.priority} onChange={(e) => setTicketForm({ ...ticketForm, priority: e.target.value })} style={{ ...inputStyle, marginTop: 10 }}>
                  <option value="LOW">LOW</option>
                  <option value="NORMAL">NORMAL</option>
                  <option value="HIGH">HIGH</option>
                  <option value="URGENT">URGENT</option>
                </select>
                <button type="submit" style={primaryBtn}>Create Ticket</button>
              </form>
            </div>
            <div style={panelStyle}>
              <h3 style={{ marginTop: 0 }}>Tickets</h3>
              {tickets.length === 0 ? (
                <div style={{ color: "#64748b", fontSize: 13 }}>No tickets found.</div>
              ) : (
                <div style={{ maxHeight: 420, overflowY: "auto" }}>
                  {tickets.slice(0, 40).map((t) => (
                    <div key={t.id} style={{ borderBottom: "1px solid #f1f5f9", padding: "10px 0" }}>
                      <div style={{ fontWeight: 700 }}>{t.subject}</div>
                      <div style={{ fontSize: 12, color: "#64748b", marginBottom: 8 }}>{t.email} · {t.status} · {t.priority}</div>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <button onClick={() => handleUpdateTicket(t.id, { status: "IN_PROGRESS" })} style={tinyBtn}>In Progress</button>
                        <button onClick={() => handleUpdateTicket(t.id, { status: "RESOLVED" })} style={successBtn}>Resolve</button>
                        <button onClick={() => handleUpdateTicket(t.id, { priority: "URGENT" })} style={dangerBtn}>Mark Urgent</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "audit" && (
          <div style={{ display: "grid", gridTemplateColumns: isMobile || isTablet ? "1fr" : "1fr 1.4fr", gap: 20 }}>
            <div style={panelStyle}>
              <h3 style={{ marginTop: 0 }}>Role Permission Matrix</h3>
              {Object.keys(roleMatrix || {}).length === 0 ? (
                <div style={{ color: "#64748b", fontSize: 13 }}>No role matrix data.</div>
              ) : (
                Object.entries(roleMatrix).map(([role, perms]) => (
                  <div key={role} style={{ marginBottom: 14 }}>
                    <div style={{ fontWeight: 800, marginBottom: 6 }}>{role}</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {(perms || []).map((perm) => (
                        <span key={perm} style={{ fontSize: 11, padding: "3px 7px", borderRadius: 999, background: "#e2e8f0", color: "#334155" }}>{perm}</span>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
            <div style={panelStyle}>
              <h3 style={{ marginTop: 0 }}>Admin Audit Trail</h3>
              {auditLogs.length === 0 ? (
                <div style={{ color: "#64748b", fontSize: 13 }}>No audit logs yet.</div>
              ) : (
                <div style={{ maxHeight: 430, overflowY: "auto" }}>
                  {auditLogs.map((log) => (
                    <div key={log.id} style={{ borderBottom: "1px solid #f1f5f9", padding: "10px 0" }}>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <strong>{log.action}</strong>
                        <span style={{ fontSize: 12, color: "#64748b" }}>{new Date(log.createdAt).toLocaleString()}</span>
                      </div>
                      <div style={{ fontSize: 12, color: "#64748b" }}>
                        {log.entityType} {log.entityId ? `· ${log.entityId}` : ""} · by {log.admin?.name || "Unknown"}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ title, value, color, onClick }) {
  const hasValue = value !== null && value !== undefined;
  const displayValue = hasValue ? value : "--";

  return (
    <div
      onClick={onClick}
      style={{
        background: "#fff",
        padding: "24px",
        borderRadius: 12,
        borderLeft: `4px solid ${color}`,
        boxShadow: "0 4px 6px rgba(0,0,0,0.03)",
        cursor: onClick ? "pointer" : "default",
        transition: "all 0.2s ease-in-out",
        position: "relative",
      }}
      onMouseEnter={(e) => {
        if (onClick) {
          e.currentTarget.style.transform = "translateY(-4px)";
          e.currentTarget.style.boxShadow = "0 12px 20px rgba(0,0,0,0.08)";
        }
      }}
      onMouseLeave={(e) => {
        if (onClick) {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = "0 4px 6px rgba(0,0,0,0.03)";
        }
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 1 }}>{title}</div>
        {onClick && <div style={{ color: color, fontSize: 18, fontWeight: "bold" }}>{"->"}</div>}
      </div>
      <div style={{ fontSize: 36, fontWeight: 900, color: hasValue ? "#0f172a" : "#64748b", margin: "10px 0 0" }}>{displayValue}</div>
    </div>
  );
}

function MiniStat({ label, value, color }) {
  return (
    <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: 10 }}>
      <div style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", fontWeight: 700 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 900, color }}>{value}</div>
    </div>
  );
}

const thStyle = { padding: "16px 20px", fontSize: 12, color: "#64748b", textTransform: "uppercase", letterSpacing: 1 };
const tdStyle = { padding: "16px 20px", fontSize: 14, color: "#334155" };
const labelStyle = { display: "block", fontSize: 11, fontWeight: 700, color: "#64748b", marginBottom: 5, textTransform: "uppercase" };
const inputStyle = { width: "100%", padding: "10px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13, boxSizing: "border-box" };
const panelStyle = { background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", padding: 20 };
const primaryBtn = { marginTop: 12, width: "100%", padding: "10px 12px", borderRadius: 8, border: "none", background: "#0f172a", color: "#fff", fontWeight: 700, cursor: "pointer" };
const tinyBtn = { padding: "5px 8px", borderRadius: 6, border: "1px solid #cbd5e1", background: "#fff", color: "#334155", cursor: "pointer", fontSize: 12, fontWeight: 700 };
const dangerBtn = { padding: "6px 10px", borderRadius: 6, border: "none", background: "#fee2e2", color: "#b91c1c", cursor: "pointer", fontSize: 12, fontWeight: 700 };
const successBtn = { padding: "6px 10px", borderRadius: 6, border: "none", background: "#dcfce7", color: "#166534", cursor: "pointer", fontSize: 12, fontWeight: 700 };
