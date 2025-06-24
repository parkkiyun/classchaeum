import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  serverTimestamp,
  query,
  where,
  getDocs
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import type { GroupPrompts } from '../types'
import { DEFAULT_PROMPTS } from '../constants/defaultPrompts'

// 그룹별 프롬프트 조회
export const getGroupPrompts = async (groupId: string, teacherId: string): Promise<GroupPrompts | null> => {
  try {
    console.log('📖 프롬프트 조회 시작:', { groupId, teacherId })
    
    const promptsRef = doc(db, 'groupPrompts', `${groupId}_${teacherId}`)
    const promptsDoc = await getDoc(promptsRef)
    
    if (promptsDoc.exists()) {
      const data = promptsDoc.data()
      console.log('✅ 프롬프트 조회 성공:', data)
      return {
        id: promptsDoc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date()
      } as GroupPrompts
    }
    
    console.log('📝 기본 프롬프트 사용 (사용자 설정 없음)')
    return null
    
  } catch (error) {
    console.error('❌ 프롬프트 조회 실패:', error)
    throw error
  }
}

// 그룹별 프롬프트 저장/업데이트
export const saveGroupPrompts = async (
  groupId: string, 
  teacherId: string, 
  prompts: Partial<GroupPrompts['prompts']>,
  examples?: Partial<GroupPrompts['examples']>
): Promise<void> => {
  try {
    console.log('💾 프롬프트 저장 시작:', { groupId, teacherId, prompts, examples })
    
    const promptsRef = doc(db, 'groupPrompts', `${groupId}_${teacherId}`)
    const promptsDoc = await getDoc(promptsRef)
    
    if (promptsDoc.exists()) {
      // 기존 프롬프트 업데이트
      const updateData: any = {
        prompts: {
          ...promptsDoc.data().prompts,
          ...prompts
        },
        updatedAt: serverTimestamp()
      }
      
      if (examples) {
        updateData.examples = {
          ...promptsDoc.data().examples,
          ...examples
        }
      }
      
      await updateDoc(promptsRef, updateData)
      console.log('✅ 프롬프트 업데이트 완료')
    } else {
      // 새 프롬프트 생성
      const newData: any = {
        id: `${groupId}_${teacherId}`,
        groupId,
        teacherId,
        prompts,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }
      
      if (examples) {
        newData.examples = examples
      }
      
      await setDoc(promptsRef, newData)
      console.log('✅ 프롬프트 생성 완료')
    }
    
  } catch (error) {
    console.error('❌ 프롬프트 저장 실패:', error)
    throw error
  }
}

// 특정 영역의 프롬프트 조회 (기본값 포함)
export const getAreaPrompt = async (
  groupId: string, 
  teacherId: string, 
  area: keyof typeof DEFAULT_PROMPTS
): Promise<string> => {
  try {
    const groupPrompts = await getGroupPrompts(groupId, teacherId)
    
    // 사용자 설정 프롬프트가 있고 비어있지 않으면 사용
    const userPrompt = groupPrompts?.prompts[area]
    if (userPrompt && userPrompt.trim()) {
      return userPrompt
    }
    
    // 없거나 비어있으면 기본 프롬프트 사용
    return DEFAULT_PROMPTS[area]
    
  } catch (error) {
    console.error('❌ 영역 프롬프트 조회 실패:', error)
    // 오류 시 기본 프롬프트 반환
    return DEFAULT_PROMPTS[area]
  }
}

// 모든 영역의 프롬프트 조회 (기본값 포함)
export const getAllAreaPrompts = async (
  groupId: string, 
  teacherId: string
): Promise<GroupPrompts['prompts']> => {
  try {
    const groupPrompts = await getGroupPrompts(groupId, teacherId)
    
    // 기본값과 사용자 설정값을 병합 (빈 문자열이면 기본값 사용)
    const getPromptOrDefault = (userPrompt: string | undefined, defaultPrompt: string) => {
      return userPrompt && userPrompt.trim() ? userPrompt : defaultPrompt
    }
    
    return {
      autonomous: getPromptOrDefault(groupPrompts?.prompts.autonomous, DEFAULT_PROMPTS.autonomous),
      career: getPromptOrDefault(groupPrompts?.prompts.career, DEFAULT_PROMPTS.career),
      behavior: getPromptOrDefault(groupPrompts?.prompts.behavior, DEFAULT_PROMPTS.behavior),
      subject: getPromptOrDefault(groupPrompts?.prompts.subject, DEFAULT_PROMPTS.subject),
      club: getPromptOrDefault(groupPrompts?.prompts.club, DEFAULT_PROMPTS.club)
    }
    
  } catch (error) {
    console.error('❌ 전체 프롬프트 조회 실패:', error)
    // 오류 시 기본 프롬프트 반환
    return DEFAULT_PROMPTS
  }
}

// 특정 영역의 예시문 조회
export const getAreaExamples = async (
  groupId: string, 
  teacherId: string, 
  area: keyof typeof DEFAULT_PROMPTS
): Promise<string[]> => {
  try {
    const groupPrompts = await getGroupPrompts(groupId, teacherId)
    return groupPrompts?.examples?.[area] || []
  } catch (error) {
    console.error('❌ 영역 예시문 조회 실패:', error)
    return []
  }
}

// 모든 영역의 예시문 조회
export const getAllAreaExamples = async (
  groupId: string, 
  teacherId: string
): Promise<NonNullable<GroupPrompts['examples']>> => {
  try {
    const groupPrompts = await getGroupPrompts(groupId, teacherId)
    
    return {
      autonomous: groupPrompts?.examples?.autonomous || [],
      career: groupPrompts?.examples?.career || [],
      behavior: groupPrompts?.examples?.behavior || [],
      subject: groupPrompts?.examples?.subject || [],
      club: groupPrompts?.examples?.club || []
    }
    
  } catch (error) {
    console.error('❌ 전체 예시문 조회 실패:', error)
    return {
      autonomous: [],
      career: [],
      behavior: [],
      subject: [],
      club: []
    }
  }
} 