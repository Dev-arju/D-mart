const mongoose = require('mongoose')

const orderSchema = new mongoose.Schema({
    deliveryDetails: {
        firstName: {type: String, required: true},
        lastName: {type: String, required: true},
        country: {type: String, required: true},
        address: {type: String, required: true},
        apartment: {type: String},
        city: {type: String},
        state: {type: String, required: true},
        postcode: {type: Number, required: true},
        phone: {type: Number, required: true},
        email: {type: String},
        addressType: {type: String, required: true}
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: true
    },
    paymentMethod: {
        type: String,
        required: true
    },
    products: [
        {
            item: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'products',
                required: true
            },
            qty: {
                type: Number,
                required: true
            },
            subTotal: {
                type:Number,
                required: true
            }
        }
    ],
    orderAmount: {
        type: Number,
        required: true
    },
    promocodeApplied: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'promocodes'
    },
    paymentStatus: {
        type: String,
        required: true
    },
    orderStatus: {
        type: String,
        required: true
    },
    deliveredAt: {
        type: Date,
    },
    notes: {
        type: String
    }
},
{
    timestamps: true,
    collection: 'orders'
})

module.exports = mongoose.model('Order', orderSchema)