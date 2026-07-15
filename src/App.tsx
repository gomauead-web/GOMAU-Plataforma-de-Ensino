import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { auth } from './lib/firebase';
import { Layout } from './components/Layout';
import { WelcomePopup } from './components/WelcomePopup';
import { PWAInstallPrompt } from './components/PWAInstallPrompt';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { ContentPage } from './pages/ContentPage';
import { RequestsPage } from './pages/RequestsPage';
import { ProfilePage } from './pages/ProfilePage';
import { GestorDashboard } from './pages/gestor/GestorDashboard';
import { CursosExternos } from './pages/CursosExternos';
import { WorkshopPresentation } from './pages/WorkshopPresentation';
import { CursoDetail } from './pages/CursoDetail';
import { LibraryPage } from './pages/LibraryPage';

import { CalendarPage } from './pages/CalendarPage';

import { HistoryPage } from './pages/HistoryPage';
import { TreasuryPage } from './pages/TreasuryPage';
import { CadeiaUniaoPage } from './pages/CadeiaUniaoPage';
import { Forum } from './pages/Forum';
import { MASTER_ADMINS } from './constants';
import { NotificationManager } from './components/NotificationManager';

function ProtectedRoute({ children, requireGestor = false }: { children: React.ReactNode, requireGestor?: boolean }) {


  const { user, loading } = useAuth();
  
  if (loading) return <div className="h-screen w-screen flex items-center justify-center bg-[#0B0B0C] text-[#D4AF37]">Carregando...</div>;
  if (!user) return <Navigate to="/login" replace />;

  if (user.status?.toLowerCase() === 'adormecido') {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#0B0B0C] text-center p-6">
        <h1 className="text-[#D4AF37] text-3xl font-bold uppercase tracking-widest mb-4">Acesso Bloqueado</h1>
        <p className="text-gray-400 max-w-md text-sm leading-relaxed mb-8">
          Seu status na Ordem encontra-se em <strong className="text-white">Adormecido</strong>. 
          <br/><br/>
          O seu acesso aos conteúdos e ferramentas da plataforma foi temporariamente suspenso por tempo indeterminado. Entre em contato com a gestão da Loja para mais detalhes ou para regularizar sua situação.
        </p>
        <button 
          onClick={() => {
            auth.signOut().then(() => {
              sessionStorage.clear();
              window.location.href = '/login';
            });
          }}
          className="bg-transparent border border-[#D4AF37]/50 text-[#D4AF37] hover:bg-[#D4AF37]/10 px-6 py-2 rounded-lg font-bold transition-all text-xs uppercase"
        >
          Sair da Conta
        </button>
      </div>
    );
  }
  
  // Ritual Security Check
  const ritualDone = sessionStorage.getItem('ritual_completed') === 'true';
  const isMaster = MASTER_ADMINS.includes(user.email || '');
  
  // If ritual not done, redirect to login unless it's a bypass
  if (!ritualDone) {
    // Bypass total para os administradores mestres
    if (isMaster) {
      return children;
    }
    return <Navigate to="/login" replace />;
  }

  const userEmail = (user.email || auth.currentUser?.email || '').toLowerCase().trim();
  const hasRestrictedAccess = (user.cim === '3330' || user.cim === '331' || ['diogo.mourapedroso@gmail.com', 'tazmaniacrvg@gmail.com'].includes(userEmail) || (user.delegatedPastas && user.delegatedPastas.length > 0)) && userEmail !== 'tazmaniacrvg@gmail.com';
  if (requireGestor && user.role !== 'gestor' && !isMaster && !hasRestrictedAccess) return <Navigate to="/" replace />;
  
  return children;
}

import { Toaster } from 'react-hot-toast';
import { SecurityWrapper } from './components/SecurityWrapper';

export default function App() {
  return (
    <AuthProvider>
      <SecurityWrapper>
        <Toaster position="top-right" toastOptions={{
          style: {
            background: '#1e293b',
            color: '#fff',
            border: '1px solid #D4AF3733',
          }
        }} />
        <NotificationManager />
        <WelcomePopup />
        <PWAInstallPrompt />
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            
            <Route path="/" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
            <Route path="/library" element={<ProtectedRoute><LibraryPage /></ProtectedRoute>} />
            <Route path="/contents" element={<ProtectedRoute><Layout><ContentPage /></Layout></ProtectedRoute>} />
            <Route path="/cursos" element={<ProtectedRoute><Layout><CursosExternos /></Layout></ProtectedRoute>} />
            <Route path="/workshop" element={<ProtectedRoute><WorkshopPresentation /></ProtectedRoute>} />
            <Route path="/cursos/:courseId" element={<ProtectedRoute><Layout><CursoDetail /></Layout></ProtectedRoute>} />
            <Route path="/forum" element={<ProtectedRoute><Layout><Forum /></Layout></ProtectedRoute>} />
            <Route path="/requests" element={<ProtectedRoute><Layout><RequestsPage /></Layout></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Layout><ProfilePage /></Layout></ProtectedRoute>} />
            <Route path="/calendar" element={<ProtectedRoute><Layout><CalendarPage /></Layout></ProtectedRoute>} />
            <Route path="/mensalidade" element={<ProtectedRoute><Layout><TreasuryPage /></Layout></ProtectedRoute>} />
            <Route path="/cadeia-uniao" element={<ProtectedRoute><Layout><CadeiaUniaoPage /></Layout></ProtectedRoute>} />
            <Route path="/history" element={<ProtectedRoute><Layout><HistoryPage /></Layout></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><Layout><div className="p-8 text-gray-200"><h1 className="text-3xl text-[#D4AF37] mb-4">Configurações</h1><p>Em breve.</p></div></Layout></ProtectedRoute>} />
            <Route path="/help" element={<ProtectedRoute><Layout><div className="p-8 text-gray-200"><h1 className="text-3xl text-[#D4AF37] mb-4">Ajuda</h1><p>Em breve.</p></div></Layout></ProtectedRoute>} />
            
            <Route path="/gestor/*" element={<ProtectedRoute requireGestor={true}><Layout><GestorDashboard /></Layout></ProtectedRoute>} />
            
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </SecurityWrapper>
    </AuthProvider>
  );
}
