// App router: public landing + auth pages, protected app routes under /app behind the Layout shell.
import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/auth';
import { ThemeProvider } from './lib/theme';
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

// Root: Landing page is accessible to both guests and signed-in users.
// Signed-in users remain fully authenticated with session intact.
function Root() {
  const { loading } = useAuth();
  if (loading) return <div className="grid min-h-screen place-items-center"><Spinner label="Booting…" /></div>;
  return <Landing />;
}

// Catch-all: If a short link (single-segment slug like /6X0utK) or server route (/bio/:slug, /qr/:code)
// is hit via client-side routing, force a real browser navigation so the backend processes the request.
function CatchAll() {
  const location = useLocation();
  const raw = location.pathname.replace(/^\/+/, '');
  const isShortCode = raw && !raw.includes('/');
  const isServerRoute = isShortCode || location.pathname.startsWith('/bio/') || location.pathname.startsWith('/qr/');

  useEffect(() => {
    if (isServerRoute) {
      window.location.href = location.pathname + location.search;
    }
  }, [isServerRoute, location]);

  if (isServerRoute) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#000000] text-zinc-400">
        <Spinner label="Redirecting…" />
      </div>
    );
  }

  return <Navigate to="/app" replace />;
}

export default function App() {
  return (
    <ThemeProvider>
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
    </ThemeProvider>
  );
}

