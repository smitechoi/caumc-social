import { BaseTask } from './BaseTask.js';

export class MentalRotationTask extends BaseTask {
  getTutorial() {
    const t = (key, params) => {
      if (window.translationService && window.translationService.t) {
        return window.translationService.t(key, params);
      }
      // 기본 한국어 번역
      const fallback = {
        rotationTitle: '3D 블록 회전 검사 연습',
        rotationInstruction1: '두 개의 3D 블록 구조가 나타납니다.',
        rotationInstruction2: '오른쪽 블록이 왼쪽 블록을 <strong>회전</strong>시킨 것과 같은지 판단하세요.',
        rotationNote: '<p style="color: red; font-weight: bold;">주의: 뒤집어진 것(거울상)은 "다름"입니다.</p>',
        rotationInstruction3: '마우스로 드래그하여 블록을 회전시켜 볼 수 있습니다.',
        rotationInstruction4: '하단의 버튼을 터치하여 응답하세요.',
        original: '원본',
        rotationRotated: '회전됨 (같음)'
      };
      return fallback[key] || key;
    };
    return {
      title: t('rotationTitle'),
      content: `
        <p>${t('rotationInstruction1')}</p>
        <p>${t('rotationInstruction2')}</p>
        <div style="text-align: center; margin: 30px 0;">
          <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 200'%3E%3Crect x='50' y='50' width='40' height='40' fill='%234CAF50' stroke='%23333'/%3E%3Crect x='90' y='50' width='40' height='40' fill='%234CAF50' stroke='%23333'/%3E%3Crect x='90' y='90' width='40' height='40' fill='%234CAF50' stroke='%23333'/%3E%3Ctext x='90' y='150' text-anchor='middle' font-size='14'%3E${t('original')}%3C/text%3E%3Ctext x='200' y='100' font-size='30'%3E→%3C/text%3E%3Crect x='250' y='50' width='40' height='40' fill='%234CAF50' stroke='%23333' transform='rotate(90 290 90)'/%3E%3Crect x='250' y='90' width='40' height='40' fill='%234CAF50' stroke='%23333' transform='rotate(90 290 90)'/%3E%3Crect x='210' y='90' width='40' height='40' fill='%234CAF50' stroke='%23333' transform='rotate(90 290 90)'/%3E%3Ctext x='290' y='150' text-anchor='middle' font-size='14'%3E${t('rotationRotated')}%3C/text%3E%3C/svg%3E" style="max-width: 400px; margin: 20px auto; display: block;">
        </div>
        <p style="color: red; font-weight: bold;">${t('rotationNote')}</p>
        <p>${t('rotationInstruction3')}</p>
        <p>${t('rotationInstruction4')}</p>
      `
    };
  }

  getTaskName() {
    return '3D Mental Rotation Task';
  }

