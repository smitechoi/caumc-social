export class BaseTask {
    constructor(container, patientData, onComplete, onExit) {
      this.container = container;
      this.patientData = patientData;
      this.onComplete = onComplete;
      this.onExit = onExit;
      
      this.p5Instance = null;
      this.taskStartTime = null;
      this.taskData = {
        responses: [],
        events: []
      };
      
      this.tutorialShown = false;
    }
  
    start() {
      this.showTutorial();
    }
  
    showTutorial() {
      const tutorial = this.getTutorial();
      
      this.container.innerHTML = `
        <div class="tutorial-container">
          <h3>${tutorial.title}</h3>
          ${tutorial.content}
          <div class="tutorial-buttons">
            <button onclick="window.currentTask.startActualTask()" class="tutorial-start-btn">
              ${this.getTranslation('startButton', '시작하기')}
            </button>
            <button onclick="window.currentTask.exitTask()" class="tutorial-exit-btn">
              ${this.getTranslation('exitTest', '나가기')}
            </button>
          </div>
        </div>
      `;
      
      window.currentTask = this;
    }
  
    startActualTask() {
      this.taskStartTime = Date.now();
      this.container.innerHTML = '';
      
      const canvasContainer = document.createElement('div');
      canvasContainer.id = 'task-canvas';
      canvasContainer.style.cssText = `
        width: 100%;
        height: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
      `;
      this.container.appendChild(canvasContainer);
      
      this.createP5Sketch();
    }
  
    createP5Sketch() {
      const sketch = (p) => {
        let state = {};
        
        p.setup = () => {
          // 컨테이너 크기에 맞춰 캔버스 생성
          const container = document.getElementById('task-fullscreen-container');
          const width = container ? container.clientWidth : window.innerWidth;
          const height = container ? container.clientHeight : window.innerHeight;
          
          // 최대 크기 제한
          const maxWidth = Math.min(width, 1024);
          const maxHeight = Math.min(height, 768);
          
          // 캔버스 생성
          const canvas = p.createCanvas(maxWidth, maxHeight);
          canvas.parent('task-canvas');
          
          // 중앙 정렬
          const canvasElement = canvas.canvas;
          canvasElement.style.position = 'absolute';
          canvasElement.style.left = '50%';
          canvasElement.style.top = '50%';
          canvasElement.style.transform = 'translate(-50%, -50%)';
          
          p.textAlign(p.CENTER, p.CENTER);
          
          // 태스크별 초기화
          this.initializeState(state, p);
        };
        
        p.draw = () => {
          p.background(240);
          
          // 종료 버튼
          this.drawExitButton(p);
          
          // 태스크별 렌더링
          this.render(state, p);
        };
        
        p.mousePressed = () => {
          // 종료 버튼 체크
          if (p.mouseX >= p.width - 80 && p.mouseX <= p.width - 20 &&
              p.mouseY >= 20 && p.mouseY <= 50) {
            if (confirm(window.translationService?.t('exitTestConfirm') || '검사를 종료하시겠습니까?')) {
              this.exitTask();
              return;
            }
          }
          
          this.handleMousePress(state, p.mouseX, p.mouseY, p);
        };
        
        p.mouseDragged = () => {
          if (this.handleMouseDrag) {
            this.handleMouseDrag(state, p.mouseX, p.mouseY, p);
          }
        };
        
        p.mouseReleased = () => {
          if (this.handleMouseRelease) {
            this.handleMouseRelease(state, p);
          }
        };
        
        p.touchStarted = () => {
          if (p.touches.length > 0) {
            const touch = p.touches[0];
            
            // 종료 버튼 체크
            if (touch.x >= p.width - 80 && touch.x <= p.width - 20 &&
                touch.y >= 20 && touch.y <= 50) {
              if (confirm(this.getTranslation('exitTestConfirm', '검사를 종료하시겠습니까?'))) {
                this.exitTask();
                return false;
              }
            }
            
            this.handleMousePress(state, touch.x, touch.y, p);
          }
          return false;
        };
        
        p.touchMoved = () => {
          if (p.touches.length > 0 && this.handleMouseDrag) {
            const touch = p.touches[0];
            this.handleMouseDrag(state, touch.x, touch.y, p);
          }
          return false;
        };
        
        p.touchEnded = () => {
          if (this.handleMouseRelease) {
            this.handleMouseRelease(state, p);
          }
          return false;
        };
        
        p.keyPressed = () => {
          this.handleKeyPress(state, p.key, p);
        };
        
        p.windowResized = () => {
          const container = document.getElementById('task-fullscreen-container');
          const width = container ? container.clientWidth : window.innerWidth;
          const height = container ? container.clientHeight : window.innerHeight;
          
          const maxWidth = Math.min(width, 1024);
          const maxHeight = Math.min(height, 768);
          
          p.resizeCanvas(maxWidth, maxHeight);
        };
      };
      
      this.p5Instance = new p5(sketch);
    }
  
    drawExitButton(p) {
      p.push();
      p.fill(255, 0, 0);
      p.noStroke();
      p.rect(p.width - 80, 20, 60, 30, 5);
      p.fill(255);
      p.textSize(16);
      p.textAlign(p.CENTER, p.CENTER);
      p.text(this.getTranslation('exitTest', '종료'), p.width - 50, 35);
      p.pop();
    }
  
    completeTask() {
      const taskData = {
        taskName: this.getTaskName(),
        score: this.calculateScore(),
        isDone: true,
        fullLog: {
          startTime: this.taskStartTime,
          endTime: Date.now(),
          duration: Date.now() - this.taskStartTime,
          ...this.taskData
        }
      };
      
      this.cleanup();
      this.onComplete(taskData);
    }
  
    exitTask() {
      this.cleanup();
      this.onExit();
    }
  
    cleanup() {
      if (this.p5Instance) {
        this.p5Instance.remove();
        this.p5Instance = null;
      }
    }
  
    // 하위 클래스에서 구현해야 할 메서드들
    getTutorial() {
      throw new Error('getTutorial must be implemented');
    }
  
    getTaskName() {
      throw new Error('getTaskName must be implemented');
    }
  
    initializeState(state, p) {
      throw new Error('initializeState must be implemented');
    }
  
    render(state, p) {
      throw new Error('render must be implemented');
    }
  
    handleMousePress(state, x, y, p) {
      // 기본적으로 아무것도 하지 않음
    }
  
    handleKeyPress(state, key, p) {
      // 기본적으로 아무것도 하지 않음
    }
    
    handleMouseDrag(state, x, y, p) {
      // 기본적으로 아무것도 하지 않음  
    }
    
    handleMouseRelease(state, p) {
      // 기본적으로 아무것도 하지 않음
    }
  
    calculateScore() {
      throw new Error('calculateScore must be implemented');
    }
    
    getTranslation(key, fallback) {
      if (window.translationService && window.translationService.t) {
        return window.translationService.t(key);
      }
      return fallback;
    }
  }
  
  // 공통 스타일
  const style = document.createElement('style');
  style.textContent = `
  
    .tutorial-container {
      max-width: 600px;
      margin: 50px auto;
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
      font-size: 24px;
    }
    
    .tutorial-container p {
      margin: 15px 0;
      line-height: 1.6;
      font-size: 16px;
    }
    
    .tutorial-buttons {
      display: flex;
      gap: 15px;
      justify-content: center;
      margin-top: 40px;
    }
    
    .tutorial-start-btn {
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
    
    .tutorial-exit-btn {
      padding: 15px 40px;
      background: #666;
      color: white;
      border: none;
      border-radius: 4px;
      font-size: 18px;
      cursor: pointer;
      transition: all 0.3s;
    }
    
    .tutorial-exit-btn:hover {
      background: #555;
    }  
    #task-canvas {
      max-width: 1200px;
      margin: 0 auto;
      transform-origin: top center;
      transform: scale(min(1, 100vw / 1200px));
    }
  `;
  document.head.appendChild(style);