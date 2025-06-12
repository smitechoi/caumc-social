import { generateReportRecord } from '../firebase/crud.js';

export class Report {
  constructor(containerId, patientData) {
    this.container = document.getElementById(containerId);
    this.patientData = patientData;
    this.render();
  }

  render() {
    this.container.innerHTML = `
      <div class="report-container" id="report-container">
        <div class="report-header">
          <button onclick="window.location.hash='#dashboard'" class="back-btn">← 뒤로</button>
          <h1>검사 결과 리포트</h1>
        </div>
        
        <div class="report-content" id="report-content">
          <div class="patient-info-section">
            <h2>환자 정보</h2>
            <div class="patient-details">
              <p><strong>이름:</strong> ${this.patientData.name}</p>
              <p><strong>생년월일:</strong> ${this.patientData.birthDate}</p>
              <p><strong>검사일:</strong> ${new Date().toLocaleDateString('ko-KR')}</p>
              <p><strong>검사 언어:</strong> ${this.getLanguageName(this.patientData.language)}</p>
            </div>
          </div>
          
          <section class="survey-results">
            <h2>임상 척도 검사 결과</h2>
            <div class="completion-status">
              ${this.getCompletionStatus('survey')}
            </div>
            <div id="survey-chart" class="chart-container"></div>
            <div class="survey-details">
              ${this.renderSurveyDetails()}
            </div>
          </section>
          
          <section class="cnt-results">
            <h2>인지 기능 검사 결과</h2>
            <div class="completion-status">
              ${this.getCompletionStatus('cnt')}
            </div>
            <div id="cnt-chart" class="chart-container"></div>
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
          
          <div class="report-footer">
            <p class="disclaimer">본 검사 결과는 참고용이며, 정확한 진단을 위해서는 전문가 상담이 필요합니다.</p>
            <p class="report-date">리포트 생성일: ${new Date().toLocaleString('ko-KR')}</p>
          </div>
        </div>
        
        <div class="report-actions">
          <button onclick="window.reportInstance.saveReport()" class="save-btn">
            <span class="btn-icon">💾</span>
            구글 드라이브에 저장
          </button>
          <button onclick="window.print()" class="print-btn">
            <span class="btn-icon">🖨️</span>
            인쇄
          </button>
        </div>
      </div>
    `;

    window.reportInstance = this;
    
    // 차트 그리기
    setTimeout(() => {
      this.drawCharts();
    }, 100);
  }

  getCompletionStatus(type) {
    if (type === 'survey') {
      const completed = Object.values(this.patientData.survey).filter(s => s.isDone).length;
      const total = Object.keys(this.patientData.survey).length;
      return `<p class="status-text">완료된 척도: ${completed}/${total}</p>`;
    } else {
      const completed = Object.values(this.patientData.cnt).filter(t => t.isDone).length;
      const total = Object.keys(this.patientData.cnt).length;
      return `<p class="status-text">완료된 검사: ${completed}/${total}</p>`;
    }
  }

  drawCharts() {
    this.drawSurveyChart();
    this.drawCNTChart();
  }

