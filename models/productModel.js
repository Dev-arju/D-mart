const mongoose = require('mongoose')

const productSchema = new mongoose.Schema({
    productName: {
        type: String,
        required: true
    },
    company: {
        type: String,
        required: true
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'category',
        required: true
    },
    deal: {
        type: Number,
        required: true
    },
    storage: {
        type: String,
    },
    price: {
        type: Number,
        required: true
    },
    images: [
        {type: String}
    ],
    deleted: {
        type: Boolean,
        default: false
    }
},{
    timestamps: true,
    collection: "products"
})

module.exports = mongoose.model('Product', productSchema)