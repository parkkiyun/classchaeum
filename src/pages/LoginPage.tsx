import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'

export const LoginPage: React.FC = () => {
  const navigate = useNavigate()
  const [isLogin, setIsLogin] = useState(true) // true: 로그인, false: 회원가입
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [resetEmailSent, setResetEmailSent] = useState(false)
  const [registrationSuccess, setRegistrationSuccess] = useState(false)
  
  const { login, register, resetPassword } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (isLogin) {
        await login(email, password)
        // 로그인 성공 시 대시보드로 이동
        navigate('/')
      } else {
        if (!name.trim()) {
          throw new Error('이름을 입력해주세요.')
        }
        await register(email, password, name)
        setRegistrationSuccess(true)
        
        // 3초 후 자동 로그인 시도
        setTimeout(async () => {
          try {
            await login(email, password)
            navigate('/')
          } catch (loginError) {
            console.log('자동 로그인 실패, 수동 로그인 필요')
            setIsLogin(true)
            setRegistrationSuccess(false)
          }
        }, 3000)
      }
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordReset = async () => {
    if (!email) {
      setError('비밀번호 재설정을 위해 이메일을 입력해주세요.')
      return
    }

    try {
      setLoading(true)
      await resetPassword(email)
      setResetEmailSent(true)
      setError('')
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  // 회원가입 성공 화면
  if (registrationSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-50 to-orange-100">
        <div className="max-w-md w-full space-y-8 p-8">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            {/* 성공 아이콘 */}
            <div className="mx-auto h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
              <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-4">회원가입 완료!</h2>
            <p className="text-gray-600 mb-6">
              <strong>{name}</strong>님의 계정이 성공적으로 생성되었습니다.
            </p>
            
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  {email.includes('admin') || email.includes('kiyun0515') ? (
                    <>
                      <strong>관리자 계정</strong>으로 등록되었습니다.<br />
                      곧 자동으로 로그인됩니다...
                    </>
                  ) : (
                    <>
                      계정 승인 후 사용 가능합니다.<br />
                      관리자 승인을 기다려주세요.
                    </>
                  )}
                </p>
              </div>
              
              <div className="flex items-center justify-center space-x-2">
                <LoadingSpinner size="sm" />
                <span className="text-sm text-gray-500">자동 로그인 중...</span>
              </div>
              
              <button
                onClick={() => {
                  setRegistrationSuccess(false)
                  setIsLogin(true)
                }}
                className="text-sm text-yellow-600 hover:text-yellow-700 underline"
              >
                수동으로 로그인하기
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-50 to-orange-100">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">한올채움</h1>
          <p className="text-gray-600">AI 생활기록부 생성 시스템</p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* 탭 버튼 */}
          <div className="flex mb-6 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => {
                setIsLogin(true)
                setError('')
                setResetEmailSent(false)
              }}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                isLogin
                  ? 'bg-white text-yellow-700 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              로그인
            </button>
            <button
              onClick={() => {
                setIsLogin(false)
                setError('')
                setResetEmailSent(false)
              }}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                !isLogin
                  ? 'bg-white text-yellow-700 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              회원가입
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  이름
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  placeholder="홍길동"
                  required={!isLogin}
                />
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                이메일
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                placeholder="teacher@hanol.hs.kr"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                비밀번호
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                placeholder="6자 이상 입력"
                required
              />
            </div>

            {error && (
              <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-md text-sm">
                {error}
              </div>
            )}

            {resetEmailSent && (
              <div className="p-3 bg-green-100 border border-green-400 text-green-700 rounded-md text-sm">
                비밀번호 재설정 이메일을 발송했습니다. 이메일을 확인해주세요.
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <LoadingSpinner size="sm" />
              ) : (
                isLogin ? '로그인' : '회원가입'
              )}
            </button>
          </form>

          {isLogin && (
            <div className="mt-4 text-center">
              <button
                onClick={handlePasswordReset}
                disabled={loading}
                className="text-sm text-yellow-600 hover:text-yellow-700 underline"
              >
                비밀번호를 잊으셨나요?
              </button>
            </div>
          )}

          {!isLogin && (
            <div className="mt-4 p-3 bg-blue-50 rounded-md">
              <p className="text-xs text-blue-800">
                • 한올고등학교 교사만 가입 가능합니다 (@hanol.hs.kr)<br />
                • 관리자 승인 후 사용할 수 있습니다<br />
                • 관리자 계정(admin, kiyun0515)은 즉시 승인됩니다
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 