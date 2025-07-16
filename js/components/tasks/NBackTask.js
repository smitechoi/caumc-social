import { BaseTask } from './BaseTask.js';

export class NBackTask extends BaseTask {
  getTutorial() {
    const nLevel = 1; // 또는 this.nLevel로 설정 가능
    return {
      title: window.translationService.t('nBackTitle', { nLevel: nLevel }),
      content: `
        <p>${window.translationService.t('nBackInstruction1')}</p>
        <p>${window.translationService.t('nBackInstruction2', { nLevel: nLevel })}</p>
        <div style="text-align: center; margin: 30px 0; font-size: 24px;">
          ${nLevel === 1 ? `
            <div style="margin: 10px;">3 → <span style="color: red; font-weight: bold;">3</span> (${window.translationService.t('nBackSame')})</div>
            <div style="margin: 10px;">7 → <span style="color: blue; font-weight: bold;">2</span> (${window.translationService.t('nBackDifferent')})</div>
          ` : `
            <div style="margin: 10px;">3 → 5 → <span style="color: red; font-weight: bold;">3</span> (${window.translationService.t('nBackSame')})</div>
            <div style="margin: 10px;">7 → 2 → <span style="color: blue; font-weight: bold;">9</span> (${window.translationService.t('nBackDifferent')})</div>
          `}
        </div>
        <p>${window.translationService.t('nBackInstruction3')}</p>
        <p>${window.translationService.t('nBackInstruction4', { nLevel: nLevel })}</p>
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
    state.nLevel = 1; // 2-back
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
      p.text(state.sequence[state.currentIndex], p.width / 2, p.height / 3);
      p.pop();

      // 진행 상황
      p.push();
      p.textSize(20);
      p.fill(100);
      p.text(`${state.currentIndex + 1} / ${state.maxTrials}`, p.width / 2, 50);
      p.pop();

      // 응답 버튼 (3번째 시행부터)
      if (state.currentIndex >= state.nLevel) {
        const buttonWidth = 180;
        const buttonHeight = 100;
        const buttonY = p.height * 0.65;
        const spacing = 60;

        state.buttons = [
          {
            x: p.width / 2 - buttonWidth - spacing / 2,
            y: buttonY,
            width: buttonWidth,
            height: buttonHeight,
            response: true,
            label: window.translationService.t('nBackSame'),
            color: [76, 175, 80]
          },
          {
            x: p.width / 2 + spacing / 2,
            y: buttonY,
            width: buttonWidth,
            height: buttonHeight,
            response: false,
            label: window.translationService.t('nBackDifferent'),
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
          p.text(button.label, button.x + button.width / 2, button.y + button.height / 2);
          p.pop();
        }

        // 응답한 경우 피드백
        if (state.responded) {
          p.push();
          p.textSize(60);
          p.fill(0, 200, 0);
          p.text('✓', p.width / 2, p.height * 0.85);
          p.pop();
        }
      }
    }
    // 자극 간 간격
    else if (timeSinceOnset >= state.stimulusDuration + state.interStimulusInterval) {
      // 무응답 처리
      if (!state.responded && state.currentIndex >= state.nLevel) {
        this.recordResponse(state, null, p);
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
      p.text('+', p.width / 2, p.height / 2);
      p.pop();
    }
  }


  handleMousePress(state, x, y, p) {
    if (!state.buttons || state.responded || state.currentIndex < state.nLevel) return;

    for (let button of state.buttons) {
      if (x >= button.x && x <= button.x + button.width &&
        y >= button.y && y <= button.y + button.height) {

        this.recordResponse(state, button.response, p);
        state.responded = true;
        break;
      }
    }
  }

  recordResponse(state, response, p) {
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