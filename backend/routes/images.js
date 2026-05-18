const express = require('express');
const OpenAI = require('openai');
const axios = require('axios');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { pool } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
require('dotenv').config();

const router = express.Router();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '..', process.env.UPLOAD_DIR || 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// POST /api/images/generate
router.post('/generate', authenticateToken, async (req, res) => {
  const { prompt, conversationId, size = '1024x1024', quality = 'standard' } = req.body;

  if (!prompt || prompt.trim().length === 0) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  if (prompt.length > 1000) {
    return res.status(400).json({ error: 'Prompt too long (max 1000 characters)' });
  }

  let convId = conversationId;

  try {
    // Create or verify conversation
    if (!convId) {
      const title = prompt.length > 60 ? prompt.substring(0, 57) + '...' : prompt;
      const [result] = await pool.query(
        'INSERT INTO conversations (user_id, title) VALUES (?, ?)',
        [req.user.id, title]
      );
      convId = result.insertId;
    } else {
      const [rows] = await pool.query(
        'SELECT id FROM conversations WHERE id = ? AND user_id = ?',
        [convId, req.user.id]
      );
      if (rows.length === 0) {
        return res.status(404).json({ error: 'Conversation not found' });
      }
    }

    // Save user message
    const [userMsgResult] = await pool.query(
      'INSERT INTO messages (conversation_id, user_id, role, content) VALUES (?, ?, ?, ?)',
      [convId, req.user.id, 'user', prompt]
    );

    // Generate image with OpenAI gpt-image-2
    console.log(`🎨 Generating image for prompt: "${prompt.substring(0, 50)}..."`);

    const response = await openai.images.generate({
      model: 'gpt-image-1',
      prompt: prompt.trim(),
      n: 1,
      size: size,
      quality: quality,
    });

    let imageLocalPath = null;
    let imageUrl = null;
    let base64Data = null;

    // Handle response - gpt-image-2 may return b64_json or url
    if (response.data[0].b64_json) {
      base64Data = response.data[0].b64_json;
    } else if (response.data[0].url) {
      // Download the image from URL
      const imgResponse = await axios.get(response.data[0].url, {
        responseType: 'arraybuffer',
        timeout: 30000,
      });
      base64Data = Buffer.from(imgResponse.data).toString('base64');
    }

    if (base64Data) {
      // Save image to uploads folder
      const filename = `${uuidv4()}.png`;
      const filePath = path.join(uploadsDir, filename);
      fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));
      imageLocalPath = `/uploads/${filename}`;

      // Build public URL
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      imageUrl = `${baseUrl}${imageLocalPath}`;
    }

    // Save assistant message with image info
    const [assistantMsgResult] = await pool.query(
      `INSERT INTO messages (conversation_id, user_id, role, content, image_url, image_prompt, model_used)
       VALUES (?, ?, 'assistant', ?, ?, ?, ?)`,
      [
        convId,
        req.user.id,
        `I've generated an image based on your prompt: "${prompt}"`,
        imageUrl,
        prompt,
        'gpt-image-1',
      ]
    );

    // Update conversation timestamp
    await pool.query(
      'UPDATE conversations SET updated_at = NOW() WHERE id = ?',
      [convId]
    );

    res.json({
      conversationId: convId,
      imageUrl,
      imageLocalPath,
      prompt,
      userMessageId: userMsgResult.insertId,
      assistantMessageId: assistantMsgResult.insertId,
      model: 'gpt-image-1',
    });
  } catch (error) {
    console.error('Image generation error:', error);

    if (error?.status === 400) {
      return res.status(400).json({
        error: 'Invalid prompt. Please try a different description.',
        details: error.message,
      });
    }
    if (error?.status === 401) {
      return res.status(500).json({ error: 'OpenAI API key invalid or missing' });
    }
    if (error?.status === 429) {
      return res.status(429).json({ error: 'Rate limit reached. Please wait a moment.' });
    }
    if (error?.status === 400 && error.message?.includes('safety')) {
      return res.status(400).json({
        error: 'Content policy violation. Please revise your prompt.',
      });
    }

    res.status(500).json({
      error: 'Failed to generate image. Please try again.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

module.exports = router;
