import { BaseTask } from './BaseTask.js';

export class CardSortingTask extends BaseTask {
  getTutorial() {
    return {
      title: '카드 정렬 검사 연습',
      content: `
        <p>화면 상단에 <strong>목표 배열</strong>이 제시됩니다.</p>
        <p>하단의 카드들을 이동시켜 목표와 같은 배열을 만드세요.</p>
        <div style="text-align: center; margin: 30px 0;">
          <p style="font-size: 20px; color: #2196F3;">규칙:</p>
          <p>• 한 번에 <strong>한 장</strong>의 카드만 이동 가능</p>
          <p>• 각 열의 <strong>맨 위 카드</strong>만 이동 가능</p>
          <p>• 빈 열에도 카드를 놓을 수 있습니다</p>
          <p>• 최소한의 이동으로 목표를 달성하세요</p>
        </div>
        <p style="color: #666;">카드를 클릭한 후, 목표 위치를 클릭하세요.</p>
      `
    };
  }

  getTaskName() {
    return 'Card Sorting Task';
  }

  initializeState(state, p) {
    // 카드 종류 (색상과 숫자)
    state.cardTypes = [
      { color: [244, 67, 54], number: 1 },    // 빨강 1
      { color: [33, 150, 243], number: 2 },   // 파랑 2
      { color: [76, 175, 80], number: 3 },    // 초록 3
      { color: [255, 193, 7], number: 4 },    // 노랑 4
      { color: [156, 39, 176], number: 5 }    // 보라 5
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
    
    // 레이아웃 설정
    const cardWidth = 80;
    const cardHeight = 100;
    const columnWidth = 120;
    const spacing = 40;
    
    // 목표 배열 위치
    state.targetLayout = {
      x: p.width / 2 - (3 * columnWidth) / 2,
      y: 80,
      columns: 3,
      columnWidth: columnWidth,
      cardWidth: cardWidth,
      cardHeight: cardHeight
    };
    
    // 현재 배열 위치
    state.currentLayout = {
      x: p.width / 2 - (3 * columnWidth) / 2,
      y: p.height / 2 + 50,
      columns: 3,
      columnWidth: columnWidth,
      cardWidth: cardWidth,
      cardHeight: cardHeight
    };
  }

  generateProblems() {
    return [
      // 난이도 1: 간단한 이동 (2-3 moves)
      {
        difficulty: 1,
        minMoves: 2,
        target: [[1], [2], [3]],
        initial: [[1, 2, 3], [], []],
        description: "기본 이동"
      },
      {
        difficulty: 1,
        minMoves: 3,
        target: [[3], [2], [1]],
        initial: [[1, 2, 3], [], []],
        description: "역순 정렬"
      },
      
      // 난이도 2: 중간 복잡도 (4-5 moves)
      {
        difficulty: 2,
        minMoves: 4,
        target: [[1, 3], [2], [4]],
        initial: [[1, 2], [3, 4], []],
        description: "교차 이동"
      },
      {
        difficulty: 2,
        minMoves: 5,
        target: [[2, 4], [1, 3], []],
        initial: [[1, 2, 3, 4], [], []],
        description: "분할 정렬"
      },
      
      // 난이도 3: 복잡한 패턴 (6-7 moves)
      {
        difficulty: 3,
        minMoves: 6,
        target: [[4], [3, 2], [1]],
        initial: [[1, 2], [3], [4]],
        description: "피라미드"
      },
      {
        difficulty: 3,
        minMoves: 7,
        target: [[1, 4], [2, 5], [3]],
        initial: [[1, 2, 3], [4, 5], []],
        description: "교대 배치"
      },
      
      // 난이도 4: 매우 복잡 (8+ moves)
      {
        difficulty: 4,
        minMoves: 8,
        target: [[5, 1], [4, 2], [3]],
        initial: [[1, 2, 3, 4, 5], [], []],
        description: "지그재그"
      },
      {
        difficulty: 4,
        minMoves: 9,
        target: [[3, 1], [4], [5, 2]],
        initial: [[1, 2], [3, 4, 5], []],
        description: "복잡한 재배열"
      },
      
      // 추가 문제들
      {
        difficulty: 2,
        minMoves: 4,
        target: [[2], [1, 4], [3]],
        initial: [[1, 2, 3], [4], []],
        description: "중간 삽입"
      },
      {
        difficulty: 3,
        minMoves: 6,
        target: [[4, 2], [3], [5, 1]],
        initial: [[1], [2, 3, 4], [5]],
        description: "분산 재배열"
      },
      {
        difficulty: 3,
        minMoves: 7,
        target: [[1], [2, 4], [3, 5]],
        initial: [[5, 4, 3, 2, 1], [], []],
        description: "역순 분할"
      },
      {
        difficulty: 4,
        minMoves: 10,
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
    state.minMoves = problem.minMoves;
    state.problemDescription = problem.description;
  }

  render(state, p) {
    if (state.currentProblem >= state.maxProblems) {
      this.completeTask();
      return;
    }
    
    // 배경
    p.background(250);
    
    // 진행 상황
    this.drawProgress(state, p);
    
    // 목표 상태 그리기
    this.drawCardArray(state, p, state.targetState, state.targetLayout, '목표 배열', false);
    
    // 현재 상태 그리기
    this.drawCardArray(state, p, state.currentState, state.currentLayout, '현재 배열', true);
    
    // 이동 정보
    this.drawMoveInfo(state, p);
    
    // 선택된 카드 하이라이트
    if (state.selectedCard !== null) {
      this.highlightPossibleMoves(state, p);
    }
    
    // 성공 체크
    if (this.checkSuccess(state)) {
      this.handleSuccess(state, p);
    }
  }

  drawProgress(state, p) {
    p.push();
    p.fill(255);
    p.noStroke();
    p.rect(0, 0, p.width, 60);
    
    p.fill(0);
    p.textAlign(p.LEFT);
    p.textSize(16);
    p.text(`문제: ${state.currentProblem + 1} / ${state.maxProblems}`, 20, 25);
    p.text(`난이도: ${'★'.repeat(state.currentDifficulty)}`, 20, 45);
    
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
      p.rect(x, layout.y, layout.cardWidth, 300, 5);
      
      // 열 번호
      p.fill(150);
      p.noStroke();
      p.textAlign(p.CENTER);
      p.textSize(14);
      p.text(col + 1, x + layout.cardWidth / 2, layout.y + 320);
      
      // 카드 그리기
      const cards = cardArray[col] || [];
      for (let i = 0; i < cards.length; i++) {
        const cardNum = cards[i];
        const cardType = state.cardTypes[cardNum - 1];
        const cardY = layout.y + 200 - i * 30; // 아래에서 위로 쌓기
        
        const isSelected = isInteractive && 
                          state.selectedColumn === col && 
                          i === cards.length - 1;
        
        this.drawCard(p, x + (layout.cardWidth - layout.cardWidth * 0.8) / 2, 
                     cardY, layout.cardWidth * 0.8, layout.cardHeight * 0.8, 
                     cardType, isSelected);
      }
    }
    
    p.pop();
  }

  drawCard(p, x, y, width, height, cardType, isSelected) {
    p.push();
    
    // 카드 그림자
    if (isSelected) {
      p.fill(0, 0, 0, 50);
      p.noStroke();
      p.rect(x + 4, y + 4, width, height, 8);
    }
    
    // 카드 배경
    p.fill(255);
    p.stroke(isSelected ? [255, 193, 7] : 0);
    p.strokeWeight(isSelected ? 4 : 2);
    p.rect(x, y, width, height, 8);
    
    // 카드 색상
    p.fill(cardType.color);
    p.noStroke();
    p.rect(x + 10, y + 10, width - 20, height - 40, 5);
    
    // 카드 숫자
    p.fill(255);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(32);
    p.textStyle(p.BOLD);
    p.text(cardType.number, x + width / 2, y + height / 2 - 5);
    
    p.pop();
  }

  drawMoveInfo(state, p) {
    p.push();
    p.fill(0);
    p.textAlign(p.CENTER);
    p.textSize(16);
    
    const infoY = state.currentLayout.y - 40;
    p.text(`이동 횟수: ${state.moves} / 최소 이동: ${state.minMoves}`, p.width / 2, infoY);
    
    if (state.selectedCard !== null) {
      p.fill(33, 150, 243);
      p.text('카드를 놓을 위치를 선택하세요', p.width / 2, infoY + 25);
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
        p.rect(x, state.currentLayout.y, state.currentLayout.cardWidth, 300, 5);
      }
    }
    p.pop();
  }

  handleMousePress(state, x, y, p) {
    // 현재 배열 영역 확인
    const layout = state.currentLayout;
    
    if (y >= layout.y && y <= layout.y + 300) {
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
    // 성공 데이터 기록
    const problemData = {
      problem: state.currentProblem,
      difficulty: state.currentDifficulty,
      moves: state.moves,
      minMoves: state.minMoves,
      efficiency: state.minMoves / state.moves,
      time: p.millis() - state.startTime,
      success: true
    };
    
    this.taskData.events.push(problemData);
    
    // 성공 메시지 표시
    p.push();
    p.fill(255, 255, 255, 240);
    p.rect(0, 0, p.width, p.height);
    
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(48);
    p.fill(76, 175, 80);
    p.text('완료!', p.width / 2, p.height / 2 - 50);
    
    p.textSize(24);
    p.fill(0);
    p.text(`이동 횟수: ${state.moves} (최소: ${state.minMoves})`, p.width / 2, p.height / 2);
    
    if (state.moves === state.minMoves) {
      p.fill(255, 193, 7);
      p.text('완벽한 해결! ⭐', p.width / 2, p.height / 2 + 40);
    }
    p.pop();
    
    // 다음 문제로
    setTimeout(() => {
      state.currentProblem++;
      if (state.currentProblem < state.maxProblems) {
        this.setupProblem(state, state.problems[state.currentProblem]);
        state.moves = 0;
        state.selectedCard = null;
        state.selectedColumn = -1;
        state.startTime = p.millis();
      }
    }, 2000);
  }

  calculateScore() {
    const events = this.taskData.events;
    if (events.length === 0) return 0;
    
    // 평균 효율성 (최소 이동 / 실제 이동)
    const avgEfficiency = events.reduce((sum, e) => sum + e.efficiency, 0) / events.length;
    
    // 난이도별 성공률
    const difficultyScores = {};
    for (let d = 1; d <= 4; d++) {
      const problems = events.filter(e => e.difficulty === d);
      if (problems.length > 0) {
        const perfectSolutions = problems.filter(e => e.efficiency === 1).length;
        difficultyScores[d] = perfectSolutions / problems.length;
      }
    }
    
    // 평균 해결 시간
    const avgTime = events.reduce((sum, e) => sum + e.time, 0) / events.length;
    const timeBonus = Math.max(0, 20 - avgTime / 3000); // 3초당 1점 감점
    
    // 난이도 가중 점수
    let weightedScore = 0;
    let totalWeight = 0;
    for (let d = 1; d <= 4; d++) {
      if (difficultyScores[d] !== undefined) {
        weightedScore += difficultyScores[d] * d * 10;
        totalWeight += d;
      }
    }
    
    const difficultyBonus = totalWeight > 0 ? weightedScore / totalWeight : 0;
    
    // 종합 점수
    const efficiencyScore = avgEfficiency * 40; // 최대 40점
    const completionRate = (events.length / this.taskData.maxProblems) * 20; // 최대 20점
    
    return Math.round(Math.min(100, 
      efficiencyScore + difficultyBonus + completionRate + timeBonus
    ));
  }
}