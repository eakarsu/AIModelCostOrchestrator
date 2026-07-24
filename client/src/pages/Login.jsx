import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, LogIn, Zap, Sparkles, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();
  const emailRef = useRef(null);
  const passwordRef = useRef(null);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();

    if (!email || !password) {
      toast.error('Please enter both email and password');
      return;
    }

    setIsLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = async () => {
    const demoEmail = import.meta.env.VITE_DEMO_EMAIL || '';
    const demoPassword = import.meta.env.VITE_DEMO_PASSWORD || '';

    setEmail(demoEmail);
    setPassword(demoPassword);

    setIsLoading(true);
    try {
      await login(demoEmail, demoPassword);
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.message || 'Demo login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* Animated background elements */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          overflow: 'hidden',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      >
        {/* Floating orb top-left */}
        <div
          style={{
            position: 'absolute',
            top: '10%',
            left: '15%',
            width: '400px',
            height: '400px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(99, 102, 241, 0.07) 0%, transparent 70%)',
            animation: 'floatOrb1 8s ease-in-out infinite',
          }}
        />
        {/* Floating orb bottom-right */}
        <div
          style={{
            position: 'absolute',
            bottom: '5%',
            right: '10%',
            width: '500px',
            height: '500px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(139, 92, 246, 0.06) 0%, transparent 70%)',
            animation: 'floatOrb2 10s ease-in-out infinite',
          }}
        />
        {/* Subtle grid pattern */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `
              linear-gradient(rgba(99, 102, 241, 0.03) 1px, transparent 1px),
              linear-gradient(90deg, rgba(99, 102, 241, 0.03) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px',
            maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 80%)',
            WebkitMaskImage: 'radial-gradient(ellipse at center, black 30%, transparent 80%)',
          }}
        />
        {/* Top gradient line */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            width: '600px',
            height: '1px',
            background: 'linear-gradient(90deg, transparent, rgba(99, 102, 241, 0.3), transparent)',
          }}
        />
      </div>

      {/* Keyframe animations */}
      <style>{`
        @keyframes floatOrb1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -20px) scale(1.05); }
          66% { transform: translate(-20px, 15px) scale(0.95); }
        }
        @keyframes floatOrb2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(-25px, 20px) scale(1.03); }
          66% { transform: translate(20px, -30px) scale(0.97); }
        }
        @keyframes pulseGlow {
          0%, 100% { box-shadow: 0 8px 24px rgba(99, 102, 241, 0.3); }
          50% { box-shadow: 0 8px 32px rgba(99, 102, 241, 0.5), 0 0 60px rgba(99, 102, 241, 0.15); }
        }
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .login-card-animated {
          animation: slideInUp 0.5s ease-out;
        }
        .login-header-animated {
          animation: slideInUp 0.4s ease-out;
        }
        .input-with-icon {
          position: relative;
        }
        .input-with-icon .input-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          width: 18px;
          height: 18px;
          color: var(--text-muted);
          pointer-events: none;
          transition: color 150ms ease;
        }
        .input-with-icon input:focus ~ .input-icon-swap,
        .input-with-icon input:focus + .input-icon {
          color: var(--accent-primary);
        }
        .input-with-icon input {
          padding-left: 44px;
        }
        .login-divider {
          display: flex;
          align-items: center;
          gap: 16px;
          margin: 24px 0;
          color: var(--text-muted);
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }
        .login-divider::before,
        .login-divider::after {
          content: '';
          flex: 1;
          height: 1px;
          background: var(--border-secondary);
        }
        .btn-demo {
          width: 100%;
          padding: 12px;
          font-size: 14px;
          font-weight: 500;
          font-family: inherit;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          border-radius: var(--radius-sm);
          background: rgba(139, 92, 246, 0.08);
          color: #c4b5fd;
          border: 1px solid rgba(139, 92, 246, 0.2);
          cursor: pointer;
          transition: all 150ms ease;
          position: relative;
          overflow: hidden;
        }
        .btn-demo:hover:not(:disabled) {
          background: rgba(139, 92, 246, 0.15);
          border-color: rgba(139, 92, 246, 0.4);
          color: #ddd6fe;
          transform: translateY(-1px);
          box-shadow: 0 4px 16px rgba(139, 92, 246, 0.2);
        }
        .btn-demo:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .btn-demo svg {
          width: 16px;
          height: 16px;
        }
      `}</style>

      <div className="login-container" style={{ position: 'relative', zIndex: 1 }}>
        {/* Header / Logo */}
        <div className="login-header login-header-animated">
          <div
            className="login-logo"
            style={{ animation: 'pulseGlow 3s ease-in-out infinite' }}
          >
            <Zap />
          </div>
          <h1>AI Cost Orchestrator</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
            Reduce AI infrastructure costs by 30-60%
          </p>
        </div>

        {/* Login Card */}
        <div
          className="login-card login-card-animated"
          style={{
            backdropFilter: 'blur(16px)',
            background: 'rgba(26, 29, 46, 0.85)',
          }}
        >
          <form className="login-form" onSubmit={handleSubmit}>
            {/* Email Field */}
            <div className="form-group">
              <label className="form-label" htmlFor="login-email">
                Email Address
              </label>
              <div className="input-with-icon">
                <input
                  id="login-email"
                  ref={emailRef}
                  type="email"
                  className="form-input"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  disabled={isLoading}
                />
                <Mail className="input-icon" />
              </div>
            </div>

            {/* Password Field */}
            <div className="form-group">
              <label className="form-label" htmlFor="login-password">
                Password
              </label>
              <div className="input-with-icon">
                <input
                  id="login-password"
                  ref={passwordRef}
                  type="password"
                  className="form-input"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  disabled={isLoading}
                />
                <Lock className="input-icon" />
              </div>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '15px',
                marginTop: '8px',
              }}
            >
              {isLoading ? (
                <>
                  <span className="spinner spinner-inline" />
                  Signing in...
                </>
              ) : (
                <>
                  <LogIn style={{ width: '18px', height: '18px' }} />
                  Login
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="login-divider">
            <span>or</span>
          </div>

          {/* Quick Login / Demo Access Button */}
          <button
            type="button"
            className="btn-demo"
            onClick={handleQuickLogin}
            disabled={isLoading}
          >
            <Sparkles />
            Quick Login &mdash; Demo Access
            <ArrowRight style={{ width: '14px', height: '14px', opacity: 0.6 }} />
          </button>
        </div>

        {/* Footer */}
        <div className="login-footer">
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
            Enterprise AI cost management platform
          </p>
          <p
            style={{
              fontSize: '12px',
              color: 'var(--text-muted)',
              opacity: 0.6,
              marginTop: '6px',
            }}
          >
            Powered by intelligent routing &amp; optimization
          </p>
        </div>
      </div>
    </div>
  );
}
