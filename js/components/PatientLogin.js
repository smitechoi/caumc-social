import { checkPatientExists, createPatient, getPatient } from '../firebase/crud.js';

export class PatientLogin {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.patientData = null;
        this.render();
    }

    render() {
        this.container.innerHTML = `
      <div class="patient-login-form">
        <h2>환자 정보 입력</h2>
        <form id="patient-form">
          <div class="form-group">
            <label for="name">이름:</label>
            <input type="text" id="name" required>
          </div>
          
          <div class="form-group">
            <label for="birthDate">생년월일:</label>
            <input type="date" id="birthDate" required>
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
          
          <button type="submit" id="submit-btn">시작하기</button>
        </form>
        
        <div id="loading" style="display: none;">
          <p>처리 중입니다...</p>
        </div>
        
        <div id="error-message" style="display: none; color: red;"></div>
      </div>
    `;

        this.attachEventListeners();
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
        const birthDate = document.getElementById('birthDate').value;
        const language = document.getElementById('language').value;

        if (!name || !birthDate || !language) {
            this.showError('모든 필드를 입력해주세요.');
            return;
        }

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

        // 2초 후 Survey로 이동
        setTimeout(() => {
            window.currentPatient = patientData;
            window.location.hash = '#survey';
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