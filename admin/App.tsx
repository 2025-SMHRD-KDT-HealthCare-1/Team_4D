import React, { useEffect, useMemo, useState } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { Monitoring } from './components/Monitoring';
import { Statistics } from './components/Statistics';
import { adminLogin, adminLogout } from './src/services/adminApi';
import { socket } from './src/lib/socket';
import logoUrl from './soin.png';

export type View = 'dashboard' | 'events' | 'targets' | 'devices' | 'statistics' | 'settings';

type GlobalStatus = {
  isLoading: boolean;
  errorMessage: string;
};

const AUTH_STORAGE_KEY = 'soin_admin_authed';
const AUTH_ROLE_KEY = 'soin_admin_role';
const AUTH_TIME_KEY = 'soin_admin_login_time';
const AUTH_TTL_MS = 30 * 60 * 1000;

const isSessionValid = () => {
  const isAuthed = window.localStorage.getItem(AUTH_STORAGE_KEY) === 'true';
  const loginTime = Number(window.localStorage.getItem(AUTH_TIME_KEY) || 0);
  if (!isAuthed || !loginTime) {
    return false;
  }
  return Date.now() - loginTime < AUTH_TTL_MS;
};

export default function App() {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [isAuthenticated, setIsAuthenticated] = useState(() => isSessionValid());
  const [sessionExpired, setSessionExpired] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoginLoading, setIsLoginLoading] = useState(false);
  const [status, setStatus] = useState<GlobalStatus>({ isLoading: false, errorMessage: '' });

  const role = useMemo(() => window.localStorage.getItem(AUTH_ROLE_KEY) || '', [isAuthenticated]);

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
    const intervalId = window.setInterval(() => {
      if (isAuthenticated && !isSessionValid()) {
        setIsAuthenticated(false);
        setSessionExpired(true);
        adminLogout();
        window.localStorage.removeItem(AUTH_STORAGE_KEY);
        window.localStorage.removeItem(AUTH_ROLE_KEY);
        window.localStorage.removeItem(AUTH_TIME_KEY);
      }
    }, 10000);
    return () => window.clearInterval(intervalId);
  }, [isAuthenticated]);

  useEffect(() => {
    setStatus((prev) => ({ ...prev, isLoading: true, errorMessage: '' }));
    const timeoutId = window.setTimeout(() => {
      setStatus({ isLoading: false, errorMessage: '' });
    }, 500);
    return () => window.clearTimeout(timeoutId);
  }, [currentView]);

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoginLoading(true);
    setErrorMessage('');

    try {
      const result = await adminLogin({ userId: email.trim(), password });
      if (result.user.role !== 'ADMIN') {
        adminLogout();
        setErrorMessage('관리자 계정만 접근할 수 있습니다.');
        return;
      }

      setIsAuthenticated(true);
      setSessionExpired(false);
      window.localStorage.setItem(AUTH_STORAGE_KEY, 'true');
      window.localStorage.setItem(AUTH_ROLE_KEY, result.user.role);
      window.localStorage.setItem(AUTH_TIME_KEY, String(Date.now()));
      socket.emit('join', { userId: result.user.userId });
      setCurrentView('dashboard');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '로그인에 실패했습니다.');
    } finally {
      setIsLoginLoading(false);
    }
  };

  const handleLogout = () => {
    adminLogout();
    setIsAuthenticated(false);
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    window.localStorage.removeItem(AUTH_ROLE_KEY);
    window.localStorage.removeItem(AUTH_TIME_KEY);
    setEmail('');
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

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-white border border-gray-200 rounded-2xl shadow-sm p-8">
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mb-4">
              <img src={logoUrl} alt="SOIN logo" className="w-10 h-10 object-contain" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">SOIN 관리자 로그인</h1>
            <p className="text-sm text-gray-500 mt-2">관리자 권한 확인 후 접근할 수 있습니다.</p>
          </div>

          {sessionExpired && (
            <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
              세션이 만료되었습니다. 다시 로그인해 주세요.
            </div>
          )}

          <form className="space-y-4" onSubmit={handleLogin}>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="soin123@naver.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">비밀번호</label>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              />
            </div>
            {errorMessage && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                {errorMessage}
              </div>
            )}
            <button
              type="submit"
              disabled={isLoginLoading}
              className="w-full py-2.5 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors disabled:opacity-70"
            >
              {isLoginLoading ? '로그인 중...' : '로그인'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (role !== 'ADMIN') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-white border border-gray-200 rounded-2xl shadow-sm p-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900">접근 권한이 없습니다</h1>
          <p className="text-sm text-gray-500 mt-2">관리자 권한을 확인할 수 없습니다.</p>
          <button
            type="button"
            onClick={handleLogout}
            className="mt-6 inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            로그인 화면으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <Layout
      currentView={currentView}
      onViewChange={setCurrentView}
      onLogout={handleLogout}
      status={status}
      onRetry={handleRetry}
    >
      {renderView()}
    </Layout>
  );
}
