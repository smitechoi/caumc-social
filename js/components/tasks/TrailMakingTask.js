import { BaseTask } from './BaseTask.js';

export class TrailMakingTask extends BaseTask {
  getTutorial() {
    return {
      title: '선로 잇기 검사 연습',
      content: `
        <p>화면에 숫자가 흩어져 나타납니다.</p>
        <p><strong>1부터 순서대로</strong> 터치하여 연결하세요.</p>
        <div style="text-align: center; margin: 30px 0;">
          <span style="display: inline-block; margin: 10px; padding: 20px; border: 3px solid #4CAF50; border-radius: 50%; width: 50px; height: 50px; line-height: 50px; font-weight: bold;">1</span>
          <span style="margin: 0 20px; font-size: 30px;">→</span>
          <span style="display: inline-block; margin: 10px; padding: 20px; border: 3px solid #FFC107; border-radius: 50%; width: 50px; height: 50px; line-height: 50px; font-weight: bold;">2</span>
          <span style="margin: 0 20px; font-size: 30px;">→</span>
          <span style="display: inline-block; margin: 10px; padding: 20px; border: 3px solid #333; border-radius: 50%; width: 50px; height: 50px; line-height: 50px; font-weight: bold;">3</span>
        </div>
        <p><strong>주의사항:</strong></p>
        <ul style="text-align: left; max-width: 400px; margin: 0 auto;">
          <li>잘못된 숫자를 터치하면 오류로 기록됩니다</li>
          <li>가능한 빠르게 연결하세요</li>
          <li>다음 연결할 숫자는 노란색으로 강조됩니다</li>
        </ul>
      `
    };
  }

  getTaskName() {
    return 'Trail Making Test';
  }

  initializeState(state, p) {
    state.nodes = [];
    state.nodeCount = 15; // 1-15까지
    state.currentNode = 1;
    state.connections = [];
    state.startTime = p.millis();
    state.errors = 0;
    state.completed = false;
    
    // 노드 크기와 여백
    const nodeSize = Math.min(80, p.width / 12);
    const margin = nodeSize;
    
    // 노드 위치 생성 (겹치지 않도록)
    const positions = this.generateNodePositions(state.nodeCount, nodeSize, margin, p);
    
    // 노드 객체 생성
    for (let i = 0; i < state.nodeCount; i++) {
      state.nodes.push({
        number: i + 1,
        x: positions[i].x,
        y: positions[i].y,
        size: nodeSize,
        connected: false
      });
    }
    
    this.taskData.errors = 0;
    this.taskData.startTime = state.startTime;
  }

  generateNodePositions(count, nodeSize, margin, p) {
    const positions = [];
    const minDistance = nodeSize * 1.5;
    
    for (let i = 0; i < count; i++) {
      let position;
      let attempts = 0;
      
      do {
        position = {
          x: p.random(margin + nodeSize/2, p.width - margin - nodeSize/2),
          y: p.random(margin + nodeSize/2 + 100, p.height - margin - nodeSize/2)
        };
        attempts++;
      } while (this.isTooClose(position, positions, minDistance) && attempts < 100);
      
      positions.push(position);
    }
    
    return positions;
  }

  isTooClose(position, positions, minDistance) {
    for (let pos of positions) {
      const distance = Math.sqrt(
        Math.pow(position.x - pos.x, 2) + 
        Math.pow(position.y - pos.y, 2)
      );
      if (distance < minDistance) return true;
    }
    return false;
  }

