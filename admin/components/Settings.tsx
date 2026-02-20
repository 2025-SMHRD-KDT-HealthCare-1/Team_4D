import React from 'react';
import { User, Save } from 'lucide-react';

export const Settings: React.FC = () => {
  const adminUser = {
    userId: 'USR-0001',
    name: '관리자',
    email: 'soin123@naver.com',
    role: 'ADMIN' as const,
    createdAt: '2024-01-01T09:00:00Z',
    lastLoginAt: '2024-02-04T10:20:00Z',
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center gap-3">
          <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
            <User className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-gray-800">관리자 계정 관리</h3>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">이름</label>
              <input
                type="text"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                defaultValue={adminUser.name}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
              <input
                type="email"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                defaultValue={adminUser.email}
              />
            </div>
          </div>
          <div className="pt-4 flex justify-end">
            <button className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 font-medium text-sm flex items-center gap-2">
              <Save className="w-4 h-4" /> 저장
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
