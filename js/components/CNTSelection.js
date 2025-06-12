export class CNTSelection {
  constructor(containerId, patientData) {
    this.container = document.getElementById(containerId);
    this.patientData = patientData;
    this.render();
  }

  render() {
    this.container.innerHTML = `
        <div class="selection-container">
          <div class="selection-header">
            <button onclick="window.location.hash='#dashboard'" class="back-btn">← 뒤로</button>
            <h2>인지 기능 검사 선택</h2>
          </div>
          
          <div class="task-grid">
            ${this.renderTasks()}
          </div>
        </div>
      `;
  }

  renderTasks() {
    const tasks = Object.entries(this.patientData.cnt || {});

    return tasks.map(([key, task], index) => {
      const isCompleted = task.isDone;
      const taskNumber = index + 1;

      return `
          <div class="task-card ${isCompleted ? 'completed' : ''}" 
               ${!isCompleted ? `onclick="window.cntSelectionInstance.selectTask('${key}')"` : ''}>
            <div class="task-icon">${this.getTaskIcon(key)}</div>
            <h3>${this.getTaskName(key)}</h3>
            <div class="task-info">
              <p>예상 시간: ${this.getTaskDuration(key)}</p>
              ${isCompleted ?
          `<p class="score">점수: ${task.score}점</p>` :
          '<p class="status">미완료</p>'
        }
            </div>
            <div class="task-description">
              <p>${this.getTaskDescription(key)}</p>
            </div>
            <div class="task-status">
              ${isCompleted ?
          '<span class="completed-badge">✓ 완료됨</span>' :
          '<button class="start-btn">시작하기</button>'
        }
            </div>
          </div>
        `;
    }).join('');
  }

  selectTask(taskKey) {
    window.selectedTask = taskKey;
    window.location.hash = '#cnt';
  }
  getTaskName(key) {
    const names = {
      task1: '스트룹 검사',
      task2: 'N-Back 검사',
      task3: 'Go/No-Go 검사',
      task4: '표정 인식 검사',
      task5: '3D 회전 검사'
    };
    return names[key] || key;
  }

  getTaskIcon(key) {
    const icons = {
      task1: '🎨',
      task2: '🧠',
      task3: '🚦',
      task4: '😊',
      task5: '🔲'
    };
    return icons[key] || '📝';
  }

  getTaskDuration(key) {
    const durations = {
      task1: '2분',
      task2: '3분',
      task3: '2.5분',
      task4: '3분',
      task5: '4분'
    };
    return durations[key] || '3분';
  }

  getTaskDescription(key) {
    const descriptions = {
      task1: '색깔 단어의 의미가 아닌 글자 색을 판단',
      task2: '연속 자극 중 N개 전 자극과의 일치 여부 판단',
      task3: '특정 자극에만 반응하고 다른 자극은 억제',
      task4: '얼굴 표정을 보고 감정 상태 파악',
      task5: '3D 도형이 같은지 다른지 판단'
    };
    return descriptions[key] || '';
  }
}

// 전역 인스턴스
window.cntSelectionInstance = null;

// CSS 스타일
const style = document.createElement('style');
style.textContent = `
    .task-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 20px;
    }
    
    .task-card {
      background: white;
      border: 2px solid #e0e0e0;
      border-radius: 8px;
      padding: 20px;
      cursor: pointer;
      transition: all 0.3s;
      display: flex;
      flex-direction: column;
    }
    
    .task-card:not(.completed):hover {
      border-color: #2196F3;
      box-shadow: 0 8px 20px rgba(33, 150, 243, 0.4);
      transform: translateY(-4px);
      background: linear-gradient(to bottom, #E3F2FD, white);
    }
    
    .task-card:not(.completed):hover .task-icon {
      transform: scale(1.2) rotate(5deg);
      transition: transform 0.3s ease;
    }
    
    .task-card:not(.completed):hover .start-btn {
      background: #1976D2;
      transform: scale(1.05);
      box-shadow: 0 4px 8px rgba(25, 118, 210, 0.3);
    }
    
    .task-card.completed {
      background: #f9f9f9;
      border-color: #4CAF50;
      cursor: default;
    }
    
    .task-icon {
      font-size: 40px;
      margin-bottom: 15px;
      text-align: center;
    }
    
    .task-card h3 {
      margin-bottom: 10px;
      color: #333;
      text-align: center;
    }
    
    .task-info {
      margin-bottom: 15px;
      color: #666;
      font-size: 14px;
      text-align: center;
    }
    
    .task-info p {
      margin: 5px 0;
    }
    
    .task-description {
      flex: 1;
      margin-bottom: 20px;
      font-size: 13px;
      color: #777;
      line-height: 1.5;
    }
    
    .task-status {
      text-align: center;
    }
  `;
document.head.appendChild(style);