import { updateCNTTask } from '../firebase/crud.js';
import { StroopTask } from './tasks/StroopTask.js';
import { NBackTask } from './tasks/NBackTask.js';
import { GoNoGoTask } from './tasks/GoNoGoTask.js';
import { EmotionRecognitionTask } from './tasks/EmotionRecognitionTask.js';
import { MentalRotationTask } from './tasks/MentalRotationTask.js';
import { translationService } from '../services/TranslationService.js';

export class CNTTask {
  constructor(containerId, patientData) {
    this.container = document.getElementById(containerId);
    this.patientData = patientData;
    this.currentTaskIndex = 0;
    this.tasks = ['task1', 'task2', 'task3', 'task4', 'task5'];
    
    // 선택된 task만 처리
    if (window.selectedTask) {
      this.currentTask = window.selectedTask;
      this.tasks = [window.selectedTask];
    } else {
      this.findNextIncompleteTask();
    }
    
    // 각 Task 설정
    this.taskConfigs = {
      task1: { 
        name: 'Stroop Task', 
        type: 'stroop',
        class: StroopTask,
        duration: 120000
      },
      task2: { 
        name: 'N-Back Task', 
        type: 'nback',
        class: NBackTask,
        duration: 180000
      },
      task3: { 
        name: 'Go/No-Go Task', 
        type: 'gonogo',
        class: GoNoGoTask,
        duration: 150000
      },
      task4: { 
        name: 'Emotion Recognition', 
        type: 'emotion',
        class: EmotionRecognitionTask,
        duration: 180000
      },
      task5: { 
        name: 'Mental Rotation', 
        type: 'rotation',
        class: MentalRotationTask,
        duration: 240000
      }
    };
    
    this.currentTaskInstance = null;
    this.render();
  }

  findNextIncompleteTask() {
    for (let i = 0; i < this.tasks.length; i++) {
      const task = this.patientData.cnt[this.tasks[i]];
      if (!task.isDone) {
        this.currentTaskIndex = i;
        return;
      }
    }
    this.currentTaskIndex = this.tasks.length;
  }

  render() {
    if (this.currentTaskIndex >= this.tasks.length) {
      this.renderComplete();
      return;
    }

    const t = (key, params) => translationService.t(key, params);
    const currentTask = this.tasks[this.currentTaskIndex];
    const config = this.taskConfigs[currentTask];
    
    this.container.innerHTML = `
      <div class="cnt-container">
        <div class="cnt-header">
          <h2>${t('cntTest')} - ${this.getLocalizedTaskName(currentTask)}</h2>
          <div class="current-task-info">
            <span class="task-badge">${currentTask.replace('task', 'Task ')}</span>
            <span class="task-name">${this.getLocalizedTaskName(currentTask)}</span>
          </div>
          <div class="progress">
            <div class="progress-text">
              ${t('progress')}: ${this.currentTaskIndex}/${this.tasks.length} ${t('completed')}
            </div>
            <div class="progress-bar">
              <div class="progress-fill" style="width: ${(this.currentTaskIndex / this.tasks.length) * 100}%"></div>
            </div>
          </div>
        </div>
        
        <div class="task-instructions" id="task-instructions">
          ${this.getTaskInstructions(config.type)}
        </div>
        
        <div class="button-container">
          <button id="start-task" onclick="window.cntInstance.startTask()">
            ${t('startTest')}
          </button>
        </div>
      </div>
    `;

    window.cntInstance = this;
  }

