import emailjs from '@emailjs/browser'

// EmailJS 초기화
const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID
const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID
const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY

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
    if (!EMAILJS_SERVICE_ID || !EMAILJS_TEMPLATE_ID || !EMAILJS_PUBLIC_KEY) {
      console.warn('EmailJS 환경변수가 설정되지 않았습니다.')
      // 개발 환경에서는 콘솔에 링크 출력
      console.log('설문 수정 링크:', params.edit_link)
      return true
    }

    const result = await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      {
        to_email: params.to_email,
        student_name: params.student_name,
        survey_title: params.survey_title,
        edit_link: params.edit_link,
        from_name: '클래스채움 팀'
      }
    )

    console.log('이메일 발송 성공:', result)
    return true
  } catch (error) {
    console.error('이메일 발송 실패:', error)
    return false
  }
}

export const isEmailConfigured = (): boolean => {
  return !!(EMAILJS_SERVICE_ID && EMAILJS_TEMPLATE_ID && EMAILJS_PUBLIC_KEY)
} 