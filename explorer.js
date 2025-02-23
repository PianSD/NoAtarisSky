export class Explorer {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.velocity = { x: 0, y: 0 };
    this.onGround = false;
    this.stamina = 100;
    this.maxStamina = 100;
    this.staminaRegenRate = 0.5;
    this.running = false;
    this.jetpackFuel = 100;
    this.maxJetpackFuel = 100;
    this.jetpackRegenRate = 0.2;
    this.usingJetpack = false;
  }

  update(terrain) {
    // Apply gravity
    if (!this.onGround) {
      this.velocity.y += 0.5;
    }

    // Update jetpack
    if(this.usingJetpack && this.jetpackFuel > 0) {
      this.velocity.y = -3;
      this.jetpackFuel = Math.max(0, this.jetpackFuel - 1);
    } else if(!this.usingJetpack && this.jetpackFuel < this.maxJetpackFuel) {
      this.jetpackFuel += this.jetpackRegenRate;
    }

    // Update position
    this.x += this.velocity.x;
    this.y += this.velocity.y;

    // Keep in bounds
    this.x = Math.max(0, Math.min(terrain.length - 1, this.x));

    // Check ground collision
    const groundY = terrain[Math.floor(this.x)];
    if (this.y > groundY) {
      this.y = groundY;
      this.velocity.y = 0;
      this.onGround = true;
    } else {
      this.onGround = false;
    }

    // Regenerate stamina
    if (!this.running && this.stamina < this.maxStamina) {
      this.stamina += this.staminaRegenRate;
    }
  }

  handleInput(keys) {
    // Movement
    if (keys.ArrowLeft) {
      this.velocity.x = this.running ? -3 : -2;
    } else if (keys.ArrowRight) {
      this.velocity.x = this.running ? 3 : 2;
    } else {
      this.velocity.x *= 0.8;
    }

    // Jumping
    if (keys.Space && this.onGround) {
      this.velocity.y = -10;
      this.onGround = false;
    }

    // Jetpack
    this.usingJetpack = keys.Space && !this.onGround && this.jetpackFuel > 0;

    // Running
    this.running = keys.ShiftLeft && this.stamina > 0;
    if (this.running) {
      this.stamina = Math.max(0, this.stamina - 1);
    }
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);

    // Draw explorer with jetpack
    ctx.strokeStyle = '#0ff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-5, -10);
    ctx.lineTo(5, -10);
    ctx.lineTo(5, 0);
    ctx.lineTo(-5, 0);
    ctx.closePath();
    ctx.stroke();

    // Draw jetpack flames when active
    if(this.usingJetpack) {
      ctx.strokeStyle = '#f90';
      ctx.beginPath();
      ctx.moveTo(-3, 0);
      ctx.lineTo(-3, 5 + Math.random() * 5);
      ctx.moveTo(3, 0);
      ctx.lineTo(3, 5 + Math.random() * 5);
      ctx.stroke();
    }

    ctx.restore();
  }
}