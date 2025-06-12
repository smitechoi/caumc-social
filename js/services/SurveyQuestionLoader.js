export class SurveyQuestionLoader {
  constructor() {
    this.cache = new Map();
    this.basePath = './data/surveys'; // 상대 경로로 수정
  }

  /**
   * 특정 척도의 질문 로드
   * @param {string} scaleId - 척도 ID (예: 'ces-dc', 'bai', 'k-aq', 'k-ars')
   * @param {string} language - 언어 코드 (예: 'ko', 'en', 'ja', 'zh', 'vn', 'th')
   * @returns {Promise<Object>} 질문 데이터
   */
  async loadQuestions(scaleId, language = 'ko') {
    const cacheKey = `${language}_${scaleId}`;
    
    // 캐시 확인
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      const response = await fetch(`${this.basePath}/${language}/${scaleId}.json`);
      
      if (!response.ok) {
        // 언어별 파일이 없으면 기본 언어(한국어)로 폴백
        if (language !== 'ko') {
          console.warn(`No ${language} translation for ${scaleId}, falling back to Korean`);
          return this.loadQuestions(scaleId, 'ko');
        }
        throw new Error(`Failed to load questions for ${scaleId}`);
      }

      const data = await response.json();
      
      // 데이터 검증
      this.validateQuestionData(data);
      
      // 캐시에 저장
      this.cache.set(cacheKey, data);
      
      return data;
    } catch (error) {
      console.error(`Error loading questions for ${scaleId}:`, error);
      
      // 개발 중 임시 데이터 반환
      return this.getDefaultQuestions(scaleId, language);
    }
  }

  /**
   * 질문 데이터 유효성 검증
   */
  validateQuestionData(data) {
    if (!data.scale || !data.questions || !Array.isArray(data.questions)) {
      throw new Error('Invalid question data format');
    }

    if (data.questions.length === 0) {
      throw new Error('No questions found');
    }

    // 각 질문 검증
    data.questions.forEach((q, index) => {
      if (!q.id || !q.text) {
        throw new Error(`Invalid question at index ${index}`);
      }
    });
  }

  /**
   * 모든 척도의 메타데이터 로드
   */
  async loadAllScalesMetadata(language = 'ko') {
    try {
      const response = await fetch(`${this.basePath}/${language}/scales-metadata.json`);
      if (!response.ok) {
        throw new Error('Failed to load scales metadata');
      }
      return await response.json();
    } catch (error) {
      console.error('Error loading scales metadata:', error);
      return this.getDefaultScalesMetadata();
    }
  }

  /**
   * 개발용 기본 질문 데이터
   */
  getDefaultQuestions(scaleId, language) {
    const defaults = {
      'ces-dc': {
        scale: {
          id: 'ces-dc',
          name: this.getScaleName('ces-dc', language),
          description: this.getScaleDescription('ces-dc', language),
          instruction: this.getScaleInstruction('ces-dc', language),
          questions: 20,
          reversedItems: [4, 8, 12, 16], // 역채점 문항
          scoring: {
            ranges: [
              { min: 0, max: 15, level: 'normal', label: this.getInterpretationLabel('normal', language) },
              { min: 16, max: 20, level: 'mild', label: this.getInterpretationLabel('mild', language) },
              { min: 21, max: 30, level: 'moderate', label: this.getInterpretationLabel('moderate', language) },
              { min: 31, max: 60, level: 'severe', label: this.getInterpretationLabel('severe', language) }
            ]
          }
        },
        questions: Array(20).fill(0).map((_, i) => ({
          id: `ces_dc_${i + 1}`,
          text: this.getQuestionText('ces-dc', i + 1, language),
          required: true
        })),
        response_options: this.getCESDCResponseOptions(language)
      },
      'bai': {
        scale: {
          id: 'bai',
          name: this.getScaleName('bai', language),
          description: this.getScaleDescription('bai', language),
          instruction: this.getScaleInstruction('bai', language),
          questions: 21,
          scoring: {
            ranges: [
              { min: 0, max: 7, level: 'minimal', label: this.getInterpretationLabel('minimal', language) },
              { min: 8, max: 15, level: 'mild', label: this.getInterpretationLabel('mild', language) },
              { min: 16, max: 25, level: 'moderate', label: this.getInterpretationLabel('moderate', language) },
              { min: 26, max: 63, level: 'severe', label: this.getInterpretationLabel('severe', language) }
            ]
          }
        },
        questions: Array(21).fill(0).map((_, i) => ({
          id: `bai_${i + 1}`,
          text: this.getQuestionText('bai', i + 1, language),
          required: true
        })),
        response_options: this.getBAIResponseOptions(language)
      },
      'k-aq': {
        scale: {
          id: 'k-aq',
          name: this.getScaleName('k-aq', language),
          description: this.getScaleDescription('k-aq', language),
          instruction: this.getScaleInstruction('k-aq', language),
          questions: 27,
          reversedItems: [15, 24], // 역채점 문항
          subscales: {
            physicalAggression: [1, 5, 9, 13, 17, 21, 24, 26, 27],
            verbalAggression: [2, 6, 10, 14, 18],
            anger: [3, 7, 11, 15, 19, 22],
            hostility: [4, 8, 12, 16, 20, 23, 25]
          }
        },
        questions: Array(27).fill(0).map((_, i) => ({
          id: `k_aq_${i + 1}`,
          text: this.getQuestionText('k-aq', i + 1, language),
          required: true
        })),
        response_options: this.getKAQResponseOptions(language)
      },
      'k-ars': {
        scale: {
          id: 'k-ars',
          name: this.getScaleName('k-ars', language),
          description: this.getScaleDescription('k-ars', language),
          instruction: this.getScaleInstruction('k-ars', language),
          questions: 18,
          subscales: {
            inattention: [1, 3, 5, 7, 9, 11, 13, 15, 17], // 홀수 문항
            hyperactivity: [2, 4, 6, 8, 10, 12, 14, 16, 18] // 짝수 문항
          },
          cutoffScores: {
            inattention: 19,
            hyperactivity: 17
          }
        },
        questions: Array(18).fill(0).map((_, i) => ({
          id: `k_ars_${i + 1}`,
          text: this.getQuestionText('k-ars', i + 1, language),
          required: true
        })),
        response_options: this.getKARSResponseOptions(language)
      }
    };

    return defaults[scaleId] || defaults['ces-dc'];
  }

  // 척도명 번역
  getScaleName(scaleId, language) {
    const names = {
      'ces-dc': {
        ko: '아동 우울 척도 (CES-DC)',
        en: 'Depression Scale for Children (CES-DC)',
        ja: '児童うつ病評価尺度 (CES-DC)',
        zh: '儿童抑郁量表 (CES-DC)',
        vn: 'Thang đo trầm cảm cho trẻ em (CES-DC)',
        th: 'แบบประเมินภาวะซึมเศร้าสำหรับเด็ก (CES-DC)'
      },
      'bai': {
        ko: '벡 불안 척도 (BAI)',
        en: 'Beck Anxiety Inventory (BAI)',
        ja: 'ベック不安尺度 (BAI)',
        zh: '贝克焦虑量表 (BAI)',
        vn: 'Thang đo lo âu Beck (BAI)',
        th: 'แบบประเมินความวิตกกังวลของเบค (BAI)'
      },
      'k-aq': {
        ko: '한국판 공격성 질문지 (K-AQ)',
        en: 'Korean Aggression Questionnaire (K-AQ)',
        ja: '韓国版攻撃性質問紙 (K-AQ)',
        zh: '韩国版攻击性问卷 (K-AQ)',
        vn: 'Bảng câu hỏi hung tính phiên bản Hàn Quốc (K-AQ)',
        th: 'แบบสอบถามความก้าวร้าวฉบับเกาหลี (K-AQ)'
      },
      'k-ars': {
        ko: '한국형 ADHD 평가척도 (K-ARS)',
        en: 'Korean ADHD Rating Scale (K-ARS)',
        ja: '韓国版ADHD評価尺度 (K-ARS)',
        zh: '韩国版ADHD评定量表 (K-ARS)',
        vn: 'Thang đánh giá ADHD phiên bản Hàn Quốc (K-ARS)',
        th: 'แบบประเมิน ADHD ฉบับเกาหลี (K-ARS)'
      }
    };
    
    return names[scaleId]?.[language] || names[scaleId]?.['ko'] || scaleId;
  }

  // 척도 설명
  getScaleDescription(scaleId, language) {
    const descriptions = {
      'ces-dc': {
        ko: '지난 일주일 동안의 기분과 느낌에 대한 질문입니다.',
        en: 'Questions about your feelings and mood over the past week.',
        ja: '過去1週間の気分や感情についての質問です。',
        zh: '关于过去一周心情和感受的问题。',
        vn: 'Câu hỏi về cảm xúc và tâm trạng của bạn trong tuần qua.',
        th: 'คำถามเกี่ยวกับความรู้สึกและอารมณ์ในสัปดาห์ที่ผ่านมา'
      },
      'bai': {
        ko: '지난 일주일 동안 경험한 불안 증상에 대한 질문입니다.',
        en: 'Questions about anxiety symptoms experienced over the past week.',
        ja: '過去1週間に経験した不安症状についての質問です。',
        zh: '关于过去一周经历的焦虑症状的问题。',
        vn: 'Câu hỏi về các triệu chứng lo âu trong tuần qua.',
        th: 'คำถามเกี่ยวกับอาการวิตกกังวลในสัปดาห์ที่ผ่านมา'
      },
      'k-aq': {
        ko: '평소 행동과 감정에 대한 질문입니다.',
        en: 'Questions about your usual behaviors and emotions.',
        ja: '普段の行動や感情についての質問です。',
        zh: '关于平时行为和情绪的问题。',
        vn: 'Câu hỏi về hành vi và cảm xúc thường ngày.',
        th: 'คำถามเกี่ยวกับพฤติกรรมและอารมณ์ปกติ'
      },
      'k-ars': {
        ko: '주의력과 활동성에 대한 질문입니다.',
        en: 'Questions about attention and activity levels.',
        ja: '注意力と活動性についての質問です。',
        zh: '关于注意力和活动水平的问题。',
        vn: 'Câu hỏi về sự chú ý và mức độ hoạt động.',
        th: 'คำถามเกี่ยวกับสมาธิและระดับกิจกรรม'
      }
    };
    
    return descriptions[scaleId]?.[language] || descriptions[scaleId]?.['ko'] || '';
  }

  // 척도 지시문
  getScaleInstruction(scaleId, language) {
    const instructions = {
      'ces-dc': {
        ko: '아래 문항을 읽고 지난 일주일 동안 얼마나 자주 그렇게 느꼈는지 선택해 주세요.',
        en: 'Please read each statement and select how often you felt this way during the past week.',
        ja: '以下の項目を読んで、過去1週間どのくらい頻繁にそう感じたか選択してください。',
        zh: '请阅读以下陈述，选择过去一周您有多频繁地有这种感觉。',
        vn: 'Vui lòng đọc mỗi câu và chọn mức độ thường xuyên bạn cảm thấy như vậy trong tuần qua.',
        th: 'โปรดอ่านข้อความและเลือกว่าคุณรู้สึกแบบนี้บ่อยแค่ไหนในสัปดาห์ที่ผ่านมา'
      },
      'bai': {
        ko: '아래 증상들이 지난 일주일 동안 당신을 얼마나 괴롭혔는지 선택해 주세요.',
        en: 'Please indicate how much you have been bothered by each symptom during the past week.',
        ja: '過去1週間、以下の症状にどの程度悩まされたか選択してください。',
        zh: '请指出过去一周每个症状对您造成了多大困扰。',
        vn: 'Vui lòng cho biết mỗi triệu chứng đã làm phiền bạn nhiều như thế nào trong tuần qua.',
        th: 'โปรดระบุว่าอาการแต่ละอย่างรบกวนคุณมากน้อยเพียงใดในสัปดาห์ที่ผ่านมา'
      },
      'k-aq': {
        ko: '각 문항이 평소 자신의 모습과 얼마나 일치하는지 선택해 주세요.',
        en: 'Please select how well each statement describes you.',
        ja: '各項目が普段の自分とどの程度一致するか選択してください。',
        zh: '请选择每个陈述与您平时的情况有多符合。',
        vn: 'Vui lòng chọn mức độ mỗi câu mô tả đúng về bạn.',
        th: 'โปรดเลือกว่าข้อความแต่ละข้อตรงกับตัวคุณมากน้อยเพียงใด'
      },
      'k-ars': {
        ko: '각 문항이 아이의 최근 6개월간 행동과 얼마나 일치하는지 선택해 주세요.',
        en: "Please select how well each statement describes the child's behavior over the past 6 months.",
        ja: '各項目が子どもの最近6ヶ月間の行動とどの程度一致するか選択してください。',
        zh: '请选择每个陈述与孩子过去6个月的行为有多符合。',
        vn: 'Vui lòng chọn mức độ mỗi câu mô tả đúng về hành vi của trẻ trong 6 tháng qua.',
        th: 'โปรดเลือกว่าข้อความแต่ละข้อตรงกับพฤติกรรมของเด็กใน 6 เดือนที่ผ่านมามากน้อยเพียงใด'
      }
    };
    
    return instructions[scaleId]?.[language] || instructions[scaleId]?.['ko'] || '';
  }

  // 해석 레벨 라벨
  getInterpretationLabel(level, language) {
    const labels = {
      normal: { ko: '정상', en: 'Normal', ja: '正常', zh: '正常', vn: 'Bình thường', th: 'ปกติ' },
      minimal: { ko: '최소', en: 'Minimal', ja: '最小', zh: '轻微', vn: 'Tối thiểu', th: 'น้อยที่สุด' },
      mild: { ko: '경도', en: 'Mild', ja: '軽度', zh: '轻度', vn: 'Nhẹ', th: 'เล็กน้อย' },
      moderate: { ko: '중등도', en: 'Moderate', ja: '中等度', zh: '中度', vn: 'Trung bình', th: 'ปานกลาง' },
      severe: { ko: '심각', en: 'Severe', ja: '重度', zh: '重度', vn: 'Nặng', th: 'รุนแรง' }
    };
    
    return labels[level]?.[language] || labels[level]?.['ko'] || level;
  }

  // 질문 텍스트 (실제로는 JSON 파일에서 로드)
  getQuestionText(scaleId, questionNumber, language) {
    // 개발용 임시 텍스트
    const texts = {
      ko: `${scaleId} 질문 ${questionNumber}`,
      en: `${scaleId} Question ${questionNumber}`,
      ja: `${scaleId} 質問 ${questionNumber}`,
      zh: `${scaleId} 问题 ${questionNumber}`,
      vn: `Câu hỏi ${scaleId} ${questionNumber}`,
      th: `คำถาม ${scaleId} ${questionNumber}`
    };
    
    return texts[language] || texts.ko;
  }

  // CES-DC 응답 옵션 (0-3 척도)
  getCESDCResponseOptions(language) {
    const options = {
      ko: [
        { value: 0, label: "극히 드물다 (1일 미만)" },
        { value: 1, label: "가끔 (1-2일)" },
        { value: 2, label: "자주 (3-4일)" },
        { value: 3, label: "거의 대부분 (5-7일)" }
      ],
      en: [
        { value: 0, label: "Rarely (less than 1 day)" },
        { value: 1, label: "Sometimes (1-2 days)" },
        { value: 2, label: "Often (3-4 days)" },
        { value: 3, label: "Most of the time (5-7 days)" }
      ],
      ja: [
        { value: 0, label: "ほとんどない（1日未満）" },
        { value: 1, label: "時々（1-2日）" },
        { value: 2, label: "よくある（3-4日）" },
        { value: 3, label: "ほとんどいつも（5-7日）" }
      ],
      zh: [
        { value: 0, label: "很少（少于1天）" },
        { value: 1, label: "有时（1-2天）" },
        { value: 2, label: "经常（3-4天）" },
        { value: 3, label: "大部分时间（5-7天）" }
      ],
      vn: [
        { value: 0, label: "Hiếm khi (ít hơn 1 ngày)" },
        { value: 1, label: "Thỉnh thoảng (1-2 ngày)" },
        { value: 2, label: "Thường xuyên (3-4 ngày)" },
        { value: 3, label: "Hầu hết thời gian (5-7 ngày)" }
      ],
      th: [
        { value: 0, label: "แทบไม่เคย (น้อยกว่า 1 วัน)" },
        { value: 1, label: "บางครั้ง (1-2 วัน)" },
        { value: 2, label: "บ่อย (3-4 วัน)" },
        { value: 3, label: "เกือบตลอด (5-7 วัน)" }
      ]
    };
    
    return options[language] || options.ko;
  }

  // BAI 응답 옵션 (0-3 척도)
  getBAIResponseOptions(language) {
    const options = {
      ko: [
        { value: 0, label: "전혀 느끼지 않았다" },
        { value: 1, label: "조금 느꼈다" },
        { value: 2, label: "상당히 느꼈다" },
        { value: 3, label: "심하게 느꼈다" }
      ],
      en: [
        { value: 0, label: "Not at all" },
        { value: 1, label: "Mildly" },
        { value: 2, label: "Moderately" },
        { value: 3, label: "Severely" }
      ],
      ja: [
        { value: 0, label: "全く感じなかった" },
        { value: 1, label: "少し感じた" },
        { value: 2, label: "かなり感じた" },
        { value: 3, label: "ひどく感じた" }
      ],
      zh: [
        { value: 0, label: "完全没有" },
        { value: 1, label: "轻微" },
        { value: 2, label: "中度" },
        { value: 3, label: "严重" }
      ],
      vn: [
        { value: 0, label: "Hoàn toàn không" },
        { value: 1, label: "Hơi có" },
        { value: 2, label: "Khá nhiều" },
        { value: 3, label: "Rất nhiều" }
      ],
      th: [
        { value: 0, label: "ไม่รู้สึกเลย" },
        { value: 1, label: "รู้สึกเล็กน้อย" },
        { value: 2, label: "รู้สึกปานกลาง" },
        { value: 3, label: "รู้สึกมาก" }
      ]
    };
    
    return options[language] || options.ko;
  }

  // K-AQ 응답 옵션 (1-5 척도)
  getKAQResponseOptions(language) {
    const options = {
      ko: [
        { value: 1, label: "전혀 그렇지 않다" },
        { value: 2, label: "그렇지 않다" },
        { value: 3, label: "보통이다" },
        { value: 4, label: "그렇다" },
        { value: 5, label: "매우 그렇다" }
      ],
      en: [
        { value: 1, label: "Not at all" },
        { value: 2, label: "Rarely" },
        { value: 3, label: "Sometimes" },
        { value: 4, label: "Often" },
        { value: 5, label: "Very often" }
      ],
      ja: [
        { value: 1, label: "全くそうでない" },
        { value: 2, label: "そうでない" },
        { value: 3, label: "どちらでもない" },
        { value: 4, label: "そうだ" },
        { value: 5, label: "非常にそうだ" }
      ],
      zh: [
        { value: 1, label: "完全不符合" },
        { value: 2, label: "不符合" },
        { value: 3, label: "一般" },
        { value: 4, label: "符合" },
        { value: 5, label: "非常符合" }
      ],
      vn: [
        { value: 1, label: "Hoàn toàn không đúng" },
        { value: 2, label: "Không đúng" },
        { value: 3, label: "Bình thường" },
        { value: 4, label: "Đúng" },
        { value: 5, label: "Rất đúng" }
      ],
      th: [
        { value: 1, label: "ไม่จริงเลย" },
        { value: 2, label: "ไม่จริง" },
        { value: 3, label: "ปานกลาง" },
        { value: 4, label: "จริง" },
        { value: 5, label: "จริงมาก" }
      ]
    };
    
    return options[language] || options.ko;
  }

  // K-ARS 응답 옵션 (0-3 척도)
  getKARSResponseOptions(language) {
    const options = {
      ko: [
        { value: 0, label: "전혀 또는 거의 그렇지 않다" },
        { value: 1, label: "때때로 그렇다" },
        { value: 2, label: "자주 그렇다" },
        { value: 3, label: "매우 자주 그렇다" }
      ],
      en: [
        { value: 0, label: "Never or rarely" },
        { value: 1, label: "Sometimes" },
        { value: 2, label: "Often" },
        { value: 3, label: "Very often" }
      ],
      ja: [
        { value: 0, label: "全くまたはめったにない" },
        { value: 1, label: "時々ある" },
        { value: 2, label: "よくある" },
        { value: 3, label: "非常によくある" }
      ],
      zh: [
        { value: 0, label: "从不或很少" },
        { value: 1, label: "有时" },
        { value: 2, label: "经常" },
        { value: 3, label: "非常频繁" }
      ],
      vn: [
        { value: 0, label: "Không bao giờ hoặc hiếm khi" },
        { value: 1, label: "Thỉnh thoảng" },
        { value: 2, label: "Thường xuyên" },
        { value: 3, label: "Rất thường xuyên" }
      ],
      th: [
        { value: 0, label: "ไม่เคยหรือแทบไม่เคย" },
        { value: 1, label: "บางครั้ง" },
        { value: 2, label: "บ่อย" },
        { value: 3, label: "บ่อยมาก" }
      ]
    };
    
    return options[language] || options.ko;
  }

  getDefaultScalesMetadata() {
    return {
      scales: [
        { id: 'ces-dc', order: 1, enabled: true },
        { id: 'bai', order: 2, enabled: true },
        { id: 'k-aq', order: 3, enabled: true },
        { id: 'k-ars', order: 4, enabled: true }
      ]
    };
  }

  /**
   * 캐시 초기화
   */
  clearCache() {
    this.cache.clear();
  }
}

// 싱글톤 인스턴스
export const surveyQuestionLoader = new SurveyQuestionLoader();