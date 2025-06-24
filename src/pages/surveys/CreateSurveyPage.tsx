import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useAppStore } from '../../store/appStore'
import { createSurvey } from '../../services/surveyService'
import { SurveyQuestion } from '../../types/survey'
import { Button } from '../../components/ui/Button'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { Plus, Trash2, Copy } from 'lucide-react'

export const CreateSurveyPage: React.FC = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { teacher } = useAuth()
  const { getGroupsByTeacher } = useAppStore()
  
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    groupId: ''
  })

  // URL에서 groupId 파라미터 읽어서 기본값으로 설정
  useEffect(() => {
    const groupIdParam = searchParams.get('groupId')
    if (groupIdParam) {
      setFormData(prev => ({ ...prev, groupId: groupIdParam }))
    }
  }, [searchParams])
  
  const [questions, setQuestions] = useState<SurveyQuestion[]>([
    {
      id: '1',
      type: 'short',
      question: '',
      required: true,
      options: []
    }
  ])

  const myGroups = teacher ? getGroupsByTeacher(teacher.uid) : []

  const addQuestion = () => {
    const newQuestion: SurveyQuestion = {
      id: Date.now().toString(),
      type: 'short',
      question: '',
      required: false,
      options: []
    }
    setQuestions([...questions, newQuestion])
  }

  const removeQuestion = (id: string) => {
    if (questions.length > 1) {
      setQuestions(questions.filter(q => q.id !== id))
    }
  }

  const updateQuestion = (id: string, updates: Partial<SurveyQuestion>) => {
    setQuestions(questions.map(q => 
      q.id === id ? { ...q, ...updates } : q
    ))
  }

  const addOption = (questionId: string) => {
    updateQuestion(questionId, {
      options: [...(questions.find(q => q.id === questionId)?.options || []), '']
    })
  }

  const updateOption = (questionId: string, optionIndex: number, value: string) => {
    const question = questions.find(q => q.id === questionId)
    if (question?.options) {
      const newOptions = [...question.options]
      newOptions[optionIndex] = value
      updateQuestion(questionId, { options: newOptions })
    }
  }

  const removeOption = (questionId: string, optionIndex: number) => {
    const question = questions.find(q => q.id === questionId)
    if (question?.options && question.options.length > 1) {
      const newOptions = question.options.filter((_, index) => index !== optionIndex)
      updateQuestion(questionId, { options: newOptions })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!teacher || loading) return

    // 유효성 검사
    if (!formData.title.trim()) {
      alert('설문 제목을 입력해주세요.')
      return
    }

    if (!formData.groupId) {
      alert('클래스 정보가 없습니다. 클래스 페이지에서 다시 시도해주세요.')
      return
    }

    const validQuestions = questions.filter(q => q.question.trim())
    if (validQuestions.length === 0) {
      alert('최소 하나의 문항을 입력해주세요.')
      return
    }

    // 객관식 문항 검증
    for (const question of validQuestions) {
      if (question.type === 'multiple') {
        const validOptions = question.options?.filter(opt => opt.trim()) || []
        if (validOptions.length < 2) {
          alert('객관식 문항은 최소 2개의 선택지가 필요합니다.')
          return
        }
        question.options = validOptions
      }
    }

    try {
      setLoading(true)
      
      const surveyId = await createSurvey(
        teacher.uid,
        formData.groupId,
        formData.title,
        formData.description,
        validQuestions
      )

      alert('설문이 성공적으로 생성되었습니다!')
      // 특정 그룹에서 온 경우 그룹 페이지로, 아니면 설문 목록으로
      const groupIdParam = searchParams.get('groupId')
      if (groupIdParam) {
        navigate(`/groups/${groupIdParam}#surveys`)
      } else {
        navigate('/surveys')
      }
    } catch (error) {
      console.error('설문 생성 실패:', error)
      alert('설문 생성 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const renderQuestionEditor = (question: SurveyQuestion, index: number) => (
    <div key={question.id} className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-medium text-gray-900">문항 {index + 1}</h3>
        <div className="flex space-x-2">
          <button
            type="button"
            onClick={() => {
              const newQuestion = { ...question, id: Date.now().toString() }
              setQuestions([...questions, newQuestion])
            }}
            className="p-2 text-gray-400 hover:text-gray-600"
            title="문항 복사"
          >
            <Copy size={16} />
          </button>
          {questions.length > 1 && (
            <button
              type="button"
              onClick={() => removeQuestion(question.id)}
              className="p-2 text-red-400 hover:text-red-600"
              title="문항 삭제"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {/* 문항 타입 선택 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            문항 타입
          </label>
          <select
            value={question.type}
            onChange={(e) => updateQuestion(question.id, { 
              type: e.target.value as SurveyQuestion['type'],
              options: e.target.value === 'multiple' ? ['', ''] : []
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="short">단답형</option>
            <option value="long">장문형</option>
            <option value="multiple">객관식</option>
            <option value="rating">평점</option>
          </select>
        </div>

        {/* 문항 내용 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            문항 내용
          </label>
          <textarea
            value={question.question}
            onChange={(e) => updateQuestion(question.id, { question: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={2}
            placeholder="문항을 입력하세요"
          />
        </div>

        {/* 객관식 선택지 */}
        {question.type === 'multiple' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              선택지
            </label>
            <div className="space-y-2">
              {question.options?.map((option, optionIndex) => (
                <div key={optionIndex} className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500 w-6">{optionIndex + 1}.</span>
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => updateOption(question.id, optionIndex, e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={`선택지 ${optionIndex + 1}`}
                  />
                  {question.options && question.options.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeOption(question.id, optionIndex)}
                      className="p-2 text-red-400 hover:text-red-600"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => addOption(question.id)}
                className="flex items-center text-blue-600 hover:text-blue-700 text-sm"
              >
                <Plus size={16} className="mr-1" />
                선택지 추가
              </button>
            </div>
          </div>
        )}

        {/* 필수 여부 */}
        <div className="flex items-center">
          <input
            type="checkbox"
            id={`required-${question.id}`}
            checked={question.required}
            onChange={(e) => updateQuestion(question.id, { required: e.target.checked })}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor={`required-${question.id}`} className="ml-2 text-sm text-gray-700">
            필수 문항
          </label>
        </div>
      </div>
    </div>
  )

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">새 설문 만들기</h1>
        <p className="mt-2 text-gray-600">학생들이 응답할 수 있는 설문을 생성하세요</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* 기본 정보 */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">기본 정보</h2>
          
          <div className="grid grid-cols-1 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                설문 제목 *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="예: 중간고사 피드백 설문"
                required
              />
            </div>
          </div>

          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              설문 설명
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
              placeholder="설문에 대한 간단한 설명을 입력하세요"
            />
          </div>
        </div>

        {/* 문항 */}
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">문항 구성</h2>
            <Button
              type="button"
              onClick={addQuestion}
              className="bg-blue-600 hover:bg-blue-700 text-white flex items-center"
            >
              <Plus size={16} className="mr-2" />
              문항 추가
            </Button>
          </div>

          <div className="space-y-6">
            {questions.map((question, index) => renderQuestionEditor(question, index))}
          </div>
        </div>

        {/* 제출 버튼 */}
        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            onClick={() => {
              const groupIdParam = searchParams.get('groupId')
              if (groupIdParam) {
                navigate(`/groups/${groupIdParam}#surveys`)
              } else {
                navigate('/surveys')
              }
            }}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700"
          >
            취소
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {loading ? (
              <div className="flex items-center">
                <LoadingSpinner size="sm" />
                <span className="ml-2">생성 중...</span>
              </div>
            ) : (
              '설문 생성'
            )}
          </Button>
        </div>
      </form>
    </div>
  )
} 