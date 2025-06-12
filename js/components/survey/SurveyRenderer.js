import { surveyQuestionLoader } from '../../services/SurveyQuestionLoader.js';

export class SurveyRenderer {
  constructor(manager) {
    this.manager = manager;
    this.questionData = null;
  }

  async renderSurvey() {
    const currentScale = this.manager.getCurrentScale();
    const scaleId = this.getScaleId(currentScale);
    const language = this.manager.patientData.language;

    // 질문 데이터 로드
    this.questionData = await surveyQuestionLoader.loadQuestions(scaleId, language);

    const progress = this.calculateProgress();

    this.manager.container.innerHTML = `
      <div class="survey-container">
        ${this.renderHeader()}
        ${this.renderInstruction()}
        
        <div id="scale-questions">
          ${this.renderQuestions()}
        </div>
        
        <div class="survey-navigation">
          ${this.renderProgressIndicator(progress)}
        </div>
        
        <div class="button-container">
          <button id="submit-scale" class="submit-btn" onclick="window.surveyInstance.submitScale()">
            ${this.getSubmitButtonText()}
          </button>
        </div>
      </div>
    `;

    window.surveyInstance = this.manager;
    this.attachEventListeners();
  }

  renderHeader() {
    const { scale } = this.questionData;

    return `
      <div class="survey-header">
        <h2>${scale.name}</h2>
        <p class="scale-description">${scale.description || ''}</p>
      </div>
    `;
  }

  renderInstruction() {
    const { scale } = this.questionData;

    if (!scale.instruction) return '';

    return `
      <div class="survey-instruction">
        <p>${scale.instruction}</p>
      </div>
    `;
  }

  renderQuestions() {
    const { questions } = this.questionData;
    let html = '<div class="questions-container">';

    questions.forEach((question, index) => {
      const isAnswered = this.manager.currentResponses[index] !== undefined;
      const isCritical = question.critical || false;

      html += `
        <div class="question-item ${isAnswered ? 'answered' : ''} ${isCritical ? 'critical' : ''}" 
             id="question-${index}">
          <div class="question-header">
            <span class="question-number">${index + 1}</span>
            ${isCritical ? '<span class="critical-indicator">중요</span>' : ''}
            <span class="question-status">${isAnswered ? '✓' : ''}</span>
          </div>
          <p class="question-text">
            ${question.text}
          </p>
          <div class="likert-scale">
            ${this.renderLikertScale(index)}
          </div>
        </div>
      `;
    });

    html += '</div>';
    return html;
  }

  renderLikertScale(questionIndex) {
    const { response_options } = this.questionData;
    const value = this.manager.currentResponses[questionIndex];

    return `
      <div class="likert-options" data-question="${questionIndex}">
        ${response_options.map((option) => `
          <label class="likert-label ${value === option.value ? 'selected' : ''}">
            <input type="radio" 
                   name="q${questionIndex}" 
                   value="${option.value}" 
                   ${value === option.value ? 'checked' : ''}
                   onchange="window.surveyInstance.updateResponse(${questionIndex}, ${option.value})">
            <span class="likert-value">${option.value}</span>
            <small class="likert-text">${option.label}</small>
          </label>
        `).join('')}
      </div>
    `;
  }

