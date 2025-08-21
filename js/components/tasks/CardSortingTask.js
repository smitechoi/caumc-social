import { BaseTask } from './BaseTask.js';

export class CardSortingTask extends BaseTask {
  getTutorial() {
    const t = (key, params) => {
      if (window.translationService && window.translationService.t) {
        return window.translationService.t(key, params);
      }
      // 기본 한국어 번역
      const fallback = {
        cardSortingTitle: '카드 정렬 검사',
        cardSortingInstruction1: '화면에 카드들이 나타납니다.',
        cardSortingInstruction2: '목표 배열과 동일하게 카드를 정렬하세요.',
        cardSortingRules: '규칙',
        cardSortingRule1: '한 번에 한 장씩만 이동할 수 있습니다',
        cardSortingRule2: '카드를 클릭한 후 목표 위치를 클릭하세요',
        cardSortingRule3: '최소한의 이동으로 목표를 달성하세요',
        cardSortingRule4: '이동 횟수가 기록됩니다',
        cardSortingInstruction3: '정확하고 빠르게 정렬하세요.'
      };
      return fallback[key] || key;
    };
    return {
      title: t('cardSortingTitle'),
      content: `
        <p>${t('cardSortingInstruction1')}</p>
        <p>${t('cardSortingInstruction2')}</p>
        <div style="text-align: center; margin: 30px 0;">
          <p style="font-size: 20px; color: #2196F3;">${t('cardSortingRules')}:</p>
          <p>• ${t('cardSortingRule1')}</p>
          <p>• ${t('cardSortingRule2')}</p>
          <p>• ${t('cardSortingRule3')}</p>
          <p>• ${t('cardSortingRule4')}</p>
        </div>
        <p style="color: #666;">${t('cardSortingInstruction3')}</p>
      `
    };
  }

  getTaskName() {
    return 'Card Sorting Task';
  }

  initializeState(state, p) {
    // 카드 종류 (색상만, 더 선명한 색상 사용)
    state.cardTypes = [
      { color: [255, 59, 48], id: 1 },      // 선명한 빨강
      { color: [0, 122, 255], id: 2 },      // 선명한 파랑
      { color: [52, 199, 89], id: 3 },      // 선명한 초록
      { color: [255, 204, 0], id: 4 },      // 선명한 노랑
      { color: [175, 82, 222], id: 5 }      // 선명한 보라
    ];
    
    // 난이도별 문제 설정
    state.problems = this.generateProblems();
    state.currentProblem = 0;
    state.maxProblems = 12;
    
    // 현재 문제 설정
    this.setupProblem(state, state.problems[state.currentProblem]);
    
    // 상호작용 상태
    state.selectedCard = null;
    state.selectedColumn = -1;
    state.moves = 0;
    state.startTime = p.millis();
    state.showSuccess = false;
    state.processingSuccess = false;
    
    // 레이아웃 설정
    const cardWidth = 90;
    const cardHeight = 60;  // 더 낮은 높이로 여러 장이 보이도록
    const columnWidth = 120;
    const cardSpacing = 20; // 카드 간 간격
    
    // 목표 배열 위치
    state.targetLayout = {
      x: p.width / 2 - (3 * columnWidth) / 2,
      y: 100,
      columns: 3,
      columnWidth: columnWidth,
      cardWidth: cardWidth,
      cardHeight: cardHeight,
      cardSpacing: cardSpacing
    };
    
    // 현재 배열 위치
    state.currentLayout = {
      x: p.width / 2 - (3 * columnWidth) / 2,
      y: p.height / 2 + 30,
      columns: 3,
      columnWidth: columnWidth,
      cardWidth: cardWidth,
      cardHeight: cardHeight,
      cardSpacing: cardSpacing
    };
  }

