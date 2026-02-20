import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  Clock,
  Eye,
  Link2,
  Phone,
  Plus,
  RefreshCw,
  Server,
  ShieldAlert,
  Unlink2,
  User,
  Video,
  Wifi,
  WifiOff,
  X,
} from 'lucide-react';
import {
  connectDevice,
  createTarget,
  deleteDevice,
  deleteTarget,
  getAdminDevices,
  getAdminEvents,
  getAdminTargets,
  reportFalsePositive,
} from '../src/services/adminApi';

export type MonitoringTab = 'events' | 'targets' | 'devices';

interface MonitoringProps {
  tab?: MonitoringTab;
  onTabChange?: (tab: MonitoringTab) => void;
}

type AlertType = 'FALL' | 'WANDER' | 'INACTIVITY';

type RiskLevel = 'HIGH' | 'MEDIUM' | 'LOW';

type Status = 'UNCONFIRMED' | 'CONFIRMED' | 'RESOLVED';

interface Alert {
  alertId: string;
  targetId: string;
  deviceId: string;
  alertType: AlertType;
  riskLevel: RiskLevel;
  detectedAt: string;
  isRead: boolean;
}

interface AlertHistoryEntry {
  at: string;
  status: Status;
  note: string;
}

type AlertView = Alert & {
  status: Status;
  description: string;
  targetName: string;
  memo: string;
  guardianNotified: boolean;
  history: AlertHistoryEntry[];
};

interface Target {
  targetId: string;
  guardianId: string;
  name: string;
  age: number;
  gender: 'M' | 'F';
  createdAt: string;
}

interface TargetEventHistory {
  id: string;
  type: AlertType;
  at: string;
  status: Status;
}

type TargetProfile = Target & {
  address: string;
  guardianName: string;
  guardianPhone: string;
  currentStatus: 'SAFE' | 'WARNING' | 'DANGER';
  lastActivityAt: string;
  activeAlertCount: number;
  lastEventSummary: string;
  imageUrl: string;
  notes: string;
  isActive: boolean;
  guardianLinked: boolean;
  riskCriteria: string;
  eventHistory: TargetEventHistory[];
  isDeleted: boolean;
  deletedAt?: string | null;
};

interface Device {
  deviceId: string;
  targetId: string;
  status: 'ONLINE' | 'OFFLINE';
  lastSeenAt: string;
  installedAt: string;
}

interface DeviceErrorHistory {
  at: string;
  code: string;
  detail: string;
}

interface DeviceEventStat {
  type: AlertType;
  count: number;
}

type DeviceView = Device & {
  targetName: string;
  cameraCount: number;
  firmware: string;
  uptime: string;
  deviceHealth: 'OK' | 'ERROR';
  errorHistory: DeviceErrorHistory[];
  eventStats: DeviceEventStat[];
  restartRequestedAt?: string | null;
  isRegistered: boolean;
  isDeleted: boolean;
  deletedAt?: string | null;
};

const nowIso = () => new Date().toISOString();

export const Monitoring: React.FC<MonitoringProps> = ({ tab = 'events' }) => {
  return (
    <div className="space-y-6">
      {tab === 'events' && <EventsSection />}
      {tab === 'targets' && <TargetsSection />}
      {tab === 'devices' && <DevicesSection />}
    </div>
  );
};

type AlertRow = AlertView & { groupedCount?: number };

