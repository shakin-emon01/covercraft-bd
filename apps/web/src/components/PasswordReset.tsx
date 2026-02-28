import React, { useState } from 'react';
import { useSecurityFeatures } from '../hooks/useSecurityFeatures';

interface PasswordResetProps {
  token?: string;
  mode: 'request' | 'reset';
  resetToken?: string;
  email?: string;
}

export const PasswordResetComponent: React.FC<PasswordResetProps> = ({
  token,
  mode = 'request',
  resetToken: initialToken,
  email: initialEmail,
}) => {
  const { loading, error, requestPasswordReset, resetPassword } = useSecurityFeatures(token || '');
  const [email, setEmail] = useState(initialEmail || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [resetToken] = useState(initialToken || '');

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setMessage('Please enter your email');
      return;
    }

    const result = await requestPasswordReset(email);
    if (result.success) {
      setMessage('✅ Password reset link sent to your email');
      setEmail('');
    } else {
      setMessage(`❌ ${result.message}`);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newPassword || !confirmPassword) {
      setMessage('Please fill in all fields');
      return;
    }

    if (newPassword.length < 8) {
      setMessage('Password must be at least 8 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage('Passwords do not match');
      return;
    }

    const result = await resetPassword(email, resetToken, newPassword, confirmPassword);
    if (result.success) {
      setMessage('✅ Password reset successfully! Redirecting to login...');
      setTimeout(() => {
        // Redirect to login
        window.location.href = '/login';
      }, 2000);
    } else {
      setMessage(`❌ ${result.message}`);
    }
  };

  return (
    <div
      className="password-reset-card"
      style={{
        maxWidth: '500px',
        margin: '0 auto',
        padding: '24px',
        border: '1px solid #ddd',
        borderRadius: '8px',
      }}
    >
      <h2>🔐 Reset Your Password</h2>

      {error && <div className="error-message" style={{ color: '#dc3545', marginBottom: '12px' }}>{error}</div>}
      {message && (
        <div
          className="message"
          style={{
            marginBottom: '12px',
            padding: '12px',
            borderRadius: '4px',
            backgroundColor: message.includes('✅') ? '#d4edda' : '#fff3cd',
            color: message.includes('✅') ? '#155724' : '#856404',
          }}
        >
          {message}
        </div>
      )}

      {mode === 'request' ? (
        <form onSubmit={handleRequestReset}>
          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label htmlFor="email" style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                boxSizing: 'border-box',
              }}
              placeholder="your@email.com"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '10px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '16px',
            }}
          >
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleResetPassword}>
          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label htmlFor="email" style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                boxSizing: 'border-box',
                backgroundColor: '#f5f5f5',
              }}
            />
          </div>

          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label htmlFor="newPassword" style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
              New Password
            </label>
            <input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={8}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                boxSizing: 'border-box',
              }}
              placeholder="At least 8 characters"
            />
          </div>

          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label htmlFor="confirmPassword" style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                boxSizing: 'border-box',
              }}
              placeholder="Confirm your new password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '10px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '16px',
            }}
          >
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>
      )}
    </div>
  );
};
