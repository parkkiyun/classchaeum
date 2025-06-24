import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore'
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
  { id: 'dashboard', name: '클래스 대시보드' },
  { id: 'survey-management', name: '설문 관리' },
  { id: 'hanolchaeum', name: '클래스채움' },
  { id: 'records', name: '기록 조회' }
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
        return <HanolchaeumPage group={currentGroup} />
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
  const [surveyCount, setSurveyCount] = useState(0)
  const [recordCount, setRecordCount] = useState(0)
  const [recentActivities, setRecentActivities] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [studentRecords, setStudentRecords] = useState<Map<string, Record<string, boolean>>>(new Map())
  
  const groupWithStudents = getGroupWithStudents(group.id, students)

  // 클래스 유형에 따른 기록 영역 매핑
  const getRecordAreaByGroupType = (groupType: string) => {
    switch (groupType) {
      case '담임':
        return ['autonomous', 'career', 'behavior'] // 실제 DB에 저장된 키 사용
      case '교과':
        return ['subject']
      case '동아리':
        return ['club']
      default:
        return ['autonomous']
    }
  }

  // 영역 키를 한글 라벨로 변환
  const getAreaLabel = (areaKey: string) => {
    switch(areaKey) {
      case 'autonomous': return '자율'
      case 'career': return '진로'
      case 'behavior': return '행특'
      case 'subject': return '교과'
      case 'club': return '동아리'
      default: return areaKey
    }
  }

  // 통계 데이터 로드 (성능 개선)
  useEffect(() => {
    const loadStatistics = async () => {
      try {
        setLoading(true)
        
        // 병렬로 모든 데이터 로드
        const [surveysData, reportsData, studentRecordsData] = await Promise.all([
          loadSurveys(),
          loadReports(),
          loadStudentRecords()
        ])
        
        // 최근 활동 구성
        const activities: any[] = []
        
        // 설문 활동 추가
        surveysData.surveys.forEach(doc => {
          const data = doc.data()
          activities.push({
            type: 'survey',
            title: data.title,
            date: data.createdAt?.toDate() || new Date(),
            icon: '📋'
          })
        })
        
        // 기록 활동 추가
        reportsData.reports.forEach(doc => {
          const data = doc.data()
          activities.push({
            type: 'report',
            title: `${data.studentName || '학생'} - ${getAreaLabel(data.area)}`,
            date: data.updatedAt?.toDate() || new Date(),
            icon: '📝'
          })
        })
        
        // 날짜순 정렬 (최신순)
        activities.sort((a, b) => b.date.getTime() - a.date.getTime())
        setRecentActivities(activities.slice(0, 5)) // 최근 5개만
        
        // 상태 업데이트
        setSurveyCount(surveysData.count)
        setRecordCount(reportsData.count)
        setStudentRecords(studentRecordsData)
        
      } catch (error) {
        console.error('통계 데이터 로드 실패:', error)
      } finally {
        setLoading(false)
      }
    }

    loadStatistics()
  }, [group.id])

  // 설문 데이터 로드
  const loadSurveys = async () => {
    try {
      const surveysRef = collection(db, 'surveys')
      const surveysQuery = query(
        surveysRef,
        where('groupId', '==', group.id),
        where('teacherId', '==', group.teacherId)
      )
      const surveysSnapshot = await getDocs(surveysQuery)
      console.log('설문 수 조회 성공:', surveysSnapshot.size)
      
      return {
        count: surveysSnapshot.size,
        surveys: surveysSnapshot.docs
      }
    } catch (error) {
      console.error('설문 데이터 조회 실패:', error)
      return { count: 0, surveys: [] }
    }
  }

  // 기록 데이터 로드
  const loadReports = async () => {
    try {
      const reportsRef = collection(db, 'reports')
      const reportsQuery = query(
        reportsRef,
        where('groupId', '==', group.id),
        where('teacherId', '==', group.teacherId)
      )
      const reportsSnapshot = await getDocs(reportsQuery)
      console.log('기록 수 조회 성공:', reportsSnapshot.size)
      
      return {
        count: reportsSnapshot.size,
        reports: reportsSnapshot.docs
      }
    } catch (error) {
      console.error('기록 데이터 조회 실패:', error)
      return { count: 0, reports: [] }
    }
  }

  // 학생별 기록 상태 로드 (성능 개선)
  const loadStudentRecords = async () => {
    if (!groupWithStudents?.students.length) return new Map()

    try {
      const targetAreas = getRecordAreaByGroupType(group.type)
      const recordsMap = new Map<string, Record<string, boolean>>()

      // 한 번의 쿼리로 모든 기록 가져오기
      const reportsRef = collection(db, 'reports')
      const reportsQuery = query(
        reportsRef,
        where('groupId', '==', group.id),
        where('teacherId', '==', group.teacherId)
      )
      const reportsSnapshot = await getDocs(reportsQuery)
      
      // 학생별, 영역별 기록 존재 여부 매핑
      const studentAreaRecords = new Map<string, Set<string>>()
      
      reportsSnapshot.forEach(doc => {
        const data = doc.data()
        const studentId = data.studentId
        const area = data.area
        
        if (!studentAreaRecords.has(studentId)) {
          studentAreaRecords.set(studentId, new Set())
        }
        studentAreaRecords.get(studentId)?.add(area)
      })

      // 각 학생에 대해 영역별 기록 상태 설정
      for (const student of groupWithStudents.students) {
        const studentAreas = studentAreaRecords.get(student.id) || new Set()
        const areaStatus: Record<string, boolean> = {}
        
        targetAreas.forEach(area => {
          areaStatus[area] = studentAreas.has(area)
        })
        
        recordsMap.set(student.id, areaStatus)
      }

      console.log('학생별 기록 상태 로드 완료:', recordsMap.size, '명')
      return recordsMap
    } catch (error) {
      console.error('학생 기록 상태 로드 실패:', error)
      return new Map()
    }
  }

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
              <div className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-blue-600 text-lg">👥</span>
              </div>
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
              <div className="h-8 w-8 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-green-600 text-lg">📋</span>
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">설문 응답</dt>
                <dd className="text-lg font-medium text-gray-900">
                  {loading ? (
                    <div className="animate-pulse bg-gray-200 h-6 w-12 rounded"></div>
                  ) : (
                    `${surveyCount}개`
                  )}
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <span className="text-purple-600 text-lg">📝</span>
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">생성된 기록</dt>
                <dd className="text-lg font-medium text-gray-900">
                  {loading ? (
                    <div className="animate-pulse bg-gray-200 h-6 w-12 rounded"></div>
                  ) : (
                    `${recordCount}개`
                  )}
                </dd>
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">기록 상태</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">관리</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {groupWithStudents.students
                  .sort((a, b) => a.number - b.number) // 번호순 정렬
                  .map((student) => {
                    const studentAreaStatus = studentRecords.get(student.id) || {}
                    const targetAreas = getRecordAreaByGroupType(group.type)
                    
                    return (
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
                                {student.grade}학년 {student.class}반 {student.number}번
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {student.number}번
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {loading ? (
                            <div className="flex space-x-1">
                              {targetAreas.map((_, index) => (
                                <div key={index} className="animate-pulse bg-gray-200 h-5 w-10 rounded-full"></div>
                              ))}
                            </div>
                          ) : (
                            <div className="flex flex-wrap gap-1">
                              {targetAreas.map(area => (
                                <span
                                  key={area}
                                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                    studentAreaStatus[area]
                                      ? 'bg-green-100 text-green-800 border border-green-200'
                                      : 'bg-gray-100 text-gray-600 border border-gray-200'
                                  }`}
                                >
                                  {studentAreaStatus[area] && '✓ '}
                                  {getAreaLabel(area)}
                                </span>
                              ))}
                            </div>
                          )}
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
                    )
                  })}
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
        
        {loading ? (
          <div className="px-6 py-4 space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center space-x-3 animate-pulse">
                <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
                <div className="h-3 bg-gray-200 rounded w-16"></div>
              </div>
            ))}
          </div>
        ) : recentActivities.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <div className="mx-auto h-12 w-12 bg-gray-100 rounded-full flex items-center justify-center">
              <span className="text-gray-400 text-xl">🕒</span>
            </div>
            <h4 className="mt-2 text-sm font-medium text-gray-900">최근 활동이 없습니다</h4>
            <p className="mt-1 text-sm text-gray-500">
              설문을 업로드하거나 기록을 생성하면 여기에 표시됩니다.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {recentActivities.map((activity, index) => (
              <div key={index} className="px-6 py-4 flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center">
                    <span className="text-sm">{activity.icon}</span>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {activity.title}
                  </p>
                  <p className="text-xs text-gray-500">
                    {activity.type === 'survey' ? '설문 생성' : '기록 생성'} • {
                      new Intl.RelativeTimeFormat('ko', { numeric: 'auto' }).format(
                        Math.floor((activity.date.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
                        'day'
                      )
                    }
                  </p>
                </div>
                <div className="text-xs text-gray-400">
                  {activity.date.toLocaleDateString('ko-KR', { 
                    month: 'short', 
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
} 