  initializeState(state, p) {
    // 블록 패턴 정의 - 더 복잡하고 다양한 패턴
    state.blockPatterns = [
      // 난이도 1: 4-5개 블록 (기본 3D 구조)
      [
        [{x: 0, y: 0, z: 0}, {x: 1, y: 0, z: 0}, {x: 0, y: 1, z: 0}, {x: 0, y: 0, z: 1}], // 3D 코너
        [{x: 0, y: 0, z: 0}, {x: 1, y: 0, z: 0}, {x: 2, y: 0, z: 0}, {x: 1, y: 1, z: 0}, {x: 1, y: 0, z: 1}], // T자 3D
        [{x: 0, y: 0, z: 0}, {x: 1, y: 0, z: 0}, {x: 0, y: 1, z: 0}, {x: 1, y: 1, z: 0}, {x: 0, y: 0, z: 1}], // L자 3D
        [{x: 0, y: 0, z: 0}, {x: 1, y: 0, z: 0}, {x: 1, y: 1, z: 0}, {x: 2, y: 1, z: 0}, {x: 1, y: 1, z: 1}], // 지그재그 3D
      ],
      // 난이도 2: 5-6개 블록 (복잡한 3D)
      [
        [{x: 0, y: 0, z: 0}, {x: 1, y: 0, z: 0}, {x: 0, y: 1, z: 0}, {x: 0, y: 0, z: 1}, {x: 1, y: 1, z: 0}, {x: 1, y: 0, z: 1}], // 큐브 빠진 형태
        [{x: 0, y: 0, z: 0}, {x: 1, y: 0, z: 0}, {x: 2, y: 0, z: 0}, {x: 0, y: 1, z: 0}, {x: 1, y: 0, z: 1}, {x: 2, y: 0, z: 1}], // 브릿지
        [{x: 0, y: 0, z: 0}, {x: 1, y: 0, z: 0}, {x: 0, y: 1, z: 0}, {x: 0, y: 2, z: 0}, {x: 0, y: 0, z: 1}, {x: 0, y: 1, z: 1}], // 계단
        [{x: 0, y: 0, z: 0}, {x: 1, y: 0, z: 0}, {x: 2, y: 0, z: 0}, {x: 1, y: 1, z: 0}, {x: 1, y: -1, z: 0}, {x: 1, y: 0, z: 1}], // 십자 3D
      ],
      // 난이도 3: 6-7개 블록 (매우 복잡)
      [
        [{x: 0, y: 0, z: 0}, {x: 1, y: 0, z: 0}, {x: 2, y: 0, z: 0}, {x: 0, y: 1, z: 0}, {x: 1, y: 1, z: 0}, {x: 0, y: 0, z: 1}, {x: 1, y: 0, z: 1}], // 복잡한 L
        [{x: 0, y: 0, z: 0}, {x: 1, y: 0, z: 0}, {x: 1, y: 1, z: 0}, {x: 1, y: 2, z: 0}, {x: 0, y: 0, z: 1}, {x: 1, y: 0, z: 1}, {x: 2, y: 0, z: 1}], // 3D 뱀
        [{x: 0, y: 0, z: 0}, {x: 1, y: 0, z: 0}, {x: 2, y: 0, z: 0}, {x: 1, y: 1, z: 0}, {x: 1, y: -1, z: 0}, {x: 1, y: 0, z: 1}, {x: 1, y: 0, z: -1}], // 3D 십자
      ],
      // 난이도 4: 7-8개 블록 (극한 난이도)
      [
        [{x: 0, y: 0, z: 0}, {x: 1, y: 0, z: 0}, {x: 2, y: 0, z: 0}, {x: 0, y: 1, z: 0}, {x: 0, y: 2, z: 0}, {x: 0, y: 0, z: 1}, {x: 0, y: 0, z: 2}, {x: 1, y: 1, z: 1}], // 3축 확장
        [{x: 0, y: 0, z: 0}, {x: 1, y: 0, z: 0}, {x: 0, y: 1, z: 0}, {x: 1, y: 1, z: 0}, {x: 0, y: 0, z: 1}, {x: 1, y: 0, z: 1}, {x: 0, y: 1, z: 1}, {x: 2, y: 0, z: 0}], // 거의 큐브
        [{x: 0, y: 0, z: 0}, {x: 1, y: 0, z: 0}, {x: 2, y: 0, z: 0}, {x: 3, y: 0, z: 0}, {x: 1, y: 1, z: 0}, {x: 2, y: 1, z: 0}, {x: 1, y: 0, z: 1}, {x: 2, y: 0, z: 1}], // 긴 구조
      ]
    ];
    
    // 난이도 적응형 설정
    state.currentTrial = 0;
    state.maxTrials = 20; // 16에서 20으로 증가
    state.showStimulus = true;
    state.stimulusOnset = p.millis();
    state.responded = false;
    
    // 3D 회전 관련 - 랜덤 초기 회전값
    const randomInitialRotation = {
      x: Math.random() * Math.PI * 2,
      y: Math.random() * Math.PI * 2,
      z: Math.random() * Math.PI * 0.5 // Z축은 조금만 회전
    };
    
    state.leftRotation = { ...randomInitialRotation };
    state.rightRotation = { ...randomInitialRotation };
    state.autoRotate = true;
    state.autoRotateSpeed = 0.010; // 약간 더 빠른 회전
    state.blockSize = 35; // 블록 크기 약간 축소
    
    // 마우스 드래그 관련
    state.isDragging = false;
    state.dragTarget = null;
    state.lastMouseX = 0;
    state.lastMouseY = 0;
    
    // 적응형 난이도 시스템
    state.performance = {
      correct: 0,
      total: 0,
      recentCorrect: [], // 최근 5개 시행 기록
      currentDifficulty: 1
    };
    
    // 난이도 빠르게 상승
    state.trialDifficulty = 2; // 난이도 2부터 시작
    
    // 피드백 오버레이 관련
    state.feedbackOverlay = {
      active: false,
      opacity: 0,
      targetOpacity: 0,
      response: null,
      buttonIndex: null
    };
    
    this.generateTrial(state);
  }

