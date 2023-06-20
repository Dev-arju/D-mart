const Order = require('../models/orderModel')
const Cart = require('../models/cartModel')
const Address = require('../models/addressModel')
const Coupon = require('../models/couponModel')
const Wallet = require('../models/walletModel')
const Category = require('../models/categoryModel')

// const Product = require('../controllers/productController')
const ObjectId = require('mongoose').Types.ObjectId
const Razorpay = require('razorpay')
const crypto = require('crypto')
const { log } = require('console')
const { products } = require('./productController')

const instance = new Razorpay({
    key_id: process.env.KEY_ID,
    key_secret: process.env.KEY_SECRET,
});


/**
 * GET orders page for user
 */
exports.getOrders = async (req, res) => {
    const myOrder = await Order.find({ userId: req.session.user._id }).populate({
        path: 'products.item',
        model: 'Product'
    }).sort({ createdAt: -1 });

    res.render('shop/orders', {
        loggedIn: req.session.loggedIn,
        myOrder
    })
}


exports.chekout = async (req, res) => {
    const cartId = req.params.id
    const allAddress = await Address.findOne({ user: new ObjectId(req.session.user._id) })
    const cartItems = await Cart.aggregate([
        {
            $match: { _id: new ObjectId(cartId) }
        },
        {
            $unwind: '$products'
        },
        { $project: { item: '$products.item', quantity: '$products.quantity' } },
        {
            $lookup: {
                from: 'products',
                localField: 'item',
                foreignField: '_id',
                as: 'cartProducts'
            }
        },
        {
            $unwind: '$cartProducts'
        },
        {
            $project: {
                qty: '$quantity',
                productName: '$cartProducts.productName',
                subTotal: {
                    $multiply: ['$quantity',
                        {
                            $subtract: ['$cartProducts.price',
                                {
                                    $multiply: ['$cartProducts.price',
                                        { $divide: ['$cartProducts.deal', 100] }
                                    ]
                                }
                            ]
                        }
                    ]
                },
                thubImg: { $arrayElemAt: ['$cartProducts.images', 0] }
            }
        }
    ])
    let totalAmount = 0
    cartItems.forEach(item => {
        totalAmount += item.subTotal
    })
    res.render('shop/checkout', {
        loggedIn: req.session.loggedIn,
        cartItems,
        totalAmount,
        allAddress
    })
}

// success page render
exports.getPlaced = async (req, res) => {
    const orderId = req.params.orderid
    const isTrue = await Order.findOne({ _id: new ObjectId(orderId) })
    if (isTrue) {
        res.render('shop/order-placed', {
            loggedIn: req.session.loggedIn
        })
    } else {
        res.redirect('/')
    }
}

