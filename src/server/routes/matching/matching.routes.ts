import express from 'express';
const router = express.Router();

router.get('/potential', (req, res) => {
  res.json({ message: 'Potential matches route' });
});

router.post('/swipe', (req, res) => {
  res.json({ message: 'Swipe route' });
});

export default router;