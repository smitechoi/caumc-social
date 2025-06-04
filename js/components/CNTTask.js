import { updateCNTTask, getPatient } from '../firebase/crud.js';

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
      // 전체 진행 모드 (기존 방식)
      this.findNextIncompleteTask();
    }
    
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
    // 튜토리얼 표시
    this.showTutorial(taskType);
  }

  showTutorial(taskType) {
    const tutorials = {
      stroop: {
        title: '스트룹 검사 연습',
        content: `
          <p>화면에 색깔 단어가 나타납니다.</p>
          <p>단어의 <strong>의미</strong>가 아닌 <strong>색깔</strong>을 선택하세요.</p>
          <div style="font-size: 48px; color: red; margin: 20px;">파랑</div>
          <p>위 예시에서는 '빨강'을 터치해야 합니다.</p>
          <p>화면 하단의 색깔 버튼을 터치하세요.</p>
        `
      },
      nback: {
        title: '2-Back 검사 연습',
        content: `
          <p>화면에 숫자가 하나씩 나타납니다.</p>
          <p>현재 숫자가 <strong>2개 전</strong> 숫자와 같은지 판단하세요.</p>
          <div style="font-size: 24px; margin: 20px;">
            3 → 5 → <span style="color: red;">3</span> (같음)<br>
            7 → 2 → <span style="color: blue;">9</span> (다름)
          </div>
          <p>화면 하단의 <strong>같음/다름</strong> 버튼을 터치하세요.</p>
        `
      },
      gonogo: {
        title: 'Go/No-Go 검사 연습',
        content: `
          <p>화면에 숫자가 빠르게 나타납니다.</p>
          <p><strong>짝수</strong>가 나타나면 → 화면을 터치 (Go)</p>
          <p><strong>홀수</strong>가 나타나면 → 터치하지 마세요 (No-Go)</p>
          <div style="font-size: 36px; margin: 20px;">
            <span style="color: green;">4</span> → 터치 ✓<br>
            <span style="color: red;">7</span> → 터치 안함 ✗
          </div>
          <p>빠르고 정확하게 반응하세요!</p>
        `
      },
      trail: {
        title: '선로 잇기 검사 연습',
        content: `
          <p>화면에 숫자가 흩어져 나타납니다.</p>
          <p>1부터 순서대로 터치하여 연결하세요.</p>
          <div style="text-align: center; margin: 20px;">
            <span style="display: inline-block; margin: 10px; padding: 15px; border: 2px solid #333; border-radius: 50%; width: 40px;">1</span>
            <span style="margin: 0 20px;">→</span>
            <span style="display: inline-block; margin: 10px; padding: 15px; border: 2px solid #333; border-radius: 50%; width: 40px;">2</span>
            <span style="margin: 0 20px;">→</span>
            <span style="display: inline-block; margin: 10px; padding: 15px; border: 2px solid #333; border-radius: 50%; width: 40px;">3</span>
          </div>
          <p>가능한 빠르게 순서대로 연결하세요.</p>
          <p>잘못 터치하면 다시 시작해야 합니다.</p>
        `
      }
    };

    const tutorial = tutorials[taskType] || tutorials.stroop;
    
    document.getElementById('task-canvas-container').style.display = 'block';
    document.getElementById('task-canvas-container').innerHTML = `
      <div class="tutorial-container">
        <h3>${tutorial.title}</h3>
        ${tutorial.content}
        <button onclick="window.cntInstance.startActualTask('${taskType}')" class="tutorial-start-btn">
          연습 시작하기
        </button>
      </div>
    `;
  }

  startActualTask(taskType) {
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
        if (taskType === 'stroop') {
          this.renderStroop(taskState, p);
        } else if (taskType === 'nback') {
          this.renderNback(taskState, p);
        } else if (taskType === 'gonogo') {
          this.renderGonogo(taskState, p);
        } else if (taskType === 'trail') {
          this.renderTrail(taskState, p);
        } else {
          this[`render${taskType.charAt(0).toUpperCase() + taskType.slice(1)}`](taskState, p);
        }
      };
      
      p.keyPressed = () => {
        this.handleKeyPress(taskType, taskState, p.key, p);
      };
      
      p.mousePressed = () => {
        this.handleMousePress(taskType, taskState, p.mouseX, p.mouseY, p);
      };
      
      // 터치 이벤트 추가 (태블릿 지원)
      p.touchStarted = () => {
        if (p.touches.length > 0) {
          this.handleMousePress(taskType, taskState, p.touches[0].x, p.touches[0].y, p);
        }
        return false; // 기본 동작 방지
      };
    };
    
    this.p5Instance = new p5(sketch);
  }

  // 태스크별 초기화
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
    else if (taskType === 'nback') {
      state.sequence = [];
      state.currentIndex = 0;
      state.maxTrials = 30;
      state.showStimulus = true;
      state.stimulusOnset = p.millis();
      state.stimulusDuration = 2000; // 2초 표시
      state.interStimulusInterval = 500; // 0.5초 간격
      state.responses = [];
      state.nLevel = 2; // 2-back
      
      // 초기 시퀀스 생성 (1-9 숫자)
      for (let i = 0; i < state.maxTrials; i++) {
        state.sequence.push(Math.floor(Math.random() * 9) + 1);
      }
    }
    else if (taskType === 'gonogo') {
      state.currentTrial = 0;
      state.maxTrials = 60;
      state.showStimulus = false;
      state.nextStimulusTime = p.millis() + 1000;
      state.stimulusDuration = 800; // 0.8초 표시
      state.interTrialInterval = 1200; // 1.2초 간격
      state.currentNumber = 0;
      state.isGoTrial = false;
      state.responded = false;
      state.responses = [];
    }
    else if (taskType === 'trail') {
      state.nodes = [];
      state.nodeCount = 15; // 1-15까지
      state.currentNode = 1;
      state.connections = [];
      state.startTime = p.millis();
      state.errors = 0;
      state.completed = false;
      
      // 노드 위치 랜덤 생성 (겹치지 않도록)
      const margin = 60;
      const nodeSize = 50;
      
      for (let i = 1; i <= state.nodeCount; i++) {
        let x, y, overlapping;
        do {
          overlapping = false;
          x = p.random(margin, p.width - margin);
          y = p.random(margin, p.height - margin);
          
          // 기존 노드와 겹치는지 확인
          for (let node of state.nodes) {
            let d = p.dist(x, y, node.x, node.y);
            if (d < nodeSize + 20) {
              overlapping = true;
              break;
            }
          }
        } while (overlapping);
        
        state.nodes.push({ 
          number: i, 
          x: x, 
          y: y, 
          size: nodeSize,
          connected: false 
        });
      }
    }
  }

  // Trail Making 렌더링
  renderTrail(state, p) {
    if (state.completed) {
      this.completeTask();
      return;
    }
    
    // 연결선 그리기
    p.push();
    p.stroke(100, 200, 100);
    p.strokeWeight(3);
    p.noFill();
    p.beginShape();
    for (let conn of state.connections) {
      p.vertex(conn.x, conn.y);
    }
    p.endShape();
    p.pop();
    
    // 노드 그리기
    for (let node of state.nodes) {
      p.push();
      
      // 연결된 노드는 다른 색상
      if (node.connected) {
        p.fill(100, 200, 100);
      } else if (node.number === state.currentNode) {
        // 다음 연결할 노드 강조
        p.fill(255, 200, 0);
        p.strokeWeight(4);
        p.stroke(255, 150, 0);
      } else {
        p.fill(255);
        p.stroke(0);
        p.strokeWeight(2);
      }
      
      p.circle(node.x, node.y, node.size);
      
      // 숫자
      p.fill(node.connected ? 255 : 0);
      p.noStroke();
      p.textSize(24);
      p.textAlign(p.CENTER, p.CENTER);
      p.text(node.number, node.x, node.y);
      p.pop();
    }
    
    // 정보 표시
    p.push();
    p.fill(0);
    p.textSize(20);
    p.textAlign(p.LEFT);
    p.text(`다음 숫자: ${state.currentNode}`, 20, 30);
    p.text(`오류: ${state.errors}`, 20, 60);
    
    const elapsedTime = Math.floor((p.millis() - state.startTime) / 1000);
    p.text(`시간: ${elapsedTime}초`, 20, 90);
    p.pop();
    
    // 완료 확인
    if (state.currentNode > state.nodeCount) {
      state.completed = true;
      state.completionTime = p.millis() - state.startTime;
    }
  }

  // N-Back 렌더링 (터치 버튼 추가)
  renderNback(state, p) {
    if (state.currentIndex >= state.maxTrials) {
      this.completeTask();
      return;
    }
    
    const currentTime = p.millis();
    const timeSinceOnset = currentTime - state.stimulusOnset;
    
    // 자극 표시
    if (timeSinceOnset < state.stimulusDuration) {
      p.push();
      p.textSize(96);
      p.fill(0);
      p.text(state.sequence[state.currentIndex], p.width/2, p.height/3);
      p.pop();
      
      // 시행 정보
      p.textSize(20);
      p.fill(100);
      p.text(`시행: ${state.currentIndex + 1}/${state.maxTrials}`, p.width/2, 50);
      
      // 터치 버튼 (3개 이상의 시행 후에만 표시)
      if (state.currentIndex >= state.nLevel) {
        const buttonWidth = 150;
        const buttonHeight = 80;
        const buttonY = p.height * 0.7;
        const spacing = 40;
        
        // "같음" 버튼
        p.push();
        p.fill(76, 175, 80);
        p.rect(p.width/2 - buttonWidth - spacing/2, buttonY, buttonWidth, buttonHeight, 10);
        p.fill(255);
        p.textSize(24);
        p.textAlign(p.CENTER, p.CENTER);
        p.text('같음', p.width/2 - buttonWidth/2 - spacing/2, buttonY + buttonHeight/2);
        p.pop();
        
        // "다름" 버튼
        p.push();
        p.fill(244, 67, 54);
        p.rect(p.width/2 + spacing/2, buttonY, buttonWidth, buttonHeight, 10);
        p.fill(255);
        p.textSize(24);
        p.textAlign(p.CENTER, p.CENTER);
        p.text('다름', p.width/2 + buttonWidth/2 + spacing/2, buttonY + buttonHeight/2);
        p.pop();
      }
    } 
    // 자극 간 간격
    else if (timeSinceOnset >= state.stimulusDuration + state.interStimulusInterval) {
      // 다음 자극으로
      if (!state.responded && state.currentIndex >= state.nLevel) {
        // 무응답 기록
        state.responses.push({
          trial: state.currentIndex,
          stimulus: state.sequence[state.currentIndex],
          nBackStimulus: state.sequence[state.currentIndex - state.nLevel],
          isMatch: state.sequence[state.currentIndex] === state.sequence[state.currentIndex - state.nLevel],
          response: null,
          correct: false,
          rt: null
        });
      }
      
      state.currentIndex++;
      state.stimulusOnset = currentTime;
      state.responded = false;
    }
    // 빈 화면
    else {
      // 고정점
      p.push();
      p.fill(0);
      p.textSize(36);
      p.text('+', p.width/2, p.height/2);
      p.pop();
    }
  }
  
  // Go/No-Go 렌더링 (터치 기반)
  renderGonogo(state, p) {
    if (state.currentTrial >= state.maxTrials) {
      this.completeTask();
      return;
    }
    
    const currentTime = p.millis();
    
    // 새 자극 시작
    if (!state.showStimulus && currentTime >= state.nextStimulusTime) {
      state.currentNumber = Math.floor(Math.random() * 9) + 1;
      state.isGoTrial = state.currentNumber % 2 === 0; // 짝수가 Go
      state.showStimulus = true;
      state.stimulusOnset = currentTime;
      state.responded = false;
    }
    
    // 자극 표시
    if (state.showStimulus) {
      const timeSinceOnset = currentTime - state.stimulusOnset;
      
      if (timeSinceOnset < state.stimulusDuration) {
        // 숫자 표시
        p.push();
        p.textSize(120);
        p.fill(state.isGoTrial ? 'green' : 'red');
        p.text(state.currentNumber, p.width/2, p.height/2);
        p.pop();
        
        // 시행 정보
        p.textSize(20);
        p.fill(100);
        p.text(`시행: ${state.currentTrial + 1}/${state.maxTrials}`, p.width/2, 50);
        
        // 터치 영역 표시 (Go 시행일 때만)
        if (state.isGoTrial && !state.responded) {
          p.push();
          p.fill(200, 255, 200, 100);
          p.rect(0, 0, p.width, p.height);
          p.textSize(24);
          p.fill(0, 150, 0);
          p.text('화면을 터치하세요!', p.width/2, p.height - 80);
          p.pop();
        } else if (!state.isGoTrial) {
          p.push();
          p.textSize(24);
          p.fill(150, 0, 0);
          p.text('터치하지 마세요!', p.width/2, p.height - 80);
          p.pop();
        }
        
        // 응답 피드백
        if (state.responded) {
          p.push();
          p.textSize(48);
          p.fill(0, 200, 0);
          p.text('✓', p.width/2, p.height * 0.8);
          p.pop();
        }
      } else {
        // 자극 종료
        state.showStimulus = false;
        state.nextStimulusTime = currentTime + state.interTrialInterval;
        
        // 응답 기록
        state.responses.push({
          trial: state.currentTrial,
          stimulus: state.currentNumber,
          isGoTrial: state.isGoTrial,
          responded: state.responded,
          correct: state.isGoTrial ? state.responded : !state.responded,
          rt: state.responded ? state.responseTime - state.stimulusOnset : null
        });
        
        state.currentTrial++;
      }
    }
    // 빈 화면
    else {
      p.push();
      p.fill(150);
      p.textSize(24);
      p.text('준비...', p.width/2, p.height/2);
      p.pop();
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
    else if (taskType === 'nback') {
      if (state.currentIndex >= state.nLevel && !state.responded) {
        const currentStim = state.sequence[state.currentIndex];
        const nBackStim = state.sequence[state.currentIndex - state.nLevel];
        const isMatch = currentStim === nBackStim;
        
        let response = null;
        if (key.toLowerCase() === 'a') {
          response = true; // "같음" 응답
        } else if (key.toLowerCase() === 'l') {
          response = false; // "다름" 응답
        }
        
        if (response !== null) {
          state.responded = true;
          state.responses.push({
            trial: state.currentIndex,
            stimulus: currentStim,
            nBackStimulus: nBackStim,
            isMatch: isMatch,
            response: response,
            correct: response === isMatch,
            rt: p.millis() - state.stimulusOnset
          });
        }
      }
    }
    else if (taskType === 'gonogo') {
      if (key === ' ' && state.showStimulus && !state.responded) {
        state.responded = true;
        state.responseTime = p.millis();
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
    
    const currentTask = this.currentTask || this.tasks[this.currentTaskIndex];
    const config = this.taskConfigs[currentTask];
    
    // 데이터 정리
    if (!this.currentTaskData.responses && this.currentTaskData.events) {
      this.currentTaskData.responses = this.currentTaskData.events;
    }
    
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
    else if (taskType === 'nback') {
      const responses = data.responses || data.events;
      const correct = responses.filter(r => r.correct).length;
      const accuracy = (correct / responses.length) * 100;
      
      // 적중률과 오경보율 계산
      const hits = responses.filter(r => r.isMatch && r.response === true).length;
      const hitRate = hits / responses.filter(r => r.isMatch).length;
      
      const falseAlarms = responses.filter(r => !r.isMatch && r.response === true).length;
      const falseAlarmRate = falseAlarms / responses.filter(r => !r.isMatch).length;
      
      // d' (민감도) 계산 간소화
      const score = Math.round(accuracy * (1 - falseAlarmRate));
      return Math.max(0, Math.min(100, score));
    }
    else if (taskType === 'gonogo') {
      const responses = data.responses || data.events;
      const goTrials = responses.filter(r => r.isGoTrial);
      const noGoTrials = responses.filter(r => !r.isGoTrial);
      
      // Go 시행 정확도 (적중률)
      const goCorrect = goTrials.filter(r => r.responded).length;
      const goAccuracy = (goCorrect / goTrials.length) * 100;
      
      // No-Go 시행 정확도 (정확 기각률)
      const noGoCorrect = noGoTrials.filter(r => !r.responded).length;
      const noGoAccuracy = (noGoCorrect / noGoTrials.length) * 100;
      
      // 종합 점수
      return Math.round((goAccuracy + noGoAccuracy) / 2);
    }
    else if (taskType === 'trail') {
      // Trail Making은 시간과 오류를 기반으로 점수 계산
      const completionTime = data.completionTime || data.duration;
      const errors = data.errors || 0;
      
      // 기준 시간 (초): 빠를수록 높은 점수
      const baseTime = 60000; // 60초
      const timeScore = Math.max(0, 100 - ((completionTime - baseTime) / 1000));
      
      // 오류 감점
      const errorPenalty = errors * 5;
      
      return Math.max(0, Math.min(100, Math.round(timeScore - errorPenalty)));
    }
    return 0;
  }

  renderComplete() {
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
  
  #task-canvas-container {
    text-align: center;
    margin: 20px 0;
  }
  
  #task-canvas-container canvas {
    border: 2px solid #ddd;
    border-radius: 4px;
  }
  
  .tutorial-container {
    max-width: 600px;
    margin: 0 auto;
    padding: 40px;
    background: white;
    border-radius: 8px;
    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
    text-align: left;
  }
  
  .tutorial-container h3 {
    text-align: center;
    color: #333;
    margin-bottom: 30px;
  }
  
  .tutorial-container p {
    margin: 15px 0;
    line-height: 1.6;
  }
  
  .tutorial-start-btn {
    display: block;
    margin: 30px auto 0;
    padding: 15px 40px;
    background: #4CAF50;
    color: white;
    border: none;
    border-radius: 4px;
    font-size: 18px;
    cursor: pointer;
    transition: all 0.3s;
  }
  
  .tutorial-start-btn:hover {
    background: #45a049;
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0,0,0,0.2);
  }
`;
document.head.appendChild(style);