exports.placeOrder = async (req, res) => {
    if (!req.session.user) {
        return res.redirect('/')
    }
    const cartId = req.params.id
    const couponId = req.query.promo
    let products
    let appliedCoupon
    let orderId
    let total = 0

    const { firstName, lastName, email, phone, address, apartment, country, state, postcode, addressType, paymentMethod, saveInfo } = req.body
    try {
        products = await getCartItems(cartId)
    } catch (error) {
        console.log(error);
        return res.redirect('/')
    }
    products.forEach(product => {
        total += product.subTotal
    })
    if (couponId !== "null") {
        appliedCoupon = await Coupon.findById(couponId)
        total = total - appliedCoupon.discount
    }

    try {
        const newOrder = new Order({
            deliveryDetails: {
                firstName: firstName,
                lastName: lastName,
                country: country,
                address: address,
                apartment: apartment,
                state: state,
                postcode: postcode,
                phone: phone,
                email: email,
                addressType: addressType
            },
            userId: req.session.user._id,
            paymentMethod: paymentMethod,
            products: products,
            promocodeApplied: appliedCoupon !== undefined ? appliedCoupon._id : null,
            orderAmount: total,
            paymentStatus: paymentMethod === "pg" ? "processing" : "pending",
            orderStatus: (paymentMethod === 'cod') ? 'placed' : 'pending'
        })
        await Order.create(newOrder).then(async (order) => {
            orderId = order._id
            if (saveInfo !== undefined) {
                const addressDoc = await Address.findOne({ user: new ObjectId(req.session.user._id) })
                if (addressDoc) {
                    await Address.updateOne(
                        {
                            _id: addressDoc._id
                        },
                        {
                            $push: {
                                available: {
                                    firstName: firstName,
                                    lastName: lastName,
                                    country: country,
                                    address: address,
                                    apartment: apartment,
                                    state: state,
                                    postcode: parseInt(postcode),
                                    phone: parseInt(phone),
                                    email: email,
                                    addressType: addressType
                                }
                            }
                        }
                    )
                } else {
                    const newAddress = new Address({
                        user: req.session.user._id,
                        available: [
                            {
                                firstName: firstName,
                                lastName: lastName,
                                country: country,
                                address: address,
                                apartment: apartment,
                                state: state,
                                postcode: parseInt(postcode),
                                phone: parseInt(phone),
                                email: email,
                                addressType: addressType
                            }
                        ]
                    })
                    await Address.create(newAddress)
                }
            }
        })
    } catch (error) {
        console.log("error occured on create new order: " + error);
    }
    if (paymentMethod === "cod") {
        await Cart.deleteOne({ _id: new ObjectId(cartId) })
        res.json({ orderPlaced: true, orderId })
    } else if (paymentMethod === "pg") {
        var options = {
            amount: total * 100,  // amount in the smallest currency unit
            currency: "INR",
            receipt: `${orderId}`
        };
        instance.orders.create(options, function (err, order) {
            if (err) console.log("error on creating order: " + err);
            res.json({ order })
        });
    }

}

/**
 *  POST place order using saved address
 */
exports.postPlaceOrderExist = async (req, res) => {
    if (!req.session.user) {
        return res.redirect('/')
    }
    const cartId = req.params.id
    const { formData, couponId } = req.body;
    const { value: addressId } = formData.find(data => data.name === 'addressId');
    const { value: paymentMethod } = formData.find(data => data.name === 'paymentMethod');

    let orderId;
    let address = await getShippingAddress(req.session.user._id, addressId)
    address = address[0]
    const products = await getCartItems(cartId);
    let appliedCoupon, newOrder;

    let total = 0
    products.forEach(product => {
        total += product.subTotal
    })


    if (couponId) {
        appliedCoupon = await Coupon.findById(couponId)
        newOrder = new Order({
            deliveryDetails: address.available,
            userId: req.session.user._id,
            paymentMethod: paymentMethod,
            products: products,
            promocodeApplied: couponId,
            orderAmount: total - appliedCoupon.discount,
            paymentStatus: paymentMethod === "pg" ? "processing" : "pending",
            orderStatus: (paymentMethod === 'cod') ? 'placed' : 'pending'
        })
    } else {
        newOrder = new Order({
            deliveryDetails: address.available,
            userId: req.session.user._id,
            paymentMethod: paymentMethod,
            products: products,
            orderAmount: total,
            paymentStatus: paymentMethod === "pg" ? "processing" : "pending",
            orderStatus: (paymentMethod === 'cod') ? 'placed' : 'pending'
        })
    }

    await Order.create(newOrder).then(async (order) => {
        orderId = order._id
    })
    if (paymentMethod === "cod") {
        await Cart.deleteOne({ _id: new ObjectId(cartId) })
        res.json({ orderPlaced: true, orderId })
    } else if (paymentMethod === "pg") {
        var options = {
            amount: couponId !== undefined ? (total - appliedCoupon.discount) * 100 : total * 100,  // amount in the smallest currency unit
            currency: "INR",
            receipt: `${orderId}`
        };
        instance.orders.create(options, function (err, order) {
            if (err) console.log("error on creating order: " + err);
            res.json({ order })
        });
    } else {
        const wallet = await Wallet.findOne({ userId: new ObjectId(req.session.user._id) })

        if (appliedCoupon) {
            if (wallet && wallet.coins >= total - appliedCoupon.discount) {
                await Wallet.updateOne(
                    { _id: wallet._id },
                    {
                        $inc: { coins: - (total - appliedCoupon.discount) },
                        $push: {
                            transactions: {
                                date: Date.now(),
                                type: 'debit',
                                value: total - appliedCoupon.discount,
                                reason: 'purchase'
                            }
                        }
                    })
                await Order.updateOne(
                    {
                        _id: orderId
                    },
                    {
                        $set: { paymentStatus: 'success', orderStatus: 'placed' }
                    }
                )
                await Cart.deleteOne({ _id: new ObjectId(cartId) })
                res.json({ orderPlaced: true, orderId })
            } else {
                await Order.updateOne(
                    {
                        _id: orderId
                    },
                    {
                        $set: { paymentStatus: 'failed', orderStatus: 'cancelled', notes: 'Insuficient Funds in wallet' }
                    }
                )
                res.json({ err: 'Insuficient Funds in wallet' })
            }
        } else {
            if (wallet && wallet.coins >= total) {
                await Wallet.updateOne(
                    {
                        _id: wallet._id
                    },
                    {
                        $inc: { coins: - total },
                        $push: {
                            transactions: {
                                date: Date.now(),
                                type: 'debit',
                                value: total,
                                reason: 'purchase'
                            }
                        }
                    })
                await Order.updateOne(
                    {
                        _id: orderId
                    },
                    {
                        $set: { paymentStatus: 'success', orderStatus: 'placed' }
                    }
                )
                await Cart.deleteOne({ _id: new ObjectId(cartId) })
                res.json({ orderPlaced: true, orderId })
            } else {
                await Order.updateOne(
                    {
                        _id: orderId
                    },
                    {
                        $set: { paymentStatus: 'failed', orderStatus: 'cancelled', notes: 'Insuficient Funds in wallet' }
                    }
                )
                res.json({ err: 'Insuficient Funds in wallet' })
            }
        }
    }
}

