import React, { useState } from 'react';
import { useSecurityFeatures } from '../hooks/useSecurityFeatures';

export const EmailVerificationComponent: React.FC<{ token: string; onSuccess?: () => void }> = ({
  token,
  onSuccess,
}) => {
  const { loading, error, sendEmailVerification, verifyEmail } = useSecurityFeatures(token);
  const [step, setStep] = useState<'idle' | 'code-sent' | 'verifying'>('idle');
  const [code, setCode] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  const handleSendCode = async () => {
    const result = await sendEmailVerification();
    if (result.success) {
      setStep('code-sent');
      setMessage('Verification code sent to your email');
    } else {
      setMessage(`Error: ${result.message}`);
    }
  };

  const handleVerifyCode = async () => {
    if (!code.trim()) {
      setMessage('Please enter the verification code');
      return;
    }

    setStep('verifying');
    const result = await verifyEmail(code);
    if (result.success) {
      setMessage('✅ Email verified successfully!');
      setStep('idle');
      setCode('');
      onSuccess?.();
    } else {
      setMessage(`❌ ${result.message}`);
      setStep('code-sent');
    }
  };

  return (
    <div
      className="email-verification-card"
      style={{
        border: '1px solid #ddd',
        padding: '24px',
        borderRadius: '8px',
        maxWidth: '400px',
      }}
    >
      <h3>📧 Email Verification</h3>

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

      {step === 'idle' && (
        <button
          onClick={handleSendCode}
          disabled={loading}
          style={{
            width: '100%',
            padding: '10px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          {loading ? 'Sending...' : 'Send Verification Code'}
        </button>
      )}

      {step === 'code-sent' && (
        <div>
          <input
            type="text"
            placeholder="Enter 6-digit code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            maxLength={6}
            style={{
              width: '100%',
              padding: '10px',
              marginBottom: '12px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              boxSizing: 'border-box',
              fontSize: '18px',
              textAlign: 'center',
              letterSpacing: '2px',
            }}
          />
          <button
            onClick={handleVerifyCode}
            disabled={loading || code.length !== 6}
            style={{
              width: '100%',
              padding: '10px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            {loading ? 'Verifying...' : 'Verify Code'}
          </button>
          <button
            onClick={() => {
              setStep('idle');
              setCode('');
              setMessage(null);
            }}
            style={{
              width: '100%',
              padding: '10px',
              marginTop: '8px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
          }}
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
};
