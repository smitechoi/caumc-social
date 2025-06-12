
// ================================================
// js/components/survey/SurveyRenderer.js
export class SurveyRenderer {
    constructor(manager) {
      this.manager = manager;
    }
  
    renderSurvey() {
      const currentScale = this.manager.getCurrentScale();
      const config = this.manager.getScaleConfig();
      const progress = this.calculateProgress();
      
      this.manager.container.innerHTML = `
        <div class="survey-container">
          ${this.renderHeader(currentScale, config, progress)}
          
          <div id="scale-questions">
            ${this.renderQuestions(currentScale, config)}
          </div>
          
          <div class="survey-navigation">
            ${this.renderProgressIndicator(progress)}
            ${this.renderNavigationButtons()}
          </div>
          
          <div class="button-container">
            <button id="submit-scale" onclick="window.surveyInstance.submitScale()">
              이 척도 완료
            </button>
          </div>
        </div>
      `;
  
      window.surveyInstance = this.manager;
      this.attachEventListeners();
    }
  
    renderHeader(scaleName, config, progress) {
      return `
        <div class="survey-header">
          <h2>임상 척도 검사 - ${this.getLocalizedScaleName(scaleName)}</h2>
          <div class="current-scale-info">
            <span class="scale-badge">${scaleName.replace('scale', 'Scale ')}</span>
            <span class="scale-name">${this.getLocalizedScaleName(scaleName)}</span>
          </div>
          <div class="progress">
            <div class="progress-text">
              전체 진행률: ${progress.completed}/${progress.total} 완료
            </div>
            <div class="progress-bar">
              <div class="progress-fill" style="width: ${progress.percentage}%"></div>
            </div>
          </div>
        </div>
      `;
    }
  
    renderQuestions(scaleName, config) {
      let html = '<div class="questions-container">';
      
      for (let i = 0; i < config.questions; i++) {
        const isAnswered = this.manager.currentResponses[i] !== undefined;
        
        html += `
          <div class="question-item ${isAnswered ? 'answered' : ''}" id="question-${i}">
            <div class="question-header">
              <span class="question-number">${i + 1}</span>
              <span class="question-status">${isAnswered ? '✓' : ''}</span>
            </div>
            <p class="question-text">
              ${this.getLocalizedQuestion(scaleName, i)}
            </p>
            <div class="likert-scale">
              ${this.renderLikertScale(i)}
            </div>
          </div>
        `;
      }
      
      html += '</div>';
      return html;
    }
  
    renderLikertScale(questionIndex) {
      const labels = this.getLocalizedLikertLabels();
      const value = this.manager.currentResponses[questionIndex];
      
      return `
        <div class="likert-options" data-question="${questionIndex}">
          ${labels.map((label, idx) => `
            <label class="likert-label ${value === idx ? 'selected' : ''}">
              <input type="radio" 
                     name="q${questionIndex}" 
                     value="${idx}" 
                     ${value === idx ? 'checked' : ''}
                     onchange="window.surveyInstance.updateResponse(${questionIndex}, ${idx})">
              <span class="likert-value">${idx}</span>
              <small class="likert-text">${label}</small>
            </label>
          `).join('')}
        </div>
      `;
    }
  
    renderProgressIndicator(progress) {
      return `
        <div class="question-progress">
          <div class="answered-count">
            답변: ${progress.answered}/${progress.totalQuestions}
          </div>
          <div class="question-dots">
            ${this.renderQuestionDots()}
          </div>
        </div>
      `;
    }
  
    renderQuestionDots() {
      const config = this.manager.getScaleConfig();
      let dots = '';
      
      for (let i = 0; i < config.questions; i++) {
        const isAnswered = this.manager.currentResponses[i] !== undefined;
        dots += `<span class="dot ${isAnswered ? 'answered' : ''}" 
                       onclick="window.surveyInstance.scrollToQuestion(${i})"></span>`;
      }
      
      return dots;
    }
  
    renderNavigationButtons() {
      return `
        <div class="nav-buttons">
          <button onclick="window.surveyInstance.previousQuestion()" 
                  class="nav-btn prev-btn">이전</button>
          <button onclick="window.surveyInstance.nextQuestion()" 
                  class="nav-btn next-btn">다음</button>
        </div>
      `;
    }
  
    renderComplete() {
      const currentScale = this.manager.scales[0]; // 개별 척도 모드
      const scaleData = this.manager.patientData.survey[currentScale];
      
      this.manager.container.innerHTML = `
        <div class="survey-complete">
          <div class="complete-icon">✓</div>
          <h2>${this.getLocalizedScaleName(currentScale)} 완료!</h2>
          <div class="score-summary">
            <h3>검사 결과</h3>
            <div class="score-display">
              <span class="score-value">${scaleData.score}</span>
              <span class="score-label">점</span>
            </div>
            ${this.renderScoreInterpretation(currentScale, scaleData)}
          </div>
          <button onclick="window.location.hash='#survey-selection'" class="back-btn">
            다른 척도 선택하기
          </button>
        </div>
      `;
    }
  
