import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './AuthContext';
import { SettingsProvider, useSettings } from './SettingsContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ShortcutDetail from './pages/ShortcutDetail';
import Share from './pages/Share';
import UserProfile from './pages/UserProfile';
import Admin from './pages/Admin';

const PAGE_TITLES: Record<string, string> = {
  '/': '首页',
  '/login': '登录',
  '/register': '注册',
  '/share': '发布',
  '/admin': '管理后台',
};

function SEOHead() {
  const { settings } = useSettings();
  const location = useLocation();

  useEffect(() => {
    const pageTitle = PAGE_TITLES[location.pathname] || '';
    const parts = [pageTitle, settings.seoTitle].filter(Boolean);
    document.title = parts.join(' - ') || settings.siteName;
    document.querySelector('meta[name="description"]')?.setAttribute('content', settings.seoDescription);
  }, [settings, location.pathname]);

  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SettingsProvider>
          <SEOHead />
          <div className="min-h-screen bg-gray-50 flex flex-col">
            <Navbar />
            <main className="flex-1">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/shortcut/:id" element={<ShortcutDetail />} />
                <Route path="/share" element={<Share />} />
                <Route path="/user/:id" element={<UserProfile />} />
                <Route path="/admin" element={<Admin />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </SettingsProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
