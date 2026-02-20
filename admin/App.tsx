import React, { useEffect, useState } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { Monitoring } from './components/Monitoring';
import { Statistics } from './components/Statistics';
import { adminLogin, adminLogout, getMe } from './src/services/adminApi';
import { socket } from './src/lib/socket';
import logoUrl from './soin.png';

export type View = 'dashboard' | 'events' | 'targets' | 'devices' | 'statistics' | 'settings';

type GlobalStatus = {
  isLoading: boolean;
  errorMessage: string;
};

type AdminUser = {
  user_id: string;
  login_id: string;
  role: 'ADMIN' | 'GUARDIAN';
  status: 'ACTIVE' | 'SUSPENDED' | 'WITHDRAWN';
  name: string;
  email: string;
};

const ADMIN_VIEW_STORAGE_KEY = 'soin_admin_current_view';

export default function App() {
  const [currentView, setCurrentView] = useState<View>(() => {
    const saved = window.localStorage.getItem(ADMIN_VIEW_STORAGE_KEY);
    if (saved === 'dashboard' || saved === 'events' || saved === 'targets' || saved === 'devices' || saved === 'statistics') {
      return saved;
    }
    return 'dashboard';
  });
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null);
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoginLoading, setIsLoginLoading] = useState(false);
  const [status, setStatus] = useState<GlobalStatus>({ isLoading: false, errorMessage: '' });

  useEffect(() => {
    void (async () => {
      try {
        const result = await getMe();
        const user = result.user ? (result.user as AdminUser) : null;
        if (user && user.status !== 'ACTIVE') {
          setCurrentUser(null);
          setErrorMessage(user.status === 'SUSPENDED' ? '?뺤???怨꾩젙?낅땲??' : '?덊눜??怨꾩젙?낅땲??');
        } else if (user && user.role !== 'ADMIN') {
          setCurrentUser(null);
          setErrorMessage('愿由ъ옄 怨꾩젙留??묎렐?????덉뒿?덈떎.');
        } else {
          setCurrentUser(user);
        }
      } catch {
        setCurrentUser(null);
      } finally {
        setIsAuthReady(true);
      }
    })();
  }, []);

  useEffect(() => {
    const onConnect = () => console.log('socket connected', socket.id);
    const onAlert = (payload: unknown) => {
      console.log('ALERT:', payload);
    };

    socket.on('connect', onConnect);
    socket.on('alert', onAlert);

    return () => {
      socket.off('connect', onConnect);
      socket.off('alert', onAlert);
    };
  }, []);

  useEffect(() => {
    setStatus((prev) => ({ ...prev, isLoading: true, errorMessage: '' }));
    const timeoutId = window.setTimeout(() => {
      setStatus({ isLoading: false, errorMessage: '' });
    }, 500);
    return () => window.clearTimeout(timeoutId);
  }, [currentView]);

  useEffect(() => {
    window.localStorage.setItem(ADMIN_VIEW_STORAGE_KEY, currentView);
  }, [currentView]);

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoginLoading(true);
    setErrorMessage('');

    try {
      const result = await adminLogin({ login_id: loginId.trim(), password });
      if (result.user.status !== 'ACTIVE') {
        setErrorMessage(result.user.status === 'SUSPENDED' ? '?뺤???怨꾩젙?낅땲??' : '?덊눜??怨꾩젙?낅땲??');
        return;
      }
      if (result.user.role !== 'ADMIN') {
        setErrorMessage('\uAD00\uB9AC\uC790 \uACC4\uC815\uB9CC \uC811\uADFC\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4.');
        return;
      }

      setCurrentUser(result.user as AdminUser);
      socket.emit('join', { userId: result.user.user_id });
      setCurrentView('dashboard');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '\uB85C\uADF8\uC778\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4.');
    } finally {
      setIsLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await adminLogout();
    } catch (error) {
      console.error(error);
    }

    setCurrentUser(null);
    setLoginId('');
    setPassword('');
    setErrorMessage('');
  };

  const handleRetry = () => {
    setStatus({ isLoading: true, errorMessage: '' });
    window.setTimeout(() => {
      setStatus({ isLoading: false, errorMessage: '' });
    }, 400);
  };

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard onViewChange={setCurrentView} />;
      case 'events':
        return <Monitoring tab="events" onTabChange={setCurrentView} />;
      case 'targets':
        return <Monitoring tab="targets" onTabChange={setCurrentView} />;
      case 'devices':
        return <Monitoring tab="devices" onTabChange={setCurrentView} />;
      case 'statistics':
        return <Statistics />;
      default:
        return <Dashboard onViewChange={setCurrentView} />;
    }
  };

  if (!isAuthReady) {
    return null;
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-white border border-gray-200 rounded-2xl shadow-sm p-8">
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mb-4">
              <img src={logoUrl} alt="SOIN logo" className="w-10 h-10 object-contain" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">SOIN \uAD00\uB9AC\uC790 \uB85C\uADF8\uC778</h1>
            <p className="text-sm text-gray-500 mt-2">\uAD00\uB9AC\uC790 \uAD8C\uD55C \uD655\uC778 \uD6C4 \uC811\uADFC\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4.</p>
          </div>

          <form className="space-y-4" onSubmit={handleLogin}>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">아이디</label>
              <input
                type="text"
                value={loginId}
                onChange={(event) => setLoginId(event.target.value)}
                placeholder=""
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">\uBE44\uBC00\uBC88\uD638</label>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder=""
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              />
            </div>
            {errorMessage && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{errorMessage}</div>
            )}
            <button
              type="submit"
              disabled={isLoginLoading}
              className="btn-primary-action h-12 w-full disabled:opacity-50 flex items-center justify-center gap-2 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2" >
              {isLoginLoading ? '\uB85C\uADF8\uC778 \uC911...' : '\uB85C\uADF8\uC778'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (currentUser.role !== 'ADMIN') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-white border border-gray-200 rounded-2xl shadow-sm p-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900">\uC811\uADFC \uAD8C\uD55C\uC774 \uC5C6\uC2B5\uB2C8\uB2E4</h1>
          <p className="text-sm text-gray-500 mt-2">\uAD00\uB9AC\uC790 \uAD8C\uD55C\uC744 \uD655\uC778\uD560 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.</p>
          <button
            type="button"
            onClick={() => void handleLogout()}
            className="mt-6 inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            \uB85C\uADF8\uC778 \uD654\uBA74\uC73C\uB85C \uB3CC\uC544\uAC00\uAE30
          </button>
        </div>
      </div>
    );
  }

  return (
    <Layout
      currentView={currentView}
      onViewChange={setCurrentView}
      onLogout={() => void handleLogout()}
      status={status}
      onRetry={handleRetry}
    >
      {renderView()}
    </Layout>
  );
}