  generateProblems() {
    return [
      // 난이도 1: 간단한 이동
      {
        difficulty: 1,
        target: [[1], [2], [3]],
        initial: [[1, 2, 3], [], []],
        description: "기본 이동"
      },
      {
        difficulty: 1,
        target: [[3], [2], [1]],
        initial: [[1, 2, 3], [], []],
        description: "역순 정렬"
      },
      
      // 난이도 2: 중간 복잡도
      {
        difficulty: 2,
        target: [[1, 3], [2], [4]],
        initial: [[1, 2], [3, 4], []],
        description: "교차 이동"
      },
      {
        difficulty: 2,
        target: [[2, 4], [1, 3], []],
        initial: [[1, 2, 3, 4], [], []],
        description: "분할 정렬"
      },
      
      // 난이도 3: 복잡한 패턴
      {
        difficulty: 3,
        target: [[4], [3, 2], [1]],
        initial: [[1, 2], [3], [4]],
        description: "피라미드"
      },
      {
        difficulty: 3,
        target: [[1, 4], [2, 5], [3]],
        initial: [[1, 2, 3], [4, 5], []],
        description: "교대 배치"
      },
      
      // 난이도 4: 매우 복잡
      {
        difficulty: 4,
        target: [[5, 1], [4, 2], [3]],
        initial: [[1, 2, 3, 4, 5], [], []],
        description: "지그재그"
      },
      {
        difficulty: 4,
        target: [[3, 1], [4], [5, 2]],
        initial: [[1, 2], [3, 4, 5], []],
        description: "복잡한 재배열"
      },
      
      // 추가 문제들
      {
        difficulty: 2,
        target: [[2], [1, 4], [3]],
        initial: [[1, 2, 3], [4], []],
        description: "중간 삽입"
      },
      {
        difficulty: 3,
        target: [[4, 2], [3], [5, 1]],
        initial: [[1], [2, 3, 4], [5]],
        description: "분산 재배열"
      },
      {
        difficulty: 3,
        target: [[1], [2, 4], [3, 5]],
        initial: [[5, 4, 3, 2, 1], [], []],
        description: "역순 분할"
      },
      {
        difficulty: 4,
        target: [[5, 3, 1], [4, 2], []],
        initial: [[1], [2, 3], [4, 5]],
        description: "최종 도전"
      }
    ];
  }

  setupProblem(state, problem) {
    // 목표 상태 설정
    state.targetState = problem.target.map(col => [...col]);
    
    // 초기 상태 설정
    state.currentState = problem.initial.map(col => [...col]);
    
    // 문제 정보
    state.currentDifficulty = problem.difficulty;
    state.problemDescription = problem.description;
  }

  render(state, p) {
    if (state.currentProblem >= state.maxProblems) {
      this.completeTask();
      return;
    }
    
    // 배경
    p.background(245);
    
    // 진행 상황
    this.drawProgress(state, p);
    
    const t = (key, params) => {
      if (window.translationService && window.translationService.t) {
        return window.translationService.t(key, params);
      }
      // 기본 한국어 번역
      const fallback = {
        targetArray: '목표 배열',
        currentArray: '현재 배열',
        moveCount: '이동 횟수',
        moveCard: '이동하세요'
      };
      return fallback[key] || key;
    };
    // 목표 상태 그리기
    this.drawCardArray(state, p, state.targetState, state.targetLayout, t('targetArray'), false);
    
    // 현재 상태 그리기
    this.drawCardArray(state, p, state.currentState, state.currentLayout, t('currentArray'), true);
    
    // 이동 정보
    this.drawMoveInfo(state, p);
    
    // 선택된 카드 하이라이트
    if (state.selectedCard !== null) {
      this.highlightPossibleMoves(state, p);
    }
    
    // 성공 메시지 표시
    if (state.showSuccess) {
      this.drawSuccessMessage(state, p);
    }
    
    // 성공 체크 (성공 메시지가 표시되지 않을 때만)
    if (!state.showSuccess && !state.processingSuccess && this.checkSuccess(state)) {
      this.handleSuccess(state, p);
    }
  }
  
  drawSuccessMessage(state, p) {
    p.push();
    p.fill(255, 255, 255, 240);
    p.rect(0, 0, p.width, p.height);
    
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(48);
    p.fill(76, 175, 80);
    p.text('완료!', p.width / 2, p.height / 2 - 50);
    
    p.textSize(24);
    p.fill(0);
    const t = (key) => {
      if (window.translationService && window.translationService.t) {
        return window.translationService.t(key);
      }
      const fallback = { moveCount: '이동 횟수' };
      return fallback[key] || key;
    };
    p.text(`${t('moveCount')}: ${state.moves}`, p.width / 2, p.height / 2);
    
    p.pop();
  }

