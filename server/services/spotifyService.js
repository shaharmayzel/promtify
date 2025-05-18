const axios = require("axios");

async function getSpotifyTrackURI(title, artist, accessToken) {
  try {
    const query = `track:${title} artist:${artist}`;
    const response = await axios.get("https://api.spotify.com/v1/search", {
      params: {
        q: query,
        type: "track",
        limit: 1,
      },
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const track = response.data.tracks.items[0];
    if (track) return { uri: track.uri, url: track.external_urls.spotify };
  } catch {

  }
  return null;
}

module.exports = { getSpotifyTrackURI };
