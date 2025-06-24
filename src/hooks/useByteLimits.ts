import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { DEFAULT_BYTE_LIMITS, type AreaByteLimits } from '../utils/textUtils'
import type { GenerateRequest } from '../services/openaiService'

export const useByteLimits = () => {
  const { teacher } = useAuth()
  const [byteLimits, setByteLimits] = useState<AreaByteLimits>(DEFAULT_BYTE_LIMITS)

  useEffect(() => {
    if (teacher) {
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

  const getByteLimitForArea = (area: GenerateRequest['area']): number => {
    return byteLimits[area] || DEFAULT_BYTE_LIMITS[area]
  }

  return {
    byteLimits,
    getByteLimitForArea
  }
} 