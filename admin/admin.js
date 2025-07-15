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
  // 임시 div 생성 (Report는 containerId 필요)
  let tempDiv = document.createElement('div');
  tempDiv.style.display = 'none';
  document.body.appendChild(tempDiv);
  const report = new Report(tempDiv.id = 'temp-report-' + idx, patientData);
  setTimeout(() => {
    report.downloadPDF().then(() => {
      document.body.removeChild(tempDiv);
    });
  }, 500);
};

// 페이지 로드 시 환자 리스트 렌더링
renderPatientList(); 