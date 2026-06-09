const fs = require('fs');
const path = require('path');

const colorMap = {
  // Primary
  '#81A6C6': '#355872',
  '#81a6c6': '#355872',
  
  // Accents / Light
  '#AACDDC': '#9CD5FF',
  '#aacddc': '#9CD5FF',
  
  // Backgrounds
  '#F3E3D0': '#F7F8F0',
  '#f3e3d0': '#F7F8F0',
  
  // Muted / Borders / Secondary
  '#D2C4B4': '#7AAACE',
  '#d2c4b4': '#7AAACE',
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
