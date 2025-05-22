const express = require("express");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./routes/auth");
const playlistRoutes = require("./routes/playlist");

const app = express();
app.use(cors());
app.use(express.json());


app.use("/auth", authRoutes);
app.use("/generate-playlist", playlistRoutes);

app.listen(8888, () => {
  console.log("Promptify backend running at http://localhost:8888");
});