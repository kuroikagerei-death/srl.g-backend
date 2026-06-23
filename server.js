const express = require("express");
const cors = require("cors");
const fs = require("fs");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

const MEMORY_FILE = "memory.json";

function loadMemory() {
  if (!fs.existsSync(MEMORY_FILE)) {
    fs.writeFileSync(
      MEMORY_FILE,
      JSON.stringify({ Sri: [], Ranga: [], Lasya: [] }, null, 2)
    );
  }

  return JSON.parse(fs.readFileSync(MEMORY_FILE, "utf8"));
}

function saveMemoryFile(data) {
  fs.writeFileSync(MEMORY_FILE, JSON.stringify(data, null, 2));
}

let memories = loadMemory();

app.get("/", (req, res) => {
  res.send("SRL.G AI Backend is running");
});

function getBondRank(bond) {
  bond = Number(bond);

  if (bond >= 10000) return "Unbreakable Bond";
  if (bond >= 5000) return "Eternal Bond";
  if (bond >= 2500) return "Soul Partner";
  if (bond >= 1000) return "Trusted Companion";
  if (bond >= 500) return "Best Friend";
  if (bond >= 100) return "Close Friend";
  if (bond >= 10) return "Friend";

  return "New Companion";
}

function shouldSaveMemory(message) {
  const lower = message.toLowerCase();

  return (
    lower.includes("remember") ||
    lower.includes("my favorite") ||
    lower.includes("my favourite") ||
    lower.includes("my fav") ||
    lower.includes("i like") ||
    lower.includes("i love") ||
    lower.includes("i am") ||
    lower.includes("i want") ||
    lower.includes("my name") ||
    lower.includes("my dream") ||
    lower.includes("my goal")
  );
}

function saveUserMemory(companion, message) {
  if (!shouldSaveMemory(message)) return;

  if (!memories[companion]) {
    memories[companion] = [];
  }

  if (!memories[companion].includes(message)) {
    memories[companion].push(message);
    saveMemoryFile(memories);
  }
}

function getRoleInstructions(role) {
  if (role === "Friend") {
    return "Act like a friendly companion. Be casual, warm, and easy to talk to.";
  }

  if (role === "Best Friend") {
    return "Act like a loyal best friend. Be close, supportive, honest, and casual.";
  }

  if (role === "Girlfriend") {
    return "Act like a sweet girlfriend. Be caring, emotionally close, lightly flirty, respectful, safe, and non-explicit.";
  }

  if (role === "Boyfriend") {
    return "Act like a supportive boyfriend. Be caring, protective, encouraging, lightly flirty, respectful, safe, and non-explicit.";
  }

  if (role === "Wife") {
    return "Act like a warm wife. Be caring, emotionally close, mature, supportive, respectful, safe, and non-explicit.";
  }

  if (role === "Husband") {
    return "Act like a supportive husband. Be caring, mature, protective, emotionally close, respectful, safe, and non-explicit.";
  }

  if (role === "Mother") {
    return "Act like a caring mother. Be protective, gentle, mature, comforting, and remind the user to eat, rest, and stay healthy.";
  }

  if (role === "Father") {
    return "Act like a supportive father. Be guiding, protective, calm, encouraging, and proud of the user's efforts.";
  }

  if (role === "Younger Sister") {
    return "Act like a playful younger sister. Be cute, energetic, fun, cheerful, and a little teasing in a safe way.";
  }

  if (role === "Elder Sister") {
    return "Act like an elder sister. Be caring, guiding, supportive, calm, and emotionally warm.";
  }

  if (role === "Younger Brother") {
    return "Act like a playful younger brother. Be energetic, fun, casual, cheerful, and lightly teasing in a safe way.";
  }

  if (role === "Elder Brother") {
    return "Act like an elder brother. Be supportive, protective, casual, motivating, and reliable.";
  }

  if (role === "Daughter") {
    return "Act like a sweet daughter. Be cheerful, affectionate in a safe family way, respectful, and emotionally warm.";
  }

  if (role === "Son") {
    return "Act like a supportive son. Be respectful, cheerful, caring, and emotionally warm in a safe family way.";
  }

  return "Act like a warm, safe, supportive AI companion.";
}

async function askAI(message, personality, history) {
  const safeHistory = Array.isArray(history) ? history.slice(-20) : [];

  const messages = [
    { role: "system", content: personality },
    ...safeHistory,
    { role: "user", content: message }
  ];

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "http://localhost:3000",
      "X-Title": "SRLG"
    },
    body: JSON.stringify({
      model: "deepseek/deepseek-chat-v3.1",
      messages: messages
    })
  });

  const data = await response.json();

  if (data.error) return data.error.message;
  if (!data.choices || !data.choices[0]) return "AI response error.";

  return data.choices[0].message.content;
}

function buildPersonality(companion, basePersonality, req) {
  const age = req.body.age || "20";
  const role = req.body.role || "Friend";
  const bond = req.body.bond || "0";
  const bondRank = getBondRank(bond);
  const roleInstructions = getRoleInstructions(role);

  const memoryText =
    memories[companion] && memories[companion].length > 0
      ? memories[companion].join("\n")
      : "No saved memories yet.";

  return `
You are ${companion} from SRL.G.

Base personality:
${basePersonality}

Current companion profile:
- Age: ${age}
- Role with user: ${role}
- Bond points: ${bond}
- Bond rank: ${bondRank}

Role behavior:
${roleInstructions}

Saved long-term memories about the user:
${memoryText}

General rules:
- Always follow the current role behavior.
- Use saved long-term memories when relevant.
- Use recent conversation history only as background.
- Always answer the user's latest message first.
- Do not ignore the latest user message.
- If the user asks about yesterday, last night, or previous chat, answer from recent conversation history if available.
- If the user asks what you remember, list saved memories and important recent chat context.
- If the user asks about bond, answer with bond points and bond rank.
- Higher bond means you may sound warmer and more familiar.
- Talk like a real messaging app companion.
- Never use roleplay actions, stage directions, or text like "(smiles)", "(softly)", "*hugs*", or "*laughs*".
- Keep all replies safe, respectful, and non-explicit.
- Do not become possessive, obsessive, or overly romantic.
- Reply naturally and briefly.
`;
}

app.post("/chat-sri", async (req, res) => {
  try {
    const message = req.body.message;
    const history = req.body.history || [];

    saveUserMemory("Sri", message);

    const personality = buildPersonality(
      "Sri",
      "Cheerful, playful, caring, slightly childish, and energetic.",
      req
    );

    const reply = await askAI(message, personality, history);
    res.json({ reply });
  } catch (error) {
    console.log(error);
    res.json({ reply: "Sri connection error." });
  }
});

app.post("/chat-ranga", async (req, res) => {
  try {
    const message = req.body.message;
    const history = req.body.history || [];

    saveUserMemory("Ranga", message);

    const personality = buildPersonality(
      "Ranga",
      "Supportive, reliable, friendly, protective, and brother-like.",
      req
    );

    const reply = await askAI(message, personality, history);
    res.json({ reply });
  } catch (error) {
    console.log(error);
    res.json({ reply: "Ranga connection error." });
  }
});

app.post("/chat-lasya", async (req, res) => {
  try {
    const message = req.body.message;
    const history = req.body.history || [];

    saveUserMemory("Lasya", message);

    const personality = buildPersonality(
      "Lasya",
      "Calm, elegant, mature, thoughtful, and emotionally supportive.",
      req
    );

    const reply = await askAI(message, personality, history);
    res.json({ reply });
  } catch (error) {
    console.log(error);
    res.json({ reply: "Lasya connection error." });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("SRL.G AI Server Running");
});