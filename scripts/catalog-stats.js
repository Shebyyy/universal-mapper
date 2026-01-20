#!/usr/bin/env node

const CompleteCatalogMapper = require('../complete-catalog-mapper');
const fs = require('fs-extra');
const path = require('path');

async function generateCatalogStats() {
  console.log('📊 Generating Complete Catalog Statistics');
  console.log('========================================');
  
  const mapper = new CompleteCatalogMapper();
  await mapper.loadExistingMappings();
  
  try {
    const stats = mapper.generateStatistics();
    
    // Get file counts
    const fileCounts = {};
    const clients = ['anilist', 'mal', 'simkl', 'kitsu', 'anidb', 'trakt', 'tmdb', 'thetvdb'];
    
    for (const client of clients) {
      const clientDir = path.join(__dirname, '..', client);
      if (await fs.pathExists(clientDir)) {
        const files = await fs.readdir(clientDir);
        fileCounts[client] = files.filter(f => f.endsWith('.json')).length;
      } else {
        fileCounts[client] = 0;
      }
    }
    
    // Calculate sizes
    let totalSize = 0;
    const clientSizes = {};
    
    for (const client of clients) {
      const clientDir = path.join(__dirname, '..', client);
      if (await fs.pathExists(clientDir)) {
        const stats = await fs.stat(clientDir);
        // This is a simplified size calculation
        const files = await fs.readdir(clientDir);
        let clientSize = 0;
        
        for (const file of files) {
          if (file.endsWith('.json')) {
            const filePath = path.join(clientDir, file);
            const fileStat = await fs.stat(filePath);
            clientSize += fileStat.size;
          }
        }
        
        clientSizes[client] = clientSize;
        totalSize += clientSize;
      }
    }
    
    // Enhanced statistics
    const enhancedStats = {
      ...stats,
      fileCounts,
      storageStats: {
        totalSize,
        clientSizes,
        humanReadableTotalSize: formatBytes(totalSize)
      },
      generatedAt: new Date().toISOString(),
      lastSync: await getLastSyncTime()
    };
    
    // Save statistics
    await fs.writeJson(path.join(__dirname, '../catalog-stats.json'), enhancedStats, { spaces: 2 });
    
    // Display statistics
    console.log('📈 Complete Catalog Statistics');
    console.log('==============================');
    console.log(`Total Unique Media Items: ${stats.totalMappings}`);
    console.log(`Total Files: ${Object.values(fileCounts).reduce((a, b) => a + b, 0)}`);
    console.log(`Total Storage: ${enhancedStats.storageStats.humanReadableTotalSize}`);
    console.log('');
    
    console.log('File Counts by Client:');
    for (const [client, count] of Object.entries(fileCounts)) {
      const size = enhancedStats.storageStats.clientSizes[client];
      console.log(`  ${client}: ${count} files (${formatBytes(size)})`);
    }
    console.log('');
    
    console.log('Mapping Coverage:');
    console.log(`  Complete mappings (80%+): ${stats.mappingCompleteness.complete}`);
    console.log(`  Partial mappings (40-80%): ${stats.mappingCompleteness.partial}`);
    console.log(`  Minimal mappings (<40%): ${stats.mappingCompleteness.minimal}`);
    console.log('');
    
    console.log('Cross-Client Matches:');
    console.log(`  Items with multiple client IDs: ${stats.crossClientMatches}`);
    console.log(`  Items in only one client: ${stats.unmappedItems}`);
    console.log('');
    
    console.log('Top Clients by Coverage:');
    for (const [client, count] of stats.topClients) {
      console.log(`  ${client}: ${count} mappings`);
    }
    
    console.log('');
    console.log('✅ Catalog statistics saved to catalog-stats.json');
    
  } catch (error) {
    console.error('❌ Error generating catalog statistics:', error);
    process.exit(1);
  }
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

async function getLastSyncTime() {
  try {
    const syncStatsFile = path.join(__dirname, '../sync-stats.json');
    if (await fs.pathExists(syncStatsFile)) {
      const syncStats = await fs.readJson(syncStatsFile);
      return syncStats.endTime || syncStats.startTime;
    }
  } catch (error) {
    // Ignore error
  }
  return null;
}

if (require.main === module) {
  generateCatalogStats();
}

module.exports = generateCatalogStats;