  drawProgress(state, p) {
    p.push();
    p.fill(255);
    p.noStroke();
    p.rect(0, 0, p.width, 60);
    
    p.fill(0);
    p.textAlign(p.LEFT);
    p.textSize(16);
    p.text(`${state.currentProblem + 1} / ${state.maxProblems}`, 20, 25);
    p.text(`${'★'.repeat(state.currentDifficulty)}`, 20, 45);
    
    // 진행률 바
    const progressWidth = (state.currentProblem / state.maxProblems) * 200;
    p.fill(230);
    p.rect(p.width - 220, 20, 200, 20, 10);
    p.fill(76, 175, 80);
    p.rect(p.width - 220, 20, progressWidth, 20, 10);
    
    p.pop();
  }

  drawCardArray(state, p, cardArray, layout, title, isInteractive) {
    p.push();
    
    // 제목
    p.textAlign(p.CENTER);
    p.textSize(18);
    p.fill(0);
    p.text(title, layout.x + (layout.columns * layout.columnWidth) / 2, layout.y - 20);
    
    // 열 그리기
    for (let col = 0; col < layout.columns; col++) {
      const x = layout.x + col * layout.columnWidth;
      
      // 열 배경
      p.fill(240);
      p.stroke(200);
      p.strokeWeight(2);
      p.rect(x, layout.y, layout.cardWidth, 250, 5);
      
      // 열 번호
      p.fill(150);
      p.noStroke();
      p.textAlign(p.CENTER);
      p.textSize(14);
      p.text(col + 1, x + layout.cardWidth / 2, layout.y + 270);
      
      // 카드 그리기
      const cards = cardArray[col] || [];
      for (let i = 0; i < cards.length; i++) {
        const cardNum = cards[i];
        const cardType = state.cardTypes[cardNum - 1];
        const cardY = layout.y + 180 - i * layout.cardSpacing; // 아래에서 위로 쌓기, 간격 좁게
        
        const isTopCard = i === cards.length - 1;
        const isSelected = isInteractive && 
                          state.selectedColumn === col && 
                          isTopCard;
        
        this.drawCard(p, x + (layout.cardWidth - layout.cardWidth * 0.9) / 2, 
                     cardY, layout.cardWidth * 0.9, layout.cardHeight, 
                     cardType, isSelected, isTopCard);
      }
    }
    
    p.pop();
  }

  drawCard(p, x, y, width, height, cardType, isSelected, isTopCard) {
    p.push();
    
    // 카드 그림자 (맨 위 카드만)
    if (isTopCard) {
      p.fill(0, 0, 0, 30);
      p.noStroke();
      p.rect(x + 2, y + 2, width, height, 8);
    }
    
    // 카드 테두리
    if (isSelected) {
      p.stroke(255, 204, 0);
      p.strokeWeight(4);
    } else if (isTopCard) {
      p.stroke(100);
      p.strokeWeight(2);
    } else {
      p.stroke(150);
      p.strokeWeight(1);
    }
    
    // 카드 색상 채우기 (전체를 색상으로)
    p.fill(cardType.color);
    p.rect(x, y, width, height, 8);
    
    // 맨 위 카드에만 하이라이트 효과
    if (isTopCard) {
      p.push();
      p.fill(255, 255, 255, 30);
      p.noStroke();
      p.rect(x + 5, y + 5, width * 0.3, height * 0.3, 4);
      p.pop();
    }
    
    p.pop();
  }

  drawMoveInfo(state, p) {
    p.push();
    
    // 사이드바 영역 설정 (오른쪽)
    const sidebarX = state.currentLayout.x + (state.currentLayout.columns * state.currentLayout.columnWidth) + 50;
    const sidebarY = state.currentLayout.y + 50;
    
    // 사이드바 배경
    p.fill(255, 255, 255, 200);
    p.stroke(200);
    p.strokeWeight(1);
    p.rect(sidebarX - 10, sidebarY - 30, 200, 120, 8);
    
    // 이동 횟수 표시
    p.fill(0);
    p.textAlign(p.LEFT);
    p.textSize(16);
    const t = (key) => {
      if (window.translationService && window.translationService.t) {
        return window.translationService.t(key);
      }
      const fallback = { 
        moveCount: '이동 횟수',
        moveCard: '이동하세요'
      };
      return fallback[key] || key;
    };
    p.text(`${t('moveCount')}: ${state.moves}`, sidebarX, sidebarY);
    
    // 선택된 카드가 있을 때 안내문구
    if (state.selectedCard !== null) {
      p.fill(33, 150, 243);
      p.textSize(14);
      p.text(t('placeCardHere'), sidebarX, sidebarY + 25);
      p.text(t('selectHere'), sidebarX, sidebarY + 45);
    } else {
      // 기본 안내문구
      p.fill(100);
      p.textSize(14);
      p.text(t('clickTopCard'), sidebarX, sidebarY + 25);
      p.text(t('moveCard'), sidebarX, sidebarY + 45);
    }
    
    p.pop();
  }

