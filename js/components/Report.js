import { generateReportRecord } from '../firebase/crud.js';

export class Report {
  constructor(containerId, patientData) {
    this.container = document.getElementById(containerId);
    this.patientData = patientData;
    this.render();
  }

  render() {
    this.container.innerHTML = `
      <div class="report-container">
        <div class="report-header">
          <h1>검사 결과 리포트</h1>
          <div class="patient-info">
            <p><strong>이름:</strong> ${this.patientData.name}</p>
            <p><strong>생년월일:</strong> ${this.patientData.birthDate}</p>
            <p><strong>검사일:</strong> ${new Date().toLocaleDateString('ko-KR')}</p>
          </div>
        </div>
        
        <div class="report-content" id="report-content">
          <section class="survey-results">
            <h2>임상 척도 검사 결과</h2>
            <div id="survey-chart"></div>
            <div class="survey-details">
              ${this.renderSurveyDetails()}
            </div>
          </section>
          
          <section class="cnt-results">
            <h2>인지 기능 검사 결과</h2>
            <div id="cnt-chart"></div>
            <div class="cnt-details">
              ${this.renderCNTDetails()}
            </div>
          </section>
          
          <section class="clinical-impression">
            <h2>종합 소견</h2>
            <div class="impression-text">
              ${this.generateClinicalImpression()}
            </div>
          </section>
        </div>
        
        <div class="report-actions">
          <button onclick="window.reportInstance.saveReport('pdf')">PDF로 저장</button>
          <button onclick="window.reportInstance.saveReport('jpg')">이미지로 저장</button>
          <button onclick="window.print()">인쇄</button>
        </div>
      </div>
    `;

    window.reportInstance = this;
    
    // 차트 그리기
    setTimeout(() => {
      this.drawCharts();
    }, 100);
  }

  drawCharts() {
    // D3.js를 사용한 차트 그리기
    this.drawSurveyChart();
    this.drawCNTChart();
  }

