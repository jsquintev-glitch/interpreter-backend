require("dotenv").config();

const express = require("express");
const multer = require("multer");
const cors = require("cors");
const fs = require("fs");

const OpenAI = require("openai");

const app = express();

app.use(cors());

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + ".m4a");
  },
});

const upload = multer({ storage: storage });

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.post("/transcribe", upload.single("audio"), async (req, res) => {
  try {
    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(req.file.path),
      model: "whisper-1",
    });

    const originalText = transcription.text;

    const translation = await openai.responses.create({
      model: "gpt-4o-mini",
      input: `
    You are a professional medical interpreter.

    If the text is in Spanish, translate it into natural professional English.

    If the text is in English, translate it into natural professional Spanish.

    Only return the translated text.

    Text:
    ${originalText}
  `,
});

const translatedText = translation.output_text;

    fs.unlinkSync(req.file.path);

    res.json({
      original: originalText,
      translation: translatedText,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Error processing audio",
    });
  }
});

app.listen(3000, "0.0.0.0", () => {
  console.log("Server running on port 3000");
});