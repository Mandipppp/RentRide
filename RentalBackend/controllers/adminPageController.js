const Page = require('../models/page');
const nodemailer = require('nodemailer');
const Notification = require('../models/notification');
const User = require('../models/user'); 
const Owner = require('../models/owner');  

// Controller function to fetch all pages
exports.getAllPages = async (req, res) => {
  try {
    const { title, slug } = req.query;
    // console.log(title);

    // Construct a query object
    let query = {};

    if (title || slug) {
      query.$or = [];
      if (title) {
        query.$or.push({ title: { $regex: title, $options: 'i' } });
      }
      if (slug) {
        query.$or.push({ slug: { $regex: slug, $options: 'i' } });
      }
    }   

    // Fetch all pages from the database
    const pages = await Page.find(query).sort({ updatedAt: -1 });

    // Send the pages as a response
    res.status(200).json({
      success: true,
      data: pages,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Server error, unable to fetch pages',
    });
  }
};


// Controller function to add a new page
exports.addPage = async (req, res) => {
    try {
      const { title, slug, content } = req.body;
  
      // Check if all required fields are provided
      if (!title || !slug || !content) {
        return res.status(400).json({
          success: false,
          message: 'Title, slug, and content are required.',
        });
      }
  
      // Check if the page with the same slug or title already exists
      const existingPage = await Page.findOne({ $or: [{ title }, { slug }] });
      if (existingPage) {
        return res.status(400).json({
          success: false,
          message: 'A page with the same title or slug already exists.',
        });
      }
  
      // Create a new page
      const newPage = new Page({
        title,
        slug,
        content,
        lastUpdatedBy: req.user.id,
      });
  
      // Save the new page to the database
      const savedPage = await newPage.save();
  
      // Send the newly created page as a response
      res.status(201).json({
        success: true,
        data: savedPage,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({
        success: false,
        message: 'Server error, unable to add the page.',
      });
    }
  };

  // Controller function to edit a page
exports.editPage = async (req, res) => {
    try {
      const { title, slug, content } = req.body;
      const { id } = req.params;
  
      // Find the page by id
      const page = await Page.findById(id);
  
      if (!page) {
        return res.status(404).json({
          success: false,
          message: 'Page not found.',
        });
      }
  
      // Check if any required fields are missing
      if (!title && !slug && !content) {
        return res.status(400).json({
          success: false,
          message: 'Please provide at least one field to update.',
        });
      }
  
      const existingPage = await Page.findOne({
        $or: [{ title }, { slug }],
        _id: { $ne: id },
      });
      if (existingPage) {
        return res.status(400).json({
          success: false,
          message: 'A page with the same title or slug already exists.',
        });
      }
  
      if (title) page.title = title;
      if (slug) page.slug = slug;
      if (content) page.content = content;
      page.lastUpdatedBy = req.user.id;
      page.updatedAt = Date.now();
  
      
      const updatedPage = await page.save();
  
      res.status(200).json({
        success: true,
        data: updatedPage,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({
        success: false,
        message: 'Server error, unable to update the page.',
      });
    }
  };
  
   // Controller function to edit a page
exports.editAndNotify = async (req, res) => {
  try {
    const { title, slug, content } = req.body;
    const { id } = req.params;

    // Find the page by id
    const page = await Page.findById(id);

    if (!page) {
      return res.status(404).json({
        success: false,
        message: 'Page not found.',
      });
    }

    // Check if any required fields are missing
    if (!title && !slug && !content) {
      return res.status(400).json({
        success: false,
        message: 'Please provide at least one field to update.',
      });
    }

    const existingPage = await Page.findOne({
      $or: [{ title }, { slug }],
      _id: { $ne: id },
    });
    if (existingPage) {
      return res.status(400).json({
        success: false,
        message: 'A page with the same title or slug already exists.',
      });
    }

    if (title) page.title = title;
    if (slug) page.slug = slug;
    if (content) page.content = content;
    page.lastUpdatedBy = req.user.id;
    page.updatedAt = Date.now();

    
    const updatedPage = await page.save();
     // Notify all users and owners
     const notificationMessage = `The page "${title || page.title}" has been updated.`;
      // Prepare notification data for all users and owners
    const notificationData = [];

    // Add notifications for all Users
    const allUsers = await User.find();  // Fetch all users
    allUsers.forEach(user => {
      notificationData.push({
        recipientId: user._id,
        recipientModel: 'User',
        message: notificationMessage,
        type: 'system',
        priority: 'medium',
      });
    });

     // Add notifications for all Owners
     const allOwners = await Owner.find();  // Fetch all owners
     allOwners.forEach(owner => {
       notificationData.push({
         recipientId: owner._id,
         recipientModel: 'Owner',
         message: notificationMessage,
         type: 'system',
         priority: 'medium',
       });
     });

      // Create notifications in the database
    await Notification.insertMany(notificationData);

    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: process.env.EMAIL_USER, 
        pass: process.env.EMAIL_PASS,
      },
    });
    // Construct email message
    const emailMessage = {
      from: 'your-email@gmail.com',
      subject: 'Page Updated',
      text: notificationMessage,
    };
    // Send emails to all Users
    for (const user of allUsers) {
      if (user.email) {
        emailMessage.to = user.email;
        await transporter.sendMail(emailMessage);
      }
    }

    // Send emails to all Owners
    for (const owner of allOwners) {
      if (owner.email) {
        emailMessage.to = owner.email;
        await transporter.sendMail(emailMessage);
      }
    }

     

    res.status(200).json({
      success: true,
      data: updatedPage,
      message: 'Page updated and notifications sent to all users and owners.',
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Server error, unable to update the page and send notifications.',
    });
  }
};

  // Controller function to delete a page
exports.deletePage = async (req, res) => {
    try {
      const { id } = req.params;
  
      // Find the page by id
      const page = await Page.findByIdAndDelete(id);
  
      if (!page) {
        return res.status(404).json({
          success: false,
          message: 'Page not found.',
        });
      }
  
      // Send success response
      res.status(200).json({
        success: true,
        message: 'Page deleted successfully.',
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({
        success: false,
        message: 'Server error, unable to delete the page.',
      });
    }
  };
  

  // Controller function to get a page by ID
exports.getPageById = async (req, res) => {
    try {
      const { id } = req.params;
  
      // Find the page by its ID
      const page = await Page.findById(id);
  
      if (!page) {
        return res.status(404).json({
          success: false,
          message: 'Page not found.',
        });
      }
  
      // Send the found page as a response
      res.status(200).json({
        success: true,
        data: page,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({
        success: false,
        message: 'Server error, unable to fetch the page.',
      });
    }
  };
  

  exports.getPageBySlug = async (req, res) => {
    try {
      const {slug} = req.params;
      // console.log(slug);
      const page = await Page.findOne({ slug: slug});
  
      if (!page) return res.status(404).json({
        success: false, 
        message: 'Page not found',
      });
  
      res.status(200).json({
        success: true,
        data: page,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        message: 'Server error, unable to fetch the page.',
      });
    }
  };
  