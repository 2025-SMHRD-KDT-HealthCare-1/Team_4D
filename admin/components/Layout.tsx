import React from 'react';
import { LayoutDashboard, AlertCircle, Users, Video, BarChart2 } from 'lucide-react';
import { View } from '../App';
import logoUrl from '../soin.png';

interface LayoutProps {
  children: React.ReactNode;
  currentView: View;
  onViewChange: (view: View) => void;
  onLogout: () => void;
  status: {
    isLoading: boolean;
    errorMessage: string;
  };
  onRetry: () => void;
}

export const Layout: React.FC<LayoutProps> = ({
  children,
  currentView,
  onViewChange,
  onLogout,
  status,
  onRetry,
}) => {
  // 설정 메뉴 intentionally removed
  const menuItems = [
    { id: 'dashboard', label: '대시보드', icon: LayoutDashboard },
    { id: 'events', label: '이벤트 모니터링', icon: AlertCircle },
    { id: 'targets', label: '대상자 관리', icon: Users },
    { id: 'devices', label: '장치 관리', icon: Video },
    { id: 'statistics', label: '통계 / 분석', icon: BarChart2 },
  ] as const;

  return (
    <div className="flex h-screen bg-gray-50 text-gray-900 font-sans">
      <aside className="w-64 bg-white border-r border-gray-200 flex-shrink-0 flex flex-col">
        <div className="p-6 border-b border-gray-100 flex items-center justify-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
              <img src={logoUrl} alt="SOIN logo" className="w-5 h-5 object-contain" />
            </div>
            <span className="text-xl font-bold text-gray-800 tracking-tight">SOIN</span>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-150 ${
                currentView === item.id
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <item.icon className={`w-5 h-5 ${currentView === item.id ? 'text-blue-600' : 'text-gray-400'}`} />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center gap-3 px-4 py-2">
            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
              SO
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-gray-700">관리자</span>
              <span className="text-xs text-gray-500">soin123@naver.com</span>
            </div>
          </div>
          <button
            type="button"
            onClick={onLogout}
            className="mt-3 w-full text-left text-sm font-semibold text-red-600 hover:text-red-700"
          >
            로그아웃
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <header className="bg-white border-b border-gray-200 px-8 py-4 sticky top-0 z-10">
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-bold text-gray-800">
              {menuItems.find((i) => i.id === currentView)?.label}
            </h1>
            {status.isLoading && (
              <div className="text-sm text-blue-600">데이터 로딩 중...</div>
            )}
            {status.errorMessage && (
              <div className="flex items-center justify-between rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">
                <span>{status.errorMessage}</span>
                <button
                  type="button"
                  onClick={onRetry}
                  className="text-xs font-semibold text-red-700 hover:underline"
                >
                  재시도
                </button>
              </div>
            )}
          </div>
        </header>
        <div className="p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};
