const mongoose = require('mongoose')

const addressSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: true
    },
    available:[{
        firstName: {
            type: String,
            required: true
        },
        lastName:{
            type: String,
            required: true
        },
        country:{
            type: String,
            required: true
        },
        address:{
            type: String,
            required: true
        },
        apartment:{
            type: String
        },
        city:{
            type: String
        },
        state:{
            type: String,
            required: true
        },
        postcode:{
            type: Number,
            required: true
        },
        phone:{
            type: Number,
            required: true
        },
        email:{
            type: String
        },
        addressType: {
            type: String,
            required: true
        }
    }]
},
{
    timestamps: true,
    collection: 'address'
})

module.exports = mongoose.model('Address', addressSchema);