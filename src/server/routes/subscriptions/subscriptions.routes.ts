import express from 'express';
const router = express.Router();

router.get('/current', (req, res) => {
  res.json({ message: 'Current subscription route' });
});

router.post('/create', (req, res) => {
  res.json({ message: 'Create subscription route' });
});

export default router;