const EventsSection: React.FC = () => {
  const [alerts, setAlerts] = useState<AlertView[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [groupByTarget, setGroupByTarget] = useState(false);
  const [realtimeOn, setRealtimeOn] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [memoDraft, setMemoDraft] = useState('');

  const selectedEvent = alerts.find((alert) => alert.alertId === selectedEventId) || null;

  useEffect(() => {
    if (!selectedEvent) {
      setMemoDraft('');
      return;
    }
    setMemoDraft(selectedEvent.memo || '');
  }, [selectedEvent]);

  useEffect(() => {
    const loadEvents = async () => {
      setIsLoading(true);
      setErrorMessage('');
      try {
        const response = await getAdminEvents();
        setAlerts(response.items);
      } catch (e) {
        setErrorMessage(e instanceof Error ? e.message : '이벤트 목록을 불러오지 못했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    void loadEvents();

    if (!realtimeOn) {
      return;
    }
    const intervalId = window.setInterval(() => {
      void loadEvents();
    }, 12000);

    return () => window.clearInterval(intervalId);
  }, [realtimeOn]);

  const alertsToShow = useMemo<AlertRow[]>(() => {
    if (!groupByTarget) {
      return alerts;
    }
    const grouped = new Map<string, { alert: AlertView; count: number }>();
    alerts.forEach((alert) => {
      const entry = grouped.get(alert.targetId);
      const count = (entry?.count ?? 0) + 1;
      const isLatest = !entry || new Date(alert.detectedAt) > new Date(entry.alert.detectedAt);
      grouped.set(alert.targetId, { alert: isLatest ? alert : entry.alert, count });
    });
    return Array.from(grouped.values()).map(({ alert, count }) => ({ ...alert, groupedCount: count }));
  }, [alerts, groupByTarget]);

  const getRiskColor = (risk: RiskLevel) => {
    switch (risk) {
      case 'HIGH':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'MEDIUM':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'LOW':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusColor = (status: Status) => {
    switch (status) {
      case 'UNCONFIRMED':
        return 'bg-red-50 text-red-600 border-red-100';
      case 'CONFIRMED':
        return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'RESOLVED':
        return 'bg-green-50 text-green-600 border-green-100';
    }
  };

  const getTypeLabel = (type: AlertType) => {
    switch (type) {
      case 'FALL':
        return '낙상';
      case 'WANDER':
        return '배회';
      case 'INACTIVITY':
        return '무활동';
    }
  };

  const handleRefresh = () => {
    setIsLoading(true);
    setErrorMessage('');
    void getAdminEvents()
      .then((response) => {
        setAlerts(response.items);
      })
      .catch((e) => {
        setErrorMessage(e instanceof Error ? e.message : '이벤트 목록을 불러오지 못했습니다.');
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  const updateAlert = (alertId: string, updater: (alert: AlertView) => AlertView) => {
    setAlerts((prev) => prev.map((alert) => (alert.alertId === alertId ? updater(alert) : alert)));
  };

  const updateStatus = (nextStatus: Status) => {
    if (!selectedEvent) return;
    updateAlert(selectedEvent.alertId, (alert) => ({
      ...alert,
      status: nextStatus,
      history: [...alert.history, { at: nowIso(), status: nextStatus, note: '상태 변경' }],
    }));
  };

  const handleMemoSave = () => {
    if (!selectedEvent) return;
    updateAlert(selectedEvent.alertId, (alert) => ({
      ...alert,
      memo: memoDraft,
      history: [...alert.history, { at: nowIso(), status: alert.status, note: `메모 저장: ${memoDraft}` }],
    }));
  };

  const handleNotifyToggle = () => {
    if (!selectedEvent) return;
    updateAlert(selectedEvent.alertId, (alert) => ({
      ...alert,
      guardianNotified: !alert.guardianNotified,
      history: [
        ...alert.history,
        {
          at: nowIso(),
          status: alert.status,
          note: alert.guardianNotified ? '보호자 알림 해제' : '보호자 알림 전송',
        },
      ],
    }));
  };

  const relatedEvents = selectedEvent ? alerts.filter((alert) => alert.targetId === selectedEvent.targetId) : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-800">실시간 이벤트 목록</h2>
          <p className="text-sm text-gray-500">웹소켓 연결 상태: {realtimeOn ? '수신중' : '일시 중지'}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setRealtimeOn((prev) => !prev)}
            className={`px-4 py-2 text-sm rounded-lg border ${
              realtimeOn ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200'
            }`}
          >
            {realtimeOn ? '실시간 수신 중' : '실시간 수신 켜기'}
          </button>
          <button
            onClick={() => setGroupByTarget((prev) => !prev)}
            className={`px-4 py-2 text-sm rounded-lg border ${
              groupByTarget ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200'
            }`}
          >
            대상자별 묶기
          </button>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" /> 새로고침
          </button>
        </div>
      </div>

      {isLoading && (
        <div className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-sm text-blue-700">
          데이터 로딩 중입니다...
        </div>
      )}
      {errorMessage && (
        <div className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">
          {errorMessage}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">위험도</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">이벤트 유형</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">대상자</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">발생 시각</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">상태</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">알림</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {alertsToShow.map((alert) => (
              <tr key={alert.alertId} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getRiskColor(alert.riskLevel)}`}>
                    {alert.riskLevel === 'HIGH' ? '위험' : alert.riskLevel === 'MEDIUM' ? '주의' : '관심'}
                  </span>
                </td>
                <td className="px-6 py-4 font-medium text-gray-900">
                  {getTypeLabel(alert.alertType)}
                  {alert.groupedCount && alert.groupedCount > 1 && (
                    <span className="ml-2 text-xs text-gray-500">({alert.groupedCount}건)</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-900">{alert.targetName}</span>
                    <span className="text-xs text-gray-500">{alert.targetId}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">{alert.detectedAt}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(alert.status)}`}>
                    {alert.status === 'UNCONFIRMED' ? '미확인' : alert.status === 'CONFIRMED' ? '확인중' : '조치완료'}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">{alert.guardianNotified ? '전송됨' : '미전송'}</td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => setSelectedEventId(alert.alertId)}
                    className="p-2 text-gray-400 hover:text-blue-600 rounded-full hover:bg-blue-50 transition-colors"
                  >
                    <Eye className="w-5 h-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedEvent && (
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">이벤트 상세</h3>
            <button onClick={() => setSelectedEventId(null)} className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-2">
              <X className="w-4 h-4" /> 닫기
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-600" />
                <span className="font-semibold">{getTypeLabel(selectedEvent.alertType)}</span>
                <span className="text-sm text-gray-500">{selectedEvent.detectedAt}</span>
              </div>
              <p className="text-sm text-gray-700">{selectedEvent.description}</p>
              <div className="flex items-center gap-3">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getRiskColor(selectedEvent.riskLevel)}`}>
                  {selectedEvent.riskLevel}
                </span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(selectedEvent.status)}`}>
                  {selectedEvent.status}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {(['UNCONFIRMED', 'CONFIRMED', 'RESOLVED'] as const).map((status) => (
                  <button
                    key={status}
                    onClick={() => updateStatus(status)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-full border ${
                      selectedEvent.status === status ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200'
                    }`}
                  >
                    {status === 'UNCONFIRMED' ? '미확인' : status === 'CONFIRMED' ? '확인중' : '조치완료'}
                  </button>
                ))}
              </div>
              <div className="rounded-lg border border-gray-200 p-3">
                <div className="flex items-center justify-between text-sm">
                  <span>보호자 알림: {selectedEvent.guardianNotified ? '전송됨' : '미전송'}</span>
                  <button onClick={handleNotifyToggle} className="text-blue-600 hover:underline">
                    {selectedEvent.guardianNotified ? '알림 해제' : '알림 전송'}
                  </button>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">메모 / 조치 기록</label>
                <textarea
                  value={memoDraft}
                  onChange={(event) => setMemoDraft(event.target.value)}
                  className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  rows={3}
                />
                <button
                  onClick={handleMemoSave}
                  className="mt-2 inline-flex items-center gap-2 rounded-lg bg-gray-900 px-3 py-2 text-xs font-semibold text-white hover:bg-gray-800"
                >
                  기록 저장
                </button>
                <button
                  onClick={() => void handleFalsePositiveReport()}
                  className="mt-2 ml-2 inline-flex items-center gap-2 rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-700"
                >
                  오탐 신고
                </button>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">동일 대상자 이벤트</label>
                <div className="mt-2 space-y-2">
                  {relatedEvents.map((eventItem) => (
                    <div key={eventItem.alertId} className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm">
                      <div>
                        <p className="font-semibold text-gray-800">{getTypeLabel(eventItem.alertType)}</p>
                        <p className="text-xs text-gray-500">{eventItem.detectedAt}</p>
                      </div>
                      <span className="text-xs text-gray-500">{eventItem.status}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">이벤트 이력</label>
                <div className="mt-2 space-y-2">
                  {selectedEvent.history.map((history, index) => (
                    <div key={`${history.at}-${index}`} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-600">
                      <div className="flex items-center justify-between">
                        <span>{history.note}</span>
                        <span className="text-gray-400">{history.at}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const TargetsSection: React.FC = () => {
  const [targets, setTargets] = useState<TargetProfile[]>([]);
  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [draftName, setDraftName] = useState('');
  const [draftPhone, setDraftPhone] = useState('');
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [newTargetId, setNewTargetId] = useState('');
  const [newTargetName, setNewTargetName] = useState('');
  const [newTargetAge, setNewTargetAge] = useState('');
  const [newTargetGender, setNewTargetGender] = useState<'M' | 'F'>('M');
  const [newGuardianName, setNewGuardianName] = useState('');
  const [newGuardianPhone, setNewGuardianPhone] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const selectedTarget = targets.find((target) => target.targetId === selectedTargetId) || null;

  useEffect(() => {
    const loadTargets = async () => {
      setIsLoading(true);
      setErrorMessage('');
      try {
        const response = await getAdminTargets();
        setTargets(response.items);
      } catch (e) {
        setErrorMessage(e instanceof Error ? e.message : '대상자 목록을 불러오지 못했습니다.');
      } finally {
        setIsLoading(false);
      }
    };
    void loadTargets();
  }, []);

  useEffect(() => {
    if (!selectedTarget) {
      setDraftName('');
      setDraftPhone('');
      return;
    }
    setDraftName(selectedTarget.name);
    setDraftPhone(selectedTarget.guardianPhone);
  }, [selectedTarget]);

  const updateTarget = (targetId: string, updater: (target: TargetProfile) => TargetProfile) => {
    setTargets((prev) => prev.map((target) => (target.targetId === targetId ? updater(target) : target)));
  };

  const handleFalsePositiveReport = async () => {
    if (!selectedEvent) return;
    try {
      await reportFalsePositive(selectedEvent.alertId, memoDraft || 'UI report');
      setAlerts((prev) => prev.filter((item) => item.alertId !== selectedEvent.alertId));
      setSelectedEventId(null);
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : '오탐 신고에 실패했습니다.');
    }
  };

  // Soft delete only. Records remain for audit and history.
  const handleDeleteTarget = async (targetId: string) => {
    try {
      await deleteTarget(targetId);
      updateTarget(targetId, (target) => ({
        ...target,
        isDeleted: true,
        deletedAt: nowIso(),
        isActive: false,
      }));
      setSelectedTargetId(null);
      setDeleteTargetId(null);
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : '대상자 삭제에 실패했습니다.');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DANGER':
        return <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded">위험</span>;
      case 'WARNING':
        return <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs font-bold rounded">주의</span>;
      case 'SAFE':
        return <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded">정상</span>;
      default:
        return null;
    }
  };

  const handleSave = () => {
    if (!selectedTarget) return;
    updateTarget(selectedTarget.targetId, (target) => ({
      ...target,
      name: draftName,
      guardianPhone: draftPhone,
    }));
    setIsEditing(false);
  };

  const handleRegisterTarget = async () => {
    if (!newTargetName.trim()) return;
    try {
      await createTarget({
        name: newTargetName.trim(),
        age: Number(newTargetAge) || 75,
        gender: newTargetGender,
      });
      const response = await getAdminTargets();
      setTargets(response.items);
      setIsRegistering(false);
      setNewTargetId('');
      setNewTargetName('');
      setNewTargetAge('');
      setNewTargetGender('M');
      setNewGuardianName('');
      setNewGuardianPhone('');
      setNewAddress('');
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : '대상자 등록에 실패했습니다.');
    }
  };

  const visibleTargets = targets.filter((target) => !target.isDeleted);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800">대상자 목록</h2>
        <button
          onClick={() => setIsRegistering((prev) => !prev)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-semibold flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> 신규 대상자 등록
        </button>
      </div>

      {isLoading && (
        <div className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-sm text-blue-700">
          대상자 목록을 불러오는 중입니다...
        </div>
      )}
      {errorMessage && (
        <div className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">
          {errorMessage}
        </div>
      )}

      {isRegistering && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="text-sm text-gray-500">대상자 ID (선택)</label>
              <input
                value={newTargetId}
                onChange={(event) => setNewTargetId(event.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                placeholder="TGT-0000"
              />
            </div>
            <div>
              <label className="text-sm text-gray-500">이름</label>
              <input
                value={newTargetName}
                onChange={(event) => setNewTargetName(event.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                placeholder="홍길동"
              />
            </div>
            <div>
              <label className="text-sm text-gray-500">나이</label>
              <input
                value={newTargetAge}
                onChange={(event) => setNewTargetAge(event.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                placeholder="75"
              />
            </div>
            <div>
              <label className="text-sm text-gray-500">성별</label>
              <select
                value={newTargetGender}
                onChange={(event) => setNewTargetGender(event.target.value as 'M' | 'F')}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white"
              >
                <option value="M">남성</option>
                <option value="F">여성</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-gray-500">보호자 이름</label>
              <input
                value={newGuardianName}
                onChange={(event) => setNewGuardianName(event.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                placeholder="김영수"
              />
            </div>
            <div>
              <label className="text-sm text-gray-500">보호자 연락처</label>
              <input
                value={newGuardianPhone}
                onChange={(event) => setNewGuardianPhone(event.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                placeholder="010-0000-0000"
              />
            </div>
            <div className="md:col-span-2 lg:col-span-3">
              <label className="text-sm text-gray-500">주소</label>
              <input
                value={newAddress}
                onChange={(event) => setNewAddress(event.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                placeholder="서울시 ... "
              />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              onClick={handleRegisterTarget}
              className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 text-sm"
            >
              등록 완료
            </button>
            <button
              onClick={() => setIsRegistering(false)}
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm"
            >
              취소
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">대상자</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">상태</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">보호자</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">최근 이벤트</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">활성화</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {visibleTargets.map((target) => (
              <tr key={target.targetId} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <img src={target.imageUrl} alt={target.name} className="w-10 h-10 rounded-full object-cover border border-gray-200" />
                    <div>
                      <p className="font-bold text-gray-900">
                        {target.name} <span className="text-gray-400 font-normal text-xs">({target.age}세)</span>
                      </p>
                      <p className="text-xs text-gray-500">{target.targetId}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">{getStatusBadge(target.currentStatus)}</td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Phone className="w-3 h-3" /> {target.guardianName}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">{target.lastEventSummary}</td>
                <td className="px-6 py-4 text-sm">{target.isActive ? '활성' : '비활성'}</td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => setSelectedTargetId(target.targetId)}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    상세 보기
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedTarget && (
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">대상자 상세</h3>
            <button onClick={() => setSelectedTargetId(null)} className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-2">
              <X className="w-4 h-4" /> 닫기
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-4">
              <div className="rounded-lg border border-gray-200 p-4">
                <div className="flex items-center gap-3">
                  <img src={selectedTarget.imageUrl} alt={selectedTarget.name} className="w-16 h-16 rounded-full object-cover" />
                  <div>
                    <p className="text-lg font-bold text-gray-900">{selectedTarget.name}</p>
                    <p className="text-sm text-gray-500">{selectedTarget.targetId}</p>
                  </div>
                </div>
                <div className="mt-4 space-y-2 text-sm text-gray-600">
                  <div>나이 / 성별: {selectedTarget.age}세 / {selectedTarget.gender}</div>
                  <div>주소: {selectedTarget.address}</div>
                  <div>보호자: {selectedTarget.guardianName}</div>
                  <div>연락처: {selectedTarget.guardianPhone}</div>
                </div>
              </div>
              <div className="rounded-lg border border-gray-200 p-4">
                <h4 className="font-semibold text-gray-800 mb-2">위험도 기준 (읽기 전용)</h4>
                <p className="text-sm text-gray-600">{selectedTarget.riskCriteria}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => updateTarget(selectedTarget.targetId, (target) => ({ ...target, isActive: !target.isActive }))}
                  className="px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  {selectedTarget.isActive ? '대상자 비활성화' : '대상자 활성화'}
                </button>
                <button
                  onClick={() => updateTarget(selectedTarget.targetId, (target) => ({ ...target, guardianLinked: !target.guardianLinked }))}
                  className="px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                  {selectedTarget.guardianLinked ? <Unlink2 className="w-4 h-4" /> : <Link2 className="w-4 h-4" />}
                  {selectedTarget.guardianLinked ? '보호자 연결 해제' : '보호자 연결'}
                </button>
                <button
                  onClick={() => setDeleteTargetId(selectedTarget.targetId)}
                  className="px-3 py-2 text-sm bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100"
                >
                  대상자 삭제
                </button>
              </div>
            </div>

            <div className="lg:col-span-2 space-y-4">
              <div className="rounded-lg border border-gray-200 p-4">
                <h4 className="font-semibold text-gray-800 mb-2">대상자 정보 수정</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-500">이름</label>
                    <input
                      value={draftName}
                      onChange={(event) => setDraftName(event.target.value)}
                      className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                      disabled={!isEditing}
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">보호자 연락처</label>
                    <input
                      value={draftPhone}
                      onChange={(event) => setDraftPhone(event.target.value)}
                      className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                      disabled={!isEditing}
                    />
                  </div>
                </div>
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => setIsEditing((prev) => !prev)}
                    className="px-3 py-2 text-sm bg-gray-900 text-white rounded-lg"
                  >
                    {isEditing ? '편집 취소' : '정보 수정'}
                  </button>
                  {isEditing && (
                    <button onClick={handleSave} className="px-3 py-2 text-sm bg-blue-600 text-white rounded-lg">
                      저장
                    </button>
                  )}
                </div>
              </div>

              <div className="rounded-lg border border-gray-200 p-4">
                <h4 className="font-semibold text-gray-800 mb-2">대상자 이벤트 히스토리</h4>
                <div className="space-y-2">
                  {selectedTarget.eventHistory.map((history) => (
                    <div key={history.id} className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2 text-sm">
                      <span className="font-medium text-gray-800">{history.type}</span>
                      <span className="text-xs text-gray-500">{history.at}</span>
                      <span className="text-xs text-gray-500">{history.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {deleteTargetId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl border border-gray-200 p-6 w-full max-w-md shadow-lg">
            <h3 className="text-lg font-bold text-gray-900 mb-2">대상자 삭제</h3>
            <p className="text-sm text-gray-600 mb-4">
              이 작업은 복구 불가합니다. 실제로는 논리 삭제로 처리됩니다.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setDeleteTargetId(null)}
                className="px-4 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                취소
              </button>
              <button
                onClick={() => handleDeleteTarget(deleteTargetId)}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                삭제 확인
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const DevicesSection: React.FC = () => {
  const [devices, setDevices] = useState<DeviceView[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [newDeviceId, setNewDeviceId] = useState('');
  const [newTargetId, setNewTargetId] = useState('');
  const [newTargetName, setNewTargetName] = useState('');
  const [deleteDeviceId, setDeleteDeviceId] = useState<string | null>(null);
  const [deleteErrorMessage, setDeleteErrorMessage] = useState('');
  const [deleteSuccessMessage, setDeleteSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const selectedDevice = devices.find((device) => device.deviceId === selectedDeviceId) || null;

  useEffect(() => {
    const loadDevices = async () => {
      setIsLoading(true);
      setErrorMessage('');
      try {
        const response = await getAdminDevices();
        setDevices(response.items);
      } catch (e) {
        setErrorMessage(e instanceof Error ? e.message : '장치 목록을 불러오지 못했습니다.');
      } finally {
        setIsLoading(false);
      }
    };
    void loadDevices();
  }, []);

  const getStatusBadge = (status: Device['status'], deviceHealth: DeviceView['deviceHealth']) => {
    if (deviceHealth === 'ERROR') {
      return (
        <span className="flex items-center gap-1.5 px-2.5 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full">
          <div className="w-2 h-2 rounded-full bg-red-500"></div>오류
        </span>
      );
    }
    switch (status) {
      case 'ONLINE':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>온라인
          </span>
        );
      case 'OFFLINE':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 text-gray-600 text-xs font-bold rounded-full">
            <div className="w-2 h-2 rounded-full bg-gray-400"></div>오프라인
          </span>
        );
    }
  };

  const handleRegister = async () => {
    if (!newDeviceId.trim() || !newTargetId.trim()) {
      setErrorMessage('장치 ID와 대상자 ID를 입력해 주세요.');
      return;
    }
    try {
      await connectDevice({ targetId: newTargetId.trim(), serialNumber: newDeviceId.trim() });
      const response = await getAdminDevices();
      setDevices(response.items);
      setIsRegistering(false);
      setNewDeviceId('');
      setNewTargetId('');
      setNewTargetName('');
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : '장치 등록에 실패했습니다.');
    }
  };

  const updateDevice = (deviceId: string, updater: (device: DeviceView) => DeviceView) => {
    setDevices((prev) => prev.map((device) => (device.deviceId === deviceId ? updater(device) : device)));
  };

  const handleDeleteDevice = async (deviceId: string) => {
    setDeleteErrorMessage('');
    setDeleteSuccessMessage('');
    try {
      await deleteDevice(deviceId);
    } catch (e) {
      setDeleteErrorMessage(e instanceof Error ? e.message : '장치 삭제에 실패했습니다. 다시 시도해 주세요.');
      return;
    }
    updateDevice(deviceId, (device) => ({
      ...device,
      isDeleted: true,
      deletedAt: nowIso(),
      isRegistered: false,
    }));
    setSelectedDeviceId(null);
    setDeleteDeviceId(null);
    setDeleteSuccessMessage('장치가 삭제되었습니다.');
  };

  const visibleDevices = devices.filter((device) => !device.isDeleted);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800">장치 목록</h2>
        <button
          onClick={() => setIsRegistering((prev) => !prev)}
          className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> 장치 등록
        </button>
      </div>

      {isLoading && (
        <div className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-sm text-blue-700">
          장치 목록을 불러오는 중입니다...
        </div>
      )}
      {errorMessage && (
        <div className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">
          {errorMessage}
        </div>
      )}

      {isRegistering && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm text-gray-500">장치 ID</label>
              <input
                value={newDeviceId}
                onChange={(event) => setNewDeviceId(event.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-sm text-gray-500">대상자 ID</label>
              <input
                value={newTargetId}
                onChange={(event) => setNewTargetId(event.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-sm text-gray-500">대상자 이름</label>
              <input
                value={newTargetName}
                onChange={(event) => setNewTargetName(event.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button onClick={handleRegister} className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 text-sm">
              등록 완료
            </button>
            <button onClick={() => setIsRegistering(false)} className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm">
              취소
            </button>
          </div>
        </div>
      )}

      {deleteSuccessMessage && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
          {deleteSuccessMessage}
        </div>
      )}
      {deleteErrorMessage && (
        <div className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">
          {deleteErrorMessage}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">장치 ID</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">설치 대상</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">상태</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">마지막 통신</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">등록</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {visibleDevices.map((device) => (
              <tr key={device.deviceId} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 font-mono text-sm font-medium text-gray-600">{device.deviceId}</td>
                <td className="px-6 py-4 font-medium text-gray-900">
                  {device.targetName} ({device.targetId})
                </td>
                <td className="px-6 py-4">{getStatusBadge(device.status, device.deviceHealth)}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{device.lastSeenAt}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{device.isRegistered ? '등록됨' : '해제됨'}</td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => setSelectedDeviceId(device.deviceId)}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    상세 보기
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedDevice && (
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">장치 상세</h3>
            <button onClick={() => setSelectedDeviceId(null)} className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-2">
              <X className="w-4 h-4" /> 닫기
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Server className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="font-bold text-gray-900">{selectedDevice.deviceId}</p>
                  <p className="text-sm text-gray-500">{selectedDevice.targetName}</p>
                </div>
              </div>
              <div className="text-sm text-gray-600 space-y-1">
                <div>펌웨어: {selectedDevice.firmware}</div>
                <div>가동 시간: {selectedDevice.uptime}</div>
                <div className="flex items-center gap-2">
                  연결 상태: {selectedDevice.status === 'ONLINE' ? <Wifi className="w-4 h-4 text-green-600" /> : <WifiOff className="w-4 h-4 text-gray-500" />} {selectedDevice.status}
                </div>
                <div>재시작 요청: {selectedDevice.restartRequestedAt ? '요청됨' : '없음'}</div>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => updateDevice(selectedDevice.deviceId, (device) => ({ ...device, restartRequestedAt: nowIso() }))}
                  className="px-3 py-2 text-sm bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100"
                >
                  원격 재시작 요청
                </button>
                <button
                  onClick={() => updateDevice(selectedDevice.deviceId, (device) => ({ ...device, isRegistered: !device.isRegistered }))}
                  className="px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  {selectedDevice.isRegistered ? '장치 해제' : '장치 등록'}
                </button>
                <button
                  onClick={() => setDeleteDeviceId(selectedDevice.deviceId)}
                  className="px-3 py-2 text-sm bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100"
                >
                  장치 삭제
                </button>
              </div>
            </div>
            <div className="space-y-4">
              <div className="rounded-lg border border-gray-200 p-4">
                <h4 className="font-semibold text-gray-800 mb-2">장치 오류 이력</h4>
                <div className="space-y-2">
                  {selectedDevice.errorHistory.length === 0 && (
                    <div className="text-sm text-gray-500">오류 이력이 없습니다.</div>
                  )}
                  {selectedDevice.errorHistory.map((history) => (
                    <div key={`${history.at}-${history.code}`} className="rounded-lg border border-gray-100 px-3 py-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-gray-700">{history.code}</span>
                        <span className="text-xs text-gray-500">{history.at}</span>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">{history.detail}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-lg border border-gray-200 p-4">
                <h4 className="font-semibold text-gray-800 mb-2">장치별 이벤트 발생 통계</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {selectedDevice.eventStats.map((stat) => (
                    <div key={stat.type} className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-sm">
                      <p className="text-gray-500">{stat.type}</p>
                      <p className="text-lg font-bold text-gray-900">{stat.count}건</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-lg border border-gray-200 p-4">
                <h4 className="font-semibold text-gray-800 mb-2">장치 상태 요약</h4>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-orange-500" /> 오류 상태: {selectedDevice.deviceHealth}
                  </div>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-blue-500" /> 마지막 통신: {selectedDevice.lastSeenAt}
                  </div>
                </div>
              </div>
              <div className="rounded-lg border border-gray-200 p-4">
                <h4 className="font-semibold text-gray-800 mb-2">연결된 카메라</h4>
                <div className="space-y-2">
                  {[...Array(selectedDevice.cameraCount)].map((_, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <span>Camera 0{i + 1}</span>
                      <Video className="w-4 h-4 text-gray-500" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {deleteDeviceId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl border border-gray-200 p-6 w-full max-w-md shadow-lg">
            <h3 className="text-lg font-bold text-gray-900 mb-2">장치 삭제</h3>
            <p className="text-sm text-gray-600 mb-4">
              이 작업은 복구 불가합니다. 실제로는 논리 삭제로 처리됩니다.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setDeleteDeviceId(null)}
                className="px-4 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                취소
              </button>
              <button
                onClick={() => handleDeleteDevice(deleteDeviceId)}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                삭제 확인
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

