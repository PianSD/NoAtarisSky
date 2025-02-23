export class AudioManager {
  constructor() {
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    this.masterGain = this.ctx.createGain();
    this.masterGain.connect(this.ctx.destination);
    this.masterGain.gain.value = 0.3;
    
    this.oscillators = [];
    this.gains = [];
    
    for(let i = 0; i < 4; i++) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.connect(gain);
      gain.connect(this.masterGain);
      gain.gain.value = 0;
      osc.start();
      this.oscillators.push(osc);
      this.gains.push(gain);
    }
    
    this.isPlaying = false;
    this.currentTheme = null;
  }

  playExplorationTheme() {
    if (this.currentTheme !== 'exploration') {
      this.stopCurrentTheme();
      const bassline = [
        {note: 'C2', duration: 0.5},
        {note: 'G2', duration: 0.5},
        {note: 'A2', duration: 0.5},
        {note: 'F2', duration: 0.5}
      ];

      const melody = [
        {note: 'C4', duration: 1},
        {note: 'E4', duration: 1},
        {note: 'G4', duration: 1},
        {note: 'F4', duration: 1}
      ];

      this.playSequence(bassline, 0, true);
      this.playSequence(melody, 1, true);
      this.currentTheme = 'exploration';
    }
  }

  stopCurrentTheme() {
    this.gains.forEach(gain => {
      gain.gain.value = 0;
    });
    this.currentTheme = null;
  }

  playLandingTheme() {
    const sequence = [
      {note: 'C5', duration: 0.25},
      {note: 'G4', duration: 0.25},
      {note: 'E4', duration: 0.25},
      {note: 'C4', duration: 0.25}
    ];
    
    this.playSequence(sequence, 2, false);
  }

  playPlanetTheme() {
    const sequence = [
      {note: 'G3', duration: 0.25},
      {note: 'C4', duration: 0.25},
      {note: 'E4', duration: 0.5},
      {note: 'G4', duration: 0.25},
      {note: 'C5', duration: 0.25},
    ];
    
    this.playSequence(sequence, 1, true);
  }

  playHyperdriveSound() {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.masterGain);
    
    osc.frequency.setValueAtTime(100, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(2000, this.ctx.currentTime + 2);
    
    gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 2);
    
    osc.start();
    osc.stop(this.ctx.currentTime + 2);
  }

  playSequence(sequence, oscIndex, loop = false) {
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    const now = this.ctx.currentTime;
    let time = now;
    let totalDuration = 0;

    sequence.forEach(note => {
      totalDuration += note.duration;
    });

    const playNotes = () => {
      sequence.forEach(note => {
        const freq = this.noteToFreq(note.note);
        this.oscillators[oscIndex].frequency.setValueAtTime(freq, time);
        this.gains[oscIndex].gain.setValueAtTime(0.3, time);
        this.gains[oscIndex].gain.setValueAtTime(0, time + note.duration);
        time += note.duration;
      });

      if(loop) {
        setTimeout(() => {
          time = this.ctx.currentTime;
          playNotes();
        }, totalDuration * 1000);
      }
    };

    playNotes();
  }

  noteToFreq(note) {
    const notes = {'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11};
    const octave = parseInt(note.slice(-1));
    const noteName = note.slice(0, -1);
    return 440 * Math.pow(2, (notes[noteName] + (octave - 4) * 12) / 12);
  }

  toggleMute() {
    if(this.masterGain.gain.value > 0) {
      this.masterGain.gain.value = 0;
    } else {
      this.masterGain.gain.value = 0.3;
    }
  }

  isMuted() {
    return this.masterGain.gain.value === 0;
  }
}