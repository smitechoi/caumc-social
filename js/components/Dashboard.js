import { calculateProgress } from '../firebase/crud.js';
import { translationService } from '../services/TranslationService.js';

export class Dashboard {
  constructor(containerId, patientData) {
    this.container = document.getElementById(containerId);
    this.patientData = patientData;
    this.render();
  }

  render() {
    const t = (key, params) => translationService.t(key, params);
    const progress = this.calculateDetailedProgress();
    
    this.container.innerHTML = `
      <div class="dashboard-container">
        <div class="dashboard-header">
          <h1>${t('testSelection')}</h1>
          <div class="header-right">
            <div class="patient-info">
              <span>${this.patientData.name}</span>
              <span>${this.patientData.birthDate}</span>
            </div>
            <button class="logout-btn" onclick="window.dashboardInstance.logout()">
              ${t('logout')}
            </button>
          </div>
        </div>
        
        <div class="test-selection">
          <div class="test-card" onclick="window.dashboardInstance.navigateToSurvey()">
            <h2>${t('clinicalScales')}</h2>
            <div class="progress-info">
              <div class="progress-text">${progress.survey.completed}/${progress.survey.total} ${t('completed')}</div>
              <div class="progress-bar">
                <div class="progress-fill" style="width: ${progress.survey.percentage}%"></div>
              </div>
            </div>
            <div class="scale-list">
              ${this.renderScaleList()}
            </div>
            <button class="enter-btn" ${progress.survey.percentage === 100 ? 'disabled' : ''}>
              ${progress.survey.percentage === 100 ? t('completedStatus') : t('startTest')}
            </button>
          </div>
          
          <div class="test-card" onclick="window.dashboardInstance.navigateToCNT()">
            <h2>${t('cognitiveFunction')}</h2>
            <div class="progress-info">
              <div class="progress-text">${progress.cnt.completed}/${progress.cnt.total} ${t('completed')}</div>
              <div class="progress-bar">
                <div class="progress-fill" style="width: ${progress.cnt.percentage}%"></div>
              </div>
            </div>
            <div class="task-list">
              ${this.renderTaskList()}
            </div>
            <button class="enter-btn" ${progress.cnt.percentage === 100 ? 'disabled' : ''}>
              ${progress.cnt.percentage === 100 ? t('completedStatus') : t('startTest')}
            </button>
          </div>
        </div>
        
        <div class="dashboard-actions">
          ${progress.total.percentage > 0 ? 
            `<button onclick="window.location.hash='#report'">${t('generateReport')}</button>` : 
            `<button disabled>${t('generateReportDisabled')}</button>`
          }
        </div>
      </div>
    `;
    
    window.dashboardInstance = this;
  }
  
  logout() {
    const t = (key) => translationService.t(key);
    
    if (confirm(t('logoutConfirm'))) {
      // 환자 데이터 초기화
      window.currentPatient = null;
      if (window.app) {
        window.app.patientData = null;
      }
      
      // 로그인 페이지로 이동
      window.location.hash = '#login';
    }
  }

  calculateDetailedProgress() {
    const surveyScales = Object.entries(this.patientData.survey || {});
    const surveyCompleted = surveyScales.filter(([_, scale]) => scale.isDone).length;
    
    const cntTasks = Object.entries(this.patientData.cnt || {});
    const cntCompleted = cntTasks.filter(([_, task]) => task.isDone).length;
    
    return {
      survey: {
        completed: surveyCompleted,
        total: surveyScales.length,
        percentage: Math.round((surveyCompleted / surveyScales.length) * 100) || 0
      },
      cnt: {
        completed: cntCompleted,
        total: cntTasks.length,
        percentage: Math.round((cntCompleted / cntTasks.length) * 100) || 0
      },
      total: {
        percentage: Math.round(((surveyCompleted + cntCompleted) / (surveyScales.length + cntTasks.length)) * 100) || 0
      }
    };
  }

  renderScaleList() {
    // 순서를 보장하기 위해 키를 명시적으로 정의
    const scaleOrder = ['scale1', 'scale2', 'scale3', 'scale4'];
    const patientSurvey = this.patientData.survey || {};
    
    return scaleOrder.map(key => {
      const scale = patientSurvey[key];
      if (!scale) return ''; // 데이터가 없으면 스킵
      
      return `
        <div class="item-status ${scale.isDone ? 'completed' : 'pending'}">
          <span>${this.getScaleName(key)}</span>
          <span>${scale.isDone ? '✓' : '○'}</span>
        </div>
      `;
    }).join('');
  }

