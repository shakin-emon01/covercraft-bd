import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { loginUser } from '../api/auth';
import { useAuthStore } from '../store/authStore';
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import { googleAuth } from '../api/auth';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const { data } = await loginUser({ email, password });
      setAuth(data.user, data.token);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async (credentialResponse: any) => {
    try {
      const decoded: any = jwtDecode(credentialResponse.credential);
      const { data } = await googleAuth({ googleId: decoded.sub, email: decoded.email, name: decoded.name });
      setAuth(data.user, data.token);
      navigate('/dashboard');
    } catch {
      setError('Google login failed');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-center text-indigo-600 mb-2">CoverCraft BD</h1>
        <p className="text-center text-gray-500 mb-6 text-sm">Sign in to your account</p>

        {error && <p className="text-red-500 text-sm text-center mb-4">{error}</p>}

        <form onSubmit={handleLogin} className="space-y-4">
          <input type="email" placeholder="Email" value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" required />
          <input type="password" placeholder="Password" value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" required />
          <button type="submit" disabled={loading}
            className="w-full bg-indigo-600 text-white rounded-lg py-2.5 font-medium hover:bg-indigo-700 transition disabled:opacity-50">
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="my-4 flex items-center gap-2">
          <hr className="flex-1" /><span className="text-xs text-gray-400">OR</span><hr className="flex-1" />
        </div>

        <div className="flex justify-center">
          <GoogleLogin onSuccess={handleGoogle} onError={() => setError('Google login failed')} />
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          No account? <Link to="/register" className="text-indigo-600 font-medium hover:underline">Register</Link>
        </p>
      </div>
    </div>
  );
}
