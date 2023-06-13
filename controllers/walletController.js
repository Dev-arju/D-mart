const Wallet = require('../models/walletModel')
const Cart = require('../models/cartModel')
const ObjectId = require('mongoose').Types.ObjectId


/**
 * GET wallet information of users
 */
exports.getWallet = async(req,res) => {
    const cartCount = await getCartCount(req)
    let wallet;
    await Wallet.findOne({userId: new ObjectId(req.session.user._id)})
    .then(async(res) => {
        if(!res){
            await Wallet.create({
                userId: req.session.user._id,
                coins: 0
            }).then(data => wallet = data)
        }else{
            wallet = res
        }
    })

    res.render('shop/wallet', {
        loggedIn: req.session.loggedIn,
        cartCount,
        wallet
    })
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