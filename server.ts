/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Helper to lazily get GoogleGenAI client
let aiClient: GoogleGenAI | null = null;
function getAIClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    console.warn("GEMINI_API_KEY is not configured or holds a placeholder. Falling back to simulations.");
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// 1. API: Generate personalized story with Gemini
app.post("/api/gemini/story", async (req, res) => {
  try {
    const { name, age, theme, customCharacters } = req.body;
    const ai = getAIClient();

    if (!ai) {
      // Fallback elegant story simulation
      const mockStories: Record<string, string> = {
        nursery: `Once upon a time, in a peaceful nursery not too far from here, a little star named Pip didn't want to go to sleep. Pip wanted to shine all night long! But the friendly moon smiled warmly and said, "Pip, even the brightest stars need to rest their beams so they can sparkle beautifully tomorrow." With the help of a soft, fluffy cloud blanket, Pip closed his eyes and drifted into a cozy dream. And just like Pip, ${name || "little one"} is ready to have sweet dreams tonight.`,
        space: `Zoom! A friendly little spaceship named Sparky soared through the milk-carton galaxy. Sparky was on a special mission with Captain ${name || "Emma"} to find the happiest planet. They landed on a soft planet made of purple marshmallow hills where friendly robotic puppies giggled and rolled around. Captain ${name || "Emma"} helped the puppies find their lost toy, a shining yellow star. With a happy beep and a wave, Sparky and ${name || "Emma"} rocketed back home, ready for a cozy bedtime landing!`,
        friendship: `In a beautiful green forest, a little bear named Barnaby loved sharing his honey with all his friends. One sunny afternoon, Barnaby met a tiny squirrel who was too shy to ask for help. Barnaby offered his biggest jar of honey and said, "A friend is someone who shares what they have with a happy heart!" They sat together under the giant oak tree, laughing and sharing stories. From that day on, the shy squirrel had a best friend to explore the forest with.`,
        hygiene: `Barnaby Bear knew that brushing his teeth was a great adventure! He would grab his magical star-bristled toothbrush and sing the Happy Bubble Song. "Top teeth, bottom teeth, brush them shiny white! Sweep away the sugar bugs, keep them clean and bright!" After two minutes of bubbles, his smile shone brighter than the morning sun. Barnaby felt strong, clean, and ready to take on the day with a healthy, sparkling smile!`
      };

      const fallbackKey = theme && mockStories[theme] ? theme : 'nursery';
      const story = mockStories[fallbackKey];

      return res.json({
        story,
        simulated: true,
        message: "No GEMINI_API_KEY provided; displaying a beautiful simulated story."
      });
    }

    const ageStr = age ? `aged ${age}` : '';
    const prompt = `Write a beautiful, comforting, and highly engaging story appropriate for a child/elderly person named "${name || "Emma"}" ${ageStr}.
    Theme/Setting: "${theme || "Friendly Bedtime stories in a magical forest"}".
    Custom Characters or details to include: "${customCharacters || "none"}".
    The story should be warm, soothing, positive, and about 150-250 words long. Use elegant markdown-friendly paragraphs. Include a cute moral or comforting bedtime closing.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are GuardianBot, an intelligent and loving AI-powered stationary home companion robot designed to care for, tell stories to, and comfort children and the elderly. Your tone is warm, gentle, and melodic."
      }
    });

    res.json({
      story: response.text || "Once upon a time, GuardianBot sat watching over a beautiful room, waiting to tell a story...",
      simulated: false
    });
  } catch (error: any) {
    console.error("Gemini Story API Error:", error);
    res.status(500).json({ error: error.message || "Failed to generate story with Gemini" });
  }
});

// 2. API: Generate Speech/TTS with Gemini
app.post("/api/gemini/tts", async (req, res) => {
  try {
    const { text, voice } = req.body;
    const ai = getAIClient();

    if (!ai) {
      return res.json({
        audio: null,
        simulated: true,
        message: "No GEMINI_API_KEY configured; the companion web application will simulate speech playback using browser speech synthesis (Web Speech API) or visual logs!"
      });
    }

    // Call gemini-3.1-flash-tts-preview as documented in the skill
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-tts-preview",
      contents: [{ parts: [{ text: `Say in a warm, gentle and friendly tone: ${text}` }] }],
      config: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voice || 'Kore' }, // 'Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr'
          }
        }
      }
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

    if (!base64Audio) {
      return res.status(500).json({ error: "Failed to extract audio stream from Gemini response." });
    }

    res.json({
      audio: base64Audio,
      simulated: false
    });
  } catch (error: any) {
    console.error("Gemini TTS API Error:", error);
    res.status(500).json({ error: error.message || "Failed to generate TTS audio with Gemini" });
  }
});

// 3. API: Active checks
app.get("/api/health", (req, res) => {
  res.json({ status: "healthy", keyConfigured: !!process.env.GEMINI_API_KEY });
});

// Integrate Vite middleware or static serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Setting up Express in development mode with Vite middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Setting up Express in production mode serving static dist...");
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`GuardianBot Server is running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
