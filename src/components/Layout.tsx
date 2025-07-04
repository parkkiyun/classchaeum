import React, { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { TopNavigation } from './TopNavigation'
import { Menu } from 'lucide-react'

interface LayoutProps {
  children: React.ReactNode
  title?: string
  subtitle?: string
  showSearch?: boolean
  searchValue?: string
  onSearchChange?: (value: string) => void
  searchPlaceholder?: string
  headerActions?: React.ReactNode
}

export const Layout: React.FC<LayoutProps> = ({ 
  children, 
  title,
  subtitle,
  showSearch = false,
  searchValue,
  onSearchChange,
  searchPlaceholder,
  headerActions
}) => {
  // const location = useLocation()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <div className="flex h-screen bg-gray-100">
      {/* 사이드바 */}
      <Sidebar 
        isOpen={isMobileMenuOpen} 
        onClose={() => setIsMobileMenuOpen(false)} 
      />

      {/* 메인 콘텐츠 */}
      <main className="flex-1 overflow-y-auto">
        {/* 상단 네비게이션 */}
        <TopNavigation
          title={title}
          subtitle={subtitle}
          showSearch={showSearch}
          searchValue={searchValue}
          onSearchChange={onSearchChange}
          searchPlaceholder={searchPlaceholder}
          onMenuClick={() => setIsMobileMenuOpen(true)}
        >
          {headerActions}
        </TopNavigation>

        {/* 페이지 콘텐츠 */}
        <div className="min-h-screen bg-gray-50">
          {children}
        </div>
      </main>
    </div>
  )
} 