const Answer = require('mongoose').model('Answer')
const Comment = require('mongoose').model('Comment')
const dateFormat = require('dateformat')
dateFormat.masks.customFormat = 'ddd, mmm dS \'yy - HH:MM'

module.exports = {
  edit: (req, res) => {
    Answer.findById(req.params.id)
      .populate('category createdBy')
      .exec()
      .then(answer => {
        if (req.session.body === undefined || (req.headers.referer && req.headers.referer.indexOf('/answer/' + req.params.id + '/edit') < 0)) {
          req.session.body = null
          req.session.errors = null
        }
        res.render('answers/answer', { answer: answer, body: req.session.body, errors: req.session.errors })
      })
  },
  update: (req, res) => {
    req.check('answer', 'Answer is required').notEmpty()
    req.check('answer', 'Answer must be minimum 10 characters').isLength({ min: 10 })

    let errors = req.validationErrors()
    if (errors) {
      req.session.body = req.body
      req.session.errors = errors
      res.redirect(req.headers.referer)
    } else {
      req.session.body = null
      req.session.errors = null
      Answer.findById(req.params.id)
      .exec()
      .then(answer => {
        if (answer) {
          answer.text = req.body.answer
          answer.save()
          .then(err => {
            if (err) console.log(err)
            res.redirect('/threads')
          })
        } else {
          res.redirect('/threads')
        }
      })
    }
  },
  vote: (req, res) => {
    if (req.user) {
      Answer.findById(req.params.id)
        .exec()
        .then(answer => {
          let vote = req.params.vote
          let votedUp = answer.votesUp.indexOf(req.user._id) > -1
          let votedDown = answer.votesDown.indexOf(req.user._id) > -1
          if (vote === 'up') {
            if (votedDown) {
              answer.votesDown = answer.votesDown.filter((user) => { return user.toString() !== req.user._id.toString() })
            } else if (!votedUp) {
              answer.votesUp.push(req.user)
            }
            answer.totalVotes = answer.votesUp.length - answer.votesDown.length
            answer.save()
              .then(thread => {
                res.send({ success: true, totalVotes: answer.totalVotes })
              })
          } else if (vote === 'down') {
            if (votedUp) {
              answer.votesUp = answer.votesUp.filter((user) => { return user.toString() !== req.user._id.toString() })
            } else if (!votedDown) {
              answer.votesDown.push(req.user)
            }
            answer.totalVotes = answer.votesUp.length - answer.votesDown.length
            answer.save()
              .then(thread => {
                res.send({ success: true, totalVotes: thread.totalVotes })
              })
          } else {
            res.send({ success: true, totalVotes: answer.totalVotes })
          }
        })
    } else {
      res.send({ success: false, message: 'You have to be logged in order to vote.' })
    }
  },
  comment: (req, res) => {
    req.check('comment', 'Comment is required').notEmpty()
    req.check('comment', 'Comment must be minimum 10 characters').isLength({ min: 10 })

    let errors = req.validationErrors()
    if (errors) {
      req.session.body = req.body
      req.session.errors = errors
      res.send({ success: false, errors: errors.map(error => { return error.msg }) })
    } else {
      new Comment({
        text: req.body.comment,
        answer: req.params.id,
        createdBy: req.user
      }).save()
        .then(comment => {
          req.session.body = null
          req.session.errors = null
          Answer.findById(req.params.id)
            .exec()
            .then(answer => {
              answer.comments.push(comment)
              answer.totalComments = answer.comments.length
              answer.save()
                .then(answer => {
                  res.send({ success: true, comment: comment.text, createdBy: comment.createdBy.fullname(), date: dateFormat(comment.createdAt, 'customFormat') })
                })
            })
        })
    }
  },
  delete: (req, res) => {
    Answer.findById(req.params.id)
    .exec()
    .then(answer => {
      answer.remove()
      res.redirect(req.headers.referer)
    })
  }
}
