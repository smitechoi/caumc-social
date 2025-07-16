import { BaseTask } from './BaseTask.js';

export class EmotionRecognitionTask extends BaseTask {
  getTutorial() {
    const t = (key, params) => {
      if (window.translationService && typeof window.translationService.t === 'function') {
        try {
          return window.translationService.t(key, params);
        } catch (e) {
          return key;
        }
      }
      // 기본 한국어 번역
      const fallback = {
        emotionTitle: '표정 인식 검사 연습',
        emotionInstruction1: '화면에 사람의 얼굴 사진이 나타납니다.',
        emotionInstruction2: '표정을 보고 <strong>어떤 감정</strong>인지 선택하세요.',
        emotionInstruction3: '평가할 감정: <strong>행복, 슬픔, 중립, 화남</strong>',
        emotionInstruction4: '각 표정을 주의 깊게 보고 가장 적절한 감정을 선택하세요.',
        emotionIntensityNote: '표정의 강도는 다양할 수 있습니다 (강함, 중간, 약함)'
      };
      return fallback[key] || key;
    };
    return {
      title: t('emotionTitle'),
      content: `
        <p>${t('emotionInstruction1')}</p>
        <p>${t('emotionInstruction2')}</p>
        <div style="text-align: center; margin: 30px 0;">
          <div style="display: inline-block; width: 200px; height: 200px; background: #f0f0f0; border-radius: 10px; line-height: 200px; font-size: 60px;">
            😊
          </div>
        </div>
        <p>${t('emotionInstruction3')}</p>
        <p style="color: #666; font-size: 14px;">${t('emotionInstruction4')}</p>
        <p style="color: #2196F3; font-size: 14px;">${t('emotionIntensityNote')}</p>
      `
    };
  }

  getTaskName() {
    return 'Emotion Recognition Task';
  }

  initializeState(state, p) {
    // 감정 카테고리 정의 (4가지로 축소)
    state.emotions = {
      happy: { ko: '행복', en: 'Happy', color: [255, 193, 7] },
      sad: { ko: '슬픔', en: 'Sad', color: [33, 150, 243] },
      neutral: { ko: '중립', en: 'Neutral', color: [158, 158, 158] },
      anger: { ko: '화남', en: 'Anger', color: [244, 67, 54] }
    };
    
    // GitHub Pages raw 이미지 경로
    state.imageBasePath = 'https://raw.githubusercontent.com/smitechoi/caumc-social/main/data/emotion-faces/';
    
    // 시행 설정
    state.currentTrial = 0;
    state.maxTrials = 20; // (3 emotions × 3 intensities × 2) + (neutral × 2) = 18 + 2 = 20
    state.showStimulus = true;
    state.stimulusOnset = p.millis();
    state.stimulusDuration = 5000; // 5초 제한
    state.responded = false;
    
    // 난이도 설정
    state.presentationTime = 3000; // 표정 제시 시간
    state.showFeedback = false; // 피드백 표시 여부
    
    // 시행 순서 생성 (균형잡힌 무작위)
    state.trials = this.generateTrialSequence(state);
    state.currentTrialData = state.trials[state.currentTrial];
    state.responded = false;
    state.processingResponse = false;
    // 이미지 프리로드
    this.preloadImages(state, p);
  }

  generateTrialSequence(state) {
    const trials = [];
    const emotionKeys = Object.keys(state.emotions);
    const intensities = ['strong', 'medium', 'weak']; // 강, 중, 약
    
    // 각 감정별로 처리
    for (let emotion of emotionKeys) {
      if (emotion === 'neutral') {
        // neutral은 강도 구분 없이 2개만
        for (let variant = 1; variant <= 2; variant++) {
          trials.push({
            emotion: emotion,
            intensity: 'neutral', // 강도 대신 'neutral' 표시
            variant: variant,
            imageFile: `${emotion}_${variant}.jpg`
          });
        }
      } else {
        // happy, sad, anger는 강도별로
        for (let intensity of intensities) {
          for (let variant = 1; variant <= 2; variant++) {
            trials.push({
              emotion: emotion,
              intensity: intensity,
              variant: variant,
              imageFile: `${emotion}_${intensity}_${variant}.jpg`
            });
          }
        }
      }
    }
    
    // 무작위 섞기
    return this.shuffleArray(trials);
  }

  shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  preloadImages(state, p) {
    state.images = {};
    state.loadedCount = 0;
    state.totalImages = state.trials.length;
    
    for (let trial of state.trials) {
      const imagePath = state.imageBasePath + trial.imageFile;
      
      // 이미지 로드 시도
      state.images[trial.imageFile] = p.loadImage(imagePath, 
        () => {
          state.loadedCount++;
          console.log(`Loaded: ${trial.imageFile} (${state.loadedCount}/${state.totalImages})`);
        },
        () => {
          state.loadedCount++;
          console.error(`Failed to load: ${trial.imageFile}`);
          // 실패 시 플레이스홀더 이미지 사용
          state.images[trial.imageFile] = this.createPlaceholderImage(p, trial.emotion);
        }
      );
    }
  }

  createPlaceholderImage(p, emotion) {
    // 이미지 로드 실패 시 이모지 기반 플레이스홀더
    const emojis = {
      happy: '😊',
      sad: '😢',
      neutral: '😐',
      anger: '😠'
    };
    
    const pg = p.createGraphics(200, 200);
    pg.background(240);
    pg.textAlign(p.CENTER, p.CENTER);
    pg.textSize(100);
    pg.text(emojis[emotion] || '🙂', 100, 100);
    return pg;
  }

    render(state, p) {
    if (state.currentTrial >= state.maxTrials) {
      this.completeTask();
      return;
    }
    
    const currentTime = p.millis();
    const timeSinceOnset = currentTime - state.stimulusOnset;
    
    // 배경
    p.background(250);
    
    // 진행 상황 표시
    this.drawProgress(state, p);
    
    // 응답 처리 중이면 대기
    if (state.processingResponse) {
      this.drawFeedback(state, p);
      return;
    }
    
    // 자극 제시 단계
    if (timeSinceOnset < state.presentationTime && !state.responded) {
      // 얼굴 이미지 표시
      this.drawFaceStimulus(state, p);
      
      // 응답 버튼 표시
      this.drawEmotionButtons(state, p);
      
      // 남은 시간 표시
      const t = window.translationService?.t || ((key) => key);
      const remainingTime = Math.ceil((state.presentationTime - timeSinceOnset) / 1000);
      p.push();
      p.textAlign(p.CENTER);
      p.textSize(24);
      p.fill(100);
      p.text(t('remainingTime', { seconds: remainingTime }), p.width/2, p.height * 0.9);
      p.pop();
    }
    // 시간 초과
    else if (!state.responded && !state.processingResponse) {
      // 무응답으로 기록하고 다음으로
      state.processingResponse = true;
      this.recordResponse(state, null, p);
      
      setTimeout(() => {
        this.nextTrial(state, p);
        state.processingResponse = false;
      }, 1000);
    }
  }

  drawProgress(state, p) {
    p.push();
    p.fill(255);
    p.noStroke();
    p.rect(0, 0, p.width, 80);
    
    // 진행률 바
    const progressWidth = (state.currentTrial / state.maxTrials) * (p.width - 60);
    p.fill(230);
    p.rect(30, 20, p.width - 60, 20, 10);
    p.fill(76, 175, 80);
    p.rect(30, 20, progressWidth, 20, 10);
    
    // 텍스트
    p.fill(0);
    p.textAlign(p.CENTER);
    p.textSize(16);
    p.text(`${state.currentTrial + 1} / ${state.maxTrials}`, p.width/2, 60);
    
    
    p.pop();
  }

