import React from 'react';
import { Activity, Bell, Home, Settings, User } from 'lucide-react';
import soinImg from '../soin.png';
import { Button } from './ui/Button';

export type GuardianTab = 'home' | 'activity' | 'alerts' | 'settings';

interface LayoutProps {
  tab: GuardianTab;
  setTab: (tab: GuardianTab) => void;
  guardianName: string;
  children: React.ReactNode;
}

function MobileNavigation({ tab, setTab }: { tab: GuardianTab; setTab: (tab: GuardianTab) => void }) {
  const active = '#189877';
  const inactive = '#94a3b8'; // slate-400 비슷

  return (
    <nav className="bottom-nav-safe fixed bottom-0 left-0 right-0 z-20 border-t border-slate-200 bg-white px-4 py-2 shadow-md lg:hidden">
      <div className="flex justify-around">
        <Button variant="ghost" onClick={() => setTab('home')} className="relative flex h-12 w-12 items-center justify-center p-0">
          <Home className="h-8 w-8" style={{ color: tab === 'home' ? active : inactive }} />
          {tab === 'home' && <span className="absolute -bottom-1 h-[3px] w-6 rounded-full bg-[#189877]" />}
        </Button>

        <Button variant="ghost" onClick={() => setTab('activity')} className="relative flex h-12 w-12 items-center justify-center p-0">
          <Activity className="h-8 w-8" style={{ color: tab === 'activity' ? active : inactive }} />
          {tab === 'activity' && <span className="absolute -bottom-1 h-[3px] w-6 rounded-full bg-[#189877]" />}
        </Button>

        <Button variant="ghost" onClick={() => setTab('alerts')} className="relative flex h-12 w-12 items-center justify-center p-0">
          <Bell className="h-8 w-8" style={{ color: tab === 'alerts' ? active : inactive }} />
          {tab === 'alerts' && <span className="absolute -bottom-1 h-[3px] w-6 rounded-full bg-[#189877]" />}
        </Button>

        <Button variant="ghost" onClick={() => setTab('settings')} className="relative flex h-12 w-12 items-center justify-center p-0">
          <Settings className="h-8 w-8" style={{ color: tab === 'settings' ? active : inactive }} />
          {tab === 'settings' && <span className="absolute -bottom-1 h-[3px] w-6 rounded-full bg-[#189877]" />}
        </Button>
      </div>
    </nav>
  );
}

export function Layout({ tab, setTab, guardianName, children }: LayoutProps) {
  return (
    <div className="app-shell">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white px-4 py-3">
        <div className="mx-auto flex w-full max-w-4xl items-center justify-between">
          <img src={soinImg} alt="SOIN" className="h-8 w-auto" />
          <Button variant="ghost" className="text-slate-900 hover:text-slate-900" onClick={() => setTab('settings')}>
            <User className="h-4 w-4" />
            {guardianName}
          </Button>
        </div>
      </header>
      <main className="app-main mx-auto w-full max-w-4xl px-4 py-6">{children}</main>
      <MobileNavigation tab={tab} setTab={setTab} />
    </div>
  );
}
