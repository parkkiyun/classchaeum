import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  Timestamp 
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import { SchoolAPIConfig, UserAPIPreference, APIConfig } from '../types'

// 학교 공용 API 설정 관리
export const schoolAPIService = {
  // 학교 공용 API 설정 목록 조회
  async getSchoolAPIConfigs(): Promise<SchoolAPIConfig[]> {
    try {
      const q = query(
        collection(db, 'schoolAPIConfigs'),
        orderBy('createdAt', 'desc')
      )
      const snapshot = await getDocs(q)
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate(),
        updatedAt: doc.data().updatedAt.toDate()
      })) as SchoolAPIConfig[]
    } catch (error) {
      console.error('학교 API 설정 조회 실패:', error)
      throw error
    }
  },

  // 활성화된 학교 공용 API 설정 조회
  async getActiveSchoolAPIConfig(): Promise<SchoolAPIConfig | null> {
    try {
      const q = query(
        collection(db, 'schoolAPIConfigs'),
        where('isActive', '==', true),
        orderBy('createdAt', 'desc')
      )
      const snapshot = await getDocs(q)
      if (snapshot.empty) return null
      
      const doc = snapshot.docs[0]
      return {
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate(),
        updatedAt: doc.data().updatedAt.toDate()
      } as SchoolAPIConfig
    } catch (error) {
      console.error('활성 학교 API 설정 조회 실패:', error)
      throw error
    }
  },

  // 학교 공용 API 설정 저장
  async saveSchoolAPIConfig(config: Omit<SchoolAPIConfig, 'id' | 'createdAt' | 'updatedAt'>): Promise<void> {
    try {
      // 기존 활성 설정 비활성화
      if (config.isActive) {
        const activeConfigs = await this.getSchoolAPIConfigs()
        for (const activeConfig of activeConfigs.filter(c => c.isActive)) {
          await updateDoc(doc(db, 'schoolAPIConfigs', activeConfig.id), {
            isActive: false,
            updatedAt: Timestamp.now()
          })
        }
      }

      const docRef = doc(collection(db, 'schoolAPIConfigs'))
      await setDoc(docRef, {
        ...config,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      })
    } catch (error) {
      console.error('학교 API 설정 저장 실패:', error)
      throw error
    }
  },

  // 학교 공용 API 설정 업데이트
  async updateSchoolAPIConfig(id: string, updates: Partial<SchoolAPIConfig>): Promise<void> {
    try {
      // 활성화 상태 변경 시 다른 설정들 비활성화
      if (updates.isActive) {
        const activeConfigs = await this.getSchoolAPIConfigs()
        for (const activeConfig of activeConfigs.filter(c => c.isActive && c.id !== id)) {
          await updateDoc(doc(db, 'schoolAPIConfigs', activeConfig.id), {
            isActive: false,
            updatedAt: Timestamp.now()
          })
        }
      }

      await updateDoc(doc(db, 'schoolAPIConfigs', id), {
        ...updates,
        updatedAt: Timestamp.now()
      })
    } catch (error) {
      console.error('학교 API 설정 업데이트 실패:', error)
      throw error
    }
  },

  // 학교 공용 API 설정 삭제
  async deleteSchoolAPIConfig(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'schoolAPIConfigs', id))
    } catch (error) {
      console.error('학교 API 설정 삭제 실패:', error)
      throw error
    }
  }
}

// 사용자 API 설정 관리
export const userAPIService = {
  // 사용자 API 설정 조회
  async getUserAPIPreference(userId: string): Promise<UserAPIPreference | null> {
    try {
      const docRef = doc(db, 'userAPIPreferences', userId)
      const docSnap = await getDoc(docRef)
      
      if (!docSnap.exists()) return null
      
      return {
        ...docSnap.data(),
        createdAt: docSnap.data().createdAt.toDate(),
        updatedAt: docSnap.data().updatedAt.toDate()
      } as UserAPIPreference
    } catch (error) {
      console.error('사용자 API 설정 조회 실패:', error)
      throw error
    }
  },

  // 사용자 API 설정 저장
  async saveUserAPIPreference(preference: Omit<UserAPIPreference, 'createdAt' | 'updatedAt'>): Promise<void> {
    try {
      const docRef = doc(db, 'userAPIPreferences', preference.userId)
      
      // undefined 값 제거
      const cleanPreference = {
        userId: preference.userId,
        useSchoolAPI: preference.useSchoolAPI,
        ...(preference.personalAPIConfig && { personalAPIConfig: preference.personalAPIConfig }),
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      }
      
      await setDoc(docRef, cleanPreference)
    } catch (error) {
      console.error('사용자 API 설정 저장 실패:', error)
      throw error
    }
  },

  // 사용자 API 설정 업데이트
  async updateUserAPIPreference(userId: string, updates: Partial<UserAPIPreference>): Promise<void> {
    try {
      const docRef = doc(db, 'userAPIPreferences', userId)
      
      // undefined 값 제거
      const cleanUpdates: any = {
        updatedAt: Timestamp.now()
      }
      
      if (updates.useSchoolAPI !== undefined) {
        cleanUpdates.useSchoolAPI = updates.useSchoolAPI
      }
      
      if (updates.personalAPIConfig !== undefined) {
        cleanUpdates.personalAPIConfig = updates.personalAPIConfig
      }
      
      await updateDoc(docRef, cleanUpdates)
    } catch (error) {
      console.error('사용자 API 설정 업데이트 실패:', error)
      throw error
    }
  },

  // 사용자가 사용할 API 설정 조회 (학교 공용 또는 개인)
  async getEffectiveAPIConfig(userId: string): Promise<APIConfig | null> {
    try {
      const userPreference = await this.getUserAPIPreference(userId)
      
      if (!userPreference) {
        // 사용자 설정이 없으면 학교 공용 API 사용
        return await schoolAPIService.getActiveSchoolAPIConfig()
      }

      if (userPreference.useSchoolAPI) {
        // 학교 공용 API 사용
        return await schoolAPIService.getActiveSchoolAPIConfig()
      } else {
        // 개인 API 사용
        return userPreference.personalAPIConfig || null
      }
    } catch (error) {
      console.error('유효한 API 설정 조회 실패:', error)
      throw error
    }
  }
} 