  drawFaceStimulus(state, p) {
    const trial = state.currentTrialData;
    const img = state.images[trial.imageFile];
    
    if (img && img.width > 0) {
      // 이미지 크기 조정
      const maxSize = Math.min(p.width * 0.4, p.height * 0.4, 400);
      const scale = Math.min(maxSize / img.width, maxSize / img.height);
      const imgWidth = img.width * scale;
      const imgHeight = img.height * scale;
      
      // 중앙에 표시
      p.push();
      p.imageMode(p.CENTER);
      
      // 이미지 테두리
      p.stroke(200);
      p.strokeWeight(2);
      p.fill(255);
      p.rectMode(p.CENTER);
      p.rect(p.width/2, p.height * 0.35, imgWidth + 10, imgHeight + 10, 5);
      
      // 이미지 표시
      p.image(img, p.width/2, p.height * 0.35, imgWidth, imgHeight);
      p.pop();
    } else {
      // 플레이스홀더 표시
      p.push();
      p.fill(240);
      p.stroke(200);
      p.strokeWeight(2);
      p.rectMode(p.CENTER);
      p.rect(p.width/2, p.height * 0.35, 300, 300, 10);
      
      p.fill(100);
      p.noStroke();
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(20);
      p.text('이미지 준비 중...', p.width/2, p.height * 0.35);
      p.pop();
    }
  }

  drawEmotionButtons(state, p) {
    const emotions = Object.entries(state.emotions);
    const buttonWidth = Math.min(160, (p.width - 80) / emotions.length);
    const buttonHeight = 90;
    const spacing = 15;
    const totalWidth = emotions.length * buttonWidth + (emotions.length - 1) * spacing;
    const startX = (p.width - totalWidth) / 2;
    const buttonY = p.height * 0.65;
    
    state.buttons = [];
    
    emotions.forEach(([key, emotion], index) => {
      const x = startX + index * (buttonWidth + spacing);
      
      // 버튼 정보 저장
      state.buttons.push({
        x: x,
        y: buttonY,
        width: buttonWidth,
        height: buttonHeight,
        emotion: key,
        label: emotion.ko
      });
      
      // 버튼 그리기
      p.push();
      
      // 응답한 경우 선택된 버튼 강조
      if (state.responded && state.lastResponse === key) {
        p.strokeWeight(4);
        p.stroke(emotion.color);
        p.fill(emotion.color[0], emotion.color[1], emotion.color[2], 100);
      } else {
        p.noStroke();
        p.fill(emotion.color[0], emotion.color[1], emotion.color[2], 200);
      }
      
      // 버튼 박스
      p.rect(x, buttonY, buttonWidth, buttonHeight, 12);
      
      // 버튼 호버 효과 (마우스 위치 확인)
      if (!state.responded && 
          p.mouseX >= x && p.mouseX <= x + buttonWidth &&
          p.mouseY >= buttonY && p.mouseY <= buttonY + buttonHeight) {
        p.fill(255, 255, 255, 50);
        p.rect(x, buttonY, buttonWidth, buttonHeight, 12);
      }
      
      // 텍스트
      p.fill(255);
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(24);
      p.textStyle(p.BOLD);
      p.text(emotion.ko, x + buttonWidth/2, buttonY + buttonHeight/2);
      p.pop();
    });
  }

  drawFeedback(state, p) {
    if (!state.showFeedback) return;
    
    const isCorrect = state.lastResponseCorrect;
    
    p.push();
    p.textAlign(p.CENTER);
    p.textSize(36);
    
    if (isCorrect) {
      p.fill(76, 175, 80);
      p.text('정답! ✓', p.width/2, p.height * 0.5);
    } else {
      p.fill(244, 67, 54);
      p.text('오답 ✗', p.width/2, p.height * 0.5);
      
      // 정답 표시
      p.textSize(24);
      p.text(`정답: ${state.emotions[state.currentTrialData.emotion].ko}`, 
             p.width/2, p.height * 0.55);
    }
    p.pop();
  }

  handleMousePress(state, x, y, p) {
    if (!state.buttons || state.responded || state.processingResponse) return;
    
    for (let button of state.buttons) {
      if (x >= button.x && x <= button.x + button.width &&
          y >= button.y && y <= button.y + button.height) {
        
        // 응답 처리 중 표시
        state.responded = true;
        state.processingResponse = true;
        state.lastResponse = button.emotion;
        
        // 응답 기록
        this.recordResponse(state, button.emotion, p);
        
        // 피드백 후 다음 시행으로
        setTimeout(() => {
          this.nextTrial(state, p);
          state.processingResponse = false;
        }, 1500);
        
        break;
      }
    }
  }

