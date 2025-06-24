import React from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Button } from './ui/Button'

export const PendingApprovalPage: React.FC = () => {
  const { teacher, logout } = useAuth()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-50 to-orange-100">
      <div className="max-w-md w-full p-8">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          {/* 아이콘 */}
          <div className="mx-auto h-16 w-16 bg-yellow-100 rounded-full flex items-center justify-center mb-6">
            <svg className="h-8 w-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>

          {/* 제목 */}
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            승인 대기 중
          </h2>

          {/* 설명 */}
          <div className="text-gray-600 mb-6 space-y-3">
            <p className="font-medium">
              안녕하세요, <span className="text-blue-600">{teacher?.name}</span>님!
            </p>
            <p className="text-sm leading-relaxed">
              회원가입이 완료되었습니다.<br/>
              관리자의 승인을 기다리고 있습니다.
            </p>
          </div>

          {/* 계정 정보 */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">이메일:</span>
                <span className="font-medium">{teacher?.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">가입일:</span>
                <span className="font-medium">
                  {teacher?.createdAt ? new Date(teacher.createdAt).toLocaleDateString('ko-KR') : '-'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">상태:</span>
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  승인 대기
                </span>
              </div>
            </div>
          </div>

          {/* 안내 메시지 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="text-left space-y-2 text-sm text-blue-800">
              <p className="font-medium">📋 승인 절차 안내</p>
              <div className="space-y-1 text-xs">
                <p>• 관리자가 교사 명단을 확인합니다</p>
                <p>• 승인 완료 시 이메일로 알림을 받습니다</p>
                <p>• 승인 후 시스템 이용이 가능합니다</p>
              </div>
            </div>
          </div>

          {/* 문의 안내 */}
          <div className="text-xs text-gray-500 mb-6">
            <p>승인 관련 문의는 시스템 관리자에게 연락해주세요.</p>
          </div>

          {/* 로그아웃 버튼 */}
          <Button
            onClick={logout}
            variant="outline"
            className="w-full"
          >
            로그아웃
          </Button>
        </div>

        {/* 앱 정보 */}
        <div className="mt-6 text-center">
          <div className="text-xs text-gray-600">
            <p className="font-medium mb-1">한올채움</p>
            <p>한올고등학교 교사 전용 AI 생활기록부 생성 시스템</p>
          </div>
        </div>
      </div>
    </div>
  )
} 