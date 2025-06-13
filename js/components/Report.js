import { generateReportRecord } from '../firebase/crud.js';
import { translationService } from '../services/TranslationService.js';

export class Report {
  constructor(containerId, patientData) {
    this.container = document.getElementById(containerId);
    this.patientData = patientData;
    this.render();
  }

  render() {
    const t = (key, params) => translationService.t(key, params);
    
    this.container.innerHTML = `
      <div class="report-container" id="report-content">
        <div class="report-header">
          <button onclick="window.location.hash='#dashboard'" class="back-btn">← ${t('backToDashboard')}</button>
          <h1>${t('comprehensiveReport')}</h1>
          <div class="report-date">${t('reportDate')}: ${new Date().toLocaleDateString(this.getLocaleDateFormat())}</div>
        </div>
        
        <div class="patient-info-section">
          <h2>${t('patientInfo')}</h2>
          <div class="patient-details">
            <p><strong>${t('name')}:</strong> ${this.patientData.name}</p>
            <p><strong>${t('birthDate')}:</strong> ${this.patientData.birthDate}</p>
            <p><strong>${t('languageLabel')}:</strong> ${this.getLanguageName(this.patientData.language)}</p>
            <p><strong>${t('registrationNumberLabel')}:</strong> ${this.patientData.registrationNumber || 'N/A'}</p>
          </div>
        </div>
        
        <div class="completion-status">
          <p class="status-text">${this.getCompletionStatus()}</p>
        </div>
        
        <section class="survey-results">
          <h2>${t('clinicalScaleResults')}</h2>
          <div id="survey-chart" class="chart-container"></div>
          ${this.renderSurveyDetails()}
        </section>
        
        <section class="cnt-results">
          <h2>${t('cognitiveTestResults')}</h2>
          <div id="cnt-chart" class="chart-container"></div>
          ${this.renderCNTDetails()}
        </section>
        
        <section class="overall-impression">
          <h2>${t('overallImpression')}</h2>
          ${this.renderOverallImpression()}
        </section>
        
        <div class="report-actions">
          <button onclick="window.reportInstance.saveReport()" class="save-btn">
            <span class="btn-icon">💾</span> ${t('saveToGoogleDrive')}
          </button>
        </div>
      </div>
    `;
    
    window.reportInstance = this;
    
    // 차트 그리기
    setTimeout(() => {
      this.drawSurveyChart();
      this.drawCNTChart();
    }, 100);
  }

  getLocaleDateFormat() {
    const formats = {
      ko: 'ko-KR',
      en: 'en-US',
      ja: 'ja-JP',
      zh: 'zh-CN',
      vn: 'vi-VN',
      th: 'th-TH'
    };
    return formats[this.patientData.language] || 'ko-KR';
  }

  getCompletionStatus() {
    const t = (key, params) => translationService.t(key, params);
    const surveyDone = Object.values(this.patientData.survey).filter(s => s.isDone).length;
    const cntDone = Object.values(this.patientData.cnt).filter(t => t.isDone).length;
    
    return t('completionStatusText', {
      surveyDone,
      surveyTotal: 4,
      cntDone,
      cntTotal: 5
    });
  }

  renderSurveyDetails() {
    const t = (key, params) => translationService.t(key, params);
    let html = '<table class="results-table">';
    html += `<tr>
      <th>${t('scale')}</th>
      <th>${t('score')}</th>
      <th>${t('cutoffValue')}</th>
      <th>${t('status')}</th>
      <th>${t('interpretation')}</th>
    </tr>`;
    
    Object.entries(this.patientData.survey).forEach(([key, value]) => {
      if (value.isDone) {
        const cutoffScore = this.getCutoffScore(key);
        const maxScore = this.getMaxScore(key);
        const exceeded = value.score >= cutoffScore;
        
        // JSON에서 저장된 interpretation 사용
        const interpretation = value.interpretation || this.getDefaultInterpretation(key, value.score);
        
        html += `
          <tr class="${exceeded ? 'exceeded-cutoff' : ''}">
            <td>${this.getScaleName(key)}</td>
            <td>${value.score}/${maxScore}</td>
            <td>${cutoffScore}</td>
            <td>
              <span class="${exceeded ? 'status-exceeded' : 'status-normal'}">
                ${exceeded ? t('exceededCutoff') : t('normalRange')}
              </span>
            </td>
            <td class="interpretation">${interpretation.label}</td>
          </tr>
        `;
      }
    });
    
    // 완료된 척도가 없는 경우
    const completedScales = Object.values(this.patientData.survey).filter(s => s.isDone).length;
    if (completedScales === 0) {
      html += `<tr><td colspan="5" class="no-data">${t('noCompletedScale')}</td></tr>`;
    }
    
    html += '</table>';
    return html;
  }

