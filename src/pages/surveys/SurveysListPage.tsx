import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useAppStore } from '../../store/appStore'
import { getTeacherSurveys, getSurveyResponses } from '../../services/surveyService'
import { Survey } from '../../types/survey'
import { Button } from '../../components/ui/Button'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { Plus, Eye, Users, Calendar, Link as LinkIcon, BarChart3 } from 'lucide-react'

export const SurveysListPage: React.FC = () => {
  const navigate = useNavigate()
  const { teacher } = useAuth()
  const { getGroupsByTeacher } = useAppStore()
  
  const [surveys, setSurveys] = useState<Survey[]>([])
  const [loading, setLoading] = useState(true)
  const [responseCounts, setResponseCounts] = useState<Record<string, number>>({})

  const myGroups = teacher ? getGroupsByTeacher(teacher.uid) : []

  useEffect(() => {
    const loadSurveys = async () => {
      if (!teacher) {
        console.log('설문 목록 로딩 건너뜀 - teacher 없음')
        return
      }

      try {
        setLoading(true)
        console.log('설문 목록 로딩 시작 - teacherId:', teacher.uid)
        
        const surveysData = await getTeacherSurveys(teacher.uid)
        console.log('getTeacherSurveys 결과:', surveysData)
        
        setSurveys(surveysData)

        // 각 설문의 응답 수 조회
        const counts: Record<string, number> = {}
        for (const survey of surveysData) {
          try {
            const responses = await getSurveyResponses(survey.id)
            counts[survey.id] = responses.length
            console.log(`설문 ${survey.id} 응답 수:`, responses.length)
          } catch (error) {
            console.error(`설문 ${survey.id} 응답 수 조회 실패:`, error)
            counts[survey.id] = 0
          }
        }
        setResponseCounts(counts)
      } catch (error) {
        console.error('설문 목록 로드 실패:', error)
        if (error instanceof Error) {
          console.error('에러 메시지:', error.message)
          console.error('에러 스택:', error.stack)
        }
      } finally {
        setLoading(false)
      }
    }

    loadSurveys()
  }, [teacher])

  const getGroupName = (groupId: string) => {
    const group = myGroups.find(g => g.id === groupId)
    return group ? `${group.name} (${group.type})` : '알 수 없는 클래스'
  }

  const copyLink = async (surveyId: string) => {
    const baseUrl = import.meta.env.VITE_APP_URL || window.location.origin
    const link = `${baseUrl}/survey/${surveyId}`
    try {
      await navigator.clipboard.writeText(link)
      alert('설문 링크가 클립보드에 복사되었습니다!')
    } catch (error) {
      console.error('링크 복사 실패:', error)
      // 폴백: 프롬프트로 링크 표시
      prompt('설문 링크를 복사하세요:', link)
    }
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">내 설문</h1>
          <p className="text-gray-600">생성한 설문을 관리하고 응답을 확인하세요</p>
        </div>
        <Button
          onClick={() => navigate('/surveys/create')}
          className="bg-blue-600 hover:bg-blue-700 text-white flex items-center"
        >
          <Plus size={16} className="mr-2" />
          새 설문 만들기
        </Button>
      </div>

      {surveys.length === 0 ? (
        <div className="text-center py-12">
          <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <BarChart3 size={32} className="text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">아직 설문이 없습니다</h3>
          <p className="text-gray-600 mb-6">첫 번째 설문을 만들어 학생들의 의견을 수집해보세요</p>
          <Button
            onClick={() => navigate('/surveys/create')}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            설문 만들기
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {surveys.map((survey) => (
            <div key={survey.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                    {survey.title}
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">
                    {getGroupName(survey.groupId)}
                  </p>
                  {survey.description && (
                    <p className="text-sm text-gray-500 line-clamp-2 mb-3">
                      {survey.description}
                    </p>
                  )}
                </div>
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                  survey.isActive 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {survey.isActive ? '활성' : '비활성'}
                </div>
              </div>

              <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                <div className="flex items-center">
                  <Users size={14} className="mr-1" />
                  <span>{responseCounts[survey.id] || 0}개 응답</span>
                </div>
                <div className="flex items-center">
                  <Calendar size={14} className="mr-1" />
                  <span>{formatDate(survey.createdAt)}</span>
                </div>
              </div>

              <div className="flex space-x-2">
                <Button
                  onClick={() => navigate(`/surveys/${survey.id}`)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm py-2"
                >
                  <Eye size={14} className="mr-1" />
                  상세보기
                </Button>
                <Button
                  onClick={() => copyLink(survey.id)}
                  className="flex-1 bg-blue-100 hover:bg-blue-200 text-blue-700 text-sm py-2"
                >
                  <LinkIcon size={14} className="mr-1" />
                  링크 복사
                </Button>
              </div>

              <div className="mt-3 pt-3 border-t border-gray-100">
                <div className="text-xs text-gray-500">
                  문항 {survey.questions.length}개 • 
                  {survey.allowEdit ? ' 수정 가능' : ' 수정 불가'}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
} 