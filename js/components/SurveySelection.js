export class SurveySelection {
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
            <h2>임상 척도 선택</h2>
          </div>
          
          <div class="scale-grid">
            ${this.renderScales()}
          </div>
        </div>
      `;
    }
  
    renderScales() {
      const scales = Object.entries(this.patientData.survey || {});
      
      return scales.map(([key, scale], index) => {
        const isCompleted = scale.isDone;
        const scaleNumber = index + 1;
        
        return `
          <div class="scale-card ${isCompleted ? 'completed' : ''}" 
               ${!isCompleted ? `onclick="window.surveySelectionInstance.selectScale('${key}')"` : ''}>
            <div class="scale-number">${scaleNumber}</div>
            <h3>${this.getScaleName(key)}</h3>
            <div class="scale-info">
              <p>문항 수: ${this.getQuestionCount(key)}개</p>
              ${isCompleted ? 
                `<p class="score">점수: ${scale.score}점</p>` : 
                '<p class="status">미완료</p>'
              }
            </div>
            <div class="scale-status">
              ${isCompleted ? 
                '<span class="completed-badge">✓ 완료됨</span>' : 
                '<button class="start-btn">시작하기</button>'
              }
            </div>
          </div>
        `;
      }).join('');
    }
  
    selectScale(scaleKey) {
      window.selectedScale = scaleKey;
      window.location.hash = '#survey';
    }
  
    getScaleName(key) {
      const names = {
        scale1: '우울 척도',
        scale2: '불안 척도',
        scale3: '스트레스 척도',
        scale4: '삶의 질'
      };
      return names[key] || key;
    }
  
    getQuestionCount(key) {
      const counts = {
        scale1: 20,
        scale2: 15,
        scale3: 10,
        scale4: 25
      };
      return counts[key] || 10;
    }
  }
  
  // 전역 인스턴스
  window.surveySelectionInstance = null;
  
  // CSS 스타일
  const style = document.createElement('style');
  style.textContent = `
    .selection-container {
      max-width: 800px;
      margin: 20px auto;
      padding: 20px;
    }
    
    .selection-header {
      display: flex;
      align-items: center;
      gap: 20px;
      margin-bottom: 30px;
    }
    
    .back-btn {
      padding: 8px 16px;
      background: #f5f5f5;
      border: 1px solid #ddd;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
    }
    
    .back-btn:hover {
      background: #e0e0e0;
    }
    
    .scale-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 20px;
    }
    
    .scale-card {
      background: white;
      border: 2px solid #e0e0e0;
      border-radius: 8px;
      padding: 20px;
      cursor: pointer;
      transition: all 0.3s;
      position: relative;
      overflow: hidden;
    }
    
    .scale-card:not(.completed):hover {
      border-color: #2196F3;
      box-shadow: 0 8px 16px rgba(33, 150, 243, 0.3);
      transform: translateY(-4px);
      background: linear-gradient(to bottom, #E3F2FD, white);
    }
    
    .scale-card:not(.completed):hover .scale-number {
      transform: scale(1.1);
      box-shadow: 0 4px 8px rgba(33, 150, 243, 0.4);
    }
    
    .scale-card:not(.completed):hover .start-btn {
      background: #1976D2;
      transform: scale(1.05);
    }
    
    .scale-card.completed {
      background: #f9f9f9;
      border-color: #4CAF50;
      cursor: default;
      opacity: 0.8;
    }
    
    .scale-number {
      width: 40px;
      height: 40px;
      background: #2196F3;
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      font-weight: bold;
      margin-bottom: 15px;
      transition: all 0.3s;
    }
    
    .scale-card.completed .scale-number {
      background: #4CAF50;
    }
    
    .scale-card h3 {
      margin-bottom: 15px;
      color: #333;
    }
    
    .scale-info {
      margin-bottom: 20px;
      color: #666;
      font-size: 14px;
    }
    
    .scale-info p {
      margin: 5px 0;
    }
    
    .score {
      color: #4CAF50;
      font-weight: bold;
    }
    
    .status {
      color: #ff9800;
    }
    
    .completed-badge {
      display: inline-block;
      padding: 6px 12px;
      background: #4CAF50;
      color: white;
      border-radius: 4px;
      font-size: 14px;
    }
    
    .start-btn {
      padding: 10px 20px;
      background: #2196F3;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 16px;
      width: 100%;
      transition: all 0.3s;
      font-weight: bold;
    }
    
    .start-btn:hover {
      background: #1976D2;
    }
  `;
  document.head.appendChild(style);