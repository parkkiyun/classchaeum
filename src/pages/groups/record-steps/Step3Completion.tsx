import React from 'react'
import { Button } from '../../../components/ui/Button'
import type { Student } from '../../../types'
import type { GenerateRequest } from '../../../services/openaiService'

interface Step3CompletionProps {
  selectedArea: GenerateRequest['area']
  student: Student
  onContinueWithSameArea: () => void // 다른 학생 계속 작성 (1단계로)
  onContinueWithDifferentArea: () => void // 다른 영역 작성 (0단계로)
  groupName: string
}

export const Step3Completion: React.FC<Step3CompletionProps> = ({
  selectedArea,
  student,
  onContinueWithSameArea,
  onContinueWithDifferentArea,
  groupName
}) => {
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

  return (
    <div className="space-y-6">
      {/* 성공 헤더 */}
      <div className="bg-white rounded-lg shadow p-8">
        <div className="text-center">
          <div className="flex items-center justify-center w-16 h-16 mx-auto bg-green-100 rounded-full mb-6">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">작성 완료!</h2>
          <p className="text-gray-600 text-lg">
            {student.name} 학생의 {getAreaName(selectedArea)} 기록이 성공적으로 저장되었습니다.
          </p>
          
          {/* 진행 상태 */}
          <div className="flex items-center justify-center mt-6 space-x-2">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                ✓
              </div>
              <span className="ml-2 text-sm text-green-600">기록 영역 선택</span>
            </div>
            <div className="w-8 h-px bg-green-300"></div>
            <div className="flex items-center">
              <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                ✓
              </div>
              <span className="ml-2 text-sm text-green-600">학생 선택</span>
            </div>
            <div className="w-8 h-px bg-green-300"></div>
            <div className="flex items-center">
              <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                ✓
              </div>
              <span className="ml-2 text-sm text-green-600">기록 작성</span>
            </div>
          </div>
        </div>
      </div>

      {/* 완료 정보 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">📋 작성 완료 정보</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center mb-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <div className="font-medium text-gray-900">학생 정보</div>
                <div className="text-sm text-gray-600">
                  {student.name} ({student.grade}학년 {student.class}반 {student.number}번)
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center mb-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-3">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <div className="font-medium text-gray-900">기록 영역</div>
                <div className="text-sm text-gray-600">{getAreaName(selectedArea)}</div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center mb-3">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <div className="font-medium text-gray-900">작성 시간</div>
                <div className="text-sm text-gray-600">{new Date().toLocaleString()}</div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center mb-3">
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center mr-3">
                <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div>
                <div className="font-medium text-gray-900">클래스</div>
                <div className="text-sm text-gray-600">{groupName}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 다음 작업 선택 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6 text-center">
          다음 작업을 선택해주세요
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={onContinueWithSameArea}
            className="p-6 border-2 border-blue-200 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-all text-left group"
          >
            <div className="flex items-center mb-3">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4 group-hover:bg-blue-200">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <div className="font-semibold text-gray-900 mb-1">다른 학생 계속 작성</div>
                <div className="text-sm text-gray-600">
                  같은 영역({getAreaName(selectedArea)})의<br/>
                  다른 학생 기록을 작성합니다
                </div>
              </div>
            </div>
          </button>

          <button
            onClick={onContinueWithDifferentArea}
            className="p-6 border-2 border-green-200 rounded-xl hover:border-green-400 hover:bg-green-50 transition-all text-left group"
          >
            <div className="flex items-center mb-3">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-4 group-hover:bg-green-200">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <div>
                <div className="font-semibold text-gray-900 mb-1">다른 영역 작성</div>
                <div className="text-sm text-gray-600">
                  다른 영역의 생활기록부를<br/>
                  작성합니다
                </div>
              </div>
            </div>
          </button>
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            또는 클래스 대시보드로 돌아가서 다른 작업을 진행할 수 있습니다.
          </p>
        </div>
      </div>
    </div>
  )
} 