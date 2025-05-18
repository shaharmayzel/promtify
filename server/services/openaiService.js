const { OpenAI } = require("openai");
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function getSongsFromAI(prompt) {
  const completion = await openai.chat.completions.create({
    model: "gpt-4-turbo",
    messages: [
      {
        role: "system",
        content: `You are a music expert. Given a vibe prompt, return exactly 10 songs as a JSON array like:
        [{"title": "Song Name", "artist": "Artist Name"}]
        ONLY return the JSON array. No extra explanation.`,
      },
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  const raw = completion.choices[0].message.content.trim();

  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

module.exports = { getSongsFromAI };
