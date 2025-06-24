import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Button } from '../components/ui/Button'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { Save, Key, Eye, EyeOff, TestTube, CheckCircle, XCircle, FileText } from 'lucide-react'
import { DEFAULT_BYTE_LIMITS, type AreaByteLimits, formatByteLength } from '../utils/textUtils'
import type { GenerateRequest } from '../services/openaiService'

export const SettingsPage: React.FC = () => {
  const { teacher } = useAuth()
  
  // API 키 관련 상태
  const [openaiApiKey, setOpenaiApiKey] = useState('')
  const [showApiKey, setShowApiKey] = useState(false)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null)
  const [testMessage, setTestMessage] = useState('')

  // 바이트 제한 관련 상태
  const [byteLimits, setByteLimits] = useState<AreaByteLimits>(DEFAULT_BYTE_LIMITS)
  const [savingLimits, setSavingLimits] = useState(false)

  // 저장된 설정 로드
  useEffect(() => {
    if (teacher) {
      // API 키 로드
      const savedKey = localStorage.getItem(`openai-api-key-${teacher.uid}`)
      if (savedKey) {
        setOpenaiApiKey(savedKey)
      }

      // 바이트 제한 로드
      const savedLimits = localStorage.getItem(`byte-limits-${teacher.uid}`)
      if (savedLimits) {
        try {
          setByteLimits(JSON.parse(savedLimits))
        } catch (error) {
          console.error('바이트 제한 설정 로드 실패:', error)
          setByteLimits(DEFAULT_BYTE_LIMITS)
        }
      }
    }
  }, [teacher])

  // API 키 저장
  const handleSaveApiKey = async () => {
    if (!teacher) return

    try {
      setSaving(true)
      
      if (openaiApiKey.trim()) {
        localStorage.setItem(`openai-api-key-${teacher.uid}`, openaiApiKey.trim())
      } else {
        localStorage.removeItem(`openai-api-key-${teacher.uid}`)
      }
      
      // 전역 환경변수도 업데이트
      if (openaiApiKey.trim()) {
        window.localStorage.setItem('VITE_OPENAI_API_KEY', openaiApiKey.trim())
      } else {
        window.localStorage.removeItem('VITE_OPENAI_API_KEY')
      }
      
      alert('API 키가 저장되었습니다.')
      setTestResult(null)
      
    } catch (error) {
      console.error('API 키 저장 실패:', error)
      alert('API 키 저장에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  // API 키 테스트
  const handleTestApiKey = async () => {
    if (!openaiApiKey.trim()) {
      alert('API 키를 먼저 입력해주세요.')
      return
    }

    try {
      setTesting(true)
      setTestResult(null)
      
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${openaiApiKey.trim()}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        setTestResult('success')
        setTestMessage('API 키가 정상적으로 작동합니다!')
      } else {
        const error = await response.json()
        setTestResult('error')
        setTestMessage(`API 키 오류: ${error.error?.message || '인증 실패'}`)
      }
    } catch (error) {
      setTestResult('error')
      setTestMessage('네트워크 오류가 발생했습니다.')
    } finally {
      setTesting(false)
    }
  }

  // API 키 삭제
  const handleRemoveApiKey = () => {
    if (confirm('저장된 API 키를 삭제하시겠습니까?')) {
      setOpenaiApiKey('')
      if (teacher) {
        localStorage.removeItem(`openai-api-key-${teacher.uid}`)
        window.localStorage.removeItem('VITE_OPENAI_API_KEY')
      }
      setTestResult(null)
      alert('API 키가 삭제되었습니다.')
    }
  }

  // 바이트 제한 저장
  const handleSaveByteLimits = async () => {
    if (!teacher) return

    try {
      setSavingLimits(true)
      localStorage.setItem(`byte-limits-${teacher.uid}`, JSON.stringify(byteLimits))
      alert('바이트 제한 설정이 저장되었습니다.')
    } catch (error) {
      console.error('바이트 제한 설정 저장 실패:', error)
      alert('설정 저장에 실패했습니다.')
    } finally {
      setSavingLimits(false)
    }
  }

  // 바이트 제한 초기화
  const handleResetByteLimits = () => {
    if (confirm('바이트 제한 설정을 기본값으로 초기화하시겠습니까?')) {
      setByteLimits(DEFAULT_BYTE_LIMITS)
    }
  }

  // 영역별 바이트 제한 변경
  const handleByteLimitChange = (area: keyof AreaByteLimits, value: number) => {
    setByteLimits(prev => ({
      ...prev,
      [area]: Math.max(100, Math.min(2000, value)) // 100~2000 bytes 범위 제한
    }))
  }

  if (!teacher) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* 헤더 */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center space-x-3">
          <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-full">
            <span className="text-2xl">⚙️</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">설정</h1>
            <p className="text-gray-600">개인 설정을 관리하세요</p>
          </div>
        </div>
      </div>

      {/* 사용자 정보 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">사용자 정보</h2>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">이름:</span>
            <span className="font-medium">{teacher.name}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">이메일:</span>
            <span className="font-medium">{teacher.email}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">권한:</span>
            <span className="font-medium">
              {teacher.roles.includes('admin') ? '관리자' : 
               teacher.roles.includes('homeroom') ? '담임교사' : 
               teacher.roles.includes('subject') ? '교과교사' : 
               teacher.roles.includes('club') ? '동아리교사' : '일반교사'}
            </span>
          </div>
        </div>
      </div>

      {/* AI API 설정 */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Key className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-900">AI API 설정</h2>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              OpenAI API 키
            </label>
            <div className="relative">
              <input
                type={showApiKey ? 'text' : 'password'}
                value={openaiApiKey}
                onChange={(e) => setOpenaiApiKey(e.target.value)}
                placeholder="sk-..."
                className="w-full px-3 py-2 pr-20 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
              >
                {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              개인 OpenAI API 키를 입력하면 AI 생성 기능을 사용할 수 있습니다.
            </p>
          </div>

          {/* 테스트 결과 */}
          {testResult && (
            <div className={`p-3 rounded-lg flex items-center space-x-2 ${
              testResult === 'success' 
                ? 'bg-green-50 text-green-800 border border-green-200' 
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
              {testResult === 'success' ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <XCircle className="w-4 h-4" />
              )}
              <span className="text-sm">{testMessage}</span>
            </div>
          )}

          {/* 버튼들 */}
          <div className="flex space-x-3">
            <Button
              onClick={handleSaveApiKey}
              disabled={saving}
              className="flex items-center space-x-2"
            >
              {saving ? (
                <LoadingSpinner size="sm" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>저장</span>
            </Button>

            <Button
              variant="outline"
              onClick={handleTestApiKey}
              disabled={testing || !openaiApiKey.trim()}
              className="flex items-center space-x-2"
            >
              {testing ? (
                <LoadingSpinner size="sm" />
              ) : (
                <TestTube className="w-4 h-4" />
              )}
              <span>테스트</span>
            </Button>

            {openaiApiKey && (
              <Button
                variant="outline"
                onClick={handleRemoveApiKey}
                className="text-red-600 border-red-300 hover:bg-red-50"
              >
                삭제
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* 바이트 제한 설정 */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center space-x-2 mb-4">
          <FileText className="w-5 h-5 text-green-600" />
          <h2 className="text-lg font-semibold text-gray-900">영역별 바이트 제한 설정</h2>
        </div>
        
        <div className="space-y-4">
          <p className="text-sm text-gray-600 mb-4">
            각 영역별로 생활기록부 내용의 최대 바이트 수를 설정할 수 있습니다. (한글 1글자 ≈ 3 bytes)
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(byteLimits).map(([area, limit]) => {
              const areaNames = {
                autonomous: '자율활동',
                career: '진로활동', 
                behavior: '행동특성',
                subject: '교과세특',
                club: '동아리'
              }
              
              return (
                <div key={area} className="border rounded-lg p-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {areaNames[area as keyof typeof areaNames]}
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      min="100"
                      max="2000"
                      step="50"
                      value={limit}
                      onChange={(e) => handleByteLimitChange(
                        area as keyof AreaByteLimits, 
                        parseInt(e.target.value) || 100
                      )}
                      className="w-24 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-500">bytes</span>
                    <span className="text-xs text-gray-400">
                      (≈ {Math.round(limit / 3)}글자)
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-gray-500">
                    현재: {formatByteLength(limit)}
                  </div>
                </div>
              )
            })}
          </div>

          <div className="flex space-x-3 pt-4">
            <Button
              onClick={handleSaveByteLimits}
              disabled={savingLimits}
              className="flex items-center space-x-2"
            >
              {savingLimits ? (
                <LoadingSpinner size="sm" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>설정 저장</span>
            </Button>

            <Button
              variant="outline"
              onClick={handleResetByteLimits}
              className="flex items-center space-x-2"
            >
              <span>기본값으로 초기화</span>
            </Button>
          </div>
        </div>
      </div>

      {/* API 키 사용법 안내 */}
      <div className="bg-blue-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">OpenAI API 키 발급 방법</h3>
        <div className="space-y-2 text-sm text-blue-800">
          <p>1. <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="underline hover:no-underline">OpenAI API 키 페이지</a>에 접속하세요</p>
          <p>2. "Create new secret key" 버튼을 클릭하세요</p>
          <p>3. 생성된 API 키를 복사하여 위 입력란에 붙여넣으세요</p>
          <p>4. "테스트" 버튼으로 API 키가 정상 작동하는지 확인하세요</p>
          <p>5. "저장" 버튼을 눌러 설정을 저장하세요</p>
        </div>
        <div className="mt-4 p-3 bg-yellow-100 rounded border border-yellow-300">
          <p className="text-sm text-yellow-800">
            <strong>주의:</strong> API 키는 브라우저에 안전하게 저장되며, 다른 사용자와 공유되지 않습니다.
          </p>
        </div>
      </div>
    </div>
  )
} 