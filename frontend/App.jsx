import React from 'react';
import { BrowserRouter, Navigate, NavLink, Route, Routes, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './src/context/AuthContext.jsx';
import DashboardPage from './src/pages/DashboardPage.jsx';
import LoginPage from './src/pages/LoginPage.jsx';
import RegisterPage from './src/pages/RegisterPage.jsx';
import ProjectsPage from './src/pages/ProjectsPage.jsx';
import QueuesPage from './src/pages/QueuesPage.jsx';
import JobsPage from './src/pages/JobsPage.jsx';
import WorkersPage from './src/pages/WorkersPage.jsx';
import DeadLetterPage from './src/pages/DeadLetterPage.jsx';
import LogsPage from './src/pages/LogsPage.jsx';
import SettingsPage from './src/pages/SettingsPage.jsx';

const navItems = [
  { to: '/', label: 'Dashboard' },
  { to: '/projects', label: 'Projects' },
  { to: '/queues', label: 'Queues' },
  { to: '/jobs', label: 'Jobs' },
  { to: '/workers', label: 'Workers' },
  { to: '/dead-letter', label: 'Dead Letter' },
  { to: '/logs', label: 'Logs' },
  { to: '/settings', label: 'Settings' }
];

function Shell({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const isAuthRoute = location.pathname === '/login' || location.pathname === '/register';

  if (isAuthRoute) {
    return children;
  }

  return (
    <div className="min-h-screen app-grid text-slate-100">
      <div className="mx-auto flex min-h-screen w-full max-w-[1600px] gap-6 p-4 lg:p-6">
        <aside className="panel hidden w-72 flex-col rounded-[28px] p-5 lg:flex">
          <div className="mb-8 rounded-2xl border border-cyan-400/20 bg-cyan-400/5 p-4">
            <div className="text-xs uppercase tracking-[0.35em] text-cyan-300/80">Distributed Job Scheduler</div>
            <div className="mt-3 text-2xl font-semibold text-white">Control Plane</div>
            <p className="mt-2 text-sm text-slate-300">Queue orchestration, worker health, and live execution telemetry.</p>
          </div>

          <nav className="flex flex-1 flex-col gap-2">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `rounded-2xl px-4 py-3 text-sm font-medium transition ${
                    isActive ? 'bg-cyan-400/15 text-cyan-200 shadow-glow' : 'text-slate-300 hover:bg-white/5 hover:text-white'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-xs uppercase tracking-[0.25em] text-slate-400">Signed in</div>
            <div className="mt-2 text-sm font-semibold text-white">{user?.fullName || 'Operator'}</div>
            <div className="text-xs text-slate-400">{user?.email || 'No email loaded'}</div>
            <button
              type="button"
              onClick={logout}
              className="mt-4 w-full rounded-xl bg-ember-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-ember-600"
            >
              Sign out
            </button>
          </div>
        </aside>

        <main className="flex-1 rounded-[32px] border border-white/10 bg-white/5 p-4 backdrop-blur-xl lg:p-6">
          <header className="mb-6 flex flex-col gap-4 rounded-[28px] border border-white/10 bg-gradient-to-r from-slate-950/80 via-slate-900/60 to-cyan-950/60 p-5 shadow-glow lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="text-xs uppercase tracking-[0.3em] text-cyan-300/80">Live operations</div>
              <h1 className="mt-2 text-2xl font-semibold text-white lg:text-3xl">Distributed Job Scheduler</h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-300">
                Monitor queues, inspect failures, and keep throughput visible across workers and projects.
              </p>
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              <div className="h-3 w-3 rounded-full bg-emerald-400 shadow-[0_0_18px_rgba(52,211,153,0.8)]" />
              <div>
                <div className="text-xs uppercase tracking-[0.24em] text-slate-400">Connection</div>
                <div className="text-sm font-medium text-white">Socket.IO live updates enabled</div>
              </div>
            </div>
          </header>

          {children}
        </main>
      </div>
    </div>
  );
}

function ProtectedRoute({ children }) {
  const { token, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen bg-ink-950 text-white">Loading...</div>;
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route
            path="/login"
            element={
              <Shell>
                <LoginPage />
              </Shell>
            }
          />
          <Route
            path="/register"
            element={
              <Shell>
                <RegisterPage />
              </Shell>
            }
          />
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <Shell>
                  <Routes>
                    <Route path="/" element={<DashboardPage />} />
                    <Route path="/projects" element={<ProjectsPage />} />
                    <Route path="/queues" element={<QueuesPage />} />
                    <Route path="/jobs" element={<JobsPage />} />
                    <Route path="/workers" element={<WorkersPage />} />
                    <Route path="/dead-letter" element={<DeadLetterPage />} />
                    <Route path="/logs" element={<LogsPage />} />
                    <Route path="/settings" element={<SettingsPage />} />
                  </Routes>
                </Shell>
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
