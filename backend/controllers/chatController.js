const pool = require('../config/db');
const { GoogleGenAI } = require('@google/genai');

const getMessages = async (req, res) => {
  try {
    const userId = req.user.id;
    const role = req.user.role;
    let roomId = userId;

    // If admin or super_admin, they can query a specific citizen's room_id
    if ((role === 'admin' || role === 'super_admin') && req.query.room_id) {
      roomId = parseInt(req.query.room_id);
    }

    const [messages] = await pool.query(
      `SELECT cm.*, u.name as sender_name 
       FROM chat_messages cm 
       JOIN users u ON cm.sender_id = u.id 
       WHERE cm.room_id = ? 
       ORDER BY cm.created_at ASC`,
      [roomId]
    );

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const sendMessage = async (req, res) => {
  try {
    const senderId = req.user.id;
    const role = req.user.role;
    const { message } = req.body;
    let roomId = senderId;

    if (!message || !message.trim()) {
      return res.status(400).json({ message: 'Message is required' });
    }

    // If admin/super_admin, they must specify which room_id (citizen's user_id) they are sending to
    const isAdmin = role === 'admin' || role === 'super_admin';
    if (isAdmin) {
      if (!req.body.room_id) {
        return res.status(400).json({ message: 'room_id is required for admin replies' });
      }
      roomId = parseInt(req.body.room_id);
    }

    const isAdminReply = isAdmin ? 1 : 0;

    await pool.query(
      'INSERT INTO chat_messages (sender_id, room_id, message, is_admin_reply) VALUES (?, ?, ?, ?)',
      [senderId, roomId, message, isAdminReply]
    );

    res.status(201).json({ message: 'Message sent successfully' });

    // AI Bot auto-reply logic for citizen messages
    if (!isAdmin) {
      setTimeout(async () => {
        try {
          // Check if the latest message is still from the citizen
          const [latestMsgs] = await pool.query(
            'SELECT is_admin_reply FROM chat_messages WHERE room_id = ? ORDER BY id DESC LIMIT 1',
            [roomId]
          );

          // If the last message is NOT from an admin, trigger the AI
          if (latestMsgs.length > 0 && latestMsgs[0].is_admin_reply === 0) {
            const [botUsers] = await pool.query("SELECT id FROM users WHERE email = 'bot@laporpak.id'");
            if (botUsers.length > 0 && process.env.GEMINI_API_KEY) {
              const botId = botUsers[0].id;
              
              const aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
              const prompt = `Anda adalah 'Bot LaporPak', asisten cerdas untuk platform pengaduan masyarakat LaporPak. Anda HANYA boleh menjawab atau menanggapi hal-hal yang berkaitan dengan pengaduan masyarakat, infrastruktur, layanan publik, atau cara menggunakan aplikasi LaporPak.

PESAN PENGGUNA: "${message}"

ATURAN PENTING:
1. Jika pesan pengguna DI LUAR KONTEKS pengaduan masyarakat atau LaporPak (misalnya: coding, game, cuaca, hiburan, pertanyaan umum acak), TOLAK dengan sopan. Katakan bahwa Anda hanya dapat membantu seputar layanan LaporPak.
2. Jika pesan adalah pengaduan/keluhan yang valid, beri tahu bahwa tim admin sedang offline dan laporan mereka telah tercatat.
3. Jawab dengan ramah, maksimal 2 paragraf singkat.`;
              
              const aiResponse = await aiClient.models.generateContent({
                  model: 'gemini-2.5-flash',
                  contents: prompt,
              });
              
              const botReply = aiResponse.text || "Halo! Pesan Anda telah kami terima dan akan segera ditindaklanjuti oleh petugas terkait. Terima kasih!";
              
              await pool.query(
                'INSERT INTO chat_messages (sender_id, room_id, message, is_admin_reply) VALUES (?, ?, ?, 1)',
                [botId, roomId, botReply]
              );
            } else {
              console.log("Bot user or GEMINI_API_KEY missing");
            }
          }
        } catch (botErr) {
          console.error("Bot auto-reply error:", botErr.message);
        }
      }, 5000); // 5 seconds timeout
    }

  } catch (error) {
    if (!res.headersSent) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
};

const getRooms = async (req, res) => {
  try {
    const role = req.user.role;
    if (role !== 'admin' && role !== 'super_admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Get all unique rooms (users who have sent/received messages)
    // and grab their details + the latest message in that room.
    const [rooms] = await pool.query(
      `SELECT u.id as room_id, u.name as user_name, u.email as user_email, u.profile_image as user_profile_image,
              cm.message as last_message, cm.created_at as last_message_time,
              cm.is_admin_reply
       FROM users u
       JOIN (
         SELECT room_id, MAX(id) as max_id
         FROM chat_messages
         GROUP BY room_id
       ) latest ON u.id = latest.room_id
       JOIN chat_messages cm ON latest.max_id = cm.id
       ORDER BY cm.created_at DESC`
    );

    res.json(rooms);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { getMessages, sendMessage, getRooms };
