export function generatePlanet() {
  // Enhanced planet name generation
  const prefixes = [
    'Nova', 'Alpha', 'Beta', 'Gamma', 'Delta', 
    'Terra', 'Kepler', 'Atlas', 'Helios', 'Kronos',
    'Nexus', 'Aether', 'Nebula', 'Cosmos', 'Astro',
    'Proxima', 'Stella', 'Luna', 'Pulsar', 'Quasar',
    'Vega', 'Sirius', 'Rigel', 'Antares', 'Arcturus',
    'Zeta', 'Omega', 'Sigma', 'Tau', 'Epsilon'
  ];
  
  const suffixes = [
    'Prime', 'Minor', 'Major', 'IX', 'V', 
    'Ultima', 'Proxima', 'Zero', 'Alpha', 'Omega',
    'Genesis', 'Exodus', 'Zenith', 'Nadir', 'Core',
    'Centauri', 'Perihelion', 'Aphelion', 'Equinox', 'Solstice',
    'Haven', 'Oasis', 'Nexus', 'Dawn', 'Dusk'
  ];
  
  const types = [
    'I', 'II', 'III', 'IV', 'V',
    'A', 'B', 'C', 'D', 'E',
    'α', 'β', 'γ', 'δ', 'ε',
    '1', '2', '3', '4', '5'
  ];

  const name = `${
    prefixes[Math.floor(Math.random() * prefixes.length)]
  } ${
    suffixes[Math.floor(Math.random() * suffixes.length)]
  }-${
    types[Math.floor(Math.random() * types.length)]
  }`;

  // Updated planet generation
  const terrain = generateTerrain();
  const temperature = Math.floor(Math.random() * 300 - 100); // -100 to 200 C
  const atmosphere = {
    color: `hsla(${Math.random() * 360}, 70%, 50%, 0.3)`,
    height: 20 + Math.random() * 30
  };
  
  const features = [];
  for(let i = 0; i < 20; i++) {
    features.push({
      x: Math.random() * terrain.length,
      type: Math.random() > 0.5 ? 'tree' : 'rock',
      height: 10 + Math.random() * 20
    });
  }

  const resources = [];
  const resourceTypes = ['carbon', 'iron', 'gold', 'uranium', 'plutonium', 'thamium9'];
  const numResources = Math.floor(Math.random() * 4) + 2;
  
  for(let i = 0; i < numResources; i++) {
    resources.push(
      resourceTypes[Math.floor(Math.random() * resourceTypes.length)]
    );
  }

  const animals = [];
  const numAnimals = Math.floor(Math.random() * 8) + 3;
  
  for(let i = 0; i < numAnimals; i++) {
    animals.push({
      type: generateAnimalType(),
      x: Math.random() * terrain.length,
      speed: Math.random() * 2 + 0.5,
      direction: Math.random() > 0.5 ? 1 : -1,
      size: 10 + Math.random() * 20
    });
  }

  return {
    name,
    terrain,
    temperature,
    atmosphere,
    features,
    resources,
    animals,
    color: `hsl(${Math.random() * 360}, 70%, 60%)`,
    biome: generateBiome()
  };
}

function generateTerrain() {
  const terrain = new Array(800).fill(0);
  let height = 400;
  
  // Generate more interesting terrain using multiple passes
  for(let octave = 0; octave < 3; octave++) {
    const frequency = Math.pow(2, octave);
    const amplitude = Math.pow(0.5, octave) * 100;
    
    for(let i = 0; i < terrain.length; i++) {
      terrain[i] += Math.sin(i * 0.01 * frequency) * amplitude;
      terrain[i] += (Math.random() - 0.5) * amplitude * 0.2;
    }
  }
  
  return terrain;
}

function generateBiome() {
  const biomes = [
    'Lush',
    'Toxic',
    'Radioactive',
    'Desert',
    'Frozen',
    'Volcanic',
    'Exotic'
  ];
  return biomes[Math.floor(Math.random() * biomes.length)];
}

function generateAnimalType() {
  const types = [
    'quadruped', // Four-legged
    'flying',    // Flying creature
    'blob',      // Amorphous blob
    'serpent',   // Snake-like
    'hopper'     // Jumping creature
  ];
  return types[Math.floor(Math.random() * types.length)];
}