  recordResponse(state, response, p) {
    const trial = state.currentTrialData;
    const rt = response ? p.millis() - state.stimulusOnset : null;
    const correct = response === trial.emotion;
    
    this.taskData.responses.push({
      trial: state.currentTrial,
      targetEmotion: trial.emotion,
      intensity: trial.intensity,
      variant: trial.variant,
      response: response,
      correct: correct,
      rt: rt,
      timeout: response === null
    });
    
    state.lastResponseCorrect = correct;
  }

  nextTrial(state, p) {
    state.currentTrial++;
    if (state.currentTrial < state.maxTrials) {
      state.currentTrialData = state.trials[state.currentTrial];
      state.stimulusOnset = p.millis();
      state.responded = false;
      state.lastResponse = null;
    }
  }

  calculateScore() {
    const responses = this.taskData.responses;
    if (responses.length === 0) return 0;
    
    // 전체 정확도
    const correct = responses.filter(r => r.correct).length;
    const accuracy = (correct / responses.length) * 100;
    
    // 감정별 정확도 계산
    const emotionAccuracy = {};
    const emotions = ['happy', 'sad', 'neutral', 'anger'];
    
    for (let emotion of emotions) {
      const emotionTrials = responses.filter(r => r.targetEmotion === emotion);
      if (emotionTrials.length > 0) {
        const emotionCorrect = emotionTrials.filter(r => r.correct).length;
        emotionAccuracy[emotion] = (emotionCorrect / emotionTrials.length) * 100;
      }
    }
    
    // 강도별 정확도
    const intensityAccuracy = {};
    const intensities = ['strong', 'medium', 'weak', 'neutral']; // neutral 추가
    
    for (let intensity of intensities) {
      const intensityTrials = responses.filter(r => r.intensity === intensity);
      if (intensityTrials.length > 0) {
        const intensityCorrect = intensityTrials.filter(r => r.correct).length;
        intensityAccuracy[intensity] = (intensityCorrect / intensityTrials.length) * 100;
      }
    }
    
    // 반응시간 분석 (정답만)
    const correctResponses = responses.filter(r => r.correct && r.rt);
    const avgRT = correctResponses.length > 0
      ? correctResponses.reduce((sum, r) => sum + r.rt, 0) / correctResponses.length
      : 0;
    
    // 혼동 행렬 계산
    const confusionMatrix = this.calculateConfusionMatrix(responses);
    
    // 분석 결과 저장
    this.taskData.analysis = {
      overallAccuracy: accuracy,
      emotionAccuracy: emotionAccuracy,
      intensityAccuracy: intensityAccuracy,
      averageRT: avgRT,
      timeouts: responses.filter(r => r.timeout).length,
      confusionMatrix: confusionMatrix
    };
    
    // 종합 점수 계산
    // 강도별 가중치 적용 (약한 표정일수록 높은 가중치, neutral은 중간 가중치)
    const weightedAccuracy = 
      (intensityAccuracy.strong || 0) * 0.2 +
      (intensityAccuracy.medium || 0) * 0.3 +
      (intensityAccuracy.weak || 0) * 0.4 +
      (intensityAccuracy.neutral || 0) * 0.1;
    
    // 반응시간 보너스 (빠를수록 좋음, 2초 기준)
    const rtBonus = avgRT > 0 ? Math.max(0, 10 - (avgRT - 2000) / 200) : 0;
    
    return Math.round(Math.min(100, weightedAccuracy + rtBonus));
  }

  calculateConfusionMatrix(responses) {
    const emotions = ['happy', 'sad', 'neutral', 'anger'];
    const matrix = {};
    
    // 초기화
    for (let actual of emotions) {
      matrix[actual] = {};
      for (let predicted of emotions) {
        matrix[actual][predicted] = 0;
      }
    }
    
    // 카운트
    for (let response of responses) {
      if (response.response) {
        matrix[response.targetEmotion][response.response]++;
      }
    }
    
    return matrix;
  }
}