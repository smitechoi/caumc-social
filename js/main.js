import { PatientLogin } from './components/PatientLogin.js';
import { Dashboard } from './components/Dashboard.js';
import { SurveySelection } from './components/SurveySelection.js';
import { Survey } from './components/Survey.js';
import { CNTSelection } from './components/CNTSelection.js';
import { CNTTask } from './components/CNTTask.js';
import { Report } from './components/Report.js';
import { db } from './firebase/config.js';

// 앱 상태 관리
class App {
  constructor() {
    this.currentView = 'login';
    this.patientData = null;
    this.components = {};
    
    this.init();
  }

  init() {
    // URL 해시 기반 라우팅
    window.addEventListener('hashchange', () => this.handleRoute());
    
    // 초기 라우트 처리
    this.handleRoute();
  }

  handleRoute() {
    const hash = window.location.hash.slice(1) || 'login';
    this.renderView(hash);
  }

  renderView(view) {
    const mainContainer = document.getElementById('app');
    
    // 기존 컴포넌트 정리
    if (this.components[this.currentView]) {
      // cleanup if needed
    }
    
    this.currentView = view;
    mainContainer.innerHTML = '';
    
    // 기존 스타일 초기화
    mainContainer.style.cssText = '';
    
    // 기본 스크롤 설정
    mainContainer.style.overflow = 'auto';
    mainContainer.style.overflowY = 'auto';
    mainContainer.style.overflowX = 'hidden';
    mainContainer.style.height = 'auto';
    mainContainer.style.minHeight = '100vh';
    mainContainer.style.display = 'block';  // flex 대신 block
    mainContainer.style.position = 'relative';
    mainContainer.style.width = '100%';
    mainContainer.style.maxWidth = '1024px';
    mainContainer.style.margin = '0 auto';
    mainContainer.style.background = 'white';
    
    // body와 html 스크롤 활성화
    document.body.style.overflow = 'auto';
    document.body.style.height = 'auto';
    document.body.style.position = 'relative';
    document.documentElement.style.overflow = 'auto';
    document.documentElement.style.height = 'auto';
    
    // CNT Task가 아닌 경우에만 스크롤 위치 초기화
    if (view !== 'cnt-task') {
      window.scrollTo(0, 0);
    }
    
    switch(view) {
      case 'login':
        this.components.login = new PatientLogin('app', (patientData) => {
          this.patientData = patientData;
          window.location.hash = '#dashboard';
        });
        break;
        
      case 'dashboard':
        if (!this.patientData) {
          window.location.hash = '#login';
          return;
        }
        this.components.dashboard = new Dashboard('app', this.patientData);
        break;
        
      case 'survey-selection':
        if (!this.patientData) {
          window.location.hash = '#login';
          return;
        }
        this.components.surveySelection = new SurveySelection('app', this.patientData);
        break;
        
      case 'survey':
        if (!this.patientData) {
          window.location.hash = '#login';
          return;
        }
        
        // URLSearchParams로 척도 정보 가져오기
        const params = new URLSearchParams(window.location.search);
        const scales = params.get('scales');
        
        if (!scales) {
          window.location.hash = '#survey-selection';
          return;
        }
        
        this.components.survey = new Survey('app', this.patientData, scales.split(','));
        break;
        
      case 'cnt-selection':
        if (!this.patientData) {
          window.location.hash = '#login';
          return;
        }
        this.components.cntSelection = new CNTSelection('app', this.patientData);
        break;
        
      case 'cnt-task':
        if (!this.patientData) {
          window.location.hash = '#login';
          return;
        }
        
        // URL에서 태스크 정보 가져오기
        const taskParams = new URLSearchParams(window.location.search);
        const taskName = taskParams.get('task');
        
        if (!taskName) {
          window.location.hash = '#cnt-selection';
          return;
        }
        
        // CNT Task를 위한 특별 처리
        const cntContainer = document.createElement('div');
        cntContainer.className = 'cnt-task-container fixed';
        mainContainer.appendChild(cntContainer);
        
        this.components.cntTask = new CNTTask(cntContainer, this.patientData, taskName);
        break;
        
      case 'report':
        if (!this.patientData) {
          window.location.hash = '#login';
          return;
        }
        this.components.report = new Report('app', this.patientData);
        break;
        
      default:
        window.location.hash = '#login';
    }
    
    // 스크린 리더를 위한 알림
    if (window.announceToScreenReader) {
      window.announceToScreenReader(`${view} 페이지로 이동했습니다.`);
    }
  }

  // 현재 환자 데이터 가져오기
  getPatientData() {
    return this.patientData;
  }

  // 환자 데이터 업데이트
  updatePatientData(data) {
    this.patientData = { ...this.patientData, ...data };
  }
}

// 앱 초기화
window.addEventListener('DOMContentLoaded', () => {
  window.app = new App();
});