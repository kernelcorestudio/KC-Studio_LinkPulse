// App router: public landing + auth pages, protected app routes under /app behind the Layout shell.
import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/auth';
import Layout from './components/Layout';
import Landing from './pages/Landing';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import Links from './pages/Links';
import LinkDetail from './pages/LinkDetail';
import CreateLink from './pages/CreateLink';
import Campaigns from './pages/Campaigns';
import Organize from './pages/Organize';
import Import from './pages/Import';
import Bio from './pages/Bio';
import Admin from './pages/Admin';
import { Spinner } from './components/ui';

function Protected({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="grid min-h-screen place-items-center"><Spinner label="Checking session…" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function RequireAdmin({ children }) {
  const { user } = useAuth();
  if (user?.role !== 'admin') return <Navigate to="/app" replace />;
  return children;
}

function PublicOnly({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/app" replace />;
  return children;
}

// Root: guests see the landing page, signed-in users go straight to the app.
function Root() {
  const { user, loading } = useAuth();
  if (loading) return <div className="grid min-h-screen place-items-center"><Spinner label="Booting…" /></div>;
  if (user) return <Navigate to="/app" replace />;
  return <Landing />;
}

// Catch-all: If a short link (single-segment slug like /6X0utK) is hit via client-side routing,
// force a real browser navigation so the redirect engine processes the 302 redirect.
function CatchAll() {
  const location = useLocation();
  const raw = location.pathname.replace(/^\/+/, '');
  const isShortCode = raw && !raw.includes('/');

  useEffect(() => {
    if (isShortCode) {
      window.location.href = location.pathname + location.search;
    }
  }, [isShortCode, location]);

  if (isShortCode) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#0B0B0E] text-zinc-400">
        <Spinner label="Redirecting…" />
      </div>
    );
  }

  return <Navigate to="/app" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route index element={<Root />} />
          <Route path="/login" element={<PublicOnly><AuthPage mode="login" /></PublicOnly>} />
          <Route path="/register" element={<PublicOnly><AuthPage mode="register" /></PublicOnly>} />
          <Route element={<Protected><Layout /></Protected>}>
            <Route path="/app" element={<Dashboard />} />
            <Route path="/dashboard" element={<Navigate to="/app" replace />} />
            <Route path="/links" element={<Links />} />
            <Route path="/links/:id" element={<LinkDetail />} />
            <Route path="/create" element={<CreateLink />} />
            <Route path="/campaigns" element={<Campaigns />} />
            <Route path="/tags" element={<Organize />} />
            <Route path="/folders" element={<Organize />} />
            <Route path="/import" element={<Import />} />
            <Route path="/bio" element={<Bio />} />
            <Route path="/admin" element={<RequireAdmin><Admin /></RequireAdmin>} />
            <Route path="/app/links" element={<Links />} />
            <Route path="/app/links/:id" element={<LinkDetail />} />
            <Route path="/app/create" element={<CreateLink />} />
            <Route path="/app/campaigns" element={<Campaigns />} />
            <Route path="/app/tags" element={<Organize />} />
            <Route path="/app/folders" element={<Organize />} />
            <Route path="/app/import" element={<Import />} />
            <Route path="/app/bio" element={<Bio />} />
            <Route path="/app/admin" element={<RequireAdmin><Admin /></RequireAdmin>} />
          </Route>
          <Route path="*" element={<CatchAll />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

