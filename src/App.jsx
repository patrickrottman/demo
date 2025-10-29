import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import Layout from './components/shared/Layout';
import ProtectedRoute from './components/shared/ProtectedRoute';
import SubmissionForm from './components/public/SubmissionForm';
import SuccessMessage from './components/public/SuccessMessage';
import Login from './components/auth/Login';
import Dashboard from './components/admin/Dashboard';
import ApplicationsList from './components/admin/ApplicationsList';
import ApplicationDetail from './components/admin/ApplicationDetail';
import { initializeMockData } from './utils/mockData';
import { useEffect } from 'react';

function App() {
  useEffect(() => {
    // Initialize mock data on first load
    initializeMockData();
  }, []);

  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Layout>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<SubmissionForm />} />
              <Route path="/success/:id" element={<SuccessMessage />} />
              <Route path="/login" element={<Login />} />

              {/* Protected Admin Routes */}
              <Route
                path="/admin/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/applications"
                element={
                  <ProtectedRoute>
                    <ApplicationsList />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/applications/:id"
                element={
                  <ProtectedRoute>
                    <ApplicationDetail />
                  </ProtectedRoute>
                }
              />

              {/* Redirect /admin to /admin/dashboard */}
              <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />

              {/* 404 - Redirect to home */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Layout>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
