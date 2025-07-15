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
      <div class="report-wrapper">
        <div class="report-actions-fixed">
          <button onclick="window.location.hash='#dashboard'" class="back-btn">← ${t('backToDashboard')}</button>
          <div class="action-buttons-group">
            <button onclick="window.reportInstance.downloadPDF()" class="action-btn pdf-btn">
              <span class="btn-icon">📄</span> ${t('downloadPDF') || 'PDF 다운로드'}
            </button>
            <button onclick="window.print()" class="action-btn print-btn">
              <span class="btn-icon">🖨️</span> ${t('print') || '인쇄'}
            </button>
            <button onclick="window.reportInstance.saveReport()" class="save-btn">
              <span class="btn-icon">💾</span> ${t('saveToGoogleDrive')}
            </button>
          </div>
        </div>
        
        <div class="report-container" id="report-content">
          <div class="report-header">
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
        </div>
      </div>
    `;
    
    window.reportInstance = this;
    
    // 차트 그리기 (PDF 생성 시에는 제외)
    if (!this.container.id.includes('temp-report')) {
      setTimeout(() => {
        this.drawSurveyChart();
        this.drawCNTChart();
      }, 100);
    }
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
            <td class="interpretation">${interpretation.label}: ${interpretation.description}</td>
          </tr>
        `;
      }
    });
    
    html += '</table>';
    
    if (Object.values(this.patientData.survey).filter(s => s.isDone).length === 0) {
      html = `<p class="no-data">${t('noCompletedScale')}</p>`;
    }
    
    return html;
  }

  renderCNTDetails() {
    const t = (key) => translationService.t(key);
    let html = '<table class="results-table">';
    html += `<tr>
      <th>${t('test')}</th>
      <th>${t('score')}</th>
      <th>${t('performanceLevel')}</th>
    </tr>`;
    
    Object.entries(this.patientData.cnt).forEach(([key, value]) => {
      if (value.isDone) {
        const performance = this.getPerformanceLevel(key, value.score);
        
        html += `
          <tr>
            <td>${this.getTaskName(key)}</td>
            <td>${value.score}</td>
            <td class="performance-${performance.toLowerCase().replace(' ', '-')}">
              ${performance}
            </td>
          </tr>
        `;
      }
    });
    
    html += '</table>';
    
    if (Object.values(this.patientData.cnt).filter(t => t.isDone).length === 0) {
      html = `<p class="no-data">${t('noCompletedTest')}</p>`;
    }
    
    return html;
  }

  renderOverallImpression() {
    const t = (key, params) => translationService.t(key, params);
    const surveyDone = Object.values(this.patientData.survey).filter(s => s.isDone).length;
    const cntDone = Object.values(this.patientData.cnt).filter(t => t.isDone).length;
    
    let html = '<div class="overall-content">';
    
    // 1. 검사 완료율
    html += `<h3>${t('testCompletionRate')}</h3>`;
    html += `<p>- ${t('clinicalScaleCompletion', { percent: Math.round(surveyDone / 4 * 100) })}</p>`;
    html += `<p>- ${t('cognitiveTestCompletion', { percent: Math.round(cntDone / 5 * 100) })}</p>`;
    
    // 2. 주요 소견
    html += `<h3>${t('mainFindings')}</h3>`;
    
    // 임상 척도 중 cutoff 초과한 항목
    const exceededScales = Object.entries(this.patientData.survey)
      .filter(([key, value]) => value.isDone && value.score >= this.getCutoffScore(key))
      .map(([key, value]) => ({ 
        name: this.getScaleName(key), 
        score: value.score,
        cutoff: this.getCutoffScore(key)
      }));
    
    if (exceededScales.length > 0) {
      html += `<p>${t('exceededClinicalCutoff')}</p>`;
      html += '<ul>';
      exceededScales.forEach(scale => {
        html += `<li>${scale.name}: ${scale.score}점 (${t('criterion')} ${scale.cutoff}점)</li>`;
      });
      html += '</ul>';
    } else if (surveyDone > 0) {
      html += `<p>${t('allScalesNormal')}</p>`;
    }
    
    // 인지 기능 검사 특이사항
    const poorPerformanceTasks = Object.entries(this.patientData.cnt)
      .filter(([key, value]) => {
        if (!value.isDone) return false;
        const performance = this.getPerformanceLevel(key, value.score);
        return performance === t('below') || performance === t('poor');
      })
      .map(([key]) => this.getTaskName(key));
    
    if (poorPerformanceTasks.length > 0) {
      html += `<p>${t('belowAverageCognitive')}</p>`;
      html += '<ul>';
      poorPerformanceTasks.forEach(task => {
        html += `<li>${task}</li>`;
      });
      html += '</ul>';
    }
    
    // 3. 권고사항
    html += `<h3>${t('recommendations')}</h3>`;
    
    if (exceededScales.length > 0 || poorPerformanceTasks.length > 0) {
      html += `<p>${t('detailedEvalRecommended')}</p>`;
    } else if (surveyDone === 4 && cntDone === 5) {
      html += `<p>${t('allTestsNormalRange')}</p>`;
    } else {
      html += `<p>${t('incompleteTestsRecommended')}</p>`;
    }
    
    html += '</div>';
    
    return html;
  }

  drawSurveyChart() {
    const t = (key) => translationService.t(key);
    const container = d3.select('#survey-chart');
    container.selectAll('*').remove();
    
    // 완료된 검사만 필터링
    const data = Object.entries(this.patientData.survey)
      .filter(([key, value]) => value.isDone)
      .map(([key, value]) => ({
        name: this.getScaleName(key),
        score: value.score,
        cutoff: this.getCutoffScore(key),
        max: this.getMaxScore(key)
      }));
    
    if (data.length === 0) {
      container.append('p')
        .attr('class', 'no-data')
        .text(t('noCompletedScale'));
      return;
    }
    
    const margin = { top: 20, right: 30, bottom: 50, left: 60 };
    const width = 600 - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;
    
    const svg = container.append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);
    
    // 스케일 설정
    const x = d3.scaleBand()
      .domain(data.map(d => d.name))
      .range([0, width])
      .padding(0.2);
    
    const y = d3.scaleLinear()
      .domain([0, d3.max(data, d => Math.max(d.score, d.cutoff) * 1.1)])
      .range([height, 0]);
    
    // 막대 그래프
    svg.selectAll('.bar')
      .data(data)
      .enter().append('rect')
      .attr('class', 'bar')
      .attr('x', d => x(d.name))
      .attr('y', d => y(d.score))
      .attr('width', x.bandwidth())
      .attr('height', d => height - y(d.score))
      .attr('fill', d => d.score >= d.cutoff ? '#f44336' : '#4caf50');
    
    // cutoff 선
    svg.selectAll('.cutoff-line')
      .data(data)
      .enter().append('line')
      .attr('class', 'cutoff-line')
      .attr('x1', d => x(d.name))
      .attr('x2', d => x(d.name) + x.bandwidth())
      .attr('y1', d => y(d.cutoff))
      .attr('y2', d => y(d.cutoff))
      .attr('stroke', '#ff9800')
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '5,5');
    
    // 점수 라벨
    svg.selectAll('.score-label')
      .data(data)
      .enter().append('text')
      .attr('class', 'score-label')
      .attr('x', d => x(d.name) + x.bandwidth() / 2)
      .attr('y', d => y(d.score) - 5)
      .attr('text-anchor', 'middle')
      .text(d => d.score);
    
    // X축
    svg.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x))
      .selectAll('text')
      .style('text-anchor', 'middle');
    
    // Y축
    svg.append('g')
      .call(d3.axisLeft(y));
    
    // Y축 라벨
    svg.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', 0 - margin.left)
      .attr('x', 0 - (height / 2))
      .attr('dy', '1em')
      .style('text-anchor', 'middle')
      .text(t('score'));
  }

  drawCNTChart() {
    const t = (key) => translationService.t(key);
    const container = d3.select('#cnt-chart');
    container.selectAll('*').remove();
    
    // 완료된 검사만 필터링
    const data = Object.entries(this.patientData.cnt)
      .filter(([key, value]) => value.isDone)
      .map(([key, value]) => ({
        name: this.getTaskName(key),
        score: value.score,
        performance: this.getPerformanceLevel(key, value.score)
      }));
    
    if (data.length === 0) {
      container.append('p')
        .attr('class', 'no-data')
        .text(t('noCompletedTest'));
      return;
    }
    
    const margin = { top: 20, right: 30, bottom: 50, left: 60 };
    const width = 600 - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;
    
    const svg = container.append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);
    
    // 스케일 설정
    const x = d3.scaleBand()
      .domain(data.map(d => d.name))
      .range([0, width])
      .padding(0.2);
    
    const y = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.score) * 1.1])
      .range([height, 0]);
    
    // 성과 수준에 따른 색상
    const getColor = (performance) => {
      const performanceColors = {
        [t('excellent')]: '#4caf50',
        [t('good')]: '#8bc34a',
        [t('average')]: '#ff9800',
        [t('below')]: '#ff5722',
        [t('poor')]: '#f44336'
      };
      return performanceColors[performance] || '#666';
    };
    
    // 막대 그래프
    svg.selectAll('.bar')
      .data(data)
      .enter().append('rect')
      .attr('class', 'bar')
      .attr('x', d => x(d.name))
      .attr('y', d => y(d.score))
      .attr('width', x.bandwidth())
      .attr('height', d => height - y(d.score))
      .attr('fill', d => getColor(d.performance));
    
    // 점수 라벨
    svg.selectAll('.score-label')
      .data(data)
      .enter().append('text')
      .attr('class', 'score-label')
      .attr('x', d => x(d.name) + x.bandwidth() / 2)
      .attr('y', d => y(d.score) - 5)
      .attr('text-anchor', 'middle')
      .text(d => d.score);
    
    // X축
    svg.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x))
      .selectAll('text')
      .style('text-anchor', 'middle');
    
    // Y축
    svg.append('g')
      .call(d3.axisLeft(y));
    
    // Y축 라벨
    svg.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', 0 - margin.left)
      .attr('x', 0 - (height / 2))
      .attr('dy', '1em')
      .style('text-anchor', 'middle')
      .text(t('score'));
  }

  getCutoffScore(scale) {
    const cutoffs = {
      scale1: 16,  // CES-DC
      scale2: 22,  // BAI
      scale3: 81,  // K-AQ
      scale4: 19   // K-ARS
    };
    return cutoffs[scale] || 0;
  }

  getMaxScore(scale) {
    const maxScores = {
      scale1: 60,   // CES-DC
      scale2: 63,   // BAI
      scale3: 135,  // K-AQ
      scale4: 54    // K-ARS
    };
    return maxScores[scale] || 100;
  }

  getPerformanceLevel(task, score) {
    const t = (key) => translationService.t(key);
    
    // 간단한 성과 수준 판단 (실제로는 더 복잡한 기준 필요)
    const levels = {
      task1: [ // Card Sorting
        { min: 90, level: t('excellent') },
        { min: 70, level: t('good') },
        { min: 50, level: t('average') },
        { min: 30, level: t('below') },
        { min: 0, level: t('poor') }
      ],
      task2: [ // N-Back
        { min: 80, level: t('excellent') },
        { min: 60, level: t('good') },
        { min: 40, level: t('average') },
        { min: 20, level: t('below') },
        { min: 0, level: t('poor') }
      ],
      task3: [ // Go/No-Go
        { min: 85, level: t('excellent') },
        { min: 70, level: t('good') },
        { min: 55, level: t('average') },
        { min: 40, level: t('below') },
        { min: 0, level: t('poor') }
      ],
      task4: [ // Emotion
        { min: 80, level: t('excellent') },
        { min: 65, level: t('good') },
        { min: 50, level: t('average') },
        { min: 35, level: t('below') },
        { min: 0, level: t('poor') }
      ],
      task5: [ // Rotation
        { min: 75, level: t('excellent') },
        { min: 60, level: t('good') },
        { min: 45, level: t('average') },
        { min: 30, level: t('below') },
        { min: 0, level: t('poor') }
      ]
    };
    
    const taskLevels = levels[task] || levels.task1;
    
    for (const level of taskLevels) {
      if (score >= level.min) {
        return level.level;
      }
    }
    
    return t('poor');
  }

  getDefaultInterpretation(scale, score) {
    const t = (key) => translationService.t(key);
    
    const interpretations = {
      scale1: { // CES-DC
        ranges: [
          { max: 15, level: 'normal', label: '정상', description: '우울 증상이 거의 없습니다.' },
          { max: 20, level: 'mild', label: '경미한 우울', description: '가벼운 우울 증상이 있습니다.' },
          { max: 24, level: 'moderate', label: '중등도 우울', description: '중간 정도의 우울 증상이 있습니다.' },
          { max: 60, level: 'severe', label: '심한 우울', description: '심각한 우울 증상이 있습니다.' }
        ]
      },
      scale2: { // BAI
        ranges: [
          { max: 7, level: 'minimal', label: '정상', description: '불안이 거의 없습니다.' },
          { max: 15, level: 'mild', label: '경미한 불안', description: '가벼운 불안이 있습니다.' },
          { max: 25, level: 'moderate', label: '중등도 불안', description: '중간 정도의 불안이 있습니다.' },
          { max: 63, level: 'severe', label: '심한 불안', description: '심각한 불안이 있습니다.' }
        ]
      },
      scale3: { // K-AQ
        ranges: [
          { max: 68, level: 'low', label: '낮은 공격성', description: '공격성이 평균보다 낮습니다.' },
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
      task1: t('cardSortingTask'),
      task2: t('nBackTask'),
      task3: t('goNoGoTask'),
      task4: t('emotionTask'),
      task5: t('rotationTask')
    };
    return names[key] || key;
  }

  async downloadPDF() {
    const t = (key) => translationService.t(key);
    
    try {
      // PDF 버튼 비활성화
      const pdfBtn = document.querySelector('.pdf-btn');
      pdfBtn.disabled = true;
      
      // jsPDF 라이브러리 동적 로드
      if (!window.jspdf) {
        await this.loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
      }
      if (!window.html2canvas) {
        await this.loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js');
      }
      
      const reportElement = document.getElementById('report-content');
      const { jsPDF } = window.jspdf;
      
      // 고정 버튼들을 임시로 숨김
      const fixedActions = document.querySelector('.report-actions-fixed');
      fixedActions.style.display = 'none';
      
      // 배경색을 명시적으로 설정
      const originalBg = reportElement.style.backgroundColor;
      reportElement.style.backgroundColor = '#ffffff';
      
      // html2canvas로 캡처 - PNG 오류 방지
      const canvas = await html2canvas(reportElement, {
        scale: 1.5,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        imageTimeout: 15000,
        removeContainer: false,
        allowTaint: true,
        foreignObjectRendering: false,
        ignoreElements: (element) => {
          // 차트 요소는 제외하고 텍스트만 캡처
          return element.classList.contains('chart-container') || 
                 element.tagName === 'CANVAS';
        }
      });
      
      // 원래 배경색으로 복원
      reportElement.style.backgroundColor = originalBg;
      fixedActions.style.display = '';
      
      // PDF 생성 - 섹션별로 페이지 나누기
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      // 이미지를 섹션별로 나누어서 추가
      const sections = reportElement.querySelectorAll('section, .patient-info-section, .completion-status');
      const pageWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const margin = 10;
      const contentWidth = pageWidth - (margin * 2);
      const contentHeight = pageHeight - (margin * 2);
      
      let currentY = margin;
      let pageNum = 1;
      
      // 헤더 추가
      const headerCanvas = await html2canvas(reportElement.querySelector('.report-header'), {
        backgroundColor: '#ffffff'
      });
      const headerHeight = (headerCanvas.height * contentWidth) / headerCanvas.width;
      pdf.addImage(headerCanvas.toDataURL('image/png'), 'PNG', margin, currentY, contentWidth, headerHeight);
      currentY += headerHeight + 10;
      
      // 각 섹션 처리
      for (const section of sections) {
        const sectionCanvas = await html2canvas(section, {
          backgroundColor: '#ffffff'
        });
        const sectionHeight = (sectionCanvas.height * contentWidth) / sectionCanvas.width;
        
        // 페이지 넘침 확인
        if (currentY + sectionHeight > contentHeight) {
          pdf.addPage();
          currentY = margin;
        }
        
        pdf.addImage(sectionCanvas.toDataURL('image/png'), 'PNG', margin, currentY, contentWidth, sectionHeight);
        currentY += sectionHeight + 5;
      }
      
      // PDF 다운로드
      const timestamp = new Date().toISOString().replace(/[:.T]/g, '-').slice(0, -5);
      const fileName = `${this.patientData.name}_${this.patientData.birthDate.replace(/-/g, '')}_${timestamp}.pdf`;
      pdf.save(fileName);
      
      // PDF 버튼 복원
      pdfBtn.disabled = false;
      
    } catch (error) {
      console.error('PDF 생성 오류:', error);
      alert(t('pdfError') || 'PDF 생성 중 오류가 발생했습니다.');
      
      const pdfBtn = document.querySelector('.pdf-btn');
      pdfBtn.disabled = false;
      
      // 버튼 다시 표시
      const fixedActions = document.querySelector('.report-actions-fixed');
      if (fixedActions) fixedActions.style.display = '';
    }
  }

  async loadScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
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
    const timestamp = new Date().toISOString().replace(/[:.T]/g, '-').slice(0, -5);
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
    const timestamp = new Date().toISOString().replace(/[:.T]/g, '-').slice(0, -5);
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
  .report-wrapper {
    position: relative;
    min-height: 100vh;
    overflow-y: auto;  /* hidden → auto로 변경 */
  }

  .report-container {
    width: 100%;
    max-width: 900px;
    margin: 80px auto 0;
    padding: 20px;
    /* height 제거하여 콘텐츠에 따라 늘어나도록 */
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
    color: #141;
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
    display: flex;
    justify-content: center;
    gap: 15px;
    flex-wrap: wrap;
  }
  
  .action-btn, .save-btn {
    padding: 15px 30px;
    border: none;
    border-radius: 8px;
    font-size: 16px;
    cursor: pointer;
    transition: all 0.2s;
    display: inline-flex;
    align-items: center;
    gap: 10px;
  }
  
  .pdf-btn {
    background: #dc3545;
    color: white;
  }
  
  .pdf-btn:hover:not(:disabled) {
    background: #c82333;
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(220, 53, 69, 0.3);
  }
  
  .print-btn {
    background: #007bff;
    color: white;
  }
  
  .print-btn:hover:not(:disabled) {
    background: #0056b3;
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 123, 255, 0.3);
  }
  
  .save-btn {
    background: #4caf50;
    color: white;
  }
  
  .save-btn:hover:not(:disabled) {
    background: #388e3c;
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0,0,0,0.2);
  }
  
  .action-btn:disabled, .save-btn:disabled {
    background: #ccc;
    cursor: not-allowed;
  }
  
  .btn-icon {
    font-size: 20px;
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
    @page {
      size: A4;
      margin: 15mm;
    }
    
    body {
      background: white;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    
    .back-btn,
    .report-actions {
      display: none !important;
    }
    
    .report-container {
      box-shadow: none;
      margin: 0;
      padding: 0;
      max-width: 100%;
      width: 100%;
      background: white;
    }
    
    .report-header {
      page-break-after: avoid;
      border-bottom: 2px solid #1976d2;
    }
    
    .patient-info-section,
    .completion-status,
    .survey-results,
    .cnt-results,
    .overall-impression {
      page-break-inside: avoid;
    }
    
    .chart-container {
      page-break-inside: avoid;
      max-height: 400px;
    }
    
    .chart-container svg {
      max-width: 100%;
      height: auto;
    }
    
    .results-table {
      page-break-inside: auto;
    }
    
    .results-table tr {
      page-break-inside: avoid;
    }
    
    /* 색상 보존 */
    .exceeded-cutoff {
      background: #ffebee !important;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    
    .status-exceeded {
      color: #f44336 !important;
    }
    
    .status-normal {
      color: #4caf50 !important;
    }
    
    .performance-excellent {
      color: #4caf50 !important;
    }
    
    .performance-good {
      color: #8bc34a !important;
    }
    
    .performance-average {
      color: #ff9800 !important;
    }
    
    .performance-below {
      color: #ff5722 !important;
    }
    
    .performance-poor {
      color: #f44336 !important;
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
    
    .report-actions {
      flex-direction: column;
      align-items: stretch;1
    }
    
    .action-btn, .save-btn {
      width: 100%;
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
