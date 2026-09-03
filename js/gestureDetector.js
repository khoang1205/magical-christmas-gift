/* ==========================================================================
   MediaPipe Hand Gesture Detector (Includes Fist ✊, Open Palm 🖐, Thumbs Up 👍 & Heart 💖)
   ========================================================================== */

class GestureDetector {
  constructor() {
    this.history = [];
    this.maxHistory = 5;
    this.currentGesture = {
      mode: 0,
      fingerCount: 0,
      handPos: { x: 0.5, y: 0.5 },
      handPos2: { x: 0.5, y: 0.5 },
      isHandPresent: false,
      handCount: 0,
      isHeart: false,
      isThumbsUp: false,
      isFist: false,
      isOpenPalm: false
    };
  }

  processLandmarks(landmarks) {
    if (!landmarks || landmarks.length === 0) {
      this.currentGesture.isHandPresent = false;
      this.currentGesture.handCount = 0;
      this.currentGesture.mode = 0;
      this.currentGesture.isHeart = false;
      this.currentGesture.isThumbsUp = false;
      this.currentGesture.isFist = false;
      this.currentGesture.isOpenPalm = false;
      return this.currentGesture;
    }

    const handCount = landmarks.length;
    this.currentGesture.isHandPresent = true;
    this.currentGesture.handCount = handCount;

    const hand1 = landmarks[0];
    const hand2 = handCount > 1 ? landmarks[1] : null;

    const wrist1 = hand1[0];
    const indexMcp1 = hand1[5];
    this.currentGesture.handPos = {
      x: 1.0 - (wrist1.x + indexMcp1.x) / 2,
      y: (wrist1.y + indexMcp1.y) / 2
    };

    if (hand2) {
      const wrist2 = hand2[0];
      const indexMcp2 = hand2[5];
      this.currentGesture.handPos2 = {
        x: 1.0 - (wrist2.x + indexMcp2.x) / 2,
        y: (wrist2.y + indexMcp2.y) / 2
      };
    }

    // 1. Check for 2-Hand Heart 💖
    let isHeartDetected = false;
    if (hand2) {
      const indexTip1 = hand1[8]; const indexTip2 = hand2[8];
      const thumbTip1 = hand1[4]; const thumbTip2 = hand2[4];

      const distIndexTips = this.euclideanDistance(indexTip1, indexTip2);
      const distThumbTips = this.euclideanDistance(thumbTip1, thumbTip2);

      if (distIndexTips < 0.28 && distThumbTips < 0.28) {
        isHeartDetected = true;
      }
    }

    // Single Hand Finger Heart (🫰)
    if (!isHeartDetected) {
      for (const h of landmarks) {
        const thumbTip = h[4];
        const indexTip = h[8];
        const distThumbIndex = this.euclideanDistance(thumbTip, indexTip);
        
        const isMiddleClosed = !this.isFingerExtended(h, 12, 10, 9);
        const isRingClosed = !this.isFingerExtended(h, 16, 14, 13);
        const isPinkyClosed = !this.isFingerExtended(h, 20, 18, 17);

        if (distThumbIndex < 0.08 && isMiddleClosed && isRingClosed && isPinkyClosed) {
          isHeartDetected = true;
          break;
        }
      }
    }

    // 2. Check for Thumbs Up (👍)
    let isThumbsUpDetected = false;
    for (const h of landmarks) {
      const thumbTip = h[4];
      const thumbMcp = h[2];
      const wrist = h[0];

      const isThumbUp = thumbTip.y < thumbMcp.y && thumbMcp.y < wrist.y;
      const isIndexClosed = !this.isFingerExtended(h, 8, 6, 5);
      const isMiddleClosed = !this.isFingerExtended(h, 12, 10, 9);
      const isRingClosed = !this.isFingerExtended(h, 16, 14, 13);
      const isPinkyClosed = !this.isFingerExtended(h, 20, 18, 17);

      if (isThumbUp && isIndexClosed && isMiddleClosed && isRingClosed && isPinkyClosed) {
        isThumbsUpDetected = true;
        break;
      }
    }

    this.currentGesture.isThumbsUp = isThumbsUpDetected;

    // 3. Check for Fist (✊ Nắm tay) & Open Palm (🖐 Mở xòe tay)
    let isFistDetected = false;
    let isOpenPalmDetected = false;

    const isIndexExt = this.isFingerExtended(hand1, 8, 6, 5);
    const isMiddleExt = this.isFingerExtended(hand1, 12, 10, 9);
    const isRingExt = this.isFingerExtended(hand1, 16, 14, 13);
    const isPinkyExt = this.isFingerExtended(hand1, 20, 18, 17);
    const isThumbExt = this.isThumbExtended(hand1);

    let extendedCount = 0;
    if (isThumbExt) extendedCount++;
    if (isIndexExt) extendedCount++;
    if (isMiddleExt) extendedCount++;
    if (isRingExt) extendedCount++;
    if (isPinkyExt) extendedCount++;

    if (extendedCount === 0) {
      isFistDetected = true;
    } else if (extendedCount >= 5) {
      isOpenPalmDetected = true;
    }

    this.currentGesture.isFist = isFistDetected;
    this.currentGesture.isOpenPalm = isOpenPalmDetected;

    let detectedMode = 0;

    if (isHeartDetected) {
      detectedMode = 8;
      this.currentGesture.isHeart = true;
    } else if (isFistDetected) {
      detectedMode = 0; // Mode 0: Return to Classic Tree
    } else if (isOpenPalmDetected) {
      detectedMode = 5; // Mode 5: Explode Particle Swirl
    } else {
      this.currentGesture.isHeart = false;

      if (extendedCount === 1 || (isIndexExt && !isMiddleExt && !isRingExt && !isPinkyExt)) {
        detectedMode = 1;
      } else if (extendedCount === 2 || (isIndexExt && isMiddleExt && !isRingExt && !isPinkyExt)) {
        detectedMode = 2;
      } else if (extendedCount === 3 || (isIndexExt && isMiddleExt && isRingExt && !isPinkyExt)) {
        detectedMode = 3;
      } else {
        detectedMode = 0;
      }
    }

    this.history.push(detectedMode);
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }

    const modeCounts = {};
    let maxCount = 0;
    let smoothedMode = 0;

    for (const m of this.history) {
      modeCounts[m] = (modeCounts[m] || 0) + 1;
      if (modeCounts[m] > maxCount) {
        maxCount = modeCounts[m];
        smoothedMode = m;
      }
    }

    this.currentGesture.mode = smoothedMode;
    return this.currentGesture;
  }

  isFingerExtended(hand, tipIdx, pipIdx, mcpIdx) {
    const wrist = hand[0];
    const tip = hand[tipIdx];
    const pip = hand[pipIdx];

    const distTip = this.euclideanDistance(tip, wrist);
    const distPip = this.euclideanDistance(pip, wrist);

    return distTip > distPip * 1.15;
  }

  isThumbExtended(hand) {
    const thumbTip = hand[4];
    const pinkyMcp = hand[17];
    const thumbMcp = hand[2];

    const distTipPinky = this.euclideanDistance(thumbTip, pinkyMcp);
    const distMcpPinky = this.euclideanDistance(thumbMcp, pinkyMcp);

    return distTipPinky > distMcpPinky * 1.2;
  }

  euclideanDistance(p1, p2) {
    const dx = p1.x - p2.x;
    const dy = p1.y - p2.y;
    const dz = (p1.z || 0) - (p2.z || 0);
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }
}

window.GestureDetector = GestureDetector;
