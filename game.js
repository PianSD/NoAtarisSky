import { Ship } from './ship.js';
import { AudioManager } from './audio.js';
import { StarMap } from './starmap.js';
import { Explorer } from './explorer.js';
import { generatePlanet } from './planet.js';

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.started = false;
    this.ship = new Ship(canvas.width/2, canvas.height/2);
    this.currentSystem = this.generateStarSystem();
    this.audio = new AudioManager();
    this.audio.playExplorationTheme();
    this.starMap = new StarMap(this);
    this.showMap = false;
    this.camera = { x: 0, y: 0 };
    
    this.stars = [];
    for(let i = 0; i < 200; i++) {
      this.stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 2 + 1
      });
    }

    this.explorer = null;
    this.planetView = false;
    this.currentPlanet = null;
    this.keys = {};
    
    // Initialize saves first
    this.saves = this.loadSaves() || [{}, {}, {}];
    this.currentSaveSlot = 0;
    
    // Then load game data
    const savedGame = this.loadGame();
    if (savedGame) {
      this.loadGameState(savedGame);
    }
    
    this.generatePlanets();
    this.numSystems = 300; // Increased number of star systems
    
    // Add UI state
    this.showSaveMenu = false;
    
    // Event listeners...
    document.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;
      if(e.code === 'KeyM' && !this.planetView) {
        this.showMap = !this.showMap;
      }
      if(e.code === 'KeyZ' && this.showMap) {
        this.hyperJumpToSelected();
      }
      if(e.code === 'KeyS' && e.ctrlKey) {
        e.preventDefault();
        this.exportSave();
      }
      if(e.code === 'KeyO' && e.ctrlKey) {
        e.preventDefault();
        this.importSave();
      }
    });
    
    document.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });

    // Add button handlers
    document.getElementById('muteBtn').addEventListener('click', () => {
      this.audio.toggleMute();
      document.getElementById('muteBtn').textContent = 
        this.audio.isMuted() ? '🔊 Unmute' : '🔊 Mute';
    });
  }

  loadGame() {
    try {
      const currentSlot = localStorage.getItem('noMansSkyAtari_currentSlot');
      if (currentSlot !== null) {
        const saved = localStorage.getItem(`noMansSkyAtari_save${currentSlot}`);
        return saved ? JSON.parse(saved) : null;
      }
      return null;
    } catch (e) {
      console.error('Error loading game:', e);
      return null;
    }
  }

  loadSaves() {
    try {
      const saves = [];
      for(let i = 0; i < 3; i++) {
        const save = localStorage.getItem(`noMansSkyAtari_save${i}`);
        saves.push(save ? JSON.parse(save) : null);
      }
      return saves;
    } catch (e) {
      console.error('Error loading saves:', e);
      return [];
    }
  }

  saveGame(slot) {
    try {
      const saveData = {
        ship: {
          x: this.ship.x,
          y: this.ship.y,
          rotation: this.ship.rotation
        },
        currentSystem: this.currentSystem,
        visitedSystems: this.starMap.visitedSystems,
        systems: this.starMap.systems,
        timestamp: Date.now()
      };
      
      this.saves[slot] = saveData;
      localStorage.setItem(`noMansSkyAtari_save${slot}`, JSON.stringify(saveData));
      localStorage.setItem('noMansSkyAtari_currentSlot', slot.toString());
      this.showSaveMenu = false;
    } catch (e) {
      console.error('Error saving game:', e);
    }
  }

  loadGameState(savedGame) {
    try {
      if (savedGame.ship) {
        this.ship.x = savedGame.ship.x;
        this.ship.y = savedGame.ship.y;
        this.ship.rotation = savedGame.ship.rotation;
      }
      if (savedGame.currentSystem) {
        this.currentSystem = savedGame.currentSystem;
      }
      if (savedGame.visitedSystems) {
        this.starMap.visitedSystems = savedGame.visitedSystems;
      }
      if (savedGame.systems) {
        this.starMap.systems = savedGame.systems;
      }
      if (savedGame.planets) {
        this.planets = savedGame.planets;
      }
      this.generatePlanets();
    } catch (e) {
      console.error('Error loading game state:', e);
    }
  }

  loadGameSlot(slot) {
    try {
      const save = this.saves[slot];
      if(!save) return;
      
      this.ship.x = save.ship.x;
      this.ship.y = save.ship.y;
      this.ship.rotation = save.ship.rotation;
      this.currentSystem = save.currentSystem;
      this.starMap.visitedSystems = save.visitedSystems;
      this.starMap.systems = save.systems;
      this.generatePlanets();
      this.showSaveMenu = false;
    } catch (e) {
      console.error('Error loading game slot:', e);
    }
  }

  generateStarSystem() {
    return {
      x: Math.random() * 1000 - 500,
      y: Math.random() * 1000 - 500,
      name: this.generateSystemName(),
      color: `hsl(${Math.random() * 360}, 70%, 60%)`
    };
  }

  generateSystemName() {
    const prefixes = ['Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon', 'Zeta', 'Eta', 'Theta', 'Iota', 'Kappa'];
    const suffixes = ['Prime', 'Major', 'Minor', 'Centauri', 'Proxima', 'Ceti', 'Draconis', 'Eridani', 'Orionis'];
    const numbers = Math.floor(Math.random() * 999);
    
    return `${prefixes[Math.floor(Math.random() * prefixes.length)]} ${
      suffixes[Math.floor(Math.random() * suffixes.length)]} ${numbers}`;
  }

  generatePlanets() {
    this.planets = [];
    const numPlanets = 3 + Math.floor(Math.random() * 5);
    
    for(let i = 0; i < numPlanets; i++) {
      const angle = (i / numPlanets) * Math.PI * 2;
      const distance = 150 + Math.random() * 200;
      const planetData = generatePlanet();
      
      this.planets.push({
        ...planetData,
        x: Math.cos(angle) * distance,
        y: Math.sin(angle) * distance,
        screenX: this.canvas.width/2,
        screenY: this.canvas.height/2,
        size: 20 + Math.random() * 30,
        rotation: 0,
        rotationSpeed: (Math.random() - 0.5) * 0.02
      });
    }
  }

  enterPlanet(planet) {
    this.planetView = true;
    this.currentPlanet = planet;
    this.explorer = new Explorer(100, 0);
    
    // Show planet entry text
    const text = `Entering ${planet.name}`;
    let alpha = 1;
    
    const fadeText = () => {
      if(alpha > 0) {
        this.ctx.fillStyle = `rgba(0, 255, 255, ${alpha})`;
        this.ctx.font = '40px "Product Sans Bold"';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(text, this.canvas.width/2, this.canvas.height/2);
        alpha -= 0.02;
        requestAnimationFrame(fadeText);
      }
    };
    
    fadeText();
    this.audio.playPlanetTheme();
  }

  exitPlanet() {
    this.planetView = false;
    this.currentPlanet = null;
    this.explorer = null;
    this.audio.playExplorationTheme();
  }

  hyperJumpToSelected() {
    if(this.starMap.selectedSystem && this.starMap.selectedSystem !== this.currentSystem) {
      // Play hyperdrive animation
      const startX = this.ship.x;
      const startY = this.ship.y;
      const startRotation = this.ship.rotation;
      
      let animationFrame = 0;
      const animate = () => {
        animationFrame++;
        
        // Clear and draw background
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw streaking stars
        for(let i = 0; i < 100; i++) {
          const x = (Math.random() * this.canvas.width);
          const length = 20 + Math.random() * 30;
          this.ctx.strokeStyle = '#fff';
          this.ctx.beginPath();
          this.ctx.moveTo(x, 0);
          this.ctx.lineTo(x, length);
          this.ctx.stroke();
        }
        
        // Draw ship moving into hyperspace
        this.ctx.save();
        this.ctx.translate(this.canvas.width/2, this.canvas.height/2);
        this.ctx.rotate(startRotation + animationFrame * 0.1);
        this.ctx.scale(1 + animationFrame * 0.05, 1 + animationFrame * 0.05);
        this.ship.draw(this.ctx);
        this.ctx.restore();
        
        if(animationFrame < 60) {
          requestAnimationFrame(animate);
        } else {
          // Complete jump
          this.currentSystem = this.starMap.selectedSystem;
          this.starMap.visitedSystems.push(this.currentSystem.name);
          this.generatePlanets();
          this.showMap = false;
          this.audio.playHyperdriveSound();
        }
      };
      
      animate();
    }
  }

  start() {
    if(!this.started) {
      this.started = true;
      this.update();
    }
  }

  update() {
    if(this.showMap) {
      this.starMap.draw(this.ctx);
    } else if(this.planetView) {
      this.updatePlanetView();
    } else {
      this.updateSpaceView();
    }
    requestAnimationFrame(() => this.update());
  }

  updateSpaceView() {
    // Clear screen
    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Update camera to follow ship
    this.camera.x = this.canvas.width/2 - this.ship.x;
    this.camera.y = this.canvas.height/2 - this.ship.y;

    // Draw stars with parallax
    this.stars.forEach(star => {
      this.ctx.fillStyle = '#fff';
      const parallaxX = star.x + this.camera.x * 0.1;
      const parallaxY = star.y + this.camera.y * 0.1;
      this.ctx.fillRect(parallaxX, parallaxY, star.size, star.size);
    });

    // Update planet screen positions
    this.planets.forEach(planet => {
      planet.screenX = this.canvas.width/2 + this.camera.x;
      planet.screenY = this.canvas.height/2 + this.camera.y;
    });

    // Draw sun
    this.ctx.fillStyle = this.currentSystem.color;
    this.ctx.beginPath();
    this.ctx.arc(
      this.canvas.width/2 + this.camera.x, 
      this.canvas.height/2 + this.camera.y, 
      40, 0, Math.PI * 2
    );
    this.ctx.fill();

    // Draw planets
    this.planets.forEach(planet => {
      planet.rotation += planet.rotationSpeed;

      // Draw orbit
      this.ctx.strokeStyle = '#ffffff22';
      this.ctx.beginPath();
      this.ctx.arc(planet.screenX, planet.screenY,
        Math.sqrt(planet.x * planet.x + planet.y * planet.y), 0, Math.PI * 2);
      this.ctx.stroke();

      // Draw planet
      const x = planet.screenX + planet.x;
      const y = planet.screenY + planet.y;

      if(this.ship.targetPlanet === planet) {
        this.ctx.strokeStyle = this.ship.landingMode ? '#ff0' : '#0ff';
        this.ctx.beginPath();
        this.ctx.arc(x, y, planet.size * 1.5, 0, Math.PI * 2);
        this.ctx.stroke();
      }

      this.ctx.fillStyle = planet.atmosphere;
      this.ctx.beginPath();
      this.ctx.arc(x, y, planet.size * 1.2, 0, Math.PI * 2);
      this.ctx.fill();

      this.ctx.fillStyle = planet.color;
      this.ctx.beginPath();
      this.ctx.arc(x, y, planet.size, 0, Math.PI * 2);
      this.ctx.fill();

      // Surface details
      this.ctx.save();
      this.ctx.translate(x, y);
      this.ctx.rotate(planet.rotation);
      this.ctx.fillStyle = '#00000033';
      
      for(let i = 0; i < 5; i++) {
        const spotX = (Math.random() - 0.5) * planet.size;
        const spotY = (Math.random() - 0.5) * planet.size;
        const spotSize = 2 + Math.random() * 6;
        this.ctx.beginPath();
        this.ctx.arc(spotX, spotY, spotSize, 0, Math.PI * 2);
        this.ctx.fill();
      }
      
      this.ctx.restore();
    });

    // Update and draw ship
    this.ship.update(this.planets);
    this.ship.draw(this.ctx);

    // Draw HUD
    this.drawHUD();
  }

  updatePlanetView() {
    // Clear screen
    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw terrain
    this.ctx.strokeStyle = this.currentPlanet.color;
    this.ctx.beginPath();
    this.ctx.moveTo(0, this.currentPlanet.terrain[0]);
    for(let i = 1; i < this.currentPlanet.terrain.length; i++) {
      this.ctx.lineTo(i, this.currentPlanet.terrain[i]);
    }
    this.ctx.stroke();

    // Draw features
    this.currentPlanet.features.forEach(feature => {
      this.ctx.strokeStyle = feature.type === 'tree' ? '#0f0' : '#888';
      this.ctx.beginPath();
      if(feature.type === 'tree') {
        this.ctx.moveTo(feature.x, this.currentPlanet.terrain[Math.floor(feature.x)]);
        this.ctx.lineTo(feature.x, this.currentPlanet.terrain[Math.floor(feature.x)] - feature.height);
      } else {
        this.ctx.arc(feature.x, this.currentPlanet.terrain[Math.floor(feature.x)] - feature.height/2,
          feature.height/2, 0, Math.PI * 2);
      }
      this.ctx.stroke();
    });

    // Draw animals
    this.currentPlanet.animals.forEach(animal => {
      animal.x += animal.speed * animal.direction;
      if(animal.x < 0 || animal.x > this.canvas.width) {
        animal.direction *= -1;
      }

      this.ctx.strokeStyle = '#ff0';
      this.ctx.beginPath();
      switch(animal.type) {
        case 'quadruped':
          this.drawQuadruped(animal);
          break;
        case 'flying':
          this.drawFlyingCreature(animal);
          break;
        case 'blob':
          this.drawBlob(animal);
          break;
        // ... other animal types ...
      }
      this.ctx.stroke();
    });

    // Update and draw explorer
    this.explorer.handleInput(this.keys);
    this.explorer.update(this.currentPlanet.terrain);
    this.explorer.draw(this.ctx);

    // Draw HUD
    this.drawPlanetHUD();
  }

  drawQuadruped(animal) {
    const y = this.currentPlanet.terrain[Math.floor(animal.x)] - animal.size;
    this.ctx.moveTo(animal.x - animal.size/2, y);
    this.ctx.lineTo(animal.x + animal.size/2, y);
    this.ctx.moveTo(animal.x - animal.size/2, y + animal.size/2);
    this.ctx.lineTo(animal.x + animal.size/2, y + animal.size/2);
  }

  drawFlyingCreature(animal) {
    const y = this.currentPlanet.terrain[Math.floor(animal.x)] - animal.size * 2;
    this.ctx.moveTo(animal.x - animal.size/2, y);
    this.ctx.lineTo(animal.x + animal.size/2, y);
    this.ctx.moveTo(animal.x, y - animal.size/4);
    this.ctx.lineTo(animal.x, y + animal.size/4);
  }

  drawBlob(animal) {
    const y = this.currentPlanet.terrain[Math.floor(animal.x)] - animal.size/2;
    this.ctx.arc(animal.x, y, animal.size/2, 0, Math.PI * 2);
  }

  drawPlanetHUD() {
    const padding = 20;
    const boxHeight = 100;
    const boxWidth = this.canvas.width - padding * 2;
    const boxY = this.canvas.height - boxHeight - padding;

    // Draw semi-transparent box
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.fillRect(padding, boxY, boxWidth, boxHeight);
    this.ctx.strokeStyle = '#0ff';
    this.ctx.strokeRect(padding, boxY, boxWidth, boxHeight);

    // Draw planet info
    this.ctx.fillStyle = '#0ff';
    this.ctx.font = '24px "Product Sans Bold"';
    this.ctx.fillText(`${this.currentPlanet.name}`, padding * 2, boxY + 35);
    this.ctx.font = '20px "Product Sans Bold"';
    this.ctx.fillText(`Temperature: ${this.currentPlanet.temperature}°C`, padding * 2, boxY + 65);
    this.ctx.fillText(`Biome: ${this.currentPlanet.biome}`, padding * 2 + 300, boxY + 65);
  }

  drawHUD() {
    this.ctx.fillStyle = '#0ff';
    this.ctx.font = '20px "Product Sans Bold"';
    this.ctx.fillText(`System: ${this.currentSystem.name}`, 20, 40);
    
    if(this.ship.targetPlanet) {
      this.ctx.fillStyle = this.ship.landingMode ? '#ff0' : '#0ff';
      this.ctx.fillText('Press L to toggle landing mode', 20, 70);
      if(this.ship.landed) {
        this.ctx.fillText('Press SPACE to launch', 20, 100);
      }
    }

    if(this.ship.pulseEngine) {
      this.ctx.fillStyle = '#f0f';
      this.ctx.fillText('PULSE ENGINE ACTIVE', this.canvas.width - 200, 40);
    }
    
    if(this.ship.hyperDrive) {
      this.ctx.fillStyle = '#ff0';
      this.ctx.fillText('HYPERDRIVE ACTIVE', this.canvas.width - 200, 70);
    }
  }

  getSaveData() {
    return {
      ship: {
        x: this.ship.x,
        y: this.ship.y,
        rotation: this.ship.rotation
      },
      currentSystem: this.currentSystem,
      visitedSystems: this.starMap.visitedSystems,
      systems: this.starMap.systems,
      planets: this.planets,
      timestamp: Date.now()
    };
  }

  exportSave() {
    const saveData = this.getSaveData();
    const filename = prompt('Enter save file name:', 'nms_save.json');
    if(!filename) return;

    const blob = new Blob([JSON.stringify(saveData)], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  importSave() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if(!file) return;
      
      try {
        const text = await file.text();
        const saveData = JSON.parse(text);
        this.loadGameState(saveData);
      } catch(err) {
        console.error('Error loading save file:', err);
        alert('Error loading save file');
      }
    };
    
    input.click();
  }
}