import React, { useEffect, useState } from 'react';
import { useSecurityFeatures } from '../hooks/useSecurityFeatures';
import '../App.css';

export const SessionManagementPage: React.FC<{ token: string }> = ({ token }) => {
  const {
    loading,
    error,
    sessions,
    fetchActiveSessions,
    revokeSession,
    revokeAllOtherSessions,
  } = useSecurityFeatures(token);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const loadSessions = async () => {
      const result = await fetchActiveSessions();
      if (!isMounted || !result?.success) return;

      const firstSession = result.sessions?.[0]?.id ?? null;
      setCurrentSessionId(firstSession);
    };

    void loadSessions();

    return () => {
      isMounted = false;
    };
  }, [fetchActiveSessions]);

  const handleRevokeSession = async (sessionId: string) => {
    if (window.confirm('Are you sure you want to revoke this session?')) {
      await revokeSession(sessionId);
    }
  };

  const handleRevokeAllOthers = async () => {
    if (
      currentSessionId &&
      window.confirm(
        'This will sign out all other devices. Continue?'
      )
    ) {
      await revokeAllOtherSessions(currentSessionId);
    }
  };

  return (
    <div className="session-management-container">
      <h2>Active Sessions & Devices</h2>
      <p className="subtitle">
        Manage your active sessions and revoke access from devices you no longer use.
      </p>

      {error && <div className="error-message">{error}</div>}

      <div className="sessions-list">
        {loading ? (
          <p>Loading sessions...</p>
        ) : sessions.length === 0 ? (
          <p>No active sessions found.</p>
        ) : (
          <>
            {sessions.map((session) => (
              <div
                key={session.id}
                className="session-card"
                style={{
                  border: '1px solid #ddd',
                  padding: '16px',
                  borderRadius: '8px',
                  marginBottom: '12px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <h4 style={{ margin: '0 0 8px 0' }}>{session.deviceName}</h4>
                  <p style={{ margin: '4px 0', color: '#666', fontSize: '14px' }}>
                    📍 {session.ipAddress}
                  </p>
                  <p style={{ margin: '4px 0', color: '#666', fontSize: '14px' }}>
                    🕐 Last active: {new Date(session.lastActivity).toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={() => handleRevokeSession(session.id)}
                  className="btn-revoke"
                  style={{
                    backgroundColor: '#dc3545',
                    color: 'white',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                  }}
                >
                  Revoke
                </button>
              </div>
            ))}
          </>
        )}
      </div>

      {sessions.length > 1 && (
        <div className="actions" style={{ marginTop: '24px' }}>
          <button
            onClick={handleRevokeAllOthers}
            className="btn-revoke-all"
            style={{
              backgroundColor: '#fd7e14',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '16px',
            }}
          >
            Sign Out All Other Devices
          </button>
        </div>
      )}
    </div>
  );
};