  generateTrial(state) {
    // 베이킹된 난이도 시스템: 시행 순서에 따른 고정 난이도
    const trialNumber = state.currentTrial + 1;
    
    // 20개 시행을 4단계로 나누어 점진적 난이도 상승
    let difficultyLevel;
    if (trialNumber <= 5) {
      difficultyLevel = 1; // 난이도 1: 4-5개 블록, 기본 회전
    } else if (trialNumber <= 10) {
      difficultyLevel = 2; // 난이도 2: 5-6개 블록, 복잡한 회전
    } else if (trialNumber <= 15) {
      difficultyLevel = 3; // 난이도 3: 6-7개 블록, 매우 복잡한 회전
    } else {
      difficultyLevel = 4; // 난이도 4: 7-8개 블록, 극한 난이도
    }
    
    // 현재 난이도에 맞는 패턴 선택
    const difficultyIndex = difficultyLevel - 1;
    const patterns = state.blockPatterns[difficultyIndex];
    state.basePattern = patterns[Math.floor(Math.random() * patterns.length)];
    
    // 회전각 복잡도도 난이도에 따라 증가
    const rotationComplexity = difficultyLevel;
    
    // 타겟 회전각 생성 (90도 단위로 명확하게)
    state.targetRotation = {
      x: Math.floor(Math.random() * 4) * Math.PI / 2, // 0, 90, 180, 270도
      y: Math.floor(Math.random() * 4) * Math.PI / 2,
      z: rotationComplexity > 2 ? Math.floor(Math.random() * 4) * Math.PI / 2 : 0
    };
    
    // 같음/다름 결정 (50:50 확률)
    state.isSame = Math.random() < 0.5;
    
    if (state.isSame) {
      // 같은 경우: 기본 패턴을 회전시킨 것
      state.targetPattern = this.rotatePattern(state.basePattern, state.targetRotation);
      console.log('같음 - 기본 패턴 회전 적용');
    } else {
      // 다른 경우: 여러 전략 사용 (거울상 제거하고 더 확실한 차이만 사용)
      const strategies = ['different', 'partial'];
      const strategy = strategies[Math.floor(Math.random() * strategies.length)];
      
      switch (strategy) {
        case 'different':
          // 완전히 다른 패턴
          let otherPattern;
          do {
            otherPattern = patterns[Math.floor(Math.random() * patterns.length)];
          } while (this.patternsEqual(otherPattern, state.basePattern));
          state.targetPattern = this.rotatePattern(otherPattern, state.targetRotation);
          console.log('다름 - 다른 패턴 + 회전');
          break;
          
        case 'partial':
          // 일부 블록만 변경 (연결된 구조 유지)
          state.targetPattern = [...state.basePattern];
          const blockToChange = Math.floor(Math.random() * state.targetPattern.length);
          
          // 기존 블록 제거
          state.targetPattern.splice(blockToChange, 1);
          
          // 기존 블록들과 인접한 위치에 새 블록 추가
          let newBlock;
          let attempts = 0;
          let validPosition = false;
          
          do {
            // 기존 블록 중 하나를 기준으로 인접한 위치 선택
            const referenceBlock = state.targetPattern[Math.floor(Math.random() * state.targetPattern.length)];
            const directions = [
              {x: 1, y: 0, z: 0}, {x: -1, y: 0, z: 0},
              {x: 0, y: 1, z: 0}, {x: 0, y: -1, z: 0},
              {x: 0, y: 0, z: 1}, {x: 0, y: 0, z: -1}
            ];
            
            const direction = directions[Math.floor(Math.random() * directions.length)];
            newBlock = {
              x: referenceBlock.x + direction.x,
              y: referenceBlock.y + direction.y,
              z: referenceBlock.z + direction.z
            };
            
            // 겹치지 않는지 확인
            validPosition = !state.targetPattern.some(b => 
              b.x === newBlock.x && b.y === newBlock.y && b.z === newBlock.z);
            
            attempts++;
          } while (attempts < 20 && !validPosition);
          
          // 유효한 위치를 찾지 못했으면 기존 블록을 그대로 유지
          if (validPosition) {
            state.targetPattern.push(newBlock);
          } else {
            // 유효한 위치를 찾지 못했으면 다른 전략 사용
            let otherPattern;
            do {
              otherPattern = patterns[Math.floor(Math.random() * patterns.length)];
            } while (this.patternsEqual(otherPattern, state.basePattern));
            state.targetPattern = this.rotatePattern(otherPattern, state.targetRotation);
            console.log('다름 - 부분 변경 실패, 다른 패턴 사용');
            break;
          }
          
          state.targetPattern = this.rotatePattern(state.targetPattern, state.targetRotation);
          console.log('다름 - 부분 변경 + 회전');
          break;
      }
    }
    
    // 초기 회전값 설정 (시각적 표시용)
    const newRandomRotation = {
      x: Math.random() * Math.PI * 2,
      y: Math.random() * Math.PI * 2,
      z: Math.random() * Math.PI * 0.5
    };
    state.leftRotation = { ...newRandomRotation };
    state.rightRotation = { ...newRandomRotation };
    
    // 자동 회전 속도도 난이도에 따라 조정
    state.autoRotateSpeed = 0.008 + (difficultyIndex * 0.003);
    
    console.log(`Trial ${state.currentTrial}: isSame=${state.isSame}`);
    console.log('Base pattern:', state.basePattern);
    console.log('Target pattern:', state.targetPattern);
    console.log('Target rotation:', state.targetRotation);
  }

