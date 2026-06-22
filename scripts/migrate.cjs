const { execSync } = require('child_process');
const { readdirSync } = require('fs');

const target = process.argv[2] === 'remote' ? '--remote' : '--local';

readdirSync('migrations')
  .filter(f => f.endsWith('.sql'))
  .sort()
  .forEach(f => {
    console.log(`Running ${f}`);
    execSync(`wrangler d1 execute blog-db ${target} --file=migrations/${f}`, { stdio: 'inherit' });
  });
