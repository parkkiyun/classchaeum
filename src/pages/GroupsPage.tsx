import React from 'react'
import { Navigate } from 'react-router-dom'

export const GroupsPage: React.FC = () => {
  // 그룹 페이지는 이제 홈(대시보드)으로 리다이렉트
  return <Navigate to="/" replace />
} 