/**
 * Verify payment
 */
exports.postVerifyPayment = async (req, res) => {
    const { payment, order, cartId } = req.body
    let hmac = crypto.createHmac('sha256', process.env.KEY_SECRET)
    hmac.update(payment.razorpay_order_id + '|' + payment.razorpay_payment_id)
    hmac = hmac.digest('hex')
    if (hmac === payment.razorpay_signature) {
        await Order.updateOne(
            { _id: new ObjectId(order.receipt) },
            { $set: { paymentStatus: 'success', orderStatus: 'placed' } })
            .then(async () => {
                await Cart.deleteOne({ _id: new ObjectId(cartId) })
            })
        res.json({ orderPlaced: true, orderId: order.receipt })
    } else {
        await Order.updateOne(
            {
                _id: new ObjectId(order.receipt)
            },
            {
                $set: { paymentStatus: 'failed', orderStatus: 'cancelled', notes: 'payment failed' }
            }
        )
        res.json({ orderPlaced: false, err: 'payment verification failed' })
    }
}

/**
 * GET admin orders route
 */
exports.getAdminOrders = (req, res) => {

    res.render('admin/orders', {
        currPage: 'Orders'
    })
}
// load data
exports.loadOrderData = async (req, res) => {

    const orders = await Order.find().populate({
        path: 'userId',
        model: 'User'
    })

    res.json({ orders })
}

// change order status for admin
exports.changeStatus = async (req, res) => {
    const orderId = req.body.orderId
    const status = req.body.status

    const order = await Order.findById(orderId)
    const walletId = await Wallet.findOne({ userId: order.userId })

    if (order.paymentMethod === 'cod' && status === 'delivered') {
        await Order.updateOne(
            {
                _id: orderId
            },
            {
                $set: { paymentStatus: 'success', orderStatus: status, deliveredAt: Date.now() }
            }
        )
        return res.json({ statusChanged: true, paymentStatus: 'succes' })
    } else if (status === 'delivered') {
        await Order.updateOne(
            {
                _id: orderId
            },
            {
                $set: { orderStatus: status, deliveredAt: Date.now() }
            }
        )
    } else if (status === 'cancelled' && order.paymentStatus === 'success') {
        await Wallet.updateOne(
            {
                _id: walletId
            },
            {
                $inc: { coins: order.orderAmount },
                $push: {
                    transactions: {
                        date: Date.now(),
                        type: 'credit',
                        value: order.orderAmount,
                        reason: 'cancelled by admin'
                    }
                }
            }
        )
        await Order.updateOne(
            {
                _id: orderId
            },
            {
                $set: { orderStatus: status, paymentStatus: 'refund' }
            }
        )
        return res.json({ statusChanged: true, paymentStatus: 'refund' })
    } else {
        await Order.updateOne(
            {
                _id: orderId
            },
            {
                $set: { orderStatus: status }
            }
        )
    }
    res.json({ statusChanged: true })
}

