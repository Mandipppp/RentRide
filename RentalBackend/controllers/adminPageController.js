const Page = require('../models/page');

// Controller function to fetch all pages
exports.getAllPages = async (req, res) => {
  try {
    const { title } = req.query;
    // console.log(title);

    // Construct a query object
    let query = {};

    // If title is provided, filter pages by title (case-insensitive search)
    if (title) {
      query.title = { $regex: title, $options: 'i' };  // 'i' for case-insensitive match
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