  renderTaskList() {
    // 순서를 보장하기 위해 키를 명시적으로 정의
    const taskOrder = ['task1', 'task2', 'task3', 'task4', 'task5'];
    const patientCNT = this.patientData.cnt || {};
    
    return taskOrder.map(key => {
      const task = patientCNT[key];
      if (!task) return '';
      
      return `
        <div class="item-status ${task.isDone ? 'completed' : 'pending'}">
          <span>${this.getTaskName(key)}</span>
          <span>${task.isDone ? '✓' : '○'}</span>
        </div>
      `;
    }).join('');
  }

  navigateToSurvey() {
    const progress = this.calculateDetailedProgress();
    if (progress.survey.percentage < 100) {
      window.location.hash = '#survey-selection';
    }
  }

  navigateToCNT() {
    const progress = this.calculateDetailedProgress();
    if (progress.cnt.percentage < 100) {
      window.location.hash = '#cnt-selection';
    }
  }

  getScaleName(key) {
    const t = (key) => translationService.t(key);
    const names = {
      scale1: t('cesdc'),
      scale2: t('bai'), 
      scale3: t('kaq'),
      scale4: t('kars')
    };
    return names[key] || key;
  }

  getTaskName(key) {
    const t = (key) => translationService.t(key);
    const names = {
      task1: t('stroopTask'),
      task2: t('nBackTask'),
      task3: t('goNoGoTask'),
      task4: t('emotionTask'),
      task5: t('rotationTask')
    };
    return names[key] || key;
  }

  destroy() {
    // 컴포넌트 정리
    this.container.innerHTML = '';
  }
}

// CSS 스타일
const style = document.createElement('style');
style.textContent = `
  .dashboard-container {
    max-width: 1000px;
    margin: 20px auto;
    padding: 20px;
    animation: fadeIn 0.3s ease-out;
  }
  
  .dashboard-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 40px;
    padding-bottom: 20px;
    border-bottom: 2px solid #ddd;
  }
  
  .dashboard-header h1 {
    color: #333;
    margin: 0;
  }
  
  .patient-info {
    display: flex;
    gap: 20px;
    font-size: 16px;
    color: #666;
    align-items: center;
  }
  
  .test-selection {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 30px;
    margin-bottom: 40px;
  }
  
  .test-card {
    background: white;
    border: 1px solid #ddd;
    border-radius: 8px;
    padding: 30px;
    cursor: pointer;
    transition: all 0.3s;
  }
  
  .test-card:hover {
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    transform: translateY(-2px);
  }
  
  .test-card h2 {
    margin-bottom: 20px;
    color: #333;
    font-size: 24px;
  }
  
  .header-right {
    display: flex;
    align-items: center;
    gap: 30px;
  }
  
  .logout-btn {
    padding: 8px 20px;
    background: #f44336;
    color: white;
    border: none;
    border-radius: 4px;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .logout-btn:hover {
    background: #d32f2f;
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  }
  
  .progress-info {
    margin-bottom: 20px;
  }
  
  .progress-text {
    font-size: 14px;
    color: #666;
    margin-bottom: 8px;
  }
  
  .progress-bar {
    width: 100%;
    height: 8px;
    background: #e0e0e0;
    border-radius: 4px;
    overflow: hidden;
  }
  
  .progress-fill {
    height: 100%;
    background: #4CAF50;
    transition: width 0.3s ease;
  }
  
  .scale-list, .task-list {
    margin: 20px 0;
    max-height: 150px;
    overflow-y: auto;
  }
  
  .item-status {
    display: flex;
    justify-content: space-between;
    padding: 8px 0;
    border-bottom: 1px solid #f0f0f0;
    font-size: 14px;
  }
  
  .item-status.completed {
    color: #4CAF50;
  }
  
  .item-status.pending {
    color: #666;
  }
  
  .enter-btn {
    width: 100%;
    padding: 12px;
    background: #2196F3;
    color: white;
    border: none;
    border-radius: 4px;
    font-size: 16px;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .enter-btn:hover:not(:disabled) {
    background: #1976D2;
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  }
  
  .enter-btn:disabled {
    background: #ccc;
    cursor: not-allowed;
  }
  
  .dashboard-actions {
    text-align: center;
  }
  
  .dashboard-actions button {
    padding: 15px 40px;
    font-size: 18px;
    background: #4CAF50;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .dashboard-actions button:hover:not(:disabled) {
    background: #388E3C;
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  }
  
  .dashboard-actions button:disabled {
    background: #ccc;
    cursor: not-allowed;
  }
  
  @media (max-width: 768px) {
    .test-selection {
      grid-template-columns: 1fr;
    }
    
    .dashboard-header {
      flex-direction: column;
      gap: 20px;
      text-align: center;
    }
    
    .header-right {
      flex-direction: column;
      gap: 15px;
    }
  }
  
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;
document.head.appendChild(style);