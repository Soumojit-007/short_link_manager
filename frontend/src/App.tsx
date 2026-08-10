import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import LinkDetail from './pages/LinkDetail';

function App() {
  return (
    <Router>
      <div className="min-h-screen flex flex-col items-center p-4">
        <header className="w-full max-w-5xl flex items-center justify-between py-6 mb-8 border-b border-slate-200">
          <h1 className="text-2xl font-bold tracking-tight text-primary m-0">Short Link Manager</h1>
        </header>
        <main className="w-full max-w-5xl flex-1">
          <Routes>
            <Route path="/" element={<Navigate to="/links" replace />} />
            <Route path="/links" element={<Dashboard />} />
            <Route path="/links/:id" element={<LinkDetail />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
