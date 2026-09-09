import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ThemeProvider } from './context/ThemeContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

// Import pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import HistoryPage from './pages/HistoryPage';
import NewAssessmentPage from './pages/NewAssessmentPage';
import ResultPage from './pages/ResultPage';
import LiveScreeningPage from './pages/LiveScreeningPage';

function AppShell() {
  const location = useLocation();
  const isImmersive = location.pathname.startsWith('/assessment/live');

  return (
    <div className={isImmersive ? 'page page--immersive' : 'page'}>
      {!isImmersive && <Navbar />}
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/history"
          element={
            <ProtectedRoute>
              <HistoryPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/assessment/new"
          element={
            <ProtectedRoute>
              <NewAssessmentPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/assessment/live"
          element={
            <ProtectedRoute>
              <LiveScreeningPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/assessment/:id/result"
          element={
            <ProtectedRoute>
              <ResultPage />
            </ProtectedRoute>
          }
        />

        {/* Default redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <Router>
            <AppShell />
          </Router>
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
