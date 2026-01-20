const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
require('dotenv').config();

class MediaAPIClient {
  constructor() {
    this.requestDelay = parseInt(process.env.REQUEST_DELAY) || 1000;
    this.maxRetries = parseInt(process.env.MAX_RETRIES) || 3;
  }

  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async makeRequest(url, options = {}) {
    let retries = 0;
    
    while (retries < this.maxRetries) {
      try {
        await this.delay(this.requestDelay);
        const response = await axios(url, options);
        return response.data;
      } catch (error) {
        retries++;
        console.error(`Request failed (attempt ${retries}/${this.maxRetries}):`, error.message);
        
        if (retries >= this.maxRetries) {
          throw error;
        }
        
        await this.delay(this.requestDelay * retries);
      }
    }
  }

  // AniList API
  async getAnilistMedia(mediaId, type = 'ANIME') {
    const query = `
      query ($id: Int, $type: MediaType) {
        Media(id: $id, type: $type) {
          id
          type
          title {
            romaji
            english
            native
          }
          synonyms
          format
          status
          episodes
          chapters
          volumes
          startDate {
            year
            month
            day
          }
          endDate {
            year
            month
            day
          }
          season
          seasonYear
          coverImage {
            large
            medium
          }
          bannerImage
          genres
          externalLinks {
            site
            url
          }
          idMal
          relations {
            edges {
              relationType
              node {
                id
                type
                title {
                  romaji
                  english
                }
              }
            }
          }
        }
      }
    `;

    const variables = { id: mediaId, type };
    
    try {
      const data = await this.makeRequest('https://graphql.anilist.co/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        data: { query, variables }
      });

      return data.data.Media;
    } catch (error) {
      console.error(`Error fetching AniList media ${mediaId}:`, error.message);
      return null;
    }
  }

  // MyAnimeList API
  async getMALMedia(mediaId, type = 'anime') {
    try {
      const data = await this.makeRequest(`https://api.myanimelist.net/v2/${type}/${mediaId}`, {
        headers: {
          'X-MAL-CLIENT-ID': process.env.MAL_CLIENT_ID,
        },
        params: {
          fields: 'id,title,title_english,title_japanese,title_synonyms,type,status,episodes,chapters,volumes,aired,premiered,broadcast,producers,genres,related_anime,related_manga,main_picture,external_links'
        }
      });

      return data;
    } catch (error) {
      console.error(`Error fetching MAL media ${mediaId}:`, error.message);
      return null;
    }
  }

  // Simkl API
  async getSimklMedia(mediaId, type = 'anime') {
    try {
      const data = await this.makeRequest(`https://api.simkl.com/${type}/${mediaId}`, {
        headers: {
          'simkl-api-key': process.env.SIMKL_CLIENT_ID,
        },
        params: {
          extended: 'full'
        }
      });

      return data;
    } catch (error) {
      console.error(`Error fetching Simkl media ${mediaId}:`, error.message);
      return null;
    }
  }

  // Kitsu API
  async getKitsuMedia(mediaId, type = 'anime') {
    try {
      const data = await this.makeRequest(`https://api.kitsu.io/edge/${type}/${mediaId}`, {
        params: {
          'include': 'genres,productions,relationships'
        }
      });

      return data.data;
    } catch (error) {
      console.error(`Error fetching Kitsu media ${mediaId}:`, error.message);
      return null;
    }
  }

  // AniDB API
  async getAnidbMedia(mediaId, type = 'anime') {
    try {
      const data = await this.makeRequest(`http://api.anidb.net:9001/httpapi?request=anime&aid=${mediaId}&client=${process.env.ANIDB_CLIENT_ID}&clientver=1&protover=1`);
      
      // Parse XML response (you might need xml2js package)
      return data;
    } catch (error) {
      console.error(`Error fetching AniDB media ${mediaId}:`, error.message);
      return null;
    }
  }

  // Trakt API
  async getTraktMedia(mediaId, type = 'shows') {
    try {
      const data = await this.makeRequest(`https://api.trakt.tv/${type}/${mediaId}`, {
        headers: {
          'Content-Type': 'application/json',
          'trakt-api-version': '2',
          'trakt-api-key': process.env.TRAKT_CLIENT_ID,
        },
        params: {
          extended: 'full'
        }
      });

      return data;
    } catch (error) {
      console.error(`Error fetching Trakt media ${mediaId}:`, error.message);
      return null;
    }
  }

  // TMDB API
  async getTMDBMedia(mediaId, type = 'movie') {
    try {
      const data = await this.makeRequest(`https://api.themoviedb.org/3/${type}/${mediaId}`, {
        params: {
          api_key: process.env.TMDB_API_KEY,
          append_to_response: 'external_ids,credits,keywords,genres'
        }
      });

      return data;
    } catch (error) {
      console.error(`Error fetching TMDB media ${mediaId}:`, error.message);
      return null;
    }
  }

  // TheTVDB API
  async getTheTVDBMedia(mediaId, type = 'series') {
    try {
      // First get auth token
      const authData = await this.makeRequest('https://api.thetvdb.com/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        data: {
          apikey: process.env.THETVDB_API_KEY
        }
      });

      const token = authData.token;

      // Then get media data
      const data = await this.makeRequest(`https://api.thetvdb.com/${type}/${mediaId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });

      return data.data;
    } catch (error) {
      console.error(`Error fetching TheTVDB media ${mediaId}:`, error.message);
      return null;
    }
  }
}

module.exports = MediaAPIClient;