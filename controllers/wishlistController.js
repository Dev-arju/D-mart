const Wishlist = require('../models/wishlistModel')
const User = require('../models/userModel')
const Cart = require('../models/cartModel')
const ObjectId = require('mongoose').Types.ObjectId;

// GET wishlist user
exports.getWishlist = async (req,res) => {
    let wishlist;
    let cartCount;
    if(req.session.user){
        wishlist = await Wishlist.findOne(
            {userId: new ObjectId(req.session.user._id)}
            ).populate({
                path: 'products.productId',
                model: 'Product'
            })
        cartCount = await getCartCount(req)
    }
    
    res.render('shop/wishlist',{
        loggedIn: req.session.loggedIn,
        wishlist,
        cartCount
    })
}

// POST add item to wishlist
exports.addWishlist = async (req,res) => {
    const {productId} = req.body 
    if(req.session.user){
        const user = await User.findById(req.session.user._id)
        if(user.isActive === false){
            return res.json({
                title: "user have been blocked!",
                text: "Wishlist available for active users",
                icon: "info"
            })
        }
        const userWishlist = await Wishlist.findOne({userId: new ObjectId(req.session.user._id)})
        if(userWishlist){
            let flag = false
            userWishlist.products.forEach(async product => {
                if(product.productId.equals(productId)){
                    flag = true
                }
            })
            if(!flag){
                await Wishlist.updateOne({_id: userWishlist._id},{
                    $push: {
                        products: {
                            productId: productId,
                        }
                    }
                })
            } else {
                return res.json({
                    title: "Warning",
                    text: "Product Already exists in the wishlist",
                    icon: "warning"
                })
            }
        }else{
            const newWishlist = new Wishlist({
                userId: req.session.user._id,
                products: [{
                    productId: productId,
                }]
            })
            await Wishlist.create(newWishlist)
        }
        res.json({
            title: "Success",
            text: "Product added to Wishlist",
            icon: "success",
        })
    } else {
        res.json({
            title: "user not logged!",
            text: "Wishlist available only for registered users",
            icon: "info"
        })
    }
}

// DELETE wishlist item
exports.deleteProduct = async(req,res) => {
    const {productId} = req.body
    if(req.session.user && productId){
        await Wishlist.updateOne(
            {userId: new ObjectId(req.session.user._id)},
            {$pull: {products: {productId: new ObjectId(productId)}}}
        ).then(() => {
            res.json({removed: true})
        }).catch(() => {
            res.json({removed: false, msg: 'error occured on database operation'})
        })
    } else {
        res.json({removed: false, msg: 'product id or user id not recived'})
    }
}



//-- function for return cart count --//
function getCartCount(req){
    return new Promise(async(resolve, reject) => {
        if(req.session.user){
            await Cart.findOne({userId: new ObjectId(req.session.user._id)})
            .then(cart => {
                resolve(cart.products.length)
            })
            .catch(err => {
                resolve(false)
            })
        } else {
            resolve(0)
        }
    })
}