  patternsEqual(pattern1, pattern2) {
    if (pattern1.length !== pattern2.length) return false;

    // 1. 좌표 정규화(원점 기준)
    function normalizePattern(pattern) {
      const minX = Math.min(...pattern.map(b => b.x));
      const minY = Math.min(...pattern.map(b => b.y));
      const minZ = Math.min(...pattern.map(b => b.z));
      return pattern.map(b => ({
        x: b.x - minX,
        y: b.y - minY,
        z: b.z - minZ
      }));
    }

    // 2. 인접 행렬 생성(붙어있는 블록끼리 엣지)
    function buildAdjacency(pattern) {
      const adj = Array(pattern.length).fill(0).map(() => []);
      for (let i = 0; i < pattern.length; i++) {
        for (let j = i + 1; j < pattern.length; j++) {
          const dx = Math.abs(pattern[i].x - pattern[j].x);
          const dy = Math.abs(pattern[i].y - pattern[j].y);
          const dz = Math.abs(pattern[i].z - pattern[j].z);
          if ((dx + dy + dz) === 1) {
            adj[i].push(j);
            adj[j].push(i);
          }
        }
      }
      return adj;
    }

    // 3. 그래프 동형성 검사(모든 노드 매핑 순열 시도)
    const n = pattern1.length;
    const norm1 = normalizePattern(pattern1);
    const norm2 = normalizePattern(pattern2);
    const adj1 = buildAdjacency(norm1);
    const adj2 = buildAdjacency(norm2);
    const idxs = Array.from({length: n}, (_, i) => i);
    function permute(arr, l, cb) {
      if (l === arr.length - 1) return cb(arr);
      for (let i = l; i < arr.length; i++) {
        [arr[l], arr[i]] = [arr[i], arr[l]];
        if (permute(arr, l + 1, cb)) return true;
        [arr[l], arr[i]] = [arr[i], arr[l]];
      }
      return false;
    }
    return permute(idxs, 0, perm => {
      for (let i = 0; i < n; i++) {
        if (adj1[i].length !== adj2[perm[i]].length) return false;
      }
      for (let i = 0; i < n; i++) {
        const mappedAdj1 = adj1[i].map(j => perm[j]).sort();
        const adj2Sorted = adj2[perm[i]].slice().sort();
        if (JSON.stringify(mappedAdj1) !== JSON.stringify(adj2Sorted)) return false;
      }
      return true;
    }) || false;
  }
  
  // 3D 회전 변환 함수
  rotatePattern(pattern, rotation) {
    return pattern.map(block => {
      let { x, y, z } = block;
      
      // X축 회전
      if (rotation.x !== 0) {
        const cos_x = Math.cos(rotation.x);
        const sin_x = Math.sin(rotation.x);
        const new_y = y * cos_x - z * sin_x;
        const new_z = y * sin_x + z * cos_x;
        y = new_y;
        z = new_z;
      }
      
      // Y축 회전  
      if (rotation.y !== 0) {
        const cos_y = Math.cos(rotation.y);
        const sin_y = Math.sin(rotation.y);
        const new_x = x * cos_y + z * sin_y;
        const new_z = -x * sin_y + z * cos_y;
        x = new_x;
        z = new_z;
      }
      
      // Z축 회전
      if (rotation.z !== 0) {
        const cos_z = Math.cos(rotation.z);
        const sin_z = Math.sin(rotation.z);
        const new_x = x * cos_z - y * sin_z;
        const new_y = x * sin_z + y * cos_z;
        x = new_x;
        y = new_y;
      }
      
      // 소수점 반올림으로 부동소수점 오차 제거
      return {
        x: Math.round(x * 1000) / 1000,
        y: Math.round(y * 1000) / 1000,
        z: Math.round(z * 1000) / 1000
      };
    });
  }

