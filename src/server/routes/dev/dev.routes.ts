import express from 'express';
const router = express.Router();

router.get('/notifications', (req, res) => {
  res.json({ message: 'Dev notifications route' });
});

router.get('/email-logs', (req, res) => {
  res.json({ message: 'Dev email logs route' });
});

export default router;