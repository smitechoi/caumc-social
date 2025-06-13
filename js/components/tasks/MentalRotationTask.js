import { BaseTask } from './BaseTask.js';

export class MentalRotationTask extends BaseTask {
  getTutorial() {
    return {
      title: '3D 블록 회전 검사 연습',
      content: `
        <p>두 개의 3D 블록 구조가 나타납니다.</p>
        <p>오른쪽 블록이 왼쪽 블록을 <strong>회전</strong>시킨 것과 같은지 판단하세요.</p>
        <div style="text-align: center; margin: 30px 0;">
          <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 200'%3E%3Crect x='50' y='50' width='40' height='40' fill='%234CAF50' stroke='%23333'/%3E%3Crect x='90' y='50' width='40' height='40' fill='%234CAF50' stroke='%23333'/%3E%3Crect x='90' y='90' width='40' height='40' fill='%234CAF50' stroke='%23333'/%3E%3Ctext x='90' y='150' text-anchor='middle' font-size='14'%3E원본%3C/text%3E%3Ctext x='200' y='100' font-size='30'%3E→%3C/text%3E%3Crect x='250' y='50' width='40' height='40' fill='%234CAF50' stroke='%23333' transform='rotate(90 290 90)'/%3E%3Crect x='250' y='90' width='40' height='40' fill='%234CAF50' stroke='%23333' transform='rotate(90 290 90)'/%3E%3Crect x='210' y='90' width='40' height='40' fill='%234CAF50' stroke='%23333' transform='rotate(90 290 90)'/%3E%3Ctext x='290' y='150' text-anchor='middle' font-size='14'%3E회전됨 (같음)%3C/text%3E%3C/svg%3E" style="max-width: 400px; margin: 20px auto; display: block;">
        </div>
        <p style="color: red; font-weight: bold;">주의: 뒤집어진 것(거울상)은 "다름"입니다.</p>
        <p>마우스로 드래그하여 블록을 회전시켜 볼 수 있습니다.</p>
        <p>하단의 버튼을 터치하여 응답하세요.</p>
      `
    };
  }

  getTaskName() {
    return '3D Mental Rotation Task';
  }

  initializeState(state, p) {
    // 블록 패턴 정의 (각 블록의 상대 위치)
    state.blockPatterns = [
      // 난이도 1: 3-4개 블록
      [
        [{x: 0, y: 0, z: 0}, {x: 1, y: 0, z: 0}, {x: 0, y: 1, z: 0}], // L자
        [{x: 0, y: 0, z: 0}, {x: 1, y: 0, z: 0}, {x: 2, y: 0, z: 0}], // 일자
        [{x: 0, y: 0, z: 0}, {x: 1, y: 0, z: 0}, {x: 1, y: 1, z: 0}, {x: 1, y: 2, z: 0}], // T자
      ],
      // 난이도 2: 4-5개 블록
      [
        [{x: 0, y: 0, z: 0}, {x: 1, y: 0, z: 0}, {x: 0, y: 1, z: 0}, {x: 0, y: 0, z: 1}], // 3D L자
        [{x: 0, y: 0, z: 0}, {x: 1, y: 0, z: 0}, {x: 1, y: 1, z: 0}, {x: 2, y: 1, z: 0}], // 계단
        [{x: 0, y: 0, z: 0}, {x: 1, y: 0, z: 0}, {x: 0, y: 1, z: 0}, {x: 1, y: 1, z: 0}, {x: 0, y: 0, z: 1}], // 큐브+1
      ],
      // 난이도 3: 5-6개 블록 (복잡한 3D 구조)
      [
        [{x: 0, y: 0, z: 0}, {x: 1, y: 0, z: 0}, {x: 0, y: 1, z: 0}, {x: 0, y: 0, z: 1}, {x: 1, y: 0, z: 1}],
        [{x: 0, y: 0, z: 0}, {x: 1, y: 0, z: 0}, {x: 2, y: 0, z: 0}, {x: 1, y: 1, z: 0}, {x: 1, y: 0, z: 1}],
        [{x: 0, y: 0, z: 0}, {x: 1, y: 0, z: 0}, {x: 0, y: 1, z: 0}, {x: 1, y: 1, z: 0}, {x: 0, y: 0, z: 1}, {x: 0, y: 1, z: 1}],
      ]
    ];
    
    state.currentTrial = 0;
    state.maxTrials = 24;
    state.showStimulus = true;
    state.stimulusOnset = p.millis();
    state.responded = false;
    
    // 3D 회전 관련
    state.leftRotation = { x: -0.5, y: 0.5, z: 0 };
    state.rightRotation = { x: -0.5, y: 0.5, z: 0 };
    state.autoRotate = true;
    state.blockSize = 30;
    
    // 마우스 드래그 관련
    state.isDragging = false;
    state.dragTarget = null; // 'left' or 'right'
    state.lastMouseX = 0;
    state.lastMouseY = 0;
    
    // 난이도 점진적 증가
    state.trialDifficulty = Math.floor(state.currentTrial / 8) + 1;
    
    this.generateTrial(state);
  }

