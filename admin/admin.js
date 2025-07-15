import { getAllPatients } from '../js/firebase/crud.js';
import { Report } from '../js/components/Report.js';
import { translationService } from '../js/services/TranslationService.js';

async function renderPatientList() {
  const t = (key, params) => translationService.t(key, params);
  let patients = [];
  try {
    patients = await getAllPatients();
  } catch (e) {
    document.getElementById('patient-list').innerHTML = '<p>데이터를 불러올 수 없습니다.</p>';
    return;
  }
  if (!patients.length) {
    document.getElementById('patient-list').innerHTML = '<p>등록된 환자가 없습니다.</p>';
    return;
  }

  // T## 형식의 테스트 등록번호 제외
  patients = patients.filter(p => {
    const regNum = p.registrationNumber || '';
    return !regNum.startsWith('T');
  });

  // 등록번호 순으로 정렬
  patients.sort((a, b) => {
    const regA = a.registrationNumber || '';
    const regB = b.registrationNumber || '';
    
    // 등록번호가 없는 경우 맨 뒤로
    if (!regA && !regB) return 0;
    if (!regA) return 1;
    if (!regB) return -1;
    
    // 숫자 부분 추출하여 정렬
    const numA = parseInt(regA.replace(/\D/g, '')) || 0;
    const numB = parseInt(regB.replace(/\D/g, '')) || 0;
    
    return numA - numB;
  });

  let html = '<table><tr><th>등록번호</th><th>이름</th><th>생년월일</th><th>언어</th><th>Survey</th><th>CNT</th><th>PDF</th></tr>';
  patients.forEach((p, idx) => {
    const surveyDone = Object.values(p.survey || {}).filter(s => s.isDone).length;
    const cntDone = Object.values(p.cnt || {}).filter(c => c.isDone).length;
    html += `<tr>
      <td>${p.registrationNumber || '-'}</td>
      <td>${p.name || ''}</td>
      <td>${p.birthDate || ''}</td>
      <td>${p.language || ''}</td>
      <td>${surveyDone}/4</td>
      <td>${cntDone}/5</td>
      <td><button class="pdf-btn" onclick="downloadPatientPDF(${idx})">PDF 저장</button></td>
    </tr>`;
  });
  html += '</table>';
  document.getElementById('patient-list').innerHTML = html;
  window._adminPatients = patients;
}

window.downloadPatientPDF = function(idx) {
  const patientData = window._adminPatients[idx];
  
  // 임시 div 생성 (보이게 설정)
  let tempDiv = document.createElement('div');
  tempDiv.id = 'temp-report-' + idx;
  tempDiv.style.position = 'absolute';
  tempDiv.style.left = '-9999px';  // 화면 밖으로
  tempDiv.style.top = '0';
  tempDiv.style.width = '900px';  // Report 컨테이너 크기
  tempDiv.style.height = 'auto';
  tempDiv.style.backgroundColor = '#ffffff';
  document.body.appendChild(tempDiv);
  
  // Report 인스턴스 생성
  const report = new Report(tempDiv.id, patientData);
  
  // 차트가 그려질 시간을 주고 PDF 생성
  setTimeout(async () => {
    try {
      await report.downloadPDF();
    } catch (error) {
      console.error('PDF 생성 실패:', error);
      alert('PDF 생성 중 오류가 발생했습니다.');
    } finally {
      // 임시 div 제거
      document.body.removeChild(tempDiv);
    }
  }, 2000);  // 2초 대기
};

// 페이지 로드 시 환자 리스트 렌더링
renderPatientList(); 