// order cancel for user
exports.patchCancelOrder = async (req, res) => {
    if (!req.session.user) res.json({ statusChanged: false })
    const { orderId, status, reason } = req.body

    const order = await Order.findById(orderId)
    if (order.orderStatus !== status && order.orderStatus !== 'delivered') {
        if (order.paymentStatus === 'success') {
            await Wallet.updateOne(
                {
                    userId: req.session.user._id
                },
                {
                    $inc: { coins: order.orderAmount },
                    $push: {
                        transactions: {
                            date: Date.now(),
                            type: 'credit',
                            value: order.orderAmount,
                            reason: reason
                        }
                    }
                }
            ).then(async () => {
                await Order.updateOne(
                    {
                        _id: orderId
                    },
                    {
                        $set: { orderStatus: status, paymentStatus: 'refund' }
                    }
                )
            }).then(() => res.json({ statusChanged: true }))
        } else {
            await Order.updateOne(
                {
                    _id: orderId
                },
                {
                    $set: { orderStatus: status }
                }
            ).then(() => res.json({ statusChanged: true }))
        }
    }
    else res.json({ statusChanged: false })
}

// return single order details
exports.singleOrderDetails = async (req, res) => {
    const orderId = req.query.id
    const orderDetails = await Order.findById(orderId)
        .populate({ path: 'products.item', model: 'Product' })
        .populate({ path: 'promocodeApplied', model: 'Coupon' })
    res.json(orderDetails)
}


/**
 * Order sort filter for admin 
 */
exports.orderControl = async (req, res) => {
    const { paymentFilter, orderFilter } = req.query

    const orders = await Order.find({}).populate({ path: 'userId', model: 'User' })

    if (paymentFilter || orderFilter) {
        let result = orders.filter((order) => {
            const condition1 = paymentFilter !== "" ? order.paymentMethod === paymentFilter : true;
            const condition2 = orderFilter !== "" ? order.orderStatus === orderFilter : true;

            return condition1 && condition2
        })
        return res.status(200).json(result)
    }
}

/* GET order details admin */
exports.adminOrderDetails = async(req,res) => {
    const orderId = req.params.id
    let deliveredAt = 'not updated'
    let price = {
        subTotal: 0,
        total: 0
    };

    const order = await Order.findOne({_id: orderId})
    .populate({path: 'products.item', model: 'Product', populate: { path: 'category', model: 'Category' }})
    .populate({path: 'userId', model: 'User'})
    .populate({path: 'promocodeApplied', model: 'Coupon'})
    
    if(order.orderStatus === 'delivered'){
        deliveredAt = order.deliveredAt.toDateString()
    }
    order.products.forEach((product) => {
        price['subTotal'] += product.subTotal
    })
    price.total = order.promocodeApplied ? price.subTotal - order.promocodeApplied.discount : price.subTotal
    res.render('admin/order-detail', {
        currPage: 'Orders',
        order,
        deliveredAt,
        price
    })   
}

/* GET Sales Report */
exports.getSalesReport = (req, res) => {
    res.render('admin/sales-report', {
        currPage: 'Sales'
    })
}

/* POST ajax request for return sales data */
exports.postSalesReport = async (req, res) => {
    let fromDate = req.body.start
    let toDate = req.body.end

    fromDate = new Date(fromDate);
    fromDate.setHours(0, 0, 0, 0)
    toDate = new Date(toDate);
    toDate.setHours(23, 59, 59)

    const sales = await Order.find(
        {
            deliveredAt: {
                $gte: fromDate,
                $lte: toDate
            },
            orderStatus: 'delivered'
        }
    ).populate(
        { path: 'userId', model: 'User' }
    ).populate(
        { path: 'promocodeApplied', model: 'Coupon' }
    )
    res.json({ sales, fromDate, toDate })
}

