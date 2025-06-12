import { BaseTask } from './BaseTask.js';

export class EmotionRecognitionTask extends BaseTask {
  getTutorial() {
    return {
      title: '표정 인식 검사 연습',
      content: `
        <p>화면에 사람의 얼굴 사진이 나타납니다.</p>
        <p>표정을 보고 <strong>어떤 감정</strong>인지 선택하세요.</p>
        <div style="text-align: center; margin: 30px 0;">
          <div style="display: inline-block; width: 200px; height: 200px; background: #f0f0f0; border-radius: 10px; line-height: 200px; font-size: 60px;">
            😊
          </div>
        </div>
        <p>기본 감정: 행복, 슬픔, 화남, 놀람, 두려움, 역겨움, 중립</p>
        <p style="color: #666; font-size: 14px;">각 표정을 주의 깊게 보고 가장 적절한 감정을 선택하세요.</p>
      `
    };
  }

  getTaskName() {
    return 'Emotion Recognition Task';
  }

  initializeState(state, p) {
    // 감정 카테고리 정의
    state.emotions = {
      happy: { ko: '행복', en: 'Happy', color: [255, 193, 7] },
      sad: { ko: '슬픔', en: 'Sad', color: [33, 150, 243] },
      angry: { ko: '화남', en: 'Angry', color: [244, 67, 54] },
      surprised: { ko: '놀람', en: 'Surprised', color: [156, 39, 176] },
      fearful: { ko: '두려움', en: 'Fearful', color: [121, 85, 72] },
      disgusted: { ko: '역겨움', en: 'Disgusted', color: [76, 175, 80] },
      neutral: { ko: '중립', en: 'Neutral', color: [158, 158, 158] }
    };
    
    // 이미지 경로 설정 (GitHub 또는 로컬 경로)
    state.imageBasePath = '/data/emotion-faces/'; // 또는 GitHub raw URL
    
    // 시행 설정
    state.currentTrial = 0;
    state.maxTrials = 28; // 7 emotions × 4 variations
    state.showStimulus = true;
    state.stimulusOnset = p.millis();
    state.stimulusDuration = 5000; // 5초 제한
    state.responded = false;
    
    // 난이도 설정
    state.difficulty = 'basic'; // basic, subtle, masked
    state.presentationTime = 3000; // 표정 제시 시간
    
    // 시행 순서 생성 (균형잡힌 무작위)
    state.trials = this.generateTrialSequence(state);
    state.currentTrialData = state.trials[state.currentTrial];
    
    // 이미지 프리로드
    this.preloadImages(state, p);
  }