  generateTrial(state) {
    // 난이도에 따른 패턴 선택
    const difficultyIndex = Math.min(state.trialDifficulty - 1, 2);
    const patterns = state.blockPatterns[difficultyIndex];
    const pattern = patterns[Math.floor(Math.random() * patterns.length)];
    
    state.basePattern = pattern;
    state.isSame = Math.random() < 0.5;
    
    if (state.isSame) {
      // 같은 패턴, 회전만
      state.comparisonPattern = [...pattern];
      // 랜덤 회전 각도
      state.targetRotation = {
        x: Math.floor(Math.random() * 4) * Math.PI / 2,
        y: Math.floor(Math.random() * 4) * Math.PI / 2,
        z: Math.floor(Math.random() * 4) * Math.PI / 2
      };
      state.isMirrored = false;
    } else {
      if (Math.random() < 0.5) {
        // 다른 패턴
        let otherPattern;
        do {
          otherPattern = patterns[Math.floor(Math.random() * patterns.length)];
        } while (otherPattern === pattern);
        
        state.comparisonPattern = otherPattern;
        state.targetRotation = {
          x: Math.floor(Math.random() * 4) * Math.PI / 2,
          y: Math.floor(Math.random() * 4) * Math.PI / 2,
          z: Math.floor(Math.random() * 4) * Math.PI / 2
        };
        state.isMirrored = false;
      } else {
        // 같은 패턴의 거울상
        state.comparisonPattern = pattern.map(block => ({
          x: -block.x,
          y: block.y,
          z: block.z
        }));
        state.targetRotation = {
          x: Math.floor(Math.random() * 4) * Math.PI / 2,
          y: Math.floor(Math.random() * 4) * Math.PI / 2,
          z: Math.floor(Math.random() * 4) * Math.PI / 2
        };
        state.isMirrored = true;
      }
    }
    
    // 초기 회전 설정
    state.rightRotation = { ...state.targetRotation };
  }

