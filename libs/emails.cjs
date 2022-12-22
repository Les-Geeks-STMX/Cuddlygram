var sendmail = require('sendmail')();

sendmail({
  from: 'myad...@somewhere.com',
  to: 'a...@a.com,b...@b.com,c...@c.com',
  subject: 'The subject',
  type: 'text/html',
  content: '<h3>hello</h3><p>Hey guys</p>'
})

function sendMail(to, subject, content, from = 'no-reply') {
  return new Promise((resolve, reject) => {
    sendmail({
      // From can be no-reply, admin, or contact
      from: from + '@cuddlygram.tk',
      to,
      subject,
      type: 'text/html',
      content
    }, function(err, reply) {
      if (err) reject(err)
      resolve(reply)
    })
  })
}