  render(state, p) {
    if (state.currentTrial >= state.maxTrials) {
      this.completeTask();
      return;
    }
    
    if (state.showStimulus) {
      // 배경
      p.push();
      p.fill(245);
      p.noStroke();
      p.rect(0, 0, p.width, p.height);
      p.pop();
      
      // 3D 렌더링 영역 크기
      const viewWidth = p.width * 0.35;
      const viewHeight = p.height * 0.4;
      const spacing = p.width * 0.1;
      
      // 왼쪽 블록 (원본)
      p.push();
      p.translate(p.width/2 - viewWidth/2 - spacing/2, p.height * 0.35);
      this.draw3DBlocks(state.basePattern, state.leftRotation, state.blockSize, viewWidth, viewHeight, p);
      p.pop();
      
      // 라벨
      p.push();
      p.textAlign(p.CENTER);
      p.textSize(20);
      p.fill(100);
      p.text('원본', p.width/2 - viewWidth/2 - spacing/2, p.height * 0.6);
      p.pop();
      
      // 화살표
      p.push();
      p.stroke(150);
      p.strokeWeight(3);
      p.fill(150);
      const arrowY = p.height * 0.35;
      p.line(p.width/2 - spacing/4, arrowY, p.width/2 + spacing/4 - 10, arrowY);
      p.triangle(
        p.width/2 + spacing/4 - 10, arrowY,
        p.width/2 + spacing/4 - 20, arrowY - 10,
        p.width/2 + spacing/4 - 20, arrowY + 10
      );
      p.pop();
      
      // 오른쪽 블록 (비교)
      p.push();
      p.translate(p.width/2 + viewWidth/2 + spacing/2, p.height * 0.35);
      this.draw3DBlocks(state.targetPattern || state.basePattern, state.rightRotation, state.blockSize, viewWidth, viewHeight, p);
      p.pop();
      
      // 라벨
      p.push();
      p.textAlign(p.CENTER);
      p.textSize(20);
      p.fill(100);
      p.text('비교', p.width/2 + viewWidth/2 + spacing/2, p.height * 0.6);
      p.pop();
      
      // 자동 회전 - Y축과 X축을 동시에 회전
      if (state.autoRotate) {
        // Y축 회전 (좌우)
        state.leftRotation.y += state.autoRotateSpeed;
        state.rightRotation.y += state.autoRotateSpeed;
        
        // X축 회전 (상하) - 더 느리게
        state.leftRotation.x += state.autoRotateSpeed * 0.3;
        state.rightRotation.x += state.autoRotateSpeed * 0.3;
        
        // 작은 Z축 회전도 추가하여 더 동적으로
        state.leftRotation.z += state.autoRotateSpeed * 0.1;
        state.rightRotation.z += state.autoRotateSpeed * 0.1;
      }
      
      // 응답 버튼
      this.drawResponseButtons(state, p);
      
      // 진행률 표시
      const t = window.translationService?.t || ((key) => key);
      p.push();
      p.textAlign(p.LEFT);
      p.textSize(18);
      p.fill(100);
      p.text(`${t('progress')}: ${state.currentTrial + 1} / ${state.maxTrials}`, 20, 30);
      p.pop();
      
      // 피드백 오버레이 렌더링
      this.renderFeedbackOverlay(state, p);
    }
  }

