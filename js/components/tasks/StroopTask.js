import { BaseTask } from './BaseTask.js';

export class StroopTask extends BaseTask {
  getTutorial() {
    const t = (key, params) => {
      if (window.translationService && typeof window.translationService.t === 'function') {
        try {
          return window.translationService.t(key, params);
        } catch (e) {
          return key;
        }
      }
      const fallback = {
        stroopTitle: '스트룹 검사 연습',
        stroopInstruction1: '화면에 색깔 단어가 나타납니다.',
        stroopInstruction2: '단어의 <strong>의미</strong>가 아닌 <strong>색깔</strong>을 선택하세요.',
        stroopExample: "위 예시에서는 '빨강'을 터치해야 합니다.",
        stroopInstruction3: '화면 하단의 색깔 버튼을 터치하세요.',
        red: '빨강', blue: '파랑', green: '초록', yellow: '노랑'
      };
      return fallback[key] || key;
    };
    return {
      title: t('stroopTitle'),
      content: `
        <p>${t('stroopInstruction1')}</p>
        <p>${t('stroopInstruction2')}</p>
        <div style="text-align: center; margin: 30px 0;">
          <span style="font-size: 48px; color: red;">${t('blue')}</span>
        </div>
        <p style="text-align: center;">${t('stroopExample')}</p>
        <p>${t('stroopInstruction3')}</p>
      `
    };
  }

  getTaskName() {
    return 'Stroop Task';
  }

  initializeState(state, p) {
    const t = (key, params) => {
      if (window.translationService && typeof window.translationService.t === 'function') {
        try {
          return window.translationService.t(key, params);
        } catch (e) {
          return key;
        }
      }
      const fallback = {
        red: '빨강', blue: '파랑', green: '초록', yellow: '노랑'
      };
      return fallback[key] || key;
    };
    state.colors = [t('red'), t('blue'), t('green'), t('yellow')];
    state.colorValues = ['red', 'blue', 'green', 'yellow'];
    state.currentTrial = 0;
    state.maxTrials = 20;
    state.showStimulus = true;
    state.stimulusOnset = p.millis();
    
    this.generateTrial(state);
  }

  generateTrial(state) {
    const t = (key, params) => {
      if (window.translationService && typeof window.translationService.t === 'function') {
        try {
          return window.translationService.t(key, params);
        } catch (e) {
          return key;
        }
      }
      const fallback = {
        red: '빨강', blue: '파랑', green: '초록', yellow: '노랑'
      };
      return fallback[key] || key;
    };
    state.wordIndex = Math.floor(Math.random() * state.colors.length);
    state.colorIndex = Math.floor(Math.random() * state.colors.length);
    state.isCongruent = state.wordIndex === state.colorIndex;
  }

  render(state, p) {
    const t = (key, params) => {
      if (window.translationService && typeof window.translationService.t === 'function') {
        try {
          return window.translationService.t(key, params);
        } catch (e) {
          return key;
        }
      }
      const fallback = {
        red: '빨강', blue: '파랑', green: '초록', yellow: '노랑'
      };
      return fallback[key] || key;
    };
    if (state.currentTrial >= state.maxTrials) {
      this.completeTask();
      return;
    }
    
    if (state.showStimulus) {
      // 자극 표시
      p.push();
      p.textSize(96);
      p.fill(state.colorValues[state.colorIndex]);
      p.text(state.colors[state.wordIndex], p.width/2, p.height/3);
      p.pop();
      
      // 터치 버튼 표시
      const buttonWidth = 140;
      const buttonHeight = 80;
      const buttonSpacing = 20;
      const totalWidth = (buttonWidth * 4) + (buttonSpacing * 3);
      const startX = (p.width - totalWidth) / 2;
      const buttonY = p.height * 0.65;
      
      state.buttons = [];
      
      for (let i = 0; i < state.colors.length; i++) {
        const x = startX + (i * (buttonWidth + buttonSpacing));
        
        // 버튼 정보 저장
        state.buttons.push({
          x: x,
          y: buttonY,
          width: buttonWidth,
          height: buttonHeight,
          index: i
        });
        
        // 버튼 그리기
        p.push();
        p.fill(state.colorValues[i]);
        p.noStroke();
        p.rect(x, buttonY, buttonWidth, buttonHeight, 10);
        
        // 버튼 텍스트
        p.fill(255);
        p.textSize(24);
        p.textAlign(p.CENTER, p.CENTER);
        p.text(state.colors[i], x + buttonWidth/2, buttonY + buttonHeight/2);
        p.pop();
      }
      
      // 진행 상황 표시
      p.push();
      p.textSize(20);
      p.fill(100);
      p.textAlign(p.CENTER);
      p.text(`${state.currentTrial + 1} / ${state.maxTrials}`, p.width/2, 50);
      p.pop();
    }
  }

  handleMousePress(state, x, y, p) {
    if (!state.showStimulus || !state.buttons) return;
    
    // 버튼 클릭 확인
    for (let button of state.buttons) {
      if (x >= button.x && x <= button.x + button.width &&
          y >= button.y && y <= button.y + button.height) {
        
        const response = {
          trial: state.currentTrial,
          stimulus: state.colors[state.wordIndex],
          color: state.colorValues[state.colorIndex],
          response: state.colors[button.index],
          correct: button.index === state.colorIndex,
          rt: p.millis() - state.stimulusOnset,
          congruent: state.isCongruent
        };
        
        this.taskData.responses.push(response);
        
        // 다음 시행
        state.currentTrial++;
        state.stimulusOnset = p.millis();
        this.generateTrial(state);
        break;
      }
    }
  }

  calculateScore() {
    const responses = this.taskData.responses;
    if (responses.length === 0) return 0;
    
    const correct = responses.filter(r => r.correct).length;
    const accuracy = (correct / responses.length) * 100;
    
    // 반응시간 계산
    const correctResponses = responses.filter(r => r.correct);
    const avgRT = correctResponses.length > 0
      ? correctResponses.reduce((sum, r) => sum + r.rt, 0) / correctResponses.length
      : 0;
    
    // 종합 점수 (정확도와 반응시간 고려)
    const rtPenalty = Math.min(20, avgRT / 100);
    return Math.round(Math.max(0, accuracy - rtPenalty));
  }
}