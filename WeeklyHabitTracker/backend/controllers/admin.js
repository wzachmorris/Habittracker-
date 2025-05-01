// /backend/controllers/admin.js
const LeaderboardCategory = require('../models/LeaderboardCategory');
const User = require('../models/User');

// Get all categories including inactive ones (for admin review)
exports.getAllCategories = async (req, res) => {
  try {
    console.log('Admin: Fetching all categories including inactive');
    
    // Find all categories (both active and inactive)
    const categories = await LeaderboardCategory.find();
    
    const categoriesWithDetails = categories.map(category => ({
      id: category._id,
      name: category.name,
      emoji: category.emoji,
      description: category.description,
      isActive: category.isActive,
      createdAt: category.createdAt
    }));
    
    res.json(categoriesWithDetails);
  } catch (error) {
    console.error('Error fetching all categories:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Approve a category
exports.approveCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    
    console.log(`Admin: Approving category ${categoryId}`);
    
    // Find the category
    const category = await LeaderboardCategory.findById(categoryId);
    
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    
    // Approve the category
    category.isActive = true;
    await category.save();
    
    res.json({
      message: 'Category approved',
      category: {
        id: category._id,
        name: category.name,
        emoji: category.emoji,
        isActive: category.isActive
      }
    });
  } catch (error) {
    console.error('Error approving category:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Reject and delete a category
exports.rejectCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    
    console.log(`Admin: Rejecting category ${categoryId}`);
    
    // Find and delete the category
    const category = await LeaderboardCategory.findByIdAndDelete(categoryId);
    
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    
    res.json({
      message: 'Category rejected and deleted',
      categoryId: categoryId
    });
  } catch (error) {
    console.error('Error rejecting category:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get admin dashboard stats
exports.getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalCategories = await LeaderboardCategory.countDocuments();
    const pendingCategories = await LeaderboardCategory.countDocuments({ isActive: false });
    
    res.json({
      totalUsers,
      totalCategories,
      pendingCategories
    });
  } catch (error) {
    console.error('Error getting admin stats:', error);
    res.status(500).json({ message: 'Server error' });
  }
};