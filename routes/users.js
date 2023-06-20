const router = require('express').Router();
const userController = require('../controllers/userController')
const otpController = require('../controllers/otpController')
const productController = require('../controllers/productController')
const cartController = require('../controllers/cartController')
const orderController = require('../controllers/orderControllers')
const addressController = require('../controllers/addressController')
const wishlistController = require('../controllers/wishlistController')
const couponController = require('../controllers/couponController')
const walletController = require('../controllers/walletController')
const User = require('../models/userModel')

/* GET users listing. */
router.get('/', productController.getHome)
router.get('/signin',isAuth, userController.signIn)
router.get('/signin-otp',isAuth, otpController.signinOtp)
router.get('/signup',isAuth, userController.signUp)
router.get('/signout', userController.signOut)
router.get('/resend-otp',isAuth, otpController.resendOtp)
router.get('/reset-password', isAuth, userController.getResetPassword)
router.post('/reset-password', isAuth, userController.postResetPassword)
router.post('/reset-password/verify', isAuth, userController.postVerifyResetPass)
router.post('/new-password', isAuth, userController.setNewPassword)

/*  shop */
router.get('/shop', productController.shop)
router.get('/shop/filter', productController.shopFilter)

/* profile */
router.get('/profile', active, userController.getProfile)
router.post('/change-user-info', active, userController.postUpdateUser)

/* address */
router.get('/address', active, addressController.getAddress)
router.get('/get-address-detail/:id', active, addressController.getAddressDetail)
router.post('/add-new-address', active, addressController.postAddAddress)
router.post('/edit-address/:id', active, addressController.postUpdateAddress)
router.delete('/delete-address', active, addressController.deleteAddress)

/* WishList */
router.get('/wishlist', wishlistController.getWishlist)
router.post('/add-to-wishlist', wishlistController.addWishlist)
router.delete('/wishlist-remove', wishlistController.deleteProduct)

/* cart */
router.get('/cart', active, cartController.getCart)
router.put('/cart/update/quantity',active, cartController.updateCartQuantity)
router.delete('/cart/delete', active, cartController.deleteCartProduct)

/* Buy now */
router.get('/cart/:id', active, cartController.buyNow)

/* Wallet */
router.get('/wallet', active, walletController.getWallet)

/* Orders */
router.get('/my-orders', active, orderController.getOrders)
router.patch('/change-order-status', active, orderController.patchCancelOrder)
router.get('/order-details', active, orderController.singleOrderDetails)

/* add-to-cart */
router.post('/add-to-cart', cartController.addCart)

/* checkout */
router.get('/checkout/:id', active, orderController.chekout)
router.get('/order-placed/:orderid', active, orderController.getPlaced)
router.post('/placeorder/:id', active, orderController.placeOrder)
router.post('/placeorder-saved/:id', active, orderController.postPlaceOrderExist)
router.post('/checkout/check-coupon', active, couponController.postVerifyCoupon)

router.post('/verify-payment', active, orderController.postVerifyPayment)

/* product-detail */
router.get('/product/:id', productController.productDetail)

router.post('/signup', userController.postSignUp)
router.post('/signin', userController.postSignIn)
router.post('/signin-otp', otpController.postOtpSignIn)
router.post('/verify-otp', otpController.postVerifyOtp)



//--- middleware ---//

function isAuth(req,res,next) {
    if(req.session.user && req.session.loggedIn){
        res.redirect('/')
    }else{
        next()
    }
}

async function active (req,res,next) {
    let user;
    if(req.session.user && req.session.loggedIn){
        user = await User.findById(req.session.user._id)
        if(user.isActive){
            next()
        }else{
            req.session.user = null
            req.session.loggedIn = false
            req.session.save()
            res.redirect('/')
        }
    }else{
        res.redirect('/')
    }
    
}



module.exports = router;
