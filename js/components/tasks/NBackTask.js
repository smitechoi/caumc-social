import { BaseTask } from './BaseTask.js';

export class NBackTask extends BaseTask {
  getTutorial() {
    return {
      title: '2-Back 검사 연습',
      content: `
        <p>화면에 숫자가 하나씩 나타납니다.</p>
        <p>현재 숫자가 <strong>2개 전</strong> 숫자와 같은지 판단하세요.</p>
        <div style="text-align: center; margin: 30px 0; font-size: 24px;">
          <div style="margin: 10px;">3 → 5 → <span style="color: red; font-weight: bold;">3</span> (같음)</div>
          <div style="margin: 10px;">7 → 2 → <span style="color: blue; font-weight: bold;">9</span> (다름)</div>
        </div>
        <p>화면 하단의 <strong>'같음'</strong> 또는 <strong>'다름'</strong> 버튼을 터치하세요.</p>
        <p>처음 2개는 비교할 대상이 없으므로 버튼이 나타나지 않습니다.</p>
      `
    };
  }

  getTaskName() {
    return 'N-Back Task';
  }

  initializeState(state, p) {
    state.sequence = [];
    state.currentIndex = 0;
    state.maxTrials = 30;
    state.showStimulus = true;
    state.stimulusOnset = p.millis();
    state.stimulusDuration = 2000; // 2초 표시
    state.interStimulusInterval = 500; // 0.5초 간격
    state.nLevel = 2; // 2-back
    state.responded = false;
    
    // 시퀀스 생성 (1-9 숫자, 일부는 n-back 일치하도록)
    for (let i = 0; i < state.maxTrials; i++) {
      if (i >= state.nLevel && Math.random() < 0.3) {
        // 30% 확률로 n-back 일치
        state.sequence.push(state.sequence[i - state.nLevel]);
      } else {
        state.sequence.push(Math.floor(Math.random() * 9) + 1);
      }
    }
  }

  render(state, p) {
    if (state.currentIndex >= state.maxTrials) {
      this.completeTask();
      return;
    }
    
    const currentTime = p.millis();
    const timeSinceOnset = currentTime - state.stimulusOnset;
    
    // 자극 표시 단계
    if (timeSinceOnset < state.stimulusDuration) {
      // 숫자 표시
      p.push();
      p.textSize(120);
      p.fill(0);
      p.text(state.sequence[state.currentIndex], p.width/2, p.height/3);
      p.pop();
      
      // 진행 상황
      p.push();
      p.textSize(20);
      p.fill(100);
      p.text(`${state.currentIndex + 1} / ${state.maxTrials}`, p.width/2, 50);
      p.pop();
      
      // 응답 버튼 (3번째 시행부터)
      if (state.currentIndex >= state.nLevel) {
        const buttonWidth = 180;
        const buttonHeight = 100;
        const buttonY = p.height * 0.65;
        const spacing = 60;
        
        state.buttons = [
          {
            x: p.width/2 - buttonWidth - spacing/2,
            y: buttonY,
            width: buttonWidth,
            height: buttonHeight,
            response: true,
            label: '같음',
            color: [76, 175, 80]
          },
          {
            x: p.width/2 + spacing/2,
            y: buttonY,
            width: buttonWidth,
            height: buttonHeight,
            response: false,
            label: '다름',
            color: [244, 67, 54]
          }
        ];
        
        // 버튼 그리기
        for (let button of state.buttons) {
          p.push();
          p.fill(...button.color);
          p.noStroke();
          p.rect(button.x, button.y, button.width, button.height, 10);
          p.fill(255);
          p.textSize(28);
          p.textAlign(p.CENTER, p.CENTER);
          p.text(button.label, button.x + button.width/2, button.y + button.height/2);
          p.pop();
        }
        
        // 응답한 경우 피드백
        if (state.responded) {
          p.push();
          p.textSize(60);
          p.fill(0, 200, 0);
          p.text('✓', p.width/2, p.height * 0.85);
          p.pop();
        }
      }
    }
    // 자극 간 간격
    else if (timeSinceOnset >= state.stimulusDuration + state.interStimulusInterval) {
      // 무응답 처리
      if (!state.responded && state.currentIndex >= state.nLevel) {
        this.recordResponse(state, null);
      }
      
      // 다음 시행
      state.currentIndex++;
      state.stimulusOnset = currentTime;
      state.responded = false;
    }
    // 빈 화면 (고정점)
    else {
      p.push();
      p.fill(0);
      p.textSize(48);
      p.text('+', p.width/2, p.height/2);
      p.pop();
    }
  }

  handleMousePress(state, x, y, p) {
    if (!state.buttons || state.responded || state.currentIndex < state.nLevel) return;
    
    for (let button of state.buttons) {
      if (x >= button.x && x <= button.x + button.width &&
          y >= button.y && y <= button.y + button.height) {
        
        this.recordResponse(state, button.response);
        state.responded = true;
        break;
      }
    }
  }

  recordResponse(state, response) {
    const current = state.sequence[state.currentIndex];
    const nBack = state.sequence[state.currentIndex - state.nLevel];
    const isMatch = current === nBack;
    
    this.taskData.responses.push({
      trial: state.currentIndex,
      stimulus: current,
      nBackStimulus: nBack,
      isMatch: isMatch,
      response: response,
      correct: response === isMatch,
      rt: response !== null ? p.millis() - state.stimulusOnset : null
    });
  }

  calculateScore() {
    const responses = this.taskData.responses;
    if (responses.length === 0) return 0;
    
    const correct = responses.filter(r => r.correct).length;
    const accuracy = (correct / responses.length) * 100;
    
    // 신호탐지론 지표 계산
    const hits = responses.filter(r => r.isMatch && r.response === true).length;
    const hitRate = hits / responses.filter(r => r.isMatch).length || 0;
    
    const falseAlarms = responses.filter(r => !r.isMatch && r.response === true).length;
    const falseAlarmRate = falseAlarms / responses.filter(r => !r.isMatch).length || 0;
    
    // d' 계산 간소화
    const sensitivity = hitRate - falseAlarmRate;
    const score = accuracy * (0.5 + sensitivity * 0.5);
    
    return Math.round(Math.max(0, Math.min(100, score)));
  }
}