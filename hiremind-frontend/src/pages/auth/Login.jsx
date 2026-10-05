import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FiMail, FiLock, FiLogIn, FiEye, FiEyeOff } from 'react-icons/fi';
import { FcGoogle } from 'react-icons/fc';
import { FaLinkedinIn } from 'react-icons/fa6';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { ROLES } from '@/lib/constants';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loading, isAuthenticated, isCandidate, isRecruiter } = useAuth();
  const { addToast, success, error } = useToast();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'candidate',
    remember: false,
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const from = location.state?.from?.pathname || null;

  useEffect(() => {
    if (isAuthenticated) {
      const redirect = from || (isRecruiter ? '/recruiter/dashboard' : '/candidate/dashboard');
      navigate(redirect, { replace: true });
    }
  }, [isAuthenticated, isCandidate, isRecruiter, navigate, from]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target || {};
    if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSelectChange = (value) => {
    setFormData(prev => ({ ...prev, role: value }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Enter a valid email address';
    }
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      await login({
        email: formData.email,
        password: formData.password,
        role: formData.role,
        remember: formData.remember,
      });
      const redirect = from || (formData.role === 'recruiter' ? '/recruiter/dashboard' : '/candidate/dashboard');
      success({
        title: 'Welcome back!',
        message: 'You have logged in successfully.',
      });
      navigate(redirect, { replace: true });
    } catch (err) {
      error({
        title: 'Login failed',
        message: err.message || 'Invalid credentials. Please try again.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const isLoading = loading || submitting;

  return (
    <div className="w-full max-w-md mx-auto">
      <Card className="shadow-xl border-0">
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-2xl font-bold text-surface-900 dark:text-surface-50">
            Welcome back
          </CardTitle>
          <CardDescription>
            Sign in to continue to your HireMind AI account
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Select
              label="I am a"
              value={formData.role}
              onChange={handleSelectChange}
              options={ROLES}
              placeholder="Select your role"
            />
            <Input
              label="Email address"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="you@example.com"
              iconLeft={<FiMail className="w-4 h-4" />}
              error={errors.email}
              errorMessage={errors.email}
              autoComplete="email"
            />
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-medium text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <Input
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                iconLeft={<FiLock className="w-4 h-4" />}
                iconRight={
                  <button
                    type="button"
                    onClick={() => setShowPassword(p => !p)}
                    className="text-surface-400 hover:text-surface-600 dark:hover:text-surface-200 transition-colors"
                    tabIndex={-1}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                  </button>
                }
                error={errors.password}
                errorMessage={errors.password}
                autoComplete="current-password"
              />
            </div>
            <div className="flex items-center">
              <input
                id="remember"
                name="remember"
                type="checkbox"
                checked={formData.remember}
                onChange={handleChange}
                className="w-4 h-4 rounded border-surface-300 dark:border-surface-600 text-brand-600 focus:ring-brand-500 focus:ring-2 bg-white dark:bg-surface-900"
              />
              <label htmlFor="remember" className="ml-2 text-sm text-surface-600 dark:text-surface-400 select-none cursor-pointer">
                Remember me for 30 days
              </label>
            </div>
            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              isLoading={isLoading}
              icon={<FiLogIn className="w-4 h-4" />}
              iconPosition="left"
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-surface-200 dark:border-surface-700" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-3 bg-white dark:bg-surface-900 text-surface-500 dark:text-surface-400 font-medium">
                Or continue with
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button
              type="button"
              variant="outline"
              size="md"
              disabled
              icon={<FcGoogle className="w-5 h-5" />}
            >
              Google
            </Button>
            <Button
              type="button"
              variant="outline"
              size="md"
              disabled
              icon={<FaLinkedinIn className="w-4 h-4 text-blue-600" />}
            >
              LinkedIn
            </Button>
          </div>

          <p className="mt-6 text-center text-sm text-surface-600 dark:text-surface-400">
            Don't have an account?{' '}
            <Link
              to="/register"
              className="font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 hover:underline"
            >
              Create one
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
