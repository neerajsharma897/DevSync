const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

try {
  execSync('npx tsc -b', { encoding: 'utf8' });
} catch (e) {
  const output = e.stdout;
  const regex = /(.+)\((\d+),\d+\): error TS6133: '(.+?)' is declared but its value is never read./g;
  let match;
  
  const edits = {};
  
  while ((match = regex.exec(output)) !== null) {
    const file = match[1];
    const lineNum = parseInt(match[2], 10) - 1;
    const varName = match[3];
    
    if (!edits[file]) edits[file] = [];
    edits[file].push({ lineNum, varName });
  }
  
  for (const [file, fileEdits] of Object.entries(edits)) {
    const fullPath = path.resolve(file);
    if (!fs.existsSync(fullPath)) continue;
    
    let lines = fs.readFileSync(fullPath, 'utf8').split('\n');
    
    // Sort edits by line descending so modifying lines doesn't affect earlier edits on the SAME line? 
    // Actually, line edits should be done at once per line.
    const byLine = {};
    for (const edit of fileEdits) {
      if (!byLine[edit.lineNum]) byLine[edit.lineNum] = [];
      byLine[edit.lineNum].push(edit.varName);
    }
    
    for (const [lineNumStr, vars] of Object.entries(byLine)) {
      const lineNum = parseInt(lineNumStr, 10);
      let line = lines[lineNum];
      
      for (const varName of vars) {
        // Match the variable name, optionally followed by a comma and spaces, or preceded by a comma and spaces.
        // E.g., `React, { useState }` -> `React` -> `, { useState }` (Wait, React is before)
        // Let's use simple regex replaces
        const r1 = new RegExp(`\\b${varName}\\s*,\\s*`);
        const r2 = new RegExp(`,\\s*\\b${varName}\\b`);
        const r3 = new RegExp(`\\b${varName}\\b\\s*:\\s*\\w+\\s*,\\s*`); // For slug: currentSlug,
        const r4 = new RegExp(`,\\s*\\b\\w+\\b\\s*:\\s*\\b${varName}\\b`);
        const r5 = new RegExp(`\\b${varName}\\b`);
        
        if (r3.test(line)) line = line.replace(r3, '');
        else if (r4.test(line)) line = line.replace(r4, '');
        else if (r1.test(line)) line = line.replace(r1, '');
        else if (r2.test(line)) line = line.replace(r2, '');
        else if (line.includes(`import ${varName} from`)) {
           line = ''; // remove entire line
        }
        else {
           line = line.replace(r5, '').replace(/\{\s*\}/, ''); // empty braces
        }
      }
      lines[lineNum] = line;
    }
    
    fs.writeFileSync(fullPath, lines.join('\n'));
    console.log(`Fixed ${file}`);
  }
}
