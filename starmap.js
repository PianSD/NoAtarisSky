export class StarMap {
  constructor(game) {
    this.game = game;
    this.systems = [game.currentSystem];
    this.selectedSystem = null;
    this.visitedSystems = [game.currentSystem.name];
    
    // Generate systems with larger spacing
    const numSpirals = 6;
    const systemsPerSpiral = Math.floor(300 / numSpirals);
    
    for(let spiral = 0; spiral < numSpirals; spiral++) {
      const spiralOffset = (spiral / numSpirals) * Math.PI * 2;
      
      for(let i = 0; i < systemsPerSpiral; i++) {
        const angle = (i / systemsPerSpiral) * Math.PI * 4 + spiralOffset;
        const radius = 2000 + i * 100 + Math.random() * 500;
        
        const newSystem = {
          x: Math.cos(angle) * radius,
          y: Math.sin(angle) * radius,
          name: game.generateSystemName(),
          color: `hsl(${Math.random() * 360}, 70%, 60%)`,
          visited: false
        };

        // Ensure minimum distance between systems
        let tooClose = this.systems.some(existingSystem => {
          const dx = newSystem.x - existingSystem.x;
          const dy = newSystem.y - existingSystem.y;
          return Math.sqrt(dx * dx + dy * dy) < 800; // Increased minimum distance
        });

        if(!tooClose) {
          this.systems.push(newSystem);
        }
      }
    }

    this.mapOffset = { x: 0, y: 0 };
    this.zoom = 0.25;
    this.isDragging = false;
    this.dragStart = { x: 0, y: 0 };
    
    // Enhanced mouse handling with improved coordinate transformation
    game.canvas.addEventListener('mousedown', (e) => {
      if(!game.showMap) return;
      
      const rect = game.canvas.getBoundingClientRect();
      const mouseX = (e.clientX - rect.left) * (game.canvas.width / rect.width);
      const mouseY = (e.clientY - rect.top) * (game.canvas.height / rect.height);
      
      if(e.button === 2) { // Right click for panning
        this.isDragging = true;
        this.dragStart = {
          x: mouseX - this.mapOffset.x,
          y: mouseY - this.mapOffset.y
        };
        game.canvas.style.cursor = 'grabbing';
        e.preventDefault();
        return;
      }
      
      if(e.button === 0) { // Left click for system selection
        const system = this.getSystemUnderMouse(mouseX, mouseY);
        if(system) {
          this.selectedSystem = system;
          game.canvas.style.cursor = 'pointer';
        } else {
          this.selectedSystem = null;
          game.canvas.style.cursor = 'default';
        }
      }
    });

    game.canvas.addEventListener('mousemove', (e) => {
      if(!game.showMap) return;
      
      const rect = game.canvas.getBoundingClientRect();
      const mouseX = (e.clientX - rect.left) * (game.canvas.width / rect.width);
      const mouseY = (e.clientY - rect.top) * (game.canvas.height / rect.height);
      
      if(this.isDragging) {
        this.mapOffset.x = mouseX - this.dragStart.x;
        this.mapOffset.y = mouseY - this.dragStart.y;
        game.canvas.style.cursor = 'grabbing';
        return;
      }
      
      // Update cursor based on system proximity
      const system = this.getSystemUnderMouse(mouseX, mouseY);
      game.canvas.style.cursor = system ? 'pointer' : 'default';
    });

    game.canvas.addEventListener('mouseup', () => {
      if(this.isDragging) {
        game.canvas.style.cursor = 'default';
        this.isDragging = false;
      }
    });

    game.canvas.addEventListener('mouseleave', () => {
      this.isDragging = false;
      game.canvas.style.cursor = 'default';
    });

    game.canvas.addEventListener('wheel', (e) => {
      if(!game.showMap) return;
      e.preventDefault();
      
      const rect = game.canvas.getBoundingClientRect();
      const mouseX = (e.clientX - rect.left) * (game.canvas.width / rect.width);
      const mouseY = (e.clientY - rect.top) * (game.canvas.height / rect.height);
      
      const oldZoom = this.zoom;
      this.zoom = Math.max(0.1, Math.min(2, this.zoom - e.deltaY * 0.001));
      
      // Adjust offset to zoom around mouse position
      this.mapOffset.x = mouseX - (mouseX - this.mapOffset.x) * (this.zoom / oldZoom);
      this.mapOffset.y = mouseY - (mouseY - this.mapOffset.y) * (this.zoom / oldZoom);
    });

    game.canvas.addEventListener('contextmenu', (e) => {
      e.preventDefault();
    });
  }

  getSystemUnderMouse(mouseX, mouseY) {
    // Transform screen coordinates to map coordinates
    const mapX = (mouseX - this.game.canvas.width/2 - this.mapOffset.x) / this.zoom;
    const mapY = (mouseY - this.game.canvas.height/2 - this.mapOffset.y) / this.zoom;
    
    // Dynamic hit radius based on zoom level
    const baseHitRadius = 40;
    const hitRadius = baseHitRadius / this.zoom;
    
    // Find closest system within hit radius
    let nearestSystem = null;
    let nearestDist = hitRadius;
    
    for(const system of this.systems) {
      const dx = mapX - system.x;
      const dy = mapY - system.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if(dist < nearestDist) {
        nearestDist = dist;
        nearestSystem = system;
      }
    }
    
    return nearestSystem;
  }

  draw(ctx) {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    ctx.save();
    ctx.translate(this.mapOffset.x, this.mapOffset.y);
    ctx.scale(this.zoom, this.zoom);
    
    // Enhanced system rendering with better hit detection visualization
    this.systems.forEach(system => {
      const x = ctx.canvas.width/2 + system.x;
      const y = ctx.canvas.height/2 + system.y;
      
      // Draw connection lines with reduced opacity
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 1;
      this.systems.forEach(otherSystem => {
        if(system !== otherSystem) {
          const dist = Math.hypot(
            system.x - otherSystem.x,
            system.y - otherSystem.y
          );
          if(dist < 800) { // Increased connection distance
            ctx.beginPath();
            ctx.moveTo(
              ctx.canvas.width/2 + system.x,
              ctx.canvas.height/2 + system.y
            );
            ctx.lineTo(
              ctx.canvas.width/2 + otherSystem.x,
              ctx.canvas.height/2 + otherSystem.y
            );
            ctx.stroke();
          }
        }
      });

      // Draw system glow
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, 40);
      gradient.addColorStop(0, system.color);
      gradient.addColorStop(1, 'transparent');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, 40, 0, Math.PI * 2);
      ctx.fill();
      
      // Draw system core
      ctx.fillStyle = system.color;
      const pulseSize = 8 + Math.sin(Date.now() * 0.003) * 2;
      ctx.beginPath();
      ctx.arc(x, y, pulseSize, 0, Math.PI * 2);
      ctx.fill();

      // Current system indicator
      if(system === this.game.currentSystem) {
        ctx.strokeStyle = '#0ff';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(x, y, 20, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Selected system indicator
      if(system === this.selectedSystem) {
        // Outer glow
        const selectedGradient = ctx.createRadialGradient(x, y, 15, x, y, 45);
        selectedGradient.addColorStop(0, 'rgba(255, 255, 0, 0.5)');
        selectedGradient.addColorStop(1, 'transparent');
        ctx.fillStyle = selectedGradient;
        ctx.beginPath();
        ctx.arc(x, y, 45, 0, Math.PI * 2);
        ctx.fill();

        // Selection ring
        ctx.strokeStyle = '#ff0';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(x, y, 25, 0, Math.PI * 2);
        ctx.stroke();
        
        // Distance info
        if(system !== this.game.currentSystem) {
          const distance = Math.hypot(
            system.x - this.game.currentSystem.x,
            system.y - this.game.currentSystem.y
          );
          ctx.fillStyle = '#ff0';
          ctx.font = '20px "Product Sans Bold"';
          ctx.strokeStyle = '#000';
          ctx.lineWidth = 4;
          const text = `Distance: ${Math.floor(distance)} ly`;
          ctx.strokeText(text, x + 35, y + 35);
          ctx.fillText(text, x + 35, y + 35);
        }
      }

      // System name with enhanced visibility
      ctx.font = '16px "Product Sans Bold"';
      const color = this.visitedSystems.includes(system.name) ? '#0ff' : '#fff';
      ctx.fillStyle = color;
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 4;
      ctx.strokeText(system.name, x + 30, y + 5);
      ctx.fillText(system.name, x + 30, y + 5);
    });

    ctx.restore();

    // Draw UI text
    ctx.fillStyle = '#0ff';
    ctx.font = '20px "Product Sans Bold"';
    ctx.fillText('GALACTIC MAP - Press M to exit', 20, 40);
    ctx.fillText('Use mouse wheel to zoom', 20, 70);
    ctx.fillText('Right click and drag to pan', 20, 100);
    ctx.fillText('Left click to select system', 20, 130);
    
    if(this.selectedSystem && this.selectedSystem !== this.game.currentSystem) {
      ctx.fillStyle = '#ff0';
      ctx.fillText('Press Z to hyperspace jump to selected system', 20, 160);
    }
  }
}