  draw3DBlocks(pattern, rotation, blockSize, viewWidth, viewHeight, p) {
    p.push();
    
    // 원근감 설정
    const perspective = 800;
    
    // 패턴의 중심점 계산
    let centerX = 0, centerY = 0, centerZ = 0;
    pattern.forEach(block => {
      centerX += block.x;
      centerY += block.y;
      centerZ += block.z;
    });
    centerX /= pattern.length;
    centerY /= pattern.length;
    centerZ /= pattern.length;
    
    // 모든 큐브의 면들을 저장할 배열
    const allFaces = [];
    
    // 각 블록에 대해
    pattern.forEach((block, blockIndex) => {
      // 큐브의 8개 정점 계산
      const vertices = [];
      const halfSize = 0.5;
      
      for (let i = 0; i < 8; i++) {
        const dx = (i & 1) ? halfSize : -halfSize;
        const dy = (i & 2) ? halfSize : -halfSize;
        const dz = (i & 4) ? halfSize : -halfSize;
        
        const x = (block.x - centerX + dx) * blockSize;
        const y = (block.y - centerY + dy) * blockSize;
        const z = (block.z - centerZ + dz) * blockSize;
        
        // 회전 변환
        // Y축 회전
        const x1 = x * Math.cos(rotation.y) - z * Math.sin(rotation.y);
        const z1 = x * Math.sin(rotation.y) + z * Math.cos(rotation.y);
        
        // X축 회전
        const y1 = y * Math.cos(rotation.x) - z1 * Math.sin(rotation.x);
        const z2 = y * Math.sin(rotation.x) + z1 * Math.cos(rotation.x);
        
        // Z축 회전
        const x2 = x1 * Math.cos(rotation.z) - y1 * Math.sin(rotation.z);
        const y2 = x1 * Math.sin(rotation.z) + y1 * Math.cos(rotation.z);
        
        // 원근 투영
        const scale = perspective / (perspective + z2);
        const projX = x2 * scale;
        const projY = y2 * scale;
        
        vertices.push({
          x: projX,
          y: projY,
          z: z2,
          scale: scale,
          originalZ: z2
        });
      }
      
      // 큐브의 6개 면 정의 (정점 인덱스, 올바른 시계방향)
      const faceDefinitions = [
        { indices: [0, 1, 3, 2], normal: {x: 0, y: 0, z: -1}, color: [106, 205, 110] }, // 앞면
        { indices: [5, 4, 6, 7], normal: {x: 0, y: 0, z: 1}, color: [46, 125, 50] },   // 뒷면
        { indices: [0, 4, 5, 1], normal: {x: 0, y: -1, z: 0}, color: [76, 175, 80] },  // 아래면
        { indices: [2, 3, 7, 6], normal: {x: 0, y: 1, z: 0}, color: [66, 165, 70] },   // 윗면
        { indices: [0, 2, 6, 4], normal: {x: -1, y: 0, z: 0}, color: [86, 185, 90] },  // 왼쪽면
        { indices: [1, 5, 7, 3], normal: {x: 1, y: 0, z: 0}, color: [56, 155, 60] }    // 오른쪽면
      ];
      
      faceDefinitions.forEach(faceDef => {
        // 면의 중심점 계산
        let centerZ = 0;
        faceDef.indices.forEach(idx => {
          centerZ += vertices[idx].z;
        });
        centerZ /= 4;
        
        // 면의 법선 벡터도 회전 적용
        const nx = faceDef.normal.x;
        const ny = faceDef.normal.y;
        const nz = faceDef.normal.z;
        
        // Y축 회전
        const nx1 = nx * Math.cos(rotation.y) - nz * Math.sin(rotation.y);
        const nz1 = nx * Math.sin(rotation.y) + nz * Math.cos(rotation.y);
        
        // X축 회전
        const ny1 = ny * Math.cos(rotation.x) - nz1 * Math.sin(rotation.x);
        const nz2 = ny * Math.sin(rotation.x) + nz1 * Math.cos(rotation.x);
        
        // Z축 회전
        const nx2 = nx1 * Math.cos(rotation.z) - ny1 * Math.sin(rotation.z);
        
        // 카메라를 향하는 면만 렌더링 (nz2 < 0)
        const isFacingCamera = nz2 < 0;
        
        allFaces.push({
          vertices: faceDef.indices.map(idx => vertices[idx]),
          color: faceDef.color,
          centerZ: centerZ,
          isFacingCamera: isFacingCamera,
          blockIndex: blockIndex
        });
      });
    });
    
    // Z값으로 정렬 (뒤에서 앞으로)
    allFaces.sort((a, b) => b.centerZ - a.centerZ);
    
    // 면 그리기
    allFaces.forEach(face => {
      if (face.isFacingCamera) {
        p.push();
        
        // 면 색상 적용
        p.fill(face.color[0], face.color[1], face.color[2]);
        p.stroke(20);
        p.strokeWeight(1);
        
        // 면 그리기
        p.beginShape();
        face.vertices.forEach(v => {
          p.vertex(v.x, v.y);
        });
        p.endShape(p.CLOSE);
        
        // 선택적: 엣지 강조
        p.stroke(0);
        p.strokeWeight(0.5);
        p.noFill();
        p.beginShape();
        face.vertices.forEach(v => {
          p.vertex(v.x, v.y);
        });
        p.endShape(p.CLOSE);
        
        p.pop();
      }
    });
    
    p.pop();
  }

  drawResponseButtons(state, p) {
    const buttonWidth = 200;
    const buttonHeight = 100;
    const buttonY = p.height * 0.75;
    const spacing = 80;
    
    state.buttons = [];
    
    // "같음" 버튼
    const sameX = p.width/2 - buttonWidth - spacing/2;
    state.buttons.push({
      x: sameX,
      y: buttonY,
      width: buttonWidth,
      height: buttonHeight,
      response: true,
      index: 0
    });
    
    p.push();
    // 피드백 오버레이가 활성화되고 이 버튼이 선택된 경우 약간 어둡게
    if (state.feedbackOverlay.active && state.feedbackOverlay.buttonIndex === 0) {
      p.fill(56, 155, 60);
    } else {
      p.fill(76, 175, 80);
    }
    p.noStroke();
    p.rect(sameX, buttonY, buttonWidth, buttonHeight, 10);
    p.fill(255);
    p.textSize(32);
    p.textAlign(p.CENTER, p.CENTER);
    p.textStyle(p.BOLD);
    p.text('같음', sameX + buttonWidth/2, buttonY + buttonHeight/2);
    p.pop();
    
    // "다름" 버튼
    const diffX = p.width/2 + spacing/2;
    state.buttons.push({
      x: diffX,
      y: buttonY,
      width: buttonWidth,
      height: buttonHeight,
      response: false,
      index: 1
    });
    
    p.push();
    // 피드백 오버레이가 활성화되고 이 버튼이 선택된 경우 약간 어둡게
    if (state.feedbackOverlay.active && state.feedbackOverlay.buttonIndex === 1) {
      p.fill(224, 47, 34);
    } else {
      p.fill(244, 67, 54);
    }
    p.noStroke();
    p.rect(diffX, buttonY, buttonWidth, buttonHeight, 10);
    p.fill(255);
    p.textSize(32);
    p.textAlign(p.CENTER, p.CENTER);
    p.textStyle(p.BOLD);
    p.text('다름', diffX + buttonWidth/2, buttonY + buttonHeight/2);
    p.pop();
  }

