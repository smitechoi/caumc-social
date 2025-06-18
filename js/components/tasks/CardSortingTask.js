import { BaseTask } from './BaseTask.js';

export class CardSortingTask extends BaseTask {
  getTutorial() {
    return {
      title: '카드 분류 검사 연습',
      content: `
        <p>화면에 4개의 기준 카드가 상단에 나타납니다.</p>
        <p>하단에 새로운 카드가 하나씩 제시됩니다.</p>
        <p>이 카드를 <strong>어떤 규칙에 따라</strong> 기준 카드 중 하나와 매칭시켜야 합니다.</p>
        <div style="text-align: center; margin: 30px 0;">
          <p style="font-size: 20px; color: #2196F3;">규칙은 다음 중 하나입니다:</p>
          <p><strong>색상</strong> (빨강, 초록, 파랑, 노랑)</p>
          <p><strong>모양</strong> (원, 십자가, 삼각형, 별)</p>
          <p><strong>개수</strong> (1개, 2개, 3개, 4개)</p>
        </div>
        <p style="color: #f44336; font-weight: bold;">주의: 규칙은 알려주지 않으며, 예고 없이 바뀝니다!</p>
        <p>정답/오답 피드백을 보고 현재 규칙을 추측하세요.</p>
      `
    };
  }

  getTaskName() {
    return 'Wisconsin Card Sorting Task';
  }

  initializeState(state, p) {
    // 카드 속성
    state.colors = ['red', 'green', 'blue', 'yellow'];
    state.shapes = ['circle', 'cross', 'triangle', 'star'];
    state.numbers = [1, 2, 3, 4];
    
    // 기준 카드 (고정)
    state.referenceCards = [
      { color: 'red', shape: 'triangle', number: 1 },
      { color: 'green', shape: 'star', number: 2 },
      { color: 'blue', shape: 'cross', number: 3 },
      { color: 'yellow', shape: 'circle', number: 4 }
    ];
    
    // 규칙 설정
    state.rules = ['color', 'shape', 'number'];
    state.currentRuleIndex = 0;
    state.currentRule = state.rules[state.currentRuleIndex];
    
    // 게임 상태
    state.currentCard = this.generateCard(state);
    state.totalTrials = 128; // 표준 WCST
    state.currentTrial = 0;
    state.consecutiveCorrect = 0;
    state.categoriesCompleted = 0;
    state.criteriaForChange = 10; // 10번 연속 정답 시 규칙 변경
    
    // 반응 기록
    state.responded = false;
    state.lastResponse = null;
    state.showFeedback = false;
    state.feedbackEndTime = 0;
    
    // 카드 위치 설정
    const cardWidth = 120;
    const cardHeight = 160;
    const spacing = 30;
    const totalWidth = 4 * cardWidth + 3 * spacing;
    const startX = (p.width - totalWidth) / 2;
    
    state.referencePositions = [];
    for (let i = 0; i < 4; i++) {
      state.referencePositions.push({
        x: startX + i * (cardWidth + spacing),
        y: 100,
        width: cardWidth,
        height: cardHeight
      });
    }
    
    state.testCardPosition = {
      x: p.width / 2 - cardWidth / 2,
      y: p.height - 300,
      width: cardWidth,
      height: cardHeight
    };
  }

  generateCard(state) {
    // 기준 카드와 겹치지 않는 카드 생성
    let card;
    do {
      card = {
        color: p5.random(state.colors),
        shape: p5.random(state.shapes),
        number: Math.floor(Math.random() * 4) + 1
      };
    } while (this.isDuplicateOfReference(card, state.referenceCards));
    
    return card;
  }

  isDuplicateOfReference(card, referenceCards) {
    return referenceCards.some(ref => 
      ref.color === card.color && 
      ref.shape === card.shape && 
      ref.number === card.number
    );
  }

  render(state, p) {
    if (state.currentTrial >= state.totalTrials) {
      this.completeTask();
      return;
    }
    
    // 배경
    p.background(250);
    
    // 진행 상황
    this.drawProgress(state, p);
    
    // 기준 카드 그리기
    for (let i = 0; i < 4; i++) {
      this.drawCard(
        state.referenceCards[i], 
        state.referencePositions[i], 
        p,
        state.lastResponse === i && state.showFeedback
      );
    }
    
    // 테스트 카드 그리기
    if (!state.responded || state.showFeedback) {
      this.drawCard(state.currentCard, state.testCardPosition, p, false, true);
    }
    
    // 피드백 표시
    if (state.showFeedback) {
      this.drawFeedback(state, p);
      
      // 피드백 시간 종료 확인
      if (p.millis() > state.feedbackEndTime) {
        state.showFeedback = false;
        state.responded = false;
        state.lastResponse = null;
        
        // 다음 카드
        state.currentCard = this.generateCard(state);
        state.currentTrial++;
      }
    }
    
    // 현재 규칙 표시 (디버그용 - 실제로는 제거)
    if (false) { // 디버그 모드
      p.push();
      p.fill(0);
      p.textAlign(p.LEFT);
      p.text(`Current Rule: ${state.currentRule}`, 10, p.height - 20);
      p.pop();
    }
  }

