import React, { useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { doc, getDoc, collection, addDoc, updateDoc } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import type { Survey, SurveyQuestion, SurveyResponse } from '../../types/survey'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { Button } from '../../components/ui/Button'
import { v4 as uuidv4 } from 'uuid'

// 공개 설문 응답 페이지 (로그인 불필요)

export const SurveyResponsePage: React.FC = (): JSX.Element => {
  const { surveyId } = useParams<{ surveyId: string }>()
  const [searchParams] = useSearchParams()
  const responseId = searchParams.get('rid') // 수정 모드용
  
  const [survey, setSurvey] = useState<Survey | null>(null)
  const [existingResponse, setExistingResponse] = useState<SurveyResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({})
  const [email, setEmail] = useState('')
  const [studentName, setStudentName] = useState('')
  const [grade, setGrade] = useState('')
  const [classNumber, setClassNumber] = useState('')
  const [studentNumber, setStudentNumber] = useState('')
  const [isEditMode, setIsEditMode] = useState(false)
  const [showEmailForm, setShowEmailForm] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [lastResponseId, setLastResponseId] = useState<string | null>(null)

  // 설문 정보 로드
  useEffect(() => {
    const loadSurvey = async () => {
      if (!surveyId) return

      try {
        setLoading(true)
        
        // 설문 정보 로드
        const surveyRef = doc(db, 'surveys', surveyId)
        const surveySnap = await getDoc(surveyRef)
        
        if (!surveySnap.exists()) {
          alert('설문을 찾을 수 없습니다.')
          return
        }

        const surveyData = surveySnap.data()
        const loadedSurvey: Survey = {
          id: surveySnap.id,
          title: surveyData.title,
          description: surveyData.description,
          teacherId: surveyData.teacherId,
          groupId: surveyData.groupId,
          questions: surveyData.questions,
          isActive: surveyData.isActive,
          allowEdit: surveyData.allowEdit,
          createdAt: surveyData.createdAt?.toDate() || new Date(),
          updatedAt: surveyData.updatedAt?.toDate() || new Date(),
          dueDate: surveyData.dueDate?.toDate(),
          maxResponses: surveyData.maxResponses
        }

        if (!loadedSurvey.isActive) {
          alert('이 설문은 현재 비활성화 상태입니다.')
          return
        }

        setSurvey(loadedSurvey)

        // 수정 모드인 경우 기존 응답 로드
        if (responseId) {
          const responseRef = doc(db, 'surveys', surveyId, 'responses', responseId)
          const responseSnap = await getDoc(responseRef)
          
          if (responseSnap.exists()) {
            const responseData = responseSnap.data()
            const response: SurveyResponse = {
              id: responseSnap.id,
              surveyId: surveyId,
              email: responseData.email,
              studentName: responseData.studentName,
              answers: responseData.answers,
              submittedAt: responseData.submittedAt?.toDate() || new Date(),
              updatedAt: responseData.updatedAt?.toDate() || new Date(),
              editEmailSent: responseData.editEmailSent || false,
              ipAddress: responseData.ipAddress,
              userAgent: responseData.userAgent
            }
            
            setExistingResponse(response)
            setAnswers(response.answers)
            setEmail(response.email)
            setStudentName(response.studentName || '')
            setGrade(responseData.grade?.toString() || '')
            setClassNumber(responseData.classNumber?.toString() || '')
            setStudentNumber(responseData.studentNumber?.toString() || '')
            setIsEditMode(true)
          }
        }

      } catch (error) {
        console.error('설문 로드 실패:', error)
        alert('설문을 불러오는 중 오류가 발생했습니다.')
      } finally {
        setLoading(false)
      }
    }

    loadSurvey()
  }, [surveyId, responseId])

  // 답변 변경 처리
  const handleAnswerChange = (questionId: string, value: string | string[]) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }))
  }

  // 필수 질문 검증
  const validateAnswers = (): boolean => {
    if (!survey) return false

    for (const question of survey.questions) {
      if (question.required) {
        const answer = answers[question.id]
        if (!answer || (Array.isArray(answer) && answer.length === 0) || answer === '') {
          alert(`"${question.question}" 항목은 필수입니다.`)
          return false
        }
      }
    }
    return true
  }

  // 설문 응답 제출
  const handleSubmit = async () => {
    if (!survey || !validateAnswers()) return

    if (isEditMode) {
      // 수정 모드: 기존 응답 업데이트
      await handleUpdate()
      return
    }

    // 새 응답 제출
    setSubmitting(true)
    try {
      const newResponseId = uuidv4()
      const responseData: Omit<SurveyResponse, 'id'> = {
        surveyId: survey.id,
        email: email,
        studentName: studentName,
        answers: answers,
        submittedAt: new Date(),
        updatedAt: new Date(),
        editEmailSent: false,
        ipAddress: '', // 클라이언트에서는 빈 값
        userAgent: navigator.userAgent
      }

      const responsesRef = collection(db, 'surveys', survey.id, 'responses')
      const docRef = await addDoc(responsesRef, {
        ...responseData,
        id: newResponseId,
        grade: parseInt(grade) || null,
        classNumber: parseInt(classNumber) || null,
        studentNumber: parseInt(studentNumber) || null
      })

      // 응답 ID 저장 (이메일 발송용)
      setLastResponseId(docRef.id)
      setSubmitted(true)
      setShowEmailForm(true)
      
    } catch (error) {
      console.error('응답 제출 실패:', error)
      alert('응답 제출에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setSubmitting(false)
    }
  }

  // 기존 응답 수정
  const handleUpdate = async () => {
    if (!survey || !existingResponse || !validateAnswers()) return

    setSubmitting(true)
    try {
      const responseRef = doc(db, 'surveys', survey.id, 'responses', existingResponse.id)
      await updateDoc(responseRef, {
        answers: answers,
        studentName: studentName,
        grade: parseInt(grade) || null,
        classNumber: parseInt(classNumber) || null,
        studentNumber: parseInt(studentNumber) || null,
        updatedAt: new Date()
      })

      alert('응답이 성공적으로 수정되었습니다!')
      
    } catch (error) {
      console.error('응답 수정 실패:', error)
      alert('응답 수정에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setSubmitting(false)
    }
  }

  // 이메일 수정 링크 요청
  const handleEmailSubmit = async () => {
    if (!email || !survey) {
      alert('이메일을 입력해주세요.')
      return
    }

    setSubmitting(true)
    try {
      // 응답 ID를 기존 응답 또는 마지막 제출된 응답에서 가져오기
      const currentResponseId = responseId || lastResponseId || uuidv4()
      
      // 이메일 발송 서비스 호출
      const { sendEditLinkEmail } = await import('../../services/surveyService')
      const success = await sendEditLinkEmail(
        survey.id,
        currentResponseId,
        email,
        studentName,
        survey.title
      )

      if (success) {
        alert(`수정 링크가 ${email}로 발송되었습니다! 이메일을 확인해주세요.`)
      } else {
        alert('이메일 발송에 실패했습니다. 다시 시도해주세요.')
      }
      
      setShowEmailForm(false)
    } catch (error) {
      console.error('이메일 발송 실패:', error)
      alert('이메일 발송 중 오류가 발생했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  // 질문 렌더링
  const renderQuestion = (question: SurveyQuestion, index: number) => {
    const answer = answers[question.id] || ''

    return (
      <div key={question.id} className="space-y-3">
        <div className="flex items-start space-x-2">
          <span className="text-sm font-medium text-gray-500 mt-1">
            {index + 1}.
          </span>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-900">
              {question.question}
              {question.required && <span className="text-red-500 ml-1">*</span>}
            </label>
          </div>
        </div>

        <div className="ml-6">
          {question.type === 'short' && (
            <input
              type="text"
              value={typeof answer === 'string' ? answer : ''}
              onChange={(e) => handleAnswerChange(question.id, e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="답변을 입력하세요"
            />
          )}

          {question.type === 'long' && (
            <textarea
              value={typeof answer === 'string' ? answer : ''}
              onChange={(e) => handleAnswerChange(question.id, e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="답변을 입력하세요"
            />
          )}

          {question.type === 'multiple' && question.options && (
            <div className="space-y-2">
              {question.options.map((option, optionIndex) => (
                <label key={optionIndex} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={Array.isArray(answer) && answer.includes(option)}
                    onChange={(e) => {
                      const currentAnswers = Array.isArray(answer) ? answer : []
                      if (e.target.checked) {
                        handleAnswerChange(question.id, [...currentAnswers, option])
                      } else {
                        handleAnswerChange(question.id, currentAnswers.filter(a => a !== option))
                      }
                    }}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-900">{option}</span>
                </label>
              ))}
            </div>
          )}

          {question.type === 'rating' && (
            <div className="flex items-center space-x-2">
              {[1, 2, 3, 4, 5].map((rating) => (
                <button
                  key={rating}
                  type="button"
                  onClick={() => handleAnswerChange(question.id, rating.toString())}
                  className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-medium transition-colors ${
                    answer === rating.toString()
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                  }`}
                >
                  {rating}
                </button>
              ))}
              <span className="text-sm text-gray-500 ml-2">
                (1: 매우 나쁨 ~ 5: 매우 좋음)
              </span>
            </div>
          )}
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">설문을 불러오는 중...</p>
        </div>
      </div>
    )
  }

  if (!survey) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">설문을 찾을 수 없습니다</h2>
          <p className="mt-2 text-gray-600">요청하신 설문이 존재하지 않거나 비활성화되었습니다.</p>
        </div>
      </div>
    )
  }

  if (submitted && showEmailForm) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
          <div className="text-center mb-6">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
              <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-lg font-medium text-gray-900">응답 제출 완료!</h2>
            <p className="mt-2 text-sm text-gray-600">
              설문에 응답해 주셔서 감사합니다.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                이메일 주소 (수정 링크 수신용)
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="your-email@example.com"
              />
              <p className="mt-1 text-xs text-gray-500">
                나중에 응답을 수정할 수 있는 링크를 이메일로 받으실 수 있습니다.
              </p>
            </div>

            <div className="flex space-x-3">
              <Button
                onClick={handleEmailSubmit}
                disabled={submitting}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <LoadingSpinner size="sm" />
                    <span className="ml-2">발송 중...</span>
                  </>
                ) : (
                  '수정 링크 받기'
                )}
              </Button>
              <Button
                onClick={() => setShowEmailForm(false)}
                disabled={submitting}
                className="bg-gray-300 hover:bg-gray-400 text-gray-700 disabled:opacity-50"
              >
                건너뛰기
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
            <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-lg font-medium text-gray-900">설문 응답이 완료되었습니다!</h2>
          <p className="mt-2 text-sm text-gray-600">
            소중한 의견을 주셔서 감사합니다.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 헤더 */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900">{survey.title}</h1>
          {survey.description && (
            <p className="mt-2 text-gray-600">{survey.description}</p>
          )}
          <div className="mt-4 flex items-center space-x-4 text-sm text-gray-500">
            <span>질문 {survey.questions.length}개</span>
            {survey.dueDate && (
              <>
                <span>•</span>
                <span>마감: {survey.dueDate.toLocaleDateString()}</span>
              </>
            )}
            {isEditMode && (
              <>
                <span>•</span>
                <span className="text-blue-600 font-medium">수정 모드</span>
              </>
            )}
          </div>
        </div>

        {/* 기본 정보 입력 */}
        {!isEditMode && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">기본 정보</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  이름 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="이름을 입력하세요"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  이메일
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="your-email@example.com"
                />
              </div>
            </div>
            
            {/* 학급 정보 */}
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-3">학급 정보</h4>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    학년 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="3"
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="1"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    반 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={classNumber}
                    onChange={(e) => setClassNumber(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="1"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    번호 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="40"
                    value={studentNumber}
                    onChange={(e) => setStudentNumber(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="1"
                    required
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 설문 질문들 */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="space-y-8">
            {survey.questions.map((question, index) => renderQuestion(question, index))}
          </div>
        </div>

        {/* 제출 버튼 */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex justify-end space-x-4">
            <Button
              onClick={handleSubmit}
              disabled={submitting || (!studentName && !isEditMode) || (!isEditMode && (!grade || !classNumber || !studentNumber))}
              className="bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span className="ml-2">
                    {isEditMode ? '수정 중...' : '제출 중...'}
                  </span>
                </>
              ) : (
                isEditMode ? '수정 완료' : '응답 제출'
              )}
            </Button>
          </div>
          
          {!isEditMode && (
            <p className="mt-3 text-xs text-gray-500">
              * 필수 항목을 모두 입력해주세요. 제출 후 이메일을 통해 수정 링크를 받을 수 있습니다.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
