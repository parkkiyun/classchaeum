export interface SurveyQuestion {
  id: string
  type: 'short' | 'long' | 'multiple' | 'rating'
  question: string
  required: boolean
  options?: string[] // multiple choice용
  minRating?: number // rating용
  maxRating?: number // rating용
}

export interface Survey {
  id: string
  title: string
  description?: string
  teacherId: string
  groupId: string
  questions: SurveyQuestion[]
  isActive: boolean
  allowEdit: boolean
  createdAt: Date
  updatedAt: Date
  dueDate?: Date
  maxResponses?: number
}

export interface SurveyResponse {
  id: string
  surveyId: string
  email: string
  studentName?: string
  answers: Record<string, string | string[]>
  submittedAt: Date
  updatedAt: Date
  editEmailSent: boolean
  ipAddress?: string
  userAgent?: string
}

export interface SurveyStats {
  totalResponses: number
  responseRate: number
  questionStats: Record<string, {
    totalAnswers: number
    uniqueAnswers: string[]
    mostCommon?: string
  }>
} 