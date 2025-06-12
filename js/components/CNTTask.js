import { updateCNTTask } from '../firebase/crud.js';
import { StroopTask } from './tasks/StroopTask.js';
import { NBackTask } from './tasks/NBackTask.js';
import { GoNoGoTask } from './tasks/GoNoGoTask.js';
import { EmotionRecognitionTask } from './tasks/EmotionRecognitionTask.js';
import { MentalRotationTask } from './tasks/MentalRotationTask.js';

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
        name: 'Trail Making Test', 
        type: 'trail',
        class: EmotionRecognitionTask,
        duration: 300000
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

    const currentTask = this.tasks[this.currentTaskIndex];
    const config = this.taskConfigs[currentTask];
    
    this.container.innerHTML = `
      <div class="cnt-container">
        <div class="cnt-header">
          <h2>CNT 검사 - ${this.getLocalizedTaskName(currentTask)}</h2>
          <div class="current-task-info">
            <span class="task-badge">${currentTask.replace('task', 'Task ')}</span>
            <span class="task-name">${this.getLocalizedTaskName(currentTask)}</span>
          </div>
          <div class="progress">
            <div class="progress-text">
              진행률: ${this.currentTaskIndex}/${this.tasks.length} 완료
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
            검사 시작
          </button>
        </div>
      </div>
    `;

    window.cntInstance = this;
  }

  getTaskInstructions(taskType) {
    const lang = this.patientData.language;
    const instructions = {
      ko: {
        stroop: `
          <h3>스트룹 검사</h3>
          <p>화면에 나타나는 색깔 단어를 보고, 단어의 의미가 아닌 <strong>글자의 색깔</strong>을 선택하세요.</p>
          <p>예: <span style="color: red;">파랑</span> → 빨강을 선택</p>
        `,
        nback: `
          <h3>N-Back 검사</h3>
          <p>화면에 연속으로 나타나는 숫자를 보고, 현재 숫자가 2개 전 숫자와 같은지 판단하세요.</p>
          <p>같으면 '같음', 다르면 '다름'을 터치하세요.</p>
        `,
        gonogo: `
          <h3>Go/No-Go 검사</h3>
          <p>화면에 나타나는 숫자를 보고:</p>
          <ul>
            <li>짝수가 나타나면 → 화면을 터치하세요 (Go)</li>
            <li>홀수가 나타나면 → 터치하지 마세요 (No-Go)</li>
          </ul>
        `,
        trail: `
          <h3>선로 잇기 검사</h3>
          <p>화면에 나타난 숫자들을 순서대로 터치하여 연결하세요.</p>
          <p>1 → 2 → 3 → 4 순서로 가능한 빠르게 연결해주세요.</p>
        `,
        rotation: `
          <h3>회전 도형 검사</h3>
          <p>두 개의 도형이 같은지 다른지 판단하세요.</p>
          <p>오른쪽 도형이 왼쪽 도형을 회전시킨 것이면 '같음'을 선택하세요.</p>
          <p>거울상(좌우반전)은 '다름'입니다.</p>
        `
      },
      en: {
        stroop: `
          <h3>Stroop Task</h3>
          <p>Look at the color words on screen and select the <strong>color of the text</strong>, not the meaning.</p>
          <p>Example: <span style="color: red;">BLUE</span> → Select Red</p>
        `,
        // ... 다른 언어 추가
      }
    };
    
    return instructions[lang]?.[taskType] || instructions['ko'][taskType];
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
      alert('저장 중 오류가 발생했습니다.');
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
    this.container.innerHTML = `
      <div class="cnt-complete">
        <h2>${this.getLocalizedTaskName(this.currentTask)} 완료!</h2>
        <p>인지 검사를 완료하셨습니다.</p>
        <div class="score-summary">
          <h3>점수</h3>
          <p>${this.patientData.cnt[this.currentTask].score}점</p>
        </div>
        <button onclick="window.location.hash='#cnt-selection'">
          다른 검사 선택하기
        </button>
      </div>
    `;
  }

  renderComplete() {
    this.container.innerHTML = `
      <div class="cnt-complete">
        <h2>CNT 검사 완료!</h2>
        <p>모든 인지 검사를 완료하셨습니다.</p>
        <div class="score-summary">
          <h3>검사 결과</h3>
          ${this.renderScoreSummary()}
        </div>
        <button onclick="window.location.hash='#report'">
          리포트 생성하기
        </button>
      </div>
    `;
  }

  renderScoreSummary() {
    let html = '<ul>';
    for (const task of this.tasks) {
      const data = this.patientData.cnt[task];
      html += `<li>${this.getLocalizedTaskName(task)}: ${data.score}점</li>`;
    }
    html += '</ul>';
    return html;
  }

  getLocalizedTaskName(task) {
    const lang = this.patientData.language;
    const names = {
      ko: {
        task1: '스트룹 검사',
        task2: 'N-Back 검사',
        task3: 'Go/No-Go 검사',
        task4: '선로 잇기 검사',
        task5: '회전 도형 검사'
      },
      en: {
        task1: 'Stroop Task',
        task2: 'N-Back Task',
        task3: 'Go/No-Go Task',
        task4: 'Trail Making Test',
        task5: 'Mental Rotation Task'
      }
    };
    
    return names[lang]?.[task] || this.taskConfigs[task].name;
  }
}

// CSS 스타일
const style = document.createElement('style');
style.textContent = `
  .cnt-container {
    max-width: 900px;
    margin: 20px auto;
    padding: 20px;
  }
  
  .current-task-info {
    margin: 15px 0;
    padding: 15px;
    background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
    color: white;
    border-radius: 8px;
    display: flex;
    align-items: center;
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
  
  .task-instructions {
    background: #f9f9f9;
    padding: 30px;
    border-radius: 8px;
    margin: 20px 0;
  }
  
  .task-instructions h3 {
    margin-bottom: 15px;
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
    border-radius: 4px;
    font-size: 18px;
    cursor: pointer;
    transition: all 0.3s;
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
  
  .score-summary {
    margin: 30px 0;
    padding: 20px;
    background: #f0f0f0;
    border-radius: 8px;
  }
  
  #task-fullscreen-container {
    touch-action: none;
  }
`;
document.head.appendChild(style);