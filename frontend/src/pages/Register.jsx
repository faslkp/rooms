import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState(null);

  const onSubmit = async (e) => {
    e.preventDefault();
    setErrors(null);

    if (password !== confirmPassword) {
      setErrors({ confirm_password: ['Passwords do not match.'] });
      return;
    }

    setSubmitting(true);
    try {
      await register({ name, email, password, confirmPassword });
      navigate('/login');
    } catch (err) {
      const data = err?.response?.data;
      setErrors(data || { detail: 'Registration failed' });
    } finally {
      setSubmitting(false);
    }
  };

  const fieldError = (key) => {
    if (!errors) return null;
    return errors[key]?.[0] || null;
  };

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Register</h1>

      {errors?.detail && (
        <div className="mb-4 rounded bg-red-50 text-red-700 px-3 py-2 text-sm border border-red-200">
          {errors.detail}
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full rounded border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Your name"
          />
          {fieldError('name') && <p className="text-xs text-red-600 mt-1">{fieldError('name')}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="you@example.com"
          />
          {fieldError('email') && <p className="text-xs text-red-600 mt-1">{fieldError('email')}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full rounded border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="••••••••"
          />
          {fieldError('password') && <p className="text-xs text-red-600 mt-1">{fieldError('password')}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Confirm password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className="w-full rounded border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="••••••••"
          />
          {fieldError('confirm_password') && <p className="text-xs text-red-600 mt-1">{fieldError('confirm_password')}</p>}
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded bg-indigo-600 text-white py-2 font-medium hover:bg-indigo-700 disabled:opacity-50"
        >
          {submitting ? 'Creating account...' : 'Create account'}
        </button>
      </form>

      <p className="text-sm text-gray-600 mt-4">
        Already have an account?{' '}
        <Link to="/login" className="text-indigo-600 hover:underline">Login</Link>
      </p>
    </div>
  );
}

