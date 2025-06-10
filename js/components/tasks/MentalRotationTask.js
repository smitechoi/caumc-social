import { BaseTask } from './BaseTask.js';

export class MentalRotationTask extends BaseTask {
  getTutorial() {
    return {
      title: '회전 도형 검사 연습',
      content: `
        <p>두 개의 3D 도형이 나타납니다.</p>
        <p>오른쪽 도형이 왼쪽 도형을 <strong>회전</strong>시킨 것과 같은지 판단하세요.</p>
        <div style="text-align: center; margin: 30px 0;">
          <div style="display: inline-block; margin: 20px; vertical-align: middle;">
            <div style="width: 120px; height: 120px; background: #e3f2fd; border: 3px solid #2196F3; display: flex; align-items: center; justify-content: center; font-size: 60px; font-weight: bold;">F</div>
            <p>원본</p>
          </div>
          <span style="font-size: 40px; vertical-align: middle; margin: 0 20px;">→</span>
          <div style="display: inline-block; margin: 20px; vertical-align: middle;">
            <div style="width: 120px; height: 120px; background: #e3f2fd; border: 3px solid #2196F3; display: flex; align-items: center; justify-content: center; font-size: 60px; font-weight: bold; transform: rotate(90deg);">F</div>
            <p>회전됨 (같음)</p>
          </div>
        </div>
        <p style="color: red; font-weight: bold;">주의: 뒤집어진 것(거울상)은 "다름"입니다.</p>
        <p>하단의 버튼을 터치하여 응답하세요.</p>
      `
    };
  }

  getTaskName() {
    return 'Mental Rotation Task';
  }

  initializeState(state, p) {
    // 더 복잡한 도형 사용
    state.shapes = [
      { char: 'F', complexity: 1 },
      { char: 'L', complexity: 1 },
      { char: 'P', complexity: 2 },
      { char: 'R', complexity: 2 },
      { char: 'G', complexity: 3 },
      { char: 'S', complexity: 3 },
      { char: 'Z', complexity: 3 }
    ];
    
    state.currentTrial = 0;
    state.maxTrials = 24;
    state.showStimulus = true;
    state.stimulusOnset = p.millis();
    state.responded = false;
    
    // 난이도 점진적 증가
    state.trialDifficulty = Math.floor(state.currentTrial / 8) + 1;
    
    this.generateTrial(state);
  }

