#!/usr/bin/env node

const MediaUpdater = require('./updater');

async function updateSpecific() {
  const updater = new MediaUpdater();
  
  const client = process.argv[2];
  const mediaIds = process.argv[3].split(',').map(id => parseInt(id.trim()));
  const type = process.argv[4] || 'anime';
  
  if (!client || !mediaIds.length) {
    console.error('Usage: node update-specific.js <client> <media_ids> <type>');
    console.error('Example: node update-specific.js anilist "21,30,16498" anime');
    process.exit(1);
  }
  
  console.log(`Updating ${mediaIds.length} ${type} from ${client}: ${mediaIds.join(', ')}`);
  
  try {
    await updater.batchUpdate(mediaIds, client, type);
    console.log('Update completed successfully!');
  } catch (error) {
    console.error('Update failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  updateSpecific();
}

module.exports = updateSpecific;