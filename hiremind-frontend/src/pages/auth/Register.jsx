import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiMail, FiLock, FiUser, FiEye, FiEyeOff, FiUserPlus } from 'react-icons/fi';
import { Building2, UserPlus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { ROLES } from '@/lib/constants';

export default function Register() {
  const navigate = useNavigate();
  const { register, loading, isAuthenticated, isCandidate, isRecruiter } = useAuth();
  const { success, error } = useToast();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'candidate',
    companyName: '',
    agreeToTerms: false,
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      const redirect = isRecruiter ? '/recruiter/dashboard' : '/candidate/dashboard';
      navigate(redirect, { replace: true });
    }
  }, [isAuthenticated, isCandidate, isRecruiter, navigate]);

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
    if (errors.role) {
      setErrors(prev => ({ ...prev, role: undefined }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Enter a valid email address';
    }
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    if (formData.role === 'recruiter' && !formData.companyName.trim()) {
      newErrors.companyName = 'Company name is required for recruiters';
    }
    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = 'You must agree to the Terms and Privacy Policy';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const name = `${formData.firstName} ${formData.lastName}`.trim();
      await register({
        name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        companyName: formData.role === 'recruiter' ? formData.companyName : undefined,
      });
      const redirect = formData.role === 'recruiter' ? '/recruiter/dashboard' : '/candidate/dashboard';
      success({
        title: 'Account created!',
        message: `Welcome to HireMind AI, ${formData.firstName}!`,
      });
      navigate(redirect, { replace: true });
    } catch (err) {
      error({
        title: 'Registration failed',
        message: err.message || 'Could not create account. Please try again.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const isLoading = loading || submitting;
  const isRecruiterRole = formData.role === 'recruiter';

  return (
    <div className="w-full max-w-md mx-auto">
      <Card className="shadow-xl border-0">
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-2xl font-bold text-surface-900 dark:text-surface-50">
            Create your account
          </CardTitle>
          <CardDescription>
            Join HireMind AI and supercharge your hiring journey
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="First name"
                name="firstName"
                type="text"
                value={formData.firstName}
                onChange={handleChange}
                placeholder="John"
                iconLeft={<FiUser className="w-4 h-4" />}
                error={errors.firstName}
                errorMessage={errors.firstName}
                autoComplete="given-name"
              />
              <Input
                label="Last name"
                name="lastName"
                type="text"
                value={formData.lastName}
                onChange={handleChange}
                placeholder="Doe"
                iconLeft={<FiUser className="w-4 h-4" />}
                error={errors.lastName}
                errorMessage={errors.lastName}
                autoComplete="family-name"
              />
            </div>
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
            {isRecruiterRole && (
              <Input
                label="Company name"
                name="companyName"
                type="text"
                value={formData.companyName}
                onChange={handleChange}
                placeholder="Acme Inc."
                iconLeft={<Building2 className="w-4 h-4" />}
                error={errors.companyName}
                errorMessage={errors.companyName}
              />
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Input
                  label="Password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Create password"
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
                  autoComplete="new-password"
                />
              </div>
              <div>
                <Input
                  label="Confirm password"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm password"
                  iconLeft={<FiLock className="w-4 h-4" />}
                  iconRight={
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(p => !p)}
                      className="text-surface-400 hover:text-surface-600 dark:hover:text-surface-200 transition-colors"
                      tabIndex={-1}
                      aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    >
                      {showConfirmPassword ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                    </button>
                  }
                  error={errors.confirmPassword}
                  errorMessage={errors.confirmPassword}
                  autoComplete="new-password"
                />
              </div>
            </div>
            <div className="flex items-start gap-2">
              <input
                id="agreeToTerms"
                name="agreeToTerms"
                type="checkbox"
                checked={formData.agreeToTerms}
                onChange={handleChange}
                className="mt-1 w-4 h-4 rounded border-surface-300 dark:border-surface-600 text-brand-600 focus:ring-brand-500 focus:ring-2 bg-white dark:bg-surface-900"
              />
              <label htmlFor="agreeToTerms" className="text-sm text-surface-600 dark:text-surface-400 cursor-pointer select-none">
                I agree to HireMind's{' '}
                <a href="#" className="font-medium text-brand-600 dark:text-brand-400 hover:underline">
                  Terms of Service
                </a>{' '}
                and{' '}
                <a href="#" className="font-medium text-brand-600 dark:text-brand-400 hover:underline">
                  Privacy Policy
                </a>
              </label>
            </div>
            {errors.agreeToTerms && (
              <p className="text-xs text-red-600 dark:text-red-400 -mt-2">
                {errors.agreeToTerms}
              </p>
            )}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              isLoading={isLoading}
              icon={<UserPlus className="w-4 h-4" />}
              iconPosition="left"
            >
              {isLoading ? 'Creating account...' : 'Create Account'}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-surface-600 dark:text-surface-400">
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 hover:underline"
            >
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
