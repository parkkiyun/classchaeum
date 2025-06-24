import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from '../contexts/AuthContext'
import { useAppStore } from '../store/appStore'
import type { Group, GroupType } from '../types'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { Button } from '../components/ui/Button'
import { TabNavigation, type Tab } from '../components/ui/TabNavigation'

interface DashboardPageProps {
  searchTerm?: string
  onSearchChange?: (value: string) => void
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ 
  searchTerm = '', 
  onSearchChange 
}) => {
  const navigate = useNavigate()
  const { teacher } = useAuth()
  const { 
    // groups, 
    students,
    setGroups, 
    addGroup,
    getGroupsByTeacher,
    getGroupWithStudents
  } = useAppStore()
  
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [activeTab, setActiveTab] = useState<string>('my-classes')
  
  // 클래스 생성 폼 상태
  const [classForm, setClassForm] = useState({
    name: '',
    type: '담임' as GroupType,
    description: ''
  })

  // Firebase에서 클래스 데이터 로드
  const loadGroups = async () => {
    if (!teacher) return

    try {
      setLoading(true)
      const groupsRef = collection(db, 'groups')
      const q = query(groupsRef, where('teacherId', '==', teacher.uid))
      const querySnapshot = await getDocs(q)
      
      const loadedGroups: Group[] = []
      querySnapshot.forEach((doc) => {
        const data = doc.data()
        loadedGroups.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        } as Group)
      })
      
      setGroups(loadedGroups)
      console.log('클래스 데이터 로드 완료:', loadedGroups.length, '개')
    } catch (error) {
      console.error('클래스 데이터 로드 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadGroups()
  }, [teacher])

  // 클래스 생성
  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!teacher || creating) return

    try {
      setCreating(true)
      
      const newGroup: Omit<Group, 'id'> = {
        name: classForm.name,
        type: classForm.type,
        teacherId: teacher.uid,
        studentIds: [],
        description: classForm.description,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      const groupsRef = collection(db, 'groups')
      const docRef = await addDoc(groupsRef, newGroup)
      
      const createdGroup: Group = {
        id: docRef.id,
        ...newGroup
      }
      
      addGroup(createdGroup)
      setShowCreateModal(false)
      setClassForm({ name: '', type: '담임', description: '' })
      
      alert('클래스가 생성되었습니다.')
    } catch (error) {
      console.error('클래스 생성 실패:', error)
      alert('클래스 생성 중 오류가 발생했습니다.')
    } finally {
      setCreating(false)
    }
  }

  // 클래스 클릭 핸들러
  const handleGroupClick = (groupId: string) => {
    navigate(`/groups/${groupId}`)
  }

  const myGroups = teacher ? getGroupsByTeacher(teacher.uid) : []
  
  // 검색 필터링
  const filteredGroups = myGroups.filter(group =>
    group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (group.description || '').toLowerCase().includes(searchTerm.toLowerCase())
  )

  const tabs: Tab[] = [
    { id: 'my-classes', name: '내 클래스', count: myGroups.length },
    { id: 'recent', name: '최근 활동', count: 0 },
    { id: 'favorites', name: '즐겨찾기', count: 0 }
  ]

  // 클래스 타입별 아이콘 및 색상
  const getClassStyle = (type: GroupType) => {
    switch (type) {
      case '담임':
        return {
          bgColor: 'bg-blue-500',
          icon: '🏠',
          textColor: 'text-blue-600'
        }
      case '교과':
        return {
          bgColor: 'bg-green-500',
          icon: '📚',
          textColor: 'text-green-600'
        }
      case '동아리':
        return {
          bgColor: 'bg-purple-500',
          icon: '🎭',
          textColor: 'text-purple-600'
        }
      default:
        return {
          bgColor: 'bg-gray-500',
          icon: '📁',
          textColor: 'text-gray-600'
        }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">클래스 데이터를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 메인 콘텐츠 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 탭 네비게이션 */}
        <TabNavigation
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          className="mb-8"
        />

        {/* 클래스 그리드 */}
        {activeTab === 'my-classes' && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {/* 새 클래스 생성 카드 */}
            <div
              onClick={() => setShowCreateModal(true)}
              className="aspect-square bg-white rounded-2xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors group"
            >
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3 group-hover:bg-blue-100 transition-colors">
                <svg className="w-6 h-6 text-gray-400 group-hover:text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <p className="text-sm font-medium text-gray-600 group-hover:text-blue-600">새 클래스</p>
            </div>

            {/* 클래스 카드들 */}
            {filteredGroups.map(group => {
              const groupWithStudents = getGroupWithStudents(group.id, students)
              const classStyle = getClassStyle(group.type)
              
              return (
                <div
                  key={group.id}
                  onClick={() => handleGroupClick(group.id)}
                  className="aspect-square bg-white rounded-2xl shadow-sm border border-gray-200 p-4 cursor-pointer hover:shadow-md transition-all duration-200 flex flex-col"
                >
                  {/* 클래스 아이콘 */}
                  <div className="flex justify-between items-start mb-3">
                    <div className={`w-12 h-12 ${classStyle.bgColor} rounded-xl flex items-center justify-center text-white text-xl`}>
                      {classStyle.icon}
                    </div>
                    <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                  </div>

                  {/* 클래스 정보 */}
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900 text-sm mb-1 line-clamp-2">
                        {group.name}
                      </h3>
                      {group.description && (
                        <p className="text-xs text-gray-500 line-clamp-2 mb-2">
                          {group.description}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className={`text-xs px-2 py-1 rounded-full bg-gray-100 ${classStyle.textColor}`}>
                        {group.type}
                      </span>
                      <span className="text-xs text-gray-500">
                        {groupWithStudents?.students.length || 0}명
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* 다른 탭 콘텐츠 */}
        {activeTab === 'recent' && (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">최근 활동이 없습니다</h3>
            <p className="text-gray-500">클래스에서 활동을 시작해보세요</p>
          </div>
        )}

        {activeTab === 'favorites' && (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">즐겨찾는 클래스가 없습니다</h3>
            <p className="text-gray-500">자주 사용하는 클래스를 즐겨찾기에 추가해보세요</p>
          </div>
        )}

        {/* 빈 상태 */}
        {activeTab === 'my-classes' && filteredGroups.length === 0 && !searchTerm && (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">첫 번째 클래스를 만들어보세요</h3>
            <p className="text-gray-500 mb-6">클래스를 생성하고 학생들을 관리해보세요</p>
            <Button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              클래스 만들기
            </Button>
          </div>
        )}

        {/* 검색 결과 없음 */}
        {activeTab === 'my-classes' && filteredGroups.length === 0 && searchTerm && (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">검색 결과가 없습니다</h3>
            <p className="text-gray-500 mb-4">'<span className="font-medium">{searchTerm}</span>'에 대한 검색 결과가 없습니다</p>
            <button
              onClick={() => onSearchChange && onSearchChange('')}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              검색어 지우기
            </button>
          </div>
        )}
      </div>

      {/* 클래스 생성 모달 */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">새 클래스 만들기</h3>
            <form onSubmit={handleCreateGroup} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  클래스명
                </label>
                <input
                  type="text"
                  value={classForm.name}
                  onChange={(e) => setClassForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="예: 1학년 3반 담임"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  클래스 유형
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['담임', '교과', '동아리'] as GroupType[]).map((type) => {
                    const style = getClassStyle(type)
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setClassForm(prev => ({ ...prev, type }))}
                        className={`p-3 rounded-lg border-2 transition-colors ${
                          classForm.type === type
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className={`w-8 h-8 ${style.bgColor} rounded-lg flex items-center justify-center mx-auto mb-1`}>
                          <span className="text-white text-sm">{style.icon}</span>
                        </div>
                        <span className="text-xs font-medium text-gray-700">{type}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  설명 (선택사항)
                </label>
                <textarea
                  value={classForm.description}
                  onChange={(e) => setClassForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="클래스에 대한 간단한 설명을 입력하세요"
                />
              </div>
              
              <div className="flex space-x-3 pt-4">
                <Button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700"
                  disabled={creating}
                >
                  취소
                </Button>
                <Button
                  type="submit"
                  disabled={creating}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {creating ? (
                    <div className="flex items-center justify-center">
                      <LoadingSpinner size="sm" />
                      <span className="ml-2">생성 중...</span>
                    </div>
                  ) : (
                    '만들기'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
} 