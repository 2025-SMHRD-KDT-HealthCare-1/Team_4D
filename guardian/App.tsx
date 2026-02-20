import React, { useEffect, useState } from 'react';
import { getMe, logout } from './src/services/guardianApi';
import { socket } from './src/lib/socket';
import { Layout, type GuardianTab } from './components/Layout';
import { Login } from './components/Login';
import { Signup } from './components/Signup';
import { FindAccount } from './components/FindAccount';
import { Home } from './components/Home';
import { Report } from './components/Report';
import { Notifications } from './components/Notifications';
import { Settings } from './components/Settings';

type AuthView = 'login' | 'signup' | 'find';
type FindMode = 'id' | 'pw';

const PUBLIC_PATH_LOGIN = '/login';
const PUBLIC_PATH_SIGNUP = '/signup';
const PUBLIC_PATH_FIND_ID = '/find-id';
const PUBLIC_PATH_FIND_PASSWORD = '/find-password';
const GUARDIAN_TAB_STORAGE_KEY = 'soin_guardian_current_tab';

const isPublicPath = (pathname: string) =>
  pathname === PUBLIC_PATH_LOGIN ||
  pathname === PUBLIC_PATH_SIGNUP ||
  pathname === PUBLIC_PATH_FIND_ID ||
  pathname === PUBLIC_PATH_FIND_PASSWORD;

const applyPath = (pathname: string, replace = false) => {
  const method = replace ? 'replaceState' : 'pushState';
  if (window.location.pathname !== pathname) {
    window.history[method](null, '', pathname);
  }
};

const getAuthStateFromPath = (pathname: string): { view: AuthView; mode: FindMode } => {
  if (pathname === PUBLIC_PATH_SIGNUP) return { view: 'signup', mode: 'id' };
  if (pathname === PUBLIC_PATH_FIND_ID) return { view: 'find', mode: 'id' };
  if (pathname === PUBLIC_PATH_FIND_PASSWORD) return { view: 'find', mode: 'pw' };
  return { view: 'login', mode: 'id' };
};

export default function App() {
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [blockedReason, setBlockedReason] = useState('');
  const [authView, setAuthView] = useState<AuthView>('login');
  const [findMode, setFindMode] = useState<FindMode>('id');
  const [tab, setTab] = useState<GuardianTab>(() => {
    const saved = window.localStorage.getItem(GUARDIAN_TAB_STORAGE_KEY);
    if (saved === 'home' || saved === 'activity' || saved === 'alerts' || saved === 'settings') {
      return saved;
    }
    return 'home';
  });
  const [guardianName, setGuardianName] = useState('\uBCF4\uD638\uC790');

  useEffect(() => {
    void (async () => {
      try {
        const me = await getMe();
        if (me.user) {
          if (me.user.role !== 'GUARDIAN') {
            setBlockedReason('보호자 계정만 guardian 화면에 접근할 수 있습니다.');
            setIsLoggedIn(false);
            setIsAuthReady(true);
            return;
          }
          if (me.user.status !== 'ACTIVE') {
            setBlockedReason(me.user.status === 'SUSPENDED' ? '정지된 계정입니다.' : '탈퇴한 계정입니다.');
            setIsLoggedIn(false);
            setIsAuthReady(true);
            return;
          }
          setIsLoggedIn(true);
          setGuardianName(me.user.name || '\uBCF4\uD638\uC790');
          setBlockedReason('');
          if (isPublicPath(window.location.pathname)) {
            applyPath('/', true);
          }
        } else {
          setIsLoggedIn(false);
          const pathname = window.location.pathname;
          if (!isPublicPath(pathname)) {
            applyPath(PUBLIC_PATH_LOGIN, true);
            setAuthView('login');
            setFindMode('id');
          } else {
            const parsed = getAuthStateFromPath(pathname);
            setAuthView(parsed.view);
            setFindMode(parsed.mode);
          }
        }
      } catch {
        setIsLoggedIn(false);
      } finally {
        setIsAuthReady(true);
      }
    })();
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      if (isLoggedIn) {
        return;
      }
      const pathname = window.location.pathname;
      if (!isPublicPath(pathname)) {
        applyPath(PUBLIC_PATH_LOGIN, true);
        setAuthView('login');
        setFindMode('id');
        return;
      }
      const parsed = getAuthStateFromPath(pathname);
      setAuthView(parsed.view);
      setFindMode(parsed.mode);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isLoggedIn]);

  useEffect(() => {
    window.localStorage.setItem(GUARDIAN_TAB_STORAGE_KEY, tab);
  }, [tab]);

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

  const doLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error(error);
    }

    setIsLoggedIn(false);
    setAuthView('login');
    setBlockedReason('');
    setTab('home');
    applyPath(PUBLIC_PATH_LOGIN, true);
  };

  if (!isAuthReady) {
    return null;
  }

  if (!isLoggedIn && blockedReason) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
        <div className="w-full max-w-md rounded-xl border border-red-200 bg-white p-6 text-center">
          <p className="text-sm text-red-700">{blockedReason}</p>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    if (authView === 'signup') {
      return (
        <Signup
          onBack={() => {
            setAuthView('login');
            applyPath(PUBLIC_PATH_LOGIN);
          }}
        />
      );
    }
    if (authView === 'find') {
      return (
        <FindAccount
          initialMode={findMode}
          onBack={() => {
            setAuthView('login');
            setFindMode('id');
            applyPath(PUBLIC_PATH_LOGIN);
          }}
        />
      );
    }
    return (
      <Login
        onLogin={(user) => {
          if (user.role !== 'GUARDIAN') {
            setBlockedReason('보호자 계정만 guardian 화면에 접근할 수 있습니다.');
            setIsLoggedIn(false);
            return;
          }
          if (user.status !== 'ACTIVE') {
            setBlockedReason(user.status === 'SUSPENDED' ? '정지된 계정입니다.' : '탈퇴한 계정입니다.');
            setIsLoggedIn(false);
            return;
          }
          setBlockedReason('');
          setGuardianName(user.name);
          socket.emit('join', { userId: user.user_id });
          setIsLoggedIn(true);
          applyPath('/', true);
        }}
        onSignupClick={() => {
          setAuthView('signup');
          applyPath(PUBLIC_PATH_SIGNUP);
        }}
        onFindClick={(mode) => {
          setFindMode(mode);
          setAuthView('find');
          applyPath(mode === 'id' ? PUBLIC_PATH_FIND_ID : PUBLIC_PATH_FIND_PASSWORD);
        }}
      />
    );
  }

  const renderTab = () => {
    switch (tab) {
      case 'home':
        return <Home goAlerts={() => setTab('alerts')} />;
      case 'activity':
        return <Report />;
      case 'alerts':
        return <Notifications />;
      case 'settings':
        return <Settings onLogout={doLogout} onOpenReport={() => setTab('activity')} />;
      default:
        return <Home goAlerts={() => setTab('alerts')} />;
    }
  };

  return <Layout tab={tab} setTab={setTab} guardianName={guardianName}>{renderTab()}</Layout>;
}
