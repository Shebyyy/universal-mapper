#!/usr/bin/env node

const MediaIDMapper = require('../id-mapper');
const MediaUpdater = require('./updater');
const fs = require('fs-extra');
const path = require('path');

async function testMapping() {
  console.log('🧪 Testing Media ID Mapper');
  console.log('==========================');
  
  const mapper = new MediaIDMapper();
  const updater = new MediaUpdater();
  
  try {
    // Test 1: Create test mappings
    console.log('Test 1: Creating test mappings...');
    
    const testMappings = {
      'onepiece-1999-anime': {
        anilist: 21,
        mal: 21,
        kitsu: 1,
        simkl: 4324,
        anidb: 236
      },
      'attackontitan-2013-anime': {
        anilist: 16498,
        mal: 16498,
        kitsu: 7142,
        simkl: 4234,
        anidb: 9376
      }
    };
    
    await mapper.importMappings(testMappings);
    console.log('✅ Test mappings created');
    
    // Test 2: Search functionality
    console.log('\nTest 2: Testing search functionality...');
    
    const searchResults = mapper.searchByTitle('one piece', 'anime');
    console.log(`Found ${searchResults.length} results for "one piece"`);
    
    if (searchResults.length > 0) {
      const result = searchResults[0];
      console.log(`Media Key: ${result.mediaKey}`);
      console.log(`Mappings:`, result.mappings);
    }
    
    // Test 3: Client-specific lookups
    console.log('\nTest 3: Testing client lookups...');
    
    const anilistMapping = mapper.getMappingsByClient('anilist', 21);
    if (anilistMapping) {
      console.log(`✅ Found AniList ID 21: ${anilistMapping.mediaKey}`);
      console.log(`All mappings:`, anilistMapping.mappings);
    }
    
    // Test 4: Generate test files
    console.log('\nTest 4: Generating test files...');
    
    await mapper.generateClientFiles();
    console.log('✅ Test files generated');
    
    // Test 5: File structure validation
    console.log('\nTest 5: Validating file structure...');
    
    const clients = ['anilist', 'mal', 'simkl', 'kitsu'];
    for (const client of clients) {
      const clientDir = path.join(__dirname, '../', client);
      if (await fs.pathExists(clientDir)) {
        const files = await fs.readdir(clientDir);
        const jsonFiles = files.filter(f => f.endsWith('.json'));
        console.log(`${client}: ${jsonFiles.length} JSON files`);
      }
    }
    
    // Test 6: Statistics
    console.log('\nTest 6: Generating statistics...');
    
    const stats = {
      totalMappings: mapper.mappingCache.size,
      clientStats: {},
      typeStats: {}
    };
    
    const allClients = ['anilist', 'mal', 'simkl', 'kitsu', 'anidb'];
    for (const client of allClients) {
      stats.clientStats[client] = mapper.getAllClientMappings(client).length;
    }
    
    for (const [key, mappings] of mapper.mappingCache.entries()) {
      const type = key.split('-').pop();
      stats.typeStats[type] = (stats.typeStats[type] || 0) + 1;
    }
    
    console.log('📊 Test Statistics:');
    console.log(`Total mappings: ${stats.totalMappings}`);
    console.log('Client stats:', stats.clientStats);
    console.log('Type stats:', stats.typeStats);
    
    console.log('\n✅ All tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  testMapping();
}

module.exports = testMapping;