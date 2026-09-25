import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import './App.css';
import TrackingPage from './pages/TrackingPage';
import LoginPage from './pages/LoginPage';
import StaffLayout from './components/StaffLayout';
import StaffDashboard from './pages/StaffDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import ShipmentDetailPage from './pages/ShipmentDetailPage';
import EnquiriesPage from './pages/EnquiriesPage';
import { useFocusMainOnRouteChange } from './hooks/useFocusMainOnRouteChange';

// Main app shell for the public tracking flow and staff-only area.
export default function App() {
const location = useLocation();
const isStaffArea = location.pathname.startsWith('/staff');
const { staff } = useAuth();
  // Keep focus on the main content whenever the route changes for accessibility.
  useFocusMainOnRouteChange();

  return (
    <div className="app">
      {/* Accessibility shortcut for keyboard users. */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      <header className="app-header">
        <Link to="/" className="app-title">
          ShipTrack
        </Link>
        {!isStaffArea && (
          <Link to="/staff" className="staff-link">
            {staff ? 'Staff portal' : 'Staff login'}
          </Link>
        )}
      </header>

      <main id="main-content" tabIndex={-1}>
        <Routes>
          <Route path="/" element={<TrackingPage />} />
          <Route path="/staff/login" element={<LoginPage />} />

          <Route
            path="/staff"
            element={
              <ProtectedRoute>
                <StaffLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<StaffDashboard />} />
            <Route path="shipments/:id" element={<ShipmentDetailPage />} />
            <Route path="enquiries" element={<EnquiriesPage />} />
          </Route>
        </Routes>
      </main>
    </div>
  );
}
