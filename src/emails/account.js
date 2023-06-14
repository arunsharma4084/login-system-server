const sgMail = require('@sendgrid/mail')

sgMail.setApiKey(process.env.SENDGRID_API_KEY)

const sendWelcomeEmail = (email, name) => {
    sgMail.send({
        to: email,
        from: 'arun2life4084@gmail.com',
        subject: "Thanks for joining this app",
        text: `Welcome to the app, ${name}. Let me know how you like the app. Please also check my other projects on https://github.com/arunsharma4084 and my LinkedIn profile on https://www.linkedin.com/in/arunsharma4084.`
    })
}

const sendCancellationEmail = (email, name) => {
    sgMail.send({
        to: email,
        from: 'arun2life4084@gmail.com',
        subject: "Sorry to see you go",
        text: `Sorry to see you go, ${name}. I hope to see you back some time soon. Please e-mail me your expriences of using this app.`
    })
}

module.exports = {
    sendWelcomeEmail,
    sendCancellationEmail
}