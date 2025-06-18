import { checkPatientExists, createPatient, getPatient, getPatientByRegistrationNumber } from '../firebase/crud.js';
import { translationService } from '../services/TranslationService.js';

export class PatientLogin {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.patientData = null;
    this.selectedLanguage = translationService.currentLanguage || 'ko'; // 기본값을 한국어로
    this.render();
  }

  render() {
    const t = (key, params) => translationService.t(key, params);
    
    // 현재 선택된 언어 저장 (리렌더링 시 유지)
    const currentLanguage = this.selectedLanguage || translationService.currentLanguage;
    
    this.container.innerHTML = `
      <div class="patient-login-form">
        <h2>${t('patientInfoInput')}</h2>
        
        <form id="patient-form">
          <div class="form-group language-selector">
            <label for="language">${t('selectLanguage')}: <span style="color: red;">*</span></label>
            <select id="language">
              <option value="ko" ${currentLanguage === 'ko' ? 'selected' : ''}>한국어</option>
              <option value="en" ${currentLanguage === 'en' ? 'selected' : ''}>English</option>
              <option value="ja" ${currentLanguage === 'ja' ? 'selected' : ''}>日本語</option>
              <option value="zh" ${currentLanguage === 'zh' ? 'selected' : ''}>中文</option>
              <option value="vn" ${currentLanguage === 'vn' ? 'selected' : ''}>Tiếng Việt</option>
              <!-- <option value="th" ${currentLanguage === 'th' ? 'selected' : ''}>ภาษาไทย</option>-->
            </select>
          </div>
          
          <div class="divider">
            <span>${t('patientInfoInput')}</span>
          </div>
          
          <div class="form-group">
            <label for="registration">${t('registrationNumber')}:</label>
            <input type="text" id="registration" placeholder="${t('registrationNumberPlaceholder')}">
            <small style="color: #666;">${t('registrationNumberInfo')}</small>
          </div>
          
          <div class="divider">
            <span>${t('identityVerification')}</span>
          </div>
          
          <div class="form-group">
            <label for="name">${t('name')}: <span style="color: red;">*</span></label>
            <input type="text" id="name">
          </div>
          
          <div class="form-group">
            <label>${t('birthDate')}: <span style="color: red;">*</span></label>
            <div style="display: flex; gap: 10px;">
              <select id="birthYear" style="flex: 1;">
                <option value="">${t('year')}</option>
              </select>
              <select id="birthMonth" style="flex: 1;">
                <option value="">${t('month')}</option>
              </select>
              <select id="birthDay" style="flex: 1;">
                <option value="">${t('day')}</option>
              </select>
            </div>
          </div>
          
          <div id="error-message" style="display: none; color: red; margin-bottom: 10px;"></div>
          <div id="success-message" style="display: none;"></div>
          
          <button type="submit" id="submit-btn">
            <span id="button-text">${t('startButton')}</span>
            <span id="loading-spinner" style="display: none;">${t('processing')}</span>
          </button>
        </form>
      </div>
    `;

    this.attachEventListeners();
    this.initializeDateSelectors();
  }

  initializeDateSelectors() {
    const yearSelect = document.getElementById('birthYear');
    const monthSelect = document.getElementById('birthMonth');
    const daySelect = document.getElementById('birthDay');

    // 연도 옵션 (100년 전부터 현재까지)
    const currentYear = new Date().getFullYear();
    for (let year = currentYear; year >= currentYear - 100; year--) {
      const option = document.createElement('option');
      option.value = year;
      option.textContent = year;
      yearSelect.appendChild(option);
    }

    // 월 옵션
    for (let month = 1; month <= 12; month++) {
      const option = document.createElement('option');
      option.value = month.toString().padStart(2, '0');
      option.textContent = month;
      monthSelect.appendChild(option);
    }

    // 일 옵션
    for (let day = 1; day <= 31; day++) {
      const option = document.createElement('option');
      option.value = day.toString().padStart(2, '0');
      option.textContent = day;
      daySelect.appendChild(option);
    }
  }

  attachEventListeners() {
    // 폼 제출 이벤트
    document.getElementById('patient-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.handleSubmit();
    });

    // 언어 변경 이벤트
    document.getElementById('language').addEventListener('change', (e) => {
      const newLang = e.target.value;
      if (newLang) {
        // 선택된 언어 저장
        this.selectedLanguage = newLang;
        
        // 현재 입력된 값들 저장
        const currentValues = {
          registration: document.getElementById('registration').value,
          name: document.getElementById('name').value,
          birthYear: document.getElementById('birthYear').value,
          birthMonth: document.getElementById('birthMonth').value,
          birthDay: document.getElementById('birthDay').value
        };
        
        // 언어 설정 변경
        translationService.setLanguage(newLang);
        document.body.className = `lang-${newLang}`;
        
        // UI 재렌더링
        this.render();
        
        // 저장된 값들 복원
        document.getElementById('registration').value = currentValues.registration;
        document.getElementById('name').value = currentValues.name;
        document.getElementById('birthYear').value = currentValues.birthYear;
        document.getElementById('birthMonth').value = currentValues.birthMonth;
        document.getElementById('birthDay').value = currentValues.birthDay;
      }
    });
  }

  // Debounce 헬퍼 함수
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  async checkRegistrationNumber(regNumber) {
    if (!regNumber || regNumber.length < 2) {
      this.enableOtherFields(true);
      this.matchedPatientData = null;
      return;
    }

    this.showLoading(true);

    try {
      const patientData = await getPatientByRegistrationNumber(regNumber);
      
      if (patientData) {
        // 환자를 찾으면 정보 자동 입력
        this.matchedPatientData = patientData;
        
        // 필드 비활성화
        this.enableOtherFields(false);
        
        // 정보 자동 입력
        document.getElementById('name').value = patientData.name;
        
        const birthParts = patientData.birthDate.split('-');
        document.getElementById('birthYear').value = birthParts[0];
        document.getElementById('birthMonth').value = birthParts[1];
        document.getElementById('birthDay').value = birthParts[2];
        document.getElementById('language').value = patientData.language;
        
        // 언어 설정 적용
        translationService.setLanguage(patientData.language);
        document.body.className = `lang-${patientData.language}`;
        
        this.showLoading(false);
        this.showSuccess(translationService.t('existingPatient') + ' - ' + 
                        translationService.t('registrationConfirmed'));

      } else {
        // 찾지 못하면 다른 필드 활성화
        this.showLoading(false);
        this.enableOtherFields(true);
        this.matchedPatientData = null;
      }
    } catch (error) {
      console.error('등록번호 확인 오류:', error);
      this.showLoading(false);
      this.enableOtherFields(true);
      this.matchedPatientData = null;
    }
  }

  enableOtherFields(enable) {
    const fields = ['name', 'birthYear', 'birthMonth', 'birthDay', 'language'];
    fields.forEach(fieldId => {
      const field = document.getElementById(fieldId);
      field.disabled = !enable;
      if (enable) {
        field.style.opacity = '1';
      } else {
        field.style.opacity = '0.5';
      }
    });
  }

  async handleSubmit() {
    this.showLoading(true);
    this.showError('');

    try {
      const registrationNumber = document.getElementById('registration').value.trim();

      // 등록번호가 있으면 먼저 조회 시도
      if (registrationNumber) {
        const patientData = await getPatientByRegistrationNumber(registrationNumber);
        if (patientData) {
          // 등록번호로 찾은 경우 바로 로그인
          this.patientData = patientData;
          this.showLoading(false);
          this.onLoginSuccess(patientData);
          return;
        }
      }

      // 등록번호로 못 찾았거나 없으면 일반 로그인 처리
      const name = document.getElementById('name').value.trim();
      const year = document.getElementById('birthYear').value;
      const month = document.getElementById('birthMonth').value;
      const day = document.getElementById('birthDay').value;
      const language = document.getElementById('language').value;

      // 등록번호가 없을 때만 모든 필드 필수 체크
      if (!registrationNumber) {
        if (!name || !year || !month || !day || !language) {
          throw new Error(translationService.t('allFieldsRequired'));
        }
      }

      // 이름과 생년월일이 있으면 조회 시도
      if (name && year && month && day) {
        const birthDate = `${year}-${month}-${day}`;

        // 환자 존재 여부 확인
        const exists = await checkPatientExists(name, birthDate);

        if (exists) {
          // 기존 환자 데이터 조회
          this.patientData = await getPatient(name, birthDate);

          // 언어 설정이 다른 경우 알림
          if (language && this.patientData.language !== language) {
            const confirmChange = confirm(
              translationService.t('languageChangeConfirm', {
                previousLang: translationService.getLanguageName(this.patientData.language),
                newLang: translationService.getLanguageName(language)
              })
            );

            if (!confirmChange) {
              document.getElementById('language').value = this.patientData.language;
              this.showLoading(false);
              return;
            }
          }
          
          this.showLoading(false);
          this.onLoginSuccess(this.patientData);
        } else {
          // 신규 환자 - 등록번호 필수
          if (!registrationNumber) {
            throw new Error(translationService.t('newPatientRegistrationRequired'));
          }

          // 모든 필드 필수
          if (!language) {
            throw new Error(translationService.t('allFieldsRequired'));
          }

          // 등록번호 중복 체크
          const existingPatient = await getPatientByRegistrationNumber(registrationNumber);
          if (existingPatient) {
            throw new Error(translationService.t('registrationNumberInUse'));
          }

          // 새 환자 생성
          this.patientData = await createPatient(name, birthDate, language, registrationNumber);
          this.showLoading(false);
          this.onLoginSuccess(this.patientData);
        }
      } else {
        // 등록번호는 있지만 못 찾았고, 다른 정보도 불충분한 경우
        throw new Error(translationService.t('registrationNumberNotFound'));
      }

    } catch (error) {
      console.error('오류 발생:', error);
      this.showError(error.message || translationService.t('error'));
      this.showLoading(false);
    }
  }

  showLoading(isLoading) {
    const buttonText = document.getElementById('button-text');
    const loadingSpinner = document.getElementById('loading-spinner');
    const submitBtn = document.getElementById('submit-btn');
    
    buttonText.style.display = isLoading ? 'none' : 'inline';
    loadingSpinner.style.display = isLoading ? 'inline' : 'none';
    submitBtn.disabled = isLoading;
  }

  showError(message) {
    const errorDiv = document.getElementById('error-message');
    const successDiv = document.getElementById('success-message');
    errorDiv.textContent = message;
    errorDiv.style.display = message ? 'block' : 'none';
    successDiv.style.display = 'none';
  }

  showSuccess(message) {
    const successDiv = document.getElementById('success-message');
    const errorDiv = document.getElementById('error-message');
    successDiv.textContent = message;
    successDiv.style.display = message ? 'block' : 'none';
    errorDiv.style.display = 'none';
  }

  getLanguageName(code) {
    return translationService.getLanguageName(code);
  }

  onLoginSuccess(patientData) {
    const t = (key, params) => translationService.t(key, params);
    
    // 이벤트 발생
    const event = new CustomEvent('patientLoginSuccess', {
      detail: patientData
    });
    document.dispatchEvent(event);

    // 성공 메시지 표시
    this.container.innerHTML = `
      <div class="login-success">
        <h3>${t('welcome')}, ${patientData.name}!</h3>
        <p>${t('languageLabel')}: ${this.getLanguageName(patientData.language)}</p>
        <p>${t('startingTest')}</p>
      </div>
    `;

    // 2초 후 Dashboard로 이동
    setTimeout(() => {
      window.currentPatient = patientData;
      window.location.hash = '#dashboard';
    }, 2000);
  }

  destroy() {
    // 컴포넌트 정리
    this.container.innerHTML = '';
  }
}

