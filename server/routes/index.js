import express from 'express';
const router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.json({
    message: 'API is running'
  });
});

export default router;
