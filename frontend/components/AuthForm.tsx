import React, { useState } from 'react';
import { useUser } from '../context/UserContext';
import { useRouter } from 'next/router';

interface AuthFormProps {
  mode: 'login' | 'register';
}

const BACKEND_URL = process.env.INTERNAL_BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL;

const AuthForm: React.FC<AuthFormProps> = ({ mode }) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useUser();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const url = `${BACKEND_URL}/auth/${mode}`;
      const body = mode === 'register'
        ? { username, email, password }
        : { username, password };
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong');
      setSuccess(mode === 'login' ? 'Login successful!' : 'Registration successful!');
      if (mode === 'login' && data.token && data.user) {
        login({ ...data.user, token: data.token });
        // Handle next param and admin role
        const next = router.query.next as string;
        if (data.user.role === 'admin' && next === '/admin/review') {
          router.replace('/admin/review');
        } else if (data.user.role === 'admin') {
          router.replace('/admin/review');
        } else {
          router.replace(next || '/');
        }
      }
      if (mode === 'register') {
        // Auto-login after registration
        try {
          const loginRes = await fetch(`${BACKEND_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
          });
          const loginData = await loginRes.json();
          if (loginRes.ok && loginData.token && loginData.user) {
            login({ ...loginData.user, token: loginData.token });
            // Handle next param and admin role after registration
            const next = router.query.next as string;
            if (loginData.user.role === 'admin' && next === '/admin/review') {
              router.replace('/admin/review');
            } else if (loginData.user.role === 'admin') {
              router.replace('/admin/review');
            } else {
              router.replace(next || '/');
            }
          } else {
            setError('Registration succeeded, but auto-login failed. Please log in manually.');
          }
        } catch (e) {
          setError('Registration succeeded, but auto-login failed. Please log in manually.');
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        className="input input-bordered w-full"
        type="text"
        placeholder="Username"
        value={username}
        onChange={e => setUsername(e.target.value)}
        required
      />
      {mode === 'register' && (
        <input
          className="input input-bordered w-full"
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
      )}
      <input
        className="input input-bordered w-full"
        type="password"
        placeholder="Password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        required
      />
      {error && (
        <div
          className="bg-yellow-100 text-yellow-800 border-l-4 border-yellow-400 p-3 rounded transition-all duration-300 animate-fadeIn"
          role="alert"
          aria-live="assertive"
        >
          {error}
        </div>
      )}
      {success && (
        <div
          className="bg-green-100 text-green-800 border-l-4 border-green-400 p-3 rounded transition-all duration-300 animate-fadeIn"
          role="status"
          aria-live="polite"
        >
          {success}
        </div>
      )}
      <button
        className="bg-blue-600 text-white rounded-lg px-4 py-2 hover:bg-blue-700 w-full font-semibold"
        type="submit"
        disabled={loading}
      >
        {loading ? (mode === 'login' ? 'Logging in...' : 'Registering...') : (mode === 'login' ? 'Login' : 'Register')}
      </button>
    </form>
  );
};

export default AuthForm;
