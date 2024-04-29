const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
        user: process.env.SENDER_EMAIL,
        pass: process.env.SENDER_EMAIL_APP_PASSWORD,
    },
    tls: {
        rejectUnauthorized: false
    }
});

async function sendMail(to, subject, text, html) {
    return new Promise((resolve, reject) => {
        const mailOptions = {
            from: process.env.SENDER_EMAIL,
            to,
            subject,
            text,
            html
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error(`Error sending email: ${error}`);
                reject(error);
            } else {
                console.log(`Email sent: ${info.response}`);
                resolve(info.response);
            }
        });
    });
}

module.exports = { sendMail };
