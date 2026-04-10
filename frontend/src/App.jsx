// ============================================
// App — Root component with routing
// ============================================
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import Navbar from './components/Navbar';
import AIChatAssistant from './components/AIChatAssistant';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import Topics from './pages/Topics';
import TopicDetail from './pages/TopicDetail';
import NoFailMode from './pages/NoFailMode';
import TestSetup from './pages/TestSetup';
import TestPlay from './pages/TestPlay';
import TestResult from './pages/TestResult';
import Mistakes from './pages/Mistakes';
import Stats from './pages/Stats';
import Planner from './pages/Planner';
import Profile from './pages/Profile';
import Support from './pages/Support';
import AdminPanel from './pages/AdminPanel';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Cargando...</p>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function GuestRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/" replace />;
  return children;
}

function AdminRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user || user.role !== 'ADMIN') return <Navigate to="/" replace />;
  return children;
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <>
      {user && <Navbar />}
      {user && <AIChatAssistant />}
      <main className="page">
        <Routes>
          {/* Guest Routes */}
          <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
          <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />

          {/* Protected Routes */}
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/topics" element={<ProtectedRoute><Topics /></ProtectedRoute>} />
          <Route path="/topics/:id" element={<ProtectedRoute><TopicDetail /></ProtectedRoute>} />
          <Route path="/no-fail/:topicId" element={<ProtectedRoute><NoFailMode /></ProtectedRoute>} />
          <Route path="/tests" element={<ProtectedRoute><TestSetup /></ProtectedRoute>} />
          <Route path="/tests/:testId/play" element={<ProtectedRoute><TestPlay /></ProtectedRoute>} />
          <Route path="/tests/:testId/result" element={<ProtectedRoute><TestResult /></ProtectedRoute>} />
          <Route path="/mistakes" element={<ProtectedRoute><Mistakes /></ProtectedRoute>} />
          <Route path="/stats" element={<ProtectedRoute><Stats /></ProtectedRoute>} />
          <Route path="/planner" element={<ProtectedRoute><Planner /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/support" element={<ProtectedRoute><Support /></ProtectedRoute>} />

          {/* Admin Routes */}
          <Route path="/admin" element={<AdminRoute><AdminPanel /></AdminRoute>} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <ToastProvider>
          <AppRoutes />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
