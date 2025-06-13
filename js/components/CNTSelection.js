import { translationService } from '../services/TranslationService.js';

export class CNTSelection {
  constructor(containerId, patientData) {
    this.container = document.getElementById(containerId);
    this.patientData = patientData;
    this.render();
  }

  render() {
    const t = (key, params) => translationService.t(key, params);
    
    this.container.innerHTML = `
      <div class="selection-container">
        <div class="selection-header">
          <button onclick="window.location.hash='#dashboard'" class="back-btn">← ${t('back')}</button>
          <h2>${t('cntSelection')}</h2>
        </div>
        
        <div class="task-grid">
          ${this.renderTasks()}
        </div>
      </div>
    `;
  }

  renderTasks() {
    const t = (key, params) => translationService.t(key, params);
    
    // 태스크 순서 보장
    const taskOrder = ['task1', 'task2', 'task3', 'task4', 'task5'];
    const patientCNT = this.patientData.cnt || {};

    return taskOrder.map((key, index) => {
      const task = patientCNT[key];
      if (!task) return '';
      
      const isCompleted = task.isDone;
      const taskNumber = index + 1;

      return `
        <div class="task-card ${isCompleted ? 'completed' : ''}" 
             ${!isCompleted ? `onclick="window.cntSelectionInstance.selectTask('${key}')"` : ''}>
          <div class="task-icon">${this.getTaskIcon(key)}</div>
          <h3>${this.getTaskName(key)}</h3>
          <div class="task-info">
            <p>${t('estimatedTime')}: ${this.getTaskDuration(key)}</p>
            ${isCompleted ?
              `<p class="score">${t('score')}: ${task.score}</p>` :
              `<p class="status">${t('notCompleted')}</p>`
            }
          </div>
          <div class="task-description">
            <p>${this.getTaskDescription(key)}</p>
          </div>
          <div class="task-status">
            ${isCompleted ?
              `<span class="completed-badge">✓ ${t('completedStatus')}</span>` :
              `<button class="start-btn">${t('startTest')}</button>`
            }
          </div>
        </div>
      `;
    }).join('');
  }

  selectTask(taskKey) {
    window.selectedTask = taskKey;
    window.location.hash = '#cnt';
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

  getTaskIcon(key) {
    const icons = {
      task1: '🎨',
      task2: '🧠',
      task3: '🚦',
      task4: '😊',
      task5: '🔲'
    };
    return icons[key] || '📝';
  }

  getTaskDuration(key) {
    const t = (key) => translationService.t(key);
    const currentLang = translationService.currentLanguage;
    
    // 언어별 시간 표현
    const timeUnits = {
      ko: '분',
      en: 'min',
      ja: '分',
      zh: '分钟',
      vn: 'phút',
      th: 'นาที'
    };
    
    const durations = {
      task1: 2,
      task2: 3,
      task3: 2.5,
      task4: 3,
      task5: 4
    };
    
    const duration = durations[key] || 3;
    const unit = timeUnits[currentLang] || timeUnits.ko;
    
    return `${duration}${unit}`;
  }

  getTaskDescription(key) {
    const t = (key) => translationService.t(key);
    const descriptions = {
      task1: t('stroopDescription'),
      task2: t('nBackDescription'),
      task3: t('goNoGoDescription'),
      task4: t('emotionDescription'),
      task5: t('rotationDescription')
    };
    return descriptions[key] || '';
  }

  destroy() {
    // 컴포넌트 정리
    this.container.innerHTML = '';
  }
}

// CSS 스타일
const style = document.createElement('style');
style.textContent = `
  .selection-container {
    max-width: 1000px;
    margin: 20px auto;
    padding: 20px;
    animation: fadeIn 0.3s ease-out;
  }
  
  .selection-header {
    display: flex;
    align-items: center;
    gap: 20px;
    margin-bottom: 30px;
  }
  
  .selection-header h2 {
    color: #333;
    margin: 0;
  }
  
  .back-btn {
    padding: 8px 16px;
    background: #666;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    transition: all 0.2s;
  }
  
  .back-btn:hover {
    background: #555;
    transform: translateY(-1px);
  }
  
  .task-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 25px;
  }
  
  .task-card {
    background: white;
    border: 2px solid #e0e0e0;
    border-radius: 12px;
    padding: 25px;
    cursor: pointer;
    transition: all 0.3s;
    display: flex;
    flex-direction: column;
    position: relative;
    overflow: hidden;
  }
  
  .task-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, #2196F3, #21CBF3);
    transform: translateY(-100%);
    transition: transform 0.3s;
  }
  
  .task-card:not(.completed):hover::before {
    transform: translateY(0);
  }
  
  .task-card:not(.completed):hover {
    border-color: #2196F3;
    box-shadow: 0 8px 20px rgba(33, 150, 243, 0.2);
    transform: translateY(-3px);
  }
  
  .task-card:not(.completed):hover .task-icon {
    transform: scale(1.2) rotate(5deg);
  }
  
  .task-card:not(.completed):hover .start-btn {
    background: #1976D2;
    transform: scale(1.05);
  }
  
  .task-card.completed {
    background: #f9f9f9;
    border-color: #4CAF50;
    cursor: default;
  }
  
  .task-card.completed::before {
    background: #4CAF50;
    transform: translateY(0);
  }
  
  .task-icon {
    font-size: 48px;
    margin-bottom: 15px;
    text-align: center;
    transition: transform 0.3s ease;
  }
  
  .task-card h3 {
    margin-bottom: 15px;
    color: #333;
    text-align: center;
    font-size: 20px;
  }
  
  .task-info {
    margin-bottom: 15px;
    color: #666;
    font-size: 14px;
    text-align: center;
  }
  
  .task-info p {
    margin: 5px 0;
  }
  
  .task-info .score {
    color: #4CAF50;
    font-weight: bold;
  }
  
  .task-info .status {
    color: #ff9800;
  }
  
  .task-description {
    flex: 1;
    margin-bottom: 20px;
    font-size: 14px;
    color: #777;
    line-height: 1.6;
    text-align: center;
  }
  
  .task-status {
    text-align: center;
  }
  
  .start-btn {
    width: 100%;
    padding: 12px;
    background: #2196F3;
    color: white;
    border: none;
    border-radius: 6px;
    font-size: 16px;
    cursor: pointer;
    transition: all 0.2s;
    font-weight: bold;
  }
  
  .start-btn:hover {
    background: #1976D2;
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0,0,0,0.2);
  }
  
  .completed-badge {
    display: block;
    text-align: center;
    color: #4CAF50;
    font-weight: bold;
    font-size: 16px;
  }
  
  @media (max-width: 768px) {
    .task-grid {
      grid-template-columns: 1fr;
    }
    
    .task-card {
      padding: 20px;
    }
    
    .task-icon {
      font-size: 36px;
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
  
  /* 언어별 스타일 조정 */
  body.lang-ja .task-card h3,
  body.lang-zh .task-card h3 {
    font-size: 18px;
  }
  
  body.lang-th .task-card {
    padding: 30px 20px;
  }
  
  body.lang-th .task-description {
    font-size: 15px;
    line-height: 1.8;
  }
`;
document.head.appendChild(style);