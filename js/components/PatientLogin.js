import { checkPatientExists, createPatient, getPatient, getPatientByRegistrationNumber } from '../firebase/crud.js';

export class PatientLogin {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.patientData = null;
    this.matchedPatientData = null; // 매칭된 환자 데이터 저장
    this.render();
  }

  render() {
    this.container.innerHTML = `
      <div class="patient-login-form">
        <h2>환자 정보 입력</h2>
        
        <form id="patient-form">
          <div class="form-group">
            <label for="registration">등록번호:</label>
            <input type="text" id="registration" placeholder="등록번호 입력 (예: A1234)">
            <small style="color: #666;">등록번호가 있으면 자동으로 로그인됩니다</small>
          </div>
          
          <div class="divider">
            <span>또는</span>
          </div>
          
          <div class="form-group">
            <label for="name">이름:</label>
            <input type="text" id="name">
          </div>
          
          <div class="form-group">
            <label>생년월일:</label>
            <div style="display: flex; gap: 10px;">
              <select id="birthYear" style="flex: 1;">
                <option value="">년도</option>
              </select>
              <select id="birthMonth" style="flex: 1;">
                <option value="">월</option>
              </select>
              <select id="birthDay" style="flex: 1;">
                <option value="">일</option>
              </select>
            </div>
          </div>
          
          <div class="form-group">
            <label for="language">언어 선택:</label>
            <select id="language">
              <option value="">선택하세요</option>
              <option value="ko">한국어</option>
              <option value="en">English</option>
              <option value="ja">日本語</option>
              <option value="zh">中文</option>
            </select>
          </div>
          
          <button type="submit" id="submit-btn">시작하기</button>
        </form>
        
        <div id="loading" style="display: none;">
          <p>처리 중입니다...</p>
        </div>
        
        <div id="error-message" style="display: none; color: red;"></div>
        <div id="success-message" style="display: none; color: green;"></div>
      </div>
    `;

    window.loginInstance = this;
    this.attachEventListeners();
    this.populateDateDropdowns();
  }

  attachEventListeners() {
    const form = document.getElementById('patient-form');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.handleSubmit();
    });
    
    // 등록번호 입력 시 자동 체크
    const registrationInput = document.getElementById('registration');
    registrationInput.addEventListener('input', async (e) => {
      const registrationNumber = e.target.value.trim();
      
      // 등록번호가 일정 길이 이상이면 자동으로 조회
      if (registrationNumber.length >= 3) {
        await this.checkRegistrationNumber(registrationNumber);
      } else {
        // 등록번호가 짧으면 다른 필드 활성화
        this.enableOtherFields(true);
        this.matchedPatientData = null;
        this.showSuccess(''); // 성공 메시지 숨기기
      }
    });
    
    // 이름/생년월일 입력 시 기존 환자 체크
    const checkExistingPatient = async () => {
      const registrationNumber = document.getElementById('registration').value.trim();
      // 등록번호가 입력되어 있으면 다른 필드 체크 안함
      if (registrationNumber) return;
      
      const name = document.getElementById('name').value.trim();
      const year = document.getElementById('birthYear').value;
      const month = document.getElementById('birthMonth').value;
      const day = document.getElementById('birthDay').value;
      
      if (name && year && month && day) {
        const birthDate = `${year}-${month}-${day}`;
        const exists = await checkPatientExists(name, birthDate);
        
        if (exists) {
          // 기존 환자면 등록번호 입력란 숨김
          document.getElementById('registration').disabled = true;
          document.getElementById('registration').placeholder = '기존 환자';
        } else {
          // 신규 환자면 등록번호 입력란 활성화
          document.getElementById('registration').disabled = false;
          document.getElementById('registration').placeholder = '신규 환자는 등록번호 필수';
        }
      }
    };
    
    document.getElementById('name').addEventListener('blur', checkExistingPatient);
    document.getElementById('birthDay').addEventListener('change', checkExistingPatient);
    
    // 월 선택 시 일수 조정
    document.getElementById('birthMonth').addEventListener('change', () => this.updateDays());
    document.getElementById('birthYear').addEventListener('change', () => this.updateDays());
  }

  async checkRegistrationNumber(registrationNumber) {
    this.showLoading(true);
    this.showError('');
    
    try {
      // 등록번호로 환자 조회
      const patientData = await getPatientByRegistrationNumber(registrationNumber);
      
      if (patientData) {
        // 환자를 찾으면 데이터 저장하고 다른 필드 자동 채우기
        this.matchedPatientData = patientData;
        this.showLoading(false);
        
        // 필드 자동 채우기
        document.getElementById('name').value = patientData.name;
        document.getElementById('language').value = patientData.language;
        
        // 생년월일 파싱 및 설정
        const [year, month, day] = patientData.birthDate.split('-');
        document.getElementById('birthYear').value = year;
        document.getElementById('birthMonth').value = month;
        document.getElementById('birthDay').value = day;
        
        // 필드 비활성화
        this.enableOtherFields(false);
        
        // 성공 메시지 표시
        this.showSuccess('등록번호가 확인되었습니다. 시작하기 버튼을 눌러주세요.');
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
      
      // 이미 매칭된 환자 데이터가 있으면 바로 로그인
      if (this.matchedPatientData && registrationNumber) {
        this.patientData = this.matchedPatientData;
        this.showLoading(false);
        this.onLoginSuccess(this.patientData);
        return;
      }
      
      // 등록번호가 있지만 매칭되지 않은 경우 다시 확인
      if (registrationNumber && !this.matchedPatientData) {
        const patientData = await getPatientByRegistrationNumber(registrationNumber);
        if (patientData) {
          this.patientData = patientData;
          this.showLoading(false);
          this.onLoginSuccess(patientData);
          return;
        }
      }
      
      // 일반 로그인 처리
      const name = document.getElementById('name').value.trim();
      const year = document.getElementById('birthYear').value;
      const month = document.getElementById('birthMonth').value;
      const day = document.getElementById('birthDay').value;
      const language = document.getElementById('language').value;

      if (!name || !year || !month || !day || !language) {
        throw new Error('모든 필드를 입력해주세요.');
      }

      const birthDate = `${year}-${month}-${day}`;
      
      // 환자 존재 여부 확인
      const exists = await checkPatientExists(name, birthDate);
      
      if (exists) {
        // 기존 환자 데이터 조회
        this.patientData = await getPatient(name, birthDate);
        
        // 언어 설정이 다른 경우 알림
        if (this.patientData.language !== language) {
          const confirmChange = confirm(
            `이전에 ${this.getLanguageName(this.patientData.language)}로 진행하셨습니다. ` +
            `${this.getLanguageName(language)}로 변경하시겠습니까?`
          );
          
          if (!confirmChange) {
            document.getElementById('language').value = this.patientData.language;
            this.showLoading(false);
            return;
          }
        }
      } else {
        // 신규 환자 - 등록번호 필수
        if (!registrationNumber) {
          throw new Error('신규 환자는 등록번호를 입력해야 합니다.');
        }
        
        // 등록번호 중복 체크
        const existingPatient = await getPatientByRegistrationNumber(registrationNumber);
        if (existingPatient) {
          throw new Error('이미 사용 중인 등록번호입니다.');
        }
        
        // 새 환자 생성
        this.patientData = await createPatient(name, birthDate, language, registrationNumber);
      }

      this.showLoading(false);
      this.onLoginSuccess(this.patientData);
      
    } catch (error) {
      console.error('오류 발생:', error);
      this.showError(error.message || '처리 중 오류가 발생했습니다. 다시 시도해주세요.');
      this.showLoading(false);
    }
  }

  populateDateDropdowns() {
    const yearSelect = document.getElementById('birthYear');
    const monthSelect = document.getElementById('birthMonth');
    const daySelect = document.getElementById('birthDay');
    
    // 년도 (현재년도부터 100년 전까지)
    const currentYear = new Date().getFullYear();
    for (let year = currentYear; year >= currentYear - 100; year--) {
      const option = document.createElement('option');
      option.value = year;
      option.textContent = year + '년';
      yearSelect.appendChild(option);
    }
    
    // 월
    for (let month = 1; month <= 12; month++) {
      const option = document.createElement('option');
      option.value = month.toString().padStart(2, '0');
      option.textContent = month + '월';
      monthSelect.appendChild(option);
    }
    
    // 일
    for (let day = 1; day <= 31; day++) {
      const option = document.createElement('option');
      option.value = day.toString().padStart(2, '0');
      option.textContent = day + '일';
      daySelect.appendChild(option);
    }
  }

  updateDays() {
    const yearSelect = document.getElementById('birthYear');
    const monthSelect = document.getElementById('birthMonth');
    const daySelect = document.getElementById('birthDay');
    
    const year = parseInt(yearSelect.value);
    const month = parseInt(monthSelect.value);
    
    if (!year || !month) return;
    
    const daysInMonth = new Date(year, month, 0).getDate();
    const currentDay = parseInt(daySelect.value) || 1;
    
    // 일 옵션 재생성
    daySelect.innerHTML = '<option value="">일</option>';
    for (let day = 1; day <= daysInMonth; day++) {
      const option = document.createElement('option');
      option.value = day.toString().padStart(2, '0');
      option.textContent = day + '일';
      if (day === currentDay && currentDay <= daysInMonth) {
        option.selected = true;
      }
      daySelect.appendChild(option);
    }
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

  showLoading(show) {
    document.getElementById('loading').style.display = show ? 'block' : 'none';
    document.getElementById('submit-btn').disabled = show;
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

  onLoginSuccess(patientData) {
    // 이벤트 발생
    const event = new CustomEvent('patientLoginSuccess', { 
      detail: patientData 
    });
    document.dispatchEvent(event);
    
    // 또는 직접 다음 화면으로 전환
    this.container.innerHTML = `
      <div class="login-success">
        <h3>환영합니다, ${patientData.name}님!</h3>
        <p>언어: ${this.getLanguageName(patientData.language)}</p>
        <p>검사를 시작합니다...</p>
      </div>
    `;
    
    // 2초 후 Dashboard로 이동
    setTimeout(() => {
      window.currentPatient = patientData;
      window.location.hash = '#dashboard';
    }, 2000);
  }
}

// CSS 스타일
const style = document.createElement('style');
style.textContent = `
  .patient-login-form {
    max-width: 400px;
    margin: 50px auto;
    padding: 30px;
    border: 1px solid #ddd;
    border-radius: 8px;
    background: #f9f9f9;
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
  }
  
  .form-group input,
  .form-group select {
    width: 100%;
    padding: 8px;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-size: 16px;
    transition: opacity 0.3s;
  }
  
  .form-group input:disabled,
  .form-group select:disabled {
    background: #f0f0f0;
  }
  
  #registration {
    border: 2px solid #2196F3;
    background: #E3F2FD;
  }
  
  #registration:focus {
    outline: none;
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
  }
  
  #submit-btn:hover {
    background: #0056b3;
  }
  
  #submit-btn:disabled {
    background: #6c757d;
    cursor: not-allowed;
  }
  
  .login-success {
    text-align: center;
    padding: 40px;
  }
  
  small {
    font-size: 12px;
    display: block;
    margin-top: 5px;
  }
`;
document.head.appendChild(style);