  drawProgress(state, p) {
    p.push();
    p.fill(255);
    p.noStroke();
    p.rect(0, 0, p.width, 60);
    
    // 텍스트 정보
    p.fill(0);
    p.textAlign(p.LEFT);
    p.textSize(16);
    p.text(`시행: ${state.currentTrial + 1} / ${state.totalTrials}`, 20, 25);
    p.text(`완성된 범주: ${state.categoriesCompleted}`, 20, 45);
    
    // 진행률 바
    const progressWidth = (state.currentTrial / state.totalTrials) * 200;
    p.fill(230);
    p.rect(p.width - 220, 20, 200, 20, 10);
    p.fill(76, 175, 80);
    p.rect(p.width - 220, 20, progressWidth, 20, 10);
    p.pop();
  }

  drawCard(card, pos, p, isSelected = false, isTestCard = false) {
    p.push();
    
    // 카드 배경
    p.fill(255);
    if (isSelected) {
      p.strokeWeight(4);
      p.stroke(255, 193, 7); // 노란색 강조
    } else {
      p.strokeWeight(2);
      p.stroke(0);
    }
    p.rect(pos.x, pos.y, pos.width, pos.height, 8);
    
    // 카드 내용 그리기
    const shapeSize = 25;
    const startY = pos.y + 30;
    const spacing = (pos.height - 60) / 4;
    
    // 색상 설정
    const colorMap = {
      'red': [244, 67, 54],
      'green': [76, 175, 80],
      'blue': [33, 150, 243],
      'yellow': [255, 193, 7]
    };
    p.fill(colorMap[card.color]);
    p.noStroke();
    
    // 모양 그리기
    for (let i = 0; i < card.number; i++) {
      const y = startY + i * spacing;
      const x = pos.x + pos.width / 2;
      
      this.drawShape(card.shape, x, y, shapeSize, p);
    }
    
    // 테스트 카드 표시
    if (isTestCard) {
      p.fill(0);
      p.textAlign(p.CENTER);
      p.textSize(14);
      p.text('이 카드를 분류하세요', pos.x + pos.width/2, pos.y - 10);
    }
    
    p.pop();
  }

  drawShape(shape, x, y, size, p) {
    p.push();
    p.translate(x, y);
    
    switch(shape) {
      case 'circle':
        p.ellipse(0, 0, size * 2);
        break;
        
      case 'cross':
        p.rectMode(p.CENTER);
        p.rect(0, 0, size * 2, size * 0.4);
        p.rect(0, 0, size * 0.4, size * 2);
        break;
        
      case 'triangle':
        p.beginShape();
        p.vertex(0, -size);
        p.vertex(-size * 0.866, size * 0.5);
        p.vertex(size * 0.866, size * 0.5);
        p.endShape(p.CLOSE);
        break;
        
      case 'star':
        // 5각 별
        p.beginShape();
        for (let i = 0; i < 10; i++) {
          const angle = p.TWO_PI * i / 10 - p.HALF_PI;
          const r = i % 2 === 0 ? size : size * 0.5;
          p.vertex(r * p.cos(angle), r * p.sin(angle));
        }
        p.endShape(p.CLOSE);
        break;
    }
    
    p.pop();
  }

  drawFeedback(state, p) {
    p.push();
    p.textAlign(p.CENTER);
    p.textSize(48);
    p.textStyle(p.BOLD);
    
    if (state.wasCorrect) {
      p.fill(76, 175, 80);
      p.text('정답!', p.width/2, p.height/2);
    } else {
      p.fill(244, 67, 54);
      p.text('오답', p.width/2, p.height/2);
    }
    
    p.pop();
  }

