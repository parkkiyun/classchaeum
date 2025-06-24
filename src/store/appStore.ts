import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import type { 
  AppState, 
  Class, 
  Student, 
  ReportArea, 
  Survey, 
  Report,
  SurveyTemplate,
  SurveyResponse,
  Group,
  GroupWithStudents,
  GroupType
} from '../types'

interface AppStore extends AppState {
  // Setters
  setSelectedYear: (year: number) => void
  setSelectedSemester: (semester: number) => void
  setSelectedClass: (classData: Class | undefined) => void
  setSelectedStudent: (student: Student | undefined) => void
  setSelectedArea: (area: ReportArea | undefined) => void
  setSelectedSurveys: (surveys: Survey[]) => void
  addSelectedSurvey: (survey: Survey) => void
  removeSelectedSurvey: (surveyId: string) => void
  setCurrentReport: (report: Report | undefined) => void
  
  // Complex actions
  resetSelection: () => void
  clearSurveys: () => void
  
  // 학생 관리
  students: Student[]
  setStudents: (students: Student[]) => void
  addStudent: (student: Student) => void
  updateStudent: (id: string, updates: Partial<Student>) => void
  removeStudent: (id: string) => void
  
  // 설문 관리 - 기존
  surveys: Survey[]
  setSurveys: (surveys: Survey[]) => void
  
  // 설문 관리 - 새로운 시스템
  surveyTemplates: SurveyTemplate[]
  surveyResponses: SurveyResponse[]
  setSurveyTemplates: (templates: SurveyTemplate[]) => void
  setSurveyResponses: (responses: SurveyResponse[]) => void
  addSurveyTemplate: (template: SurveyTemplate) => void
  updateSurveyTemplate: (id: string, updates: Partial<SurveyTemplate>) => void
  removeSurveyTemplate: (id: string) => void
  addSurveyResponse: (response: SurveyResponse) => void
  updateSurveyResponse: (id: string, updates: Partial<SurveyResponse>) => void
  removeSurveyResponse: (id: string) => void
  
  // 설문 필터링 및 검색
  getResponsesByStudent: (studentId: string) => SurveyResponse[]
  getResponsesByTemplate: (templateId: string) => SurveyResponse[]
  getTemplatesByArea: (area: ReportArea) => SurveyTemplate[]
  
  // 생활기록부 관리
  reports: Report[]
  setReports: (reports: Report[]) => void
  
  // UI 상태
  selectedStudentIds: string[]
  setSelectedStudentIds: (ids: string[]) => void
  selectedTemplateId: string | null
  setSelectedTemplateId: (id: string | null) => void
  
  // 그룹 관리 상태
  groups: Group[]
  currentGroup: GroupWithStudents | null
  
  // 그룹 관리 액션
  setGroups: (groups: Group[]) => void
  addGroup: (group: Group) => void
  updateGroup: (id: string, group: Partial<Group>) => void
  removeGroup: (id: string) => void
  setCurrentGroup: (group: GroupWithStudents | null) => void
  
  // 그룹 관련 유틸리티 함수
  getGroupsByTeacher: (teacherId: string) => Group[]
  getGroupWithStudents: (groupId: string, students: Student[]) => GroupWithStudents | null
  getStudentsByGroup: (groupId: string) => Student[]
  getResponsesByGroup: (groupId: string) => SurveyResponse[]
  
  // 학생 배정/제거 함수
  assignStudentsToGroup: (groupId: string, studentIds: string[]) => Promise<void>
  removeStudentFromGroup: (groupId: string, studentId: string) => Promise<void>
}

