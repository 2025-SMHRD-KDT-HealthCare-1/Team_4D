import React, { useEffect, useMemo, useState } from 'react';
import { View } from '../App';
import { AlertTriangle, CheckCircle, Activity, ServerCrash, BellOff, ArrowRight } from 'lucide-react';
import { getAdminEvents, getAdminOverview } from '../src/services/adminApi';
import type { AdminEventItem, AdminOverviewResponse } from '../src/types/dto';

interface DashboardProps {
  onViewChange: (view: View) => void;
}

const EMPTY_OVERVIEW: AdminOverviewResponse = {
  totalGuardians: 0,
  totalTargets: 0,
  totalDevices: 0,
  onlineDevices: 0,
  todayAlertCount: 0,
  highRiskAlertCount: 0,
  alertFailureCount: 0,
  errorDevices: 0,
  offlineDevices: 0,
};

export const Dashboard: React.FC<DashboardProps> = ({ onViewChange }) => {
  const [overview, setOverview] = useState<AdminOverviewResponse>(EMPTY_OVERVIEW);
  const [recentAlerts, setRecentAlerts] = useState<AdminEventItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setError('');
      try {
        const [overviewRes, eventsRes] = await Promise.all([getAdminOverview(), getAdminEvents()]);
        setOverview(overviewRes);
        setRecentAlerts(eventsRes.items.filter((item) => item.riskLevel === 'HIGH').slice(0, 3));
      } catch (e) {
        setError(e instanceof Error ? e.message : '대시보드 데이터를 불러오지 못했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, []);

  const onlinePercent = useMemo(() => {
    if (!overview.totalDevices) return 0;
    return Math.round((overview.onlineDevices / overview.totalDevices) * 100);
  }, [overview]);

  const issuePercent = useMemo(() => {
    if (!overview.totalDevices) return 0;
    return Math.round(((overview.errorDevices + overview.offlineDevices) / overview.totalDevices) * 100);
  }, [overview]);

  const stats = [
    {
      label: '금일 전체 알림',
      value: overview.todayAlertCount,
      icon: Activity,
      color: 'bg-blue-100 text-blue-600',
      link: 'events' as View,
    },
    {
      label: '현재 고위험 알림',
      value: overview.highRiskAlertCount,
      icon: AlertTriangle,
      color: 'bg-red-100 text-red-600',
      link: 'events' as View,
      highlight: true,
    },
    {
      label: '전체 보호 대상자',
      value: overview.totalTargets,
      icon: CheckCircle,
      color: 'bg-green-100 text-green-600',
      link: 'targets' as View,
    },
    {
      label: '장치 오류 발생',
      value: overview.errorDevices,
      icon: ServerCrash,
      color: 'bg-orange-100 text-orange-600',
      link: 'devices' as View,
    },
    {
      label: '알림 전송 실패',
      value: overview.alertFailureCount,
      icon: BellOff,
      color: 'bg-gray-100 text-gray-600',
      link: 'events' as View,
    },
  ];

  return (
    <div className="space-y-8">
      {isLoading ? <div className="rounded-lg bg-white p-4 text-sm text-gray-500">대시보드 데이터를 불러오는 중...</div> : null}
      {error ? <div className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div> : null}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {stats.map((stat, index) => (
          <div
            key={index}
            onClick={() => onViewChange(stat.link)}
            className={`bg-white rounded-xl p-6 shadow-sm border border-gray-100 cursor-pointer transition-all hover:shadow-md hover:border-gray-200 group ${
              stat.highlight ? 'ring-2 ring-red-100' : ''
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-lg ${stat.color}`}>
                <stat.icon className="w-6 h-6" />
              </div>
              {stat.highlight && <span className="animate-pulse w-3 h-3 rounded-full bg-red-500"></span>}
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-medium text-gray-500">{stat.label}</h3>
              <p className={`text-3xl font-bold ${stat.highlight ? 'text-red-600' : 'text-gray-900'}`}>{stat.value}</p>
            </div>
            <div className="mt-4 flex items-center text-xs font-medium text-gray-400 group-hover:text-blue-600 transition-colors">
              상세보기 <ArrowRight className="w-3 h-3 ml-1" />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            최근 고위험 알림
          </h3>
          <div className="space-y-4">
            {recentAlerts.length === 0 ? (
              <div className="text-sm text-gray-500">고위험 알림이 없습니다.</div>
            ) : (
              recentAlerts.map((alert) => (
                <div key={alert.alertId} className="flex items-start gap-4 p-4 rounded-lg bg-red-50 border border-red-100">
                  <div className="w-2 h-2 mt-2 rounded-full bg-red-500 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <h4 className="font-bold text-red-900">
                        {alert.alertType === 'FALL' ? '낙상 감지' : alert.alertType === 'WANDER' ? '배회 감지' : '무활동 감지'}
                      </h4>
                      <span className="text-xs font-medium text-red-700 bg-red-200 px-2 py-1 rounded">{alert.detectedAt}</span>
                    </div>
                    <p className="text-sm text-red-800 mt-1">대상자: {alert.targetName} ({alert.targetId})</p>
                    <button
                      onClick={() => onViewChange('events')}
                      className="text-xs font-bold text-red-700 mt-2 hover:underline"
                    >
                      확인하기
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <ServerCrash className="w-5 h-5 text-orange-500" />
            장치 상태 요약
          </h3>
          <div className="flex items-center justify-around h-64">
            <div className="text-center">
              <div className="w-32 h-32 rounded-full border-8 border-green-500 flex items-center justify-center mb-4 mx-auto">
                <span className="text-2xl font-bold text-gray-800">{onlinePercent}%</span>
              </div>
              <p className="text-sm font-medium text-gray-600">온라인 장치</p>
            </div>
            <div className="w-px h-32 bg-gray-200"></div>
            <div className="text-center">
              <div className="w-32 h-32 rounded-full border-8 border-orange-200 flex items-center justify-center mb-4 mx-auto relative">
                <div className="absolute inset-0 rounded-full border-8 border-orange-500" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 20%, 0 20%)' }}></div>
                <span className="text-2xl font-bold text-gray-800">{issuePercent}%</span>
              </div>
              <p className="text-sm font-medium text-gray-600">오류 / 오프라인</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
