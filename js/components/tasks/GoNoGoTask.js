import { BaseTask } from './BaseTask.js';

export class GoNoGoTask extends BaseTask {
  getTutorial() {
    return {
      title: window.translationService.t('goNoGoTitle'),
      content: `
        <p>${window.translationService.t('goNoGoInstruction1')}</p>
        <div style="margin: 30px 0; font-size: 20px;">
          <div style="margin: 15px; padding: 15px; background: #e8f5e9; border-radius: 8px;">
            <span style="color: green; font-size: 36px; font-weight: bold;">4</span> 
            <span style="margin-left: 20px;">→ ${window.translationService.t('goNoGoEven')}</span>
          </div>
          <div style="margin: 15px; padding: 15px; background: #ffebee; border-radius: 8px;">
            <span style="color: red; font-size: 36px; font-weight: bold;">7</span> 
            <span style="margin-left: 20px;">→ ${window.translationService.t('goNoGoOdd')}</span>
          </div>
        </div>
        <p>${window.translationService.t('goNoGoImportant')}</p>
        <p>${window.translationService.t('goNoGoInstruction2')}</p>
      `
    };
  }

  getTaskName() {
    return 'Go/No-Go Task';
  }

  initializeState(state, p) {
    state.currentTrial = 0;
    state.maxTrials = 60;
    state.showStimulus = false;
    state.nextStimulusTime = p.millis() + 1000;
    state.stimulusDuration = 800; // 0.8초 표시
    state.interTrialInterval = 1200; // 1.2초 간격
    state.currentNumber = 0;
    state.isGoTrial = false;
    state.responded = false;
    state.responseTime = 0;
  }

  render(state, p) {
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
        // 배경 색상 (Go 시행일 때)
        if (state.isGoTrial && !state.responded) {
          p.push();
          p.fill(200, 255, 200, 50);
          p.noStroke();
          p.rect(0, 0, p.width, p.height);
          p.pop();
        }
        
        // 숫자 표시
        p.push();
        p.textSize(180);
        p.fill(state.isGoTrial ? [0, 150, 0] : [200, 0, 0]);
        p.text(state.currentNumber, p.width/2, p.height/2);
        p.pop();
        
        // 진행 상황
        p.push();
        p.textSize(20);
        p.fill(100);
        p.text(`${state.currentTrial + 1} / ${state.maxTrials}`, p.width/2, 50);
        p.pop();
        
        // 지시사항
        p.push();
        p.textSize(32);
        if (state.isGoTrial) {
          p.fill(0, 150, 0);
          p.text(window.translationService.t('touchScreen'), p.width/2, p.height - 100);
        } else {
          p.fill(150, 0, 0);
          p.text(window.translationService.t('doNotTouch'), p.width/2, p.height - 100);
        }
        p.pop();
        
        // 응답 피드백
        if (state.responded) {
          p.push();
          p.textSize(80);
          if (state.isGoTrial) {
            p.fill(0, 200, 0);
            p.text('✓', p.width/2, p.height * 0.8);
          } else {
            p.fill(255, 0, 0);
            p.text('✗', p.width/2, p.height * 0.8);
          }
          p.pop();
        }
      } else {
        // 자극 종료
        state.showStimulus = false;
        state.nextStimulusTime = currentTime + state.interTrialInterval;
        
        // 응답 기록
        this.taskData.responses.push({
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
    // 대기 화면
    else {
      p.push();
      p.fill(150);
      p.textSize(36);
      p.text(window.translationService.t('ready'), p.width/2, p.height/2);
      
      // 다음 자극까지 시간
      const timeUntilNext = Math.max(0, state.nextStimulusTime - currentTime);
      p.textSize(20);
      p.text(window.translationService.t('nextIn', { seconds: (timeUntilNext / 1000).toFixed(1) }), p.width/2, p.height/2 + 50);
      p.pop();
    }
  }

  handleMousePress(state, x, y, p) {
    if (state.showStimulus && !state.responded) {
      state.responded = true;
      state.responseTime = p.millis();
    }
  }

  calculateScore() {
    const responses = this.taskData.responses;
    if (responses.length === 0) return 0;
    
    const goTrials = responses.filter(r => r.isGoTrial);
    const noGoTrials = responses.filter(r => !r.isGoTrial);
    
    // Go 시행 정확도 (적중률)
    const goCorrect = goTrials.filter(r => r.responded).length;
    const goAccuracy = goTrials.length > 0 ? (goCorrect / goTrials.length) * 100 : 0;
    
    // No-Go 시행 정확도 (정확 기각률)
    const noGoCorrect = noGoTrials.filter(r => !r.responded).length;
    const noGoAccuracy = noGoTrials.length > 0 ? (noGoCorrect / noGoTrials.length) * 100 : 0;
    
    // 반응시간 보너스 (Go 시행만)
    const correctGoTrials = goTrials.filter(r => r.responded);
    const avgRT = correctGoTrials.length > 0
      ? correctGoTrials.reduce((sum, r) => sum + r.rt, 0) / correctGoTrials.length
      : 0;
    
    const rtBonus = avgRT > 0 ? Math.max(0, 10 - avgRT / 100) : 0;
    
    // 종합 점수
    const baseScore = (goAccuracy * 0.5 + noGoAccuracy * 0.5);
    return Math.round(Math.min(100, baseScore + rtBonus));
  }
}