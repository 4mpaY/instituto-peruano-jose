const fs = require('fs');
const path = require('path');

function getFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(getFiles(file));
    } else if (file.endsWith('.ts')) {
      results.push(file);
    }
  });
  return results;
}

const targetFiles = getFiles(path.join(__dirname, 'src/app/api'));

const patternsToReplace = [
  'fecha_entrega_estimada',
  'fecha_inicio',
  'fecha_fin',
  'fecha_expiracion',
  'fecha_programada',
  'fechaExpiracion',
  'fechaInicio',
  'fechaFin'
];

targetFiles.forEach(filePath => {
  let content = fs.readFileSync(filePath, 'utf-8');
  let modified = false;

  patternsToReplace.forEach(field => {
    // Replace `new Date(field)` with `parsePeruDate(field)`
    const regex = new RegExp(`new Date\\(${field}\\)`, 'g');
    if (regex.test(content)) {
      content = content.replace(regex, `parsePeruDate(${field})`);
      modified = true;
    }
    
    // Replace `new Date(validation.data.field)` with `parsePeruDate(validation.data.field)`
    const regexValidation = new RegExp(`new Date\\(validation\\.data\\.${field}\\)`, 'g');
    if (regexValidation.test(content)) {
      content = content.replace(regexValidation, `parsePeruDate(validation.data.${field})`);
      modified = true;
    }
  });

  if (modified) {
    if (!content.includes('parsePeruDate')) {
      content = `import { parsePeruDate } from '@/utils/functions/dateHelpers'\n` + content;
    }
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`Updated ${filePath}`);
  }
});
