const mongoose= require('mongoose');

const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        unique: true,
        required: true
    },
    descriptions: {
        type: String,
    },
    imagename: {
        type: String,
        required: true,
    },
    
},
{
    timestamps: true,
    collection: 'category'
})

module.exports = mongoose.model('Category', categorySchema)