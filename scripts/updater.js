const MediaAPIClient = require('../api-client');
const MediaIDMapper = require('../id-mapper');
const fs = require('fs-extra');
const path = require('path');

class MediaUpdater {
  constructor() {
    this.apiClient = new MediaAPIClient();
    this.mapper = new MediaIDMapper();
  }

  async updateAnilistMedia(mediaId, type = 'ANIME') {
    try {
      console.log(`Updating AniList media ${mediaId}...`);
      const data = await this.apiClient.getAnilistMedia(mediaId, type);
      
      if (data) {
        const { mediaKey, mappings } = this.mapper.extractAnilistMappings(data);
        await this.mapper.addMappings(mediaKey, mappings);
        
        // Save detailed media info
        const filePath = path.join(__dirname, '../anilist', `${mediaId}.json`);
        await fs.writeJson(filePath, {
          client: 'anilist',
          id: mediaId,
          type: type.toLowerCase(),
          data,
          mappings,
          mediaKey,
          lastUpdated: new Date().toISOString()
        }, { spaces: 2 });
        
        console.log(`✓ Updated AniList media ${mediaId}`);
        return { mediaKey, mappings };
      }
    } catch (error) {
      console.error(`✗ Error updating AniList media ${mediaId}:`, error.message);
    }
    return null;
  }

  async updateMALMedia(mediaId, type = 'anime') {
    try {
      console.log(`Updating MAL media ${mediaId}...`);
      const data = await this.apiClient.getMALMedia(mediaId, type);
      
      if (data) {
        const { mediaKey, mappings } = this.mapper.extractMALMappings(data);
        await this.mapper.addMappings(mediaKey, mappings);
        
        // Save detailed media info
        const filePath = path.join(__dirname, '../mal', `${mediaId}.json`);
        await fs.writeJson(filePath, {
          client: 'mal',
          id: mediaId,
          type,
          data,
          mappings,
          mediaKey,
          lastUpdated: new Date().toISOString()
        }, { spaces: 2 });
        
        console.log(`✓ Updated MAL media ${mediaId}`);
        return { mediaKey, mappings };
      }
    } catch (error) {
      console.error(`✗ Error updating MAL media ${mediaId}:`, error.message);
    }
    return null;
  }

  async updateSimklMedia(mediaId, type = 'anime') {
    try {
      console.log(`Updating Simkl media ${mediaId}...`);
      const data = await this.apiClient.getSimklMedia(mediaId, type);
      
      if (data) {
        const { mediaKey, mappings } = this.mapper.extractSimklMappings(data);
        await this.mapper.addMappings(mediaKey, mappings);
        
        // Save detailed media info
        const filePath = path.join(__dirname, '../simkl', `${mediaId}.json`);
        await fs.writeJson(filePath, {
          client: 'simkl',
          id: mediaId,
          type,
          data,
          mappings,
          mediaKey,
          lastUpdated: new Date().toISOString()
        }, { spaces: 2 });
        
        console.log(`✓ Updated Simkl media ${mediaId}`);
        return { mediaKey, mappings };
      }
    } catch (error) {
      console.error(`✗ Error updating Simkl media ${mediaId}:`, error.message);
    }
    return null;
  }

  async updateKitsuMedia(mediaId, type = 'anime') {
    try {
      console.log(`Updating Kitsu media ${mediaId}...`);
      const data = await this.apiClient.getKitsuMedia(mediaId, type);
      
      if (data) {
        const { mediaKey, mappings } = this.mapper.extractKitsuMappings(data);
        await this.mapper.addMappings(mediaKey, mappings);
        
        // Save detailed media info
        const filePath = path.join(__dirname, '../kitsu', `${mediaId}.json`);
        await fs.writeJson(filePath, {
          client: 'kitsu',
          id: mediaId,
          type,
          data,
          mappings,
          mediaKey,
          lastUpdated: new Date().toISOString()
        }, { spaces: 2 });
        
        console.log(`✓ Updated Kitsu media ${mediaId}`);
        return { mediaKey, mappings };
      }
    } catch (error) {
      console.error(`✗ Error updating Kitsu media ${mediaId}:`, error.message);
    }
    return null;
  }

  async updateMediaByClient(client, mediaId, type = 'anime') {
    switch (client.toLowerCase()) {
      case 'anilist':
        return await this.updateAnilistMedia(mediaId, type.toUpperCase());
      case 'mal':
        return await this.updateMALMedia(mediaId, type);
      case 'simkl':
        return await this.updateSimklMedia(mediaId, type);
      case 'kitsu':
        return await this.updateKitsuMedia(mediaId, type);
      default:
        console.error(`Unknown client: ${client}`);
        return null;
    }
  }

  async updateMediaFromAllClients(mediaId, type = 'anime') {
    const results = [];
    
    const clients = ['anilist', 'mal', 'simkl', 'kitsu'];
    
    for (const client of clients) {
      try {
        const result = await this.updateMediaByClient(client, mediaId, type);
        if (result) {
          results.push({ client, ...result });
        }
      } catch (error) {
        console.error(`Error updating ${client} media ${mediaId}:`, error.message);
      }
    }
    
    return results;
  }

  async batchUpdate(mediaIds, client = 'anilist', type = 'anime') {
    console.log(`Starting batch update for ${mediaIds.length} items from ${client}...`);
    
    for (let i = 0; i < mediaIds.length; i++) {
      const mediaId = mediaIds[i];
      console.log(`Progress: ${i + 1}/${mediaIds.length}`);
      
      try {
        await this.updateMediaByClient(client, mediaId, type);
      } catch (error) {
        console.error(`Failed to update ${client} media ${mediaId}:`, error.message);
      }
    }
    
    // Save all mappings and generate files
    await this.mapper.saveMappings();
    await this.mapper.generateClientFiles();
    
    console.log('Batch update completed!');
  }

  async syncExistingMedia() {
    console.log('Syncing existing media files...');
    
    const clients = ['anilist', 'mal', 'simkl', 'kitsu'];
    
    for (const client of clients) {
      const clientDir = path.join(__dirname, '../', client);
      
      if (await fs.pathExists(clientDir)) {
        const files = await fs.readdir(clientDir);
        const jsonFiles = files.filter(file => file.endsWith('.json'));
        
        console.log(`Processing ${jsonFiles.length} files from ${client}...`);
        
        for (const file of jsonFiles) {
          try {
            const filePath = path.join(clientDir, file);
            const data = await fs.readJson(filePath);
            
            if (data.mappings && data.mediaKey) {
              await this.mapper.addMappings(data.mediaKey, data.mappings);
            }
          } catch (error) {
            console.error(`Error processing ${client}/${file}:`, error.message);
          }
        }
      }
    }
    
    await this.mapper.saveMappings();
    await this.mapper.generateClientFiles();
    
    console.log('Sync completed!');
  }
}

module.exports = MediaUpdater;