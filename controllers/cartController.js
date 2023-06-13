const User = require('../models/userModel')
const Cart = require('../models/cartModel')
const ObjectId = require('mongoose').Types.ObjectId;

/* Cart GET */
exports.getCart = async (req,res) => {
    if(req.session.user){
        const cartItems = await Cart.aggregate([
            {$match: {userId: new ObjectId(req.session.user._id)}},
            {$unwind: '$products'},
            {$project: {item: '$products.item', quantity: '$products.quantity'}},
            {
                $lookup: {
                    from: 'products',
                    localField: 'item',
                    foreignField: '_id',
                    as: 'product'
                }
            }
        ])

        if(cartItems.length > 0){
            res.render('shop/shopping-cart',{
                cartItems,
                loggedIn: req.session.loggedIn
            })
        } else {
            res.render('shop/cart-empty',{
                loggedIn: req.session.loggedIn
            })
        }
    } else {

        res.render('shop/not-logged')
    }  
}

/* Add to cart */
exports.addCart = async(req,res) => {
    
    const {productId} = req.body 
    if(req.session.user){
        const user = await User.findById(req.session.user._id)
        if(user.isActive === false){
            return res.json({
                title: "user have been blocked!",
                text: "Cart available only for registered users",
                icon: "info"
            })
        }
        const userCart = await Cart.findOne({userId: new ObjectId(req.session.user._id)})
        if(userCart){
            let flag = false
            userCart.products.forEach(async product => {
                if(product.item.equals(productId)){
                    flag = true
                    await Cart.updateOne({_id: userCart._id, 'products.item': new ObjectId(productId)},
                    {$set: {'products.$.quantity': product.quantity + 1}})
                }
            })
            if(!flag){
                await Cart.updateOne({_id: userCart._id},{
                    $push: {
                        products: {
                            item: new ObjectId(productId),
                            quantity: 1
                        }
                    }
                })
            }
        }else{
            const newCart = new Cart({
                userId: new ObjectId(req.session.user._id),
                products: [{
                    item: new ObjectId(productId),
                    quantity: 1
                }]
            })
            await Cart.create(newCart)
        }
        const cartCount = await getCartCount(req)
        res.json({
            title: "Success",
            text: "Product added to cart",
            icon: "success",
            cartCount
        })
    } else {
        res.json({
            title: "user not logged!",
            text: "Cart available only for registered users",
            icon: "info"
        })
    }
}

/* Upadte cart Quantity */
exports.updateCartQuantity = async(req,res) => {
    const { proId , dec , inc , newVal } = req.body
    if(inc){
        await Cart.updateOne({
            userId: new ObjectId(req.session.user._id),
            'products.item': new ObjectId(proId)
        },
        {
            $set: {
                'products.$.quantity': newVal 
            }
        })
    }
    if(dec){
        await Cart.updateOne({
            userId: new ObjectId(req.session.user._id),
            'products.item': new ObjectId(proId)
        },
        {
            $set: {
                'products.$.quantity': newVal 
            }
        })
    }

    res.send('product quantity updated to new value')
}

/* Delete cart product */
exports.deleteCartProduct = async(req,res) => {
    const {proId} = req.body
    if(proId){
        await Cart.updateOne({
            userId: new ObjectId(req.session.user._id)
        },
        {
            $pull: {products: {item: new ObjectId(proId)}}
        }).then(()=>{
            res.send('product deleted')
        }).catch((err)=>{
            console.log(err);
            res.send('error occured on delete cart item')
        })
    }else{
        console.log('product not selected');
        res.send('product id not recived')
    }
}

/* Buy now */
exports.buyNow = async(req,res) => {
    const productId =req.params.id
    const userCart = await Cart.findOne({userId: new ObjectId(req.session.user._id)})
    if(userCart){
        let flag = false
            userCart.products.forEach(async product => {
                if(product.item.equals(productId)){
                    flag = true
                    await Cart.updateOne({_id: userCart._id, 'products.item': new ObjectId(productId)},
                    {$set: {'products.$.quantity': product.quantity + 1}})
                }
            })
            if(!flag){
                await Cart.updateOne({_id: userCart._id},{
                    $push: {
                        products: {
                            item: new ObjectId(productId),
                            quantity: 1
                        }
                    }
                })
            }
    }else{
        const newCart = new Cart({
            userId: new ObjectId(req.session.user._id),
            products: [{
                item: new ObjectId(productId),
                quantity: 1
            }]
        })
        await Cart.create(newCart)
    }
    res.redirect('/cart')
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
                console.log(err);
            })
        } else {
            resolve(0)
        }
    })
}