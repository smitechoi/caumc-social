import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  serverTimestamp 
} from 'https://www.gstatic.com/firebasejs/11.8.1/firebase-firestore.js';
import { db } from './config.js';
  
  // 재시도 래퍼 함수
  async function withRetry(fn, maxRetries = 3) {
    let lastError;
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        console.log(`시도 ${i + 1}/${maxRetries} 실패:`, error);
        
        if (i < maxRetries - 1) {
          // 지수 백오프: 1초, 2초, 4초...
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
        }
      }
    }
    
    throw lastError;
  }
  
  // 1. 환자 존재 여부 확인
  export async function checkPatientExists(name, birthDate) {
    const patientId = `${name}_${birthDate.replace(/-/g, '')}`;
    
    return withRetry(async () => {
      const docRef = doc(db, 'patients', patientId);
      const docSnap = await getDoc(docRef);
      return docSnap.exists();
    });
  }
  
  // 2. 새 환자 생성
  export async function createPatient(name, birthDate, language) {
    const patientId = `${name}_${birthDate.replace(/-/g, '')}`;
    
    const newPatient = {
      name,
      birthDate,
      language,
      createdAt: serverTimestamp(),
      survey: {
        scale1: { scaleName: 'Scale 1', score: 0, isDone: false, questions: [] },
        scale2: { scaleName: 'Scale 2', score: 0, isDone: false, questions: [] },
        scale3: { scaleName: 'Scale 3', score: 0, isDone: false, questions: [] },
        scale4: { scaleName: 'Scale 4', score: 0, isDone: false, questions: [] }
      },
      cnt: {
        task1: { taskName: 'Task 1', score: 0, isDone: false, fullLog: {} },
        task2: { taskName: 'Task 2', score: 0, isDone: false, fullLog: {} },
        task3: { taskName: 'Task 3', score: 0, isDone: false, fullLog: {} },
        task4: { taskName: 'Task 4', score: 0, isDone: false, fullLog: {} },
        task5: { taskName: 'Task 5', score: 0, isDone: false, fullLog: {} }
      },
      reportGenerated: false,
      reportFileName: ''
    };
    
    return withRetry(async () => {
      const docRef = doc(db, 'patients', patientId);
      await setDoc(docRef, newPatient);
      return { id: patientId, ...newPatient };
    });
  }
  
  // 3. 환자 데이터 조회
  export async function getPatient(name, birthDate) {
    const patientId = `${name}_${birthDate.replace(/-/g, '')}`;
    
    return withRetry(async () => {
      const docRef = doc(db, 'patients', patientId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { id: patientId, ...docSnap.data() };
      } else {
        throw new Error('환자 데이터를 찾을 수 없습니다.');
      }
    });
  }
  
  // 4. Survey의 특정 Scale 업데이트
  export async function updateSurveyScale(name, birthDate, scaleKey, scaleData) {
    const patientId = `${name}_${birthDate.replace(/-/g, '')}`;
    
    return withRetry(async () => {
      const docRef = doc(db, 'patients', patientId);
      
      // 중첩된 필드 업데이트
      const updateData = {
        [`survey.${scaleKey}`]: scaleData
      };
      
      await updateDoc(docRef, updateData);
      return { success: true, patientId, scaleKey };
    });
  }
  
  // 5. CNT의 특정 Task 업데이트
  export async function updateCNTTask(name, birthDate, taskKey, taskData) {
    const patientId = `${name}_${birthDate.replace(/-/g, '')}`;
    
    return withRetry(async () => {
      const docRef = doc(db, 'patients', patientId);
      
      // 중첩된 필드 업데이트
      const updateData = {
        [`cnt.${taskKey}`]: taskData
      };
      
      await updateDoc(docRef, updateData);
      return { success: true, patientId, taskKey };
    });
  }
  
  // 6. 리포트 생성 시 기록
  export async function generateReportRecord(name, birthDate, fileName) {
    const patientId = `${name}_${birthDate.replace(/-/g, '')}`;
    
    return withRetry(async () => {
      const docRef = doc(db, 'patients', patientId);
      
      await updateDoc(docRef, {
        reportGenerated: true,
        reportFileName: fileName
      });
      
      return { success: true, patientId, fileName };
    });
  }
  
  // 유틸리티 함수: 전체 진행률 계산
  export function calculateProgress(patientData) {
    if (!patientData) return { survey: 0, cnt: 0, total: 0 };
    
    // Survey 진행률
    const surveyScales = Object.values(patientData.survey || {});
    const surveyDone = surveyScales.filter(scale => scale.isDone).length;
    const surveyProgress = (surveyDone / surveyScales.length) * 100;
    
    // CNT 진행률
    const cntTasks = Object.values(patientData.cnt || {});
    const cntDone = cntTasks.filter(task => task.isDone).length;
    const cntProgress = (cntDone / cntTasks.length) * 100;
    
    // 전체 진행률
    const totalItems = surveyScales.length + cntTasks.length;
    const totalDone = surveyDone + cntDone;
    const totalProgress = (totalDone / totalItems) * 100;
    
    return {
      survey: Math.round(surveyProgress),
      cnt: Math.round(cntProgress),
      total: Math.round(totalProgress)
    };
  }