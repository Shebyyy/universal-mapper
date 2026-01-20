#!/usr/bin/env node

const MediaUpdater = require('./updater');

async function main() {
  const updater = new MediaUpdater();
  
  // Example usage - update popular anime
  const popularAnimeIds = [
    21,   // One Piece
    30,   // Neon Genesis Evangelion
    16498, // Attack on Titan
    31964, // Demon Slayer
    21,   // One Piece (duplicate to test mapping)
    5114, // Fullmetal Alchemist: Brotherhood
    28977, // One Punch Man
    1535, // Death Note
    199,  // Naruto
    20005, // My Hero Academia
  ];
  
  console.log('Starting media update process...');
  
  try {
    // Sync existing files first
    await updater.syncExistingMedia();
    
    // Batch update popular anime
    await updater.batchUpdate(popularAnimeIds, 'anilist', 'anime');
    
    console.log('Update process completed successfully!');
    
  } catch (error) {
    console.error('Update process failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = main;