  drawSurveyChart() {
    const data = Object.entries(this.patientData.survey).map(([key, value]) => ({
      scale: this.getScaleName(key),
      score: value.score,
      maxScore: value.questions.length * 4 // Likert 0-4
    }));

    const margin = {top: 20, right: 30, bottom: 40, left: 90};
    const width = 600 - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;

    const svg = d3.select("#survey-chart")
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // X축 스케일
    const x = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.maxScore)])
      .range([0, width]);

    // Y축 스케일
    const y = d3.scaleBand()
      .range([0, height])
      .domain(data.map(d => d.scale))
      .padding(0.1);

    // 바 그리기
    svg.selectAll("rect")
      .data(data)
      .enter()
      .append("rect")
      .attr("x", 0)
      .attr("y", d => y(d.scale))
      .attr("width", d => x(d.score))
      .attr("height", y.bandwidth())
      .attr("fill", "#2196F3");

    // 점수 텍스트
    svg.selectAll(".score-text")
      .data(data)
      .enter()
      .append("text")
      .attr("x", d => x(d.score) + 5)
      .attr("y", d => y(d.scale) + y.bandwidth() / 2)
      .attr("dy", ".35em")
      .text(d => `${d.score}/${d.maxScore}`);

    // 축 추가
    svg.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x));

    svg.append("g")
      .call(d3.axisLeft(y));
  }

  drawCNTChart() {
    const data = Object.entries(this.patientData.cnt).map(([key, value]) => ({
      task: this.getTaskName(key),
      score: value.score
    }));

    const margin = {top: 20, right: 30, bottom: 60, left: 40};
    const width = 600 - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;

    const svg = d3.select("#cnt-chart")
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // X축 스케일
    const x = d3.scaleBand()
      .range([0, width])
      .domain(data.map(d => d.task))
      .padding(0.1);

    // Y축 스케일
    const y = d3.scaleLinear()
      .domain([0, 100])
      .range([height, 0]);

    // 바 그리기
    svg.selectAll("rect")
      .data(data)
      .enter()
      .append("rect")
      .attr("x", d => x(d.task))
      .attr("y", d => y(d.score))
      .attr("width", x.bandwidth())
      .attr("height", d => height - y(d.score))
      .attr("fill", "#4CAF50");

    // 점수 텍스트
    svg.selectAll(".score-text")
      .data(data)
      .enter()
      .append("text")
      .attr("x", d => x(d.task) + x.bandwidth() / 2)
      .attr("y", d => y(d.score) - 5)
      .attr("text-anchor", "middle")
      .text(d => d.score);

    // 축 추가
    svg.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x))
      .selectAll("text")
      .attr("transform", "rotate(-45)")
      .style("text-anchor", "end");

    svg.append("g")
      .call(d3.axisLeft(y));

    // Y축 라벨
    svg.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 0 - margin.left)
      .attr("x", 0 - (height / 2))
      .attr("dy", "1em")
      .style("text-anchor", "middle")
      .text("점수");
  }

  renderSurveyDetails() {
    let html = '<table class="results-table">';
    html += '<tr><th>척도</th><th>점수</th><th>해석</th></tr>';
    
    Object.entries(this.patientData.survey).forEach(([key, value]) => {
      if (value.isDone) {
        const interpretation = this.interpretSurveyScore(key, value.score, value.questions.length);
        html += `
          <tr>
            <td>${this.getScaleName(key)}</td>
            <td>${value.score}/${value.questions.length * 4}</td>
            <td>${interpretation}</td>
          </tr>
        `;
      }
    });
    
    html += '</table>';
    return html;
  }

  renderCNTDetails() {
    let html = '<table class="results-table">';
    html += '<tr><th>검사</th><th>점수</th><th>수행 수준</th></tr>';
    
    Object.entries(this.patientData.cnt).forEach(([key, value]) => {
      if (value.isDone) {
        const level = this.interpretCNTScore(value.score);
        html += `
          <tr>
            <td>${this.getTaskName(key)}</td>
            <td>${value.score}</td>
            <td>${level}</td>
          </tr>
        `;
      }
    });
    
    html += '</table>';
    return html;
  }

  interpretSurveyScore(scale, score, questionCount) {
    const percentage = (score / (questionCount * 4)) * 100;
    if (percentage < 25) return '낮음';
    if (percentage < 50) return '경도';
    if (percentage < 75) return '중등도';
    return '높음';
  }

  interpretCNTScore(score) {
    if (score >= 90) return '매우 우수';
    if (score >= 75) return '우수';
    if (score >= 50) return '평균';
    if (score >= 25) return '경계선';
    return '손상 의심';
  }

  generateClinicalImpression() {
    const surveyScores = Object.values(this.patientData.survey)
      .filter(s => s.isDone)
      .map(s => s.score);
    const cntScores = Object.values(this.patientData.cnt)
      .filter(t => t.isDone)
      .map(t => t.score);
    
    const avgSurvey = surveyScores.reduce((a, b) => a + b, 0) / surveyScores.length || 0;
    const avgCNT = cntScores.reduce((a, b) => a + b, 0) / cntScores.length || 0;
    
    return `
      <p>검사 결과를 종합적으로 분석한 결과입니다:</p>
      <ul>
        <li>임상 척도 평균: ${avgSurvey.toFixed(1)}점</li>
        <li>인지 기능 평균: ${avgCNT.toFixed(1)}점</li>
      </ul>
      <p>상세한 해석을 위해서는 전문가와 상담하시기 바랍니다.</p>
    `;
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

  getTaskName(key) {
    const names = {
      task1: '스트룹',
      task2: 'N-Back',
      task3: 'Go/No-Go',
      task4: '선로잇기',
      task5: '숫자폭'
    };
    return names[key] || key;
  }

  async saveReport(format) {
    try {
      const reportElement = document.getElementById('report-content');
      
      if (format === 'pdf') {
        // PDF 생성 (html2pdf.js 사용 예정)
        await this.generatePDF(reportElement);
      } else if (format === 'jpg') {
        // JPG 생성 (html2canvas 사용 예정)
        await this.generateImage(reportElement);
      }
      
    } catch (error) {
      console.error('리포트 저장 오류:', error);
      alert('리포트 저장 중 오류가 발생했습니다.');
    }
  }

  async generatePDF(element) {
    // html2pdf.js 라이브러리 사용
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const fileName = `${this.patientData.name}_${this.patientData.birthDate.replace(/-/g, '')}_${timestamp}.pdf`;
    
    // PDF 생성 로직 (실제 구현 시 html2pdf.js 필요)
    console.log('PDF 생성:', fileName);
    
    // Firebase에 파일명 기록
    await generateReportRecord(
      this.patientData.name,
      this.patientData.birthDate,
      fileName
    );
    
    alert(`리포트가 생성되었습니다: ${fileName}`);
  }

  async generateImage(element) {
    // html2canvas 라이브러리 사용
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const fileName = `${this.patientData.name}_${this.patientData.birthDate.replace(/-/g, '')}_${timestamp}.jpg`;
    
    // 이미지 생성 로직 (실제 구현 시 html2canvas 필요)
    console.log('이미지 생성:', fileName);
    
    // Firebase에 파일명 기록
    await generateReportRecord(
      this.patientData.name,
      this.patientData.birthDate,
      fileName
    );
    
    alert(`리포트가 생성되었습니다: ${fileName}`);
  }
}

// CSS 스타일
const style = document.createElement('style');
style.textContent = `
  .report-container {
    max-width: 800px;
    margin: 20px auto;
    padding: 30px;
    background: white;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }
  
  .report-header {
    border-bottom: 2px solid #333;
    padding-bottom: 20px;
    margin-bottom: 30px;
  }
  
  .patient-info {
    display: flex;
    gap: 30px;
    margin-top: 15px;
  }
  
  .patient-info p {
    margin: 5px 0;
  }
  
  section {
    margin-bottom: 40px;
  }
  
  section h2 {
    color: #1976d2;
    margin-bottom: 20px;
  }
  
  .results-table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 20px;
  }
  
  .results-table th,
  .results-table td {
    border: 1px solid #ddd;
    padding: 12px;
    text-align: left;
  }
  
  .results-table th {
    background: #f5f5f5;
    font-weight: bold;
  }
  
  .clinical-impression {
    background: #f9f9f9;
    padding: 20px;
    border-radius: 8px;
  }
  
  .report-actions {
    margin-top: 40px;
    text-align: center;
    display: flex;
    gap: 10px;
    justify-content: center;
  }
  
  .report-actions button {
    padding: 12px 24px;
    font-size: 16px;
    border: none;
    border-radius: 4px;
    background: #2196F3;
    color: white;
  }
  
  .report-actions button:hover {
    background: #1976D2;
  }
  
  @media print {
    .report-actions {
      display: none;
    }
    
    .report-container {
      box-shadow: none;
      margin: 0;
      padding: 20px;
    }
  }
`;
document.head.appendChild(style);