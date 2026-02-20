import React, { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import { getAdminStatistics } from '../src/services/adminApi';
import type { AdminStatisticsResponse } from '../src/types/dto';

const PERIODS = ['일', '주', '월'] as const;
type Period = typeof PERIODS[number];

const COLORS = ['#ef4444', '#f97316', '#3b82f6'];

const periodToParam: Record<Period, 'day' | 'week' | 'month'> = {
  일: 'day',
  주: 'week',
  월: 'month',
};

export const Statistics: React.FC = () => {
  const [period, setPeriod] = useState<Period>('일');
  const [stats, setStats] = useState<AdminStatisticsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setError('');
      try {
        const response = await getAdminStatistics(periodToParam[period]);
        setStats(response);
      } catch (e) {
        setError(e instanceof Error ? e.message : '통계 데이터를 불러오지 못했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, [period]);

  const timeData = stats?.timeData ?? [];
  const typeData = stats?.typeData ?? [];
  const trendData = stats?.trendData ?? [];
  const errorData = stats?.errorData ?? [];
  const targetStats = stats?.targetStats ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {PERIODS.map((option) => (
          <button
            key={option}
            onClick={() => setPeriod(option)}
            className={`px-4 py-2 text-sm rounded-lg border ${
              period === option ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200'
            }`}
          >
            {option} 기준
          </button>
        ))}
      </div>

      {isLoading ? <div className="rounded-lg bg-white p-4 text-sm text-gray-500">통계 데이터를 불러오는 중...</div> : null}
      {error ? <div className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div> : null}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 min-w-0">
          <h3 className="text-lg font-bold text-gray-800 mb-6">시간대별 이벤트 발생 분포</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={timeData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="time" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  cursor={{ fill: '#f3f4f6' }}
                />
                <Bar dataKey="events" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 min-w-0">
          <h3 className="text-lg font-bold text-gray-800 mb-6">이벤트 유형별 비율</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={typeData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                  {typeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 col-span-1 lg:col-span-2 min-w-0">
          <h3 className="text-lg font-bold text-gray-800 mb-6">이벤트 유형별 추이 분석</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  cursor={{ fill: '#f3f4f6' }}
                />
                <Legend />
                <Line type="monotone" dataKey="fall" name="낙상" stroke="#ef4444" strokeWidth={2} />
                <Line type="monotone" dataKey="wander" name="배회" stroke="#f97316" strokeWidth={2} />
                <Line type="monotone" dataKey="inactivity" name="무활동" stroke="#3b82f6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 col-span-1 lg:col-span-2 min-w-0">
          <h3 className="text-lg font-bold text-gray-800 mb-6">장치 오류 유형 분석</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {errorData.map((err, idx) => (
              <div key={idx} className="p-4 rounded-lg bg-gray-50 border border-gray-100 flex flex-col items-center justify-center text-center">
                <span className="text-sm text-gray-500 font-medium mb-2">{err.name}</span>
                <span className="text-2xl font-bold text-gray-800">{err.value}건</span>
                <div className="w-full h-1 bg-gray-200 mt-3 rounded-full overflow-hidden">
                  <div className="h-full bg-orange-400" style={{ width: `${Math.min(100, (err.value / 20) * 100)}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 col-span-1 lg:col-span-2 min-w-0">
          <h3 className="text-lg font-bold text-gray-800 mb-6">대상자별 통계</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {targetStats.map((target) => (
              <div key={target.id} className="p-4 rounded-lg border border-gray-200 bg-gray-50">
                <p className="text-sm text-gray-500">{target.name}</p>
                <p className="text-xs text-gray-400">{target.id}</p>
                <div className="mt-3 space-y-1 text-sm text-gray-700">
                  <div>전체 이벤트: {target.total}건</div>
                  <div>고위험: {target.highRisk}건</div>
                  <div>연결 장치: {target.devices}대</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