  renderFeedbackOverlay(state, p) {
    const overlay = state.feedbackOverlay;
    
    // 오버레이 투명도 애니메이션
    if (overlay.active) {
      overlay.opacity = p.lerp(overlay.opacity, overlay.targetOpacity, 0.2);
      
      // 화면 중앙에 큰 팝업창 표시
      p.push();
      
      // 배경 어둡게 처리
      p.fill(0, 0, 0, overlay.opacity * 120);
      p.noStroke();
      p.rect(0, 0, p.width, p.height);
      
      // 팝업창 설정
      const popupWidth = 400;
      const popupHeight = 300;
      const popupX = (p.width - popupWidth) / 2;
      const popupY = (p.height - popupHeight) / 2;
      
      // 팝업창 배경 (둥근 모서리)
      p.fill(255, 255, 255, overlay.opacity * 255);
      p.stroke(200, 200, 200, overlay.opacity * 255);
      p.strokeWeight(2);
      p.rect(popupX, popupY, popupWidth, popupHeight, 20);
      
          // 단순한 다음 문제 안내
    const t = window.translationService?.t || ((key) => key);
    const iconColor = [76, 175, 80]; // 초록색
    const message = t('nextQuestionMessage');
      const icon = "→";
      
      // 아이콘 배경 원
      p.push();
      p.translate(popupX + popupWidth/2, popupY + 100);
      
      p.fill(iconColor[0], iconColor[1], iconColor[2], overlay.opacity * 255);
      p.noStroke();
      p.circle(0, 0, 100);
      
      // 아이콘
      p.fill(255, 255, 255, overlay.opacity * 255);
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(60);
      p.textStyle(p.BOLD);
      p.text(icon, 0, -5);
      p.pop();
      
      // 메인 메시지
      p.fill(iconColor[0], iconColor[1], iconColor[2], overlay.opacity * 255);
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(28);
      p.textStyle(p.BOLD);
      p.text(message, popupX + popupWidth/2, popupY + 190);
      
      // 진행 바 (팝업이 닫히기까지의 시간)
      const progressBarWidth = popupWidth - 40;
      const progressBarHeight = 6;
      const progressX = popupX + 20;
      const progressY = popupY + popupHeight - 25;
      
      // 진행 바 배경
      p.fill(230, 230, 230, overlay.opacity * 255);
      p.noStroke();
      p.rect(progressX, progressY, progressBarWidth, progressBarHeight, 3);
      
      // 진행 바 (시간이 지날수록 줄어듦)
      if (overlay.targetOpacity === 0) {
        const progress = Math.max(0, overlay.opacity);
        p.fill(iconColor[0], iconColor[1], iconColor[2], overlay.opacity * 255);
        p.rect(progressX, progressY, progressBarWidth * progress, progressBarHeight, 3);
      }
      
      p.pop();
      
      // 애니메이션 종료 확인
      if (Math.abs(overlay.opacity - overlay.targetOpacity) < 0.01) {
        if (overlay.targetOpacity === 0) {
          overlay.active = false;
        }
      }
    }
  }
  
