/* ==========================================================================
   Main Application Orchestrator (Auto-hide previous photo & Zero sound for 1,2,3,5)
   ========================================================================== */

import { ParticleSystem } from './particles.js';

function initApp() {
  const mainCanvas = document.getElementById('canvas');
  const webcamVideo = document.getElementById('webcam');
  const gestureCanvas = document.getElementById('gesture-canvas');
  const gestureCtx = gestureCanvas.getContext('2d');

  const statusDot = document.getElementById('status-dot');
  const statusText = document.getElementById('status-text');
  const camPlaceholder = document.getElementById('cam-placeholder');
  const toggleCamBtn = document.getElementById('toggle-cam-btn');
  const camIcon = document.getElementById('cam-icon');

  const gestureIcon = document.getElementById('gesture-icon');
  const gestureName = document.getElementById('gesture-name');
  const gestureSub = document.getElementById('gesture-sub');
  const greetingBanner = document.getElementById('greeting-banner');
  const greetingTitle = document.getElementById('greeting-title');
  const greetingSub = document.getElementById('greeting-sub');

  // Gift Prompt Elements
  const giftPromptCard = document.getElementById('gift-prompt-card');
  const giftBoxIcon = document.getElementById('gift-box-icon');
  const giftPromptTitle = document.getElementById('gift-prompt-title');
  const openGiftBtn = document.getElementById('open-gift-btn');
  const skipGiftBtn = document.getElementById('skip-gift-btn');

  // Notice Toast Element
  const nextNoticeToast = document.getElementById('next-notice-toast');
  const toastText = document.getElementById('toast-text');

  // Confession Modal Elements
  const confessionCard = document.getElementById('confession-card');
  const confessionTitle = document.querySelector('.confession-title');
  const confessionSub = document.querySelector('.confession-sub');
  const successModal = document.getElementById('success-modal');
  const yesBtn = document.getElementById('yes-btn');
  const noBtn = document.getElementById('no-btn');
  const closeSuccessBtn = document.getElementById('close-success-btn');
  const triggerConfessionBtn = document.getElementById('trigger-confession-btn');

  const modeButtons = document.querySelectorAll('.mode-btn');
  const toggleSoundBtn = document.getElementById('toggle-sound-btn');
  const soundIcon = document.getElementById('sound-icon');

  let particleSystem = null;
  let gestureDetector = new GestureDetector();
  let audioSynth = new ChristmasAudioSynth();
  let handsModel = null;
  let cameraUtil = null;
  let isCameraActive = false;
  let activeMode = 0;

  let pendingGiftMode = null;

  const loadedPhotos = {};
  const photoPaths = {
    1: { src: 'images/image1.jpeg', caption: 'Kỉ niệm Giáng Sinh #1 💖' },
    2: { src: 'images/image2.jpeg', caption: 'Kỉ niệm Giáng Sinh #2 ✨' },
    3: { src: 'images/image3.jpeg', caption: 'Kỉ niệm Giáng Sinh #3 🌟' },
    5: { src: 'images/image5.jpeg', caption: 'Kỉ niệm Giáng Sinh #5 🎁' }
  };

  Object.keys(photoPaths).forEach(key => {
    const img = new Image();
    img.src = photoPaths[key].src;
    loadedPhotos[key] = { img: img, caption: photoPaths[key].caption };
  });

  const giftNames = {
    1: { icon: '🎁', title: 'Hộp Quà Bí Mật #1 ✨' },
    2: { icon: '🎁', title: 'Hộp Quà Bí Mật #2 ✨' },
    3: { icon: '🎁', title: 'Hộp Quà Bí Mật #3 ✨' },
    5: { icon: '🎁', title: 'Hộp Quà Bí Mật #5 ✨' },
    8: { icon: '💌', title: 'Thiệp Tỏ Tình Giáng Sinh 💓' }
  };

  const nextToastHints = {
    1: '👉 Giơ ngón tay 2 ✌️ để khám phá Hộp Quà số 2 nhé!',
    2: '👉 Giơ ngón tay 3 🤟 để khám phá Hộp Quà số 3 nhé!',
    3: '👉 Mở xòe tay 🖐️ để bùng nổ Hộp Quà số 5 nhé!',
    5: '👉 Chắp Trái Tim 💖 để mở Thiệp Tỏ Tình & Hẹn Đi Ăn Noel nhé!',
    8: '✨ Bạn đã hoàn thành toàn bộ Hành Trình Giáng Sinh Phép Thuật! 💖'
  };

  const gestureMeta = {
    0: { icon: '✊', name: 'Nắm Tay ✊ (Thu về Cây)', sub: 'Nắm bàn tay ✊ để thâu các hạt lại thành Cây Thông Cổ Điển' },
    1: { icon: '☝️', name: '1... Cyberpunk Helical Vortex', sub: 'Phát hiện Hộp Quà #1 (Ra hiệu 👍 để mở)' },
    2: { icon: '✌️', name: '2... Frosted Ice Crystal', sub: 'Phát hiện Hộp Quà #2 (Ra hiệu 👍 để mở)' },
    3: { icon: '🤟', name: '3... Solar Starburst Sphere', sub: 'Phát hiện Hộp Quà #3 (Ra hiệu 👍 để mở)' },
    5: { icon: '🖐️', name: 'Mở Tay 🖐️ (Bùng Nổ Galaxy)', sub: 'Mở xòe 5 ngón tay 🖐️ để bùng nổ Hạt Thiên Hà xoáy quanh tay' },
    8: { icon: '💖', name: 'Trái Tim Phép Thuật (Heart 3D)', sub: 'Chắp Trái Tim 💖 ➔ Mở Thiệp Tỏ Tình & Hẹn Đi Ăn 🥂' }
  };

  function resizeCanvas() {
    mainCanvas.width = window.innerWidth;
    mainCanvas.height = window.innerHeight;
    if (particleSystem && particleSystem.resize) {
      particleSystem.resize(window.innerWidth, window.innerHeight);
    }
  }
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  particleSystem = new ParticleSystem(mainCanvas);

  toggleSoundBtn.addEventListener('click', () => {
    const isEnabled = audioSynth.toggleSound();
    toggleSoundBtn.classList.toggle('disabled', !isEnabled);
    soundIcon.textContent = isEnabled ? '🔊' : '🔇';
    toggleSoundBtn.textContent = (isEnabled ? '🔊 Âm Nhạc: Bật' : '🔇 Âm Nhạc: Tắt');
  });

  modeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const mode = parseInt(btn.getAttribute('data-mode'), 10);
      if (!isNaN(mode)) switchMode(mode);
    });
  });

  function promptGiftForMode(mode) {
    // ALWAYS CLEAR PREVIOUS PHOTO WHEN SWITCHING TO A NEW MODE/GIFT!
    particleSystem.clearActivePhoto();

    if (mode === 0) {
      giftPromptCard.classList.add('hidden');
      particleSystem.setPromptText(null);
      pendingGiftMode = null;
      return;
    }

    pendingGiftMode = mode;
    const giftInfo = giftNames[mode] || giftNames[1];
    giftBoxIcon.textContent = giftInfo.icon;
    giftPromptTitle.textContent = giftInfo.title;
    giftPromptCard.classList.remove('hidden');

    particleSystem.setPromptText(`✨ ${giftInfo.title} ✨`);
  }

  function confirmOpenGift() {
    if (!pendingGiftMode) return;

    const mode = pendingGiftMode;
    giftPromptCard.classList.add('hidden');
    particleSystem.setPromptText(null);

    particleSystem.triggerFirework(window.innerWidth * 0.5, window.innerHeight * 0.4);

    if (mode === 8) {
      showConfessionModal();
    } else {
      const photoData = loadedPhotos[mode];
      if (photoData) {
        particleSystem.setActivePhoto(photoData.img, photoData.caption);
      }
    }

    const nextHint = nextToastHints[mode] || nextToastHints[1];
    toastText.textContent = nextHint;
    nextNoticeToast.classList.remove('hidden');

    setTimeout(() => {
      nextNoticeToast.classList.add('hidden');
    }, 6000);

    pendingGiftMode = null;
  }

  openGiftBtn.addEventListener('click', confirmOpenGift);

  skipGiftBtn.addEventListener('click', () => {
    giftPromptCard.classList.add('hidden');
    particleSystem.setPromptText(null);
    particleSystem.clearActivePhoto();
    pendingGiftMode = null;
  });

  mainCanvas.addEventListener('click', () => {
    particleSystem.clearActivePhoto();
  });

  function switchMode(mode, handPos = null) {
    if (activeMode === mode && !handPos) return;

    const isNewMode = activeMode !== mode;
    activeMode = mode;

    modeButtons.forEach(btn => {
      const bMode = parseInt(btn.getAttribute('data-mode'), 10);
      btn.classList.toggle('active', bMode === mode);
    });

    particleSystem.setMode(mode, handPos);
    promptGiftForMode(mode);

    const meta = gestureMeta[mode] || gestureMeta[0];
    gestureIcon.textContent = meta.icon;
    gestureName.textContent = meta.name;
    gestureSub.textContent = meta.sub;

    if (mode === 5) {
      greetingTitle.textContent = '🎄 Merry Christmas! 🎁';
      greetingSub.textContent = 'Chúc bạn một mùa Giáng Sinh an lành & ngập tràn hạnh phúc!';
      greetingBanner.classList.remove('hidden');
    } else if (mode === 8) {
      greetingTitle.textContent = '💖 Love & Warmth! 💖';
      greetingSub.textContent = 'Trái tim phép thuật dành tặng bạn mùa Giáng Sinh!';
      greetingBanner.classList.remove('hidden');
    } else {
      greetingBanner.classList.add('hidden');
    }

    if (isNewMode) {
      audioSynth.playGestureEffect(mode);
    }
  }

  function resetConfessionCard() {
    confessionTitle.innerHTML = '1, 2, 3, 5...<br><span class="highlight-text">Em có đánh rơi nhịp nào không?</span>';
    confessionSub.textContent = 'Nếu câu trả lời là CÓ... Noel này hẹn 1 buổi đi ăn với anh nhé? 🥂✨';
    noBtn.style.display = 'inline-block';
    noBtn.style.transform = 'translate(0, 0)';
    yesBtn.textContent = 'Có chứ! 💖🥂';
    yesBtn.style.transform = 'scale(1)';
  }

  function showConfessionModal() {
    resetConfessionCard();
    confessionCard.classList.remove('hidden');
    audioSynth.playGestureEffect(8);
  }

  triggerConfessionBtn.addEventListener('click', () => {
    switchMode(8);
  });

  function dodgeInsideCard() {
    if (confessionCard.classList.contains('hidden') || noBtn.style.display === 'none') return;
    const randomX = (Math.random() - 0.5) * 200;
    const randomY = (Math.random() - 0.5) * 100;
    noBtn.style.transform = `translate(${randomX}px, ${randomY}px)`;
  }

  document.addEventListener('mousemove', (e) => {
    if (confessionCard.classList.contains('hidden') || noBtn.style.display === 'none') return;
    const rect = noBtn.getBoundingClientRect();
    const btnCenterX = rect.left + rect.width / 2;
    const btnCenterY = rect.top + rect.height / 2;
    const distance = Math.sqrt(Math.pow(e.clientX - btnCenterX, 2) + Math.pow(e.clientY - btnCenterY, 2));
    if (distance < 60) {
      dodgeInsideCard();
    }
  });

  noBtn.addEventListener('click', (e) => {
    e.preventDefault();
    noBtn.style.display = 'none';
    confessionTitle.innerHTML = 'Năn nỉ đó... 🥺💖<br><span class="highlight-text">Thôi mà, đi ăn với anh đi!</span>';
    confessionSub.textContent = 'Noel này anh mời em đi ăn món ngon thật ấm áp nè! 🥂✨';
    yesBtn.textContent = 'Được rồi, đi ăn thôi! 💖🥂';
    yesBtn.style.transform = 'scale(1.15)';
    audioSynth.playGestureEffect(1);
  });

  yesBtn.addEventListener('click', () => {
    confessionCard.classList.add('hidden');
    successModal.classList.remove('hidden');

    switchMode(8);
    audioSynth.playGestureEffect(5);
  });

  closeSuccessBtn.addEventListener('click', () => {
    successModal.classList.add('hidden');
  });

  function drawHandPreview(landmarksList) {
    gestureCtx.clearRect(0, 0, gestureCanvas.width, gestureCanvas.height);
    if (!landmarksList || landmarksList.length === 0) return;

    const w = gestureCanvas.width;
    const h = gestureCanvas.height;

    const connections = [
      [0,1],[1,2],[2,3],[3,4],
      [0,5],[5,6],[6,7],[7,8],
      [5,9],[9,10],[10,11],[11,12],
      [9,13],[13,14],[14,15],[15,16],
      [13,17],[17,18],[18,19],[19,20],[0,17]
    ];

    const colors = ['#ffd700', '#ff4757'];

    landmarksList.forEach((hand, handIdx) => {
      const strokeColor = colors[handIdx % colors.length];

      gestureCtx.strokeStyle = strokeColor;
      gestureCtx.lineWidth = 2;
      for (const [i, j] of connections) {
        const p1 = hand[i];
        const p2 = hand[j];
        gestureCtx.beginPath();
        gestureCtx.moveTo(p1.x * w, p1.y * h);
        gestureCtx.lineTo(p2.x * w, p2.y * h);
        gestureCtx.stroke();
      }

      gestureCtx.fillStyle = '#ffffff';
      for (const pt of hand) {
        gestureCtx.beginPath();
        gestureCtx.arc(pt.x * w, pt.y * h, 2.5, 0, Math.PI * 2);
        gestureCtx.fill();
      }
    });
  }

  function initMediaPipe() {
    if (typeof window.Hands === 'undefined') {
      statusText.textContent = 'Không tìm thấy MediaPipe SDK!';
      return;
    }

    handsModel = new window.Hands({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
    });

    handsModel.setOptions({
      maxNumHands: 2,
      modelComplexity: 1,
      minDetectionConfidence: 0.6,
      minTrackingConfidence: 0.6
    });

    handsModel.onResults((results) => {
      const landmarksList = results.multiHandLandmarks;
      drawHandPreview(landmarksList);

      const gestureData = gestureDetector.processLandmarks(landmarksList);
      if (gestureData.isHandPresent) {
        switchMode(gestureData.mode, gestureData.handPos);

        if (gestureData.isThumbsUp && pendingGiftMode) {
          confirmOpenGift();
        }
      }
    });

    statusText.textContent = 'Camera Sẵn Sàng (2 Tay)';
  }

  async function startCamera() {
    if (!handsModel) initMediaPipe();
    if (isCameraActive) return;

    statusText.textContent = 'Đang bật camera (2 tay)...';
    try {
      if (!cameraUtil) {
        cameraUtil = new window.Camera(webcamVideo, {
          onFrame: async () => {
            await handsModel.send({ image: webcamVideo });
          },
          width: 320,
          height: 240
        });
      }
      await cameraUtil.start();
      isCameraActive = true;
      statusDot.classList.add('active');
      statusText.textContent = 'AI Tracking 2 Tay Active';
      camPlaceholder.classList.add('hidden');
      camIcon.textContent = '🛑';
      toggleCamBtn.textContent = '🛑 Tắt Camera';
    } catch (err) {
      console.error("Camera access failed:", err);
      statusText.textContent = 'Lỗi truy cập Camera';
      alert('Không thể truy cập camera. Vui lòng cho phép quyền truy cập webcam!');
    }
  }

  async function stopCamera() {
    if (cameraUtil) {
      await cameraUtil.stop();
    }
    isCameraActive = false;
    statusDot.classList.remove('active');
    statusText.textContent = 'Camera Đã Tắt';
    camPlaceholder.classList.remove('hidden');
    gestureCtx.clearRect(0, 0, gestureCanvas.width, gestureCanvas.height);
    camIcon.textContent = '📹';
    toggleCamBtn.textContent = '📹 Bật Camera (2 Tay)';
    switchMode(0);
  }

  toggleCamBtn.addEventListener('click', () => {
    if (isCameraActive) {
      stopCamera();
    } else {
      startCamera();
    }
  });

  function renderLoop() {
    particleSystem.update();
    particleSystem.render();
    requestAnimationFrame(renderLoop);
  }

  initMediaPipe();
  startCamera(); // Auto-open camera on page load (no click needed)
  renderLoop();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
