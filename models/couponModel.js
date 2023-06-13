const mongoose = require('mongoose')

const couponSchema = new mongoose.Schema({
    couponCode: {
        type: String,
        required: true,
        unique: true
    },
    discount: {
        type: Number,
        required: true
    },
    minPurchase: {
        type: Number
    },
    expires: {
        type: Date,
        required: true
    },
    couponStatus: {
        type: Boolean,
        required: true
    },
    couponType: {
        type: String,
        required: true
    }
},
{
    timestamps: true,
    collection: 'promocodes'
})

// Define a pre-save middleware function to update coupon status based on expiration date
couponSchema.pre('save', function (next) {
    if (this.isModified('expires') || this.isNew) {
      // Check if the 'expires' field has been modified or if it's a new coupon
      const currentDate = new Date();
      if (this.expires < currentDate) {
        // If the expiration date is in the past, set couponStatus to false
        this.couponStatus = false;
      }
    }
    next();
});

module.exports = mongoose.model('Coupon', couponSchema)