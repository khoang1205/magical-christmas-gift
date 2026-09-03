/* ==========================================================================
   Ultra-Luxury 3D Canvas Photo & Particle Render Engine
   Renders photos directly inside the 3D Canvas with glowing particle borders,
   diamond sparkles, floating 3D physics, and zero HTML box clutter!
   ========================================================================== */

class Particle {
  constructor(x, y, z, color, size, type = 'foliage') {
    this.x = x;
    this.y = y;
    this.z = z;

    this.treeX = x; this.treeY = y; this.treeZ = z;
    this.neonX = x; this.neonY = y; this.neonZ = z;
    this.iceX = x;  this.iceY = y;  this.iceZ = z;
    this.solarX = x;this.solarY = y;this.solarZ = z;
    this.heartX = x;this.heartY = y;this.heartZ = z;

    this.vx = (Math.random() - 0.5) * 0.5;
    this.vy = (Math.random() - 0.5) * 0.5;
    this.vz = (Math.random() - 0.5) * 0.5;

    this.baseColor = color;
    this.color = color;
    this.size = size;
    this.baseSize = size;
    this.type = type;

    this.alpha = Math.random() * 0.5 + 0.5;
    this.phase = Math.random() * Math.PI * 2;
    this.hueShift = Math.random() * 360;

    this.life = 1.0;
    this.decay = Math.random() * 0.03 + 0.02;
  }
}

class ParticleSystem {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.particles = [];
    this.snowflakes = [];
    this.fireworks = [];
    this.mode = 0;
    this.rotationY = 0;
    this.time = 0;
    this.handPos = { x: 0.5, y: 0.5 };
    this.pulseScale = 1.0;
    this.activePromptText = null;
    this.frameCount = 0;

    // Active Canvas Photo Rendering State
    this.activePhotoImg = null;
    this.activePhotoCaption = null;
    this.photoAlpha = 0;
    this.photoScale = 0;

