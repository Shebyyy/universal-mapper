#!/usr/bin/env node

const CompleteCatalogMapper = require('../complete-catalog-mapper');
const fs = require('fs-extra');
const path = require('path');

async function generateMappingStats() {
  console.log('🔗 Generating Mapping Analysis');
  console.log('=============================');
  
  const mapper = new CompleteCatalogMapper();
  await mapper.loadExistingMappings();
  
  try {
    // Find cross-client matches
    const crossClientMatches = mapper.findCrossClientMatches();
    const unmappedItems = mapper.findUnmappedItems();
    
    // Analyze mapping patterns
    const mappingPatterns = analyzeMappingPatterns(mapper);
    
    // Find mapping conflicts
    const conflicts = findMappingConflicts(mapper);
    
    // Generate recommendations
    const recommendations = generateRecommendations(crossClientMatches, unmappedItems, conflicts);
    
    const analysis = {
      summary: {
        totalMappings: mapper.mappingCache.size,
        crossClientMatches: crossClientMatches.length,
        unmappedItems: unmappedItems.length,
        conflicts: conflicts.length
      },
      crossClientMatches: crossClientMatches.slice(0, 100), // Top 100
      unmappedItems: unmappedItems.slice(0, 100), // Top 100
      mappingPatterns,
      conflicts: conflicts.slice(0, 50), // Top 50 conflicts
      recommendations,
      generatedAt: new Date().toISOString()
    };
    
    // Save analysis
    await fs.writeJson(path.join(__dirname, '../mapping-analysis.json'), analysis, { spaces: 2 });
    
    // Display key findings
    console.log('🔍 Mapping Analysis Results');
    console.log('===========================');
    console.log(`Total unique media items: ${analysis.summary.totalMappings}`);
    console.log(`Items with cross-client mappings: ${analysis.summary.crossClientMatches}`);
    console.log(`Items in only one client: ${analysis.summary.unmappedItems}`);
    console.log(`Mapping conflicts found: ${analysis.summary.conflicts}`);
    console.log('');
    
    console.log('Mapping Patterns:');
    for (const [pattern, count] of Object.entries(mappingPatterns)) {
      console.log(`  ${pattern}: ${count} items`);
    }
    console.log('');
    
    console.log('Top Recommendations:');
    analysis.recommendations.slice(0, 5).forEach((rec, i) => {
      console.log(`  ${i + 1}. ${rec.type}: ${rec.description}`);
    });
    
    console.log('');
    console.log('✅ Mapping analysis saved to mapping-analysis.json');
    
  } catch (error) {
    console.error('❌ Error generating mapping analysis:', error);
    process.exit(1);
  }
}

function analyzeMappingPatterns(mapper) {
  const patterns = {};
  
  for (const [mediaKey, mappings] of mapper.mappingCache.entries()) {
    const clientIds = Object.entries(mappings).filter(([client, id]) => id);
    const pattern = clientIds.map(([client]) => client).sort().join('+');
    
    patterns[pattern] = (patterns[pattern] || 0) + 1;
  }
  
  return Object.entries(patterns)
    .sort(([,a], [,b]) => b - a)
    .reduce((obj, [key, value]) => {
      obj[key] = value;
      return obj;
    }, {});
}

function findMappingConflicts(mapper) {
  const conflicts = [];
  const processed = new Set();
  
  for (const [mediaKey, mappings] of mapper.mappingCache.entries()) {
    if (processed.has(mediaKey)) continue;
    
    // Find similar titles that might be the same media
    const title = mapper.extractTitleFromKey(mediaKey);
    if (title) {
      const similar = mapper.searchByTitle(title, null, true);
      
      if (similar.length > 1) {
        // Check if these might be duplicates
        const clientMappings = {};
        
        similar.forEach(({ mediaKey: key, mappings: map }) => {
          Object.entries(map).forEach(([client, id]) => {
            if (id) {
              if (!clientMappings[client]) {
                clientMappings[client] = [];
              }
              clientMappings[client].push({ id, mediaKey: key });
            }
          });
        });
        
        // Find conflicts
        Object.entries(clientMappings).forEach(([client, items]) => {
          if (items.length > 1) {
            conflicts.push({
              type: 'duplicate_client_mapping',
              client,
              items,
              title,
              severity: 'high'
            });
          }
        });
      }
    }
    
    processed.add(mediaKey);
  }
  
  return conflicts;
}

function generateRecommendations(crossClientMatches, unmappedItems, conflicts) {
  const recommendations = [];
  
  // High unmapped items
  if (unmappedItems.length > crossClientMatches.length) {
    recommendations.push({
      type: 'improve_coverage',
      priority: 'high',
      description: `${unmappedItems.length} items exist in only one client. Consider adding more clients or improving matching algorithms.`
    });
  }
  
  // Mapping conflicts
  if (conflicts.length > 0) {
    recommendations.push({
      type: 'resolve_conflicts',
      priority: 'high',
      description: `${conflicts.length} mapping conflicts found. Review and resolve duplicate mappings.`
    });
  }
  
  // Low coverage
  const completePercentage = (crossClientMatches.length / (crossClientMatches.length + unmappedItems.length)) * 100;
  if (completePercentage < 50) {
    recommendations.push({
      type: 'improve_matching',
      priority: 'medium',
      description: `Only ${completePercentage.toFixed(1)}% of items have cross-client mappings. Improve title matching algorithms.`
    });
  }
  
  // Client-specific recommendations
  const clientCounts = {};
  crossClientMatches.forEach(item => {
    item.crossClientMappings.forEach(([client]) => {
      clientCounts[client] = (clientCounts[client] || 0) + 1;
    });
  });
  
  const topClient = Object.entries(clientCounts).sort(([,a], [,b]) => b - a)[0];
  if (topClient) {
    recommendations.push({
      type: 'client_optimization',
      priority: 'low',
      description: `${topClient[0]} has the most cross-client mappings (${topClient[1]}). Consider it as primary reference.`
    });
  }
  
  return recommendations;
}

if (require.main === module) {
  generateMappingStats();
}

module.exports = generateMappingStats;