const User = require('../models/userModel')
const Otp = require('../models/otpModel')
const Wallet = require('../models/walletModel')
const twilio = require('../config/twilio')
const ObjectId = require('mongoose').Types.ObjectId;

exports.signinOtp = (req, res) => {
    res.render('shop/otp-signin')
}

exports.postOtpSignIn = async (req, res) => {
    await User.findOne({ mobileNumber: req.body.number })
        .then((response) => {
            if (response) {
                if (response.isActive) {
                    req.session.userId = response._id
                    twilio.sending(req.body.number)
                    res.render('shop/otp-verify')
                } else {
                    req.session.logginErr = 'your account has been blocked contact customer care'
                    res.redirect('/signin')
                }

            } else {
                req.session.logginErr = 'you are not registred with us. Create an account'
                res.redirect('/signup')
            }
        })
        .catch((err) => console.log(err))
}


exports.postVerifyOtp = async (req, res) => {
    const num1 = req.body.num1,
        num2 = req.body.num2,
        num3 = req.body.num3,
        num4 = req.body.num4,
        num5 = req.body.num5,
        num6 = req.body.num6

    const otp = num1 + num2 + num3 + num4 + num5 + num6;

    User.findOne({ _id: new ObjectId(req.session.userId) })
        .then((user) => {
            if (user) {
                Otp.findOne({ mob: user.mobileNumber })
                    .then(async(doc) => {
                        if (doc && doc.otp == otp) {
                            const found = await Wallet.findOne({ userId: user._id });
                            if (!found) {
                                await Wallet.create({
                                    userId: user._id,
                                    coins: 0
                                });
                            }

                            req.session.user = user
                            req.session.loggedIn = true
                            req.session.userId = null
                            res.redirect('/')
                        } else {
                            res.render('shop/otp-verify', {
                                invalid: 'otp expired or invalid otp'
                            })
                        }
                    }).catch((err) => console.log(err))
            }
        })
}

exports.resendOtp = (req, res) => {
    try {
        User.findOne({ _id: new ObjectId(req.session.userId) })
            .then((user) => {
                if (user) {
                    twilio.sending(user.mobileNumber)
                    res.render('shop/otp-verify', {
                        invalid: 'Otp has been sent'
                    })
                }
            })
    } catch (error) {
        console.log(error);
    }
}