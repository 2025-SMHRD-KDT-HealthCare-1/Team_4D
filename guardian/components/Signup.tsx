import React, { useState } from 'react';
import { signup } from '../src/services/guardianApi';
import soinImg from '../soin.png';

interface SignupProps {
  onBack: () => void;
}

const SIGNUP_DRAFT_STORAGE_KEY = 'soin_guardian_signup_draft';

const emptySignupForm = {
  login_id: '',
  name: '',
  password: '',
  confirmPassword: '',
  email: '',
};

const loadSignupDraft = () => {
  try {
    const raw = window.localStorage.getItem(SIGNUP_DRAFT_STORAGE_KEY);
    if (!raw) return emptySignupForm;
    const parsed = JSON.parse(raw) as Partial<typeof emptySignupForm>;
    return {
      login_id: parsed.login_id ?? '',
      name: parsed.name ?? '',
      password: parsed.password ?? '',
      confirmPassword: parsed.confirmPassword ?? '',
      email: parsed.email ?? '',
    };
  } catch (error) {
    console.error('[signup] failed to load draft', error);
    return emptySignupForm;
  }
};

export function Signup({ onBack }: SignupProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [formData, setFormData] = useState(loadSignupDraft);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = { ...formData, [e.target.name]: e.target.value };
    setFormData(next);
    window.localStorage.setItem(SIGNUP_DRAFT_STORAGE_KEY, JSON.stringify(next));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const login_id = formData.login_id.trim().toLowerCase();
    const name = formData.name.trim();
    const email = formData.email.trim().toLowerCase();

    if (!login_id || !name || !email) {
      setErrorMessage('필수 항목을 모두 입력해 주세요.');
      return;
    }

    if (!/^[a-zA-Z0-9_]{4,20}$/.test(login_id)) {
      setErrorMessage('아이디는 4~20자의 영문/숫자/_만 사용할 수 있습니다.');
      return;
    }

    const pwLenOk = formData.password.length >= 8 && formData.password.length <= 12;
    const cpwLenOk = formData.confirmPassword.length >= 8 && formData.confirmPassword.length <= 12;
    if (!pwLenOk || !cpwLenOk) {
      setErrorMessage('비밀번호는 8~12자여야 합니다.');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setErrorMessage('비밀번호 확인이 일치하지 않습니다.');
      return;
    }

    setIsLoading(true);
    try {
      await signup({
        login_id,
        name,
        password: formData.password,
        email,
        role: 'GUARDIAN',
      });

      window.localStorage.removeItem(SIGNUP_DRAFT_STORAGE_KEY);
      window.alert('회원가입이 완료되었습니다.');
      onBack();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '회원가입에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-start justify-center overflow-y-auto bg-slate-50 p-4 py-8">
      <div className="w-full max-w-md space-y-8 rounded-2xl bg-white p-8 shadow-xl">
        <div className="text-center">
          <div className="mx-auto mb-6 flex items-center justify-center">
            <img src={soinImg} alt="SOIN" className="h-16 w-auto" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">회원가입</h2>
          <p className="mt-2 text-sm text-slate-600">보호자 계정을 생성해 주세요.</p>
        </div>

        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="signup-login-id" className="block text-sm font-medium text-slate-700">
              아이디
            </label>
            <input
              id="signup-login-id"
              name="login_id"
              required
              type="text"
              value={formData.login_id}
              onChange={handleChange}
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 sm:text-sm"
              placeholder=""
            />
          </div>

          <div>
            <label htmlFor="signup-name" className="block text-sm font-medium text-slate-700">
              이름
            </label>
            <input
              id="signup-name"
              name="name"
              required
              type="text"
              value={formData.name}
              onChange={handleChange}
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 sm:text-sm"
              placeholder=""
            />
          </div>

          <div>
            <label htmlFor="signup-email" className="block text-sm font-medium text-slate-700">
              이메일
            </label>
            <input
              id="signup-email"
              name="email"
              required
              type="email"
              value={formData.email}
              onChange={handleChange}
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 sm:text-sm"
              placeholder=""
            />
          </div>

          <div>
            <label htmlFor="signup-password" className="block text-sm font-medium text-slate-700">
              비밀번호
            </label>
            <input
              id="signup-password"
              name="password"
              required
              minLength={8}
              maxLength={12}
              type="password"
              value={formData.password}
              onChange={handleChange}
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 sm:text-sm"
              placeholder=""
            />
          </div>

          <div>
            <label htmlFor="signup-confirm-password" className="block text-sm font-medium text-slate-700">
              비밀번호 확인
            </label>
            <input
              id="signup-confirm-password"
              name="confirmPassword"
              required
              minLength={8}
              maxLength={12}
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 sm:text-sm"
              placeholder=""
            />
          </div>

          {errorMessage ? <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{errorMessage}</p> : null}

          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary-action h-12 w-full disabled:opacity-50 flex items-center justify-center gap-2 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
            >
              {isLoading ? '가입 중...' : '가입하기'}
            </button>

            <button
              type="button"
              onClick={onBack}
              className="mt-4 w-full text-center text-xs text-slate-500 underline decoration-slate-300 underline-offset-2 transition-colors hover:text-slate-800"
            >
              이미 계정이 있나요? 로그인
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
