import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { LoadingSpinner } from './ui/LoadingSpinner'

interface ProtectedRouteProps {
  children: React.ReactNode
}

const PendingApprovalPage: React.FC = () => {
  const { teacher, logout } = useAuth()

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error('로그아웃 실패:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100">
            <svg className="h-6 w-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="mt-4 text-lg font-medium text-gray-900">승인 대기 중</h3>
          <p className="mt-2 text-sm text-gray-600">
            회원가입이 완료되었습니다.<br />
            관리자의 승인을 기다리고 있습니다.
          </p>
          <div className="mt-4 p-4 bg-gray-50 rounded-md">
            <p className="text-sm text-gray-700">
              <strong>이메일:</strong> {teacher?.email}
            </p>
            <p className="text-sm text-gray-700">
              <strong>이름:</strong> {teacher?.name}
            </p>
          </div>
          <p className="mt-4 text-xs text-gray-500">
            승인까지 시간이 걸릴 수 있습니다.<br />
            문의사항이 있으시면 관리자에게 연락해주세요.
          </p>
          <button
            onClick={handleLogout}
            className="mt-6 w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            로그아웃
          </button>
        </div>
      </div>
    </div>
  )
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { currentUser, teacher, loading } = useAuth()

  // 로딩 중
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">로그인 상태를 확인하고 있습니다...</p>
        </div>
      </div>
    )
  }

  // 로그인하지 않은 경우
  if (!currentUser) {
    return <Navigate to="/login" replace />
  }

  // 교사 정보가 없는 경우 (데이터 로딩 중)
  if (!teacher) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">교사 정보를 불러오고 있습니다...</p>
        </div>
      </div>
    )
  }

  // 승인 대기 중인 경우
  if (!teacher.isApproved) {
    return <PendingApprovalPage />
  }

  // 승인된 교사만 접근 허용
  return <>{children}</>
} 