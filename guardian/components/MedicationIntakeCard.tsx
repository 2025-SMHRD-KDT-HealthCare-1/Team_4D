import React, { useMemo, useState } from 'react';
import { Bell, CheckCircle2, Pill, RotateCcw } from 'lucide-react';
import { Button } from './ui/Button';

type MedicationSlotKey = 'morning' | 'lunch' | 'dinner';

interface MedicationSlot {
  key: MedicationSlotKey;
  label: string;
  reminderTime: string;
}

interface MedicationStateItem {
  checked: boolean;
  checkedAt?: string;
}

type MedicationState = Record<MedicationSlotKey, MedicationStateItem>;

const MEDICATION_SLOTS: MedicationSlot[] = [
  { key: 'morning', label: '아침', reminderTime: '08:00' },
  { key: 'lunch', label: '점심', reminderTime: '12:00' },
  { key: 'dinner', label: '저녁', reminderTime: '18:00' },
];

const createDefaultState = (): MedicationState => ({
  morning: { checked: false },
  lunch: { checked: false },
  dinner: { checked: false },
});

const formatDateKey = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}${m}${d}`;
};

const getStorageKey = (): string => `soin_med_intake_${formatDateKey(new Date())}`;

const readTodayState = (): MedicationState => {
  try {
    const raw = localStorage.getItem(getStorageKey());
    if (!raw) return createDefaultState();
    const parsed = JSON.parse(raw) as Partial<MedicationState>;
    return {
      morning: parsed.morning ?? { checked: false },
      lunch: parsed.lunch ?? { checked: false },
      dinner: parsed.dinner ?? { checked: false },
    };
  } catch {
    return createDefaultState();
  }
};

const formatNowTime = (): string =>
  new Date().toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

const minutesUntilTodayTime = (time: string): number => {
  const [h, m] = time.split(':').map(Number);
  const now = new Date();
  const target = new Date();
  target.setHours(h, m, 0, 0);
  return Math.floor((target.getTime() - now.getTime()) / 60000);
};

export function MedicationIntakeCard() {
  const [intakeState, setIntakeState] = useState<MedicationState>(() => readTodayState());
  const [reminderOn, setReminderOn] = useState(false);
  const [reminderMessage, setReminderMessage] = useState('');

  const completedCount = useMemo(
    () => MEDICATION_SLOTS.filter((slot) => intakeState[slot.key].checked).length,
    [intakeState],
  );
  const percent = Math.round((completedCount / MEDICATION_SLOTS.length) * 100);

  const saveState = (next: MedicationState) => {
    setIntakeState(next);
    localStorage.setItem(getStorageKey(), JSON.stringify(next));
  };

  const toggleSlot = (slotKey: MedicationSlotKey) => {
    const current = intakeState[slotKey];
    const next: MedicationState = {
      ...intakeState,
      [slotKey]: current.checked
        ? { checked: false }
        : {
            checked: true,
            checkedAt: formatNowTime(),
          },
    };
    saveState(next);
  };

  const resetToday = () => {
    const next = createDefaultState();
    saveState(next);
    setReminderMessage('오늘 복용 기록을 초기화했습니다.');
  };

  const requestReminder = async () => {
    if (!('Notification' in window)) {
      setReminderMessage('이 브라우저는 알림 기능을 지원하지 않습니다.');
      return;
    }

    const permission =
      Notification.permission === 'default'
        ? await Notification.requestPermission()
        : Notification.permission;

    if (permission !== 'granted') {
      setReminderMessage('알림 권한이 필요합니다. 브라우저 설정에서 허용해주세요.');
      return;
    }

    setReminderOn(true);
    setReminderMessage('오늘 미복용 시간에 맞춰 알림을 시도합니다.');

    MEDICATION_SLOTS.forEach((slot) => {
      const minutes = minutesUntilTodayTime(slot.reminderTime);
      if (minutes <= 0) return;
      if (intakeState[slot.key].checked) return;
      window.setTimeout(() => {
        if (intakeState[slot.key].checked) return;
        new Notification(`약 복용 알림 (${slot.label})`, {
          body: `${slot.label} 약 복용을 확인해주세요.`,
          tag: `soin-med-${slot.key}-${formatDateKey(new Date())}`,
        });
      }, minutes * 60 * 1000);
    });
  };

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900">약 복용 확인</h2>
          <p className="mt-1 text-sm text-slate-600">
            오늘 {MEDICATION_SLOTS.length}개 중 {completedCount}개 완료 ({percent}%)
          </p>
        </div>
        <Pill className="h-6 w-6 text-[#189877]" />
      </div>

      <div className="space-y-2">
        {MEDICATION_SLOTS.map((slot) => {
          const item = intakeState[slot.key];
          return (
            <button
              key={slot.key}
              type="button"
              onClick={() => toggleSlot(slot.key)}
              role="button"
              aria-pressed={item.checked}
              className={`flex h-12 w-full items-center justify-between rounded-lg border px-3 text-sm font-semibold transition-colors duration-200 ${
                item.checked
                  ? 'border-emerald-300 bg-emerald-100 text-[#0f5132]'
                  : 'border-slate-200 bg-white text-slate-800 hover:bg-slate-50'
              }`}
            >
              <span className="inline-flex items-center gap-2">
                <CheckCircle2 className="h-6 w-6" color={item.checked ? '#189877' : '#cbd5e1'}/>
                {slot.label}
              </span>
              <span className="text-xs text-slate-500">
                {item.checked && item.checkedAt ? `${item.checkedAt} 체크` : `${slot.reminderTime} 알림`}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Button variant="secondary" size="sm" onClick={resetToday} className="h-10 min-h-10 px-3">
          <RotateCcw className="h-4 w-4" />
          오늘 초기화
        </Button>
        <Button
          variant={reminderOn ? 'primary' : 'secondary'}
          size="sm"
          onClick={requestReminder}
          className="h-10 min-h-10 px-3"
        >
          <Bell className="h-4 w-4" />
          {reminderOn ? '리마인드 켜짐' : '리마인드 켜기'}
        </Button>
      </div>

      {reminderMessage ? <p className="mt-3 text-sm text-slate-600">{reminderMessage}</p> : null}
    </section>
  );
}