  generateTrial(state) {
    // 난이도에 따른 도형 선택
    const availableShapes = state.shapes.filter(s => s.complexity <= state.trialDifficulty);
    const shapeData = availableShapes[Math.floor(Math.random() * availableShapes.length)];
    
    state.baseShape = shapeData.char;
    state.isSame = Math.random() < 0.5;
    
    if (state.isSame) {
      // 같은 도형, 회전만
      state.comparisonShape = state.baseShape;
      state.rotation = [0, 90, 180, 270][Math.floor(Math.random() * 4)];
      state.isMirrored = false;
    } else {
      if (Math.random() < 0.5) {
        // 다른 도형
        let otherShape;
        do {
          otherShape = availableShapes[Math.floor(Math.random() * availableShapes.length)];
        } while (otherShape.char === state.baseShape);
        
        state.comparisonShape = otherShape.char;
        state.rotation = [0, 90, 180, 270][Math.floor(Math.random() * 4)];
        state.isMirrored = false;
      } else {
        // 같은 도형의 거울상
        state.comparisonShape = state.baseShape;
        state.rotation = [0, 90, 180, 270][Math.floor(Math.random() * 4)];
        state.isMirrored = true;
      }
    }
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
      
      // 도형 크기
      const shapeSize = Math.min(p.width * 0.25, p.height * 0.3);
      const spacing = p.width * 0.15;
      
      // 원본 도형 (왼쪽)
      p.push();
      p.translate(p.width/2 - spacing, p.height * 0.35);
      this.drawShape(state.baseShape, shapeSize, 0, false, p);
      p.pop();
      
      // 라벨
      p.push();
      p.textAlign(p.CENTER);
      p.textSize(20);
      p.fill(100);
      p.text('원본', p.width/2 - spacing, p.height * 0.55);
      p.pop();
      
      // 화살표
      p.push();
      p.stroke(150);
      p.strokeWeight(3);
      p.fill(150);
      const arrowY = p.height * 0.35;
      p.line(p.width/2 - spacing/2, arrowY, p.width/2 + spacing/2 - 30, arrowY);
      p.triangle(
        p.width/2 + spacing/2 - 30, arrowY,
        p.width/2 + spacing/2 - 40, arrowY - 10,
        p.width/2 + spacing/2 - 40, arrowY + 10
      );
      p.pop();
      
      // 비교 도형 (오른쪽)
      p.push();
      p.translate(p.width/2 + spacing, p.height * 0.35);
      this.drawShape(state.comparisonShape, shapeSize, state.rotation, state.isMirrored, p);
      p.pop();
      
      // 라벨
      p.push();
      p.textAlign(p.CENTER);
      p.textSize(20);
      p.fill(100);
      p.text('비교', p.width/2 + spacing, p.height * 0.55);
      p.pop();
      
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
        p.text('응답 완료', p.width/2, p.height * 0.65);
        p.pop();
      }
    }
  }

  drawShape(shape, size, rotation, mirrored, p) {
    p.push();
    p.rotate(p.radians(rotation));
    if (mirrored) {
      p.scale(-1, 1);
    }
    
    // 3D 효과를 위한 그림자
    p.push();
    p.fill(0, 0, 0, 30);
    p.noStroke();
    p.textSize(size);
    p.textAlign(p.CENTER, p.CENTER);
    p.textStyle(p.BOLD);
    p.text(shape, 5, 5);
    p.pop();
    
    // 메인 도형
    p.fill(50);
    p.noStroke();
    p.textSize(size);
    p.textAlign(p.CENTER, p.CENTER);
    p.textStyle(p.BOLD);
    p.text(shape, 0, 0);
    
    // 3D 효과를 위한 하이라이트
    p.push();
    p.fill(255, 255, 255, 100);
    p.text(shape, -2, -2);
    p.pop();
    
    p.pop();
  }

  renderButtons(state, p) {
    const buttonWidth = 200;
    const buttonHeight = 100;
    const buttonY = p.height * 0.72;
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
    if (!state.buttons || state.responded) return;
    
    for (let button of state.buttons) {
      if (x >= button.x && x <= button.x + button.width &&
          y >= button.y && y <= button.y + button.height) {
        
        const rt = p.millis() - state.stimulusOnset;
        
        this.taskData.responses.push({
          trial: state.currentTrial,
          baseShape: state.baseShape,
          comparisonShape: state.comparisonShape,
          rotation: state.rotation,
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
          this.generateTrial(state);
        }, 1000);
        
        break;
      }
    }
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
      const weight = response.difficulty;
      if (response.correct) {
        // 회전 각도에 따른 추가 점수
        const rotationBonus = response.rotation / 360 * 0.2;
        weightedScore += weight * (1 + rotationBonus);
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
  
  // 추가 메서드 예시 - 확장성 시연
  getDetailedAnalysis() {
    const responses = this.taskData.responses;
    
    return {
      rotationErrors: responses.filter(r => !r.correct && !r.isMirrored).length,
      mirrorErrors: responses.filter(r => !r.correct && r.isMirrored).length,
      avgRTByRotation: this.calculateRTByRotation(responses),
      accuracyByDifficulty: this.calculateAccuracyByDifficulty(responses)
    };
  }
  
  calculateRTByRotation(responses) {
    const rtByRotation = {};
    
    [0, 90, 180, 270].forEach(angle => {
      const angleResponses = responses.filter(r => r.rotation === angle && r.correct);
      if (angleResponses.length > 0) {
        rtByRotation[angle] = angleResponses.reduce((sum, r) => sum + r.rt, 0) / angleResponses.length;
      }
    });
    
    return rtByRotation;
  }
  
  calculateAccuracyByDifficulty(responses) {
    const accuracyByDifficulty = {};
    
    [1, 2, 3].forEach(difficulty => {
      const diffResponses = responses.filter(r => r.difficulty === difficulty);
      if (diffResponses.length > 0) {
        const correct = diffResponses.filter(r => r.correct).length;
        accuracyByDifficulty[difficulty] = (correct / diffResponses.length) * 100;
      }
    });
    
    return accuracyByDifficulty;
  }
}