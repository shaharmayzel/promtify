const express = require("express");
const { getSongsFromAI } = require("../services/openaiService");
const { getSpotifyTrackURI } = require("../services/spotifyService");
const axios = require("axios");

const router = express.Router();

router.post("/", async (req, res) => {
  const { prompt } = req.body;
  const accessToken = req.headers.authorization?.split(" ")[1];

  if (!prompt || !accessToken) {
    return res.status(400).json({ error: "Missing prompt or access token" });
  }

  try {
    const aiTracks = await getSongsFromAI(prompt);
    if (!aiTracks.length) throw new Error("No AI tracks returned");

    const userRes = await axios.get("https://api.spotify.com/v1/me", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const userId = userRes.data.id;

    const createRes = await axios.post(
      `https://api.spotify.com/v1/users/${userId}/playlists`,
      {
        name: `Promptify: ${prompt}`,
        description: "AI-generated playlist from a vibe prompt",
        public: true,
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    const playlistId = createRes.data.id;
    const playlistUrl = createRes.data.external_urls.spotify;

    const trackURIs = [];
    const finalTracks = [];

    for (const { title, artist } of aiTracks) {
      const found = await getSpotifyTrackURI(title, artist, accessToken);
      if (found) {
        trackURIs.push(found.uri);
        finalTracks.push({ title, artist, spotify_url: found.url });
      }
    }

    if (!trackURIs.length) throw new Error("No valid songs found");

    await axios.post(
      `https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
      { uris: trackURIs },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    res.json({ playlist_url: playlistUrl, tracks: finalTracks });
  } catch (err) {
    res.status(500).json({ error: "Failed to generate playlist" });
  }
});

module.exports = router;
