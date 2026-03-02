const { spawnSync } = require('node:child_process');

const runPrisma = (args) => {
  const result = spawnSync('npx', ['prisma', ...args], {
    stdio: 'inherit',
    shell: process.platform === 'win32',
    env: process.env,
  });

  if (typeof result.status === 'number') {
    return result.status;
  }

  return 1;
};

const migrateStatus = runPrisma(['migrate', 'deploy']);
if (migrateStatus === 0) {
  process.exit(0);
}

console.warn('Prisma migrate deploy failed. Falling back to prisma db push...');
const dbPushStatus = runPrisma(['db', 'push', '--skip-generate']);
if (dbPushStatus !== 0) {
  process.exit(dbPushStatus);
}

console.log('Prisma db push completed successfully.');