  drawSurveyChart() {
    const data = Object.entries(this.patientData.survey)
      .filter(([_, value]) => value.isDone)
      .map(([key, value]) => {
        // maxScore 계산 수정
        const maxScore = this.getMaxScore(key);
        const percentage = (value.score / maxScore) * 100;
        const avgPercentage = this.getAveragePercentage('survey', key);
        
        return {
          scale: this.getScaleName(key),
          score: value.score,
          maxScore: maxScore,
          percentage: percentage,
          avgPercentage: avgPercentage
        };
      });

    if (data.length === 0) {
      document.getElementById('survey-chart').innerHTML = '<p class="no-data">완료된 척도가 없습니다.</p>';
      return;
    }

    const margin = {top: 30, right: 120, bottom: 60, left: 100};
    const width = 700 - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;

    // 기존 차트 제거
    d3.select("#survey-chart").selectAll("*").remove();

    const svg = d3.select("#survey-chart")
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Y축 스케일 (척도명)
    const y = d3.scaleBand()
      .range([0, height])
      .domain(data.map(d => d.scale))
      .padding(0.3);

    // X축 스케일 (0-100%)
    const x = d3.scaleLinear()
      .domain([0, 100])
      .range([0, width]);

    // 배경 그리드
    svg.append("g")
      .attr("class", "grid")
      .call(d3.axisBottom(x)
        .tickSize(height)
        .tickFormat("")
      )
      .style("stroke-dasharray", "3,3")
      .style("opacity", 0.3);

    // 개인 점수 바
    svg.selectAll(".bar")
      .data(data)
      .enter()
      .append("rect")
      .attr("class", "bar")
      .attr("x", 0)
      .attr("y", d => y(d.scale))
      .attr("width", d => x(d.percentage))
      .attr("height", y.bandwidth() / 2)
      .attr("fill", "#2196F3")
      .attr("rx", 4);

    // 평균 점수 라인
    svg.selectAll(".avg-line")
      .data(data)
      .enter()
      .append("line")
      .attr("class", "avg-line")
      .attr("x1", d => x(d.avgPercentage))
      .attr("x2", d => x(d.avgPercentage))
      .attr("y1", d => y(d.scale))
      .attr("y2", d => y(d.scale) + y.bandwidth())
      .attr("stroke", "#FF6B6B")
      .attr("stroke-width", 3)
      .attr("stroke-dasharray", "5,5");

    // 점수 텍스트
    svg.selectAll(".score-text")
      .data(data)
      .enter()
      .append("text")
      .attr("x", d => x(d.percentage) + 5)
      .attr("y", d => y(d.scale) + y.bandwidth() / 4)
      .attr("dy", ".35em")
      .text(d => `${Math.round(d.percentage)}%`)
      .style("font-size", "12px")
      .style("fill", "#333");

    // 축
    svg.append("g")
      .call(d3.axisLeft(y))
      .style("font-size", "14px");

    svg.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x).tickFormat(d => d + "%"))
      .style("font-size", "12px");

    // 범례
    const legend = svg.append("g")
      .attr("transform", `translate(${width + 10}, 20)`);

    legend.append("rect")
      .attr("width", 15)
      .attr("height", 15)
      .attr("fill", "#2196F3");

    legend.append("text")
      .attr("x", 20)
      .attr("y", 12)
      .text("개인 점수")
      .style("font-size", "12px");

    legend.append("line")
      .attr("x1", 0)
      .attr("x2", 15)
      .attr("y1", 30)
      .attr("y2", 30)
      .attr("stroke", "#FF6B6B")
      .attr("stroke-width", 3)
      .attr("stroke-dasharray", "5,5");

    legend.append("text")
      .attr("x", 20)
      .attr("y", 35)
      .text("평균 점수")
      .style("font-size", "12px");
  }

  drawCNTChart() {
    const data = Object.entries(this.patientData.cnt)
      .filter(([_, value]) => value.isDone)
      .map(([key, value]) => {
        const avgScore = this.getAverageScore('cnt', key);
        
        return {
          task: this.getTaskName(key),
          score: value.score,
          avgScore: avgScore
        };
      });

    if (data.length === 0) {
      document.getElementById('cnt-chart').innerHTML = '<p class="no-data">완료된 검사가 없습니다.</p>';
      return;
    }

    const margin = {top: 30, right: 120, bottom: 80, left: 60};
    const width = 700 - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;

    // 기존 차트 제거
    d3.select("#cnt-chart").selectAll("*").remove();

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
      .padding(0.3);

    // Y축 스케일 (0-100점)
    const y = d3.scaleLinear()
      .domain([0, 100])
      .range([height, 0]);

    // 배경 그리드
    svg.append("g")
      .attr("class", "grid")
      .call(d3.axisLeft(y)
        .tickSize(-width)
        .tickFormat("")
      )
      .style("stroke-dasharray", "3,3")
      .style("opacity", 0.3);

    // 개인 점수 바
    svg.selectAll(".bar")
      .data(data)
      .enter()
      .append("rect")
      .attr("class", "bar")
      .attr("x", d => x(d.task))
      .attr("y", d => y(d.score))
      .attr("width", x.bandwidth())
      .attr("height", d => height - y(d.score))
      .attr("fill", "#4CAF50")
      .attr("rx", 4);

    // 평균 점수 마커
    svg.selectAll(".avg-marker")
      .data(data)
      .enter()
      .append("circle")
      .attr("cx", d => x(d.task) + x.bandwidth() / 2)
      .attr("cy", d => y(d.avgScore))
      .attr("r", 5)
      .attr("fill", "#FF6B6B");

    // 점수 텍스트
    svg.selectAll(".score-text")
      .data(data)
      .enter()
      .append("text")
      .attr("x", d => x(d.task) + x.bandwidth() / 2)
      .attr("y", d => y(d.score) - 5)
      .attr("text-anchor", "middle")
      .text(d => d.score)
      .style("font-size", "14px")
      .style("font-weight", "bold");

    // 축
    svg.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x))
      .selectAll("text")
      .attr("transform", "rotate(-45)")
      .style("text-anchor", "end")
      .style("font-size", "12px");

    svg.append("g")
      .call(d3.axisLeft(y))
      .style("font-size", "12px");

    // Y축 라벨
    svg.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 0 - margin.left)
      .attr("x", 0 - (height / 2))
      .attr("dy", "1em")
      .style("text-anchor", "middle")
      .text("점수");

    // 범례
    const legend = svg.append("g")
      .attr("transform", `translate(${width + 10}, 20)`);

    legend.append("rect")
      .attr("width", 15)
      .attr("height", 15)
      .attr("fill", "#4CAF50");

    legend.append("text")
      .attr("x", 20)
      .attr("y", 12)
      .text("개인 점수")
      .style("font-size", "12px");

    legend.append("circle")
      .attr("cx", 7)
      .attr("cy", 30)
      .attr("r", 5)
      .attr("fill", "#FF6B6B");

    legend.append("text")
      .attr("x", 20)
      .attr("y", 35)
      .text("평균 점수")
      .style("font-size", "12px");
  }

  renderSurveyDetails() {
    let html = '<table class="results-table">';
    html += '<tr><th>척도</th><th>점수</th><th>수준</th><th>해석</th></tr>';
    
    Object.entries(this.patientData.survey).forEach(([key, value]) => {
      if (value.isDone) {
        // interpretation이 이미 저장되어 있으면 사용, 없으면 기존 방식 사용
        const interpretation = value.interpretation || 
          this.getDefaultInterpretation(key, value.score);
        
        const maxScore = this.getMaxScore(key);
        
        html += `
          <tr>
            <td>${this.getScaleName(key)}</td>
            <td>${value.score}/${maxScore}</td>
            <td class="level-${interpretation.level || 'normal'}">${interpretation.label || interpretation.text}</td>
            <td>${interpretation.description || ''}</td>
          </tr>
        `;
        
        // 하위척도 분석 결과가 있으면 추가
        if (value.analysis) {
          html += this.renderSubscaleAnalysis(key, value.analysis);
        }
      }
    });
    
    if (Object.values(this.patientData.survey).every(s => !s.isDone)) {
      html += '<tr><td colspan="4" class="no-data">완료된 척도가 없습니다.</td></tr>';
    }
    
    html += '</table>';
    return html;
  }

  renderCNTDetails() {
    let html = '<table class="results-table">';
    html += '<tr><th>검사</th><th>점수</th><th>수행 수준</th><th>해석</th></tr>';
    
    Object.entries(this.patientData.cnt).forEach(([key, value]) => {
      if (value.isDone) {
        const level = this.interpretCNTScore(value.score);
        const interpretation = this.getCNTInterpretation(key, value.score);
        
        html += `
          <tr>
            <td>${this.getTaskName(key)}</td>
            <td>${value.score}/100</td>
            <td class="${level.class}">${level.text}</td>
            <td>${interpretation}</td>
          </tr>
        `;
      }
    });
    
    if (Object.values(this.patientData.cnt).every(t => !t.isDone)) {
      html += '<tr><td colspan="4" class="no-data">완료된 검사가 없습니다.</td></tr>';
    }
    
    html += '</table>';
    return html;
  }

  interpretSurveyScore(scale, score, questionCount) {
    const percentage = (score / (questionCount * 4)) * 100;
    
    if (percentage < 25) {
      return { level: 'level-low', text: '낮음' };
    } else if (percentage < 50) {
      return { level: 'level-mild', text: '경도' };
    } else if (percentage < 75) {
      return { level: 'level-moderate', text: '중등도' };
    } else {
      return { level: 'level-high', text: '높음' };
    }
  }

  interpretCNTScore(score) {
    if (score >= 90) {
      return { class: 'score-excellent', text: '매우 우수' };
    } else if (score >= 75) {
      return { class: 'score-good', text: '우수' };
    } else if (score >= 50) {
      return { class: 'score-average', text: '평균' };
    } else if (score >= 25) {
      return { class: 'score-below', text: '평균 이하' };
    } else {
      return { class: 'score-impaired', text: '손상 의심' };
    }
  }

  getCNTInterpretation(task, score) {
    const interpretations = {
      task1: { // Stroop
        high: '억제 통제 능력이 우수합니다.',
        average: '정상적인 인지 통제 능력을 보입니다.',
        low: '주의력 및 억제 기능 저하가 의심됩니다.'
      },
      task2: { // N-Back
        high: '작업 기억 능력이 매우 좋습니다.',
        average: '평균적인 작업 기억 수준입니다.',
        low: '작업 기억 훈련이 필요할 수 있습니다.'
      },
      task3: { // Go/No-Go
        high: '충동 조절 능력이 뛰어납니다.',
        average: '정상적인 반응 억제 능력입니다.',
        low: '충동성 조절에 어려움이 있을 수 있습니다.'
      },
      task4: { // Emotion Recognition
        high: '감정 인식 능력이 매우 우수합니다.',
        average: '정상적인 사회적 인지 능력입니다.',
        low: '감정 인식에 어려움이 있을 수 있습니다.'
      },
      task5: { // Mental Rotation
        high: '공간 지각 능력이 뛰어납니다.',
        average: '평균적인 시공간 처리 능력입니다.',
        low: '시공간 처리에 어려움이 있을 수 있습니다.'
      }
    };
    
    const taskInterpretations = interpretations[task] || interpretations.task1;
    
    if (score >= 75) return taskInterpretations.high;
    else if (score >= 40) return taskInterpretations.average;
    else return taskInterpretations.low;
  }

  // 평균 점수 데이터 (임시 - 실제로는 데이터베이스에서 가져와야 함)
  getAveragePercentage(type, key) {
    const avgData = {
      survey: {
        scale1: 45, // 우울 척도 평균 45%
        scale2: 50, // 불안 척도 평균 50%
        scale3: 55, // 스트레스 척도 평균 55%
        scale4: 60  // 삶의 질 평균 60%
      }
    };
    
    return avgData[type]?.[key] || 50;
  }

  getAverageScore(type, key) {
    const avgData = {
      cnt: {
        task1: 70, // Stroop 평균 70점
        task2: 65, // N-Back 평균 65점
        task3: 75, // Go/No-Go 평균 75점
        task4: 68, // Trail Making 평균 68점
        task5: 72  // Digit Span 평균 72점
      }
    };
    
    return avgData[type]?.[key] || 70;
  }

  getLanguageName(code) {
    const languages = {
      ko: '한국어',
      en: 'English',
      ja: '日本語',
      zh: '中文'
    };
    return languages[code] || code;
  }

  getScaleName(key) {
    const names = {
      scale1: '아동 우울 척도 (CES-DC)',
      scale2: '벡 불안 척도 (BAI)', 
      scale3: '한국판 공격성 질문지 (K-AQ)',
      scale4: '한국형 ADHD 평가척도 (K-ARS)'
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

  async saveReport() {
    try {
      // 저장 버튼 비활성화
      const saveBtn = document.querySelector('.save-btn');
      saveBtn.disabled = true;
      saveBtn.innerHTML = '<span class="btn-icon">⏳</span> 저장 중...';
      
      const reportElement = document.getElementById('report-content');
      
      // 동시에 PDF와 JPG 생성
      await Promise.all([
        this.generatePDF(reportElement),
        this.generateImage(reportElement)
      ]);
      
      // 저장 버튼 복원
      saveBtn.disabled = false;
      saveBtn.innerHTML = '<span class="btn-icon">✓</span> 저장 완료!';
      
      // 3초 후 버튼 텍스트 원래대로
      setTimeout(() => {
        saveBtn.innerHTML = '<span class="btn-icon">💾</span> 구글 드라이브에 저장';
      }, 3000);
      
    } catch (error) {
      console.error('리포트 저장 오류:', error);
      alert('리포트 저장 중 오류가 발생했습니다.');
      
      const saveBtn = document.querySelector('.save-btn');
      saveBtn.disabled = false;
      saveBtn.innerHTML = '<span class="btn-icon">💾</span> 구글 드라이브에 저장';
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
    
    // TODO: Apps Script 연동
    // const response = await fetch(APPS_SCRIPT_URL, {
    //   method: 'POST',
    //   body: JSON.stringify({
    //     action: 'generatePDF',
    //     html: htmlContent,
    //     fileName: fileName,
    //     patientId: this.patientData.id
    //   })
    // });
    
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
    
    // TODO: Apps Script 연동
    // const response = await fetch(APPS_SCRIPT_URL, {
    //   method: 'POST',
    //   body: JSON.stringify({
    //     action: 'generateImage',
    //     html: htmlContent,
    //     fileName: fileName,
    //     patientId: this.patientData.id
    //   })
    // });
    
    console.log(`이미지 생성 완료: ${fileName}`);
  }

  renderSubscaleAnalysis(scale, analysis) {
    let html = '';
    
    // K-ARS의 경우 하위척도 점수 표시
    if (scale === 'scale4' && analysis.subscales) {
      html += `
        <tr class="subscale-row">
          <td colspan="4" style="padding-left: 30px; background: #f9f9f9;">
            <strong>하위척도 분석:</strong><br>
            • 부주의: ${analysis.subscales.inattention.score}점 
              ${analysis.subscales.inattention.exceeded ? '(기준 초과 ⚠️)' : ''}<br>
            • 과잉행동-충동성: ${analysis.subscales.hyperactivity.score}점 
              ${analysis.subscales.hyperactivity.exceeded ? '(기준 초과 ⚠️)' : ''}
          </td>
        </tr>
      `;
    }
    
    // K-AQ의 경우 하위척도 표시
    if (scale === 'scale3' && analysis.subscales) {
      html += `<tr class="subscale-row"><td colspan="4" style="padding-left: 30px; background: #f9f9f9;">
        <strong>하위척도:</strong><br>`;
      
      Object.entries(analysis.subscales).forEach(([key, subscale]) => {
        html += `• ${subscale.name}: ${subscale.score}점<br>`;
      });
      
      html += `</td></tr>`;
    }
    
    // CES-DC의 경우 카테고리별 점수
    if (scale === 'scale1' && analysis.factors) {
      html += `<tr class="subscale-row"><td colspan="4" style="padding-left: 30px; background: #f9f9f9;">
        <strong>영역별 분석:</strong><br>`;
      
      const factorNames = {
        depressed_affect: '우울 정서',
        positive_affect: '긍정 정서',
        somatic: '신체화 증상',
        interpersonal: '대인관계 문제'
      };
      
      Object.entries(analysis.factors).forEach(([key, factor]) => {
        if (factor.percentage !== undefined) {
          html += `• ${factorNames[key] || key}: ${factor.percentage}%<br>`;
        }
      });
      
      html += `</td></tr>`;
    }
    
    return html;
  }
  getMaxScore(scale) {
    const maxScores = {
      'scale1': 60,  // CES-DC: 20문항 × 3
      'scale2': 63,  // BAI: 21문항 × 3
      'scale3': 135, // K-AQ: 27문항 × 5
      'scale4': 54   // K-ARS: 18문항 × 3
    };
    return maxScores[scale] || 100;
  }
  getDefaultInterpretation(scale, score) {
    const interpretations = {
      scale1: { // CES-DC
        ranges: [
          { max: 15, level: 'normal', label: '정상', description: '우울 증상이 거의 없습니다.' },
          { max: 24, level: 'mild', label: '경도 우울', description: '가벼운 우울 증상이 있습니다.' },
          { max: 60, level: 'severe', label: '중증 우울', description: '심각한 우울 증상입니다. 전문가 상담이 필요합니다.' }
        ]
      },
      scale2: { // BAI
        ranges: [
          { max: 9, level: 'minimal', label: '정상', description: '불안이 정상 수준입니다.' },
          { max: 18, level: 'mild', label: '경한 불안', description: '경미한 불안 증상이 있습니다.' },
          { max: 29, level: 'moderate', label: '중등도 불안', description: '치료를 고려해야 할 수준입니다.' },
          { max: 63, level: 'severe', label: '심한 불안', description: '즉각적인 치료가 필요합니다.' }
        ]
      },
      scale3: { // K-AQ
        ranges: [
          { max: 54, level: 'low', label: '낮은 공격성', description: '평균 이하의 공격성입니다.' },
          { max: 74, level: 'average', label: '평균 공격성', description: '일반적인 수준입니다.' },
          { max: 94, level: 'high', label: '높은 공격성', description: '평균 이상의 공격성입니다.' },
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
  generateClinicalImpression() {
    const completedSurveys = Object.entries(this.patientData.survey)
      .filter(([key, value]) => value.isDone);
    const completedCNTs = Object.values(this.patientData.cnt)
      .filter(t => t.isDone);
    
    if (completedSurveys.length === 0 && completedCNTs.length === 0) {
      return '<p>완료된 검사가 없어 종합 소견을 제공할 수 없습니다.</p>';
    }
    
    let impression = '<div class="impression-content">';
    
    // 완료율
    const surveyCompletion = Math.round((completedSurveys.length / Object.keys(this.patientData.survey).length) * 100);
    const cntCompletion = Math.round((completedCNTs.length / Object.keys(this.patientData.cnt).length) * 100);
    
    impression += `<h3>검사 완료율</h3>`;
    impression += `<ul>`;
    impression += `<li>임상 척도: ${surveyCompletion}% (${completedSurveys.length}/${Object.keys(this.patientData.survey).length})</li>`;
    impression += `<li>인지 기능: ${cntCompletion}% (${completedCNTs.length}/${Object.keys(this.patientData.cnt).length})</li>`;
    impression += `</ul>`;
    
    // 임상적으로 유의한 결과 강조
    const significantFindings = [];
    
    completedSurveys.forEach(([key, value]) => {
      const interpretation = value.interpretation || this.getDefaultInterpretation(key, value.score);
      
      // 중등도 이상인 경우만 주요 소견에 포함
      if (['moderate', 'severe', 'high', 'very_high'].includes(interpretation.level)) {
        significantFindings.push({
          scale: this.getScaleName(key),
          level: interpretation.label,
          score: value.score,
          maxScore: this.getMaxScore(key),
          description: interpretation.description
        });
      }
      
      // K-ARS의 경우 하위척도도 확인
      if (key === 'scale4' && value.analysis?.subscales) {
        if (value.analysis.subscales.inattention.exceeded || 
            value.analysis.subscales.hyperactivity.exceeded) {
          significantFindings.push({
            scale: this.getScaleName(key) + ' (하위척도)',
            level: '기준 초과',
            description: '부주의 또는 과잉행동-충동성 증상이 임상적 기준을 초과했습니다.'
          });
        }
      }
    });
    
    if (significantFindings.length > 0) {
      impression += `<h3>주요 소견</h3>`;
      impression += `<ul>`;
      significantFindings.forEach(finding => {
        impression += `<li><strong>${finding.scale}</strong>: ${finding.level}`;
        if (finding.score !== undefined) {
          impression += ` (${finding.score}/${finding.maxScore}점)`;
        }
        impression += `</li>`;
      });
      impression += `</ul>`;
    }
    
    // 인지 기능 요약
    if (completedCNTs.length > 0) {
      const avgCNTScore = completedCNTs.reduce((sum, t) => sum + t.score, 0) / completedCNTs.length;
      
      impression += `<h3>인지 기능 요약</h3>`;
      impression += `<p>완료된 인지 검사의 평균 점수는 ${Math.round(avgCNTScore)}점입니다. `;
      
      if (avgCNTScore >= 75) {
        impression += '전반적으로 우수한 인지 기능을 보이고 있습니다.</p>';
      } else if (avgCNTScore >= 50) {
        impression += '평균 범위의 인지 기능을 나타내고 있습니다.</p>';
      } else {
        impression += '일부 인지 영역에서 어려움이 관찰됩니다.</p>';
      }
    }
    
    // 권장사항
    impression += `<h3>권장사항</h3>`;
    impression += `<ul>`;
    
    if (significantFindings.length > 0) {
      impression += `<li>임상적으로 유의한 증상이 관찰되었습니다. 정신건강 전문가와의 상담을 권장합니다.</li>`;
    }
    
    if (surveyCompletion < 100 || cntCompletion < 100) {
      impression += `<li>모든 검사를 완료하여 더 정확한 평가를 받으시기 바랍니다.</li>`;
    }
    
    impression += `<li>본 결과는 선별 검사 목적으로만 사용되어야 합니다.</li>`;
    impression += `<li>정확한 진단을 위해서는 전문가의 종합적인 평가가 필요합니다.</li>`;
    impression += `</ul>`;
    
    impression += '</div>';
    
    return impression;
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
  }
  
  .back-btn:hover {
    background: #e0e0e0;
  }
  
  .report-header h1 {
    text-align: center;
    color: #1976d2;
    margin-bottom: 20px;
  }
  
  .patient-info-section {
    background: #f8f9fa;
    padding: 20px;
    border-radius: 8px;
    margin-bottom: 30px;
  }
  
  .patient-details {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    margin-top: 15px;
  }
  
  .patient-details p {
    margin: 5px 0;
  }
  
  .completion-status {
    background: #e3f2fd;
    padding: 10px 15px;
    border-radius: 4px;
    margin-bottom: 20px;
  }
  
  .status-text {
    margin: 0;
    color: #1976d2;
    font-weight: 500;
  }
  
  section {
    margin-bottom: 40px;
    page-break-inside: avoid;
  }
  
  section h2 {
    color: #1976d2;
    margin-bottom: 20px;
    padding-bottom: 10px;
    border-bottom: 2px solid #e0e0e0;
  }
  
  .chart-container {
    margin: 20px 0;
    padding: 20px;
    background: #fafafa;
    border-radius: 8px;
  }
  
  .no-data {
    text-align: center;
    color: #999;
    padding: 40px;
    font-style: italic;
  }
  
  .results-table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 20px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  }
  
  .results-table th,
  .results-table td {
    border: 1px solid #e0e0e0;
    padding: 12px;
    text-align: left;
  }
  
  .results-table th {
    background: #f5f5f5;
    font-weight: bold;
    color: #333;
  }
  
  .results-table tr:nth-child(even) {
    background: #f9f9f9;
  }
  
  /* 수준별 색상 */
  .level-low { color: #4CAF50; }
  .level-mild { color: #FF9800; }
  .level-moderate { color: #FF5722; }
  .level-high { color: #F44336; }
  .level-normal { color: #4CAF50; font-weight: bold; }
  .level-minimal { color: #4CAF50; font-weight: bold; }
  .level-low { color: #4CAF50; font-weight: bold; }
  .level-mild { color: #FFC107; font-weight: bold; }
  .level-average { color: #2196F3; font-weight: bold; }
  .level-moderate { color: #FF9800; font-weight: bold; }
  .level-high { color: #FF5722; font-weight: bold; }
  .level-severe { color: #F44336; font-weight: bold; }
  .level-very_high { color: #D32F2F; font-weight: bold; }

  .subscale-row td {
    background-color: #f9f9f9;
    font-size: 14px;
    line-height: 1.6;
  }
  .score-excellent { color: #4CAF50; font-weight: bold; }
  .score-good { color: #8BC34A; }
  .score-average { color: #FFC107; }
  .score-below { color: #FF9800; }
  .score-impaired { color: #F44336; font-weight: bold; }
  
  .clinical-impression {
    background: #f0f7ff;
    padding: 25px;
    border-radius: 8px;
    border-left: 4px solid #1976d2;
  }
  
  .impression-content h3 {
    color: #1565c0;
    margin-top: 20px;
    margin-bottom: 10px;
  }
  
  .impression-content h3:first-child {
    margin-top: 0;
  }
  
  .impression-content ul {
    margin-left: 20px;
  }
  
  .impression-content li {
    margin: 8px 0;
    line-height: 1.6;
  }
  
  .report-footer {
    margin-top: 40px;
    padding-top: 20px;
    border-top: 1px solid #e0e0e0;
    text-align: center;
  }
  
  .disclaimer {
    color: #666;
    font-size: 14px;
    font-style: italic;
    margin-bottom: 10px;
  }
  
  .report-date {
    color: #999;
    font-size: 12px;
  }
  
  .report-actions {
    margin-top: 30px;
    text-align: center;
    display: flex;
    gap: 15px;
    justify-content: center;
    padding: 20px;
    background: #f5f5f5;
    border-radius: 8px;
  }
  
  .report-actions button {
    padding: 12px 30px;
    font-size: 16px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
    transition: all 0.3s;
  }
  
  .save-btn {
    background: #4CAF50;
    color: white;
  }
  
  .save-btn:hover:not(:disabled) {
    background: #45a049;
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0,0,0,0.2);
  }
  
  .save-btn:disabled {
    background: #ccc;
    cursor: not-allowed;
  }
  
  .print-btn {
    background: #2196F3;
    color: white;
  }
  
  .print-btn:hover {
    background: #1976D2;
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0,0,0,0.2);
  }
  
  .btn-icon {
    font-size: 20px;
  }
  
  /* D3 차트 스타일 */
  .grid line {
    stroke: #e0e0e0;
  }
  
  .grid path {
    stroke-width: 0;
  }
  
  @media print {
    .report-actions,
    .back-btn {
      display: none;
    }
    
    .report-container {
      box-shadow: none;
      margin: 0;
      padding: 20px;
    }
    
    section {
      page-break-inside: avoid;
    }
  }
  
`;
document.head.appendChild(style);