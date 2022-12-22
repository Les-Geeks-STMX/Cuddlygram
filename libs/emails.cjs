const sendmail = require('sendmail')();
const db = require('./database.cjs')
const ejs = require('ejs')
const fs = require('fs-extra')
const path = require('path')


function sendMail(to, subject, content, from = 'no-reply') {
  return new Promise((resolve, reject) => {
    sendmail({
      // From can be no-reply, admin, or contact
      from: from + '@cuddlygram.tk',
      to,
      subject,
      type: 'text/html',
      content
    }, function (err, reply) {
      if (err) reject(err)
      resolve(reply)
    })
  })
}

async function verifyEmails(email) {
  // Check if it hasn't been verified yet.
  let user = await db.database.users.findOne({ 'auth.email.data': email, 'auth.email.verified': false });
  if (!user) return { error: true, code: 'NO_EMAIL_FOUND' }

  let token = crypto.randomBytes(256).toString('hex')

  user.actions.push({
    name: 'EMAIL_VERIFICATION',
    id: token
  })

  await user.save()

  let file = fs.readFileSync(path.join(__dirname, `../mails/verification.ejs`))
  let html = ejs.render(file, {
    verifUrl: `https://cuddlygram.tk/account/emailVerify?token=${encodeURIComponent(token)}`
  })

  sendMail(email, `Cuddlygram • Email verification`, html)
}