const useAppStore = create<AppStore>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        selectedYear: new Date().getFullYear(),
        selectedSemester: new Date().getMonth() < 6 ? 1 : 2,
        selectedClass: undefined,
        selectedStudent: undefined,
        selectedArea: undefined,
        selectedSurveys: [],
        currentReport: undefined,
        
        // 학생 관리
        students: [],
        setStudents: (students) => set({ students }),
        addStudent: (student) => set((state) => ({ 
          students: [...state.students, student] 
        })),
        updateStudent: (id, updates) => set((state) => ({
          students: state.students.map(student => 
            student.id === id ? { ...student, ...updates, updatedAt: new Date() } : student
          )
        })),
        removeStudent: (id) => set((state) => ({
          students: state.students.filter(student => student.id !== id)
        })),
        
        // 설문 관리 - 기존
        surveys: [],
        setSurveys: (surveys) => set({ surveys }),
        
        // 설문 관리 - 새로운 시스템
        surveyTemplates: [],
        surveyResponses: [],
        setSurveyTemplates: (templates) => set({ surveyTemplates: templates }),
        setSurveyResponses: (responses) => set({ surveyResponses: responses }),
        
        addSurveyTemplate: (template) => set((state) => ({
          surveyTemplates: [...state.surveyTemplates, template]
        })),
        
        updateSurveyTemplate: (id, updates) => set((state) => ({
          surveyTemplates: state.surveyTemplates.map(template =>
            template.id === id ? { ...template, ...updates, updatedAt: new Date() } : template
          )
        })),
        
        removeSurveyTemplate: (id) => set((state) => ({
          surveyTemplates: state.surveyTemplates.filter(template => template.id !== id)
        })),
        
        addSurveyResponse: (response) => set((state) => ({
          surveyResponses: [...state.surveyResponses, response]
        })),
        
        updateSurveyResponse: (id, updates) => set((state) => ({
          surveyResponses: state.surveyResponses.map(response =>
            response.id === id ? { ...response, ...updates, updatedAt: new Date() } : response
          )
        })),
        
        removeSurveyResponse: (id) => set((state) => ({
          surveyResponses: state.surveyResponses.filter(response => response.id !== id)
        })),
        
        // 설문 필터링 및 검색
        getResponsesByStudent: (studentId) => {
          return get().surveyResponses.filter(response => response.studentId === studentId)
        },
        
        getResponsesByTemplate: (templateId) => {
          return get().surveyResponses.filter(response => response.templateId === templateId)
        },
        
        getTemplatesByArea: (area) => {
          return get().surveyTemplates.filter(template => template.area === area && template.isActive)
        },
        
        // 생활기록부 관리
        reports: [],
        setReports: (reports) => set({ reports }),
        
        // UI 상태
        selectedStudentIds: [],
        setSelectedStudentIds: (ids) => set({ selectedStudentIds: ids }),
        selectedTemplateId: null,
        setSelectedTemplateId: (id) => set({ selectedTemplateId: id }),
        
        // 그룹 관리 상태
        groups: [],
        currentGroup: null,
        
        // 그룹 관리 액션
        setGroups: (groups) => set({ groups }),
        addGroup: (group) => set((state) => ({ 
          groups: [...state.groups, group] 
        })),
        updateGroup: (id, group) => set((state) => ({
          groups: state.groups.map(g => g.id === id ? { ...g, ...group } : g)
        })),
        removeGroup: (id) => set((state) => ({
          groups: state.groups.filter(g => g.id !== id)
        })),
        setCurrentGroup: (group) => set({ currentGroup: group }),
        
        // 그룹 관련 유틸리티 함수
        getGroupsByTeacher: (teacherId) => {
          const { groups } = get()
          return groups.filter(group => group.teacherId === teacherId)
        },
        
        getGroupWithStudents: (groupId, students) => {
          const { groups } = get()
          const group = groups.find(g => g.id === groupId)
          if (!group) return null
          
          const groupStudents = students.filter(student => 
            group.studentIds.includes(student.id)
          )
          
          return {
            ...group,
            students: groupStudents
          }
        },
        
        getStudentsByGroup: (groupId) => {
          const { groups, students } = get()
          const group = groups.find(g => g.id === groupId)
          if (!group) return []
          
          return students.filter(student => group.studentIds.includes(student.id))
        },
        
        getResponsesByGroup: (groupId) => {
          const { surveyResponses } = get()
          return surveyResponses.filter(response => response.groupId === groupId)
        },
        
        // Setters
        setSelectedYear: (year) => set({ selectedYear: year }, false, 'setSelectedYear'),
        
        setSelectedSemester: (semester) => set({ selectedSemester: semester }, false, 'setSelectedSemester'),
        
        setSelectedClass: (classData) => set({ 
          selectedClass: classData,
          selectedStudent: undefined, // Reset student when class changes
        }, false, 'setSelectedClass'),
        
        setSelectedStudent: (student) => set({ selectedStudent: student }, false, 'setSelectedStudent'),
        
        setSelectedArea: (area) => set({ selectedArea: area }, false, 'setSelectedArea'),
        
        setSelectedSurveys: (surveys) => set({ selectedSurveys: surveys }, false, 'setSelectedSurveys'),
        
        addSelectedSurvey: (survey) => {
          const currentSurveys = get().selectedSurveys
          const exists = currentSurveys.find(s => s.id === survey.id)
          if (!exists) {
            set({ 
              selectedSurveys: [...currentSurveys, survey] 
            }, false, 'addSelectedSurvey')
          }
        },
        
        removeSelectedSurvey: (surveyId) => {
          const currentSurveys = get().selectedSurveys
          set({ 
            selectedSurveys: currentSurveys.filter(s => s.id !== surveyId) 
          }, false, 'removeSelectedSurvey')
        },
        
        setCurrentReport: (report) => set({ currentReport: report }, false, 'setCurrentReport'),
        
        // Complex actions
        resetSelection: () => set({
          selectedClass: undefined,
          selectedStudent: undefined,
          selectedArea: undefined,
          selectedSurveys: [],
          currentReport: undefined,
          selectedTemplateId: null,
        }, false, 'resetSelection'),
        
        clearSurveys: () => set({ selectedSurveys: [] }, false, 'clearSurveys'),
        
        // 학생 배정/제거 함수
        assignStudentsToGroup: async (groupId, studentIds) => {
          const { groups } = get()
          const group = groups.find(g => g.id === groupId)
          if (!group) throw new Error('그룹을 찾을 수 없습니다.')
          
          // 중복 제거하고 새로운 학생 ID들 추가
          const newStudentIds = [...new Set([...group.studentIds, ...studentIds])]
          
          try {
            // Firebase 업데이트
            const { doc, updateDoc } = await import('firebase/firestore')
            const { db } = await import('../lib/firebase')
            
            const groupRef = doc(db, 'groups', groupId)
            await updateDoc(groupRef, {
              studentIds: newStudentIds,
              updatedAt: new Date()
            })
            
            console.log('✅ Firebase 그룹 업데이트 성공:', groupId, newStudentIds)
            
            // 로컬 상태 업데이트
            set((state) => ({
              groups: state.groups.map(g => 
                g.id === groupId 
                  ? { ...g, studentIds: newStudentIds, updatedAt: new Date() }
                  : g
              )
            }))
          } catch (error) {
            console.error('❌ Firebase 그룹 업데이트 실패:', error)
            throw new Error('학생 배정 저장에 실패했습니다.')
          }
        },
        
        removeStudentFromGroup: async (groupId, studentId) => {
          const { groups } = get()
          const group = groups.find(g => g.id === groupId)
          if (!group) throw new Error('그룹을 찾을 수 없습니다.')
          
          // 학생 ID 제거
          const newStudentIds = group.studentIds.filter(id => id !== studentId)
          
          try {
            // Firebase 업데이트
            const { doc, updateDoc } = await import('firebase/firestore')
            const { db } = await import('../lib/firebase')
            
            const groupRef = doc(db, 'groups', groupId)
            await updateDoc(groupRef, {
              studentIds: newStudentIds,
              updatedAt: new Date()
            })
            
            console.log('✅ Firebase 학생 제거 성공:', groupId, studentId)
            
            // 로컬 상태 업데이트
            set((state) => ({
              groups: state.groups.map(g => 
                g.id === groupId 
                  ? { ...g, studentIds: newStudentIds, updatedAt: new Date() }
                  : g
              )
            }))
          } catch (error) {
            console.error('❌ Firebase 학생 제거 실패:', error)
            throw new Error('학생 제거 저장에 실패했습니다.')
          }
        },
      }),
      {
        name: 'ai-record-app-storage',
        partialize: (state) => ({
          selectedYear: state.selectedYear,
          selectedSemester: state.selectedSemester,
          students: state.students,
          surveys: state.surveys,
          reports: state.reports,
          surveyTemplates: state.surveyTemplates,
          surveyResponses: state.surveyResponses,
        }),
      }
    ),
    {
      name: 'app-store',
    }
  )
)

// Named export for consistency
export { useAppStore }
export default useAppStore

// Selectors for better performance
export const useSelectedYear = () => useAppStore(state => state.selectedYear)
export const useSelectedSemester = () => useAppStore(state => state.selectedSemester)
export const useSelectedClass = () => useAppStore(state => state.selectedClass)
export const useSelectedStudent = () => useAppStore(state => state.selectedStudent)
export const useSelectedArea = () => useAppStore(state => state.selectedArea)
export const useSelectedSurveys = () => useAppStore(state => state.selectedSurveys)
export const useCurrentReport = () => useAppStore(state => state.currentReport)
export const useStudents = () => useAppStore(state => state.students)
export const useSurveys = () => useAppStore(state => state.surveys)
export const useReports = () => useAppStore(state => state.reports)
export const useSelectedStudentIds = () => useAppStore(state => state.selectedStudentIds)
export const useSurveyTemplates = () => useAppStore(state => state.surveyTemplates)
export const useSurveyResponses = () => useAppStore(state => state.surveyResponses)
export const useSelectedTemplateId = () => useAppStore(state => state.selectedTemplateId)
export const useGroups = () => useAppStore(state => state.groups)
export const useCurrentGroup = () => useAppStore(state => state.currentGroup) 