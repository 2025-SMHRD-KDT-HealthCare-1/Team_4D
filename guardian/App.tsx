import React, { useState } from 'react';
import { logout } from './src/services/guardianApi';
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

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => window.localStorage.getItem(GUARDIAN_LOGIN_KEY) === 'true');
  const [authView, setAuthView] = useState<AuthView>('login');
  const [findMode, setFindMode] = useState<FindMode>('id');
  const [tab, setTab] = useState<GuardianTab>('home');
  const [guardianName, setGuardianName] = useState(() => window.localStorage.getItem(GUARDIAN_NAME_KEY) || '보호자');

  const doLogout = () => {
    logout();
    window.localStorage.removeItem(GUARDIAN_LOGIN_KEY);
    window.localStorage.removeItem(GUARDIAN_NAME_KEY);
    setIsLoggedIn(false);
    setAuthView('login');
    setTab('home');
  };

  if (!isLoggedIn) {
    if (authView === 'signup') return <Signup onBack={() => setAuthView('login')} />;
    if (authView === 'find') return <FindAccount initialMode={findMode} onBack={() => setAuthView('login')} />;
    return (
      <Login
        onLogin={(name) => {
          setGuardianName(name);
          window.localStorage.setItem(GUARDIAN_LOGIN_KEY, 'true');
          window.localStorage.setItem(GUARDIAN_NAME_KEY, name);
          setIsLoggedIn(true);
        }}
        onSignupClick={() => setAuthView('signup')}
        onFindClick={(mode) => {
          setFindMode(mode);
          setAuthView('find');
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