  generateTrialSequence(state) {
    const trials = [];
    const emotionKeys = Object.keys(state.emotions);
    
    // 각 감정당 4번씩 (총 28 시행)
    for (let rep = 0; rep < 4; rep++) {
      for (let emotion of emotionKeys) {
        trials.push({
          emotion: emotion,
          intensity: rep < 2 ? 'high' : 'low', // 처음 2번은 강한 표정, 나중 2번은 약한 표정
          imageFile: `${emotion}_${rep + 1}.jpg`
        });
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
    for (let trial of state.trials) {
      const imagePath = state.imageBasePath + trial.imageFile;
      // p5.js에서는 preload가 따로 필요하지만, 
      // 여기서는 동적 로딩을 위해 Image 객체 사용
      state.images[trial.imageFile] = p.loadImage(imagePath, 
        () => console.log(`Loaded: ${trial.imageFile}`),
        () => {
          console.error(`Failed to load: ${trial.imageFile}`);
          // 실패 시 플레이스홀더 이미지 사용
          state.images[trial.imageFile] = this.createPlaceholderImage(p);
        }
      );
    }
  }

  createPlaceholderImage(p) {
    // 이미지 로드 실패 시 간단한 이모지 기반 플레이스홀더
    const pg = p.createGraphics(200, 200);
    pg.background(240);
    pg.textAlign(p.CENTER, p.CENTER);
    pg.textSize(80);
    pg.text('🙂', 100, 100);
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
    
    // 자극 제시 단계
    if (timeSinceOnset < state.presentationTime) {
      // 얼굴 이미지 표시
      this.drawFaceStimulus(state, p);
      
      // 응답 버튼은 항상 표시
      this.drawEmotionButtons(state, p);
      
      // 남은 시간 표시
      const remainingTime = Math.ceil((state.presentationTime - timeSinceOnset) / 1000);
      p.push();
      p.textAlign(p.CENTER);
      p.textSize(24);
      p.fill(100);
      p.text(`남은 시간: ${remainingTime}초`, p.width/2, p.height * 0.9);
      p.pop();
    }
    // 시간 초과
    else if (!state.responded) {
      // 무응답으로 기록
      this.recordResponse(state, null, p);
      this.nextTrial(state, p);
    }
    
    // 피드백 표시 (옵션)
    if (state.showFeedback && state.feedbackEndTime > currentTime) {
      this.drawFeedback(state, p);
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
      const maxSize = Math.min(p.width * 0.4, p.height * 0.4);
      const scale = Math.min(maxSize / img.width, maxSize / img.height);
      const imgWidth = img.width * scale;
      const imgHeight = img.height * scale;
      
      // 중앙에 표시
      p.push();
      p.imageMode(p.CENTER);
      p.image(img, p.width/2, p.height * 0.35, imgWidth, imgHeight);
      p.pop();
    } else {
      // 로딩 중 또는 실패 시 플레이스홀더
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
      p.text('이미지 로딩 중...', p.width/2, p.height * 0.35);
      p.pop();
    }
  }

  drawEmotionButtons(state, p) {
    const emotions = Object.entries(state.emotions);
    const buttonWidth = Math.min(140, (p.width - 100) / emotions.length);
    const buttonHeight = 80;
    const totalWidth = emotions.length * buttonWidth + (emotions.length - 1) * 10;
    const startX = (p.width - totalWidth) / 2;
    const buttonY = p.height * 0.65;
    
    state.buttons = [];
    
    emotions.forEach(([key, emotion], index) => {
      const x = startX + index * (buttonWidth + 10);
      
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
      } else {
        p.noStroke();
      }
      
      p.fill(emotion.color[0], emotion.color[1], emotion.color[2], 200);
      p.rect(x, buttonY, buttonWidth, buttonHeight, 8);
      
      // 텍스트
      p.fill(255);
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(18);
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
    if (!state.buttons || state.responded) return;
    
    for (let button of state.buttons) {
      if (x >= button.x && x <= button.x + button.width &&
          y >= button.y && y <= button.y + button.height) {
        
        this.recordResponse(state, button.emotion, p);
        state.responded = true;
        state.lastResponse = button.emotion;
        
        // 다음 시행으로
        setTimeout(() => {
          this.nextTrial(state, p);
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
      response: response,
      correct: correct,
      rt: rt,
      timeout: response === null
    });
    
    state.lastResponseCorrect = correct;
    
    // 피드백 설정 (옵션)
    if (state.showFeedback) {
      state.feedbackEndTime = p.millis() + 1500;
    }
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
    const emotions = ['happy', 'sad', 'angry', 'surprised', 'fearful', 'disgusted', 'neutral'];
    
    for (let emotion of emotions) {
      const emotionTrials = responses.filter(r => r.targetEmotion === emotion);
      if (emotionTrials.length > 0) {
        const emotionCorrect = emotionTrials.filter(r => r.correct).length;
        emotionAccuracy[emotion] = (emotionCorrect / emotionTrials.length) * 100;
      }
    }
    
    // 강도별 정확도
    const highIntensity = responses.filter(r => r.intensity === 'high');
    const lowIntensity = responses.filter(r => r.intensity === 'low');
    
    const highAccuracy = highIntensity.length > 0 
      ? (highIntensity.filter(r => r.correct).length / highIntensity.length) * 100 
      : 0;
    const lowAccuracy = lowIntensity.length > 0
      ? (lowIntensity.filter(r => r.correct).length / lowIntensity.length) * 100
      : 0;
    
    // 반응시간 분석 (정답만)
    const correctResponses = responses.filter(r => r.correct && r.rt);
    const avgRT = correctResponses.length > 0
      ? correctResponses.reduce((sum, r) => sum + r.rt, 0) / correctResponses.length
      : 0;
    
    // 분석 결과 저장
    this.taskData.analysis = {
      overallAccuracy: accuracy,
      emotionAccuracy: emotionAccuracy,
      highIntensityAccuracy: highAccuracy,
      lowIntensityAccuracy: lowAccuracy,
      averageRT: avgRT,
      timeouts: responses.filter(r => r.timeout).length
    };
    
    // 종합 점수 계산
    // 높은 강도와 낮은 강도 모두 고려
    const weightedAccuracy = (highAccuracy * 0.4 + lowAccuracy * 0.6);
    
    // 반응시간 보너스 (빠를수록 좋음, 2초 기준)
    const rtBonus = avgRT > 0 ? Math.max(0, 10 - (avgRT - 2000) / 200) : 0;
    
    return Math.round(Math.min(100, weightedAccuracy + rtBonus));
  }
}