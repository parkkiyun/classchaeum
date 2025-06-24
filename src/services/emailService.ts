import emailjs from '@emailjs/browser'

// EmailJS 초기화 (배포용 하드코딩)
const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID || 'service_p8yxfpc'
const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || 'template_htffu4x'
const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || 'syDM-ZhdAJ0931jn6'

// EmailJS 초기화
if (EMAILJS_PUBLIC_KEY) {
  emailjs.init(EMAILJS_PUBLIC_KEY)
}

export interface EmailParams {
  to_email: string
  student_name: string
  survey_title: string
  edit_link: string
}

export const sendEditLink = async (params: EmailParams): Promise<boolean> => {
  try {
    console.log('📧 EmailJS 서비스 호출 시작')
    console.log('📋 이메일 파라미터:', params)
    console.log('🔧 환경변수 상태:', {
      hasServiceId: !!EMAILJS_SERVICE_ID,
      hasTemplateId: !!EMAILJS_TEMPLATE_ID,
      hasPublicKey: !!EMAILJS_PUBLIC_KEY
    })
    console.log('🔍 환경변수 실제값:', {
      serviceId: EMAILJS_SERVICE_ID,
      templateId: EMAILJS_TEMPLATE_ID,
      publicKey: EMAILJS_PUBLIC_KEY ? `${EMAILJS_PUBLIC_KEY.substring(0, 8)}...` : 'undefined'
    })
    console.log('🌍 전체 환경변수:', import.meta.env)

    if (!EMAILJS_SERVICE_ID || !EMAILJS_TEMPLATE_ID || !EMAILJS_PUBLIC_KEY) {
      console.warn('⚠️ EmailJS 환경변수가 설정되지 않았습니다.')
      console.log('🔗 개발 모드 - 설문 수정 링크:', params.edit_link)
      
      // 개발 환경에서는 성공으로 처리
      return true
    }

    const emailData = {
      to_email: params.to_email,
      to_name: params.student_name, // 받는 사람 이름
      student_name: params.student_name,
      survey_title: params.survey_title,
      edit_link: params.edit_link,
      from_name: '클래스채움 팀',
      reply_to: 'noreply@hanolchaeum.web.app'
    }

    console.log('📤 EmailJS로 전송할 데이터:', emailData)

    const result = await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      emailData
    )

    console.log('✅ 이메일 발송 성공:', result)
    return true
  } catch (error) {
    console.error('❌ 이메일 발송 실패:', error)
    console.error('🔍 상세 오류:', {
      name: (error as any)?.name,
      message: (error as any)?.message,
      text: (error as any)?.text,
      status: (error as any)?.status
    })
    return false
  }
}

export const isEmailConfigured = (): boolean => {
  return !!(EMAILJS_SERVICE_ID && EMAILJS_TEMPLATE_ID && EMAILJS_PUBLIC_KEY)
} 