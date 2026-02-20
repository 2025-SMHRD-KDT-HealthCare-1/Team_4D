import React, { useEffect, useState } from 'react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { getActivityReport } from '../src/services/guardianApi';
import type { ActivityReportResponse } from '../src/types/dto';

export function Report() {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [data, setData] = useState<ActivityReportResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setError('');
      try {
        const result = await getActivityReport(date);
        setData(result);
      } catch (e) {
        setData(null);
        setError(e instanceof Error ? e.message : 'Failed to load activity report.');
      } finally {
        setIsLoading(false);
      }
    };
    void load();
  }, [date]);

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">활동 리포트</h1>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm" />
      </div>

      {isLoading ? <div className="rounded-xl bg-white p-8 text-sm text-slate-500">리포트 불러오는 중...</div> : null}
      {error ? <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div> : null}

      {data ? (
        <>
          <section className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="mb-3 text-base font-bold text-slate-800">오늘의 활동 타임라인</h2>
            <div className="space-y-2">
              {data.timeline.map((item) => (
                <div key={item.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                  <span className="text-sm font-semibold text-slate-800">{item.title}</span>
                  <span className="text-xs text-slate-500">{item.time}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="mb-3 text-base font-bold text-slate-800">시간대별 활동량</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.chart}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="activity" stroke="#1F8A4C" fill="#72CB7D66" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>
        </>
      ) : (
        !isLoading && <div className="rounded-xl bg-white p-8 text-sm text-slate-500">리포트 없음</div>
      )}
    </div>
  );
}
