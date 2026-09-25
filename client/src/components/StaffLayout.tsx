import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function StaffLayout() {
  const { staff, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/staff/login');
  }

  return (
    <div className="staff-layout">
      <nav className="staff-nav" aria-label="Staff navigation">
        <div>
          <Link to="/staff">Shipments</Link>
          <Link to="/staff/enquiries">Enquiries</Link>
        </div>
        <div className="staff-nav-right">
          <span>{staff?.email}</span>
          <button type="button" onClick={handleLogout}>
            Log out
          </button>
        </div>
      </nav>
      <div className="staff-content">
        <Outlet />
      </div>
    </div>
  );
}
