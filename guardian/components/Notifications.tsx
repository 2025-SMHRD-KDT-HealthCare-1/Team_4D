import React, { useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { Button } from './ui/Button';
import { getAlerts, markAlertAsRead } from '../src/services/guardianApi';
import type { AlertListItem } from '../src/types/dto';
import { formatRelativeTime } from '../data/mock';

export function Notifications() {
  const [alerts, setAlerts] = useState<AlertListItem[]>([]);
  const [filter, setFilter] = useState<'all' | 'HIGH' | 'MEDIUM' | 'LOW'>('all');
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadAlerts = async () => {
      setIsLoading(true);
      setError('');
      try {
        const response = await getAlerts();
        setAlerts(response.items);
      } catch (e) {
        setError(e instanceof Error ? e.message : '알림 목록을 불러오지 못했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    void loadAlerts();
  }, []);

  const filtered = useMemo(() => {
    const byRisk = filter === 'all' ? alerts : alerts.filter((a) => a.riskLevel === filter);
    const normalized = query.trim().toLowerCase();
    if (!normalized) return byRisk;

    return byRisk.filter((item) => {
      const blob = `${item.title} ${item.description} ${item.location}`.toLowerCase();
      return blob.includes(normalized);
    });
  }, [alerts, filter, query]);

  const handleMarkRead = async (alertId: string) => {
    try {
      await markAlertAsRead(alertId);
      setAlerts((prev) => prev.map((item) => (item.id === alertId ? { ...item, isRead: true } : item)));
    } catch (e) {
      setError(e instanceof Error ? e.message : '읽음 처리에 실패했습니다.');
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">알림</h1>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-3">
        <label className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2">
          <Search className="h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="제목, 내용, 위치 검색"
            className="w-full bg-transparent text-sm outline-none"
          />
        </label>

        <div className="mt-3 flex gap-2">
          {(['all', 'HIGH', 'MEDIUM', 'LOW'] as const).map((level) => (
            <Button
              key={level}
              variant={filter === level ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setFilter(level)}
            >
              {level === 'all' ? '전체' : level}
            </Button>
          ))}
        </div>
      </div>

      {isLoading ? <div className="rounded-xl bg-white p-6 text-sm text-slate-500">알림을 불러오는 중입니다.</div> : null}
      {error ? <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div> : null}

      {!isLoading && !error && filtered.length === 0 ? (
        <div className="rounded-xl bg-white p-6 text-sm text-slate-500">조건에 맞는 알림이 없습니다.</div>
      ) : null}

      <div className="space-y-2">
        {filtered.map((item) => (
          <div key={item.id} className="rounded-lg border border-slate-200 bg-white p-3">
            <div className="mb-1 flex items-center justify-between gap-2">
              <p className="text-sm font-semibold">{item.title}</p>
              {!item.isRead ? (
                <Button variant="secondary" size="sm" onClick={() => void handleMarkRead(item.id)}>
                  읽음 처리
                </Button>
              ) : (
                <span className="text-xs text-emerald-700">읽음</span>
              )}
            </div>
            <p className="text-xs text-slate-500">{item.description}</p>
            <p className="mt-1 text-xs text-slate-500">
              {item.location} · {formatRelativeTime(item.occurredAt)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
