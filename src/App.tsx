import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import React from 'react';
import { GameProvider, useGame } from './context/GameContext';
import Home from './pages/Home';
import Players from './pages/Players';
import CreateBattle from './pages/CreateBattle';
import TopRanking from './pages/TopRanking';
import Profile from './pages/Profile';
import AdminPanel from './pages/AdminPanel';
import Login from './pages/Login';
import TopNav from './components/TopNav';
import BottomNav from './components/BottomNav';
import { Toaster } from 'react-hot-toast';
import { Shield } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactElement;
  adminOnly?: boolean;
}

function ProtectedRoute({ children, adminOnly = false }: ProtectedRouteProps) {
  const { currentUser, isAuthLoading } = useGame();

  if (isAuthLoading) {
     return null; 
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && currentUser.email !== 'honeyaamir23@gmail.com') {
    return <Navigate to="/" replace />;
  }

  return children;
}

function Layout() {
  const { currentUser } = useGame();
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';
  const isAdmin = currentUser?.email === 'honeyaamir23@gmail.com';

  return (
    <div className="flex flex-col min-h-[100dvh] bg-[#0A0D14] text-white overflow-x-hidden font-sans">
      {!isLoginPage && <TopNav />}
      
      <main className={`flex-1 overflow-y-auto no-scrollbar ${!isLoginPage ? 'pb-24' : ''}`}>
        <Routes>
          <Route path="/login" element={
            currentUser ? <Navigate to="/" replace /> : <Login onLogin={() => {}} />
          } />
          <Route path="/" element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          } />
          <Route path="/players" element={
            <ProtectedRoute>
              <Players />
            </ProtectedRoute>
          } />
          <Route path="/battle/new" element={
            <ProtectedRoute>
              <CreateBattle />
            </ProtectedRoute>
          } />
          <Route path="/top" element={
            <ProtectedRoute>
              <TopRanking />
            </ProtectedRoute>
          } />
          <Route path="/me" element={
            <ProtectedRoute>
              <Profile isAdmin={isAdmin} />
            </ProtectedRoute>
          } />
          <Route path="/admin" element={
            <ProtectedRoute adminOnly>
              <AdminPanel />
            </ProtectedRoute>
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {!isLoginPage && <BottomNav />}
    </div>
  );
}

export default function App() {
  return (
    <GameProvider>
      <Router>
        <Layout />
        <Toaster 
          position="top-center"
          toastOptions={{
             style: {
                background: '#131823',
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.05)',
                borderRadius: '16px',
                fontSize: '14px',
                fontWeight: '600'
             }
          }}
        />
      </Router>
    </GameProvider>
  );
}
