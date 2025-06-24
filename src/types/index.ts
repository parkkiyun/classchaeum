// User & Authentication Types
export interface User {
  uid: string
  email: string
  displayName?: string
  emailVerified?: boolean
}

export interface Teacher {
  id: string
  email: string
  name: string
  roles: TeacherRole[]
  approved: boolean
  homeroomClassId?: string | null
  subjectClasses: string[]
  createdAt: Date
  updatedAt: Date
}

export type TeacherRole = 'homeroom' | 'subject' | 'club' | 'pending'

// Class & Student Types
export interface Class {
  id: string
  year: number
  semester: number
  grade: number
  room: number
  students: string[]
  createdAt: Date
  updatedAt: Date
}

export interface Student {
  id: string
  name: string
  email?: string
  grade: number
  class: number
  number: number
  birthdate?: string
  gender?: 'M' | 'F'
  createdAt: Date
  updatedAt: Date
}

// Survey Types - 개선된 설문 시스템
export interface SurveyTemplate {
  id: string
  title: string
  description: string
  area: ReportArea
  questions: SurveyQuestion[]
  createdBy: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface SurveyQuestion {
  id: string
  text: string
  type: 'text' | 'textarea' | 'multiple_choice' | 'single_choice' | 'rating' | 'date'
  options?: string[]
  required: boolean
  order: number
  placeholder?: string
  maxLength?: number
  minRating?: number
  maxRating?: number
}

export interface SurveyResponse {
  id: string
  templateId: string
  groupId?: string
  studentId: string
  teacherId: string
  area?: ReportArea
  responses: QuestionResponse[]
  status: 'draft' | 'submitted' | 'reviewed'
  submittedAt?: Date
  reviewedAt?: Date
  createdAt: Date
  updatedAt: Date
}

export interface QuestionResponse {
  questionId: string
  answer: string | number | string[]
  textAnswer?: string // 기타 의견 등
}

// 기존 Survey 인터페이스 (호환성 유지)
export interface Survey {
  id: string
  studentId: string
  title: string
  content: string
  area: 'autonomous' | 'career' | 'activity' | 'subject' | 'club'
  submittedAt: Date
}

// Report Types
export interface Report {
  id: string
  studentId: string
  teacherId: string
  groupId: string
  area: 'autonomous' | 'career' | 'behavior' | 'subject' | 'club'
  content: string
  version: number
  surveyResponseId?: string
  createdAt: Date
  updatedAt: Date
}

export type ReportArea = '자율' | '진로' | '행특' | '교과' | '동아리'

// Prompt Types
export interface Prompt {
  id: string
  teacherId: string
  subjectId?: string
  area: ReportArea
  promptText: string
  temperature: number
  maxTokens: number
  createdAt: Date
  updatedAt: Date
}

// 프롬프트 관련 타입 추가
export interface AreaPrompt {
  id: string
  area: 'autonomous' | 'career' | 'behavior' | 'subject' | 'club'
  title: string
  prompt: string
  isDefault: boolean
  createdAt: Date
  updatedAt: Date
}

export interface GroupPrompts {
  id: string
  groupId: string
  teacherId: string
  prompts: {
    autonomous?: string
    career?: string
    behavior?: string
    subject?: string
    club?: string
  }
  examples?: {
    autonomous?: string[]
    career?: string[]
    behavior?: string[]
    subject?: string[]
    club?: string[]
  }
  createdAt: Date
  updatedAt: Date
}

// AI API Types
export interface AIGenerationRequest {
  prompt: string
  studentData: {
    name: string
    grade: number
    class: number
    surveys: Survey[]
  }
  temperature?: number
  maxTokens?: number
}

export interface AIGenerationResponse {
  content: string
  tokensUsed: number
  model: string
  timestamp: Date
}

// Excel Upload Types
export interface ExcelStudent {
  StudentID: string
  Name: string
  Email?: string
  Grade: number
  Class: number
  Number: number
  Birthdate?: string
  Gender?: 'M' | 'F'
}

export interface ExcelSurveyData {
  StudentID: string
  StudentName: string
  Question1?: string
  Question2?: string
  Question3?: string
  Question4?: string
  Question5?: string
  [key: string]: string | undefined // 동적 질문 필드
}

export interface ExcelUploadResult {
  success: boolean
  processedCount: number
  errorCount: number
  errors: ExcelUploadError[]
  students: Student[]
}

export interface ExcelUploadError {
  row: number
  field: string
  value: any
  message: string
}

// App State Types
export interface AppState {
  selectedYear: number
  selectedSemester: number
  selectedClass?: Class
  selectedStudent?: Student
  selectedArea?: ReportArea
  selectedSurveys: Survey[]
  currentReport?: Report
}

// UI Component Types
export interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

export interface TableColumn<T> {
  key: keyof T
  label: string
  sortable?: boolean
  render?: (value: any, item: T) => any
}

export interface PaginationState {
  page: number
  pageSize: number
  total: number
}

// Version Control Types
export interface Version {
  id: string
  reportId: string
  content: string
  version: number
  createdBy: string
  createdAt: Date
  changesSummary?: string
}

export interface DiffView {
  oldVersion: Version
  newVersion: Version
  changes: DiffChange[]
}

export interface DiffChange {
  type: 'added' | 'removed' | 'modified'
  lineNumber: number
  content: string
}

// Firebase Config Types
export interface FirebaseConfig {
  apiKey: string
  authDomain: string
  projectId: string
  storageBucket: string
  messagingSenderId: string
  appId: string
}

// Electron API Types
declare global {
  interface Window {
    electronAPI: {
      showSaveDialog: (options: any) => Promise<any>
      showOpenDialog: (options: any) => Promise<any>
      onMainProcessMessage: (callback: (message: string) => void) => void
      removeAllListeners: (channel: string) => void
    }
  }
}

// 그룹 관리 시스템 타입 추가
export type GroupType = '담임' | '교과' | '동아리'

export interface Group {
  id: string
  name: string
  type: GroupType
  teacherId: string
  studentIds: string[]
  description?: string
  createdAt: Date
  updatedAt: Date
}

export interface GroupWithStudents extends Group {
  students: Student[]
} 