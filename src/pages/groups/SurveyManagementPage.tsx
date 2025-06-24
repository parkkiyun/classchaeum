import React, { useState, useRef, useEffect } from 'react'
import { collection, addDoc, getDocs, query, where, updateDoc, doc, deleteDoc, orderBy } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { useAuth } from '../../contexts/AuthContext'
import { useAppStore } from '../../store/appStore'
import { useParams } from 'react-router-dom'
import type { SurveyResponse, ReportArea } from '../../types'
import type { Survey, SurveyQuestion } from '../../types/survey'
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
  const [selectedArea, setSelectedArea] = useState<ReportArea>('자율')
  const [uploadResult, setUploadResult] = useState<{
    success: number
    errors: string[]
  } | null>(null)
  const [surveys, setSurveys] = useState<Survey[]>([])
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newSurvey, setNewSurvey] = useState<{
    title: string
    description?: string
    questions: SurveyQuestion[]
  }>({
    title: '',
    description: '',
    questions: []
  })
  const fileInputRef = useRef<HTMLInputElement>(null)

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
      const responsesRef = collection(db, 'surveyResponses')
      const responsesSnapshot = await getDocs(responsesRef)
      const loadedResponses: SurveyResponse[] = []
      
      responsesSnapshot.forEach((doc) => {
        const data = doc.data()
        loadedResponses.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          submittedAt: data.submittedAt?.toDate(),
          reviewedAt: data.reviewedAt?.toDate()
        } as SurveyResponse)
      })
      
      setSurveyResponses(loadedResponses)
      console.log('설문 응답 로드 완료:', loadedResponses.length, '개')
    } catch (error) {
      console.error('설문 응답 로드 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSurveys()
    loadSurveyResponses()
  }, [teacher, groupId])

  // 설문 생성
  const handleCreateSurvey = async () => {
    if (!teacher || !groupId || !newSurvey.title || !newSurvey.questions?.length) {
      alert('설문 제목과 최소 1개의 질문을 입력해주세요.')
      return
    }

    try {
      const surveyData: Omit<Survey, 'id'> = {
        title: newSurvey.title,
        description: newSurvey.description || '',
        teacherId: teacher.uid,
        groupId: groupId,
        questions: newSurvey.questions,
        isActive: true,
        allowEdit: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      const surveysRef = collection(db, 'surveys')
      const docRef = await addDoc(surveysRef, surveyData)
      
      const createdSurvey: Survey = {
        id: docRef.id,
        ...surveyData
      }

      setSurveys(prev => [createdSurvey, ...prev])
      setShowCreateForm(false)
      setNewSurvey({ title: '', description: '', questions: [] })
      
      alert('설문이 성공적으로 생성되었습니다!')
    } catch (error) {
      console.error('설문 생성 실패:', error)
      alert('설문 생성에 실패했습니다.')
    }
  }

  // 질문 추가
  const addQuestion = () => {
    const newQuestion: SurveyQuestion = {
      id: uuidv4(),
      type: 'short',
      question: '',
      required: false,
      options: []
    }
    
    setNewSurvey(prev => ({
      ...prev,
      questions: [...prev.questions, newQuestion]
    }))
  }

  // 질문 수정
  const updateQuestion = (questionId: string, updates: Partial<SurveyQuestion>) => {
    setNewSurvey(prev => ({
      ...prev,
      questions: prev.questions.map(q => 
        q.id === questionId ? { ...q, ...updates } : q
      )
    }))
  }

  // 질문 삭제
  const removeQuestion = (questionId: string) => {
    setNewSurvey(prev => ({
      ...prev,
      questions: prev.questions.filter(q => q.id !== questionId)
    }))
  }

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

  // 설문 응답 템플릿 다운로드
  const downloadSurveyTemplate = () => {
    const templateData = students.slice(0, 3).flatMap(student => [
      {
        StudentID: student.id,
        StudentName: student.name,
        Grade: student.grade,
        Class: student.class,
        Number: student.number,
        Area: selectedArea,
        Question: `${selectedArea} 활동에서 가장 인상 깊었던 경험은 무엇인가요?`,
        Answer: '여기에 학생의 응답을 입력하세요'
      },
      {
        StudentID: student.id,
        StudentName: student.name,
        Grade: student.grade,
        Class: student.class,
        Number: student.number,
        Area: selectedArea,
        Question: `${selectedArea} 활동을 통해 배운 점이나 성장한 부분을 서술해주세요.`,
        Answer: '여기에 학생의 응답을 입력하세요'
      },
      {
        StudentID: student.id,
        StudentName: student.name,
        Grade: student.grade,
        Class: student.class,
        Number: student.number,
        Area: selectedArea,
        Question: `${selectedArea} 활동에 대한 만족도를 평가해주세요.`,
        Answer: '5점 (매우 만족)'
      }
    ])

    const ws = XLSX.utils.json_to_sheet(templateData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Survey')
    XLSX.writeFile(wb, `${selectedArea}_설문응답_템플릿.xlsx`)
  }

  // 영역별 설문 응답 필터링
  const getResponsesByArea = (area: ReportArea) => {
    return surveyResponses.filter(response => {
      // 임시로 응답에서 영역 정보를 추출하거나 기본값 사용
      return true // 모든 응답 표시 (영역별 필터링은 향후 개선)
    })
  }

  const filteredResponses = getResponsesByArea(selectedArea)

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
              onClick={() => setShowCreateForm(true)}
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
                  onClick={() => setShowCreateForm(true)}
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
                        <Button
                          onClick={() => copySurveyLink(survey.id)}
                          className="bg-gray-100 hover:bg-gray-200 text-gray-700"
                        >
                          🔗 링크 복사
                        </Button>
                        <Button
                          onClick={() => {
                            const baseUrl = import.meta.env.VITE_APP_URL || window.location.origin
                            const link = `${baseUrl}/survey/${survey.id}`
                            window.open(link, '_blank')
                          }}
                          className="bg-blue-100 hover:bg-blue-200 text-blue-700"
                        >
                          👁️ 미리보기
                        </Button>
                        <Button
                          onClick={() => toggleSurveyStatus(survey.id, survey.isActive)}
                          className={survey.isActive 
                            ? "bg-red-100 hover:bg-red-200 text-red-700"
                            : "bg-green-100 hover:bg-green-200 text-green-700"
                          }
                        >
                          {survey.isActive ? '비활성화' : '활성화'}
                        </Button>
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
          {/* 영역 선택 탭 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">생활기록부 영역</h3>
            <div className="flex flex-wrap gap-2">
              {reportAreas.map((area) => (
                <button
                  key={area}
                  onClick={() => setSelectedArea(area)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    selectedArea === area
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {area}
                </button>
              ))}
            </div>
          </div>

          {/* Excel 업로드 섹션 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 설문 응답 업로드</h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Excel 업로드 */}
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium text-blue-900">1. Excel 파일 업로드</h4>
                      <p className="text-sm text-blue-700 mt-1">학생들의 설문 응답이 담긴 Excel 파일을 업로드하세요</p>
                    </div>
                    <Button
                      onClick={downloadSurveyTemplate}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      📥 템플릿 다운로드
                    </Button>
                  </div>
                </div>

                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium text-green-900">2. 파일 업로드</h4>
                      <p className="text-sm text-green-700 mt-1">작성된 Excel 파일을 업로드하세요</p>
                    </div>
                    <div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".xlsx,.xls"
                        onChange={handleSurveyUpload}
                        className="hidden"
                        disabled={uploading}
                      />
                      <Button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        {uploading ? (
                          <>
                            <LoadingSpinner size="sm" />
                            <span className="ml-2">업로드 중...</span>
                          </>
                        ) : (
                          '📤 파일 업로드'
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-yellow-600 mt-0.5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <h5 className="text-sm font-medium text-yellow-800">Excel 파일 형식</h5>
                    <p className="text-sm text-yellow-700 mt-1">
                      StudentID, StudentName, Question, Answer 컬럼이 필요합니다.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* 업로드 결과 */}
            {uploadResult && (
              <div className="mt-6 p-4 rounded-lg border">
                <h4 className="font-medium mb-2">업로드 결과</h4>
                <div className="space-y-2">
                  {uploadResult.success > 0 && (
                    <div className="flex items-center text-green-700">
                      <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      성공: {uploadResult.success}개의 설문 응답이 업로드되었습니다
                    </div>
                  )}
                  {uploadResult.errors.length > 0 && (
                    <div className="text-red-700">
                      <div className="flex items-center mb-1">
                        <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        오류 {uploadResult.errors.length}개:
                      </div>
                      <ul className="list-disc list-inside text-sm space-y-1">
                        {uploadResult.errors.map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 설문 응답 목록 */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {selectedArea} 설문 응답 목록 ({filteredResponses.length}개)
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
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상태</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">제출일</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">응답 수</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">관리</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredResponses.map((response) => {
                      const student = students.find(s => s.id === response.studentId)
                      return (
                        <tr key={response.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-8 w-8">
                                <div className="h-8 w-8 bg-gray-300 rounded-full flex items-center justify-center">
                                  <span className="text-xs font-medium text-gray-700">
                                    {student?.name.charAt(0) || '?'}
                                  </span>
                                </div>
                              </div>
                              <div className="ml-3">
                                <div className="text-sm font-medium text-gray-900">
                                  {student?.name || '알 수 없음'}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {student?.grade}학년 {student?.class}반 {student?.number}번
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              response.status === 'submitted' 
                                ? 'bg-green-100 text-green-800'
                                : response.status === 'reviewed'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {response.status === 'submitted' ? '제출됨' :
                               response.status === 'reviewed' ? '검토됨' : '임시저장'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {response.submittedAt?.toLocaleDateString() || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {response.responses?.length || 0}개
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button className="text-blue-600 hover:text-blue-900 mr-3">
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

      {/* 설문 생성 모달 */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-medium text-gray-900">새 설문 만들기</h3>
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-6">
                {/* 설문 기본 정보 */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">설문 제목</label>
                    <input
                      type="text"
                      value={newSurvey.title}
                      onChange={(e) => setNewSurvey(prev => ({ ...prev, title: e.target.value }))}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="설문 제목을 입력하세요"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">설문 설명 (선택사항)</label>
                    <textarea
                      value={newSurvey.description}
                      onChange={(e) => setNewSurvey(prev => ({ ...prev, description: e.target.value }))}
                      rows={3}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="설문에 대한 설명을 입력하세요"
                    />
                  </div>
                </div>

                {/* 질문 목록 */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-md font-medium text-gray-900">질문 목록</h4>
                    <Button onClick={addQuestion} className="bg-green-600 hover:bg-green-700 text-white">
                      ➕ 질문 추가
                    </Button>
                  </div>

                  <div className="space-y-4">
                    {newSurvey.questions.map((question, index) => (
                      <div key={question.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <span className="text-sm font-medium text-gray-500">질문 {index + 1}</span>
                          <button
                            onClick={() => removeQuestion(question.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>

                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700">질문 내용</label>
                            <input
                              type="text"
                              value={question.question}
                              onChange={(e) => updateQuestion(question.id, { question: e.target.value })}
                              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                              placeholder="질문을 입력하세요"
                            />
                          </div>

                          <div className="flex items-center space-x-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700">질문 유형</label>
                              <select
                                value={question.type}
                                onChange={(e) => updateQuestion(question.id, { type: e.target.value as SurveyQuestion['type'] })}
                                className="mt-1 block border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                              >
                                <option value="short">단답형</option>
                                <option value="long">장문형</option>
                                <option value="multiple">객관식</option>
                                <option value="rating">평점</option>
                              </select>
                            </div>

                            <div className="flex items-center">
                              <input
                                type="checkbox"
                                checked={question.required}
                                onChange={(e) => updateQuestion(question.id, { required: e.target.checked })}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                              />
                              <label className="ml-2 block text-sm text-gray-900">
                                필수 질문
                              </label>
                            </div>
                          </div>

                          {/* 객관식 옵션 */}
                          {question.type === 'multiple' && (
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">선택지</label>
                              <div className="space-y-2">
                                {question.options?.map((option, optionIndex) => (
                                  <div key={optionIndex} className="flex items-center space-x-2">
                                    <input
                                      type="text"
                                      value={option}
                                      onChange={(e) => {
                                        const newOptions = [...(question.options || [])]
                                        newOptions[optionIndex] = e.target.value
                                        updateQuestion(question.id, { options: newOptions })
                                      }}
                                      className="flex-1 border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                      placeholder={`선택지 ${optionIndex + 1}`}
                                    />
                                    <button
                                      onClick={() => {
                                        const newOptions = question.options?.filter((_, i) => i !== optionIndex) || []
                                        updateQuestion(question.id, { options: newOptions })
                                      }}
                                      className="text-red-500 hover:text-red-700"
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                      </svg>
                                    </button>
                                  </div>
                                )) || []}
                                <button
                                  onClick={() => {
                                    const newOptions = [...(question.options || []), '']
                                    updateQuestion(question.id, { options: newOptions })
                                  }}
                                  className="text-blue-600 hover:text-blue-800 text-sm"
                                >
                                  + 선택지 추가
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 버튼 */}
                <div className="flex justify-end space-x-3 pt-6 border-t">
                  <Button
                    onClick={() => setShowCreateForm(false)}
                    className="bg-gray-300 hover:bg-gray-400 text-gray-700"
                  >
                    취소
                  </Button>
                  <Button
                    onClick={handleCreateSurvey}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    설문 생성
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 