    this.initSystem();
  }

  setPromptText(text) {
    this.activePromptText = text;
  }

  setActivePhoto(imgElement, captionText) {
    this.activePhotoImg = imgElement;
    this.activePhotoCaption = captionText;
  }

  clearActivePhoto() {
    this.activePhotoImg = null;
    this.activePhotoCaption = null;
  }

  initSystem() {
    this.particles = [];
    this.snowflakes = [];
    
    const width = this.canvas.width;
    const height = this.canvas.height;
    const treeHeight = Math.min(width, height) * 0.65;
    const baseRadius = treeHeight * 0.40;
    const centerY = height * 0.52;

    const totalCount = 2500;

    for (let i = 0; i < totalCount; i++) {
      const progress = i / totalCount;
      const y = (progress - 0.5) * treeHeight;

      // MODE 0: CLASSIC TREE
      const tierCount = 5;
      const tierProgress = (progress * tierCount) % 1;
      const tierFactor = 0.55 + 0.45 * Math.sin(tierProgress * Math.PI);
      const maxR = progress * baseRadius * tierFactor;
      const radius = maxR * Math.sqrt(Math.random()) * (0.8 + Math.random() * 0.3);

      const goldenAngle = Math.PI * (3 - Math.sqrt(5));
      const theta = i * goldenAngle;

      const tx = radius * Math.cos(theta);
      const ty = centerY + y;
      const tz = radius * Math.sin(theta);

      let color;
      if (Math.random() < 0.7) {
        color = `hsla(${135 + Math.random() * 35}, 90%, ${40 + Math.random() * 30}%, `;
      } else {
        color = `hsla(${42 + Math.random() * 18}, 95%, 62%, `;
      }

      const p = new Particle(tx, ty, tz, color, Math.random() * 2.8 + 1.5, i < 150 ? 'star' : 'foliage');
      p.treeX = tx; p.treeY = ty; p.treeZ = tz;

      // MODE 1: CYBERPUNK HELICAL VORTEX
      const helixTurn = progress * Math.PI * 2 * 8;
      const helixRadius = (0.2 + progress * 0.8) * baseRadius * 1.25;
      p.neonX = helixRadius * Math.cos(helixTurn + (i % 2 === 0 ? 0 : Math.PI));
      p.neonY = centerY + (progress - 0.5) * treeHeight * 1.15;
      p.neonZ = helixRadius * Math.sin(helixTurn + (i % 2 === 0 ? 0 : Math.PI));

      // MODE 2: FROSTED ICE CRYSTAL CYLINDER
      const iceRadius = baseRadius * 0.85;
      const iceAngle = Math.random() * Math.PI * 2;
      p.iceX = iceRadius * Math.cos(iceAngle);
      p.iceY = centerY + (Math.random() - 0.5) * treeHeight * 1.1;
      p.iceZ = iceRadius * Math.sin(iceAngle);

      // MODE 3: GOLDEN SOLAR STARBURST SPHERE
      const sphereR = baseRadius * 0.95;
      const phi = Math.acos(2 * Math.random() - 1);
      const lam = 2 * Math.PI * Math.random();
      p.solarX = sphereR * Math.sin(phi) * Math.cos(lam);
      p.solarY = centerY + sphereR * Math.cos(phi) * 0.8;
      p.solarZ = sphereR * Math.sin(phi) * Math.sin(lam);

      // MODE 8: 3D PARAMETRIC HEART
      const tHeart = progress * Math.PI * 2;
      const heartScale = Math.min(width, height) * 0.016;
      const hx = 16 * Math.pow(Math.sin(tHeart), 3) * heartScale;
      const hy = -(13 * Math.cos(tHeart) - 5 * Math.cos(2*tHeart) - 2 * Math.cos(3*tHeart) - Math.cos(4*tHeart)) * heartScale;
      const hz = (Math.random() - 0.5) * 100;

      p.heartX = hx + (Math.random() - 0.5) * 20;
      p.heartY = centerY + hy + (Math.random() - 0.5) * 20;
      p.heartZ = hz;

      this.particles.push(p);
    }

    for (let i = 0; i < 350; i++) {
      const x = (Math.random() - 0.5) * width * 1.5;
      const y = (Math.random() - 0.5) * height * 1.5;
      const z = (Math.random() - 0.5) * 400;
      const p = new Particle(x, y, z, `hsla(200, 100%, 95%, `, Math.random() * 2.5 + 1.0, 'snow');
      p.vy = Math.random() * 1.6 + 0.7;
      p.vx = (Math.random() - 0.5) * 0.5;
      this.snowflakes.push(p);
    }
  }

  triggerFirework(x, y) {
    const burstCount = 45;
    const isHeart = this.mode === 8;
    const hue = isHeart ? (Math.random() < 0.5 ? 340 : 355) : Math.random() * 360;

    for (let i = 0; i < burstCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 7 + 2;
      const p = new Particle(x, y, 0, `hsla(${hue}, 100%, 75%, `, Math.random() * 3.0 + 1.8, 'firework');
      p.vx = Math.cos(angle) * speed;
      p.vy = Math.sin(angle) * speed;
      p.decay = Math.random() * 0.035 + 0.02;
      this.fireworks.push(p);
    }
  }

  setMode(mode, handPos = { x: 0.5, y: 0.5 }) {
    this.mode = mode;
    if (handPos) this.handPos = handPos;

    if (mode === 2 || mode === 5 || mode === 8) {
      for (let i = 0; i < 3; i++) {
        setTimeout(() => {
          const fx = (Math.random() * 0.6 + 0.2) * this.canvas.width;
          const fy = (Math.random() * 0.5 + 0.2) * this.canvas.height;
          this.triggerFirework(fx, fy);
        }, i * 200);
      }
    }
  }

  update() {
    this.time += 0.02;
    this.frameCount++;

    const rotSpeed = (this.mode === 1 || this.mode === 8) ? 0.022 : 0.008;
    this.rotationY += rotSpeed;

    const width = this.canvas.width;
    const height = this.canvas.height;
    const centerX = width * 0.5;

    if (this.mode === 3 || this.mode === 8) {
      this.pulseScale = 1.0 + Math.sin(this.time * 4) * 0.15;
    } else {
      this.pulseScale = 1.0;
    }

    const cosR = Math.cos(this.rotationY);
    const sinR = Math.sin(this.rotationY);

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];

      let targetX, targetY, targetZ;

      if (this.mode === 1) {
        targetX = p.neonX; targetY = p.neonY; targetZ = p.neonZ;
      } else if (this.mode === 2) {
        targetX = p.iceX; targetY = p.iceY; targetZ = p.iceZ;
      } else if (this.mode === 3) {
        targetX = p.solarX * this.pulseScale;
        targetY = p.solarY;
        targetZ = p.solarZ * this.pulseScale;
      } else if (this.mode === 5) {
        const targetHandX = this.handPos.x * width;
        const targetHandY = this.handPos.y * height;
        const angle = this.time * 2.0 + (i * 0.003);
        const radius = (i % 250) * 1.1 + 20;

        p.x += (targetHandX + Math.cos(angle) * radius - p.x) * 0.1;
        p.y += (targetHandY + Math.sin(angle * 0.8) * radius * 0.5 - p.y) * 0.1;
        p.z += (Math.sin(angle) * radius - p.z) * 0.1;
        p.alpha = 0.5 + Math.sin(this.time * 4 + p.phase) * 0.45;
        continue;
      } else if (this.mode === 8) {
        targetX = p.heartX * this.pulseScale;
        targetY = p.heartY;
        targetZ = p.heartZ * this.pulseScale;
      } else {
        targetX = p.treeX; targetY = p.treeY; targetZ = p.treeZ;
      }

      const rx = targetX * cosR - targetZ * sinR;
      const rz = targetX * sinR + targetZ * cosR;

      p.x += (centerX + rx - p.x) * 0.12;
      p.y += (targetY - p.y) * 0.12;
      p.z += (rz - p.z) * 0.12;

      p.alpha = 0.5 + Math.sin(this.time * 4 + p.phase) * 0.45;
    }

    for (let i = 0; i < this.snowflakes.length; i++) {
      const s = this.snowflakes[i];
      s.y += s.vy * (this.mode === 2 ? 3.0 : 1.0);
      s.x += Math.sin(this.time + s.phase) * 0.8;

      if (s.y > height + 20) {
        s.y = -20;
        s.x = (Math.random() - 0.5) * width * 1.5;
      }
    }

    for (let i = this.fireworks.length - 1; i >= 0; i--) {
      const f = this.fireworks[i];
      f.x += f.vx;
      f.y += f.vy;
      f.vy += 0.12;
      f.life -= f.decay;
      if (f.life <= 0) {
        this.fireworks.splice(i, 1);
      }
    }

    // Photo Smooth Scale/Alpha Lerp
    if (this.activePhotoImg) {
      this.photoAlpha += (1.0 - this.photoAlpha) * 0.1;
      this.photoScale += (1.0 - this.photoScale) * 0.1;
    } else {
      this.photoAlpha += (0.0 - this.photoAlpha) * 0.15;
      this.photoScale += (0.0 - this.photoScale) * 0.15;
    }
  }

  render() {
    const width = this.canvas.width;
    const height = this.canvas.height;

    const bgGrad = this.ctx.createRadialGradient(
      width * 0.5, height * 0.4, 50,
      width * 0.5, height * 0.5, Math.max(width, height)
    );

    if (this.mode === 8) {
      bgGrad.addColorStop(0, '#2b081b'); bgGrad.addColorStop(0.6, '#150411'); bgGrad.addColorStop(1, '#080106');
    } else if (this.mode === 1) {
      bgGrad.addColorStop(0, '#1a0428'); bgGrad.addColorStop(0.6, '#0b0216'); bgGrad.addColorStop(1, '#03010c');
    } else if (this.mode === 2) {
      bgGrad.addColorStop(0, '#041d2c'); bgGrad.addColorStop(0.6, '#020e18'); bgGrad.addColorStop(1, '#01050a');
    } else if (this.mode === 3) {
      bgGrad.addColorStop(0, '#281a04'); bgGrad.addColorStop(0.6, '#140c02'); bgGrad.addColorStop(1, '#080401');
    } else {
      bgGrad.addColorStop(0, '#0a1931'); bgGrad.addColorStop(0.6, '#040d1a'); bgGrad.addColorStop(1, '#02050b');
    }

    this.ctx.fillStyle = bgGrad;
    this.ctx.fillRect(0, 0, width, height);

    this.ctx.globalCompositeOperation = 'lighter';

    // 1. Snowflakes
    for (let i = 0; i < this.snowflakes.length; i++) {
      const s = this.snowflakes[i];
      const color = this.mode === 8 ? `hsla(340, 100%, 85%, ` : (this.mode === 2 ? `hsla(190, 100%, 90%, ` : s.color);
      this.ctx.fillStyle = color + '0.75)';
      this.ctx.beginPath();
      this.ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      this.ctx.fill();
    }

    if (this.frameCount % 2 === 0) {
      this.particles.sort((a, b) => a.z - b.z);
    }

    // 2. 3D Particles
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];

      const perspective = 600;
      const scale = perspective / (perspective + p.z + 200);

      const drawX = p.x;
      const drawY = p.y;
      const drawSize = Math.max(0.5, p.size * scale);

      let renderColor = p.color;

      if (this.mode === 1) {
        const hue = (this.time * 60 + p.hueShift) % 360;
        renderColor = `hsla(${hue}, 100%, 65%, `;
      } else if (this.mode === 2) {
        const hue = 185 + (p.hueShift % 30);
        renderColor = `hsla(${hue}, 100%, 80%, `;
      } else if (this.mode === 3) {
        const hue = 40 + (p.hueShift % 20);
        renderColor = `hsla(${hue}, 100%, 75%, `;
      } else if (this.mode === 8) {
        const hue = (p.hueShift % 50) + 335;
        renderColor = `hsla(${hue}, 100%, 70%, `;
      }

      this.ctx.fillStyle = renderColor + (p.alpha * scale).toFixed(2) + ')';
      this.ctx.beginPath();
      this.ctx.arc(drawX, drawY, drawSize, 0, Math.PI * 2);
      this.ctx.fill();
    }

    // 3. Fireworks
    for (let i = 0; i < this.fireworks.length; i++) {
      const f = this.fireworks[i];
      this.ctx.fillStyle = f.color + f.life.toFixed(2) + ')';
      this.ctx.beginPath();
      this.ctx.arc(f.x, f.y, f.size * f.life, 0, Math.PI * 2);
      this.ctx.fill();
    }

    // 4. DIRECT 3D CANVAS PHOTO & PARTICLE GOLD AURA RENDERER (100% CINEMATIC!)
    if (this.photoAlpha > 0.05 && this.activePhotoImg && this.activePhotoImg.complete) {
      this.ctx.save();

      const imgW = 280 * this.photoScale;
      const imgH = 340 * this.photoScale;
      const px = width * 0.5;
      const py = height * 0.48 + Math.sin(this.time * 2) * 8; // Floating 3D Bobbing

      this.ctx.translate(px, py);
      this.ctx.rotate(Math.sin(this.time * 1.5) * 0.03); // Floating 3D Tilt

      // Glowing Diamond & Gold Particle Aura behind Photo
      const auraGrad = this.ctx.createRadialGradient(0, 0, 50, 0, 0, imgW * 0.9);
      auraGrad.addColorStop(0, 'rgba(255, 215, 0, 0.45)');
      auraGrad.addColorStop(0.5, 'rgba(255, 117, 140, 0.3)');
      auraGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      this.ctx.fillStyle = auraGrad;
      this.ctx.fillRect(-imgW, -imgH, imgW * 2, imgH * 2);

      // Gold Frame Border
      this.ctx.strokeStyle = '#ffd700';
      this.ctx.lineWidth = 4;
      this.ctx.strokeRect(-imgW / 2 - 6, -imgH / 2 - 6, imgW + 12, imgH + 12);

      // Photo Image Draw
      this.ctx.globalCompositeOperation = 'source-over';
      this.ctx.globalAlpha = this.photoAlpha;
      this.ctx.drawImage(this.activePhotoImg, -imgW / 2, -imgH / 2 + 10, imgW, imgH - 50);

      // Typewriter / Glowing Gold Caption
      if (this.activePhotoCaption) {
        this.ctx.font = 'bold italic 24px "Great Vibes", cursive';
        this.ctx.fillStyle = '#ffd700';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(this.activePhotoCaption, 0, imgH / 2 - 12);
      }

      this.ctx.restore();
    }

    // 5. Canvas Particle Glowing Title
    if (this.activePromptText) {
      this.ctx.font = 'bold 30px "Cinzel", serif';
      this.ctx.textAlign = 'center';
      
      this.ctx.fillStyle = 'rgba(255, 215, 0, 0.3)';
      this.ctx.fillText(this.activePromptText, width * 0.5 + 2, height * 0.18 + 2);

      this.ctx.fillStyle = '#ffd700';
      this.ctx.fillText(this.activePromptText, width * 0.5, height * 0.18);
    }

    this.ctx.globalCompositeOperation = 'source-over';
  }
}

window.ParticleSystem = ParticleSystem;
