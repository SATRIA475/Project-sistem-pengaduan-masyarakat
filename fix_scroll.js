const fs = require('fs');
const path = require('path');

['AdminHomeScreen.js', 'HomeScreen.js'].forEach(file => {
  const p = path.join('mobile/src/screens/', file);
  if(fs.existsSync(p)) {
    let content = fs.readFileSync(p, 'utf8');
    
    // Remove the bad TouchableWithoutFeedback wrapper
    const toRemoveStart = /<TouchableWithoutFeedback onPress=\{Keyboard\.dismiss\}>\s*<View style=\{\{\s*flex:\s*1\s*\}\}>/;
    const toRemoveEnd = /<\/View>\s*<\/TouchableWithoutFeedback>/g;

    // Use a while loop to replace all occurrences if needed, or just standard replace
    // Actually just string matching because replace with regex can be tricky with multiline.
    if (content.includes('<TouchableWithoutFeedback onPress={Keyboard.dismiss}>') && content.includes('<View style={{ flex: 1 }}>')) {
      content = content.replace(/<TouchableWithoutFeedback onPress=\{Keyboard\.dismiss\}>\s*<View style=\{\{\s*flex:\s*1\s*\}\}>/g, '');
      content = content.replace(/<\/View>\s*<\/TouchableWithoutFeedback>/g, '');
      
      // Ensure FlatList handles keyboard correctly natively
      content = content.replace(/<FlatList/g, '<FlatList keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag"');
      content = content.replace(/<ScrollView/g, '<ScrollView keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag"');
      
      fs.writeFileSync(p, content, 'utf8');
      console.log('Fixed ' + file);
    } else {
      console.log('Pattern not found in ' + file);
    }
  }
});