  render(state, p) {
    if (state.currentTrial >= state.maxTrials) {
      this.completeTask();
      return;
    }
    
    if (state.showStimulus) {
      // 배경
      p.push();
      p.fill(245);
      p.noStroke();
      p.rect(0, 0, p.width, p.height);
      p.pop();
      
      // 3D 렌더링 영역 크기
      const viewWidth = p.width * 0.35;
      const viewHeight = p.height * 0.4;
      const spacing = p.width * 0.1;
      
      // 왼쪽 블록 (원본)
      p.push();
      p.translate(p.width/2 - viewWidth/2 - spacing/2, p.height * 0.35);
      this.draw3DBlocks(state.basePattern, state.leftRotation, state.blockSize, viewWidth, viewHeight, p);
      p.pop();
      
      // 라벨
      p.push();
      p.textAlign(p.CENTER);
      p.textSize(20);
      p.fill(100);
      p.text('원본', p.width/2 - viewWidth/2 - spacing/2, p.height * 0.6);
      p.pop();
      
      // 화살표
      p.push();
      p.stroke(150);
      p.strokeWeight(3);
      p.fill(150);
      const arrowY = p.height * 0.35;
      p.line(p.width/2 - spacing/4, arrowY, p.width/2 + spacing/4 - 10, arrowY);
      p.triangle(
        p.width/2 + spacing/4 - 10, arrowY,
        p.width/2 + spacing/4 - 20, arrowY - 10,
        p.width/2 + spacing/4 - 20, arrowY + 10
      );
      p.pop();
      
      // 오른쪽 블록 (비교)
      p.push();
      p.translate(p.width/2 + viewWidth/2 + spacing/2, p.height * 0.35);
      this.draw3DBlocks(state.comparisonPattern, state.rightRotation, state.blockSize, viewWidth, viewHeight, p);
      p.pop();
      
      // 라벨
      p.push();
      p.textAlign(p.CENTER);
      p.textSize(20);
      p.fill(100);
      p.text('비교', p.width/2 + viewWidth/2 + spacing/2, p.height * 0.6);
      p.pop();
      
      // 자동 회전
      if (state.autoRotate && !state.isDragging) {
        state.leftRotation.y += 0.01;
        state.rightRotation.y += 0.01;
      }
      
      // 진행 상황
      p.push();
      p.textSize(20);
      p.fill(100);
      p.textAlign(p.CENTER);
      p.text(`${state.currentTrial + 1} / ${state.maxTrials}`, p.width/2, 50);
      p.pop();
      
      // 응답 버튼
      this.renderButtons(state, p);
      
      // 응답 피드백
      if (state.responded) {
        p.push();
        p.textSize(36);
        p.fill(100);
        p.textAlign(p.CENTER);
        p.text('응답 완료', p.width/2, p.height * 0.68);
        p.pop();
      }
    }
  }

  draw3DBlocks(pattern, rotation, blockSize, viewWidth, viewHeight, p) {
    // 3D 그래픽 컨텍스트 생성
    const pg = p.createGraphics(viewWidth, viewHeight, p.WEBGL);
    
    pg.background(250);
    pg.lights();
    pg.ambientLight(100);
    pg.directionalLight(255, 255, 255, 0.5, 0.5, -1);
    
    // 카메라 설정
    pg.camera(0, -100, 200, 0, 0, 0, 0, 1, 0);
    
    // 회전 적용
    pg.rotateX(rotation.x);
    pg.rotateY(rotation.y);
    pg.rotateZ(rotation.z);
    
    // 블록 그리기
    pg.push();
    pg.noStroke();
    
    // 패턴의 중심 계산
    let centerX = 0, centerY = 0, centerZ = 0;
    pattern.forEach(block => {
      centerX += block.x;
      centerY += block.y;
      centerZ += block.z;
    });
    centerX /= pattern.length;
    centerY /= pattern.length;
    centerZ /= pattern.length;
    
    // 블록 그리기
    pattern.forEach((block, index) => {
      pg.push();
      
      // 중심 기준으로 위치 조정
      const x = (block.x - centerX) * blockSize;
      const y = (block.y - centerY) * blockSize;
      const z = (block.z - centerZ) * blockSize;
      
      pg.translate(x, y, z);
      
      // 블록 색상 (위치에 따라 약간 다르게)
      const hue = 200 + index * 10;
      pg.fill(hue, 200, 255);
      pg.box(blockSize * 0.9);
      
      // 블록 테두리 효과
      pg.push();
      pg.stroke(0);
      pg.strokeWeight(1);
      pg.noFill();
      pg.box(blockSize * 0.91);
      pg.pop();
      
      pg.pop();
    });
    
    pg.pop();
    
    // 메인 캔버스에 그리기
    p.image(pg, -viewWidth/2, -viewHeight/2);
    pg.remove();
  }

