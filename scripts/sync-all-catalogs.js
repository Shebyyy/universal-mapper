#!/usr/bin/env node

const CatalogSynchronizer = require('./catalog-synchronizer');

async function main() {
  console.log('🚀 Starting Complete Media Catalog Synchronization');
  console.log('==================================================');
  console.log('This will fetch ALL media from ALL clients and create comprehensive mappings.');
  console.log('⚠️  This process may take several hours to complete.');
  console.log('');
  
  const synchronizer = new CatalogSynchronizer();
  
  try {
    await synchronizer.synchronizeAllCatalogs();
    console.log('🎉 Complete catalog synchronization finished successfully!');
  } catch (error) {
    console.error('❌ Synchronization failed:', error.message);
    console.error('Check the logs above for details.');
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Synchronization interrupted by user');
  console.log('💡 You can resume later by running: npm run resume');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Synchronization terminated');
  process.exit(0);
});

if (require.main === module) {
  main();
}

module.exports = main;