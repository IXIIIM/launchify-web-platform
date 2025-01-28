import express from 'express';
const router = express.Router();

router.get('/:matchId', (req, res) => {
  res.json({ message: 'Get messages route' });
});

router.post('/:matchId', (req, res) => {
  res.json({ message: 'Send message route' });
});

export default router;