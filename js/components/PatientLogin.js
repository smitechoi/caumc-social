import { checkPatientExists, createPatient, getPatient, getPatientByRegistrationNumber } from '../firebase/crud.js';

export class PatientLogin {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.patientData = null;
    this.isQuickLogin = false;
    this.render();
  }

  render() {
    this.container.innerHTML = `
      <div class="patient-login-form">
        <h2>환자 정보 입력</h2>
        
        <!-- 빠른 로그인 토글 -->
        <div class="login-mode-toggle">
          <button id="normal-login-btn" class="mode-btn active" onclick="window.loginInstance.setLoginMode(false)">
            일반 로그인
          </button>
          <button id="quick-login-btn" class="mode-btn" onclick="window.loginInstance.setLoginMode(true)">
            등록번호로 로그인
          </button>
        </div>
        
        <form id="patient-form">
          <!-- 등록번호 입력 (빠른 로그인) -->
          <div id="quick-login-section" style="display: none;">
            <div class="form-group">
              <label for="quick-registration">등록번호:</label>
              <input type="text" id="quick-registration" placeholder="등록번호 입력">
            </div>
          </div>
          
          <!-- 일반 로그인 섹션 -->
          <div id="normal-login-section">
            <div class="form-group">
              <label for="name">이름:</label>
              <input type="text" id="name" required>
            </div>
            
            <div class="form-group">
              <label>생년월일:</label>
              <div style="display: flex; gap: 10px;">
                <select id="birthYear" required style="flex: 1;">
                  <option value="">년도</option>
                </select>
                <select id="birthMonth" required style="flex: 1;">
                  <option value="">월</option>
                </select>
                <select id="birthDay" required style="flex: 1;">
                  <option value="">일</option>
                </select>
              </div>
            </div>
            
            <div class="form-group" id="registration-group" style="display: none;">
              <label for="registration">등록번호 (신규 환자만):</label>
              <input type="text" id="registration" placeholder="예: A1234">
              <small style="color: #666;">처음 등록하는 경우 필수 입력</small>
            </div>
            
            <div class="form-group">
              <label for="language">언어 선택:</label>
              <select id="language" required>
                <option value="">선택하세요</option>
                <option value="ko">한국어</option>
                <option value="en">English</option>
                <option value="ja">日本語</option>
                <option value="zh">中文</option>
              </select>
            </div>
          </div>
          
          <button type="submit" id="submit-btn">시작하기</button>
        </form>
        
        <div id="loading" style="display: none;">
          <p>처리 중입니다...</p>
        </div>
        
        <div id="error-message" style="display: none; color: red;"></div>
      </div>
    `;

    window.loginInstance = this;
    this.attachEventListeners();
    this.populateDateDropdowns();
  }

  setLoginMode(isQuick) {
    this.isQuickLogin = isQuick;
    
    const quickSection = document.getElementById('quick-login-section');
    const normalSection = document.getElementById('normal-login-section');
    const normalBtn = document.getElementById('normal-login-btn');
    const quickBtn = document.getElementById('quick-login-btn');
    
    if (isQuick) {
      quickSection.style.display = 'block';
      normalSection.style.display = 'none';
      normalBtn.classList.remove('active');
      quickBtn.classList.add('active');
      
      // 빠른 로그인에서는 required 속성 제거
      document.getElementById('name').removeAttribute('required');
      document.getElementById('birthYear').removeAttribute('required');
      document.getElementById('birthMonth').removeAttribute('required');
      document.getElementById('birthDay').removeAttribute('required');
      document.getElementById('language').removeAttribute('required');
    } else {
      quickSection.style.display = 'none';
      normalSection.style.display = 'block';
      normalBtn.classList.add('active');
      quickBtn.classList.remove('active');
      
      // 일반 로그인에서는 required 속성 추가
      document.getElementById('name').setAttribute('required', '');
      document.getElementById('birthYear').setAttribute('required', '');
      document.getElementById('birthMonth').setAttribute('required', '');
      document.getElementById('birthDay').setAttribute('required', '');
      document.getElementById('language').setAttribute('required', '');
    }
    
    this.showError('');
  }

  attachEventListeners() {
    const form = document.getElementById('patient-form');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.handleSubmit();
    });
    
    // 이름/생년월일 입력 시 기존 환자 체크
    const checkExistingPatient = async () => {
      const name = document.getElementById('name').value.trim();
      const year = document.getElementById('birthYear').value;
      const month = document.getElementById('birthMonth').value;
      const day = document.getElementById('birthDay').value;
      
      if (name && year && month && day) {
        const birthDate = `${year}-${month}-${day}`;
        const exists = await checkPatientExists(name, birthDate);
        
        // 신규 환자인 경우만 등록번호 입력란 표시
        const registrationGroup = document.getElementById('registration-group');
        if (!exists) {
          registrationGroup.style.display = 'block';
          document.getElementById('registration').setAttribute('required', '');
        } else {
          registrationGroup.style.display = 'none';
          document.getElementById('registration').removeAttribute('required');
        }
      }
    };
    
    document.getElementById('name').addEventListener('blur', checkExistingPatient);
    document.getElementById('birthDay').addEventListener('change', checkExistingPatient);
  }

  async handleSubmit() {
    this.showLoading(true);
    this.showError('');

    try {
      if (this.isQuickLogin) {
        // 등록번호로 빠른 로그인
        await this.handleQuickLogin();
      } else {
        // 일반 로그인
        await this.handleNormalLogin();
      }
    } catch (error) {
      console.error('오류 발생:', error);
      this.showError(error.message || '처리 중 오류가 발생했습니다. 다시 시도해주세요.');
      this.showLoading(false);
    }
  }

  async handleQuickLogin() {
    const registrationNumber = document.getElementById('quick-registration').value.trim();
    
    if (!registrationNumber) {
      throw new Error('등록번호를 입력해주세요.');
    }
    
    // 등록번호로 환자 조회
    const patientData = await getPatientByRegistrationNumber(registrationNumber);
    
    if (!patientData) {
      throw new Error('등록번호를 찾을 수 없습니다.');
    }
    
    this.patientData = patientData;
    this.showLoading(false);
    this.onLoginSuccess(patientData);
  }

  async handleNormalLogin() {
    const name = document.getElementById('name').value.trim();
    const year = document.getElementById('birthYear').value;
    const month = document.getElementById('birthMonth').value;
    const day = document.getElementById('birthDay').value;
    const language = document.getElementById('language').value;
    const registrationNumber = document.getElementById('registration').value.trim();

    if (!name || !year || !month || !day || !language) {
      throw new Error('모든 필드를 입력해주세요.');
    }

    const birthDate = `${year}-${month}-${day}`;
    
    // 환자 존재 여부 확인
    const exists = await checkPatientExists(name, birthDate);
    
    if (exists) {
      // 기존 환자 데이터 조회
      this.patientData = await getPatient(name, birthDate);
      console.log('기존 환자 데이터 로드:', this.patientData);
      
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
      console.log('새 환자 생성:', this.patientData);
    }

    this.showLoading(false);
    this.onLoginSuccess(this.patientData);
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
    
    // 월 선택 시 일수 조정
    monthSelect.addEventListener('change', () => this.updateDays());
    yearSelect.addEventListener('change', () => this.updateDays());
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

  attachEventListeners() {
    const form = document.getElementById('patient-form');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.handleSubmit();
    });
  }

  async handleSubmit() {
    const name = document.getElementById('name').value.trim();
    const year = document.getElementById('birthYear').value;
    const month = document.getElementById('birthMonth').value;
    const day = document.getElementById('birthDay').value;
    const language = document.getElementById('language').value;

    if (!name || !year || !month || !day || !language) {
      this.showError('모든 필드를 입력해주세요.');
      return;
    }

    const birthDate = `${year}-${month}-${day}`;

    this.showLoading(true);
    this.showError('');

    try {
      // 환자 존재 여부 확인
      const exists = await checkPatientExists(name, birthDate);
      
      if (exists) {
        // 기존 환자 데이터 조회
        this.patientData = await getPatient(name, birthDate);
        console.log('기존 환자 데이터 로드:', this.patientData);
        
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
        // 새 환자 생성
        this.patientData = await createPatient(name, birthDate, language);
        console.log('새 환자 생성:', this.patientData);
      }

      this.showLoading(false);
      
      // 다음 단계로 이동
      this.onLoginSuccess(this.patientData);
      
    } catch (error) {
      console.error('오류 발생:', error);
      this.showError('처리 중 오류가 발생했습니다. 다시 시도해주세요.');
      this.showLoading(false);
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
    errorDiv.textContent = message;
    errorDiv.style.display = message ? 'block' : 'none';
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
`;
document.head.appendChild(style);