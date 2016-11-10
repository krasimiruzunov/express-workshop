const Thread = require('mongoose').model('Thread')
const Category = require('mongoose').model('Category')
const Answer = require('mongoose').model('Answer')

module.exports = {
  index: (req, res) => {
    let page = parseInt(req.query.page || 1)
    let limit = parseInt(req.session.threadsLimit || 5)
    let field = req.session.sortThreadField || ''
    let direction = req.session.sortThreadDirection || ''
    let options = {
      populate: 'category createdBy',
      page: page,
      limit: limit,
      sort: { createdAt: -1 }
    }

    Thread.paginate({}, options).then(result => {
      res.render('threads/index', { threads: result.docs, pages: result.pages, page: result.page, threadsLimit: limit, field: field, direction: direction })
    })
  },
  create: (req, res) => {
    Category.find({})
    .exec()
    .then(categories => {
      if (req.session.body === undefined || (req.headers.referer && req.headers.referer.indexOf('/thread/create') < 0)) {
        req.session.body = null
        req.session.errors = null
      }
      res.render('threads/thread', { categories: categories, action: { text: 'Add', url: `/thread/store` }, body: req.session.body, errors: req.session.errors })
    })
  },
  store: (req, res) => {
    req.check('title', 'Title is required').notEmpty()
    req.check('title', 'Title must be minimum 2 characters').isLength({ min: 2 })
    req.check('description', 'Description is required').notEmpty()
    req.check('description', 'Description must be minimum 10 characters').isLength({ min: 10 })
    req.check('category', 'Category is required').notEmpty()

    let errors = req.validationErrors()
    if (errors) {
      req.session.body = req.body
      req.session.errors = errors
      res.redirect(req.headers.referer)
    } else {
      req.session.body = null
      req.session.errors = null
      let thread = new Thread({
        title: req.body.title,
        description: req.body.description,
        category: req.body.category,
        createdBy: req.user
      })

      thread.save((err) => {
        if (err) {
          req.session.body = req.body
          req.session.errors = [{ msg: 'There is already a thread with this title' }]
          res.redirect(req.headers.referer)
        } else {
          req.session.body = null
          req.session.errors = null
          Category.findById(req.body.category)
          .exec()
          .then(category => {
            category.threads.push(thread)
            category.totalThreads = category.threads.length
            category.save((err) => {
              if (err) throw err
              res.redirect('/threads')
            })
          })
        }
      })
    }
  },
  edit: (req, res) => {
    Thread.findById(req.params.id)
      .populate('category createdBy')
      .exec()
      .then(thread => {
        Category.find({})
          .exec()
          .then(categories => {
            if (req.session.body === undefined || (req.headers.referer && req.headers.referer.indexOf('/thread/' + req.params.id + '/edit') < 0)) {
              req.session.body = null
              req.session.errors = null
            }
            res.render('threads/thread', { thread: thread, categories: categories, action: { text: 'Update', url: `/thread/${thread._id}/update` }, body: req.session.body, errors: req.session.errors })
          })
      })
  },
  update: (req, res) => {
    req.check('title', 'Title is required').notEmpty()
    req.check('title', 'Title must be minimum 2 characters').isLength({ min: 2 })
    req.check('description', 'Description is required').notEmpty()
    req.check('description', 'Description must be minimum 10 characters').isLength({ min: 10 })
    req.check('category', 'Category is required').notEmpty()

    let errors = req.validationErrors()
    if (errors) {
      req.session.body = req.body
      req.session.errors = errors
      res.redirect(req.headers.referer)
    } else {
      req.session.body = null
      req.session.errors = null
      Thread.findOne({
        _id: { $ne: req.params.id },
        title: req.body.title
      })
      .exec()
      .then(thread => {
        if (thread) {
          req.session.body = req.body
          req.session.errors = [{ msg: 'There is already a thread with this title' }]
          res.redirect(req.headers.referer)
        } else {
          req.session.body = null
          req.session.errors = null
          Thread.findById(req.params.id)
          .exec()
          .then(thread => {
            if (thread) {
              thread.title = req.body.title
              thread.description = req.body.description
              thread.category = req.body.category
              thread.createdBy = req.user
              thread.save()
              .then(err => {
                if (err) console.log(err)
                res.redirect('/threads')
              })
            } else {
              res.redirect('/threads')
            }
          })
        }
      })
    }
  },
  details: (req, res) => {
    Thread.findById(req.params.id)
    .deepPopulate('createdBy answers.createdBy answers.comments answers.comments.createdBy')
    .exec()
    .then(thread => {
      if (req.session.body === undefined || (req.headers.referer && req.headers.referer.indexOf(`/thread/${req.params.id}/${encodeURIComponent(req.params.title)}`) < 0)) {
        thread.totalViews = thread.totalViews || 0
        thread.totalViews += 1
        thread.save()
          .then(thread => {
            req.session.body = null
            req.session.errors = null
            thread.answers = thread.answers.sort((a, b) => { return b.createdAt - a.createdAt })
            res.render('threads/details', { thread: thread, body: req.session.body, errors: req.session.errors })
          })
      } else {
        thread.answers = thread.answers.sort((a, b) => { return b.createdAt - a.createdAt })
        res.render('threads/details', { thread: thread, body: req.session.body, errors: req.session.errors })
      }
    })
  },
  vote: (req, res) => {
    if (req.user) {
      Thread.findById(req.params.id)
      .exec()
      .then(thread => {
        let vote = req.params.vote
        let votedUp = thread.votesUp.indexOf(req.user._id) > -1
        let votedDown = thread.votesDown.indexOf(req.user._id) > -1
        if (vote === 'up') {
          if (votedDown) {
            thread.votesDown = thread.votesDown.filter((user) => { return user.toString() !== req.user._id.toString() })
          } else if (!votedUp) {
            thread.votesUp.push(req.user)
          }
          thread.totalVotes = thread.votesUp.length - thread.votesDown.length
          thread.save()
            .then(thread => {
              res.send({ success: true, totalVotes: thread.totalVotes })
            })
        } else if (vote === 'down') {
          if (votedUp) {
            thread.votesUp = thread.votesUp.filter((user) => { return user.toString() !== req.user._id.toString() })
          } else if (!votedDown) {
            thread.votesDown.push(req.user)
          }
          thread.totalVotes = thread.votesUp.length - thread.votesDown.length
          thread.save()
            .then(thread => {
              res.send({ success: true, totalVotes: thread.totalVotes })
            })
        } else {
          res.send({ success: true, totalVotes: thread.totalVotes })
        }
      })
    } else {
      res.send({ success: false, message: 'You have to be logged in order to vote.' })
    }
  },
  answer: (req, res) => {
    req.check('answer', 'Answer is required').notEmpty()
    req.check('answer', 'Answer must be minimum 10 characters').isLength({ min: 10 })

    let errors = req.validationErrors()
    if (errors) {
      req.session.body = req.body
      req.session.errors = errors
      res.redirect(req.headers.referer)
    } else {
      new Answer({
        text: req.body.answer,
        thread: req.params.id,
        createdBy: req.user
      }).save()
        .then(answer => {
          req.session.body = null
          req.session.errors = null
          Thread.findById(req.params.id)
            .exec()
            .then(thread => {
              thread.answers.push(answer)
              thread.totalAnswers = thread.answers.length
              thread.lastAnswer = new Date()
              thread.save()
                .then(thread => {
                  res.redirect(req.headers.referer)
                })
            })
        })
    }
  },
  limit: (req, res) => {
    req.session.threadsLimit = req.body.limit
    res.send({ success: true, message: 'Limit was successfully set' })
  },
  delete: (req, res) => {
    Thread.findById(req.params.id)
    .exec()
    .then(thread => {
      thread.remove()
      res.redirect(req.headers.referer)
    })
  }
}
