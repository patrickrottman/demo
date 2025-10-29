// Mock authentication utilities
import { setAuthToken, removeAuthToken, setCurrentUser, getAuthToken } from './storage';

// Mock user credentials (for POC only)
const MOCK_ADMIN = {
  username: 'admin',
  password: 'admin',
  role: 'admin',
  email: 'admin@example.com',
};

export const login = async (username, password) => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));

  if (username === MOCK_ADMIN.username && password === MOCK_ADMIN.password) {
    const token = 'mock-jwt-token-' + Date.now();
    const user = {
      username: MOCK_ADMIN.username,
      email: MOCK_ADMIN.email,
      role: MOCK_ADMIN.role,
    };

    setAuthToken(token);
    setCurrentUser(user);

    return { success: true, user, token };
  }

  return { success: false, error: 'Invalid credentials' };
};

export const logout = () => {
  removeAuthToken();
  return { success: true };
};

export const isAuthenticated = () => {
  return !!getAuthToken();
};

export const checkAuth = () => {
  const token = getAuthToken();
  if (!token) {
    return null;
  }

  // In a real app, you'd validate the token
  // For now, just return true if token exists
  return token;
};
