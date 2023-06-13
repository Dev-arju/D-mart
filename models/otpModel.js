const mongoose = require('mongoose')

const otpSchema = new mongoose.Schema({
    mob:{
        type: Number,
        unique: true,
        required: true
    },
    otp:{
        type: Number,
        required: true
    },
    createdAt:{
        type: Date,
        default: Date.now,
        expires: 180
    }
},
{
    collection: 'otp'
})

module.exports = mongoose.model('Otp', otpSchema)