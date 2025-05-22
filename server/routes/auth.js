const express = require("express");
const axios = require("axios");
const router = express.Router();

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const REDIRECT_URI = "http://127.0.0.1:8888/auth/callback"; 

router.get("/login", (req, res) => {
  const scope = "playlist-modify-public user-read-private user-top-read";
  const authUrl =
    `https://accounts.spotify.com/authorize` +
    `?response_type=code&client_id=${CLIENT_ID}` +
    `&scope=${encodeURIComponent(scope)}` +
    `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`;
  res.redirect(authUrl);
});

router.get("/callback", async (req, res) => {
  const code = req.query.code;
  if (!code) {
    return res.status(400).send("Missing authorization code.");
  }
  try {
    const response = await axios.post(
      "https://accounts.spotify.com/api/token",
      null,
      {
        params: {
          grant_type: "authorization_code",
          code,
          redirect_uri: REDIRECT_URI,
          client_id: CLIENT_ID,
          client_secret: CLIENT_SECRET,
        },
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    const { access_token, refresh_token } = response.data;
    res.redirect(
      `http://localhost:5173?access_token=${access_token}&refresh_token=${refresh_token}`
    );
  } catch (err) {
    console.error("Error during token exchange:", err.response?.data || err.message);
    res.status(500).send("Auth failed");
  }
});

module.exports = router;