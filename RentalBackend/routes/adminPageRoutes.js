// app.use('/api/admin/page', adminPageRoutes);
const express = require('express');
const router = express.Router();
const { authenticate, checkAdmin } = require('../middlewares/authMiddleware');
const { getAllPages } = require('../controllers/adminPageController');


router.get('/getPages',authenticate, checkAdmin, getAllPages);


module.exports = router;
