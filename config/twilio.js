const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const serviceSid = process.env.TWILI0_SERVICE_SID;

const client = require('twilio')(accountSid, authToken);

module.exports ={
    sendotp: (mob) => {
        client.verify.v2.services(serviceSid)
        .verifications
        .create({to: '+91'+mob, channel: 'sms'})
        .then(verification => console.log(verification.sid))
        .catch(err => console.log(err))
    },

    verifyotp: async(otp, mob) => {
        const verification_check = await client.verify.v2.services(serviceSid)
        .verificationChecks
        .create({to: "+91"+mob, code: otp});

        if(verification_check.status === "approved") return true
        return false
    }
}