  getTaskInstructions(taskType) {
    const t = (key) => translationService.t(key);
    const lang = this.patientData.language;
    
    // 태스크별 지시문
    const instructions = {
      stroop: `
        <h3>${t('stroopTitle')}</h3>
        <p>${t('stroopInstruction1')}</p>
        <p>${t('stroopExample')}</p>
      `,
      nback: `
        <h3>${t('nBackTitle')}</h3>
        <p>${t('nBackInstruction1')}</p>
        <p>${t('nBackInstruction2')}</p>
      `,
      gonogo: `
        <h3>${t('goNoGoTitle')}</h3>
        <p>${t('goNoGoInstruction1')}</p>
        <ul>
          <li>${t('goNoGoEven')}</li>
          <li>${t('goNoGoOdd')}</li>
        </ul>
      `,
      emotion: `
        <h3>${t('emotionTitle')}</h3>
        <p>${t('emotionInstruction1')}</p>
        <p>${t('emotionInstruction2')}</p>
        <p>${t('emotionInstruction3')}</p>
      `,
      rotation: `
        <h3>${t('rotationTitle')}</h3>
        <p>${t('rotationInstruction1')}</p>
        <p>${t('rotationInstruction2')}</p>
        <p>${t('rotationNote')}</p>
      `
    };
    
    return instructions[taskType] || '';
  }

  startTask() {
    const currentTask = this.currentTask || this.tasks[this.currentTaskIndex];
    const config = this.taskConfigs[currentTask];
    
    // 전체 화면 컨테이너 생성
    const fullscreenContainer = document.createElement('div');
    fullscreenContainer.id = 'task-fullscreen-container';
    fullscreenContainer.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: white;
      z-index: 1000;
      overflow: hidden;
    `;
    
    document.body.appendChild(fullscreenContainer);
    
    // 태스크 인스턴스 생성
    const TaskClass = config.class;
    this.currentTaskInstance = new TaskClass(
      fullscreenContainer,
      this.patientData,
      (taskData) => this.onTaskComplete(taskData),
      () => this.onTaskExit()
    );
    
    // 태스크 시작
    this.currentTaskInstance.start();
  }

  async onTaskComplete(taskData) {
    const currentTask = this.currentTask || this.tasks[this.currentTaskIndex];
    
    try {
      await updateCNTTask(
        this.patientData.name,
        this.patientData.birthDate,
        currentTask,
        taskData
      );
      
      this.patientData.cnt[currentTask] = taskData;
      
      // 전체 화면 제거
      this.removeFullscreen();
      
      if (this.currentTask) {
        // 개별 태스크 모드
        this.renderTaskComplete();
      } else {
        // 전체 진행 모드
        this.currentTaskIndex++;
        this.render();
      }
      
    } catch (error) {
      console.error('Task 저장 오류:', error);
      alert(translationService.t('saveError'));
      this.removeFullscreen();
    }
  }

  onTaskExit() {
    this.removeFullscreen();
    window.location.hash = '#cnt-selection';
  }

  removeFullscreen() {
    const fullscreenContainer = document.getElementById('task-fullscreen-container');
    if (fullscreenContainer) {
      fullscreenContainer.remove();
    }
    if (this.currentTaskInstance && this.currentTaskInstance.cleanup) {
      this.currentTaskInstance.cleanup();
    }
  }

  renderTaskComplete() {
    const t = (key, params) => translationService.t(key, params);
    
    this.container.innerHTML = `
      <div class="cnt-complete">
        <h2>${this.getLocalizedTaskName(this.currentTask)} ${t('complete')}!</h2>
        <p>${t('taskCompleteMessage')}</p>
        <div class="score-summary">
          <h3>${t('score')}</h3>
          <p>${this.patientData.cnt[this.currentTask].score}</p>
        </div>
        <button onclick="window.location.hash='#cnt-selection'">
          ${t('selectOtherTest')}
        </button>
      </div>
    `;
  }

  renderComplete() {
    const t = (key) => translationService.t(key);
    
    this.container.innerHTML = `
      <div class="cnt-complete">
        <h2>${t('cntComplete')}</h2>
        <p>${t('allTestsCompleted')}</p>
        <div class="score-summary">
          <h3>${t('testResults')}</h3>
          ${this.renderScoreSummary()}
        </div>
        <button onclick="window.location.hash='#report'">
          ${t('generateReport')}
        </button>
      </div>
    `;
  }

  renderScoreSummary() {
    const t = (key) => translationService.t(key);
    let html = '<ul>';
    
    for (const task of this.tasks) {
      const data = this.patientData.cnt[task];
      html += `<li>${this.getLocalizedTaskName(task)}: ${data.score} ${t('points')}</li>`;
    }
    
    html += '</ul>';
    return html;
  }

  getLocalizedTaskName(task) {
    const t = (key) => translationService.t(key);
    const names = {
      task1: t('stroopTest'),
      task2: t('nBackTest'),
      task3: t('goNoGoTest'),
      task4: t('emotionRecognitionTest'),
      task5: t('mentalRotationTest')
    };
    
    return names[task] || this.taskConfigs[task].name;
  }

  destroy() {
    // 컴포넌트 정리
    this.removeFullscreen();
    this.container.innerHTML = '';
  }
}

// CSS 스타일
const style = document.createElement('style');
style.textContent = `
  .cnt-container {
    max-width: 900px;
    margin: 20px auto;
    padding: 20px;
    animation: fadeIn 0.3s ease-out;
  }
  
  .cnt-header {
    text-align: center;
    margin-bottom: 30px;
  }
  
  .cnt-header h2 {
    color: #333;
    margin-bottom: 20px;
  }
  
  .current-task-info {
    margin: 15px 0;
    padding: 15px;
    background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
    color: white;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 15px;
    box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
  }
  
  .task-badge {
    background: rgba(255, 255, 255, 0.2);
    padding: 8px 16px;
    border-radius: 20px;
    font-weight: bold;
    font-size: 14px;
  }
  
  .task-name {
    font-size: 18px;
    font-weight: bold;
  }
  
  .progress {
    margin-top: 20px;
  }
  
  .progress-text {
    text-align: center;
    margin-bottom: 10px;
    color: #666;
    font-size: 14px;
  }
  
  .progress-bar {
    width: 100%;
    height: 20px;
    background: #e0e0e0;
    border-radius: 10px;
    overflow: hidden;
  }
  
  .progress-fill {
    height: 100%;
    background: #4CAF50;
    transition: width 0.3s ease;
  }
  
  .task-instructions {
    background: #f9f9f9;
    padding: 30px;
    border-radius: 8px;
    margin: 20px 0;
    border: 1px solid #e0e0e0;
  }
  
  .task-instructions h3 {
    margin-bottom: 15px;
    color: #333;
  }
  
  .task-instructions p {
    line-height: 1.6;
    margin-bottom: 10px;
  }
  
  .task-instructions ul {
    margin: 10px 0;
    padding-left: 30px;
  }
  
  .task-instructions li {
    margin: 5px 0;
  }
  
  .button-container {
    text-align: center;
    margin-top: 30px;
  }
  
  #start-task {
    padding: 15px 40px;
    background: #4CAF50;
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 18px;
    cursor: pointer;
    transition: all 0.3s;
    font-weight: bold;
  }
  
