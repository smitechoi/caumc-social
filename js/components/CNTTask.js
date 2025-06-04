import { updateCNTTask, getPatient } from '../firebase/crud.js';

export class CNTTask {
  constructor(containerId, patientData) {
    this.container = document.getElementById(containerId);
    this.patientData = patientData;
    this.currentTaskIndex = 0;
    this.tasks = ['task1', 'task2', 'task3', 'task4', 'task5'];
    
    // 각 Task 설정 (예시)
    this.taskConfigs = {
      task1: { 
        name: 'Stroop Task', 
        type: 'stroop',
        duration: 120000 // 2분
      },
      task2: { 
        name: 'N-Back Task', 
        type: 'nback',
        duration: 180000 // 3분
      },
      task3: { 
        name: 'Go/No-Go Task', 
        type: 'gonogo',
        duration: 150000 // 2.5분
      },
      task4: { 
        name: 'Trail Making Test', 
        type: 'trail',
        duration: 300000 // 5분
      },
      task5: { 
        name: 'Digit Span Task', 
        type: 'digitspan',
        duration: 240000 // 4분
      }
    };
    
    this.currentTaskData = null;
    this.taskStartTime = null;
    this.p5Instance = null;
    
    this.findNextIncompleteTask();
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
        
        <div id="task-canvas-container" style="display: none;">
          <!-- p5.js 캔버스가 여기에 생성됨 -->
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
          <p>가능한 빠르고 정확하게 응답해주세요.</p>
        `,
        nback: `
          <h3>N-Back 검사</h3>
          <p>화면에 연속으로 나타나는 자극을 보고, 현재 자극이 2개 전 자극과 같은지 판단하세요.</p>
          <p>같으면 'A' 키, 다르면 'L' 키를 누르세요.</p>
        `,
        gonogo: `
          <h3>Go/No-Go 검사</h3>
          <p>화면에 나타나는 자극을 보고:</p>
          <ul>
            <li>초록색 원이 나타나면 → 스페이스바를 누르세요 (Go)</li>
            <li>빨간색 원이 나타나면 → 아무것도 누르지 마세요 (No-Go)</li>
          </ul>
        `,
        trail: `
          <h3>선로 잇기 검사</h3>
          <p>화면에 나타난 숫자들을 순서대로 클릭하여 연결하세요.</p>
          <p>1 → 2 → 3 → 4 순서로 가능한 빠르게 연결해주세요.</p>
        `,
        digitspan: `
          <h3>숫자 폭 검사</h3>
          <p>화면에 연속으로 나타나는 숫자들을 기억한 후, 순서대로 입력하세요.</p>
          <p>숫자는 점점 길어집니다.</p>
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
    document.getElementById('task-instructions').style.display = 'none';
    document.getElementById('start-task').style.display = 'none';
    document.getElementById('task-canvas-container').style.display = 'block';
    
    this.taskStartTime = Date.now();
    this.currentTaskData = {
      responses: [],
      events: []
    };
    
    const currentTask = this.tasks[this.currentTaskIndex];
    const config = this.taskConfigs[currentTask];
    
    // p5.js로 태스크 실행
    this.runTask(config.type);
  }

  runTask(taskType) {
    const sketch = (p) => {
      let taskState = {};
      
      p.setup = () => {
        const canvas = p.createCanvas(800, 600);
        canvas.parent('task-canvas-container');
        p.textAlign(p.CENTER, p.CENTER);
        
        // 태스크별 초기화
        this.initializeTask(taskType, taskState, p);
      };
      
      p.draw = () => {
        p.background(240);
        
        // 태스크별 렌더링
        this[`render${taskType.charAt(0).toUpperCase() + taskType.slice(1)}`](taskState, p);
      };
      
      p.keyPressed = () => {
        this.handleKeyPress(taskType, taskState, p.key, p);
      };
      
      p.mousePressed = () => {
        this.handleMousePress(taskType, taskState, p.mouseX, p.mouseY, p);
      };
    };
    
    this.p5Instance = new p5(sketch);
  }