  highlightPossibleMoves(state, p) {
    p.push();
    p.fill(33, 150, 243, 50);
    p.noStroke();
    
    for (let col = 0; col < state.currentLayout.columns; col++) {
      if (col !== state.selectedColumn) {
        const x = state.currentLayout.x + col * state.currentLayout.columnWidth;
        p.rect(x, state.currentLayout.y, state.currentLayout.cardWidth, 250, 5);
      }
    }
    p.pop();
  }

  handleMousePress(state, x, y, p) {
    // 성공 처리 중이면 입력 무시
    if (state.showSuccess || state.processingSuccess) return;
    
    // 현재 배열 영역 확인
    const layout = state.currentLayout;
    
    if (y >= layout.y && y <= layout.y + 250) {
      const col = Math.floor((x - layout.x) / layout.columnWidth);
      
      if (col >= 0 && col < layout.columns) {
        if (state.selectedCard === null) {
          // 카드 선택
          if (state.currentState[col].length > 0) {
            state.selectedCard = state.currentState[col][state.currentState[col].length - 1];
            state.selectedColumn = col;
          }
        } else {
          // 카드 이동
          if (col !== state.selectedColumn) {
            this.moveCard(state, state.selectedColumn, col);
            state.selectedCard = null;
            state.selectedColumn = -1;
            state.moves++;
          } else {
            // 선택 취소
            state.selectedCard = null;
            state.selectedColumn = -1;
          }
        }
      }
    }
  }

  moveCard(state, fromCol, toCol) {
    if (state.currentState[fromCol].length > 0) {
      const card = state.currentState[fromCol].pop();
      state.currentState[toCol].push(card);
      
      // 이동 기록
      this.taskData.responses.push({
        problem: state.currentProblem,
        move: state.moves + 1,
        from: fromCol,
        to: toCol,
        card: card,
        timestamp: Date.now() - state.startTime
      });
    }
  }

  checkSuccess(state) {
    for (let col = 0; col < 3; col++) {
      if (state.currentState[col].length !== state.targetState[col].length) {
        return false;
      }
      for (let i = 0; i < state.currentState[col].length; i++) {
        if (state.currentState[col][i] !== state.targetState[col][i]) {
          return false;
        }
      }
    }
    return true;
  }

  handleSuccess(state, p) {
    // 이미 처리 중이면 무시
    if (state.processingSuccess) return;
    state.processingSuccess = true;
    
    // 성공 데이터 기록
    const problemData = {
      problem: state.currentProblem,
      difficulty: state.currentDifficulty,
      moves: state.moves,
      time: p.millis() - state.startTime,
      success: true
    };
    
    this.taskData.events.push(problemData);
    
    // 성공 메시지 표시
    state.showSuccess = true;
    state.successStartTime = p.millis();
    
    // 다음 문제로
    setTimeout(() => {
      state.currentProblem++;
      if (state.currentProblem < state.maxProblems) {
        this.setupProblem(state, state.problems[state.currentProblem]);
        state.moves = 0;
        state.selectedCard = null;
        state.selectedColumn = -1;
        state.startTime = p.millis();
        state.showSuccess = false;
        state.processingSuccess = false;
      }
    }, 2000);
  }

  calculateScore() {
    const events = this.taskData.events;
    if (!events || events.length === 0) return 0;
    
    // 완료율
    const completionRate = (events.length / 12) * 30; // 최대 30점
    
    // 평균 이동 횟수 (적을수록 좋음)
    const avgMoves = events.reduce((sum, e) => sum + e.moves, 0) / events.length;
    const moveScore = Math.max(0, 40 - avgMoves * 2); // 최대 40점
    
    // 난이도별 성공
    let difficultyScore = 0;
    for (let d = 1; d <= 4; d++) {
      const solved = events.filter(e => e.difficulty === d).length;
      if (solved > 0) {
        difficultyScore += d * 2.5 * solved; // 난이도별 가중치
      }
    }
    difficultyScore = Math.min(30, difficultyScore); // 최대 30점
    
    return Math.round(completionRate + moveScore + difficultyScore);
  }
}