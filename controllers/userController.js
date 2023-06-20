const bcrypt = require('bcrypt')
const User = require('../models/userModel')
const Cart = require('../models/cartModel')
const Wallet = require('../models/walletModel')
const twilio = require('../config/twilio')
const ObjectId = require('mongoose').Types.ObjectId


exports.signIn = (req, res) => {

    res.render('shop/signin', {
        success: req.session.newUser || req.session.newPassword,
        logginErr: req.session.logginErr
    })
    req.session.newUser = false
    req.session.logginErr = false
    req.session.newPassword = false
    req.session.save()
}

exports.signUp = (req, res) => {

    res.render('shop/signup', {
        exist: req.session.userExists,
        logginErr: req.session.logginErr
    })
    req.session.userExists = false
    req.session.logginErr = false
    req.session.save()
}

exports.signOut = (req, res) => {
    if (req.session.user) {
        req.session.user = null
        req.session.loggedIn = false
        req.session.save()
        res.redirect('/')
    }
}

exports.getResetPassword = async(req,res) => {
    res.render('shop/reset-password')
}

exports.postResetPassword = async(req,res) => {
    const { mobNum } = req.body
    const user = await User.findOne({mobileNumber: parseInt(mobNum)})
    if(user){
        twilio.sendotp(mobNum)
        res.json(user)
    }else{
        res.json(false)
    }
}

exports.postVerifyResetPass = async(req,res) => {
    const { otp , mobNum } = req.body
    const verify = await twilio.verifyotp(otp, mobNum)
    
    if(verify){
        const user = await User.findOne({mobileNumber: parseInt(mobNum)})
        res.json(user)
    }else{
        res.json(false)
    }
    
}

exports.setNewPassword = async(req,res) => {
    const { newPassword , userId } = req.body
    if(newPassword && userId){
        const hashedPassword = await bcrypt.hash(newPassword, 10)
        await User.updateOne(
            {_id: userId},
            {$set : {password: hashedPassword}}
        )
        req.session.newPassword = "your password has been changed"
        res.redirect('/signin')
    }else{
        req.session.newPassword = "error occured update password"
        res.redirect('/signin')
    }    
}

exports.postSignUp = async (req, res) => {
    try {
        const existMobile = await User.findOne({ mobileNumber: req.body.number })
        const existEmail = await User.findOne({ email: req.body.email })
        if (existMobile || existEmail) {
            if(existMobile && existEmail){
                req.session.userExists = 'Mobile and Email is already registered'
                res.redirect('/signup')
            }else if(existEmail){
                req.session.userExists = 'Email is already registed'
                res.redirect('/signup')
            }else{
                req.session.userExists = 'Mobile number is already registed'
                res.redirect('/signup')
            }
        } else {
            const hashedPassword = await bcrypt.hash(req.body.password, 10)
            const newUser = new User({
                fullname: req.body.fullname,
                email: req.body.email,
                mobileNumber: req.body.number,
                password: hashedPassword,
                isActive: true
            })
            User.create(newUser)
            req.session.newUser = "Account created successfully"
            res.redirect('/signin')
        }
    } catch (e) {
        console.log(e);
        res.redirect('/signup')
    }
}

exports.postSignIn = async (req, res) => {
    try {
        const existUser = await User.findOne({ mobileNumber: req.body.number })
        if (existUser) {
            if (existUser.isActive) {
                bcrypt.compare(req.body.password, existUser.password)
                    .then(async (status) => {
                        if (status) {
                            const found = await Wallet.findOne({ userId: existUser._id });
                            if (!found) {
                                await Wallet.create({
                                    userId: existUser._id,
                                    coins: 0
                                });
                            }
                            req.session.user = existUser
                            req.session.loggedIn = true
                            res.redirect('/')
                        } else {
                            req.session.logginErr = 'password incorrect'
                            res.redirect('/signin')
                        }
                    })
            } else {
                req.session.logginErr = 'Account blocked contact at customer care'
                res.redirect('/signin')
            }
        } else {
            req.session.logginErr = 'Create account'
            res.redirect('/signin')
        }
    } catch (error) {
        if (error) {
            console.log(error);
        }
    }
}

//-- admin customers page --// 
/* Get request for showing users for admin */

exports.users = async (req, res) => {
    const tempUser = await User.find()
    res.render('admin/users', {
        tempUser,
        currPage: "Customers"
    })
}


// user block and unblock for admin use only

exports.userControl = async (req, res) => {
    const id = new ObjectId(req.params.id)
    const status = JSON.parse(req.query.changeStatus)

    User.updateOne({ _id: id }, { $set: { isActive: status } })
        .then((ok) => {
            if (ok) {
                return res.redirect(`/admin/users`)
            }
            console.error("user status not changed");
            res.redirect(`/admin/users`)
        }).catch(err => console.error(err))

}


/**
 * User profile page
 */
exports.getProfile = async (req, res) => {
    const cartCount = await getCartCount(req)
    const userDetails = await User.findById(req.session.user._id)
    res.render('shop/profile', {
        loggedIn: req.session.loggedIn,
        cartCount,
        userDetails
    })
}

/**
 * POST update user info
 */
exports.postUpdateUser = async(req,res) => {
    const { email , mobile } = req.body

    await User.updateOne(
        {
            _id: req.session.user._id
        },
        {
            $set: {email: email, mobileNumber: parseInt(mobile)}
        }
    ).then((done) => res.json({updated: true}))
    .catch((err) => res.json({updated: false, err}))
}


//-- function for return cart count --//

function getCartCount(req) {
    return new Promise(async (resolve, reject) => {
        if (req.session.user) {
            await Cart.findOne({ userId: new ObjectId(req.session.user._id) })
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