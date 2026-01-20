#!/usr/bin/env node

const MediaIDMapper = require('../id-mapper');
const fs = require('fs-extra');
const path = require('path');

async function generateStats() {
  const mapper = new MediaIDMapper();
  await mapper.loadExistingMappings();
  
  const stats = {
    totalMappings: mapper.mappingCache.size,
    clientStats: {},
    typeStats: {},
    lastUpdated: new Date().toISOString(),
    directoryStats: {}
  };
  
  // Count mappings per client
  const clients = ['anilist', 'mal', 'simkl', 'kitsu', 'anidb', 'trakt', 'tmdb', 'thetvdb'];
  
  for (const client of clients) {
    const clientMappings = mapper.getAllClientMappings(client);
    stats.clientStats[client] = clientMappings.length;
    
    // Count files in directory
    const clientDir = path.join(__dirname, '../', client);
    if (await fs.pathExists(clientDir)) {
      const files = await fs.readdir(clientDir);
      stats.directoryStats[client] = files.filter(f => f.endsWith('.json')).length;
    } else {
      stats.directoryStats[client] = 0;
    }
  }
  
  // Count by type (anime, manga, etc.)
  for (const [key, mappings] of mapper.mappingCache.entries()) {
    const type = key.split('-').pop();
    stats.typeStats[type] = (stats.typeStats[type] || 0) + 1;
  }
  
  // Save stats
  await fs.writeJson(path.join(__dirname, '../stats.json'), stats, { spaces: 2 });
  
  // Display stats
  console.log('📊 Media ID Mapper Statistics');
  console.log('==============================');
  console.log(`Total Mappings: ${stats.totalMappings}`);
  console.log('');
  
  console.log('Client Statistics:');
  for (const [client, count] of Object.entries(stats.clientStats)) {
    const files = stats.directoryStats[client];
    console.log(`  ${client}: ${count} mappings, ${files} files`);
  }
  console.log('');
  
  console.log('Type Statistics:');
  for (const [type, count] of Object.entries(stats.typeStats)) {
    console.log(`  ${type}: ${count} items`);
  }
  console.log('');
  
  console.log(`Last Updated: ${stats.lastUpdated}`);
}

if (require.main === module) {
  generateStats();
}

module.exports = generateStats;