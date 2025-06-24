import React, { useState } from 'react'
import { Button } from '../../../components/ui/Button'
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner'
import { openaiService, type GenerateRequest } from '../../../services/openaiService'
import type { Student, SurveyResponse } from '../../../types'

interface Step1StudentSelectionProps {
  selectedArea: GenerateRequest['area']
  students: Student[]
  surveyResponses: SurveyResponse[]
  onBack: () => void
  onNext: (data: {
    student: Student
    surveyResponse: SurveyResponse
    aiContent: string
  }) => void
  groupName: string
  groupId?: string
  teacherId?: string
}

export const Step1StudentSelection: React.FC<Step1StudentSelectionProps> = ({
  selectedArea,
  students,
  surveyResponses,
  onBack,
  onNext,
  groupName,
  groupId,
  teacherId
}) => {
  const [selectedStudentId, setSelectedStudentId] = useState<string>('')
  const [selectedSurveyIds, setSelectedSurveyIds] = useState<string[]>([])
  const [generating, setGenerating] = useState(false)

  const selectedStudent = students.find(s => s.id === selectedStudentId)
  const studentSurveyResponses = selectedStudentId
    ? surveyResponses.filter(response => response.studentId === selectedStudentId)
    : []
  const selectedSurveyResponses = surveyResponses.filter(r => selectedSurveyIds.includes(r.id))

  const getAreaName = (area: GenerateRequest['area']) => {
    const areaNames = {
      autonomous: '자율활동',
      career: '진로활동',
      behavior: '행동특성',
      subject: '교과세특',
      club: '동아리'
    }
    return areaNames[area]
  }

  const handleSurveyToggle = (surveyId: string) => {
    setSelectedSurveyIds(prev => 
      prev.includes(surveyId) 
        ? prev.filter(id => id !== surveyId)
        : [...prev, surveyId]
    )
  }

  const handleGenerate = async () => {
    if (!selectedStudent || selectedSurveyResponses.length === 0) {
      alert('학생과 설문 응답을 모두 선택해주세요.')
      return
    }

    try {
      setGenerating(true)
      
      // 다중 설문 응답을 AI가 이해하기 쉬운 형태로 변환
      const surveyData: Record<string, any> = {}
      
      selectedSurveyResponses.forEach((surveyResponse, surveyIndex) => {
        surveyResponse.responses.forEach((response, responseIndex) => {
          const key = `설문${surveyIndex + 1}_질문${responseIndex + 1}`
          surveyData[key] = {
            question: response.textAnswer,
            answer: response.answer,
            surveyTitle: surveyResponse.templateId
          }
        })
      })

      const request: GenerateRequest = {
        area: selectedArea,
        studentName: selectedStudent.name,
        surveyData,
        groupId,
        teacherId
      }

      const response = await openaiService.generateContent(request)
      
      if (response.success) {
        onNext({
          student: selectedStudent,
          surveyResponse: selectedSurveyResponses[0], // 첫 번째 응답을 대표로 사용
          aiContent: response.content
        })
      } else {
        alert(`AI 생성 실패: ${response.error}`)
      }
    } catch (error) {
      console.error('❌ AI 생성 오류:', error)
      alert('AI 생성 중 오류가 발생했습니다.')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center">
          <div className="flex items-center justify-center w-12 h-12 mx-auto bg-blue-100 rounded-full mb-4">
            <span className="text-2xl">👥</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">학생 선택</h2>
          <p className="text-gray-600 mt-2">
            {groupName} - {getAreaName(selectedArea)} 기록을 작성할 학생을 선택하세요
          </p>
          <div className="flex items-center justify-center mt-4 space-x-2">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                ✓
              </div>
              <span className="ml-2 text-sm text-green-600">기록 영역 선택</span>
            </div>
            <div className="w-8 h-px bg-gray-300"></div>
            <div className="flex items-center">
              <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                2
              </div>
              <span className="ml-2 text-sm font-medium text-blue-600">학생 선택</span>
            </div>
            <div className="w-8 h-px bg-gray-300"></div>
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gray-300 text-gray-500 rounded-full flex items-center justify-center text-sm">
                3
              </div>
              <span className="ml-2 text-sm text-gray-500">기록 작성</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 왼쪽: 학생 선택 */}
        <div className="space-y-6">
          {/* 학생 선택 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">1. 학생 선택</h3>
            <select
              value={selectedStudentId}
              onChange={(e) => {
                setSelectedStudentId(e.target.value)
                setSelectedSurveyIds([])
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">학생을 선택하세요</option>
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.name} ({student.grade}학년 {student.class}반 {student.number}번)
                </option>
              ))}
            </select>
          </div>

          {/* 설문 응답 다중 선택 */}
          {selectedStudentId && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                2. 참고할 설문 응답 
                <span className="text-sm font-normal text-gray-600 ml-2">
                  (다중 선택 가능)
                </span>
              </h3>
              {studentSurveyResponses.length > 0 ? (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {studentSurveyResponses.map((response) => (
                    <div key={response.id} className="flex items-start space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                      <input
                        type="checkbox"
                        id={`survey-${response.id}`}
                        checked={selectedSurveyIds.includes(response.id)}
                        onChange={() => handleSurveyToggle(response.id)}
                        className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor={`survey-${response.id}`} className="flex-1 cursor-pointer">
                        <div className="font-medium text-gray-900">
                          {response.templateId}
                        </div>
                        <div className="text-sm text-gray-500">
                          {response.submittedAt ? new Date(response.submittedAt).toLocaleDateString() : '날짜 없음'}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          {response.responses.length}개 질문
                        </div>
                      </label>
                    </div>
                  ))}
                  
                  {selectedSurveyIds.length > 0 && (
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                      <div className="text-sm text-blue-800">
                        <strong>{selectedSurveyIds.length}개</strong> 설문 응답이 선택되었습니다.
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-gray-500 text-center py-8">
                  <svg className="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p>해당 학생의 설문 응답이 없습니다.</p>
                  <p className="text-sm mt-1">설문 관리 탭에서 설문을 먼저 진행해주세요.</p>
                </div>
              )}
            </div>
          )}

          {/* AI 생성 버튼 */}
          {selectedSurveyIds.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <Button
                onClick={handleGenerate}
                disabled={generating || !openaiService.isConfigured()}
                className="w-full"
                size="lg"
              >
                {generating ? (
                  <>
                    <LoadingSpinner size="sm" />
                    <span className="ml-2">AI 생성 중...</span>
                  </>
                ) : (
                  <>
                    <span className="text-xl mr-2">🤖</span>
                    AI로 생활기록부 생성하기
                  </>
                )}
              </Button>
              
              {!openaiService.isConfigured() && (
                <p className="text-sm text-red-600 mt-2 text-center">
                  OpenAI API 키가 설정되지 않았습니다.
                </p>
              )}
            </div>
          )}
        </div>

        {/* 오른쪽: 선택된 설문 응답 미리보기 */}
        <div className="space-y-6">
          {selectedSurveyResponses.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                선택된 설문 응답 ({selectedSurveyResponses.length}개)
              </h3>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {selectedSurveyResponses.map((response, index) => (
                  <div key={response.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="bg-gray-50 rounded-lg p-3 mb-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900">
                          설문 {index + 1}: {selectedStudent?.name}
                        </span>
                        <span className="text-sm text-gray-500">
                          {response.submittedAt ? new Date(response.submittedAt).toLocaleDateString() : '날짜 없음'}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600">{response.templateId}</div>
                    </div>
                    
                    <div className="space-y-2">
                      {response.responses.slice(0, 3).map((resp, respIndex) => (
                        <div key={respIndex} className="text-sm">
                          <div className="font-medium text-gray-700 mb-1">
                            {resp.textAnswer || `질문 ${respIndex + 1}`}
                          </div>
                          <div className="text-gray-600 bg-gray-50 p-2 rounded">
                            {typeof resp.answer === 'string' ? resp.answer : JSON.stringify(resp.answer)}
                          </div>
                        </div>
                      ))}
                      {response.responses.length > 3 && (
                        <div className="text-xs text-gray-500 text-center py-2">
                          ... 외 {response.responses.length - 3}개 더
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 하단 버튼 */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={onBack}
          className="px-6"
        >
          ← 이전 단계
        </Button>
        
        <div className="text-sm text-gray-500">
          다음 단계: AI 생성 결과 확인
        </div>
      </div>
    </div>
  )
} 