const nodemailer = require('nodemailer');


const emailTransport = nodemailer.createTransport({
  service: process.env.SMTP_SERVICE,
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  auth: {
    user: process.env.SMTP_USERNAME,
    pass: process.env.SMTP_PASSWORD
  }
});


module.exports.sendEmail = (emailOption, callback)=> {
  let mailOptions = {
    from: process.env.EMAIL_FROM,
    to: emailOption.email,
    subject: emailOption.subject,
    html: emailOption.template
  }

  if(emailOption.attachments) {
    mailOptions.attachments = emailOption.attachments;
  }

  emailTransport.sendMail(mailOptions, function(error, response) {
    if(error) {
      console.log({status: 'ERROR', message: 'Unable to send email ' + error});
    } else {
      console.log({status: 'SUCCESS', message: `Email successfully send to user on ${mailOptions.to}`});
    }
  });
}
