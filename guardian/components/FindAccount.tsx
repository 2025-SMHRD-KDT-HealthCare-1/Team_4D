import React, { useState } from 'react';
import { findId, findPassword } from '../src/services/guardianApi';
import soinImg from '../soin.png';

type FindMode = 'id' | 'pw';

interface FindAccountProps {
  initialMode: FindMode;
  onBack: () => void;
}

export function FindAccount({ initialMode, onBack }: FindAccountProps) {
  const [mode] = useState<FindMode>(initialMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [userId, setUserId] = useState('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      if (mode === 'id') {
        const response = await findId({ name, email });
        window.alert(`회원님의 아이디는 ${response.userId} 입니다.`);
      } else {
        await findPassword({ userId, name, email });
        window.alert('임시 비밀번호가 이메일로 전송되었습니다.');
      }
      onBack();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : '요청에 실패했습니다.');
    }
  };

  return (
    <div className="flex min-h-screen items-start justify-center overflow-y-auto bg-slate-50 p-4 py-8">
      <div className="w-full max-w-md space-y-8 rounded-2xl bg-white p-8 shadow-xl">
        <div className="text-center">
          <div className="mx-auto mb-6 flex items-center justify-center">
            <img src={soinImg} alt="SOIN" className="h-16 w-auto" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">{mode === 'id' ? '아이디 찾기' : '비밀번호 찾기'}</h2>
          <p className="mt-2 text-sm text-slate-600">가입 시 입력한 정보를 입력해주세요.</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">이름</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 sm:text-sm"
              />
            </div>

            {mode === 'pw' ? (
              <div>
                <label className="block text-sm font-medium text-slate-700">아이디</label>
                <input
                  type="text"
                  required
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 sm:text-sm"
                />
              </div>
            ) : null}

            <div>
              <label className="block text-sm font-medium text-slate-700">이메일</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 sm:text-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            className="block flex w-full min-h-[48px] shrink-0 justify-center rounded-lg bg-emerald-600 px-4 py-3 text-sm font-bold text-white hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            style={{
              backgroundColor: '#059669',
              color: '#ffffff',
              width: '100%',
              padding: '12px 16px',
              borderRadius: '8px',
              fontWeight: 700,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            {mode === 'id' ? '아이디 찾기' : '비밀번호 찾기'}
          </button>

          <button
            type="button"
            onClick={onBack}
            className="w-full text-center text-xs text-slate-500 underline decoration-slate-300 underline-offset-2 transition-colors hover:text-slate-800"
          >
            로그인 화면으로 돌아가기
          </button>
        </form>
      </div>
    </div>
  );
}
