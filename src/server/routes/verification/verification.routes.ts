import express from 'express';
const router = express.Router();

router.post('/request', (req, res) => {
  res.json({ message: 'Request verification route' });
});

router.get('/status', (req, res) => {
  res.json({ message: 'Verification status route' });
});

export default router;