  // handleMousePress 메서드의 피드백 타이밍도 조정
  handleMousePress(state, x, y, p) {
    // 버튼 클릭 확인
    if (!state.buttons || state.responded) return;
    
    for (let button of state.buttons) {
      if (x >= button.x && x <= button.x + button.width &&
          y >= button.y && y <= button.y + button.height) {
        
        const rt = p.millis() - state.stimulusOnset;
        
        this.taskData.responses.push({
          trial: state.currentTrial,
          patternComplexity: state.basePattern.length,
          rotation: state.targetRotation,
          isMirrored: state.isMirrored,
          isSame: state.isSame,
          response: button.response,
          correct: button.response === state.isSame,
          rt: rt,
          difficulty: state.trialDifficulty
        });
        
        state.responded = true;
        
        // 피드백 오버레이 활성화 (더 명확한 설정)
        state.feedbackOverlay.active = true;
        state.feedbackOverlay.opacity = 0;
        state.feedbackOverlay.targetOpacity = 1;
        state.feedbackOverlay.response = button.response;
        state.feedbackOverlay.buttonIndex = button.index;
        
        // 피드백 표시 시간을 짧게 (1초)
        setTimeout(() => {
          state.feedbackOverlay.targetOpacity = 0;
        }, 1000);
        
        // 다음 시행 준비 (팝업이 완전히 사라진 직후)
        setTimeout(() => {
          state.currentTrial++;
          
          // 정답 여부 기록 (베이킹된 난이도 시스템에서는 단순 기록만)
          state.performance.total++;
          state.performance.recentCorrect.push(button.response === state.isSame ? 1 : 0);
          if (button.response === state.isSame) {
            state.performance.correct++;
          }
          
          state.stimulusOnset = p.millis();
          state.responded = false;
          
          // 새로운 랜덤 초기 회전값
          const newRandomRotation = {
            x: Math.random() * Math.PI * 2,
            y: Math.random() * Math.PI * 2,
            z: Math.random() * Math.PI * 0.5
          };
          state.leftRotation = { ...newRandomRotation };
          state.rightRotation = { ...newRandomRotation };
          state.autoRotate = true;
          
          // 피드백 오버레이 초기화
          state.feedbackOverlay = {
            active: false,
            opacity: 0,
            targetOpacity: 0,
            response: null,
            buttonIndex: null
          };
          
          this.generateTrial(state);
        }, 1800); // 총 1.8초 후 다음 시행
        
        break;
      }
    }
    
    // 마우스 드래그 시작 (블록 회전용) - 기존 코드 그대로 유지
    const viewWidth = p.width * 0.35;
    const spacing = p.width * 0.1;
    const leftCenterX = p.width/2 - viewWidth/2 - spacing/2;
    const rightCenterX = p.width/2 + viewWidth/2 + spacing/2;
    const blockY = p.height * 0.35;
    
    if (Math.abs(x - leftCenterX) < viewWidth/2 && Math.abs(y - blockY) < p.height * 0.2) {
      state.isDragging = true;
      state.dragTarget = 'left';
      state.autoRotate = false;
    } else if (Math.abs(x - rightCenterX) < viewWidth/2 && Math.abs(y - blockY) < p.height * 0.2) {
      state.isDragging = true;
      state.dragTarget = 'right';
      state.autoRotate = false;
    }
    
    state.lastMouseX = x;
    state.lastMouseY = y;
  }

  handleMouseDrag(state, x, y, p) {
    if (!state || !state.isDragging) return;
    
    const deltaX = x - state.lastMouseX;
    const deltaY = y - state.lastMouseY;
    
    const rotationSpeed = 0.01;
    
    if (state.dragTarget === 'left') {
      state.leftRotation.y += deltaX * rotationSpeed;
      state.leftRotation.x += deltaY * rotationSpeed;
    } else if (state.dragTarget === 'right') {
      state.rightRotation.y += deltaX * rotationSpeed;
      state.rightRotation.x += deltaY * rotationSpeed;
    }
    
    state.lastMouseX = x;
    state.lastMouseY = y;
  }

  handleMouseRelease(state, p) {
    if (!state) return;
    
    state.isDragging = false;
    state.dragTarget = null;
    // 드래그 후 3초 뒤에 자동 회전 재개
    setTimeout(() => {
      if (!state.isDragging) {
        state.autoRotate = true;
      }
    }, 3000);
  }

  calculateScore() {
    const responses = this.taskData.responses;
    if (responses.length === 0) return 0;
    
    // 정확도
    const correct = responses.filter(r => r.correct).length;
    const accuracy = (correct / responses.length) * 100;
    
    // 베이킹된 난이도 시스템에 따른 점수 계산
    let totalScore = 0;
    let maxPossibleScore = 0;
    
    for (let i = 0; i < responses.length; i++) {
      const response = responses[i];
      const trialNumber = i + 1;
      
      // 시행 순서에 따른 난이도 가중치
      let difficultyWeight;
      if (trialNumber <= 5) {
        difficultyWeight = 1.0; // 난이도 1
      } else if (trialNumber <= 10) {
        difficultyWeight = 1.5; // 난이도 2
      } else if (trialNumber <= 15) {
        difficultyWeight = 2.0; // 난이도 3
      } else {
        difficultyWeight = 2.5; // 난이도 4
      }
      
      if (response.correct) {
        // 회전 복잡도에 따른 추가 점수
        const rotationComplexity = 
          (response.rotation.x !== 0 ? 1 : 0) +
          (response.rotation.y !== 0 ? 1 : 0) +
          (response.rotation.z !== 0 ? 1 : 0);
        const complexityBonus = rotationComplexity * 0.2;
        totalScore += difficultyWeight * (1 + complexityBonus);
      }
      maxPossibleScore += difficultyWeight * 1.6; // 최대 복잡도 보너스 포함
    }
    
    const difficultyScore = (totalScore / maxPossibleScore) * 100;
    
    // 반응시간 보너스
    const correctResponses = responses.filter(r => r.correct);
    const avgRT = correctResponses.length > 0
      ? correctResponses.reduce((sum, r) => sum + r.rt, 0) / correctResponses.length
      : 0;
    
    const speedBonus = Math.max(0, 10 - (avgRT / 1000));
    
    // 최종 점수
    return Math.round(Math.min(100, 
      accuracy * 0.5 + 
      difficultyScore * 0.4 + 
      speedBonus
    ));
  }
}