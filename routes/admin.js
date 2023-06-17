const router = require('express').Router();
const adminController = require('../controllers/adminController')
const userController = require('../controllers/userController')
const categoryController = require('../controllers/categoryController')
const productController = require('../controllers/productController')
const orderController = require('../controllers/orderControllers')
const couponController = require('../controllers/couponController')
const bannerController = require('../controllers/bannerController')
const  { uploadCategory , uploadProduct , uploadBanner}  = require('../middlewares/multer')
// const bcrypt = require('bcrypt')
// const Admin = require('../models/adminModel')

/* GET home page. */
router.get('/', isLogged, adminController.dashboard);
router.get('/get-chart-data', isLogged, orderController.getChartData)
router.get('/get-pie-data', isLogged, orderController.getPieChart)
router.get('/get-week-chart', isLogged, orderController.getWeekChart)

/* Users  */
router.get('/users', isLogged, userController.users);
router.get('/users/:id', isLogged,  userController.userControl)

/* Category */
router.get('/category', isLogged, categoryController.categories);
router.get('/category/add-category', isLogged, categoryController.addCategory)
router.post('/category/add-category', isLogged, uploadCategory.single('categoryimage'), categoryController.postAddCategory)
router.delete('/category/delete', isLogged, categoryController.deleteCategory)
router.get('/category/edit/:id', isLogged, categoryController.editCategory)
router.put('/category/edit/:id', isLogged, uploadCategory.single('categoryimage'), categoryController.putCategory)

/* Products */
router.get('/products', isLogged, productController.products);
router.get('/products/add-products', isLogged, productController.addProduct)
router.post('/products/add-product', isLogged, uploadProduct.array('images', 5), productController.postAddProduct)
router.get('/products/edit-product', isLogged,productController.editProduct )
router.post('/products/edit-product/:id', isLogged, uploadProduct.array('images', 5), productController.postEditProduct)
router.get('/products/productstatus', isLogged, productController.changeProductStatus)

/* Promo Codes */
router.get('/coupon', isLogged, couponController.getCoupons)
router.get('/add-coupon', isLogged, couponController.getAddCoupon)
router.put('/generate-coupon', isLogged, couponController.putGenerate)
router.post('/add-coupon', isLogged, couponController.postAddCoupon)
router.put('/update/coupon-status', isLogged, couponController.putStatusChange)

/* Banners */
router.get('/banner', isLogged, bannerController.getBanner)
router.get('/add-banner', isLogged, bannerController.getBannerForm)
router.get('/edit-banner/:id', isLogged, bannerController.getEditBanner)
router.post('/add-banner', isLogged, uploadBanner.single('bannerImg'), bannerController.postBannerForm)
router.post('/edit-banner', isLogged, uploadBanner.single('bannerImg'), bannerController.postEditBanner)
router.patch('/banner/change-status', isLogged, bannerController.patchBannerStatus)
router.delete('/delete-banner', isLogged, bannerController.deleteBanner)

/* Sales Report */
router.get('/sales-report', isLogged, orderController.getSalesReport)
router.post('/get-sales', isLogged, orderController.postSalesReport)

/* Orders */
router.get('/orders', isLogged, orderController.getAdminOrders)
router.get('/order-data', isLogged, orderController.loadOrderData)
router.patch('/change-status', isLogged, orderController.changeStatus)
router.get('/order-control', isLogged, orderController.orderControl)
router.get('/order-detail/:id', isLogged, orderController.adminOrderDetails)

router.get('/signin', notLogged, adminController.login)
router.post('/signin', notLogged, adminController.postLogin)
router.get('/signout', isLogged, adminController.logout)

//--- isLogged --//

function isLogged (req,res,next){
  if(req.session.adminLogged){
    return next()
  }
  res.redirect('/admin/signin')
}

function notLogged (req,res,next) {
  if(!req.session.adminLogged){
    return next()
  }
  res.redirect('/admin')
}



// router.get('/signup/:uname/:password/:mob', async(req,res) => {
//     const hashedPass = await bcrypt.hash(req.params.password, 10)
//     const admin = new Admin({
//       username: req.params.uname,
//       password: hashedPass,
//       mobileNum: req.params.mob
//     })
//     await Admin.create(admin)
//     res.status(200).send('created')
// })

module.exports = router;
