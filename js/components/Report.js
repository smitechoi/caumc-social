import { generateReportRecord } from '../firebase/crud.js';

export class Report {
  constructor(containerId, patientData) {
    this.container = document.getElementById(containerId);
    this.patientData = patientData;
    this.render();
  }

  render() {
    this.container.innerHTML = `
      <div class="report-container" id="report-content">
        <div class="report-header">
          <button onclick="window.location.hash='#dashboard'" class="back-btn">← 대시보드로</button>
          <h1>종합 검사 결과 보고서</h1>
          <div class="report-date">작성일: ${new Date().toLocaleDateString('ko-KR')}</div>
        </div>
        
        <div class="patient-info-section">
          <h2>환자 정보</h2>
          <div class="patient-details">
            <p><strong>이름:</strong> ${this.patientData.name}</p>
            <p><strong>생년월일:</strong> ${this.patientData.birthDate}</p>
            <p><strong>검사 언어:</strong> ${this.getLanguageName(this.patientData.language)}</p>
            <p><strong>등록번호:</strong> ${this.patientData.registrationNumber || 'N/A'}</p>
          </div>
        </div>
        
        <div class="completion-status">
          <p class="status-text">${this.getCompletionStatus()}</p>
        </div>
        
        <section class="survey-results">
          <h2>임상 척도 검사 결과</h2>
          <div id="survey-chart" class="chart-container"></div>
          ${this.renderSurveyDetails()}
        </section>
        
        <section class="cnt-results">
          <h2>인지 기능 검사 결과</h2>
          <div id="cnt-chart" class="chart-container"></div>
          ${this.renderCNTDetails()}
        </section>
        
        <section class="overall-impression">
          <h2>전반적 인상</h2>
          ${this.renderOverallImpression()}
        </section>
        
        <div class="report-actions">
          <button onclick="window.reportInstance.saveReport()" class="save-btn">
            <span class="btn-icon">💾</span> 구글 드라이브에 저장
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

  getCompletionStatus() {
    const surveyDone = Object.values(this.patientData.survey).filter(s => s.isDone).length;
    const cntDone = Object.values(this.patientData.cnt).filter(t => t.isDone).length;
    return `검사 완료 현황: 임상 척도 ${surveyDone}/4개, 인지 기능 ${cntDone}/5개`;
  }

  renderSurveyDetails() {
    let html = '<table class="results-table">';
    html += '<tr><th>척도</th><th>점수</th><th>경계값</th><th>상태</th><th>해석</th></tr>';
    
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
                ${exceeded ? '기준 초과 ⚠️' : '정상 범위'}
              </span>
            </td>
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
      html += '<tr><td colspan="5" class="no-data">완료된 척도가 없습니다.</td></tr>';
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

  renderSubscaleAnalysis(scale, analysis) {
    let html = '';
    
    // K-ARS의 경우 하위척도 점수 표시
    if (scale === 'scale4' && analysis.subscales) {
      html += `
        <tr class="subscale-row">
          <td colspan="5" style="padding-left: 30px; background: #f9f9f9;">
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
      html += `<tr class="subscale-row"><td colspan="5" style="padding-left: 30px; background: #f9f9f9;">
        <strong>하위척도:</strong><br>`;
      
      Object.entries(analysis.subscales).forEach(([key, subscale]) => {
        html += `• ${subscale.name}: ${subscale.score}점<br>`;
      });
      
      html += `</td></tr>`;
    }
    
