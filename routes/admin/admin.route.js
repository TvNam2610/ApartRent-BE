import express from 'express';
// Import các hàm từ controller tương ứng
import { getUsers, lockUser, getStatistics } from '../../controllers/user.controller.js'; // Import các hàm từ user.controller.js
import { getAllPackages, getPackageById, createPackage, updatePackage,deletePackage } from '../../controllers/package.controller.js'; // Import các hàm từ package.controller.js
const router = express.Router();

// Route cho dashboard
router.get('/dashboard', (req, res) => {
  res.render('admin/dashboard', { title: 'Admin Dashboard' });
});


router.get('/manage-posts', (req, res) => {
  res.render('admin/postManagement', { title: 'Post Management' });
});



router.get('/user-management', (req, res) => {
  res.render('admin/userManagement', { title: 'User Management' });
});

router.get('/package-management', (req, res) => {
  res.render('admin/packageManagement', { title: 'Package Management' });
});



router.get('/users', getUsers);
router.post('/users/:id/lock', lockUser);

/// package management
router.get('/packages', getAllPackages);
router.get('/packages/:id', getPackageById);
router.post('/packages', createPackage);
router.put('/packages/:id', updatePackage);
router.delete('/packages/:id', deletePackage);

router.get('/statistics',getStatistics);

export default router;