  renderButtons(state, p) {
    const buttonWidth = 200;
    const buttonHeight = 100;
    const buttonY = p.height * 0.75;
    const spacing = 80;
    
    state.buttons = [];
    
    // "같음" 버튼
    const sameX = p.width/2 - buttonWidth - spacing/2;
    state.buttons.push({
      x: sameX,
      y: buttonY,
      width: buttonWidth,
      height: buttonHeight,
      response: true
    });
    
    p.push();
    p.fill(76, 175, 80);
    p.noStroke();
    p.rect(sameX, buttonY, buttonWidth, buttonHeight, 10);
    p.fill(255);
    p.textSize(32);
    p.textAlign(p.CENTER, p.CENTER);
    p.textStyle(p.BOLD);
    p.text('같음', sameX + buttonWidth/2, buttonY + buttonHeight/2);
    p.pop();
    
    // "다름" 버튼
    const diffX = p.width/2 + spacing/2;
    state.buttons.push({
      x: diffX,
      y: buttonY,
      width: buttonWidth,
      height: buttonHeight,
      response: false
    });
    
    p.push();
    p.fill(244, 67, 54);
    p.noStroke();
    p.rect(diffX, buttonY, buttonWidth, buttonHeight, 10);
    p.fill(255);
    p.textSize(32);
    p.textAlign(p.CENTER, p.CENTER);
    p.textStyle(p.BOLD);
    p.text('다름', diffX + buttonWidth/2, buttonY + buttonHeight/2);
    p.pop();
  }

  handleMousePress(state, x, y, p) {
    // 버튼 클릭 확인
    if (!state.buttons || state.responded) return;
    
    for (let button of state.buttons) {
      if (x >= button.x && x <= button.x + button.width &&
          y >= button.y && y <= button.y + button.height) {
        
        const rt = p.millis() - state.stimulusOnset;
        
        this.taskData.responses.push({
          trial: state.currentTrial,
          patternComplexity: state.basePattern.length,
          rotation: state.targetRotation,
          isMirrored: state.isMirrored,
          isSame: state.isSame,
          response: button.response,
          correct: button.response === state.isSame,
          rt: rt,
          difficulty: state.trialDifficulty
        });
        
        state.responded = true;
        
        // 다음 시행 준비
        setTimeout(() => {
          state.currentTrial++;
          state.trialDifficulty = Math.floor(state.currentTrial / 8) + 1;
          state.stimulusOnset = p.millis();
          state.responded = false;
          state.leftRotation = { x: -0.5, y: 0.5, z: 0 };
          this.generateTrial(state);
        }, 1000);
        
        break;
      }
    }
    
    // 마우스 드래그 시작 (블록 회전용)
    const viewWidth = p.width * 0.35;
    const spacing = p.width * 0.1;
    const leftCenterX = p.width/2 - viewWidth/2 - spacing/2;
    const rightCenterX = p.width/2 + viewWidth/2 + spacing/2;
    const blockY = p.height * 0.35;
    
    if (Math.abs(x - leftCenterX) < viewWidth/2 && Math.abs(y - blockY) < p.height * 0.2) {
      state.isDragging = true;
      state.dragTarget = 'left';
      state.autoRotate = false;
    } else if (Math.abs(x - rightCenterX) < viewWidth/2 && Math.abs(y - blockY) < p.height * 0.2) {
      state.isDragging = true;
      state.dragTarget = 'right';
      state.autoRotate = false;
    }
    
    state.lastMouseX = x;
    state.lastMouseY = y;
  }