    renderScoreInterpretation(scale, data) {
      const interpretation = this.getScoreInterpretation(scale, data.score, data.questions.length);
      
      return `
        <div class="score-interpretation">
          <div class="interpretation-level ${interpretation.level}">
            ${interpretation.label}
          </div>
          <p class="interpretation-text">${interpretation.description}</p>
        </div>
      `;
    }
  
    updateQuestionUI(questionIndex, value) {
      // 라디오 버튼 업데이트
      const options = document.querySelectorAll(`input[name="q${questionIndex}"]`);
      options.forEach(option => {
        const label = option.closest('.likert-label');
        if (parseInt(option.value) === value) {
          label.classList.add('selected');
        } else {
          label.classList.remove('selected');
        }
      });
      
      // 질문 상태 업데이트
      const questionItem = document.getElementById(`question-${questionIndex}`);
      questionItem.classList.add('answered');
      questionItem.querySelector('.question-status').textContent = '✓';
      
      // 진행 상황 업데이트
      this.updateProgressIndicator();
    }
  
    updateProgressIndicator() {
      const answered = this.manager.currentResponses.filter(r => r !== undefined).length;
      const total = this.manager.getScaleConfig().questions;
      
      document.querySelector('.answered-count').textContent = `답변: ${answered}/${total}`;
      
      // 점 업데이트
      const dots = document.querySelectorAll('.question-dots .dot');
      this.manager.currentResponses.forEach((response, idx) => {
        if (response !== undefined && dots[idx]) {
          dots[idx].classList.add('answered');
        }
      });
    }
  
    highlightQuestion(questionIndex) {
      const questionItem = document.getElementById(`question-${questionIndex}`);
      questionItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
      questionItem.classList.add('highlight');
      
      setTimeout(() => {
        questionItem.classList.remove('highlight');
      }, 2000);
    }
  
    calculateProgress() {
      const currentIndex = this.manager.currentScaleIndex;
      const totalScales = this.manager.scales.length;
      const config = this.manager.getScaleConfig();
      const answered = this.manager.currentResponses.filter(r => r !== undefined).length;
      
      return {
        completed: currentIndex,
        total: totalScales,
        percentage: Math.round((currentIndex / totalScales) * 100),
        answered: answered,
        totalQuestions: config?.questions || 0
      };
    }
  
    attachEventListeners() {
      // 키보드 네비게이션
      document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') {
          this.manager.previousQuestion();
        } else if (e.key === 'ArrowRight') {
          this.manager.nextQuestion();
        }
      });
    }
  
    // 다국어 지원 메서드들
    getLocalizedScaleName(scale) {
      const lang = this.manager.patientData.language;
      const names = {
        ko: {
          scale1: '우울 척도',
          scale2: '불안 척도',
          scale3: '스트레스 척도',
          scale4: '삶의 질'
        },
        en: {
          scale1: 'Depression Scale',
          scale2: 'Anxiety Scale',
          scale3: 'Stress Scale',
          scale4: 'Quality of Life'
        }
      };
      
      return names[lang]?.[scale] || surveyConfig.scales[scale]?.name || scale;
    }
  
    getLocalizedQuestion(scale, index) {
      const lang = this.manager.patientData.language;
      // 실제로는 외부 파일에서 로드
      return `${scale} 질문 ${index + 1} (${lang})`;
    }
  
    getLocalizedLikertLabels() {
      const lang = this.manager.patientData.language;
      const labels = {
        ko: ['전혀 아니다', '아니다', '보통이다', '그렇다', '매우 그렇다'],
        en: ['Not at all', 'Rarely', 'Sometimes', 'Often', 'Very often']
      };
      
      return labels[lang] || labels['ko'];
    }
  
    getScoreInterpretation(scale, score, questionCount) {
      const percentage = (score / (questionCount * 4)) * 100;
      
      const interpretations = {
        scale1: { // 우울
          low: { 
            label: '정상', 
            description: '우울 증상이 거의 없습니다.' 
          },
          mild: { 
            label: '경도', 
            description: '가벼운 우울 증상이 있을 수 있습니다.' 
          },
          moderate: { 
            label: '중등도', 
            description: '중간 정도의 우울 증상이 있습니다.' 
          },
          severe: { 
            label: '심각', 
            description: '전문가 상담이 권장됩니다.' 
          }
        }
        // ... 다른 척도들
      };
      
      let level;
      if (percentage < 25) level = 'low';
      else if (percentage < 50) level = 'mild';
      else if (percentage < 75) level = 'moderate';
      else level = 'severe';
      
      return {
        level: `level-${level}`,
        ...interpretations[scale]?.[level] || interpretations.scale1[level]
      };
    }
  }
  