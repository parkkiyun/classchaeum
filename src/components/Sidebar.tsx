import React, { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { 
  Users, 
  FileText, 
  BarChart3, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  Home,
  UserCircle,
  Shield
} from 'lucide-react'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const location = useLocation()
  const navigate = useNavigate()
  const { teacher, logout } = useAuth()

  const handleLogout = async () => {
    try {
      await logout()
      navigate('/login')
    } catch (error) {
      console.error('로그아웃 실패:', error)
    }
  }

  // 관리자 권한 확인
  const isAdmin = teacher?.isApproved && (
    teacher.email === 'admin@hanol.hs.kr' || 
    teacher.email === 'kiyun0515@hanol.hs.kr'
  )

  const menuItems = [
    {
      icon: Home,
      label: '대시보드',
      path: '/',
      active: location.pathname === '/' || location.pathname === '/dashboard'
    },
    {
      icon: Settings,
      label: '설정',
      path: '/settings',
      active: location.pathname.startsWith('/settings')
    }
  ]

  // 관리자 메뉴 추가
  if (isAdmin) {
    menuItems.push({
      icon: Shield,
      label: '관리자',
      path: '/admin',
      active: location.pathname === '/admin'
    })
  }

  return (
    <>
      {/* 데스크톱 사이드바 */}
      <aside className="hidden lg:flex w-64 bg-gray-800 text-white flex-col p-6 rounded-r-2xl shadow-lg">
        {/* 로고 */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-blue-300">클래스채움</h1>
          <p className="text-gray-400 text-sm mt-1">AI 생활기록부 생성</p>
        </div>

        {/* 네비게이션 메뉴 */}
        <nav className="flex-1">
          <ul className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                      item.active
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    }`}
                  >
                    <Icon size={20} />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* 사용자 정보 */}
        <div className="mt-auto pt-4 border-t border-gray-700">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
              <UserCircle size={24} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {teacher?.name || '사용자'}
              </p>
              <p className="text-xs text-gray-400 truncate">
                {teacher?.email}
              </p>
              {isAdmin && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 mt-1">
                  관리자
                </span>
              )}
            </div>
          </div>
          
          <button
            onClick={handleLogout}
            className="flex items-center space-x-3 w-full px-4 py-2 text-gray-300 hover:bg-gray-700 hover:text-white rounded-lg transition-colors"
          >
            <LogOut size={16} />
            <span className="text-sm">로그아웃</span>
          </button>
        </div>
      </aside>

      {/* 모바일 사이드바 */}
      {isOpen && (
        <>
          {/* 오버레이 */}
          <div
            className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={onClose}
          />
          
          {/* 사이드바 */}
          <aside className="lg:hidden fixed left-0 top-0 h-full w-64 bg-gray-800 text-white flex flex-col p-6 z-50 transform transition-transform">
            {/* 헤더 */}
            <div className="flex justify-between items-center mb-8">
              <div>
                <h1 className="text-xl font-bold text-blue-300">클래스채움</h1>
                <p className="text-gray-400 text-xs mt-1">AI 생활기록부 생성</p>
              </div>
              <button
                onClick={onClose}
                className="p-1 hover:bg-gray-700 rounded"
              >
                <X size={20} />
              </button>
            </div>

            {/* 네비게이션 메뉴 */}
            <nav className="flex-1">
              <ul className="space-y-2">
                {menuItems.map((item) => {
                  const Icon = item.icon
                  return (
                    <li key={item.path}>
                      <Link
                        to={item.path}
                        onClick={onClose}
                        className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                          item.active
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                        }`}
                      >
                        <Icon size={20} />
                        <span className="font-medium">{item.label}</span>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </nav>

            {/* 사용자 정보 */}
            <div className="mt-auto pt-4 border-t border-gray-700">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <UserCircle size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {teacher?.name || '사용자'}
                  </p>
                  <p className="text-xs text-gray-400 truncate">
                    {teacher?.email}
                  </p>
                  {isAdmin && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 mt-1">
                      관리자
                    </span>
                  )}
                </div>
              </div>
              
              <button
                onClick={handleLogout}
                className="flex items-center space-x-3 w-full px-4 py-2 text-gray-300 hover:bg-gray-700 hover:text-white rounded-lg transition-colors"
              >
                <LogOut size={16} />
                <span className="text-sm">로그아웃</span>
              </button>
            </div>
          </aside>
        </>
      )}
    </>
  )
} 