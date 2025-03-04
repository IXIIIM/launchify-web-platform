import express from 'express';
const router = express.Router();

router.get('/user', (req, res) => {
  res.json({ message: 'User analytics route' });
});

router.get('/platform', (req, res) => {
  res.json({ message: 'Platform analytics route' });
});

export default router;