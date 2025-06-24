import React, { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'

interface TopNavigationProps {
  title?: string
  subtitle?: string
  showSearch?: boolean
  searchValue?: string
  onSearchChange?: (value: string) => void
  searchPlaceholder?: string
  children?: React.ReactNode
}

export const TopNavigation: React.FC<TopNavigationProps> = ({
  title = "클래스채움",
  subtitle = "AI 기반 생활기록부 생성 시스템",
  showSearch = false,
  searchValue = "",
  onSearchChange,
  searchPlaceholder = "검색...",
  children
}) => {
  const { teacher } = useAuth()
  const [showMobileSearch, setShowMobileSearch] = useState(false)

  return (
    <>
      {/* 상단 헤더 */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4 lg:ml-0 ml-16">
              <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
              <div className="hidden md:flex items-center space-x-2 text-sm text-gray-500">
                <span>{subtitle}</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* 검색 */}
              {showSearch && (
                <div className="relative hidden md:block">
                  <input
                    type="text"
                    placeholder={searchPlaceholder}
                    value={searchValue}
                    onChange={(e) => onSearchChange?.(e.target.value)}
                    className="w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <svg className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              )}
              
              {/* 모바일 검색 버튼 */}
              {showSearch && (
                <button 
                  onClick={() => setShowMobileSearch(!showMobileSearch)}
                  className="md:hidden p-2 text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              )}
              
              {/* 추가 액션 버튼들 */}
              {children}
              
              {/* 사용자 정보 */}
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {teacher?.name?.charAt(0) || 'T'}
                  </span>
                </div>
                <div className="hidden md:block">
                  <p className="text-sm font-medium text-gray-900">{teacher?.name}</p>
                  <p className="text-xs text-gray-500">{teacher?.email}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 모바일 검색 바 */}
      {showSearch && showMobileSearch && (
        <div className="md:hidden bg-white border-b border-gray-200 px-4 py-3">
          <div className="relative">
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={(e) => onSearchChange?.(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoFocus
            />
            <svg className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      )}
    </>
  )
} 