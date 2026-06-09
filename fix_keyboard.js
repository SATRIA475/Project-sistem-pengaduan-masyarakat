const fs = require('fs');
const path = require('path');

const filesToUpdate = [
  'LoginScreen.js',
  'RegisterScreen.js',
  'ForgotPasswordScreen.js',
  'CreateComplaintScreen.js'
];

filesToUpdate.forEach(f => {
  const p = 'mobile/src/screens/' + f;
  if(fs.existsSync(p)){
    let content = fs.readFileSync(p, 'utf8');

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
      
      if (!innerContent.includes('<TouchableWithoutFeedback')) {
        const wrappedInner = `
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={{ flex: 1 }}>
${innerContent}
          </View>
        </TouchableWithoutFeedback>
      `;
        
        content = content.substring(0, kavStartEnd) + wrappedInner + content.substring(kavEnd);
      }
    }

    fs.writeFileSync(p, content, 'utf8');
    console.log('Updated ' + f);
  }
});
