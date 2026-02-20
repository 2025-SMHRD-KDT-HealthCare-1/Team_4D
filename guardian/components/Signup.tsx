import React, { useState } from 'react';
import { signup } from '../src/services/guardianApi';
import soinImg from '../soin.png';

interface SignupProps {
  onBack: () => void;
}

const SIGNUP_DRAFT_STORAGE_KEY = 'soin_guardian_signup_draft';

const emptySignupForm = {
  name: '',
  userId: '',
  password: '',
  confirmPassword: '',
  email: '',
  phone: '',
};

const loadSignupDraft = () => {
  try {
    const raw = window.localStorage.getItem(SIGNUP_DRAFT_STORAGE_KEY);
    if (!raw) return emptySignupForm;
    const parsed = JSON.parse(raw) as Partial<typeof emptySignupForm>;
    return {
      name: parsed.name ?? '',
      userId: parsed.userId ?? '',
      password: parsed.password ?? '',
      confirmPassword: parsed.confirmPassword ?? '',
      email: parsed.email ?? '',
      phone: parsed.phone ?? '',
    };
  } catch (error) {
    console.error(error);
    return emptySignupForm;
  }
};

export function Signup({ onBack }: SignupProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState(loadSignupDraft);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = { ...formData, [e.target.name]: e.target.value };
    setFormData(next);
    window.localStorage.setItem(SIGNUP_DRAFT_STORAGE_KEY, JSON.stringify(next));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const pwLenOk = formData.password.length >= 8 && formData.password.length <= 12;
    const cpwLenOk = formData.confirmPassword.length >= 8 && formData.confirmPassword.length <= 12;
    if (!pwLenOk || !cpwLenOk) {
      window.alert('비밀번호는 8~12자여야 합니다.');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      window.alert('비밀번호가 일치하지 않습니다.');
      return;
    }

    setIsLoading(true);
    setTimeout(async () => {
      try {
        await signup({ userId: formData.userId, name: formData.name, password: formData.password, email: formData.email });
        setIsLoading(false);
        window.localStorage.removeItem(SIGNUP_DRAFT_STORAGE_KEY);
        window.alert('회원가입이 완료되었습니다.');
        onBack();
      } catch (error) {
        setIsLoading(false);
        window.alert(error instanceof Error ? error.message : '회원가입에 실패했습니다.');
      }
    }, 1500);
  };

  return (
    <div className="flex min-h-screen items-start justify-center overflow-y-auto bg-slate-50 p-4 py-8">
      <div className="w-full max-w-md space-y-8 rounded-2xl bg-white p-8 shadow-xl">
        <div className="text-center">
          <div className="mx-auto mb-6 flex items-center justify-center">
            <img src={soinImg} alt="SOIN" className="h-16 w-auto" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">회원가입</h2>
          <p className="mt-2 text-sm text-slate-600">보호자 계정을 생성하세요</p>
        </div>

        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-slate-700">이름</label>
            <input
              name="name"
              required
              type="text"
              value={formData.name}
              onChange={handleChange}
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 sm:text-sm"
              placeholder="이름을 입력하세요"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">아이디</label>
            <input
              name="userId"
              required
              type="text"
              value={formData.userId}
              onChange={handleChange}
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 sm:text-sm"
              placeholder="아이디를 입력하세요"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">비밀번호</label>
            <input
              name="password"
              required
              minLength={8}
              maxLength={12}
              type="password"
              value={formData.password}
              onChange={handleChange}
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 sm:text-sm"
              placeholder="비밀번호를 입력하세요"
            />
            <p className="mt-1 text-xs text-slate-500">비밀번호는 8~12자</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">비밀번호 확인</label>
            <input
              name="confirmPassword"
              required
              minLength={8}
              maxLength={12}
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 sm:text-sm"
              placeholder="비밀번호를 다시 입력하세요"
            />
            <p className="mt-1 text-xs text-slate-500">비밀번호는 8~12자</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">이메일</label>
            <input
              name="email"
              required
              type="email"
              value={formData.email}
              onChange={handleChange}
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 sm:text-sm"
              placeholder="이메일을 입력하세요"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">전화번호</label>
            <input
              name="phone"
              required
              type="tel"
              value={formData.phone}
              onChange={handleChange}
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 sm:text-sm"
              placeholder="010-1234-5678"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="block flex w-full min-h-[48px] shrink-0 justify-center rounded-lg bg-emerald-600 px-4 py-3 text-sm font-bold text-white hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-70"
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
              {isLoading ? '가입 중...' : '가입하기'}
            </button>

            <button
              type="button"
              onClick={onBack}
              className="mt-4 w-full text-center text-xs text-slate-500 underline decoration-slate-300 underline-offset-2 transition-colors hover:text-slate-800"
            >
              이미 계정이 있으신가요? 로그인
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
