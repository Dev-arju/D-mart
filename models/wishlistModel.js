const mongoose = require('mongoose')

const wishlistSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: true
    },
    products: [{
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'products',
            required: true
        }
    }]
},
{
    timestamps: true,
    collection: 'wishlist'
})

module.exports = mongoose.model('Wishlist', wishlistSchema)