  renderCNTDetails() {
    const t = (key, params) => translationService.t(key, params);
    let html = '<table class="results-table">';
    html += `<tr>
      <th>${t('test')}</th>
      <th>${t('score')}</th>
      <th>${t('performanceLevel')}</th>
      <th>${t('interpretation')}</th>
    </tr>`;
    
    Object.entries(this.patientData.cnt).forEach(([key, value]) => {
      if (value.isDone) {
        const performanceLevel = this.getCNTPerformanceLevel(value.score);
        const interpretation = this.getCNTInterpretation(key, value.score);
        
        html += `
          <tr>
            <td>${this.getTaskName(key)}</td>
            <td>${value.score}/100</td>
            <td class="performance-${performanceLevel.level}">${performanceLevel.label}</td>
            <td class="interpretation">${interpretation}</td>
          </tr>
        `;
      }
    });
    
    // 완료된 검사가 없는 경우
    const completedTasks = Object.values(this.patientData.cnt).filter(t => t.isDone).length;
    if (completedTasks === 0) {
      html += `<tr><td colspan="4" class="no-data">${t('noCompletedTest')}</td></tr>`;
    }
    
    html += '</table>';
    return html;
  }

  renderOverallImpression() {
    const t = (key, params) => translationService.t(key, params);
    let html = '<div class="overall-content">';
    
    // 검사 완료율
    const surveyCompleted = Object.values(this.patientData.survey).filter(s => s.isDone).length;
    const cntCompleted = Object.values(this.patientData.cnt).filter(t => t.isDone).length;
    const surveyProgress = (surveyCompleted / 4) * 100;
    const cntProgress = (cntCompleted / 5) * 100;
    
    html += `<h3>${t('testCompletionRate')}</h3>`;
    html += `<p>${t('clinicalScaleCompletion', { percent: Math.round(surveyProgress) })}</p>`;
    html += `<p>${t('cognitiveTestCompletion', { percent: Math.round(cntProgress) })}</p>`;
    
    // 주요 소견
    html += `<h3>${t('mainFindings')}</h3>`;
    
    // 임상 척도 중 경계값 초과 항목
    const exceededScales = Object.entries(this.patientData.survey)
      .filter(([key, value]) => value.isDone && value.score >= this.getCutoffScore(key));
    
    if (exceededScales.length > 0) {
      html += `<p>${t('exceededClinicalCutoff')}</p><ul>`;
      exceededScales.forEach(([key, value]) => {
        html += `<li>${this.getScaleName(key)}: ${value.score}/${this.getMaxScore(key)} (${t('criterion')}: ${this.getCutoffScore(key)})</li>`;
      });
      html += '</ul>';
    } else if (surveyCompleted > 0) {
      html += `<p>${t('allScalesNormal')}</p>`;
    }
    
    // 인지 기능 검사 요약
    if (cntCompleted > 0) {
      html += `<h3>${t('cognitiveSummary')}</h3>`;
      const avgScore = Object.values(this.patientData.cnt)
        .filter(t => t.isDone)
        .reduce((sum, t) => sum + t.score, 0) / cntCompleted;
      
      html += `<p>${t('averageScore', { score: Math.round(avgScore) })}</p>`;
      
      if (avgScore >= 80) {
        html += `<p>${t('excellentCognitive')}</p>`;
      } else if (avgScore >= 60) {
        html += `<p>${t('averageCognitive')}</p>`;
      } else {
        html += `<p>${t('difficultyCognitive')}</p>`;
      }
    }
    
    // 권장사항
    html += `<h3>${t('recommendations')}</h3><ul>`;
    
    if (exceededScales.length > 0) {
      html += `<li>${t('consultSpecialist')}</li>`;
    }
    
    if (surveyCompleted < 4 || cntCompleted < 5) {
      html += `<li>${t('completeAllTests')}</li>`;
    }
    
    html += `<li>${t('screeningPurpose')}</li>`;
    html += `<li>${t('professionalEvaluation')}</li>`;
    html += '</ul>';
    
    html += '</div>';
    return html;
  }

