import express from 'express';
const router = express.Router();

router.post('/profile-image', (req, res) => {
  res.json({ message: 'Upload profile image route' });
});

router.post('/verification-document', (req, res) => {
  res.json({ message: 'Upload verification document route' });
});

export default router;