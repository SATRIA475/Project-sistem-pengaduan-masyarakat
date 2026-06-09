const fs = require('fs');
const path = require('path');

const colorMap = {
  // Map to #81A6C6 (Primary Blue)
  '#5B6E53': '#81A6C6',
  '#4A5A43': '#81A6C6',
  '#4F6049': '#81A6C6',
  '#4A5944': '#81A6C6',
  '#4B5746': '#81A6C6',
  '#4B5C50': '#81A6C6',
  '#4E5545': '#81A6C6',
  '#3B4736': '#81A6C6',
  '#3C4A37': '#81A6C6',
  '#3D4236': '#81A6C6',
  '#2A3527': '#81A6C6',
  '#2D3629': '#81A6C6',
  '#202A22': '#81A6C6',
  '#1A2018': '#81A6C6',
  '#1C2319': '#81A6C6',

  // Map to #AACDDC (Light Blue / Secondary)
  '#E1F0DA': '#AACDDC',
  '#D7E0D3': '#AACDDC',
  '#C8D9C0': '#AACDDC',
  '#CFD9CB': '#AACDDC',
  '#CFDBC8': '#AACDDC',
  '#D1E5C8': '#AACDDC',
  '#C5D0C2': '#AACDDC',

  // Map to #F3E3D0 (Beige / Backgrounds)
  '#F9F9F4': '#F3E3D0',
  '#F3F6F0': '#F3E3D0',
  '#EAE7DC': '#F3E3D0',
  '#EBEFE8': '#F3E3D0',
  '#E1E8DD': '#F3E3D0',
  '#DFE5DA': '#F3E3D0',
  '#DFE5DB': '#F3E3D0',
  '#DFE7DB': '#F3E3D0',
  '#E0E0D6': '#F3E3D0',
  '#E0E5DB': '#F3E3D0',
  '#E0F2E0': '#F3E3D0',
  '#E1E8DF': '#F3E3D0',
  '#E1E9DD': '#F3E3D0',
  '#EBEBE4': '#F3E3D0',
  '#F2F4F0': '#F3E3D0',
  '#F4F5F2': '#F3E3D0',
  '#F8F8F6': '#F3E3D0',

  // Map to #D2C4B4 (Taupe / Accents / Muted Text)
  '#98A68E': '#D2C4B4',
  '#D9B4B0': '#D2C4B4',
  '#FEECEB': '#D2C4B4',
  '#8E918B': '#D2C4B4',
  '#A3A6A0': '#D2C4B4',
  '#9E9E95': '#D2C4B4',
  '#A3B299': '#D2C4B4',
  '#A8B3A2': '#D2C4B4',
  '#7A8776': '#D2C4B4',
  '#7A8B74': '#D2C4B4',
  '#7B8C76': '#D2C4B4',
  '#7C9284': '#D2C4B4',
  '#7E9174': '#D2C4B4',
  '#889982': '#D2C4B4',
  '#8BA583': '#D2C4B4',
  '#8C9A86': '#D2C4B4',
  '#8F9779': '#D2C4B4',
  '#9DA58E': '#D2C4B4',
  '#6B7B64': '#D2C4B4',
  '#6D7566': '#D2C4B4',
  '#5C6E60': '#D2C4B4',
  '#65735F': '#D2C4B4'
};

const dirs = ['web/src', 'mobile/src'];

function walk(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walk(fullPath);
    } else if (/\.(js|jsx|ts|tsx|css)$/.test(file)) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let changed = false;
      
      // We will do a case-insensitive replace for each color in the map
      for (const [oldColor, newColor] of Object.entries(colorMap)) {
        const regex = new RegExp(oldColor, 'gi');
        if (regex.test(content)) {
          content = content.replace(regex, newColor);
          changed = true;
        }
      }
      
      if (changed) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated ${fullPath}`);
      }
    }
  }
}

dirs.forEach(walk);
console.log('Replacement complete.');
