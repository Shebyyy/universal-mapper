#!/usr/bin/env node

const MediaUpdater = require('./updater');

async function updatePopular() {
  const updater = new MediaUpdater();
  
  // Popular anime IDs (AniList)
  const popularAnime = [
    21,     // One Piece
    30,     // Neon Genesis Evangelion
    16498,  // Attack on Titan
    31964,  // Demon Slayer
    5114,   // Fullmetal Alchemist: Brotherhood
    28977,  // One Punch Man
    1535,   // Death Note
    199,    // Naruto
    20005,  // My Hero Academia
    154587, // Jujutsu Kaisen
    101922, // Tokyo Ghoul
    20762,  // Sword Art Online
    34599,  // Re:Zero
    21627,  // Mob Psycho 100
    28631,  // Boruto
  ];
  
  // Popular manga IDs (AniList)
  const popularManga = [
    30001,  // One Piece
    30002,  // Berserk
    30011,  // Attack on Titan
    30012,  // Demon Slayer
    30015,  // My Hero Academia
    30016,  // Tokyo Ghoul
    30017,  // Death Note
    30018,  // Fullmetal Alchemist
    30019,  // Naruto
    30020,  // Bleach
  ];
  
  console.log('🔄 Updating popular anime and manga...');
  
  try {
    // Update popular anime
    console.log('Updating popular anime...');
    await updater.batchUpdate(popularAnime, 'anilist', 'anime');
    
    // Update popular manga
    console.log('Updating popular manga...');
    await updater.batchUpdate(popularManga, 'anilist', 'manga');
    
    console.log('✅ Popular media update completed!');
    
  } catch (error) {
    console.error('❌ Popular media update failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  updatePopular();
}

module.exports = updatePopular;