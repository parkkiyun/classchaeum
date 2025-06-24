import React, { useState, useEffect } from 'react'
import { Button } from '../../../components/ui/Button'
import type { Student, SurveyResponse } from '../../../types'
import type { GenerateRequest } from '../../../services/openaiService'
import { useByteLimits } from '../../../hooks/useByteLimits'
import { getByteLength, isOverByteLimit } from '../../../utils/textUtils'

interface Step2RecordEditingProps {
  selectedArea: GenerateRequest['area']
  student: Student
  surveyResponse: SurveyResponse
  aiContent: string
  onBack: () => void
  onNext: () => void
  onSave: (content: string) => Promise<void>
  groupName: string
  getExistingRecord: (studentId: string, area: GenerateRequest['area']) => Promise<string | undefined>
}

export const Step2RecordEditing: React.FC<Step2RecordEditingProps> = ({
  selectedArea,
  student,
  surveyResponse,
  aiContent,
  onBack,
  onNext,
  onSave,
  groupName,
  getExistingRecord
}) => {
  const [editableContent, setEditableContent] = useState<string>('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loadingExisting, setLoadingExisting] = useState(true)
  const [hasExistingRecord, setHasExistingRecord] = useState(false)

  // 바이트 제한 설정 로드
  const { getByteLimitForArea } = useByteLimits()
  const byteLimit = getByteLimitForArea(selectedArea)
  const currentBytes = getByteLength(editableContent)
  const isOverLimit = isOverByteLimit(editableContent, byteLimit)

  // 기존 기록 로드
  useEffect(() => {
    const loadExistingRecord = async () => {
      try {
        setLoadingExisting(true)
        const existingContent = await getExistingRecord(student.id, selectedArea)
        if (existingContent) {
          setEditableContent(existingContent)
          setHasExistingRecord(true)
        }
      } catch (error) {
        console.error('기존 기록 로드 실패:', error)
      } finally {
        setLoadingExisting(false)
      }
    }

    loadExistingRecord()
  }, [student.id, selectedArea, getExistingRecord])

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

  const handleCopyFromAI = () => {
    setEditableContent(aiContent)
  }

  const handleSave = async () => {
    if (!editableContent.trim()) {
      alert('저장할 내용을 입력해주세요.')
      return
    }

    try {
      setSaving(true)
      await onSave(editableContent)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000) // 2초 후 저장 표시 제거
    } catch (error) {
      console.error('저장 실패:', error)
      alert('저장 중 오류가 발생했습니다.')
    } finally {
      setSaving(false)
    }
  }

  const handleComplete = () => {
    if (!saved && editableContent.trim()) {
      if (confirm('저장하지 않은 내용이 있습니다. 저장하지 않고 계속하시겠습니까?')) {
        onNext()
      }
    } else {
      onNext()
    }
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center">
          <div className="flex items-center justify-center w-12 h-12 mx-auto bg-blue-100 rounded-full mb-4">
            <span className="text-2xl">✏️</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">기록 작성</h2>
          <p className="text-gray-600 mt-2">
            {student.name} 학생의 {getAreaName(selectedArea)} 기록을 작성합니다
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
              <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                ✓
              </div>
              <span className="ml-2 text-sm text-green-600">학생 선택</span>
            </div>
            <div className="w-8 h-px bg-gray-300"></div>
            <div className="flex items-center">
              <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                3
              </div>
              <span className="ml-2 text-sm font-medium text-blue-600">기록 작성</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 왼쪽: AI 생성 결과 */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">🤖 AI 생성 결과</h3>
              <Button
                onClick={handleCopyFromAI}
                variant="outline"
                size="sm"
              >
                📋 복사하기
              </Button>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <div className="text-sm text-gray-600 mb-2">
                참고 설문: {surveyResponse.templateId}
              </div>
              <div className="text-sm font-medium text-gray-900">
                {student.name} ({student.grade}학년 {student.class}반)
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="text-gray-800 whitespace-pre-wrap leading-relaxed">
                {aiContent}
              </div>
              <div className="text-sm text-gray-500 mt-2">
                {getByteLength(aiContent)} bytes (≈ {aiContent.length}글자)
              </div>
            </div>
          </div>

          {/* 참고 설문 응답 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">📋 참고 설문 응답</h3>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {surveyResponse.responses.map((response, index) => (
                <div key={index} className="border-l-4 border-green-200 pl-4 py-2">
                  <div className="text-sm font-medium text-gray-700 mb-1">
                    {response.textAnswer}
                  </div>
                  <div className="text-gray-600 text-sm">
                    {response.answer}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 오른쪽: 기록 편집 */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                📝 {getAreaName(selectedArea)} 기록
              </h3>
              {hasExistingRecord && (
                <span className="text-sm bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                  기존 기록 있음
                </span>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  기록 내용
                </label>
                <textarea
                  value={editableContent}
                  onChange={(e) => setEditableContent(e.target.value)}
                  rows={12}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="생활기록부 내용을 입력하세요..."
                />
                <div className="flex justify-between items-center mt-2">
                  <div className={`text-sm ${isOverLimit ? 'text-red-600' : 'text-gray-500'}`}>
                    {currentBytes}/{byteLimit} bytes (≈ {editableContent.length}글자)
                  </div>
                  {isOverLimit && (
                    <div className="text-sm text-red-600 font-medium">
                      바이트 제한 초과
                    </div>
                  )}
                </div>
              </div>

              <div className="flex space-x-3">
                <Button
                  onClick={handleSave}
                  disabled={saving || !editableContent.trim() || isOverLimit}
                  className="flex-1"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      저장 중...
                    </>
                  ) : saved ? (
                    <>
                      <span className="mr-2">✅</span>
                      저장 완료
                    </>
                  ) : (
                    <>
                      <span className="mr-2">💾</span>
                      저장하기
                    </>
                  )}
                </Button>
              </div>

              {hasExistingRecord && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-yellow-800">기존 기록 있음</h3>
                      <div className="mt-2 text-sm text-yellow-700">
                        <p>이 학생의 {getAreaName(selectedArea)} 기록이 이미 존재합니다. 저장하면 새로운 버전으로 업데이트됩니다.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 하단 버튼 */}
      <div className="flex justify-between">
        <Button
          onClick={onBack}
          variant="outline"
        >
          ← 이전: 학생 선택
        </Button>
        <Button
          onClick={handleComplete}
          className="bg-green-600 hover:bg-green-700"
        >
          작성 완료 →
        </Button>
      </div>
    </div>
  )
} 