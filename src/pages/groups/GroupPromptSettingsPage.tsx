import React, { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { getAllAreaPrompts, getAllAreaExamples, saveGroupPrompts } from '../../services/promptService'
import { Button } from '../../components/ui/Button'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import type { Group, GroupType } from '../../types'
import { DEFAULT_PROMPTS, PROMPT_TITLES, PROMPT_DESCRIPTIONS } from '../../constants/defaultPrompts'

interface GroupPromptSettingsPageProps {
  group: Group
  onBack: () => void
}

// 클래스 유형별 사용 가능한 영역
const AVAILABLE_AREAS_BY_TYPE: Record<GroupType, Array<keyof typeof DEFAULT_PROMPTS>> = {
  '담임': ['autonomous', 'career', 'behavior'],
  '교과': ['subject'],
  '동아리': ['club']
}

export const GroupPromptSettingsPage: React.FC<GroupPromptSettingsPageProps> = ({ 
  group, 
  onBack 
}) => {
  const { teacher } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [prompts, setPrompts] = useState<Record<string, string>>({})
  const [examples, setExamples] = useState<Record<string, string[]>>({})
  const [activeTab, setActiveTab] = useState<keyof typeof DEFAULT_PROMPTS | ''>('')

  // 현재 클래스 유형에서 사용 가능한 영역
  const availableAreas = AVAILABLE_AREAS_BY_TYPE[group.type] || []

  // 프롬프트 로드
  useEffect(() => {
    const loadPrompts = async () => {
      if (!teacher) return

      try {
        setLoading(true)
        const [allPrompts, allExamples] = await Promise.all([
          getAllAreaPrompts(group.id, teacher.uid),
          getAllAreaExamples(group.id, teacher.uid)
        ])
        
        // 사용 가능한 영역의 프롬프트만 로드 (기본 프롬프트는 빈 상태로 표시)
        const filteredPrompts: Record<string, string> = {}
        const filteredExamples: Record<string, string[]> = {}
        
        availableAreas.forEach(area => {
          const userPrompt = allPrompts[area]
          // 사용자 정의 프롬프트가 있고 기본 프롬프트와 다르면 표시, 아니면 빈 상태
          filteredPrompts[area] = (userPrompt && userPrompt !== DEFAULT_PROMPTS[area]) ? userPrompt : ''
          
          // 예시문 로드 (없으면 빈 배열 2개로 초기화)
          const areaExamples = allExamples[area] || []
          filteredExamples[area] = areaExamples.length > 0 ? areaExamples : ['', '']
        })
        
        setPrompts(filteredPrompts)
        setExamples(filteredExamples)
        
        // 첫 번째 사용 가능한 영역을 기본 탭으로 설정
        if (availableAreas.length > 0) {
          setActiveTab(availableAreas[0])
        }
        
      } catch (error) {
        console.error('❌ 프롬프트 로드 실패:', error)
      } finally {
        setLoading(false)
      }
    }

    loadPrompts()
  }, [group.id, teacher, availableAreas])

  // 프롬프트 저장
  const handleSave = async () => {
    if (!teacher) return

    try {
      setSaving(true)
      
      // 사용자 정의 프롬프트만 저장 (빈 문자열이면 저장하지 않음 = 기본 프롬프트 사용)
      const promptsToSave: Record<string, string> = {}
      const examplesToSave: Record<string, string[]> = {}
      
      availableAreas.forEach(area => {
        const userPrompt = prompts[area]?.trim()
        if (userPrompt && userPrompt !== DEFAULT_PROMPTS[area]) {
          promptsToSave[area] = userPrompt
        }
        
        // 예시문 저장 (빈 문자열이 아닌 것만)
        const areaExamples = examples[area]?.filter(ex => ex.trim() !== '') || []
        if (areaExamples.length > 0) {
          examplesToSave[area] = areaExamples
        }
      })
      
      await saveGroupPrompts(group.id, teacher.uid, promptsToSave, examplesToSave)
      
      alert('프롬프트와 예시문이 성공적으로 저장되었습니다.')
      
    } catch (error) {
      console.error('❌ 프롬프트 저장 실패:', error)
      alert('프롬프트 저장에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  // 기본값으로 복원 (빈 상태로 만들어서 기본 프롬프트 사용)
  const handleReset = (area: keyof typeof DEFAULT_PROMPTS) => {
    setPrompts(prev => ({
      ...prev,
      [area]: ''
    }))
    setExamples(prev => ({
      ...prev,
      [area]: ['', '']
    }))
  }

  // 프롬프트 변경
  const handlePromptChange = (area: keyof typeof DEFAULT_PROMPTS, value: string) => {
    setPrompts(prev => ({
      ...prev,
      [area]: value
    }))
  }

  // 예시문 변경
  const handleExampleChange = (area: keyof typeof DEFAULT_PROMPTS, index: number, value: string) => {
    setExamples(prev => {
      const areaExamples = [...(prev[area] || ['', ''])]
      areaExamples[index] = value
      return {
        ...prev,
        [area]: areaExamples
      }
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">프롬프트를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">프롬프트 설정</h2>
            <p className="text-gray-600 mt-1">
              {group.name} 클래스의 AI 생성 프롬프트를 관리합니다
            </p>
          </div>
          <Button
            onClick={onBack}
            variant="outline"
            size="sm"
          >
            ← 돌아가기
          </Button>
        </div>
      </div>

      {availableAreas.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <div className="text-gray-400 text-6xl mb-4">⚙️</div>
          <p className="text-gray-500">이 클래스 유형에서는 설정 가능한 프롬프트가 없습니다.</p>
        </div>
      ) : (
        <>
          {/* 탭 네비게이션 */}
          <div className="bg-white rounded-lg shadow">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8 px-6">
                {availableAreas.map((area) => (
                  <button
                    key={area}
                    onClick={() => setActiveTab(area)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === area
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {PROMPT_TITLES[area]}
                  </button>
                ))}
              </nav>
            </div>

            {/* 프롬프트 편집 영역 */}
            {activeTab && (
              <div className="p-6">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {PROMPT_TITLES[activeTab]}
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    {PROMPT_DESCRIPTIONS[activeTab]}
                  </p>
                  
                  <div className="flex items-center space-x-3 mb-4">
                    <Button
                      onClick={() => handleReset(activeTab)}
                      variant="outline"
                      size="sm"
                    >
                      기본 프롬프트 사용
                    </Button>
                    <span className="text-xs text-gray-500">
                      * 내용을 지워서 기본 프롬프트를 사용합니다
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      프롬프트 내용
                    </label>
                    
                    {/* 프롬프트 상태 표시 */}
                    <div className="mb-3">
                      {!prompts[activeTab] || prompts[activeTab].trim() === '' ? (
                        <div className="text-sm text-blue-600 bg-blue-50 p-3 rounded-lg border border-blue-200">
                          💡 현재 <strong>기본 프롬프트</strong>가 사용됩니다. 내용을 입력하면 사용자 정의 프롬프트로 변경됩니다.
                        </div>
                      ) : (
                        <div className="text-sm text-green-600 bg-green-50 p-3 rounded-lg border border-green-200">
                          ✅ <strong>사용자 정의 프롬프트</strong>가 사용됩니다. 모든 내용을 지우면 기본 프롬프트로 돌아갑니다.
                        </div>
                      )}
                    </div>
                    
                    <textarea
                      value={prompts[activeTab] || ''}
                      onChange={(e) => handlePromptChange(activeTab, e.target.value)}
                      rows={15}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                      placeholder={`${PROMPT_TITLES[activeTab]} 영역의 사용자 정의 프롬프트를 입력하세요...\n\n빈 상태로 두면 기본 프롬프트가 사용됩니다.`}
                    />
                    <p className="mt-2 text-xs text-gray-500">
                      * 설문 응답은 자동으로 프롬프트 끝에 추가됩니다.
                    </p>
                  </div>

                  {/* 예시문 입력 영역 */}
                  <div className="mt-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      예시문 (AI 학습용)
                    </label>
                    <p className="text-xs text-gray-500 mb-3">
                      예시문을 입력하면 AI가 해당 데이터를 학습하여 더 정확한 응답을 생성합니다. 예시문은 설문 응답 다음에 추가됩니다.
                    </p>
                    
                    <div className="space-y-3">
                      {(examples[activeTab] || ['', '']).map((example, index) => (
                        <div key={index}>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            예시문 {index + 1}
                          </label>
                          <textarea
                            value={example}
                            onChange={(e) => handleExampleChange(activeTab, index, e.target.value)}
                            rows={4}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            placeholder={`예시문 ${index + 1}을 입력하세요... (선택사항)`}
                          />
                        </div>
                      ))}
                    </div>
                    
                    <p className="mt-2 text-xs text-gray-400">
                      💡 예시문은 AI가 생성할 문장의 스타일과 형식을 학습하는 데 도움이 됩니다.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 저장 버튼 */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">
                  변경사항은 저장 후 즉시 적용됩니다.
                </p>
              </div>
              <Button
                onClick={handleSave}
                disabled={saving}
                size="lg"
              >
                {saving ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    저장 중...
                  </>
                ) : (
                  '저장'
                )}
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  )
} 