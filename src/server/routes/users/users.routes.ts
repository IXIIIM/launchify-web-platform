import express from 'express';
const router = express.Router();

router.get('/profile', (req, res) => {
  res.json({ message: 'Profile route' });
});

router.put('/profile', (req, res) => {
  res.json({ message: 'Update profile route' });
});

export default router;