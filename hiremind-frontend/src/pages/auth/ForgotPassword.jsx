import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiMail, FiArrowLeft, FiCheckCircle, FiSend } from 'react-icons/fi';
import { useToast } from '@/contexts/ToastContext';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { forgotPassword } from '@/services/authService';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const { success, error, info } = useToast();

  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const validate = () => {
    const newErrors = {};
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Enter a valid email address';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      await forgotPassword(email);
      success({
        title: 'Reset link sent',
        message: `If an account exists for ${email}, you will receive password reset instructions shortly.`,
        duration: 6000,
      });
      setSent(true);
    } catch (err) {
      error({
        title: 'Request failed',
        message: err.message || 'Could not process your request. Please try again.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (sent) {
    return (
      <div className="w-full max-w-md mx-auto">
        <Card className="shadow-xl border-0">
          <CardContent className="pt-8 pb-6 text-center">
            <div className="mx-auto w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center mb-6">
              <FiCheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
            </div>
            <CardTitle className="text-xl font-bold text-surface-900 dark:text-surface-50 mb-2">
              Check your email
            </CardTitle>
            <CardDescription className="mb-6">
              We've sent password reset instructions to{' '}
              <span className="font-semibold text-surface-700 dark:text-surface-300 break-all">
                {email}
              </span>
              . The link will expire in 24 hours.
            </CardDescription>
            <div className="space-y-3">
              <Button
                variant="outline"
                size="md"
                fullWidth
                icon={<FiArrowLeft className="w-4 h-4" />}
                onClick={() => navigate('/login')}
              >
                Back to Sign In
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSent(false);
                  setEmail('');
                  info({ title: 'Reset form', message: 'You can try again with a different email.' });
                }}
              >
                Didn't receive the email? Try again
              </Button>
            </div>
            <div className="mt-6 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
              <p className="text-xs text-amber-800 dark:text-amber-300">
                <strong className="font-semibold">Tip:</strong> Check your spam or junk folder if you don't see the email in your inbox within a few minutes.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <Card className="shadow-xl border-0">
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-2xl font-bold text-surface-900 dark:text-surface-50">
            Reset password
          </CardTitle>
          <CardDescription>
            Enter your email and we'll send you a link to reset your password
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email address"
              name="email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors({});
              }}
              placeholder="you@example.com"
              iconLeft={<FiMail className="w-4 h-4" />}
              error={errors.email}
              errorMessage={errors.email}
              autoComplete="email"
            />
            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              isLoading={submitting}
              icon={<FiSend className="w-4 h-4" />}
              iconPosition="left"
            >
              {submitting ? 'Sending link...' : 'Send Reset Link'}
            </Button>
          </form>
          <Link
            to="/login"
            className="mt-6 flex items-center justify-center gap-2 text-sm font-medium text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 hover:underline"
          >
            <FiArrowLeft className="w-4 h-4" />
            Back to Sign In
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