  handleMousePress(state, x, y, p) {
    if (state.responded || state.showFeedback) return;
    
    // 기준 카드 클릭 확인
    for (let i = 0; i < 4; i++) {
      const pos = state.referencePositions[i];
      if (x >= pos.x && x <= pos.x + pos.width &&
          y >= pos.y && y <= pos.y + pos.height) {
        
        // 정답 확인
        const isCorrect = this.checkAnswer(
          state.currentCard, 
          state.referenceCards[i], 
          state.currentRule
        );
        
        // 응답 기록
        this.taskData.responses.push({
          trial: state.currentTrial,
          card: {...state.currentCard},
          selectedReference: i,
          rule: state.currentRule,
          correct: isCorrect,
          rt: p.millis() - (state.trialStartTime || p.millis()),
          categoriesCompleted: state.categoriesCompleted
        });
        
        // 상태 업데이트
        state.responded = true;
        state.lastResponse = i;
        state.wasCorrect = isCorrect;
        state.showFeedback = true;
        state.feedbackEndTime = p.millis() + 1000;
        
        // 연속 정답 처리
        if (isCorrect) {
          state.consecutiveCorrect++;
          
          // 규칙 변경 확인
          if (state.consecutiveCorrect >= state.criteriaForChange) {
            state.categoriesCompleted++;
            state.consecutiveCorrect = 0;
            
            // 다음 규칙으로
            state.currentRuleIndex = (state.currentRuleIndex + 1) % state.rules.length;
            state.currentRule = state.rules[state.currentRuleIndex];
            
            // 규칙 변경 기록
            this.taskData.events.push({
              type: 'ruleChange',
              trial: state.currentTrial,
              newRule: state.currentRule,
              categoriesCompleted: state.categoriesCompleted
            });
          }
        } else {
          state.consecutiveCorrect = 0;
        }
        
        // 에러 타입 분류
        if (!isCorrect && state.currentTrial > 0) {
          const errorType = this.classifyError(state, i);
          this.taskData.responses[this.taskData.responses.length - 1].errorType = errorType;
        }
        
        break;
      }
    }
  }

  checkAnswer(testCard, referenceCard, rule) {
    switch(rule) {
      case 'color':
        return testCard.color === referenceCard.color;
      case 'shape':
        return testCard.shape === referenceCard.shape;
      case 'number':
        return testCard.number === referenceCard.number;
      default:
        return false;
    }
  }

  classifyError(state, selectedIndex) {
    const lastResponse = this.taskData.responses[this.taskData.responses.length - 2];
    if (!lastResponse) return 'other';
    
    // 보속 오류: 이전에 맞았던 규칙을 계속 사용
    const previousRules = state.rules.filter(r => r !== state.currentRule);
    for (let rule of previousRules) {
      if (this.checkAnswer(state.currentCard, state.referenceCards[selectedIndex], rule)) {
        return 'perseverative';
      }
    }
    
    return 'non-perseverative';
  }

  calculateScore() {
    const responses = this.taskData.responses;
    if (responses.length === 0) return 0;
    
    // WCST 표준 지표들
    const totalErrors = responses.filter(r => !r.correct).length;
    const perseverativeErrors = responses.filter(r => r.errorType === 'perseverative').length;
    const nonPerseverativeErrors = responses.filter(r => r.errorType === 'non-perseverative').length;
    const categoriesCompleted = Math.max(...responses.map(r => r.categoriesCompleted || 0));
    
    // 반응시간 분석
    const correctResponses = responses.filter(r => r.correct);
    const avgRT = correctResponses.length > 0
      ? correctResponses.reduce((sum, r) => sum + r.rt, 0) / correctResponses.length
      : 0;
    
    // 학습 곡선 분석 (첫 범주 완성까지 걸린 시행 수)
    const firstCategoryTrial = responses.findIndex(r => r.categoriesCompleted > 0);
    const trialsToFirstCategory = firstCategoryTrial >= 0 ? firstCategoryTrial + 1 : responses.length;
    
    // 개념 형성 수준 (Conceptual Level Response)
    let conceptualResponses = 0;
    for (let i = 0; i < responses.length - 2; i++) {
      if (responses[i].correct && responses[i+1].correct && responses[i+2].correct) {
        conceptualResponses += 3;
        i += 2;
      }
    }
    const conceptualLevel = (conceptualResponses / responses.length) * 100;
    
    // 분석 결과 저장
    this.taskData.analysis = {
      totalTrials: responses.length,
      totalErrors: totalErrors,
      perseverativeErrors: perseverativeErrors,
      nonPerseverativeErrors: nonPerseverativeErrors,
      categoriesCompleted: categoriesCompleted,
      trialsToFirstCategory: trialsToFirstCategory,
      conceptualLevel: conceptualLevel,
      averageRT: avgRT
    };
    
    // 종합 점수 계산
    // 범주 완성 수를 주요 지표로, 오류율을 보조 지표로 사용
    const categoryScore = (categoriesCompleted / 6) * 50; // 최대 6개 범주
    const errorPenalty = (totalErrors / responses.length) * 30;
    const efficiencyBonus = Math.max(0, 20 - (trialsToFirstCategory - 10));
    
    return Math.round(Math.max(0, Math.min(100, 
      categoryScore + efficiencyBonus + (50 - errorPenalty)
    )));
  }
}