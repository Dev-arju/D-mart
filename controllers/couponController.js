const Coupon = require('../models/couponModel')
const voucher_code = require('voucher-code-generator')
const ObjectId = require('mongoose').Types.ObjectId

/* For admin coupon page */
exports.getCoupons = async(req,res) => {
    const coupons = await Coupon.find()
    res.render('admin/coupon',{
        currPage: 'Coupon',
        coupons,
        newCoupon: req.session.newCoupon
    })
    req.session.newCoupon = false
    req.session.save()
}

/* Add coupon page */
exports.getAddCoupon = (req,res) =>{

    res.render('admin/add-coupon',{
        currPage: 'Coupon'
    })
}

/* Genereate Coupon */
exports.putGenerate = (req,res) => {
    const code = voucher_code.generate({
        pattern: "##-#####-##",
        postfix: "-2023",
        charset: voucher_code.charset("alphanumeric")
    })
    console.log(code);
    res.json({code: code})
}

/* Add coupon submit */
exports.postAddCoupon = async(req,res) => {

    try {
        const newCoupon = new Coupon({
            couponCode: req.body.couponCode,
            discount: req.body.discount,
            minPurchase: req.body.minPurchase,
            expires: req.body.expires,
            couponStatus: true,
            couponType: req.body.couponType
        })
        await Coupon.create(newCoupon)
        req.session.newCoupon = true
        res.redirect('/admin/coupon')
    } catch (error) {
        console.log(error);
        res.redirect('/admin/add-coupon')
    } 
}

/* Change coupon status */
exports.putStatusChange = async(req,res) => {
    const couponId = req.body.couponId
    const change = JSON.parse(req.body.change)
    if(change){
        await Coupon.updateOne({
            _id: new ObjectId(couponId)
        },{
            $set: {couponStatus: change}
        }).then(() => {
            res.json({currStatus: 'Active'})
        })
    }else{
        await Coupon.updateOne({
            _id: new ObjectId(couponId)
        },{
            $set: {couponStatus: change}
        }).then(() => {
            res.json({currStatus: 'In Active'})
        })
    }
}

/**
 * Promocode validation for users input
 */
exports.postVerifyCoupon = async(req,res) => {
    let { promoCode, total } = req.body;

    const docs = await Coupon.find({});
    for (const doc of docs) {
      if (doc.couponCode === promoCode && doc.couponStatus) {
        if (doc.minPurchase <= total) {
          return res.json({ doc, couponApplied: true });
        } else {
          return res.json({
            couponApplied: false,
            msg: `Cart Total Should Be ${doc.minPurchase} or More`,
          });
        }
      }
    }
    res.json({ couponApplied: false, msg: 'Invalid coupon or coupon expired' });
}