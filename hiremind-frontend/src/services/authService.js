import { MOCK_DELAY, RANDOM_FAILURE_RATE, STORAGE_KEYS } from '../lib/constants';
import { generateId, sleep } from '../lib/utils';

const avatarColors = [
  'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500',
  'bg-indigo-500', 'bg-orange-500', 'bg-teal-500', 'bg-red-500',
];

function randomFailure() {
  return Math.random() < RANDOM_FAILURE_RATE;
}

function createMockJwt(userId, role) {
  const payload = {
    sub: userId,
    role,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60),
  };
  return 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' +
    btoa(JSON.stringify(payload)).replace(/=/g, '') +
    '.mock-signature-token';
}

export async function login(credentials) {
  await sleep(MOCK_DELAY);
  if (randomFailure()) {
    throw new Error('Network error. Please try again.');
  }
  const { email, password, role } = credentials;
  const nameFromEmail = email?.split('@')[0]?.replace(/[._-]/g, ' ') || 'User';
  const formattedName = nameFromEmail
    .split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
  const user = {
    id: generateId(),
    name: formattedName,
    email: email || 'user@hiremind.ai',
    role: role || 'candidate',
    avatar: avatarColors[Math.floor(Math.random() * avatarColors.length)],
    phone: '+91 98' + Math.floor(Math.random() * 100000000).toString().padStart(8, '0'),
    createdAt: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString(),
    emailVerified: true,
  };
  const token = createMockJwt(user.id, user.role);
  return { user, token };
}

export async function register(data) {
  await sleep(MOCK_DELAY + 200);
  if (randomFailure()) {
    throw new Error('Failed to create account. Please try again.');
  }
  const { name, email, password, role, confirmPassword } = data;
  const user = {
    id: generateId(),
    name: name || 'New User',
    email: email || 'newuser@hiremind.ai',
    role: role || 'candidate',
    avatar: avatarColors[Math.floor(Math.random() * avatarColors.length)],
    phone: '+91 98' + Math.floor(Math.random() * 100000000).toString().padStart(8, '0'),
    createdAt: new Date().toISOString(),
    emailVerified: false,
  };
  const token = createMockJwt(user.id, user.role);
  return { user, token };
}

export async function forgotPassword(email) {
  await sleep(MOCK_DELAY);
  if (randomFailure()) {
    throw new Error('Failed to send reset link. Please try again.');
  }
  return {
    success: true,
    message: `If an account exists for ${email || 'your email'}, a password reset link has been sent.`,
  };
}

export async function resetPassword(token, newPassword) {
  await sleep(MOCK_DELAY);
  if (randomFailure()) {
    throw new Error('Failed to reset password. The link may have expired.');
  }
  return {
    success: true,
    message: 'Password has been reset successfully. You can now log in with your new password.',
  };
}

export async function verifyEmail(token) {
  await sleep(MOCK_DELAY);
  return {
    success: true,
    message: 'Email verified successfully.',
  };
}

export async function changePassword(currentPassword, newPassword) {
  await sleep(MOCK_DELAY);
  if (randomFailure()) {
    throw new Error('Current password is incorrect.');
  }
  return {
    success: true,
    message: 'Password changed successfully.',
  };
}
