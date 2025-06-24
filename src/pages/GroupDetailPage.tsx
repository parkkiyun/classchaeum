import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from '../contexts/AuthContext'
import { useAppStore } from '../store/appStore'
import type { Group } from '../types'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { TabNavigation, type Tab } from '../components/ui/TabNavigation'
import { SurveyManagementPage } from './groups/SurveyManagementPage'
import { RecordsPage } from './groups/RecordsPage'
import { HanolchaeumPage } from './groups/HanolchaeumPage'

type TabType = 'dashboard' | 'survey-management' | 'records' | 'hanolchaeum'

const tabs: Tab[] = [
  { id: 'dashboard', name: '클래스 대시보드', icon: '📊' },
  { id: 'survey-management', name: '설문 관리', icon: '📋' },
  { id: 'records', name: '기록 조회', icon: '📝' },
  { id: 'hanolchaeum', name: '클래스채움', icon: '🤖' }
]

export const GroupDetailPage: React.FC = () => {
  const { groupId } = useParams<{ groupId: string }>()
  const navigate = useNavigate()
  const { teacher } = useAuth()
  const { groups, students, getGroupWithStudents } = useAppStore()
  
  const [activeTab, setActiveTab] = useState<string>('dashboard')
  const [currentGroup, setCurrentGroup] = useState<Group | null>(null)
  const [loading, setLoading] = useState(true)

  // URL 해시를 통한 탭 설정
  useEffect(() => {
    const hash = window.location.hash.replace('#', '')
    if (hash === 'surveys') {
      setActiveTab('survey-management')
    }
  }, [])

  // 클래스 정보 로드
  useEffect(() => {
    const loadGroup = async () => {
      if (!groupId || !teacher) return

      try {
        setLoading(true)
        
        // 먼저 store에서 찾기
        const groupFromStore = groups.find(g => g.id === groupId)
        if (groupFromStore) {
          // 권한 확인
          if (groupFromStore.teacherId !== teacher.uid) {
            alert('이 클래스에 접근할 권한이 없습니다.')
            navigate('/')
            return
          }
          setCurrentGroup(groupFromStore)
        } else {
          // Firebase에서 직접 로드
          const groupRef = doc(db, 'groups', groupId)
          const groupSnap = await getDoc(groupRef)
          
          if (groupSnap.exists()) {
            const groupData = groupSnap.data()
            const group: Group = {
              id: groupSnap.id,
              ...groupData,
              createdAt: groupData.createdAt?.toDate() || new Date(),
              updatedAt: groupData.updatedAt?.toDate() || new Date()
            } as Group
            
            // 권한 확인
            if (group.teacherId !== teacher.uid) {
              alert('이 클래스에 접근할 권한이 없습니다.')
              navigate('/')
              return
            }
            
            setCurrentGroup(group)
          } else {
            alert('클래스를 찾을 수 없습니다.')
            navigate('/')
            return
          }
        }
      } catch (error) {
        console.error('클래스 로드 실패:', error)
        alert('클래스를 불러오는 중 오류가 발생했습니다.')
        navigate('/')
      } finally {
        setLoading(false)
      }
    }

    loadGroup()
  }, [groupId, teacher, groups, navigate])

  const renderTabContent = () => {
    if (!currentGroup) return null

    switch (activeTab) {
      case 'dashboard':
        return <GroupDashboard group={currentGroup} />
      case 'survey-management':
        return <SurveyManagementPage />
      case 'records':
        return <RecordsPage />
      case 'hanolchaeum':
        return <HanolchaeumPage />
      default:
        return <GroupDashboard group={currentGroup} />
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">클래스 정보를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  if (!currentGroup) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">클래스를 찾을 수 없습니다</h2>
          <p className="mt-2 text-gray-600">요청하신 클래스가 존재하지 않거나 접근 권한이 없습니다.</p>
          <button
            onClick={() => navigate('/')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            홈으로 돌아가기
          </button>
        </div>
      </div>
    )
  }

  const groupWithStudents = getGroupWithStudents(currentGroup.id, students)

  return (
    <div className="p-6 space-y-6">
      {/* 클래스 헤더 */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/')}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{currentGroup.name}</h1>
              <p className="text-gray-600">{currentGroup.description}</p>
            </div>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              currentGroup.type === '담임' ? 'bg-blue-100 text-blue-800' :
              currentGroup.type === '교과' ? 'bg-green-100 text-green-800' :
              'bg-purple-100 text-purple-800'
            }`}>
              {currentGroup.type}
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <div className="text-sm text-gray-600">배정된 학생</div>
              <div className="text-lg font-semibold text-gray-900">
                {groupWithStudents?.students.length || 0}명
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 탭 네비게이션 */}
      <TabNavigation
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* 탭 콘텐츠 */}
      <div className="mt-6">
        {renderTabContent()}
      </div>
    </div>
  )
}

// 클래스 대시보드 컴포넌트
const GroupDashboard: React.FC<{ group: Group }> = ({ group }) => {
  const { students, getGroupWithStudents, removeStudentFromGroup } = useAppStore()
  const navigate = useNavigate()
  
  const groupWithStudents = getGroupWithStudents(group.id, students)

  const handleRemoveStudent = async (studentId: string) => {
    if (!confirm('이 학생을 클래스에서 제거하시겠습니까?')) return
    
    try {
      await removeStudentFromGroup(group.id, studentId)
      alert('학생이 클래스에서 제거되었습니다.')
    } catch (error) {
      console.error('학생 제거 실패:', error)
      alert('학생 제거 중 오류가 발생했습니다.')
    }
  }

  const handleAssignStudents = () => {
    navigate(`/groups/${group.id}/assign-students`)
  }

  return (
    <div className="space-y-6">
      {/* 클래스 개요 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
              </svg>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">배정된 학생</dt>
                <dd className="text-lg font-medium text-gray-900">{groupWithStudents?.students.length || 0}명</dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">설문 응답</dt>
                <dd className="text-lg font-medium text-gray-900">0개</dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-8 w-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">생성된 기록</dt>
                <dd className="text-lg font-medium text-gray-900">0개</dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      {/* 학생 목록 */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">배정된 학생 목록</h3>
          <button
            onClick={handleAssignStudents}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center space-x-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span>학생배정</span>
          </button>
        </div>
        
        {!groupWithStudents || groupWithStudents.students.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
            </svg>
            <h4 className="mt-2 text-sm font-medium text-gray-900">배정된 학생이 없습니다</h4>
            <p className="mt-1 text-sm text-gray-500">
              학생배정 버튼을 클릭하여 학생을 배정해보세요.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">학생 정보</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">학번</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">설문 상태</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">기록 상태</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">관리</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {groupWithStudents.students.map((student) => (
                  <tr key={student.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8">
                          <div className="h-8 w-8 bg-gray-300 rounded-full flex items-center justify-center">
                            <span className="text-xs font-medium text-gray-700">
                              {student.name.charAt(0)}
                            </span>
                          </div>
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">{student.name}</div>
                          <div className="text-sm text-gray-500">
                            {student.grade}학년 {student.class}반
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {student.number}번
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        미제출
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        미생성
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleRemoveStudent(student.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        제거
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 최근 활동 */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">최근 활동</h3>
        </div>
        <div className="px-6 py-12 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h4 className="mt-2 text-sm font-medium text-gray-900">최근 활동이 없습니다</h4>
          <p className="mt-1 text-sm text-gray-500">
            설문을 업로드하거나 기록을 생성하면 여기에 표시됩니다.
          </p>
        </div>
      </div>
    </div>
  )
} 