// CSS 스타일
const style = document.createElement('style');
style.textContent = `
  .patient-login-form {
    max-width: 450px;
    margin: 50px auto;
    padding: 30px;
    border: 1px solid #ddd;
    border-radius: 8px;
    background: #f9f9f9;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }
  
  .patient-login-form h2 {
    text-align: center;
    color: #333;
    margin-bottom: 30px;
  }
  
  .language-selector {
    background: #f0f7ff;
    padding: 15px;
    border-radius: 8px;
    margin-bottom: 25px;
    border: 2px solid #2196F3;
  }
  
  .language-selector label {
    color: #1976D2;
    font-weight: bold;
  }
  
  .language-selector select {
    font-size: 18px;
    padding: 12px;
  }
  
  .divider {
    text-align: center;
    margin: 25px 0;
    position: relative;
  }
  
  .divider::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 0;
    right: 0;
    height: 1px;
    background: #ddd;
  }
  
  .divider span {
    background: #f9f9f9;
    padding: 0 15px;
    position: relative;
    color: #666;
    font-size: 14px;
  }
  
  .form-group {
    margin-bottom: 20px;
  }
  
  .form-group label {
    display: block;
    margin-bottom: 5px;
    font-weight: bold;
    color: #555;
  }
  
  .form-group input,
  .form-group select {
    width: 100%;
    padding: 10px;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-size: 16px;
    transition: all 0.3s;
    background-color: white;
  }
  
  .form-group input:focus,
  .form-group select:focus {
    outline: none;
    border-color: #007bff;
    box-shadow: 0 0 0 2px rgba(0,123,255,0.2);
  }
  
  .form-group input:disabled,
  .form-group select:disabled {
    background: #f0f0f0;
    cursor: not-allowed;
  }
  
  #registration {
    border: 2px solid #2196F3;
    background: #E3F2FD;
  }
  
  #registration:focus {
    border-color: #1976D2;
    box-shadow: 0 0 0 3px rgba(33, 150, 243, 0.2);
  }
  
  #success-message {
    margin-top: 10px;
    padding: 10px;
    background: #e8f5e9;
    border: 1px solid #4caf50;
    border-radius: 4px;
    color: #2e7d32;
    font-size: 14px;
    text-align: center;
  }
  
  #error-message {
    padding: 10px;
    background: #ffebee;
    border: 1px solid #f44336;
    border-radius: 4px;
    color: #c62828;
    font-size: 14px;
    text-align: center;
  }
  
  #submit-btn {
    width: 100%;
    padding: 12px;
    background: #007bff;
    color: white;
    border: none;
    border-radius: 4px;
    font-size: 18px;
    cursor: pointer;
    transition: all 0.3s;
    font-weight: bold;
  }
  
  #submit-btn:hover:not(:disabled) {
    background: #0056b3;
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  }
  
  #submit-btn:disabled {
    background: #6c757d;
    cursor: not-allowed;
  }
  
  .login-success {
    text-align: center;
    padding: 40px;
    animation: fadeIn 0.5s;
  }
  
  .login-success h3 {
    color: #4caf50;
    margin-bottom: 15px;
  }
  
  small {
    font-size: 12px;
    display: block;
    margin-top: 5px;
    color: #666;
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
  
  /* 언어별 스타일 조정 */
  body.lang-ja .patient-login-form,
  body.lang-zh .patient-login-form {
    font-size: 14px;
  }
  
  body.lang-th .patient-login-form {
    font-size: 16px;
  }
  
  /* 반응형 디자인 */
  @media (max-width: 600px) {
    .patient-login-form {
      margin: 20px;
      padding: 20px;
    }
    
    .form-group input,
    .form-group select {
      font-size: 14px;
    }
  }
`;
document.head.appendChild(style);