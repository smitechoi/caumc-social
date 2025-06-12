import { calculateProgress } from '../firebase/crud.js';

export class Dashboard {
  constructor(containerId, patientData) {
    this.container = document.getElementById(containerId);
    this.patientData = patientData;
    this.render();
  }

  render() {
    const progress = this.calculateDetailedProgress();
    
    this.container.innerHTML = `
      <div class="dashboard-container">
        <div class="dashboard-header">
          <h1>검사 선택</h1>
          <div class="patient-info">
            <span>${this.patientData.name}님</span>
            <span>${this.patientData.birthDate}</span>
          </div>
        </div>
        
        <div class="test-selection">
          <div class="test-card" onclick="window.dashboardInstance.navigateToSurvey()">
            <h2>임상 척도 검사</h2>
            <div class="progress-info">
              <div class="progress-text">${progress.survey.completed}/${progress.survey.total} 완료</div>
              <div class="progress-bar">
                <div class="progress-fill" style="width: ${progress.survey.percentage}%"></div>
              </div>
            </div>
            <div class="scale-list">
              ${this.renderScaleList()}
            </div>
            <button class="enter-btn" ${progress.survey.percentage === 100 ? 'disabled' : ''}>
              ${progress.survey.percentage === 100 ? '완료됨' : '검사 시작'}
            </button>
          </div>
          
          <div class="test-card" onclick="window.dashboardInstance.navigateToCNT()">
            <h2>인지 기능 검사</h2>
            <div class="progress-info">
              <div class="progress-text">${progress.cnt.completed}/${progress.cnt.total} 완료</div>
              <div class="progress-bar">
                <div class="progress-fill" style="width: ${progress.cnt.percentage}%"></div>
              </div>
            </div>
            <div class="task-list">
              ${this.renderTaskList()}
            </div>
            <button class="enter-btn" ${progress.cnt.percentage === 100 ? 'disabled' : ''}>
              ${progress.cnt.percentage === 100 ? '완료됨' : '검사 시작'}
            </button>
          </div>
        </div>
        
        <div class="dashboard-actions">
          ${progress.total.percentage > 0 ? 
            '<button onclick="window.location.hash=\'#report\'">리포트 생성</button>' : 
            '<button disabled>리포트 생성 (검사를 먼저 진행하세요)</button>'
          }
        </div>
      </div>
    `;
    
    window.dashboardInstance = this;
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
        percentage: Math.round((surveyCompleted / surveyScales.length) * 100)
      },
      cnt: {
        completed: cntCompleted,
        total: cntTasks.length,
        percentage: Math.round((cntCompleted / cntTasks.length) * 100)
      },
      total: {
        percentage: Math.round(((surveyCompleted + cntCompleted) / (surveyScales.length + cntTasks.length)) * 100)
      }
    };
  }

  renderScaleList() {
    const scales = Object.entries(this.patientData.survey || {});
    return scales.map(([key, scale]) => `
      <div class="item-status ${scale.isDone ? 'completed' : 'pending'}">
        <span>${this.getScaleName(key)}</span>
        <span>${scale.isDone ? '✓' : '○'}</span>
      </div>
    `).join('');
  }

  renderTaskList() {
    const tasks = Object.entries(this.patientData.cnt || {});
    return tasks.map(([key, task]) => `
      <div class="item-status ${task.isDone ? 'completed' : 'pending'}">
        <span>${this.getTaskName(key)}</span>
        <span>${task.isDone ? '✓' : '○'}</span>
      </div>
    `).join('');
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
    const names = {
      scale1: '우울 척도',
      scale2: '불안 척도', 
      scale3: '스트레스 척도',
      scale4: '삶의 질'
    };
    return names[key] || key;
  }

  getTaskName(key) {
    const names = {
      task1: '스트룹 검사',
      task2: 'N-Back 검사',
      task3: 'Go/No-Go 검사',
      task4: '선로 잇기 검사',
      task5: '숫자 폭 검사'
    };
    return names[key] || key;
  }
}

// CSS 스타일
const style = document.createElement('style');
style.textContent = `
  .dashboard-container {
    max-width: 1000px;
    margin: 20px auto;
    padding: 20px;
  }
  
  .dashboard-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 40px;
    padding-bottom: 20px;
    border-bottom: 2px solid #ddd;
  }
  
  .patient-info {
    display: flex;
    gap: 20px;
    font-size: 16px;
    color: #666;
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
    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
    transform: translateY(-2px);
  }
  
  .test-card h2 {
    margin-bottom: 20px;
    color: #333;
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
  }
  
  .dashboard-actions button:disabled {
    background: #ccc;
    cursor: not-allowed;
  }
  
  @media (max-width: 768px) {
    .test-selection {
      grid-template-columns: 1fr;
    }
  }
`;
document.head.appendChild(style);ㄹ