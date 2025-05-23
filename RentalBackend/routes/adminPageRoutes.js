// app.use('/api/admin/page', adminPageRoutes);
const express = require('express');
const router = express.Router();
const { authenticate, checkAdmin } = require('../middlewares/authMiddleware');
const { getAllPages, addPage, editPage, deletePage, getPageById, getPageBySlug, editAndNotify } = require('../controllers/adminPageController');
const { getContact, updateContact } = require('../controllers/pageContactController');


router.get('/getPages',authenticate, checkAdmin, getAllPages);
router.get('/getPage/:id',authenticate, checkAdmin, getPageById);

router.post('/addpage', authenticate, checkAdmin, addPage);
router.put('/editpage/:id', authenticate, checkAdmin, editPage);
router.put('/editpageandnotify/:id', authenticate, checkAdmin, editAndNotify);

router.delete('/deletepage/:id', authenticate, checkAdmin, deletePage);
router.get('/getpagebyslug/:slug', getPageBySlug);

router.get('/contact', getContact);
router.put('/contact', authenticate, checkAdmin, updateContact);



module.exports = router;
