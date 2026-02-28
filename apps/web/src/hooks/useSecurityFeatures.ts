import { useCallback, useState } from 'react';

interface Session {
  id: string;
  deviceName: string;
  ipAddress: string;
  createdAt: string;
  lastActivity: string;
}

const getErrorMessage = (error: unknown, fallback: string): string => {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
};

export const useSecurityFeatures = (token: string) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  // ==================== EMAIL VERIFICATION ====================

  const sendEmailVerification = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${apiUrl}/security/send-verification-code`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to send verification code');
      return { success: true, message: 'Verification code sent to your email' };
    } catch (err: unknown) {
      const message = getErrorMessage(err, 'An error occurred');
      setError(message);
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  };

  const verifyEmail = async (code: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${apiUrl}/security/verify-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ code }),
      });

      if (!response.ok) throw new Error('Verification failed');
      return { success: true, message: 'Email verified successfully' };
    } catch (err: unknown) {
      const message = getErrorMessage(err, 'An error occurred');
      setError(message);
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  };

  // ==================== PASSWORD RESET ====================

  const requestPasswordReset = async (email: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${apiUrl}/security/request-password-reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) throw new Error('Failed to send reset link');
      return { success: true, message: 'Password reset link sent to your email' };
    } catch (err: unknown) {
      const message = getErrorMessage(err, 'An error occurred');
      setError(message);
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (
    email: string,
    resetToken: string,
    newPassword: string,
    confirmPassword: string
  ) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${apiUrl}/security/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, resetToken, newPassword, confirmPassword }),
      });

      if (!response.ok) throw new Error('Password reset failed');
      return { success: true, message: 'Password reset successfully' };
    } catch (err: unknown) {
      const message = getErrorMessage(err, 'An error occurred');
      setError(message);
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  };

  // ==================== TOKEN MANAGEMENT ====================

  const refreshAccessToken = async (refreshToken: string) => {
    setLoading(true);
    try {
      const response = await fetch(`${apiUrl}/security/refresh-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) throw new Error('Token refresh failed');
      const data = await response.json();
      return { success: true, accessToken: data.accessToken, refreshToken: data.refreshToken };
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'An error occurred'));
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${apiUrl}/security/logout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Logout failed');
      return { success: true, message: 'Logged out successfully' };
    } catch (err: unknown) {
      const message = getErrorMessage(err, 'An error occurred');
      setError(message);
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  };

  // ==================== SESSION MANAGEMENT ====================

  const fetchActiveSessions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${apiUrl}/security/sessions`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to fetch sessions');
      const data = (await response.json()) as Session[];
      setSessions(data);
      return { success: true, sessions: data };
    } catch (err: unknown) {
      const message = getErrorMessage(err, 'An error occurred');
      setError(message);
      return { success: false, sessions: [] };
    } finally {
      setLoading(false);
    }
  }, [apiUrl, token]);

  const revokeSession = async (sessionId: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${apiUrl}/security/sessions/${sessionId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to revoke session');
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      return { success: true, message: 'Session revoked successfully' };
    } catch (err: unknown) {
      const message = getErrorMessage(err, 'An error occurred');
      setError(message);
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  };

  const revokeAllOtherSessions = async (currentSessionId: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${apiUrl}/security/sessions/revoke-others`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ sessionId: currentSessionId }),
      });

      if (!response.ok) throw new Error('Failed to revoke sessions');
      setSessions((prev) => prev.filter((s) => s.id === currentSessionId));
      return { success: true, message: 'All other sessions revoked' };
    } catch (err: unknown) {
      const message = getErrorMessage(err, 'An error occurred');
      setError(message);
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  };

  // ==================== SIGNED URLS ====================

  const generateSignedUrl = async (filePath: string, fileType: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${apiUrl}/security/generate-signed-url`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ filePath, fileType }),
      });

      if (!response.ok) throw new Error('Failed to generate signed URL');
      const data = await response.json();
      return { success: true, signedUrl: data.signedUrl };
    } catch (err: unknown) {
      const message = getErrorMessage(err, 'An error occurred');
      setError(message);
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    sessions,
    sendEmailVerification,
    verifyEmail,
    requestPasswordReset,
    resetPassword,
    refreshAccessToken,
    logout,
    fetchActiveSessions,
    revokeSession,
    revokeAllOtherSessions,
    generateSignedUrl,
  };
};
