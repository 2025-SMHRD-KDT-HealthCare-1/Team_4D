import React, { useEffect, useState } from 'react';
import { Shield, Thermometer, Wifi } from 'lucide-react';
import { Button } from './ui/Button';
import { MedicationIntakeCard } from './MedicationIntakeCard';
import { checkHealth, getAlerts, getOverview } from '../src/services/guardianApi';
import type { AlertListItem, GuardianOverviewResponse } from '../src/types/dto';
import { formatRelativeTime } from '../data/mock';

interface HomeProps {
  goAlerts: () => void;
}

export function Home({ goAlerts }: HomeProps) {
  const [overview, setOverview] = useState<GuardianOverviewResponse | null>(null);
  const [alerts, setAlerts] = useState<AlertListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setError('');
      try {
        await checkHealth();
        const [overviewResponse, alertsResponse] = await Promise.all([getOverview(), getAlerts()]);
        setOverview(overviewResponse);
        setAlerts(alertsResponse.items);
      } catch (e) {
        setError(e instanceof Error ? e.message : '상태요약 조회 실패');
      } finally {
        setIsLoading(false);
      }
    };
    void load();
  }, []);

  if (isLoading) return <div className="rounded-xl bg-white p-10 text-center text-slate-500">로딩 중...</div>;
  if (error) return <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>;
  if (!overview) return <div className="rounded-xl bg-white p-4 text-sm text-slate-500">데이터 없음</div>;

  return (
    <div className="space-y-6 pb-20">
      <h1 className="text-2xl font-bold text-slate-900">메인</h1>
      <section className="grid grid-cols-2 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="mb-1 flex items-center gap-2 text-sm text-slate-500">
            <Shield className="h-4 w-4" />
            상태
          </div>
          <p className="text-xl font-bold">{overview.status}</p>
          <p className="text-xs text-slate-500">{overview.subjectName}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="mb-1 flex items-center gap-2 text-sm text-slate-500">
            <Thermometer className="h-4 w-4" />
            환경
          </div>
          <p className="text-xl font-bold">{overview.temperature}°C</p>
          <p className="inline-flex items-center gap-1 text-xs text-slate-500">
            <Wifi className="h-3 w-3" />
            {overview.deviceStatus}
          </p>
        </div>
      </section>
      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold">최근 알림</h2>
          <Button variant="secondary" size="sm" onClick={goAlerts}>
            전체보기
          </Button>
        </div>
        <div className="space-y-2">
          {alerts.slice(0, 3).map((item) => (
            <div key={item.id} className="rounded-lg border border-slate-200 p-3">
              <p className="text-sm font-semibold">{item.title}</p>
              <p className="text-xs text-slate-500">
                {item.location} · {formatRelativeTime(item.occurredAt)}
              </p>
            </div>
          ))}
        </div>
      </section>
      <MedicationIntakeCard />
    </div>
  );
}