  getScaleId(scaleName) {
    // scale1 -> depression 등의 매핑
    const mapping = {
      scale1: 'ces-dc',
      scale2: 'bai',
      scale3: 'k-aq',
      scale4: 'k-ars'
    };

    return mapping[scaleName] || scaleName;
  }
  getSubmitButtonText() {
    const answered = this.manager.currentResponses.filter(r => r !== undefined).length;
    const total = this.questionData?.questions?.length || 0;
    const language = this.manager.patientData.language;

    // 언어별 텍스트 정의
    const texts = {
      ko: {
        incomplete: `완료 (${answered}/${total} 답변됨)`,
        complete: '이 척도 완료'
      },
      en: {
        incomplete: `Complete (${answered}/${total} answered)`,
        complete: 'Complete this scale'
      },
      ja: {
        incomplete: `完了 (${answered}/${total} 回答済み)`,
        complete: 'このスケールを完了'
      },
      zh: {
        incomplete: `完成 (${answered}/${total} 已回答)`,
        complete: '完成此量表'
      },
      vn: {
        incomplete: `Hoàn thành (${answered}/${total} đã trả lời)`,
        complete: 'Hoàn thành thang đo này'
      },
      th: {
        incomplete: `เสร็จสิ้น (ตอบแล้ว ${answered}/${total})`,
        complete: 'เสร็จสิ้นแบบประเมินนี้'
      }
    };

    // 언어가 없으면 한국어로 폴백
    const langTexts = texts[language] || texts.ko;

    // 모든 문항을 답변했는지 확인
    if (answered < total) {
      return langTexts.incomplete;
    }
    return langTexts.complete;
  }
  getLocalizedScaleName(scale) {
    const lang = this.manager.patientData.language;
    const names = {
      ko: {
        scale1: '아동 우울 척도 (CES-DC)',
        scale2: '벡 불안 척도 (BAI)',
        scale3: '한국판 공격성 질문지 (K-AQ)',
        scale4: '한국형 ADHD 평가척도 (K-ARS)'
      },
      en: {
        scale1: 'Depression Scale (CES-DC)',
        scale2: 'Anxiety Scale (BAI)',
        scale3: 'Aggression Questionnaire (K-AQ)',
        scale4: 'ADHD Rating Scale (K-ARS)'
      },
      ja: {
        scale1: 'うつ病評価尺度 (CES-DC)',
        scale2: '不安尺度 (BAI)',
        scale3: '攻撃性質問紙 (K-AQ)',
        scale4: 'ADHD評価尺度 (K-ARS)'
      },
      zh: {
        scale1: '儿童抑郁量表 (CES-DC)',
        scale2: '贝克焦虑量表 (BAI)',
        scale3: '攻击性问卷 (K-AQ)',
        scale4: 'ADHD评定量表 (K-ARS)'
      },
      vn: {
        scale1: 'Thang đo trầm cảm (CES-DC)',
        scale2: 'Thang đo lo âu (BAI)',
        scale3: 'Bảng câu hỏi hung tính (K-AQ)',
        scale4: 'Thang đánh giá ADHD (K-ARS)'
      },
      th: {
        scale1: 'แบบประเมินภาวะซึมเศร้า (CES-DC)',
        scale2: 'แบบประเมินความวิตกกังวล (BAI)',
        scale3: 'แบบสอบถามความก้าวร้าว (K-AQ)',
        scale4: 'แบบประเมิน ADHD (K-ARS)'
      }
    };

    return names[lang]?.[scale] || names.ko[scale] || scale;
  }

  renderProgressIndicator(progress) {
    const lang = this.manager.patientData.language;

    const answeredTexts = {
      ko: `답변: ${progress.answered}/${progress.totalQuestions}`,
      en: `Answered: ${progress.answered}/${progress.totalQuestions}`,
      ja: `回答済み: ${progress.answered}/${progress.totalQuestions}`,
      zh: `已回答: ${progress.answered}/${progress.totalQuestions}`,
      vn: `Đã trả lời: ${progress.answered}/${progress.totalQuestions}`,
      th: `ตอบแล้ว: ${progress.answered}/${progress.totalQuestions}`
    };

    return `
      <div class="progress-indicator">
        <span class="answered-count">${answeredTexts[lang] || answeredTexts.ko}</span>
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
          <button onclick="window.surveyInstance.nextQuestion()" ㅎㄷ시ㅐ
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
    // 스크롤 동작만 유지
    document.querySelectorAll('.dot').forEach((dot, index) => {
      dot.addEventListener('click', () => {
        this.manager.scrollToQuestion(index);
      });
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
      en: ['Not at all', 'Rarely', 'Sometimes', 'Often', 'Very often'],
      ja: ['全くない', 'めったにない', '時々', 'よくある', 'いつも'],
      zh: ['完全没有', '很少', '有时', '经常', '总是'],
      vn: ['Hoàn toàn không', 'Hiếm khi', 'Đôi khi', 'Thường xuyên', 'Luôn luôn'],
      th: ['ไม่เลย', 'นานๆครั้ง', 'บางครั้ง', 'บ่อย', 'ตลอดเวลา']
    };

    return labels[lang] || labels.ko;
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



const additionalStyles = `
.survey-instruction {
  background: #f0f7ff;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 30px;
  border-left: 4px solid #2196F3;
}

.survey-instruction p {
  margin: 0;
  color: #1565c0;
  font-size: 16px;
  line-height: 1.6;
}

.scale-description {
  color: #666;
  font-size: 14px;
  margin-top: 10px;
}

.question-item.critical {
  border-color: #ff9800;
  background: #fff8e1;
}

.critical-indicator {
  background: #ff9800;
  color: white;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
}

.question-category {
  display: inline-block;
  background: #e3f2fd;
  color: #1976d2;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  margin-left: 8px;
}
.button-container {
  margin-top: 40px;
  text-align: center;
}

.submit-btn {
  min-width: 200px;
  padding: 16px 48px;
  background: #2196F3;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 18px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(33, 150, 243, 0.3);
}

.submit-btn:hover {
  background: #1976D2;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(33, 150, 243, 0.4);
}

.submit-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
  box-shadow: none;
  transform: none;
}
.survey-navigation {
  margin: 30px 0;
  padding: 20px;
  background: #f5f5f5;
  border-radius: 8px;
}

.progress-indicator {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.answered-count {
  font-size: 16px;
  font-weight: 600;
  color: #2196F3;
}

.question-dots {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  justify-content: center;
  margin-top: 10px;
}

.dot {
  width: 10px;
  height: 10px;
  background: #e0e0e0;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s;
}

.dot.answered {
  background: #4CAF50;
}

.dot:hover {
  transform: scale(1.2);
}
`;