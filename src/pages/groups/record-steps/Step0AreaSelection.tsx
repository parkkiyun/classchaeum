import React from 'react'
import { Button } from '../../../components/ui/Button'
import type { GenerateRequest } from '../../../services/openaiService'
import type { GroupType } from '../../../types'

interface AreaInfo {
  id: GenerateRequest['area']
  name: string
  description: string
  icon: string
  allowedGroupTypes: GroupType[]
}

const AREAS: AreaInfo[] = [
  {
    id: 'autonomous',
    name: '자율활동',
    description: '자율적 학습활동 및 창의적 체험활동',
    icon: '🎯',
    allowedGroupTypes: ['담임']
  },
  {
    id: 'career',
    name: '진로활동', 
    description: '진로탐색 및 진로체험 활동',
    icon: '🚀',
    allowedGroupTypes: ['담임']
  },
  {
    id: 'behavior',
    name: '행동특성',
    description: '학생의 행동 및 성격 특성',
    icon: '👤',
    allowedGroupTypes: ['담임']
  },
  {
    id: 'subject',
    name: '교과세특',
    description: '교과별 세부능력 및 특기사항',
    icon: '📚',
    allowedGroupTypes: ['교과']
  },
  {
    id: 'club',
    name: '동아리',
    description: '동아리 활동 및 특별활동',
    icon: '🎭',
    allowedGroupTypes: ['동아리']
  }
]

interface Step0AreaSelectionProps {
  selectedArea: GenerateRequest['area'] | ''
  onAreaSelect: (area: GenerateRequest['area']) => void
  onNext: () => void
  onGoToSettings: () => void
  groupName: string
  groupType: GroupType
}

export const Step0AreaSelection: React.FC<Step0AreaSelectionProps> = ({
  selectedArea,
  onAreaSelect,
  onNext,
  onGoToSettings,
  groupName,
  groupType
}) => {
  // 클래스 유형에 따른 사용 가능한 영역 필터링
  const availableAreas = AREAS.filter(area => 
    area.allowedGroupTypes.includes(groupType)
  )

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center relative">
          {/* 설정 아이콘 */}
          <button
            onClick={onGoToSettings}
            className="absolute top-0 right-0 p-2 text-gray-400 hover:text-gray-600 transition-colors"
            title="프롬프트 설정"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
          
          <div className="flex items-center justify-center w-12 h-12 mx-auto bg-blue-100 rounded-full mb-4">
            <span className="text-2xl">📝</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">생활기록부 작성</h2>
          <p className="text-gray-600 mt-2">
            {groupName} 클래스의 생활기록부를 작성합니다
          </p>
          <div className="flex items-center justify-center mt-4 space-x-2">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                1
              </div>
              <span className="ml-2 text-sm font-medium text-blue-600">기록 영역 선택</span>
            </div>
            <div className="w-8 h-px bg-gray-300"></div>
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gray-300 text-gray-500 rounded-full flex items-center justify-center text-sm">
                2
              </div>
              <span className="ml-2 text-sm text-gray-500">학생 선택</span>
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

      {/* 영역 선택 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
          어떤 영역의 생활기록부를 작성하시겠습니까?
        </h3>
        <p className="text-sm text-gray-500 mb-6 text-center">
          {groupType} 클래스에서 작성 가능한 영역입니다
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {availableAreas.map((area) => (
            <button
              key={area.id}
              onClick={() => onAreaSelect(area.id)}
              className={`p-6 border rounded-xl text-center transition-all hover:scale-105 ${
                selectedArea === area.id
                  ? 'border-blue-500 bg-blue-50 shadow-lg'
                  : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
              }`}
            >
              <div className="text-4xl mb-3">{area.icon}</div>
              <div className="font-semibold text-gray-900 mb-2">{area.name}</div>
              <div className="text-sm text-gray-600">{area.description}</div>
            </button>
          ))}
        </div>

        {availableAreas.length === 0 && (
          <div className="text-center py-8">
            <div className="text-gray-400 text-6xl mb-4">📝</div>
            <p className="text-gray-500">이 클래스 유형에서는 작성 가능한 영역이 없습니다.</p>
          </div>
        )}

        {selectedArea && (
          <div className="mt-8 text-center">
            <Button
              onClick={onNext}
              size="lg"
              className="px-8"
            >
              다음 단계: 학생 선택 →
            </Button>
          </div>
        )}
      </div>
    </div>
  )
} 