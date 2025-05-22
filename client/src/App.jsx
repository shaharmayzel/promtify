import { useEffect, useState } from "react";

export default function App() {
  const [accessToken, setAccessToken] = useState(null);
  const [prompt, setPrompt] = useState("");
  const [playlistUrl, setPlaylistUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [personalize, setPersonalize] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("access_token");

    if (token) {
      localStorage.setItem("access_token", token);
      setAccessToken(token);
      window.history.replaceState({}, document.title, "/");
    } else {
      const storedToken = localStorage.getItem("access_token");
      if (storedToken) {
        setAccessToken(storedToken);
      }
    }
  }, []);

  const handleLogin = () => {
    if (!accessToken) {
      window.location.href = "http://localhost:8888/auth/login";
    }
  };

  const handleGenerate = async () => {
    if (!prompt) return alert("Please enter a prompt!");

    setLoading(true);
    setPlaylistUrl(null);

    try {
      const res = await fetch("http://localhost:8888/generate-playlist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ prompt, personalize }),
      });

      const data = await res.json();

      if (data.playlist_url) {
        setPlaylistUrl(data.playlist_url);
      } else {
        alert("Failed to generate playlist.");
      }
    } catch (err) {
      console.error(err);
      alert("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black to-gray-900 text-white flex items-center justify-center px-4">
      <div className="text-center space-y-6 max-w-md w-full">
        <h1 className="text-5xl font-bold">🎧 Promptify</h1>
        <p className="text-lg text-gray-300">
          Turn your vibes into Spotify playlists
        </p>

        {!accessToken ? (
          <button
            onClick={handleLogin}
            className="bg-green-500 hover:bg-green-400 text-black px-6 py-3 rounded-full font-semibold transition"
          >
            Log in with Spotify
          </button>
        ) : (
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Describe your vibe..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full px-4 py-2 rounded bg-gray-800 border border-gray-600 placeholder-gray-400"
            />
            <label className="flex items-center space-x-2 text-sm text-gray-300">
              <input
                type="checkbox"
                checked={personalize}
                onChange={() => setPersonalize(!personalize)}
                className="form-checkbox h-4 w-4 text-purple-500"
              />
              <span>Personalize to My Taste</span>
            </label>
            <button
              onClick={handleGenerate}
              className="bg-purple-500 hover:bg-purple-400 text-white px-6 py-2 rounded-full font-medium transition disabled:opacity-50"
              disabled={loading}
            >
              {loading ? "Creating..." : "Generate Playlist"}
            </button>

            {playlistUrl && (
              <div className="pt-4">
                <a
                  href={playlistUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-green-400 underline"
                >
                  🎶 View Your Playlist
                </a>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
