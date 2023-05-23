const nodeMailer = require('nodemailer');

const sendEmail = async (options) => {
  //1/difine transporter , the service which send email
  const transporter = nodeMailer.createTransport({
    host: process.env.EMAILHOST,
    port: process.env.EMAILPORT,
    auth: {
      user: process.env.EMAILNAME,
      pass: process.env.MAILPASSWORD,
    },
  });
  //2) difine options
  const mailOptions = {
    from: 'ahmedhelmy.io',
    to: options.email,
    subject: options.subject,
    text: options.message,
  };

  //3) send email via nodemailer
  await transporter.sendMail(mailOptions);
};
module.exports = sendEmail;
