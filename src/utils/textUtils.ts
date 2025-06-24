// 텍스트의 바이트 수 계산 (UTF-8 기준)
export const getByteLength = (text: string): number => {
  return new TextEncoder().encode(text).length
}

// 바이트 수를 사람이 읽기 쉬운 형태로 포맷
export const formatByteLength = (bytes: number): string => {
  if (bytes < 1024) {
    return `${bytes} bytes`
  } else if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`
  } else {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }
}

// 텍스트가 바이트 제한을 초과하는지 확인
export const isOverByteLimit = (text: string, limit: number): boolean => {
  return getByteLength(text) > limit
}

// 바이트 제한에 맞게 텍스트 자르기
export const truncateByBytes = (text: string, maxBytes: number): string => {
  const encoder = new TextEncoder()
  const decoder = new TextDecoder()
  
  let bytes = encoder.encode(text)
  if (bytes.length <= maxBytes) {
    return text
  }
  
  // 바이트 제한에 맞게 자르기 (UTF-8 문자 경계 고려)
  let truncatedBytes = bytes.slice(0, maxBytes)
  let result = decoder.decode(truncatedBytes, { stream: false })
  
  // 마지막 문자가 깨졌을 수 있으므로 다시 시도
  while (result.length === 0 && truncatedBytes.length > 0) {
    truncatedBytes = truncatedBytes.slice(0, -1)
    result = decoder.decode(truncatedBytes, { stream: false })
  }
  
  return result
}

// 영역별 기본 바이트 제한 설정
export const DEFAULT_BYTE_LIMITS = {
  autonomous: 1500,  // 자율활동: 1500 bytes
  career: 2100,      // 진로활동: 2100 bytes  
  behavior: 1500,    // 행동특성: 1500 bytes
  subject: 1500,     // 교과세특: 1500 bytes
  club: 1500         // 동아리: 1500 bytes
} as const

export type AreaByteLimits = typeof DEFAULT_BYTE_LIMITS 