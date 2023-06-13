const Address = require('../models/addressModel')
const Cart = require('../models/cartModel')
const ObjectId = require('mongoose').Types.ObjectId
/**
 * GET user address page render
 */
exports.getAddress = async(req,res) => {
    const cartCount = await getCartCount(req)
    const all = await Address.findOne({user: new ObjectId(req.session.user._id)})

    res.render('shop/address',{
        loggedIn: req.session.loggedIn,
        cartCount,
        all,
        newAddress: req.session.newAddress,
        updateAddress: req.session.addressUpdate
    })
    req.session.newAddress = false
    req.session.addressUpdate = false
    req.session.save()
}
/* POST add new address */
exports.postAddAddress = async(req,res) => {
    if(req.session.user && req.session.user.isActive){
        const userId = req.session.user._id
        const addressDoc = await Address.findOne({user: new ObjectId(userId)})

        if(addressDoc){
            await Address.updateOne({
                _id: addressDoc._id
            },
            {
                $push: {
                    available: {
                        firstName: req.body.firstName,
                        lastName: req.body.lastName,
                        country: req.body.country,
                        address: req.body.address,
                        apartment: req.body.apartment,
                        state: req.body.state,
                        postcode: parseInt(req.body.postcode),
                        phone: parseInt(req.body.phone),
                        email: req.body.email,
                        addressType: req.body.addressType
                    }
                }
            })
            req.session.newAddress = true
            return res.redirect('/address')
        }
        const newAddress = new Address({
            user: userId,
            available:[
                {
                    firstName: req.body.firstName,
                    lastName: req.body.lastName,
                    country: req.body.country,
                    address: req.body.address,
                    apartment: req.body.apartment,
                    state: req.body.state,
                    postcode: parseInt(req.body.postcode),
                    phone: parseInt(req.body.phone),
                    email: req.body.email,
                    addressType: req.body.addressType
                }
            ]
        })
        await Address.create(newAddress)
        req.session.newAddress = true
        res.redirect('/address')
    }else{
        res.redirect('/')
    }
}


/**
 * 
 * GET ajax single address detail
 */
exports.getAddressDetail = async(req,res) =>{
    const addressId = req.params.id
    const userId = req.session.user._id
    
    const address = await Address.aggregate([
        {
            $match: {user: new ObjectId(userId)}
        },
        {
            $unwind: "$available"
        },
        {
            $match: {'available._id': new ObjectId(addressId)}
        }
    ])
    if(address){
        return res.json(address)
    }
    res.redirect('/address')
}

/**
 * 
 * Update address details
 */
exports.postUpdateAddress = async(req,res) => {
    const addressId = req.params.id

    await Address.updateOne(
        {user: new ObjectId(req.session.user._id),
        'available._id': new ObjectId(addressId)},
        {$set: {
            'available.$.firstName': req.body.firstName,
            'available.$.lastName': req.body.lastName,
            'available.$.country': req.body.country,
            'available.$.address': req.body.address,
            'available.$.apartment': req.body.apartment,
            'available.$.state': req.body.state,
            'available.$.postcode': parseInt(req.body.postcode),
            'available.$.phone': parseInt(req.body.phone),
            'available.$.email': req.body.email,
            'available.$.addressType': req.body.addressType
        }}
    ).catch(err => console.error(err));
    req.session.addressUpdate = true
    res.redirect('/address')
}

/**
 * 
 * DELETE address
 */
exports.deleteAddress = async (req,res) => {
    const addressId = req.body.id
    
    await Address.updateOne(
        { 'available._id': new ObjectId(addressId) },
        { $pull: { available: { _id: new ObjectId(addressId) } } }
    )
    res.send(true)
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