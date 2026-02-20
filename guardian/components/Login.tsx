import React, { useState } from 'react';
import { Lock, Eye, EyeOff } from 'lucide-react';
import { login } from '../src/services/guardianApi';
import type { LoginResponse } from '../src/types/dto';
import soinImg from '../soin.png';

type FindMode = 'id' | 'pw';

interface LoginProps {
  onLogin: (user: LoginResponse['user']) => void;
  onSignupClick: () => void;
  onFindClick: (mode: FindMode) => void;
}

export function Login({ onLogin, onSignupClick, onFindClick }: LoginProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    try {
      const result = await login({ login_id: loginId, password });
      onLogin(result.user);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '로그인에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center overflow-y-auto bg-slate-50 p-4">
      <div className="w-full max-w-md space-y-8 rounded-2xl bg-white p-6 shadow-xl sm:p-8">
        <div className="text-center">
          <div className="mx-auto mb-6 flex items-center justify-center">
            <img src={soinImg} alt="SOIN" className="h-16 w-auto" />
          </div>
          <p className="mt-2 text-sm text-slate-600">보호자 안전 케어 서비스 로그인</p>
        </div>

        <form className="mt-6 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">아이디</label>
              <input
                required
                value={loginId}
                onChange={(event) => setLoginId(event.target.value)}
                className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 placeholder-slate-400 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 sm:text-sm"
                placeholder=""
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">비밀번호</label>
              <div className="relative mt-1">
                <input
                  required
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="block w-full rounded-lg border border-slate-300 px-3 py-2 placeholder-slate-400 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 sm:text-sm"
                  placeholder=""
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400"
                  onClick={() => setShowPassword((prev) => !prev)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>

          {errorMessage ? <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{errorMessage}</p> : null}

          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary-action h-12 w-full disabled:opacity-50 flex items-center justify-center gap-2 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
          >
            {isLoading ? (
              <svg className="h-5 w-5 animate-spin text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
              </svg>
            ) : (
              <>
                <Lock className="h-5 w-5 text-white" />
                로그인하기
              </>
            )}
          </button>

          <div className="mt-6 flex items-center justify-center gap-3 text-xs text-slate-500">
            <button type="button" onClick={() => onFindClick('id')} className="transition-colors hover:text-emerald-600">
              아이디 찾기
            </button>
            <span className="h-3 w-px bg-slate-300" />
            <button type="button" onClick={() => onFindClick('pw')} className="transition-colors hover:text-emerald-600">
              비밀번호 찾기
            </button>
            <span className="h-3 w-px bg-slate-300" />
            <button type="button" onClick={onSignupClick} className="transition-colors hover:text-emerald-600">
              회원가입
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
