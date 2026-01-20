#!/usr/bin/env node

const CatalogSynchronizer = require('./catalog-synchronizer');

async function resume() {
  console.log('🔄 Resuming interrupted catalog synchronization...');
  console.log('================================================');
  
  const synchronizer = new CatalogSynchronizer();
  
  try {
    await synchronizer.resumeSynchronization();
    console.log('🎉 Resumed synchronization completed successfully!');
  } catch (error) {
    console.error('❌ Resume failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  resume();
}

module.exports = resume;