  // Chart drawing methods
  drawSurveyChart() {
    const completedScales = Object.entries(this.patientData.survey)
      .filter(([_, value]) => value.isDone);
    
    if (completedScales.length === 0) return;
    
    const data = completedScales.map(([key, value]) => ({
      scale: this.getScaleName(key),
      score: value.score,
      cutoff: this.getCutoffScore(key),
      max: this.getMaxScore(key)
    }));
    
    const margin = { top: 20, right: 30, bottom: 60, left: 60 };
    const width = 600 - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;
    
    const svg = d3.select('#survey-chart')
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);
    
    // Scales
    const x = d3.scaleBand()
      .domain(data.map(d => d.scale))
      .range([0, width])
      .padding(0.3);
    
    const y = d3.scaleLinear()
      .domain([0, d3.max(data, d => Math.max(d.score, d.cutoff, d.max))])
      .nice()
      .range([height, 0]);
    
    // Axes
    svg.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x))
      .selectAll('text')
      .style('text-anchor', 'end')
      .attr('dx', '-.8em')
      .attr('dy', '.15em')
      .attr('transform', 'rotate(-45)');
    
    svg.append('g')
      .call(d3.axisLeft(y));
    
    // Bars
    svg.selectAll('.bar')
      .data(data)
      .enter().append('rect')
      .attr('class', 'bar')
      .attr('x', d => x(d.scale))
      .attr('width', x.bandwidth())
      .attr('y', d => y(d.score))
      .attr('height', d => height - y(d.score))
      .attr('fill', d => d.score >= d.cutoff ? '#f44336' : '#4CAF50');
    
    // Cutoff lines
    svg.selectAll('.cutoff-line')
      .data(data)
      .enter().append('line')
      .attr('class', 'cutoff-line')
      .attr('x1', d => x(d.scale))
      .attr('x2', d => x(d.scale) + x.bandwidth())
      .attr('y1', d => y(d.cutoff))
      .attr('y2', d => y(d.cutoff))
      .attr('stroke', '#ff9800')
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '5,5');
  }

  drawCNTChart() {
    const completedTasks = Object.entries(this.patientData.cnt)
      .filter(([_, value]) => value.isDone);
    
    if (completedTasks.length === 0) return;
    
    const data = completedTasks.map(([key, value]) => ({
      task: this.getTaskName(key),
      score: value.score
    }));
    
    const margin = { top: 20, right: 30, bottom: 60, left: 60 };
    const width = 600 - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;
    
    const svg = d3.select('#cnt-chart')
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);
    
    // Scales
    const x = d3.scaleBand()
      .domain(data.map(d => d.task))
      .range([0, width])
      .padding(0.3);
    
    const y = d3.scaleLinear()
      .domain([0, 100])
      .range([height, 0]);
    
    // Axes
    svg.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x))
      .selectAll('text')
      .style('text-anchor', 'end')
      .attr('dx', '-.8em')
      .attr('dy', '.15em')
      .attr('transform', 'rotate(-45)');
    
    svg.append('g')
      .call(d3.axisLeft(y));
    
    // Bars with gradient colors
    const colorScale = d3.scaleSequential()
      .domain([0, 100])
      .interpolator(d3.interpolateRdYlGn);
    
    svg.selectAll('.bar')
      .data(data)
      .enter().append('rect')
      .attr('class', 'bar')
      .attr('x', d => x(d.task))
      .attr('width', x.bandwidth())
      .attr('y', d => y(d.score))
      .attr('height', d => height - y(d.score))
      .attr('fill', d => colorScale(d.score));
    
    // Score labels
    svg.selectAll('.score-label')
      .data(data)
      .enter().append('text')
      .attr('class', 'score-label')
      .attr('x', d => x(d.task) + x.bandwidth() / 2)
      .attr('y', d => y(d.score) - 5)
      .attr('text-anchor', 'middle')
      .text(d => d.score);
  }

  // Helper methods
  getCutoffScore(scale) {
    const cutoffs = {
      scale1: 16,  // CES-DC
      scale2: 22,  // BAI
      scale3: 65,  // K-AQ
      scale4: 19   // K-ARS
    };
    return cutoffs[scale] || 0;
  }

  getMaxScore(scale) {
    const maxScores = {
      scale1: 60,  // CES-DC: 20문항 × 3
      scale2: 63,  // BAI: 21문항 × 3
      scale3: 135, // K-AQ: 27문항 × 5
      scale4: 54   // K-ARS: 18문항 × 3
    };
    return maxScores[scale] || 100;
  }

  getCNTPerformanceLevel(score) {
    const t = (key) => translationService.t(key);
    if (score >= 90) return { level: 'excellent', label: t('veryExcellent') };
    if (score >= 75) return { level: 'good', label: t('excellent') };
    if (score >= 50) return { level: 'average', label: t('average') };
    if (score >= 25) return { level: 'below', label: t('belowAverage') };
    return { level: 'poor', label: t('suspected') };
  }

  getCNTInterpretation(task, score) {
    const t = (key) => translationService.t(key);
    
    const interpretations = {
      task1: { // Stroop
        high: t('stroopHigh'),
        average: t('stroopAverage'),
        low: t('stroopLow')
      },
      task2: { // N-Back
        high: t('nBackHigh'),
        average: t('nBackAverage'),
        low: t('nBackLow')
      },
      task3: { // Go/No-Go
        high: t('goNoGoHigh'),
        average: t('goNoGoAverage'),
        low: t('goNoGoLow')
      },
      task4: { // Emotion Recognition
        high: t('emotionHigh'),
        average: t('emotionAverage'),
        low: t('emotionLow')
      },
      task5: { // Mental Rotation
        high: t('rotationHigh'),
        average: t('rotationAverage'),
        low: t('rotationLow')
      }
    };
    
    const taskInterpretations = interpretations[task];
    if (!taskInterpretations) return '';
    
    if (score >= 75) return taskInterpretations.high;
    if (score >= 50) return taskInterpretations.average;
    return taskInterpretations.low;
  }

  getDefaultInterpretation(scale, score) {
    // 기본 해석 로직
    const interpretations = {
      scale1: { // CES-DC
        ranges: [
          { max: 15, level: 'normal', label: '정상', description: '우울 증상이 거의 없습니다.' },
          { max: 20, level: 'mild', label: '경도 우울', description: '가벼운 우울 증상이 있습니다.' },
          { max: 25, level: 'moderate', label: '중등도 우울', description: '중간 정도의 우울 증상이 있습니다.' },
          { max: 60, level: 'severe', label: '중증 우울', description: '심한 우울 증상이 있습니다.' }
        ]
      },
      scale2: { // BAI
        ranges: [
          { max: 21, level: 'normal', label: '정상', description: '불안 증상이 거의 없습니다.' },
          { max: 26, level: 'mild', label: '경도 불안', description: '가벼운 불안 증상이 있습니다.' },
          { max: 35, level: 'moderate', label: '중등도 불안', description: '중간 정도의 불안 증상이 있습니다.' },
          { max: 63, level: 'severe', label: '중증 불안', description: '심한 불안 증상이 있습니다.' }
        ]
      },
      scale3: { // K-AQ
        ranges: [
          { max: 58, level: 'low', label: '낮은 공격성', description: '공격성이 낮은 편입니다.' },
          { max: 81, level: 'average', label: '평균 공격성', description: '일반적인 수준입니다.' },
          { max: 108, level: 'high', label: '높은 공격성', description: '평균 이상의 공격성입니다.' },
          { max: 135, level: 'very_high', label: '매우 높은 공격성', description: '전문가 상담을 권장합니다.' }
        ]
      },
      scale4: { // K-ARS
        ranges: [
          { max: 18, level: 'normal', label: '정상', description: 'ADHD 가능성이 낮습니다.' },
          { max: 28, level: 'mild', label: '경도', description: 'ADHD가 의심됩니다. 추가 평가가 필요합니다.' },
          { max: 41, level: 'moderate', label: '중등도', description: 'ADHD 가능성이 높습니다.' },
          { max: 54, level: 'severe', label: '중증', description: '심각한 ADHD 증상입니다.' }
        ]
      }
    };
    
    const scaleRanges = interpretations[scale]?.ranges;
    if (!scaleRanges) {
      return { level: 'unknown', label: '평가 불가', description: '해석 정보가 없습니다.' };
    }
    
    for (const range of scaleRanges) {
      if (score <= range.max) {
        return range;
      }
    }
    
    return scaleRanges[scaleRanges.length - 1];
  }

  getLanguageName(code) {
    return translationService.getLanguageName(code);
  }

  getScaleName(key) {
    const t = (key) => translationService.t(key);
    const names = {
      scale1: t('cesdc'),
      scale2: t('bai'),
      scale3: t('kaq'),
      scale4: t('kars')
    };
    return names[key] || key;
  }

  getTaskName(key) {
    const t = (key) => translationService.t(key);
    const names = {
      task1: t('stroopTask'),
      task2: t('nBackTask'),
      task3: t('goNoGoTask'),
      task4: t('emotionTask'),
      task5: t('rotationTask')
    };
    return names[key] || key;
  }

  async saveReport() {
    const t = (key) => translationService.t(key);
    
    try {
      // 저장 버튼 비활성화
      const saveBtn = document.querySelector('.save-btn');
      saveBtn.disabled = true;
      saveBtn.innerHTML = `<span class="btn-icon">⏳</span> ${t('saving')}`;
      
      const reportElement = document.getElementById('report-content');
      
      // 동시에 PDF와 JPG 생성
      await Promise.all([
        this.generatePDF(reportElement),
        this.generateImage(reportElement)
      ]);
      
      // 저장 버튼 복원
      saveBtn.disabled = false;
      saveBtn.innerHTML = `<span class="btn-icon">✓</span> ${t('saveComplete')}`;
      
      // 3초 후 버튼 텍스트 원래대로
      setTimeout(() => {
        saveBtn.innerHTML = `<span class="btn-icon">💾</span> ${t('saveToGoogleDrive')}`;
      }, 3000);
      
    } catch (error) {
      console.error('리포트 저장 오류:', error);
      alert(t('saveError'));
      
      const saveBtn = document.querySelector('.save-btn');
      saveBtn.disabled = false;
      saveBtn.innerHTML = `<span class="btn-icon">💾</span> ${t('saveToGoogleDrive')}`;
    }
  }

  async generatePDF(element) {
    // Apps Script 엔드포인트로 PDF 생성 요청
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const fileName = `${this.patientData.name}_${this.patientData.birthDate.replace(/-/g, '')}_${timestamp}.pdf`;
    
    // HTML 콘텐츠를 Apps Script로 전송
    const htmlContent = element.outerHTML;
    
    // 실제 구현 시 Apps Script URL과 연동
    console.log('PDF 생성 요청:', fileName);
    
    // Firebase에 파일명 기록
    await generateReportRecord(
      this.patientData.name,
      this.patientData.birthDate,
      fileName
    );
    
    console.log(`PDF 생성 완료: ${fileName}`);
  }

  async generateImage(element) {
    // Apps Script 엔드포인트로 이미지 생성 요청
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const fileName = `${this.patientData.name}_${this.patientData.birthDate.replace(/-/g, '')}_${timestamp}.jpg`;
    
    // HTML 콘텐츠를 Apps Script로 전송
    const htmlContent = element.outerHTML;
    
    // 실제 구현 시 Apps Script URL과 연동
    console.log('이미지 생성 요청:', fileName);
    
    console.log(`이미지 생성 완료: ${fileName}`);
  }

  destroy() {
    // 컴포넌트 정리
    this.container.innerHTML = '';
  }
}

