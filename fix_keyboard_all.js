const fs = require('fs');
const path = require('path');

const screensDir = 'mobile/src/screens/';
const files = fs.readdirSync(screensDir).filter(f => f.endsWith('.js'));

files.forEach(f => {
  const p = path.join(screensDir, f);
  let content = fs.readFileSync(p, 'utf8');

  // Check if it has KeyboardAvoidingView but hasn't been wrapped yet
  if (content.includes('<KeyboardAvoidingView') && !content.includes('onPress={Keyboard.dismiss}')) {
    
    // 1. Add missing imports
    if (!content.includes('TouchableWithoutFeedback')) {
      content = content.replace(/import \{([^}]+)\} from 'react-native';/, (match, p1) => {
        const imports = p1.split(',').map(s => s.trim());
        if (!imports.includes('TouchableWithoutFeedback')) imports.push('TouchableWithoutFeedback');
        if (!imports.includes('Keyboard')) imports.push('Keyboard');
        return `import { ${imports.join(', ')} } from 'react-native';`;
      });
    }

    // 2. Change KeyboardAvoidingView behavior
    content = content.replace(/behavior=\{Platform\.OS === 'ios' \? 'padding' : undefined\}/g, `behavior={Platform.OS === 'ios' ? 'padding' : 'height'}`);

    // 3. Wrap inner content
    const kavStartMatch = content.match(/<KeyboardAvoidingView[^>]*>/);
    if(kavStartMatch) {
      const kavStart = kavStartMatch.index;
      const kavStartEnd = kavStart + kavStartMatch[0].length;
      const kavEnd = content.lastIndexOf('</KeyboardAvoidingView>');
      
      const innerContent = content.substring(kavStartEnd, kavEnd);
      
      const wrappedInner = `
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={{ flex: 1 }}>
${innerContent}
          </View>
        </TouchableWithoutFeedback>
      `;
        
      content = content.substring(0, kavStartEnd) + wrappedInner + content.substring(kavEnd);
    }

    fs.writeFileSync(p, content, 'utf8');
    console.log('Updated ' + f);
  }
});
