const express = require('express');
const { pool } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// GET /api/conversations — list all user conversations
router.get('/', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT c.id, c.title, c.created_at, c.updated_at,
              COUNT(m.id) as message_count,
              MAX(m.created_at) as last_message_at
       FROM conversations c
       LEFT JOIN messages m ON m.conversation_id = c.id
       WHERE c.user_id = ?
       GROUP BY c.id
       ORDER BY c.updated_at DESC
       LIMIT 50`,
      [req.user.id]
    );
    res.json({ conversations: rows });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

// GET /api/conversations/:id/messages — get messages for a conversation
router.get('/:id/messages', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    // Verify ownership
    const [conv] = await pool.query(
      'SELECT id, title FROM conversations WHERE id = ? AND user_id = ?',
      [id, req.user.id]
    );
    if (conv.length === 0) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const [messages] = await pool.query(
      `SELECT id, role, content, image_url, image_prompt, model_used, created_at
       FROM messages
       WHERE conversation_id = ?
       ORDER BY created_at ASC`,
      [id]
    );

    res.json({ conversation: conv[0], messages });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// DELETE /api/conversations/:id
router.delete('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await pool.query(
      'DELETE FROM conversations WHERE id = ? AND user_id = ?',
      [id, req.user.id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Conversation not found' });
    }
    res.json({ message: 'Conversation deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete conversation' });
  }
});

// PATCH /api/conversations/:id — rename conversation
router.patch('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { title } = req.body;
  if (!title || title.trim().length === 0) {
    return res.status(400).json({ error: 'Title is required' });
  }
  try {
    const [result] = await pool.query(
      'UPDATE conversations SET title = ? WHERE id = ? AND user_id = ?',
      [title.trim().substring(0, 255), id, req.user.id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Conversation not found' });
    }
    res.json({ message: 'Conversation renamed' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to rename conversation' });
  }
});

module.exports = router;
