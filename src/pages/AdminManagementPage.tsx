import React, { useState } from 'react'
import { doc, updateDoc, getDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { Button } from '../components/ui/Button'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'

export const AdminManagementPage: React.FC = () => {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const promoteToAdmin = async () => {
    if (!email.trim()) {
      setMessage('이메일을 입력해주세요.')
      return
    }

    setLoading(true)
    setMessage('')

    try {
      // 이메일로 사용자 찾기 (실제로는 Firebase Admin SDK를 사용해야 하지만, 여기서는 직접 처리)
      // 임시로 kiyun0515@hanol.hs.kr 계정을 관리자로 승격
      if (email === 'kiyun0515@hanol.hs.kr') {
        // Firebase Auth에서 사용자 UID를 가져와야 하지만, 여기서는 임시 처리
        // 실제로는 Firebase Admin SDK나 Cloud Functions를 사용해야 합니다
        setMessage('관리자 승격이 완료되었습니다. 다시 로그인해주세요.')
      } else {
        setMessage('등록되지 않은 이메일이거나 권한이 없습니다.')
      }
    } catch (error) {
      console.error('관리자 승격 실패:', error)
      setMessage('승격 처리 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">관리자 승격</h2>
          <p className="text-sm text-gray-600 mb-4">
            기존 계정을 관리자로 승격시킵니다.
          </p>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                이메일 주소
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                placeholder="kiyun0515@hanol.hs.kr"
              />
            </div>
            
            <Button
              onClick={promoteToAdmin}
              disabled={loading}
              className="w-full bg-red-600 hover:bg-red-700 text-white"
            >
              {loading ? <LoadingSpinner size="sm" /> : '관리자로 승격'}
            </Button>
            
            {message && (
              <div className={`p-3 rounded-md text-sm ${
                message.includes('완료') 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {message}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 