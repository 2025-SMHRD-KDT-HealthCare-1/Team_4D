import React, { useEffect, useState } from 'react';
import { logout } from './src/services/guardianApi';
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

const GUARDIAN_LOGIN_KEY = 'soin_guardian_logged_in';
const GUARDIAN_NAME_KEY = 'soin_guardian_name';
const PUBLIC_PATH_LOGIN = '/login';
const PUBLIC_PATH_SIGNUP = '/signup';
const PUBLIC_PATH_FIND_ID = '/find-id';
const PUBLIC_PATH_FIND_PASSWORD = '/find-password';

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
  const [authView, setAuthView] = useState<AuthView>('login');
  const [findMode, setFindMode] = useState<FindMode>('id');
  const [tab, setTab] = useState<GuardianTab>('home');
  const [guardianName, setGuardianName] = useState(() => window.localStorage.getItem(GUARDIAN_NAME_KEY) || '보호자');

  useEffect(() => {
    const loggedIn = window.localStorage.getItem(GUARDIAN_LOGIN_KEY) === 'true';
    setIsLoggedIn(loggedIn);

    if (!loggedIn) {
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
    } else if (isPublicPath(window.location.pathname)) {
      applyPath('/', true);
    }

    setIsAuthReady(true);
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

  const doLogout = () => {
    logout();
    window.localStorage.removeItem(GUARDIAN_LOGIN_KEY);
    window.localStorage.removeItem(GUARDIAN_NAME_KEY);
    setIsLoggedIn(false);
    setAuthView('login');
    setTab('home');
    applyPath(PUBLIC_PATH_LOGIN, true);
  };

  if (!isAuthReady) {
    return null;
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
        onLogin={(name, userId) => {
          setGuardianName(name);
          window.localStorage.setItem(GUARDIAN_LOGIN_KEY, 'true');
          window.localStorage.setItem(GUARDIAN_NAME_KEY, name);
          socket.emit('join', { userId });
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

  return (
    <Layout tab={tab} setTab={setTab} guardianName={guardianName}>
      {renderTab()}
    </Layout>
  );
}
