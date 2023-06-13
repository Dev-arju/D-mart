const bcrypt = require('bcrypt')
const Admin = require('../models/adminModel')
const Order = require('../models/orderModel')
const User = require('../models/userModel')
const ObjectId  = require('mongoose').Types.ObjectId;


//-- admin dashboard page --//
exports.dashboard = async(req, res) => {
    const totalRevenue = await Order.aggregate([
        {
            $match: {orderStatus: 'delivered'}
        },
        {
            $group: {
                _id: null,
                total: {$sum: '$orderAmount'}
            }
        }
    ])
    const totalUsers = await User.find().count()
    const deliveredOrders = await Order.find({orderStatus: 'delivered'}).count()
    const totalOrders = await Order.find().count()
    res.render('admin/dashboard', {
        currPage: "Dashboard",
        totalRevenue,
        totalUsers,
        deliveredOrders,
        totalOrders
    })
}




exports.login = (req, res) => {
    if (req.session.adminLogged) {
        res.redirect('/admin',{
            currPage: "Dashboard"
        })
    } else {
        res.render('admin/signin', {
            adminErr: req.session.adminLogErr
        })
        req.session.adminLogErr = false
        req.session.save()
    }
}


exports.logout = (req, res) => {
    if (req.session.admin) {
        req.session.admin = null
        req.session.adminLogged = false
        req.session.save()
        res.redirect('/admin/signin')
    }
}


exports.postLogin = async (req, res) => {
    try {
        const temp = await Admin.findOne({ username: req.body.username })
        if (temp) {
            bcrypt.compare(req.body.password, temp.password).then((ok) => {
                if (ok) {
                    req.session.admin = temp
                    req.session.adminLogged = true;
                    res.redirect('/admin')
                } else {
                    req.session.adminLogErr = "password incorrect"
                    res.redirect('/admin/signin')
                }
            })
        } else {
            req.session.adminLogErr = "invalid username"
            res.redirect('/admin/signin')
        }
    } catch (error) {
        console.log(error);
    }
}
