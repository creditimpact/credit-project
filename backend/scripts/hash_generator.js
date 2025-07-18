const crypto = require('crypto');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('🔐 Enter password to hash: ', (password) => {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  console.log('\n✅ Generated hash (copy this to .env):');
  console.log(`${salt}$${hash}`);
  rl.close();
});