  // Stroop Task 구현 예시
  initializeTask(taskType, state, p) {
    if (taskType === 'stroop') {
      state.colors = ['빨강', '파랑', '초록', '노랑'];
      state.colorValues = ['red', 'blue', 'green', 'yellow'];
      state.currentTrial = 0;
      state.maxTrials = 20;
      state.showStimulus = true;
      state.stimulusOnset = p.millis();
      
      this.generateStroopTrial(state);
    }
    // 다른 태스크들도 유사하게 구현...
  }

  generateStroopTrial(state) {
    state.wordIndex = Math.floor(Math.random() * state.colors.length);
    state.colorIndex = Math.floor(Math.random() * state.colors.length);
    state.isCongruent = state.wordIndex === state.colorIndex;
  }

  renderStroop(state, p) {
    if (state.currentTrial >= state.maxTrials) {
      this.completeTask();
      return;
    }
    
    if (state.showStimulus) {
      p.push();
      p.textSize(48);
      p.fill(state.colorValues[state.colorIndex]);
      p.text(state.colors[state.wordIndex], p.width/2, p.height/2);
      p.pop();
      
      // 선택 옵션 표시
      p.textSize(24);
      p.fill(0);
      for (let i = 0; i < state.colors.length; i++) {
        p.text(`${i+1}. ${state.colors[i]}`, p.width/2, p.height - 150 + i * 30);
      }
    }
  }

  handleKeyPress(taskType, state, key, p) {
    if (taskType === 'stroop' && state.showStimulus) {
      const keyNum = parseInt(key);
      if (keyNum >= 1 && keyNum <= 4) {
        const response = {
          trial: state.currentTrial,
          stimulus: state.colors[state.wordIndex],
          color: state.colorValues[state.colorIndex],
          response: state.colors[keyNum - 1],
          correct: (keyNum - 1) === state.colorIndex,
          rt: p.millis() - state.stimulusOnset,
          congruent: state.isCongruent
        };
        
        this.currentTaskData.responses.push(response);
        
        // 다음 시행
        state.currentTrial++;
        state.stimulusOnset = p.millis();
        this.generateStroopTrial(state);
      }
    }
  }

  handleMousePress(taskType, state, x, y, p) {
    // Trail Making Test 등에서 사용
  }

  async completeTask() {
    if (this.p5Instance) {
      this.p5Instance.remove();
    }
    
    const currentTask = this.tasks[this.currentTaskIndex];
    const config = this.taskConfigs[currentTask];
    
    // 점수 계산 (태스크별로 다름)
    const score = this.calculateScore(config.type, this.currentTaskData);
    
    try {
      const taskData = {
        taskName: config.name,
        score: score,
        isDone: true,
        fullLog: {
          startTime: this.taskStartTime,
          endTime: Date.now(),
          duration: Date.now() - this.taskStartTime,
          ...this.currentTaskData
        }
      };
      
      await updateCNTTask(
        this.patientData.name,
        this.patientData.birthDate,
        currentTask,
        taskData
      );
      
      this.patientData.cnt[currentTask] = taskData;
      
      // 다음 태스크로
      this.currentTaskIndex++;
      this.render();
      
    } catch (error) {
      console.error('Task 저장 오류:', error);
      alert('저장 중 오류가 발생했습니다.');
    }
  }

  calculateScore(taskType, data) {
    if (taskType === 'stroop') {
      const correct = data.responses.filter(r => r.correct).length;
      const accuracy = (correct / data.responses.length) * 100;
      const avgRT = data.responses.reduce((sum, r) => sum + r.rt, 0) / data.responses.length;
      
      // 종합 점수 (정확도와 반응시간 고려)
      return Math.round(accuracy - (avgRT / 100));
    }
    // 다른 태스크들도 구현
    return 0;
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
        task5: '숫자 폭 검사'
      },
      en: {
        task1: 'Stroop Task',
        task2: 'N-Back Task',
        task3: 'Go/No-Go Task',
        task4: 'Trail Making Test',
        task5: 'Digit Span Task'
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
  
  .task-instructions {
    background: #f9f9f9;
    padding: 30px;
    border-radius: 8px;
    margin: 20px 0;
  }
  
  .task-instructions h3 {
    margin-bottom: 15px;
  }
  
  #task-canvas-container {
    text-align: center;
    margin: 20px 0;
  }
  
  #task-canvas-container canvas {
    border: 2px solid #ddd;
    border-radius: 4px;
  }
`;
document.head.appendChild(style);   