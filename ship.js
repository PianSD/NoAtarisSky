export class Ship {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.rotation = 0;
    this.velocity = { x: 0, y: 0 };
    this.thrust = 0;
    this.scanning = false;
    this.scanRadius = 0;
    this.pulseEngine = false;
    this.landingMode = false;
    this.landed = false;
    this.targetPlanet = null;
    this.pulseEnergy = 100;
    this.maxPulseEnergy = 100;
    this.pulseRegenRate = 0.2;
    
    document.addEventListener('keydown', (e) => this.handleInput(e, true));
    document.addEventListener('keyup', (e) => this.handleInput(e, false));
  }

  handleInput(e, isDown) {
    if(this.landed && e.code !== 'Space') return;
    
    switch(e.code) {
      case 'ArrowLeft':
        this.rotation -= isDown ? 0.05 : -0.05;
        break;
      case 'ArrowRight': 
        this.rotation += isDown ? 0.05 : -0.05;
        break;
      case 'ArrowUp':
        this.thrust = isDown ? 0.1 : 0; 
        break;
      case 'KeyE':
        if(isDown) this.startScan();
        break;
      case 'KeyP':
        if(isDown && this.pulseEnergy > 0) this.pulseEngine = !this.pulseEngine;
        break;
      case 'KeyL':
        if(isDown && this.targetPlanet) this.landingMode = !this.landingMode;
        break;
      case 'Space':
        if(isDown && this.landed) {
          this.launch();
        }
        break;
    }
  }

  launch() {
    this.landed = false;
    this.y -= 50;
    this.velocity = { x: 0, y: -2 };
  }

  startScan() {
    if(!this.scanning) {
      this.scanning = true;
      this.scanRadius = 0;
    }
  }

  update(planets) {
    if(this.landed) return;

    // Update pulse energy
    if(this.pulseEngine) {
      this.pulseEnergy = Math.max(0, this.pulseEnergy - 1);
      if(this.pulseEnergy === 0) {
        this.pulseEngine = false;
      }
    } else if(this.pulseEnergy < this.maxPulseEnergy) {
      this.pulseEnergy += this.pulseRegenRate;
    }

    // Check if near planet for landing
    this.targetPlanet = null;
    for(let planet of planets) {
      const dx = (this.x - (planet.x + planet.screenX));
      const dy = (this.y - (planet.y + planet.screenY));
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if(distance < planet.size * 2) {
        this.targetPlanet = planet;
        if(this.landingMode && distance < planet.size * 1.2) {
          this.land(planet);
          return;
        }
        break;
      }
    }

    // Update position based on velocity
    this.x += this.velocity.x * (this.pulseEngine ? 3 : 1);
    this.y += this.velocity.y * (this.pulseEngine ? 3 : 1);

    // Apply thrust in direction of rotation
    if(this.thrust) {
      this.velocity.x += Math.cos(this.rotation) * this.thrust;
      this.velocity.y += Math.sin(this.rotation) * this.thrust;
    }

    // Apply drag
    this.velocity.x *= 0.99;
    this.velocity.y *= 0.99;

    // Update scan effect
    if(this.scanning) {
      this.scanRadius += 5;
      if(this.scanRadius > 200) {
        this.scanning = false;
      }
    }
  }

  land(planet) {
    this.landed = true;
    this.landingMode = false;
    this.x = planet.x + planet.screenX;
    this.y = planet.y + planet.screenY - planet.size/2;
    this.velocity = { x: 0, y: 0 };
    this.rotation = -Math.PI/2;
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);

    // Draw ship
    ctx.strokeStyle = this.landingMode ? '#ff0' : '#0ff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(20, 0);
    ctx.lineTo(-10, -10);
    ctx.lineTo(-5, 0);
    ctx.lineTo(-10, 10);
    ctx.closePath();
    ctx.stroke();

    // Draw engine effects
    if(this.thrust || this.pulseEngine) {
      let engineLength = 20;
      let engineColor = '#0ff';
      
      if(this.pulseEngine) {
        engineLength = 40;
        engineColor = '#f0f';
      }
      
      ctx.strokeStyle = `rgba(${engineColor}, ${0.5 + Math.random() * 0.5})`;
      ctx.beginPath();
      ctx.moveTo(-5, 0);
      ctx.lineTo(-engineLength - Math.random() * 10, 0);
      ctx.stroke();
    }

    // Draw scan effect
    if(this.scanning) {
      ctx.strokeStyle = `rgba(0, 255, 255, ${1 - this.scanRadius/200})`;
      ctx.beginPath();
      ctx.arc(0, 0, this.scanRadius, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  }
}