// CSS 스타일
const style = document.createElement('style');
style.textContent = `
  .report-container {
    max-width: 900px;
    margin: 20px auto;
    padding: 30px;
    background: white;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    animation: fadeIn 0.3s ease-out;
  }
  
  .report-header {
    position: relative;
    border-bottom: 3px solid #1976d2;
    padding-bottom: 20px;
    margin-bottom: 30px;
  }
  
  .back-btn {
    position: absolute;
    top: 0;
    left: 0;
    padding: 8px 16px;
    background: #f5f5f5;
    border: 1px solid #ddd;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    transition: all 0.2s;
  }
  
  .back-btn:hover {
    background: #e0e0e0;
    transform: translateY(-1px);
  }
  
  .report-header h1 {
    text-align: center;
    color: #1976d2;
    margin-bottom: 20px;
  }
  
  .report-date {
    text-align: center;
    color: #666;
    font-size: 14px;
  }
  
  .patient-info-section {
    background: #f5f5f5;
    padding: 20px;
    border-radius: 8px;
    margin-bottom: 30px;
  }
  
  .patient-info-section h2 {
    color: #333;
    margin-bottom: 15px;
  }
  
  .patient-details p {
    margin: 5px 0;
    font-size: 16px;
  }
  
  .completion-status {
    text-align: center;
    padding: 15px;
    background: #e3f2fd;
    border-radius: 8px;
    margin-bottom: 30px;
  }
  
  .status-text {
    font-size: 16px;
    color: #1976d2;
    font-weight: 500;
  }
  
  .chart-container {
    margin: 20px 0;
    display: flex;
    justify-content: center;
  }
  
  .results-table {
    width: 100%;
    border-collapse: collapse;
    margin: 20px 0;
  }
  
  .results-table th,
  .results-table td {
    padding: 12px;
    text-align: left;
    border-bottom: 1px solid #ddd;
  }
  
  .results-table th {
    background: #f0f0f0;
    font-weight: bold;
    color: #333;
  }
  
  .results-table tr:hover {
    background: #f9f9f9;
  }
  
  .exceeded-cutoff {
    background: #ffebee !important;
  }
  
  .status-exceeded {
    color: #f44336;
    font-weight: bold;
  }
  
  .status-normal {
    color: #4caf50;
  }
  
  .performance-excellent {
    color: #4caf50;
    font-weight: bold;
  }
  
  .performance-good {
    color: #8bc34a;
  }
  
  .performance-average {
    color: #ff9800;
  }
  
  .performance-below {
    color: #ff5722;
  }
  
  .performance-poor {
    color: #f44336;
    font-weight: bold;
  }
  
  .interpretation {
    font-size: 14px;
    color: #666;
  }
  
  .no-data {
    text-align: center;
    color: #999;
    font-style: italic;
  }
  
  .overall-impression {
    margin-top: 40px;
    padding: 20px;
    background: #f9f9f9;
    border-radius: 8px;
  }
  
  .overall-impression h2 {
    color: #333;
    margin-bottom: 20px;
  }
  
  .overall-content h3 {
    color: #1976d2;
    margin-top: 20px;
    margin-bottom: 10px;
  }
  
  .overall-content p {
    margin: 10px 0;
    line-height: 1.6;
  }
  
  .overall-content ul {
    margin: 10px 0;
    padding-left: 30px;
  }
  
  .overall-content li {
    margin: 5px 0;
  }
  
  .report-actions {
    text-align: center;
    margin-top: 40px;
  }
  
  .save-btn {
    padding: 15px 40px;
    background: #4caf50;
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 18px;
    cursor: pointer;
    transition: all 0.2s;
    display: inline-flex;
    align-items: center;
    gap: 10px;
  }
  
  .save-btn:hover:not(:disabled) {
    background: #388e3c;
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0,0,0,0.2);
  }
  
  .save-btn:disabled {
    background: #ccc;
    cursor: not-allowed;
  }
  
  .btn-icon {
    font-size: 24px;
  }
  
  /* D3.js 차트 스타일 */
  .bar {
    transition: all 0.3s;
  }
  
  .bar:hover {
    opacity: 0.8;
  }
  
  .cutoff-line {
    opacity: 0.7;
  }
  
  .score-label {
    font-size: 12px;
    fill: #333;
  }
  
  /* 인쇄 스타일 */
  @media print {
    .back-btn,
    .report-actions {
      display: none;
    }
    
    .report-container {
      box-shadow: none;
      margin: 0;
      padding: 20px;
    }
  }
  
  /* 반응형 디자인 */
  @media (max-width: 768px) {
    .report-container {
      margin: 10px;
      padding: 20px;
    }
    
    .results-table {
      font-size: 14px;
    }
    
    .results-table th,
    .results-table td {
      padding: 8px;
    }
    
    .chart-container svg {
      max-width: 100%;
      height: auto;
    }
  }
  
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;
document.head.appendChild(style);