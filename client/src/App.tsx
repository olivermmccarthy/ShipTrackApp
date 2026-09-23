import { Routes, Route, Link } from 'react-router-dom';
import TrackingPage from './pages/TrackingPage';

export default function App() {
  return (
    <div className="app">
      <header className="app-header">
        <Link to="/" className="app-title">
          ShipTrack
        </Link>
      </header>
      <main>
        <Routes>
          <Route path="/" element={<TrackingPage />} />
        </Routes>
      </main>
    </div>
  );
}
