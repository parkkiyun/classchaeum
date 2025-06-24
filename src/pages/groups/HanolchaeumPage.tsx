import React from 'react'

export const HanolchaeumPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="text-center py-12">
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100">
          <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </div>
        <h3 className="mt-2 text-lg font-medium text-gray-900">클래스채움 AI 생성</h3>
        <p className="mt-1 text-sm text-gray-500">
          AI를 활용한 생활기록부 자동 생성 기능입니다.<br/>
          곧 출시될 예정입니다.
        </p>
        
        <div className="mt-8 max-w-md mx-auto">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">개발 중</h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>
                    AI 생활기록부 생성 기능은 현재 개발 중입니다.<br/>
                    설문 데이터를 기반으로 자동화된 생활기록부 문항을 생성할 예정입니다.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-8">
          <h4 className="text-sm font-medium text-gray-900 mb-4">예정된 기능</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
            <div className="bg-gray-50 rounded-lg p-4">
              <h5 className="font-medium text-gray-900 mb-2">🤖 AI 텍스트 생성</h5>
              <p className="text-sm text-gray-600">설문 응답을 바탕으로 생활기록부 문항을 자동 생성</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <h5 className="font-medium text-gray-900 mb-2">✏️ 실시간 편집</h5>
              <p className="text-sm text-gray-600">생성된 텍스트를 실시간으로 수정하고 개선</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <h5 className="font-medium text-gray-900 mb-2">📚 버전 관리</h5>
              <p className="text-sm text-gray-600">수정 이력을 추적하고 이전 버전과 비교</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <h5 className="font-medium text-gray-900 mb-2">📄 일괄 출력</h5>
              <p className="text-sm text-gray-600">완성된 생활기록부를 PDF로 일괄 출력</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 