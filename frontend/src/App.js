import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import { store } from './store';
import ProtectedRoute from './components/common/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import BlogsPage from './pages/BlogsPage';
import BlogEditorPage from './pages/BlogEditorPage';
import ProjectsPage from './pages/ProjectsPage';

function App() {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#1e293b',
              color: '#f1f5f9',
              border: '1px solid #334155',
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '14px',
            },
            success: { iconTheme: { primary: '#f59e0b', secondary: '#0f172a' } },
          }}
        />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/blogs" element={<ProtectedRoute><BlogsPage /></ProtectedRoute>} />
          <Route path="/blogs/new" element={<ProtectedRoute><BlogEditorPage /></ProtectedRoute>} />
          <Route path="/blogs/:id/edit" element={<ProtectedRoute><BlogEditorPage /></ProtectedRoute>} />
          <Route path="/projects" element={<ProtectedRoute><ProjectsPage /></ProtectedRoute>} />
        </Routes>
      </BrowserRouter>
    </Provider>
  );
}

export default App;
