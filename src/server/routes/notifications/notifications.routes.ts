import express from 'express';
const router = express.Router();

router.get('/', (req, res) => {
  res.json({ message: 'Get notifications route' });
});

router.post('/mark-read', (req, res) => {
  res.json({ message: 'Mark notifications as read route' });
});

export default router;