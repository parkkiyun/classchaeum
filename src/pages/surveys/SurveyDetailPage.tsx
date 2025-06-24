import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { getSurvey, getSurveyResponses } from '../../services/surveyService'
import { Survey, SurveyResponse } from '../../types/survey'
import { Button } from '../../components/ui/Button'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { ArrowLeft, Link as LinkIcon, BarChart3, Users, Calendar } from 'lucide-react'

export const SurveyDetailPage: React.FC = () => {
  const { surveyId } = useParams<{ surveyId: string }>()
  const navigate = useNavigate()
  const { teacher } = useAuth()
  
  const [survey, setSurvey] = useState<Survey | null>(null)
  const [responses, setResponses] = useState<SurveyResponse[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      if (!surveyId) return

      try {
        setLoading(true)
        const [surveyData, responsesData] = await Promise.all([
          getSurvey(surveyId),
          getSurveyResponses(surveyId)
        ])
        
        setSurvey(surveyData)
        setResponses(responsesData)
      } catch (error) {
        console.error('데이터 로드 실패:', error)
        alert('데이터를 불러오는 중 오류가 발생했습니다.')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [surveyId])

  const copyLink = async () => {
    if (!surveyId) return
    const link = `${window.location.origin}/survey/${surveyId}`
    try {
      await navigator.clipboard.writeText(link)
      alert('설문 링크가 클립보드에 복사되었습니다!')
    } catch (error) {
      prompt('설문 링크를 복사하세요:', link)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!survey) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">설문을 찾을 수 없습니다</h2>
        <Button onClick={() => navigate('/surveys')} className="mt-4">
          설문 목록으로 돌아가기
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            onClick={() => navigate('/surveys')}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700"
          >
            <ArrowLeft size={16} className="mr-2" />
            목록으로
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{survey.title}</h1>
            <p className="text-gray-600">{survey.description}</p>
          </div>
        </div>
        <div className="flex space-x-3">
          <Button
            onClick={copyLink}
            className="bg-blue-100 hover:bg-blue-200 text-blue-700"
          >
            <LinkIcon size={16} className="mr-2" />
            링크 복사
          </Button>
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">총 응답 수</p>
              <p className="text-2xl font-bold text-gray-900">{responses.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <BarChart3 className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">문항 수</p>
              <p className="text-2xl font-bold text-gray-900">{survey.questions.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <Calendar className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">생성일</p>
              <p className="text-2xl font-bold text-gray-900">
                {survey.createdAt.toLocaleDateString('ko-KR')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 응답 목록 */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">응답 목록</h2>
        </div>
        
        {responses.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            아직 응답이 없습니다.
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {responses.map((response) => (
              <div key={response.id} className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-gray-900">
                      {response.studentName || '익명'}
                    </p>
                    <p className="text-sm text-gray-600">{response.email}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {response.submittedAt.toLocaleString('ko-KR')}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      response.editEmailSent 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {response.editEmailSent ? '수정링크 발송됨' : '수정링크 미발송'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