  #start-task:hover {
    background: #45a049;
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0,0,0,0.2);
  }
  
  .cnt-complete {
    text-align: center;
    padding: 40px;
  }
  
  .cnt-complete h2 {
    color: #4CAF50;
    margin-bottom: 20px;
  }
  
  .score-summary {
    margin: 30px 0;
    padding: 20px;
    background: #f0f0f0;
    border-radius: 8px;
  }
  
  .score-summary h3 {
    margin-bottom: 15px;
    color: #333;
  }
  
  .score-summary ul {
    list-style: none;
    padding: 0;
  }
  
  .score-summary li {
    padding: 5px 0;
    font-size: 16px;
  }
  
  .cnt-complete button {
    padding: 12px 30px;
    background: #2196F3;
    color: white;
    border: none;
    border-radius: 6px;
    font-size: 16px;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .cnt-complete button:hover {
    background: #1976D2;
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  }
  
  #task-fullscreen-container {
    touch-action: none;
  }
  
  /* 언어별 스타일 조정 */
  body.lang-ja .task-instructions,
  body.lang-zh .task-instructions {
    font-size: 14px;
  }
  
  body.lang-th .task-instructions {
    font-size: 16px;
    line-height: 1.8;
  }
  
  @media (max-width: 768px) {
    .cnt-container {
      padding: 15px;
    }
    
    .task-instructions {
      padding: 20px;
    }
    
    .current-task-info {
      flex-direction: column;
      gap: 10px;
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