/* GET chat data */
exports.getChartData = async (req, res) => {
    await Order.aggregate([
        {
            $match: { orderStatus: 'delivered' }
        },
        {
            $group: {
                _id: { $dateToString: { format: '%m', date: '$deliveredAt' } },
                totalAmount: { $sum: '$orderAmount' }
            }
        }
    ]).then(data => {
        let label = []
        let sale = []
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        for (let i = 0; i < 12; i++) {
            label.push(months[i])
            sale.push(0)
        }
        for (let i = 0; i < data.length; i++) {
            const currMonth = parseInt(data[i]._id)
            sale.splice(currMonth - 1, 1, data[i].totalAmount)
        }
        res.json({ label, sale })
    })
}

/* GET pie chart data */
exports.getPieChart = async (req, res) => {
    await Order.aggregate([
        {
            $match: { orderStatus: 'delivered' }
        },
        {
            $unwind: '$products'
        },
        {
            $project: { proId: '$products.item', subTotal: '$products.subTotal' }
        },
        {
            $lookup: {
                from: 'products',
                localField: 'proId',
                foreignField: '_id',
                as: 'detail'
            }
        },
        {
            $lookup: {
                from: 'category',
                localField: 'detail.category',
                foreignField: '_id',
                as: 'catDetail'
            }
        },
        {
            $group: {
                _id: '$catDetail.name',
                total: { $sum: '$subTotal' }
            }
        }
    ]).then(data => {
        let label = []
        let amount = []
        let colours = []

        data.forEach(obj => {
            label.push(...obj._id)
            amount.push(obj.total)
            const colour = getRandomColor()
            colours.push(colour)
        })

        res.json({ label, amount, colours })
    })
}

/* GET week sale chart */
exports.getWeekChart = async (req, res) => {
    let currDate = new Date();
        currDate.setHours(23,59,59)
    let weekAgo = new Date()
        weekAgo.setDate(currDate.getDate() - 6)
        weekAgo.setHours(0,0,0,0)
    await Order.aggregate([
        {
            $match: {
                orderStatus: 'delivered',
                deliveredAt: {
                    $lte: currDate,
                    $gte: weekAgo
                }
            }
        },
        {
            $group: {
                _id: { $dateToString: { format:'%d-%m', date: '$deliveredAt' } },
                amount: {$sum: '$orderAmount'}
            }
        },
        {
            $sort: {_id: 1}
        }
    ]).then(data => {
        let label = []
        let amount = []

        if(data.length < 7){
            for(let i=0 ; i < 7-data.length; i++){
                label.push('00-00')
                amount.push(0)
            } 
        }
        data.forEach(obj => {
            label.push(obj._id)
            amount.push(obj.amount)
        })
        res.json({ label, amount})
    })
}

/**
 * 
 *  functions
 */
async function getCartItems(cartId) {
    return await Cart.aggregate([
        {
            $match: { _id: new ObjectId(cartId) }
        },
        {
            $unwind: '$products'
        },
        {
            $project: { itemId: '$products.item', qty: '$products.quantity' }
        },
        {
            $lookup: {
                from: 'products',
                localField: 'itemId',
                foreignField: '_id',
                as: 'items'
            }
        },
        {
            $unwind: '$items'
        },
        {
            $project: {
                item: '$itemId',
                qty: '$qty',
                subTotal: {
                    $multiply: ['$qty', {
                        $subtract: ['$items.price', {
                            $multiply: ['$items.price', {
                                $divide: ['$items.deal', 100]
                            }]
                        }]
                    }]
                }
            }
        }
    ])
}

async function getShippingAddress(userId, addressId) {
    return await Address.aggregate([
        {
            $match: { user: userId }
        },
        {
            $unwind: '$available'
        },
        {
            $match: { 'available._id': new ObjectId(addressId) }
        }
    ])
}

function getRandomColor() {

    const num1 = Math.floor(Math.random() * 100); // Generate a random two-digit number
    const num2 = Math.floor(Math.random() * 1000); // Generate a random three-digit number
    const num3 = Math.floor(Math.random() * 1000); // Generate a random three-digit number
    const opacity = Math.random().toFixed(1);
    let color = `rgba(${num1}, ${num2}, ${num3}, ${opacity})`;

    return color;
}