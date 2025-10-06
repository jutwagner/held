const { exec } = require('child_process');
const path = require('path');

console.log('Starting database population...');

// Run the TypeScript script
const scriptPath = path.join(__dirname, 'populate-category-database.ts');
const command = `npx ts-node ${scriptPath}`;

exec(command, (error, stdout, stderr) => {
  if (error) {
    console.error('Error running script:', error);
    return;
  }
  
  if (stderr) {
    console.error('Script stderr:', stderr);
  }
  
  console.log('Script output:', stdout);
  console.log('Database population completed!');
});
