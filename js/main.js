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
    
    // 스크롤 강제 활성화
    document.body.style.overflow = 'auto';
    document.body.style.height = 'auto';
    document.body.style.position = 'relative';
    document.documentElement.style.overflow = 'auto';
    document.documentElement.style.height = 'auto';
    mainContainer.style.overflow = 'auto';
    mainContainer.style.overflowY = 'auto';
    mainContainer.style.height = 'auto';
    mainContainer.style.minHeight = '100vh';

    
    // 스크롤 위치 초기화
    window.scrollTo(0, 0);
    
    switch(view) {
      case 'login':
        this.components.login = new PatientLogin('app');
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
        window.surveySelectionInstance = this.components.surveySelection;
        break;
        
      case 'survey':
        if (!this.patientData) {
          window.location.hash = '#login';
          return;
        }
        this.components.survey = new Survey('app', this.patientData);
        break;
        
      case 'cnt-selection':
        if (!this.patientData) {
          window.location.hash = '#login';
          return;
        }
        this.components.cntSelection = new CNTSelection('app', this.patientData);
        window.cntSelectionInstance = this.components.cntSelection;
        break;
        
      case 'cnt':
        if (!this.patientData) {
          window.location.hash = '#login';
          return;
        }
        this.components.cnt = new CNTTask('app', this.patientData);
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
    
    // 렌더링 후 다시 한번 스크롤 활성화
    setTimeout(() => {
      document.body.style.overflow = 'auto';
      mainContainer.style.overflow = 'visible';
    }, 100);
  }

  setPatientData(data) {
    this.patientData = data;
    window.currentPatient = data; // 전역 접근용
  }
}

// 전역 앱 인스턴스
window.app = new App();

// 환자 로그인 성공 이벤트 리스너
document.addEventListener('patientLoginSuccess', (event) => {
  window.app.setPatientData(event.detail);
});

// 전역 스타일
const globalStyles = `
  * {
    box-sizing: border-box;
  }
  
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
    margin: 0;
    padding: 0;
    background: #f5f5f5;
    color: #333;
  }
  
  #app {
    overflow-y: auto !important;  /* visible → auto */
    overflow-x: hidden !important;
    min-height: 100vh;
    height: auto;
  }
  
  button {
    cursor: pointer;
    transition: all 0.2s;
  }
  
  button:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  }
  
  .loading {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
    font-size: 24px;
    color: #666;
  }
  
  .error {
    color: #f44336;
    padding: 10px;
    background: #ffebee;
    border-radius: 4px;
    margin: 10px 0;
  }
  
  .success {
    color: #4caf50;
    padding: 10px;
    background: #e8f5e9;
    border-radius: 4px;
    margin: 10px 0;
  }
`;

const styleElement = document.createElement('style');
styleElement.textContent = globalStyles;
document.head.appendChild(styleElement);