  render(state, p) {
    if (state.completed) {
      this.taskData.completionTime = p.millis() - state.startTime;
      this.taskData.errors = state.errors;
      this.completeTask();
      return;
    }
    
    // 배경
    p.push();
    p.fill(245);
    p.noStroke();
    p.rect(0, 100, p.width, p.height - 100);
    p.pop();
    
    // 연결선 그리기
    if (state.connections.length > 0) {
      p.push();
      p.stroke(100, 200, 100);
      p.strokeWeight(3);
      p.noFill();
      p.beginShape();
      for (let conn of state.connections) {
        p.vertex(conn.x, conn.y);
      }
      p.endShape();
      p.pop();
    }
    
    // 노드 그리기
    for (let node of state.nodes) {
      p.push();
      
      // 노드 스타일 설정
      if (node.connected) {
        // 연결된 노드
        p.fill(100, 200, 100);
        p.stroke(80, 160, 80);
        p.strokeWeight(3);
      } else if (node.number === state.currentNode) {
        // 다음 연결할 노드 (강조)
        p.fill(255, 235, 59);
        p.stroke(255, 193, 7);
        p.strokeWeight(4);
        
        // 펄스 효과
        const pulse = Math.sin(p.millis() * 0.005) * 5;
        node.displaySize = node.size + pulse;
      } else {
        // 일반 노드
        p.fill(255);
        p.stroke(100);
        p.strokeWeight(2);
        node.displaySize = node.size;
      }
      
      const size = node.displaySize || node.size;
      p.circle(node.x, node.y, size);
      
      // 숫자
      p.fill(node.connected ? 255 : 0);
      p.noStroke();
      p.textSize(Math.min(32, size * 0.6));
      p.textAlign(p.CENTER, p.CENTER);
      p.text(node.number, node.x, node.y);
      p.pop();
    }
    
    // 상태 정보 표시
    this.drawStatus(state, p);
  }

  drawStatus(state, p) {
    // 상단 정보 바
    p.push();
    p.fill(255);
    p.noStroke();
    p.rect(0, 0, p.width, 100);
    
    p.fill(0);
    p.textAlign(p.LEFT, p.CENTER);
    p.textSize(24);
    
    // 다음 숫자
    p.text(`다음: ${state.currentNode}`, 30, 30);
    
    // 오류
    p.fill(state.errors > 0 ? [255, 0, 0] : [0, 0, 0]);
    p.text(`오류: ${state.errors}`, 30, 60);
    
    // 시간
    p.fill(0);
    p.textAlign(p.RIGHT, p.CENTER);
    const elapsedTime = Math.floor((p.millis() - state.startTime) / 1000);
    const minutes = Math.floor(elapsedTime / 60);
    const seconds = elapsedTime % 60;
    p.text(`시간: ${minutes}:${seconds.toString().padStart(2, '0')}`, p.width - 30, 30);
    
    // 진행률
    const progress = ((state.currentNode - 1) / state.nodeCount) * 100;
    p.text(`진행: ${Math.round(progress)}%`, p.width - 30, 60);
    
    p.pop();
  }

  handleMousePress(state, x, y, p) {
    // 노드 터치 확인
    for (let node of state.nodes) {
      const distance = Math.sqrt(
        Math.pow(x - node.x, 2) + 
        Math.pow(y - node.y, 2)
      );
      
      if (distance < node.size / 2) {
        if (node.number === state.currentNode) {
          // 올바른 노드 터치
          node.connected = true;
          state.connections.push({ x: node.x, y: node.y });
          state.currentNode++;
          
          // 완료 확인
          if (state.currentNode > state.nodeCount) {
            state.completed = true;
          }
        } else if (!node.connected) {
          // 잘못된 노드 터치
          state.errors++;
          this.taskData.errors = state.errors;
          
          // 시각적 피드백
          this.showErrorFeedback(node, p);
        }
        break;
      }
    }
  }

  showErrorFeedback(node, p) {
    // 잠시 빨간색으로 표시
    p.push();
    p.fill(255, 0, 0, 100);
    p.noStroke();
    p.circle(node.x, node.y, node.size * 1.5);
    p.pop();
  }

  calculateScore() {
    const completionTime = this.taskData.completionTime || 300000; // 최대 5분
    const errors = this.taskData.errors || 0;
    
    // 시간 점수 (60초 기준, 빠를수록 높은 점수)
    const timeScore = Math.max(0, 100 - ((completionTime - 60000) / 2400));
    
    // 오류 감점 (오류당 5점)
    const errorPenalty = errors * 5;
    
    return Math.round(Math.max(0, Math.min(100, timeScore - errorPenalty)));
  }
}