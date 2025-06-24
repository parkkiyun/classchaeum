import { DEFAULT_PROMPTS } from '../constants/defaultPrompts';

interface OpenAIConfig {
  apiKey: string
  baseURL: string
  model: string
  maxTokens: number
  temperature: number
}

interface GenerateRequest {
  area: 'autonomous' | 'career' | 'behavior' | 'subject' | 'club'
  studentName: string
  surveyData: Record<string, any>
  customPrompt?: string
  groupId?: string
  teacherId?: string
}

interface GenerateResponse {
  success: boolean
  content: string
  error?: string
  tokensUsed?: number
}

// 프롬프트는 defaultPrompts.ts에서 통합 관리

class OpenAIService {
  private config: OpenAIConfig

  constructor() {
    this.config = {
      apiKey: '',
      baseURL: import.meta.env.VITE_OPENAI_API_URL || 'https://api.openai.com/v1',
      model: 'gpt-3.5-turbo',
      maxTokens: 500,
      temperature: 0.7
    }
    this.loadApiKey()
  }

  // API 키 로드 (개인 키 우선)
  private loadApiKey(): void {
    // 1. 개인 API 키 우선 (localStorage에서)
    const userId = this.getCurrentUserId()
    if (userId) {
      const personalKey = localStorage.getItem(`openai-api-key-${userId}`)
      if (personalKey) {
        this.config.apiKey = personalKey
        return
      }
    }

    // 2. 전역 설정 API 키
    const globalKey = localStorage.getItem('VITE_OPENAI_API_KEY')
    if (globalKey) {
      this.config.apiKey = globalKey
      return
    }

    // 3. 환경변수 API 키
    this.config.apiKey = import.meta.env.VITE_OPENAI_API_KEY || ''
  }

  // 현재 사용자 ID 가져오기
  private getCurrentUserId(): string | null {
    try {
      // Firebase Auth 상태에서 사용자 ID 가져오기
      const authData = localStorage.getItem('firebase:authUser:AIzaSyBvBKnhkXGhd-tHJxCy4xMgY-r-3bPPQzU:[DEFAULT]')
      if (authData) {
        const user = JSON.parse(authData)
        return user.uid || null
      }
      return null
    } catch {
      return null
    }
  }

  // 설정 확인
  isConfigured(): boolean {
    this.loadApiKey() // 매번 최신 키 로드
    return !!this.config.apiKey
  }

  // 프롬프트 생성
  private async generatePrompt(request: GenerateRequest): Promise<string> {
    let basePrompt = request.customPrompt || DEFAULT_PROMPTS[request.area]
    let examples: string[] = []
    
    // 사용자 정의 프롬프트가 있으면 사용 (빈 문자열이면 기본 프롬프트 사용)
    if (request.groupId && request.teacherId && !request.customPrompt) {
      try {
        const { getAreaPrompt, getAreaExamples } = await import('./promptService')
        const [userPrompt, userExamples] = await Promise.all([
          getAreaPrompt(request.groupId, request.teacherId, request.area),
          getAreaExamples(request.groupId, request.teacherId, request.area)
        ])
        
        // 사용자 프롬프트가 비어있지 않으면 사용, 비어있으면 기본 프롬프트 사용
        basePrompt = userPrompt && userPrompt.trim() ? userPrompt : DEFAULT_PROMPTS[request.area]
        examples = userExamples || []
      } catch (error) {
        console.warn('⚠️ 사용자 프롬프트 로드 실패, 기본 프롬프트 사용:', error)
        basePrompt = DEFAULT_PROMPTS[request.area]
      }
    }
    
    // 기본 프롬프트에 학생 정보와 설문 데이터 삽입
    let finalPrompt = basePrompt
      .replace('{studentName}', request.studentName)
      .replace('{surveyData}', JSON.stringify(request.surveyData, null, 2))
    
    // 예시문이 있으면 추가
    if (examples.length > 0) {
      const exampleText = examples
        .filter(ex => ex.trim())
        .map((ex, index) => `예시 ${index + 1}: ${ex}`)
        .join('\n\n')
      
      finalPrompt += `\n\n다음은 참고할 예시문입니다:\n${exampleText}`
    }
    
    return finalPrompt
  }

  // AI 문장 생성
  async generateContent(request: GenerateRequest): Promise<GenerateResponse> {
    try {
      console.log('🤖 AI 생성 시작:', request)

      if (!this.isConfigured()) {
        console.warn('⚠️ OpenAI API 키가 설정되지 않았습니다.')
        return {
          success: false,
          content: '',
          error: 'OpenAI API 키가 설정되지 않았습니다.'
        }
      }

      const prompt = await this.generatePrompt(request)
      console.log('📝 생성된 프롬프트:', prompt)

      const response = await fetch(`${this.config.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`
        },
        body: JSON.stringify({
          model: this.config.model,
          messages: [
            {
              role: 'system',
              content: '당신은 생활기록부 작성을 도와주는 전문가입니다. 학생의 활동과 성장을 객관적이고 교육적으로 기록해주세요.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: this.config.maxTokens,
          temperature: this.config.temperature
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('❌ OpenAI API 오류:', errorData)
        throw new Error(`API 오류: ${response.status} - ${errorData.error?.message || 'Unknown error'}`)
      }

      const data = await response.json()
      console.log('✅ OpenAI 응답:', data)

      const content = data.choices?.[0]?.message?.content || ''
      const tokensUsed = data.usage?.total_tokens || 0

      return {
        success: true,
        content: content.trim(),
        tokensUsed
      }

    } catch (error) {
      console.error('❌ AI 생성 실패:', error)
      return {
        success: false,
        content: '',
        error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'
      }
    }
  }

  // 영역별 프롬프트 템플릿 가져오기
  getAreaPrompt(area: GenerateRequest['area']): string {
    return DEFAULT_PROMPTS[area]
  }

  // 프롬프트 템플릿 업데이트 (읽기 전용 - 사용자는 프롬프트 설정 페이지에서 수정)
  updateAreaPrompt(area: GenerateRequest['area'], prompt: string): void {
    console.warn('⚠️ 프롬프트 업데이트는 프롬프트 설정 페이지에서 수행하세요.')
  }

  // API 설정 업데이트
  updateConfig(config: Partial<OpenAIConfig>): void {
    this.config = { ...this.config, ...config }
  }

  // 현재 설정 조회
  getConfig(): OpenAIConfig {
    return { ...this.config }
  }
}

export const openaiService = new OpenAIService()
export type { GenerateRequest, GenerateResponse } 