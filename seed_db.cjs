const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

if (!code.includes('await seedDatabaseIfEmpty()')) {
  code = code.replace(
    'const PORT = 3000;',
    'const PORT = 3000;\n  await seedDatabaseIfEmpty();\n'
  );
  fs.writeFileSync('server.ts', code);
  console.log("Added seed logic");
}