    return html;
  }

  renderOverallImpression() {
    const completedSurveys = Object.entries(this.patientData.survey)
      .filter(([_, v]) => v.isDone);
    const completedCNTs = Object.entries(this.patientData.cnt)
      .filter(([_, v]) => v.isDone);
    
    const surveyCompletion = (completedSurveys.length / 4) * 100;
    const cntCompletion = (completedCNTs.length / 5) * 100;
    
    let impression = '<div class="impression-content">';
    
    // 완료율
    impression += `<h3>검사 완료율</h3>`;
    impression += `<p>임상 척도: ${Math.round(surveyCompletion)}% 완료`;
    impression += ` | 인지 기능: ${Math.round(cntCompletion)}% 완료</p>`;
    
    // 경계값 초과 항목 요약
    const exceededScales = [];
    completedSurveys.forEach(([key, value]) => {
      const cutoff = this.getCutoffScore(key);
      if (value.score >= cutoff) {
        exceededScales.push({
          scale: this.getScaleName(key),
          score: value.score,
          cutoff: cutoff,
          interpretation: value.interpretation
        });
      }
    });
    
    if (exceededScales.length > 0) {
      impression += `<h3>주요 소견</h3>`;
      impression += `<p>다음 척도에서 임상적 경계값을 초과했습니다:</p>`;
      impression += `<ul>`;
      exceededScales.forEach(item => {
        impression += `<li><strong>${item.scale}</strong>: ${item.score}점 (기준: ${item.cutoff}점)`;
        if (item.interpretation) {
          impression += ` - ${item.interpretation.label}`;
        }
        impression += `</li>`;
      });
      impression += `</ul>`;
    } else if (completedSurveys.length > 0) {
      impression += `<h3>주요 소견</h3>`;
      impression += `<p>모든 완료된 척도가 정상 범위 내에 있습니다.</p>`;
    }
    
    // 인지 기능 요약
    if (completedCNTs.length > 0) {
      const avgCNTScore = completedCNTs.reduce((sum, [_, t]) => sum + t.score, 0) / completedCNTs.length;
      
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
    
    if (exceededScales.length > 0) {
      impression += `<li>임상적 경계값을 초과한 척도가 있습니다. 정신건강 전문가와의 상담을 권장합니다.</li>`;
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

  drawSurveyChart() {
    const data = Object.entries(this.patientData.survey)
      .filter(([_, value]) => value.isDone)
      .map(([key, value]) => {
        const cutoffScore = this.getCutoffScore(key);
        const maxScore = this.getMaxScore(key);
        
        return {
          scale: this.getScaleName(key),
          score: value.score,
          percentage: (value.score / maxScore) * 100,
          cutoffScore: cutoffScore,
          cutoffPercentage: (cutoffScore / maxScore) * 100,
          exceeded: value.score >= cutoffScore
        };
      });

    if (data.length === 0) {
      document.getElementById('survey-chart').innerHTML = '<p class="no-data">완료된 척도가 없습니다.</p>';
      return;
    }

    const margin = {top: 30, right: 120, bottom: 100, left: 60};
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

    // X축 스케일
    const x = d3.scaleBand()
      .range([0, width])
      .domain(data.map(d => d.scale))
      .padding(0.3);

    // Y축 스케일 (0-100%)
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
      .attr("x", d => x(d.scale))
      .attr("y", d => y(d.percentage))
      .attr("width", x.bandwidth())
      .attr("height", d => height - y(d.percentage))
      .attr("fill", d => d.exceeded ? "#FF6B6B" : "#4CAF50")
      .attr("rx", 4);

    // 경계값 선 표시
    data.forEach(d => {
      svg.append("line")
        .attr("x1", x(d.scale))
        .attr("x2", x(d.scale) + x.bandwidth())
        .attr("y1", y(d.cutoffPercentage))
        .attr("y2", y(d.cutoffPercentage))
        .attr("stroke", "#FF5722")
        .attr("stroke-width", 3)
        .attr("stroke-dasharray", "5,5");
      
      // 경계값 텍스트
      svg.append("text")
        .attr("x", x(d.scale) + x.bandwidth() + 5)
        .attr("y", y(d.cutoffPercentage))
        .attr("dy", ".32em")
        .attr("font-size", "11px")
        .attr("fill", "#FF5722")
        .text(`기준: ${d.cutoffScore}점`);
    });

    // 점수 텍스트
    svg.selectAll(".score-text")
      .data(data)
      .enter()
      .append("text")
      .attr("x", d => x(d.scale) + x.bandwidth() / 2)
      .attr("y", d => y(d.percentage) - 5)
      .attr("text-anchor", "middle")
      .attr("font-size", "12px")
      .attr("font-weight", "bold")
      .text(d => d.score);

    // X축
    svg.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x))
      .selectAll("text")
      .attr("transform", "rotate(-45)")
      .style("text-anchor", "end");

    // Y축
    svg.append("g")
      .call(d3.axisLeft(y)
        .tickFormat(d => d + "%"));

    // Y축 라벨
    svg.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 0 - margin.left)
      .attr("x", 0 - (height / 2))
      .attr("dy", "1em")
      .style("text-anchor", "middle")
      .text("점수 비율 (%)");

    // 범례
    const legend = svg.append("g")
      .attr("transform", `translate(${width - 100}, 0)`);

    legend.append("rect")
      .attr("width", 15)
      .attr("height", 15)
      .attr("fill", "#4CAF50");

    legend.append("text")
      .attr("x", 20)
      .attr("y", 12)
      .text("정상 범위")
      .style("font-size", "12px");

    legend.append("rect")
      .attr("y", 20)
      .attr("width", 15)
      .attr("height", 15)
      .attr("fill", "#FF6B6B");

    legend.append("text")
      .attr("x", 20)
      .attr("y", 32)
      .text("기준 초과")
      .style("font-size", "12px");

    legend.append("line")
      .attr("x1", 0)
      .attr("x2", 15)
      .attr("y1", 50)
      .attr("y2", 50)
      .attr("stroke", "#FF5722")
      .attr("stroke-width", 3)
      .attr("stroke-dasharray", "5,5");

    legend.append("text")
      .attr("x", 20)
      .attr("y", 55)
      .text("경계값")
      .style("font-size", "12px");
  }

  drawCNTChart() {
    const data = Object.entries(this.patientData.cnt)
      .filter(([_, value]) => value.isDone)
      .map(([key, value]) => ({
        task: this.getTaskName(key),
        score: value.score
      }));

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
      .attr("fill", d => {
        if (d.score >= 75) return "#4CAF50";
        else if (d.score >= 50) return "#FFC107";
        else return "#FF6B6B";
      })
      .attr("rx", 4);

    // 점수 텍스트
    svg.selectAll(".score-text")
      .data(data)
      .enter()
      .append("text")
      .attr("x", d => x(d.task) + x.bandwidth() / 2)
      .attr("y", d => y(d.score) - 5)
      .attr("text-anchor", "middle")
      .attr("font-size", "12px")
      .attr("font-weight", "bold")
      .text(d => d.score);

    // X축
    svg.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x));

    // Y축
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

    // 수행 수준 가이드라인
    const guidelines = [
      { y: 75, label: "우수", color: "#4CAF50" },
      { y: 50, label: "평균", color: "#FFC107" },
      { y: 25, label: "평균 이하", color: "#FF6B6B" }
    ];

    guidelines.forEach(guideline => {
      svg.append("line")
        .attr("x1", 0)
        .attr("x2", width)
        .attr("y1", y(guideline.y))
        .attr("y2", y(guideline.y))
        .attr("stroke", guideline.color)
        .attr("stroke-width", 1)
        .attr("stroke-dasharray", "3,3")
        .attr("opacity", 0.5);

      svg.append("text")
        .attr("x", width + 5)
        .attr("y", y(guideline.y))
        .attr("dy", ".32em")
        .attr("font-size", "10px")
        .attr("fill", guideline.color)
        .text(guideline.label);
    });
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

  getCutoffScore(scale) {
    const cutoffScores = {
      'scale1': 16,  // CES-DC: 16점 이상이면 우울 의심
      'scale2': 8,   // BAI: 8점 이상이면 불안 의심
      'scale3': 82,  // K-AQ: 82점 이상이면 높은 공격성
      'scale4': 19   // K-ARS: 19점 이상이면 ADHD 의심
    };
    
    return cutoffScores[scale];
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
          { max: 20, level: 'mild', label: '경도 우울', description: '가벼운 우울 증상이 있습니다.' },
          { max: 30, level: 'moderate', label: '중등도 우울', description: '중간 정도의 우울 증상이 있습니다.' },
          { max: 60, level: 'severe', label: '심한 우울', description: '심각한 우울 증상입니다. 전문가 상담이 필요합니다.' }
        ]
      },
      scale2: { // BAI
        ranges: [
          { max: 7, level: 'minimal', label: '최소 불안', description: '불안이 정상 수준입니다.' },
          { max: 15, level: 'mild', label: '경한 불안', description: '경미한 불안 증상이 있습니다.' },
          { max: 25, level: 'moderate', label: '중등도 불안', description: '치료를 고려해야 할 수준입니다.' },
          { max: 63, level: 'severe', label: '심한 불안', description: '즉각적인 치료가 필요합니다.' }
        ]
      },
      scale3: { // K-AQ
        ranges: [
          { max: 54, level: 'low', label: '낮은 공격성', description: '평균 이하의 공격성입니다.' },
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
    const languages = {
      ko: '한국어',
      en: 'English',
      ja: '日本語',
      zh: '中文',
      vn: 'Tiếng Việt',
      th: 'ภาษาไทย'
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
      task4: '표정 인식',
      task5: '회전 도형'
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
  
  .report-date {
    text-align: center;
    color: #666;
    font-size: 14px;
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
    background: #fafafa;
    padding: 20px;
    border-radius: 8px;
    min-height: 300px;
  }
  
  .results-table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 20px;
  }
  
  .results-table th {
    background: #1976d2;
    color: white;
    padding: 12px;
    text-align: left;
  }
  
  .results-table td {
    padding: 10px;
    border-bottom: 1px solid #e0e0e0;
  }
  
  .results-table tr:nth-child(even) {
    background: #f8f9fa;
  }
  
  .exceeded-cutoff {
    background-color: #ffebee !important;
  }
  
  .status-exceeded {
    color: #d32f2f;
    font-weight: bold;
  }
  
  .status-normal {
    color: #388e3c;
  }
  
  .subscale-row {
    font-size: 0.9em;
  }
  
  .subscale-row td {
    padding-left: 30px !important;
    background: #f9f9f9;
  }
  
  .no-data {
    text-align: center;
    color: #666;
    padding: 20px;
  }
  
  .score-excellent { color: #1b5e20; font-weight: bold; }
  .score-good { color: #388e3c; font-weight: bold; }
  .score-average { color: #f57c00; }
  .score-below { color: #e65100; }
  .score-impaired { color: #b71c1c; font-weight: bold; }
  
  .impression-content {
    background: #fffde7;
    padding: 20px;
    border-radius: 8px;
    line-height: 1.6;
  }
  
  .impression-content h3 {
    color: #f57f17;
    margin-top: 20px;
    margin-bottom: 10px;
  }
  
  .impression-content ul {
    margin-left: 20px;
  }
  
  .impression-content li {
    margin-bottom: 8px;
  }
  
  .report-actions {
    margin-top: 40px;
    text-align: center;
    padding-top: 20px;
    border-top: 2px solid #e0e0e0;
  }
  
  .save-btn {
    padding: 12px 30px;
    background: #2196f3;
    color: white;
    border: none;
    border-radius: 4px;
    font-size: 16px;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 10px;
  }
  
  .save-btn:hover {
    background: #1976d2;
  }
  
  .save-btn:disabled {
    background: #ccc;
    cursor: not-allowed;
  }
  
  .btn-icon {
    font-size: 20px;
  }
  
  @media print {
    .back-btn, .report-actions {
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