const mongoose = require('mongoose')

const adminSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true
    },
    password:{
        type: String,
        required: true
    },
    mobileNum:{
        type: String,
        required: true
    }
},
{
    timestamps: true,
    collection: 'admin'
})

module.exports = mongoose.model('Admin', adminSchema);