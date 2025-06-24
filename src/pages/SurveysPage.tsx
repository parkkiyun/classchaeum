import React, { useState, useRef, useEffect } from 'react'
import { collection, addDoc, getDocs, query, where, updateDoc, doc, deleteDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from '../contexts/AuthContext'
import { useAppStore } from '../store/appStore'
import type { SurveyResponse, ReportArea } from '../types'
import * as XLSX from 'xlsx'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { Button } from '../components/ui/Button'

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

export const SurveysPage: React.FC = () => {
  const { teacher } = useAuth()
  const { 
    surveyResponses, 
    students,
    setSurveyResponses,
    addSurveyResponse
  } = useAppStore()
  
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [selectedArea, setSelectedArea] = useState<ReportArea>('자율')
  const [uploadResult, setUploadResult] = useState<{
    success: number
    errors: string[]
  } | null>(null)
  const [googleFormUrl, setGoogleFormUrl] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const reportAreas: ReportArea[] = ['자율', '진로', '행특', '교과', '동아리']

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
    loadSurveyResponses()
  }, [teacher])

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

  // 구글 폼 연동 (향후 구현)
  const handleGoogleFormConnect = async () => {
    if (!googleFormUrl) {
      alert('구글 폼 URL을 입력해주세요.')
      return
    }

    // TODO: 구글 폼 API 연동 구현
    alert('구글 폼 연동 기능은 향후 구현 예정입니다.')
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">설문 응답을 불러오는 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 lg:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* 헤더 */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">설문 관리</h1>
            <p className="mt-1 text-sm text-gray-600">
              학생 설문 응답을 Excel로 업로드하고 관리할 수 있습니다
            </p>
          </div>
          <div className="mt-4 sm:mt-0 flex items-center space-x-3">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
              응답 {filteredResponses.length}개
            </span>
          </div>
        </div>

        {/* 영역 선택 탭 */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">생활기록부 영역</h2>
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

        {/* 설문 업로드 섹션 */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">📊 설문 응답 업로드</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Excel 업로드 */}
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium text-blue-900">1. Excel 파일 업로드</h3>
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
                    <h3 className="font-medium text-green-900">2. 파일 업로드</h3>
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

            {/* 구글 폼 연동 (향후 구현) */}
            <div className="space-y-4">
              <div className="p-4 bg-purple-50 rounded-lg">
                <div>
                  <h3 className="font-medium text-purple-900">🔗 구글 폼 연동 (향후 지원)</h3>
                  <p className="text-sm text-purple-700 mt-1">구글 폼 URL을 입력하면 응답을 자동으로 가져올 수 있습니다</p>
                  
                  <div className="mt-3 space-y-3">
                    <input
                      type="url"
                      value={googleFormUrl}
                      onChange={(e) => setGoogleFormUrl(e.target.value)}
                      placeholder="https://forms.gle/..."
                      className="w-full px-3 py-2 border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      disabled
                    />
                    <Button
                      onClick={handleGoogleFormConnect}
                      disabled
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white opacity-50 cursor-not-allowed"
                    >
                      🔗 구글 폼 연결 (개발 예정)
                    </Button>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-yellow-600 mt-0.5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <h4 className="text-sm font-medium text-yellow-800">Excel 파일 형식</h4>
                    <p className="text-sm text-yellow-700 mt-1">
                      StudentID, StudentName, Question, Answer 컬럼이 필요합니다.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 업로드 결과 */}
          {uploadResult && (
            <div className="mt-6 p-4 rounded-lg border">
              <h3 className="font-medium mb-2">업로드 결과</h3>
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
            <h2 className="text-lg font-semibold text-gray-900">
              {selectedArea} 설문 응답 목록 ({filteredResponses.length}개)
            </h2>
          </div>
          
          {filteredResponses.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">설문 응답이 없습니다</h3>
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
                          {response.responses.length}개
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <Button
                            onClick={() => {
                              // TODO: 상세 보기 모달 구현
                              alert('상세 보기 기능은 향후 구현 예정입니다.')
                            }}
                            className="bg-blue-600 hover:bg-blue-700 text-white text-xs"
                          >
                            상세 보기
                          </Button>
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
    </div>
  )
} 