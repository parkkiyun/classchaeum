import React, { useState, useRef, useEffect } from 'react'
import { collection, addDoc, getDocs, query, where, updateDoc, doc, deleteDoc, orderBy } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { useAuth } from '../../contexts/AuthContext'
import { useAppStore } from '../../store/appStore'
import { useParams } from 'react-router-dom'
import type { SurveyResponse as LegacySurveyResponse, ReportArea } from '../../types'
import type { Survey, SurveyQuestion, SurveyResponse } from '../../types/survey'
import * as XLSX from 'xlsx'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { Button } from '../../components/ui/Button'
import { v4 as uuidv4 } from 'uuid'

interface SurveyData {
  StudentID: string
  StudentName: string
  Grade?: number
  Class?: number
  Number?: number
  Area: string
  Question: string
  Answer: string
  [key: string]: string | number | undefined
}

type TabType = 'surveys' | 'responses'

export const SurveyManagementPage: React.FC = () => {
  const { groupId } = useParams<{ groupId: string }>()
  const { teacher } = useAuth()
  const { 
    surveyResponses, 
    students,
    setSurveyResponses,
    addSurveyResponse
  } = useAppStore()
  
  const [activeTab, setActiveTab] = useState<TabType>('surveys')
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadResult, setUploadResult] = useState<{
    success: number
    errors: string[]
  } | null>(null)
  const [surveys, setSurveys] = useState<Survey[]>([])
  const [selectedResponse, setSelectedResponse] = useState<any>(null)
  const [realSurveyResponses, setRealSurveyResponses] = useState<any[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedSurveyId, setSelectedSurveyId] = useState<string>('all')

  const reportAreas: ReportArea[] = ['자율', '진로', '행특', '교과', '동아리']

  // 설문 목록 로드
  const loadSurveys = async () => {
    if (!teacher || !groupId) {
      console.log('설문 로딩 건너뜀 - teacher:', !!teacher, 'groupId:', groupId)
      return
    }

    try {
      console.log('설문 로딩 시작 - teacherId:', teacher.uid, 'groupId:', groupId)
      
      const surveysRef = collection(db, 'surveys')
      console.log('surveys 컬렉션 참조 생성 완료')
      
      const surveysQuery = query(
        surveysRef,
        where('teacherId', '==', teacher.uid),
        where('groupId', '==', groupId),
        orderBy('createdAt', 'desc')
      )
      console.log('쿼리 생성 완료')
      
      const surveysSnapshot = await getDocs(surveysQuery)
      console.log('쿼리 실행 완료 - 문서 수:', surveysSnapshot.size)
      
      const loadedSurveys: Survey[] = []
      
      surveysSnapshot.forEach((doc) => {
        const data = doc.data()
        console.log('설문 문서 발견:', doc.id, data)
        loadedSurveys.push({
          id: doc.id,
          title: data.title,
          description: data.description,
          teacherId: data.teacherId,
          groupId: data.groupId,
          questions: data.questions,
          isActive: data.isActive,
          allowEdit: data.allowEdit,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          dueDate: data.dueDate?.toDate(),
          maxResponses: data.maxResponses
        })
      })
      
      setSurveys(loadedSurveys)
      console.log('설문 목록 로드 완료:', loadedSurveys.length, '개')
      console.log('로드된 설문 목록:', loadedSurveys)
    } catch (error) {
      console.error('설문 목록 로드 실패:', error)
      // 에러 세부 정보 출력
      if (error instanceof Error) {
        console.error('에러 메시지:', error.message)
        console.error('에러 스택:', error.stack)
      }
    }
  }

  // Firebase에서 설문 응답 로드
  const loadSurveyResponses = async () => {
    if (!teacher) return

    try {
      setLoading(true)
      const allResponses: any[] = []
      
      // 각 설문에 대해 응답 조회
      for (const survey of surveys) {
        try {
          const responsesRef = collection(db, 'surveys', survey.id, 'responses')
          const responsesSnapshot = await getDocs(responsesRef)
          
          responsesSnapshot.forEach((doc) => {
            const data = doc.data()
            allResponses.push({
              id: doc.id,
              surveyId: survey.id,
              surveyTitle: survey.title,
              ...data,
              submittedAt: data.submittedAt?.toDate() || new Date(),
              updatedAt: data.updatedAt?.toDate() || new Date()
            })
          })
          
          console.log(`설문 "${survey.title}" 응답 수:`, responsesSnapshot.size)
        } catch (error) {
          console.error(`설문 ${survey.id} 응답 로드 실패:`, error)
        }
      }
      
      setRealSurveyResponses(allResponses)
      console.log('전체 설문 응답 로드 완료:', allResponses.length, '개')
    } catch (error) {
      console.error('설문 응답 로드 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSurveys()
  }, [teacher, groupId])

  // 설문 목록이 로드된 후 응답 로드
  useEffect(() => {
    if (surveys.length > 0) {
      loadSurveyResponses()
    }
  }, [surveys])

  // 페이지가 포커스되었을 때 데이터 새로고침 (설문 생성 후 돌아왔을 때)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && teacher && groupId) {
        console.log('페이지 포커스 - 설문 목록 새로고침')
        loadSurveys()
      }
    }

    const handleFocus = () => {
      if (teacher && groupId) {
        console.log('윈도우 포커스 - 설문 목록 새로고침')
        loadSurveys()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleFocus)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
    }
  }, [teacher, groupId])



  // 설문 링크 복사
  const copySurveyLink = async (surveyId: string) => {
    const baseUrl = import.meta.env.VITE_APP_URL || window.location.origin
    const link = `${baseUrl}/survey/${surveyId}`
    
    try {
      // 먼저 navigator.clipboard 시도
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(link)
        alert(`설문 링크가 클립보드에 복사되었습니다!\n\n${link}`)
      } else {
        // 대체 방법: 텍스트 선택 + document.execCommand
        const textArea = document.createElement('textarea')
        textArea.value = link
        textArea.style.position = 'fixed'
        textArea.style.left = '-999999px'
        textArea.style.top = '-999999px'
        document.body.appendChild(textArea)
        textArea.focus()
        textArea.select()
        
        try {
          const successful = document.execCommand('copy')
          if (successful) {
            alert(`설문 링크가 클립보드에 복사되었습니다!\n\n${link}`)
          } else {
            throw new Error('복사 실패')
          }
        } catch (err) {
          // 복사 실패 시 링크를 직접 보여주기
          const userConfirm = confirm(
            `자동 복사에 실패했습니다. 아래 링크를 수동으로 복사해주세요:\n\n${link}\n\n확인을 누르면 새 창에서 링크를 열어드립니다.`
          )
          if (userConfirm) {
            window.open(link, '_blank')
          }
        } finally {
          document.body.removeChild(textArea)
        }
      }
    } catch (error) {
      console.error('링크 복사 실패:', error)
      // 최종 대체: 사용자에게 링크 직접 표시
      const userConfirm = confirm(
        `링크 복사에 실패했습니다. 아래 링크를 수동으로 복사해주세요:\n\n${link}\n\n확인을 누르면 새 창에서 링크를 열어드립니다.`
      )
      if (userConfirm) {
        window.open(link, '_blank')
      }
    }
  }

  // 설문 활성화/비활성화
  const toggleSurveyStatus = async (surveyId: string, isActive: boolean) => {
    try {
      const surveyRef = doc(db, 'surveys', surveyId)
      await updateDoc(surveyRef, {
        isActive: !isActive,
        updatedAt: new Date()
      })
      
      setSurveys(prev => prev.map(survey => 
        survey.id === surveyId ? { ...survey, isActive: !isActive } : survey
      ))
    } catch (error) {
      console.error('설문 상태 변경 실패:', error)
      alert('설문 상태 변경에 실패했습니다.')
    }
  }

  // 설문 삭제
  const deleteSurvey = async (surveyId: string, surveyTitle: string) => {
    const confirmMessage = `"${surveyTitle}" 설문을 삭제하시겠습니까?\n\n⚠️ 삭제하면 응답까지 모두 삭제됩니다.\n이 작업은 되돌릴 수 없습니다.`
    
    if (!confirm(confirmMessage)) return

    try {
      // 설문 응답 먼저 삭제
      const responsesRef = collection(db, 'surveys', surveyId, 'responses')
      const responsesSnapshot = await getDocs(responsesRef)
      
      const deletePromises = responsesSnapshot.docs.map(responseDoc => 
        deleteDoc(doc(db, 'surveys', surveyId, 'responses', responseDoc.id))
      )
      
      await Promise.all(deletePromises)
      
      // 설문 자체 삭제
      await deleteDoc(doc(db, 'surveys', surveyId))
      
      // 로컬 상태 업데이트
      setSurveys(prev => prev.filter(survey => survey.id !== surveyId))
      setRealSurveyResponses(prev => prev.filter(response => response.surveyId !== surveyId))
      
      alert('설문이 성공적으로 삭제되었습니다.')
    } catch (error) {
      console.error('설문 삭제 실패:', error)
      alert('설문 삭제 중 오류가 발생했습니다.')
    }
  }

  // Excel 설문 응답 업로드 처리
  const handleSurveyUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setUploading(true)
    setUploadResult(null)

    try {
      const data = await file.arrayBuffer()
      const workbook = XLSX.read(data, { type: 'array' })
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      const jsonData: SurveyData[] = XLSX.utils.sheet_to_json(worksheet)

      const errors: string[] = []
      const validResponses: SurveyResponse[] = []

      // 학생별로 설문 응답 그룹화
      const studentResponses = new Map<string, SurveyData[]>()
      
      jsonData.forEach((row, index) => {
        const rowNum = index + 2

        // 필수 필드 검증
        if (!row.StudentID || !row.StudentName) {
          errors.push(`${rowNum}행: StudentID 또는 StudentName이 누락되었습니다`)
          return
        }

        if (!row.Question || !row.Answer) {
          errors.push(`${rowNum}행: Question 또는 Answer가 누락되었습니다`)
          return
        }

        // 학생 존재 확인
        const student = students.find(s => s.id === row.StudentID)
        if (!student) {
          errors.push(`${rowNum}행: 학생 ID ${row.StudentID}를 찾을 수 없습니다`)
          return
        }

        // 영역 설정 (Excel에서 지정되지 않은 경우 현재 선택된 영역 사용)
        const area = row.Area || selectedArea

        // 학생별 응답 그룹화
        const studentKey = `${row.StudentID}-${area}`
        if (!studentResponses.has(studentKey)) {
          studentResponses.set(studentKey, [])
        }
        studentResponses.get(studentKey)!.push({ ...row, Area: area })
      })

      // 학생별로 설문 응답 생성
      for (const [studentKey, responses] of studentResponses) {
        const [studentId, area] = studentKey.split('-')
        
        // 질문-답변 쌍을 QuestionResponse 형태로 변환
        const questionResponses = responses.map((response, index) => ({
          questionId: `q${index + 1}-${Date.now()}`,
          answer: response.Answer,
          textAnswer: response.Question
        }))

        const surveyResponse: SurveyResponse = {
          id: `${studentId}-${area}-${Date.now()}`,
          templateId: `template-${area}-${Date.now()}`, // 임시 템플릿 ID
          studentId: studentId,
          teacherId: teacher!.uid,
          responses: questionResponses,
          status: 'submitted',
          submittedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date()
        }

        validResponses.push(surveyResponse)
      }

      // Firebase에 설문 응답 저장
      const savedResponses: SurveyResponse[] = []
      for (const response of validResponses) {
        try {
          const responsesRef = collection(db, 'surveyResponses')
          const docRef = await addDoc(responsesRef, {
            ...response,
            area: selectedArea, // 영역 정보 추가
            createdAt: new Date(),
            updatedAt: new Date()
          })
          const savedResponse = { ...response, id: docRef.id }
          savedResponses.push(savedResponse)
          addSurveyResponse(savedResponse)
        } catch (error) {
          errors.push(`${response.studentId} 설문 응답 저장 실패`)
        }
      }

      // 전체 데이터 새로고침
      if (savedResponses.length > 0) {
        await loadSurveyResponses()
      }

      setUploadResult({
        success: savedResponses.length,
        errors
      })

    } catch (error) {
      console.error('설문 업로드 오류:', error)
      setUploadResult({
        success: 0,
        errors: ['파일을 읽는 중 오류가 발생했습니다. Excel 파일 형식을 확인해주세요.']
      })
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  // 설문 응답 필터링 (설문별)
  const getResponsesByArea = () => {
    if (selectedSurveyId === 'all') {
      return realSurveyResponses
    }
    return realSurveyResponses.filter(response => response.surveyId === selectedSurveyId)
  }

  const filteredResponses = getResponsesByArea()

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">설문을 불러오는 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">설문 관리</h2>
          <p className="mt-1 text-sm text-gray-600">
            설문을 생성하고 학생 응답을 관리할 수 있습니다
          </p>
        </div>
      </div>

      {/* 탭 네비게이션 */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('surveys')}
            className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap flex items-center space-x-2 ${
              activeTab === 'surveys'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <span>📋</span>
            <span>설문 목록</span>
            <span className="bg-gray-100 text-gray-900 py-0.5 px-2.5 rounded-full text-xs font-medium">
              {surveys.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('responses')}
            className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap flex items-center space-x-2 ${
              activeTab === 'responses'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <span>📊</span>
            <span>설문 응답</span>
            <span className="bg-gray-100 text-gray-900 py-0.5 px-2.5 rounded-full text-xs font-medium">
              {filteredResponses.length}
            </span>
          </button>
        </nav>
      </div>

      {/* 탭 콘텐츠 */}
      {activeTab === 'surveys' ? (
        <div className="space-y-6">
          {/* 설문 생성 버튼 */}
          <div className="flex justify-end">
            <Button
              onClick={() => window.location.href = `/surveys/create?groupId=${groupId}`}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              ➕ 새 설문 만들기
            </Button>
          </div>

          {/* 설문 목록 */}
          <div className="bg-white rounded-lg shadow">
            {surveys.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
                <h4 className="mt-2 text-sm font-medium text-gray-900">설문이 없습니다</h4>
                <p className="mt-1 text-sm text-gray-500">
                  새 설문을 만들어 학생들의 의견을 수집해보세요.
                </p>
                <Button
                  onClick={() => window.location.href = `/surveys/create?groupId=${groupId}`}
                  className="mt-4 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  첫 설문 만들기
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {surveys.map((survey) => (
                  <div key={survey.id} className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <h3 className="text-lg font-medium text-gray-900">{survey.title}</h3>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            survey.isActive 
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {survey.isActive ? '활성' : '비활성'}
                          </span>
                        </div>
                        {survey.description && (
                          <p className="mt-1 text-sm text-gray-600">{survey.description}</p>
                        )}
                        <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                          <span>질문 {survey.questions.length}개</span>
                          <span>•</span>
                          <span>생성일: {survey.createdAt.toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => copySurveyLink(survey.id)}
                          className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="링크 복사"
                        >
                          🔗
                        </button>
                        <button
                          onClick={() => toggleSurveyStatus(survey.id, survey.isActive)}
                          className={`p-2 rounded-lg transition-colors ${survey.isActive 
                            ? "text-red-600 hover:text-red-700 hover:bg-red-50"
                            : "text-green-600 hover:text-green-700 hover:bg-green-50"
                          }`}
                          title={survey.isActive ? '비활성화' : '활성화'}
                        >
                          {survey.isActive ? '⏸️' : '▶️'}
                        </button>
                        <button
                          onClick={() => deleteSurvey(survey.id, survey.title)}
                          className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                          title="삭제"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* 설문 선택 필터 */}
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center space-x-4">
              <label className="text-sm font-medium text-gray-700">설문 선택:</label>
              <select
                value={selectedSurveyId}
                onChange={(e) => setSelectedSurveyId(e.target.value)}
                className="block w-64 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="all">전체 설문 ({realSurveyResponses.length}개 응답)</option>
                {surveys.map((survey) => {
                  const surveyResponseCount = realSurveyResponses.filter(r => r.surveyId === survey.id).length
                  return (
                    <option key={survey.id} value={survey.id}>
                      {survey.title} ({surveyResponseCount}개 응답)
                    </option>
                  )
                })}
              </select>
            </div>
          </div>

          {/* 설문 응답 목록 */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                설문 응답 목록 ({filteredResponses.length}개)
              </h3>
            </div>
            
            {filteredResponses.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
                <h4 className="mt-2 text-sm font-medium text-gray-900">설문 응답이 없습니다</h4>
                <p className="mt-1 text-sm text-gray-500">
                  Excel 파일을 업로드하여 설문 응답을 추가해보세요.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">학생</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">설문</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상태</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">제출일</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">응답 수</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">관리</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredResponses.map((response) => {
                      // 이름으로 학생 정보 찾기
                      const student = students.find(s => s.name === response.studentName)
                      const answerCount = response.answers ? Object.keys(response.answers).length : 0
                      
                      return (
                        <tr key={response.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-8 w-8">
                                <div className="h-8 w-8 bg-gray-300 rounded-full flex items-center justify-center">
                                  <span className="text-xs font-medium text-gray-700">
                                    {(response.studentName || '?').charAt(0)}
                                  </span>
                                </div>
                              </div>
                              <div className="ml-3">
                                <div className="text-sm font-medium text-gray-900">
                                  {response.studentName || '이름 없음'}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {student ? 
                                    `${student.grade}학년 ${student.class}반 ${student.number}번` :
                                    response.grade && response.classNumber && response.studentNumber ?
                                    `${response.grade}학년 ${response.classNumber}반 ${response.studentNumber}번` :
                                    response.email
                                  }
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {response.surveyTitle || '설문 제목 없음'}
                            </div>
                            <div className="text-sm text-gray-500">
                              ID: {response.surveyId?.substring(0, 8)}...
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              제출됨
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {response.submittedAt?.toLocaleDateString() || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {answerCount}개
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button 
                              onClick={() => setSelectedResponse(response)}
                              className="text-blue-600 hover:text-blue-900 mr-3"
                            >
                              보기
                            </button>
                            <button className="text-red-600 hover:text-red-900">
                              삭제
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
        </div>
      )}

      {/* 설문 응답 상세보기 모달 */}
      {selectedResponse && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">설문 응답 상세</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    {selectedResponse.studentName} • {selectedResponse.submittedAt?.toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedResponse(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-2">응답자 정보</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">이름:</span>
                      <span className="ml-2 font-medium">{selectedResponse.studentName}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">이메일:</span>
                      <span className="ml-2">{selectedResponse.email}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">학급:</span>
                      <span className="ml-2">
                        {selectedResponse.grade && selectedResponse.classNumber && selectedResponse.studentNumber
                          ? `${selectedResponse.grade}학년 ${selectedResponse.classNumber}반 ${selectedResponse.studentNumber}번`
                          : '정보 없음'
                        }
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">제출일:</span>
                      <span className="ml-2">{selectedResponse.submittedAt?.toLocaleDateString()}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">설문:</span>
                      <span className="ml-2">{selectedResponse.surveyTitle}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-gray-900 mb-4">응답 내용</h3>
                  <div className="space-y-4">
                                         {selectedResponse.answers && Object.entries(selectedResponse.answers as Record<string, any>).map(([questionId, answer], index) => {
                      // 해당 설문의 질문 정보 찾기
                      const survey = surveys.find(s => s.id === selectedResponse.surveyId)
                      const question = survey?.questions.find(q => q.id === questionId)
                      
                      return (
                        <div key={questionId} className="border border-gray-200 rounded-lg p-4">
                          <div className="mb-3">
                            <span className="text-sm font-medium text-gray-500">질문 {index + 1}</span>
                            <h4 className="text-base font-medium text-gray-900 mt-1">
                              {question?.question || `질문 ID: ${questionId}`}
                            </h4>
                          </div>
                                                     <div className="bg-gray-50 p-3 rounded border">
                             <p className="text-gray-800">
                               {Array.isArray(answer) ? answer.join(', ') : String(answer)}
                             </p>
                           </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

              <div className="mt-8 flex justify-end space-x-3">
                <button
                  onClick={() => setSelectedResponse(null)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
} 