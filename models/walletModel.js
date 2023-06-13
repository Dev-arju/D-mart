const mongoose = require('mongoose')

const walletSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: true
    },
    coins: {
        type: Number,
        required: true
    },
    transactions: [{
        date: {type: Date},
        type: {type: String},
        value: {type: Number},
        reason: {type: String}
    }]
},
{
    timestamps: true,
    collection: 'wallet'
})

module.exports = mongoose.model('Wallet', walletSchema)