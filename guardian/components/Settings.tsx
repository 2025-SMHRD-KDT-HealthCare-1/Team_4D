import React, { useEffect, useState } from 'react';
import { LogOut, Users, ClipboardList, ChevronRight, Copy } from 'lucide-react';
import { Button } from './ui/Button';
import { connectDevice, createSubject, getSubjects, removeDevice, removeSubject, withdrawAccount } from '../src/services/guardianApi';
import type { SubjectItem } from '../src/types/dto';

interface SettingsProps {
  onLogout: () => void;
  onOpenReport: () => void;
}

type FamilyMember = { id: string; name: string; role: string };
type ReportItem = { id: string; title: string; status: string; createdAt: string };

export function Settings({ onLogout, onOpenReport }: SettingsProps) {
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [subjectId, setSubjectId] = useState('');
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newSubjectAge, setNewSubjectAge] = useState('75');
  const [newSubjectGender, setNewSubjectGender] = useState<'M' | 'F'>('F');
  const [serialNumber, setSerialNumber] = useState('');
  const [deviceId, setDeviceId] = useState('');
  const [isBusy, setIsBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const [shareCode, setShareCode] = useState('');
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);

  const [reports] = useState<ReportItem[]>([
    { id: 'r1', title: '오탐 신고 - 동작 감지', status: '접수', createdAt: '2026-02-13' },
    { id: 'r2', title: '장치 오류 신고 - 연결 불안정', status: '처리중', createdAt: '2026-02-12' },
  ]);

  useEffect(() => {
    void getSubjects()
      .then((r) => {
        const active = r.items.filter((s) => !s.isDeleted);
        setSubjects(active);
        if (active[0]) setSubjectId(active[0].targetId);
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : '대상자 목록을 불러오지 못했습니다.');
      });
  }, []);

  const createShareCode = () => {
    const code = Math.random().toString(36).slice(2, 8).toUpperCase();
    setShareCode(code);
  };

  const copyShareCode = async () => {
    if (!shareCode) return;
    try {
      await navigator.clipboard.writeText(shareCode);
      setMessage('공유 코드를 복사했습니다.');
    } catch {
      setError('클립보드 복사 권한이 없습니다.');
    }
  };

  const removeFamily = (id: string) => {
    // TODO: 가족 공유 API 연동
    setFamilyMembers((prev) => prev.filter((m) => m.id !== id));
  };

  const handleCreateSubject = async () => {
    const name = newSubjectName.trim();
    if (!name) {
      setError('대상자 이름을 입력해 주세요.');
      return;
    }

    setIsBusy(true);
    setError('');
    setMessage('');
    try {
      const created = await createSubject({
        name,
        age: Number(newSubjectAge) || 75,
        gender: newSubjectGender,
      });
      const next: SubjectItem = {
        targetId: created.targetId,
        name: created.name,
        age: created.age,
        gender: created.gender,
        isDeleted: created.isDeleted,
      };
      setSubjects((prev) => [next, ...prev]);
      setSubjectId(created.targetId);
      setNewSubjectName('');
      setMessage('대상자를 등록했습니다.');
    } catch (e) {
      setError(e instanceof Error ? e.message : '대상자 등록에 실패했습니다.');
    } finally {
      setIsBusy(false);
    }
  };

  const handleRemoveSubject = async () => {
    if (!subjectId) {
      setError('삭제할 대상자를 선택해 주세요.');
      return;
    }

    setIsBusy(true);
    setError('');
    setMessage('');
    try {
      await removeSubject(subjectId);
      setSubjects((prev) => prev.filter((s) => s.targetId !== subjectId));
      setSubjectId('');
      setMessage('대상자를 삭제했습니다.');
    } catch (e) {
      setError(e instanceof Error ? e.message : '대상자 삭제에 실패했습니다.');
    } finally {
      setIsBusy(false);
    }
  };

  const handleConnectDevice = async () => {
    if (!subjectId || !serialNumber.trim()) {
      setError('대상자와 시리얼 번호를 확인해 주세요.');
      return;
    }

    setIsBusy(true);
    setError('');
    setMessage('');
    try {
      await connectDevice({ targetId: subjectId, serialNumber: serialNumber.trim() });
      setSerialNumber('');
      setMessage('장치를 연결했습니다.');
    } catch (e) {
      setError(e instanceof Error ? e.message : '장치 연결에 실패했습니다.');
    } finally {
      setIsBusy(false);
    }
  };

  const handleRemoveDevice = async () => {
    if (!deviceId.trim()) {
      setError('장치 ID를 입력해 주세요.');
      return;
    }

    setIsBusy(true);
    setError('');
    setMessage('');
    try {
      await removeDevice(deviceId.trim());
      setDeviceId('');
      setMessage('장치를 해제했습니다.');
    } catch (e) {
      setError(e instanceof Error ? e.message : '장치 해제에 실패했습니다.');
    } finally {
      setIsBusy(false);
    }
  };

  const handleWithdraw = async () => {
    const ok = window.confirm('정말 회원 탈퇴하시겠습니까?');
    if (!ok) return;

    setIsBusy(true);
    setError('');
    setMessage('');
    try {
      await withdrawAccount();
      onLogout();
    } catch (e) {
      setError(e instanceof Error ? e.message : '회원 탈퇴에 실패했습니다.');
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <h1 className="text-2xl font-bold">설정</h1>

      {message ? <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</div> : null}
      {error ? <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div> : null}

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="mb-3 font-bold">대상자 관리</h2>

        <div className="mb-3 grid grid-cols-1 gap-2 md:grid-cols-3">
          <input
            value={newSubjectName}
            onChange={(e) => setNewSubjectName(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2"
            placeholder="대상자 이름"
          />
          <input
            value={newSubjectAge}
            onChange={(e) => setNewSubjectAge(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2"
            placeholder="나이"
          />
          <select
            value={newSubjectGender}
            onChange={(e) => setNewSubjectGender(e.target.value as 'M' | 'F')}
            className="rounded-lg border border-slate-300 px-3 py-2"
          >
            <option value="F">여성</option>
            <option value="M">남성</option>
          </select>
        </div>
        <Button variant="secondary" className="mb-3" onClick={() => void handleCreateSubject()} disabled={isBusy}>
          대상자 등록
        </Button>

        <div className="space-y-2">
          {subjects.map((s) => (
            <label key={s.targetId} className="flex items-center gap-2 rounded-lg border border-slate-200 p-3">
              <input type="radio" checked={subjectId === s.targetId} onChange={() => setSubjectId(s.targetId)} />
              <span>{s.name}</span>
            </label>
          ))}
        </div>
        <Button variant="danger" className="mt-3" onClick={() => void handleRemoveSubject()} disabled={isBusy || !subjectId}>
          대상자 삭제
        </Button>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="mb-3 font-bold">장치 관리</h2>
        <input
          value={serialNumber}
          onChange={(e) => setSerialNumber(e.target.value)}
          className="mb-2 w-full rounded-lg border border-slate-300 px-3 py-2"
          placeholder="시리얼 번호"
        />
        <Button variant="secondary" className="mb-4" onClick={() => void handleConnectDevice()} disabled={isBusy}>
          장치 연결
        </Button>

        <input
          value={deviceId}
          onChange={(e) => setDeviceId(e.target.value)}
          className="mb-2 w-full rounded-lg border border-slate-300 px-3 py-2"
          placeholder="장치 ID"
        />
        <Button variant="secondary" onClick={() => void handleRemoveDevice()} disabled={isBusy}>
          장치 해제
        </Button>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="mb-3 flex items-center gap-2 font-bold">
          <Users className="h-4 w-4" />
          가족 공유
        </h2>

        <div className="flex items-center gap-2">
          <input
            value={shareCode}
            readOnly
            className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
            placeholder="공유 코드"
          />
          <Button variant="secondary" onClick={createShareCode}>
            생성
          </Button>
          <Button variant="secondary" onClick={() => void copyShareCode()} disabled={!shareCode} className="inline-flex items-center gap-1">
            <Copy className="h-4 w-4" />
            복사
          </Button>
        </div>

        <p className="mt-2 text-xs text-slate-500">
          생성된 공유 코드를 가족에게 전달하면, 같은 대상자의 상태를 함께 확인할 수 있습니다.
        </p>

        <div className="mt-4 space-y-2">
          {familyMembers.length === 0 ? (
            <p className="text-sm text-slate-500">아직 공유된 가족이 없습니다.</p>
          ) : (
            familyMembers.map((m) => (
              <div key={m.id} className="flex items-center justify-between rounded-lg border border-slate-200 p-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{m.name}</span>
                  <span className="text-xs text-slate-400">{m.role}</span>
                </div>
                <Button variant="danger" size="sm" onClick={() => removeFamily(m.id)}>
                  해제
                </Button>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-bold">
            <ClipboardList className="h-4 w-4" />
            신고 내역
          </h2>
          <Button variant="secondary" size="sm" onClick={onOpenReport}>
            전체보기
          </Button>
        </div>

        <div className="space-y-2">
          {reports.length === 0 ? (
            <p className="text-sm text-slate-500">신고 내역이 없습니다.</p>
          ) : (
            reports.slice(0, 3).map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={onOpenReport}
                className="flex w-full items-center justify-between rounded-lg border border-slate-200 p-3 text-left hover:bg-slate-50"
              >
                <div>
                  <p className="text-sm font-semibold">{r.title}</p>
                  <p className="text-xs text-slate-500">
                    {r.status} · {r.createdAt}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-400" />
              </button>
            ))
          )}
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <Button variant="secondary" className="mb-2 w-full" onClick={onLogout} disabled={isBusy}>
          <LogOut className="h-4 w-4" />
          로그아웃
        </Button>
        <button
          type="button"
          onClick={() => void handleWithdraw()}
          disabled={isBusy}
          className="w-full rounded-lg bg-red-600 px-4 py-3 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-70"
        >
          회원 탈퇴
        </button>
      </section>
    </div>
  );
}