  handleMouseDrag(state, x, y, p) {
    if (!state.isDragging) return;
    
    const deltaX = x - state.lastMouseX;
    const deltaY = y - state.lastMouseY;
    
    const rotationSpeed = 0.01;
    
    if (state.dragTarget === 'left') {
      state.leftRotation.y += deltaX * rotationSpeed;
      state.leftRotation.x += deltaY * rotationSpeed;
    } else if (state.dragTarget === 'right') {
      state.rightRotation.y += deltaX * rotationSpeed;
      state.rightRotation.x += deltaY * rotationSpeed;
    }
    
    state.lastMouseX = x;
    state.lastMouseY = y;
  }

  handleMouseRelease(state, p) {
    state.isDragging = false;
    state.dragTarget = null;
    // 드래그 후 3초 뒤에 자동 회전 재개
    setTimeout(() => {
      if (!state.isDragging) {
        state.autoRotate = true;
      }
    }, 3000);
  }

  calculateScore() {
    const responses = this.taskData.responses;
    if (responses.length === 0) return 0;
    
    // 정확도
    const correct = responses.filter(r => r.correct).length;
    const accuracy = (correct / responses.length) * 100;
    
    // 난이도별 가중치
    let weightedScore = 0;
    let totalWeight = 0;
    
    for (let response of responses) {
      const weight = response.difficulty * response.patternComplexity / 3;
      if (response.correct) {
        // 회전 복잡도에 따른 추가 점수
        const rotationComplexity = 
          (response.rotation.x !== 0 ? 1 : 0) +
          (response.rotation.y !== 0 ? 1 : 0) +
          (response.rotation.z !== 0 ? 1 : 0);
        const complexityBonus = rotationComplexity * 0.1;
        weightedScore += weight * (1 + complexityBonus);
      }
      totalWeight += weight;
    }
    
    const difficultyScore = (weightedScore / totalWeight) * 100;
    
    // 반응시간 보너스
    const correctResponses = responses.filter(r => r.correct);
    const avgRT = correctResponses.length > 0
      ? correctResponses.reduce((sum, r) => sum + r.rt, 0) / correctResponses.length
      : 0;
    
    const speedBonus = Math.max(0, 10 - (avgRT / 1000));
    
    // 최종 점수
    return Math.round(Math.min(100, 
      accuracy * 0.5 + 
      difficultyScore * 0.4 + 
      speedBonus
    ));
  }
}

// BaseTask 확장 - 마우스 드래그 지원
MentalRotationTask.prototype.handleMouseDrag = function(state, x, y, p) {
  if (state.isDragging) {
    const dx = x - state.lastMouseX;
    const dy = y - state.lastMouseY;
    
    state.rotation.x += dy * 0.01;
    state.rotation.y += dx * 0.01;
    
    state.lastMouseX = x;
    state.lastMouseY = y;
  }
};

MentalRotationTask.prototype.handleMouseRelease = function(state, p) {
  state.isDragging = false;
};

// p5 스케치에 마우스 이벤트 추가
BaseTask.prototype.createP5Sketch = function() {
  const originalCreate = BaseTask.prototype.createP5Sketch;
  
  const sketch = (p) => {
    let state = {};
    
    p.setup = () => {
      const canvas = p.createCanvas(window.innerWidth, window.innerHeight);
      canvas.parent('task-canvas');
      p.textAlign(p.CENTER, p.CENTER);
      
      this.initializeState(state, p);
    };
    
    p.draw = () => {
      p.background(240);
      this.drawExitButton(p);
      this.render(state, p);
    };
    
    p.mousePressed = () => {
      if (p.mouseX >= p.width - 80 && p.mouseX <= p.width - 20 &&
          p.mouseY >= 20 && p.mouseY <= 50) {
        if (confirm('검사를 종료하시겠습니까?')) {
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
        
        if (touch.x >= p.width - 80 && touch.x <= p.width - 20 &&
            touch.y >= 20 && touch.y <= 50) {
          if (confirm('검사를 종료하시겠습니까?')) {
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
      p.resizeCanvas(window.innerWidth, window.innerHeight);
    };
  };
  
  this.p5Instance = new p5(sketch);
};