const express = require("express");
const { getSongsFromAI } = require("../services/openaiService");
const { getSpotifyTrackURI } = require("../services/spotifyService");
const axios = require("axios");

const router = express.Router();

router.post("/", async (req, res) => {
  const { prompt, personalize } = req.body;
  const accessToken = req.headers.authorization?.split(" ")[1];

  if (!prompt || !accessToken) {
    return res.status(400).json({ error: "Missing prompt or access token" });
  }

  let vibePrompt = prompt;

  try {
    const profileRes = await axios.get("https://api.spotify.com/v1/me", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const userId = profileRes.data.id;
    const userCountry = profileRes.data.country;

    if (personalize) {
      const [artistsRes, tracksRes] = await Promise.all([
        axios.get("https://api.spotify.com/v1/me/top/artists", {
          headers: { Authorization: `Bearer ${accessToken}` },
          params: { limit: 5 },
        }),
        axios.get("https://api.spotify.com/v1/me/top/tracks", {
          headers: { Authorization: `Bearer ${accessToken}` },
          params: { limit: 5 },
        }),
      ]);

      const topArtists = artistsRes.data.items.map((a) => a.name).join(", ");
      const topTracks = tracksRes.data.items
        .map((t) => `"${t.name}"`)
        .join(", ");

      vibePrompt = `The user is located in ${userCountry}.
                They personally enjoy artists like ${topArtists}, and their recent favorite tracks include ${topTracks}.

                The following prompt may describe a playlist for themselves or for someone else — for example: children, guests, pets, a themed event, or a mood.

                Use your judgment to balance:
                - The user’s personal taste (when relevant)
                - Cultural appropriateness (especially for kids, local languages, or generational contexts)
                - Genre and setting norms (e.g., gym = energetic/high-BPM, dinner = calm/low-BPM, parties = upbeat/danceable, etc.)
                - Emotional and stylistic cues from the prompt

                Here is the prompt to base the playlist on:
                "${prompt}"

                Return exactly 10 real, relevant songs that match the intent.
                Use this format:
                [
                  { "title": "Song Name", "artist": "Artist Name" },
                  ...
                ]
                Do not include any explanation, comments, or text outside the array.`;
    }

    const aiTracks = await getSongsFromAI(vibePrompt);
    if (!aiTracks.length) throw new Error("No AI tracks returned");

    const createRes = await axios.post(
      `https://api.spotify.com/v1/users/${userId}/playlists`,
      {
        name: `Promptify: ${prompt}`,
        description: personalize
          ? `Prompt: ${prompt} (personalized)`
          : `Prompt: ${prompt}`,
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

    res.json({
      playlist_url: playlistUrl,
      tracks: finalTracks,
      prompt,
      personalize,
    });
  } catch (err) {
    console.error(
      "Playlist generation failed:",
      err.response?.data || err.message
    );
    res.status(500).json({ error: "Failed to generate playlist" });
  }
});

module.exports = router;
