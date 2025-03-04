import express from 'express';
const router = express.Router();

router.get('/current', (req, res) => {
  res.json({ message: 'Current usage route' });
});

router.get('/limits', (req, res) => {
  res.json({ message: 'Usage limits route' });
});

export default router;