const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const otpGenerator = require('otp-generator')
const Otp = require('../models/otpModel')

const client = require('twilio')(accountSid, authToken);

module.exports ={
    sending: (mob)=>{
        const otp = otpGenerator.generate(6,{
            digits : true,
            lowerCaseAlphabets : false,
            upperCaseAlphabets: false,
            specialChars: false
        })
        client.messages.create({
            body: otp,
            from: '+16203613048',
            to: `+91${mob}`
        }).then( async messege => {
            await Otp.deleteOne({mob: mob})
            await Otp.create({
                mob: mob,
                otp: otp
            })
            console.log(messege.body);
        }).catch(err=> console.log(err))
    }
}