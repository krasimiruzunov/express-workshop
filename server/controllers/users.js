const encryption = require('../utilities/encryption')
const User = require('mongoose').model('User')
const Thread = require('mongoose').model('Thread')
const Answer = require('mongoose').model('Answer')

module.exports = {
  register: (req, res) => {
    if (req.session.body === undefined || (req.headers.referer && req.headers.referer.indexOf('/users/register') < 0)) {
      req.session.body = null
      req.session.errors = null
    }
    res.render('users/register', { body: req.session.body, errors: req.session.errors })
  },
  store: (req, res) => {
    let inputUser = req.body
    req.check('firstName', 'Firstname is required').notEmpty()
    req.check('firstName', 'FirstName must be minimum 2 characters').isLength({ min: 2 })
    req.check('lastName', 'Firstname is required').notEmpty()
    req.check('lastName', 'LastName must be minimum 2 characters').isLength({ min: 2 })
    req.check('username', 'Username is required').notEmpty()
    req.check('username', 'Username must be minimum 2 characters').isLength({ min: 2 })
    req.check('password', 'Password is required').notEmpty()
    req.check('password', 'Password must be minimum 8 characters').isLength({ min: 8 })
    req.check('confirmPassword', 'Confirm Password is required').notEmpty()
    req.check('confirmPassword', 'Confirm Password must be minimum 8 characters').isLength({ min: 8 })

    let errors = req.validationErrors()
    if (errors) {
      req.session.body = req.body
      req.session.errors = errors
      res.redirect(req.headers.referer)
    } else {
      if (inputUser.password !== inputUser.confirmPassword) {
        req.session.body = inputUser
        req.session.errors = [{ msg: 'Passwords do not match' }]
        res.redirect(req.headers.referer)
      } else {
        inputUser.salt = encryption.generateSalt()
        inputUser.password = encryption.generatePassword(inputUser.salt, inputUser.password)
        inputUser.roles = ['Contributor']
        User
          .findOne({ username: inputUser.username })
          .then(user => {
            if (user) {
              req.session.body = user
              req.session.errors = [{ msg: 'There is already a user with this username' }]
              res.redirect(req.headers.referer)
            } else {
              User
              .create(inputUser)
              .then(user => {
                req.logIn(user, (err, user) => {
                  if (err) {
                    req.session.body = user
                    req.session.errors = [{ msg: 'Login error' }]
                    res.redirect(req.headers.referer)
                  } else {
                    let redirectUrl = req.session.redirectUrl
                    if (redirectUrl) {
                      req.session.redirectUrl = null
                      res.redirect(redirectUrl)
                    } else {
                      res.redirect('/')
                    }
                  }
                })
              })
            }
          })
      }
    }
  },
  login: (req, res) => {
    if (req.session.body === undefined || (req.headers.referer && req.headers.referer.indexOf('/users/login') < 0)) {
      req.session.body = null
      req.session.errors = null
    }
    res.render('users/login', { body: req.session.body, errors: req.session.errors })
  },
  authenticate: (req, res) => {
    let inputUser = req.body
    req.check('username', 'Username is required').notEmpty()
    req.check('password', 'Password is required').notEmpty()

    let errors = req.validationErrors()
    if (errors) {
      req.session.body = inputUser
      req.session.errors = errors
      res.redirect(req.headers.referer)
    } else {
      req.session.body = null
      req.session.errors = null
      User
        .findOne({ username: inputUser.username })
        .then(user => {
          if (!user || !user.authenticate(inputUser.password)) {
            req.session.body = inputUser
            req.session.errors = [{ msg: 'Invalid username or password' }]
            res.redirect(req.headers.referer)
          } else {
            req.logIn(user, (err, user) => {
              if (err) {
                req.session.body = inputUser
                req.session.errors = [{ msg: 'Login error' }]
                res.redirect(req.headers.referer)
              } else {
                let redirectUrl = req.session.redirectUrl
                if (redirectUrl) {
                  req.session.redirectUrl = null
                  res.redirect(redirectUrl)
                } else {
                  res.redirect('/')
                }
              }
            })
          }
        })
    }
  },
  profile: (req, res) => {
    User.findOne({ username: req.params.username })
      .exec()
      .then(user => {
        res.render('users/profile', { user: user })
      })
  },
  all: (req, res) => {
    let page = parseInt(req.query.page || 1)
    let limit = parseInt(req.session.userThreadsLimit || 5)
    let options = {
      page: page,
      limit: limit,
      sort: { createdAt: -1 }
    }
    User.find({ isBlocked: true })
    .exec()
    .then(blockedUsers => {
      let query = User.find({ roles: { $ne: 'Admin' }, isBlocked: false })
      User.paginate(query, options).then(result => {
        res.render('users/all', { blockedUsers: blockedUsers, users: result.docs, pages: result.pages, page: result.page })
      })
    })
  },
  block: (req, res) => {
    let userIds = req.body.users
    if (Array.isArray(userIds)) {
      for (let i = 0; i < userIds.length; i++) {
        User.findById(userIds[i])
        .exec()
        .then(user => {
          if (user) {
            if (!user.isBlocked) {
              user.isBlocked = true
              user.save()
              .then(err => {
                if (err) console.log(err)
                if (i === userIds.length - 1) {
                  res.redirect(req.headers.referer)
                }
              })
            } else if (i === userIds.length - 1) {
              res.redirect(req.headers.referer)
            }
          } else if (i === userIds.length - 1) {
            res.redirect(req.headers.referer)
          }
        })
      }
    } else if (userIds) {
      User.findById(userIds)
        .exec()
        .then(user => {
          if (user) {
            if (!user.isBlocked) {
              user.isBlocked = true
              user.save()
              .then(err => {
                if (err) console.log(err)
                res.redirect(req.headers.referer)
              })
            } else {
              res.redirect(req.headers.referer)
            }
          } else {
            res.redirect(req.headers.referer)
          }
        })
    } else {
      res.redirect(req.headers.referer)
    }
  },
  unblock: (req, res) => {
    User.findById(req.params.id)
    .exec()
    .then(user => {
      if (user) {
        user.isBlocked = false
        user.save()
        .then(err => {
          if (err) console.log(err)
          res.redirect(req.headers.referer)
        })
      } else {
        res.redirect(req.headers.referer)
      }
    })
  },
  threads: (req, res) => {
    let page = parseInt(req.query.page || 1)
    let options = {
      populate: 'category createdBy',
      page: page,
      limit: 20,
      sort: { createdAt: -1 }
    }

    let query = Thread.find({})
      .where('createdBy').equals(req.params.id)
    Thread.paginate(query, options).then(result => {
      res.render('users/threads', { userId: req.params.id, threads: result.docs, pages: result.pages, page: result.page })
    })
  },
  answers: (req, res) => {
    let page = parseInt(req.query.page || 1)
    let options = {
      populate: 'createdBy',
      page: page,
      limit: 20,
      sort: { createdAt: -1 }
    }

    let query = Answer.find({})
      .where('createdBy').equals(req.params.id)
    Answer.paginate(query, options).then(result => {
      res.render('users/answers', { userId: req.params.id, answers: result.docs, pages: result.pages, page: result.page })
    })
  },
  logout: (req, res) => {
    req.logout()
    res.redirect('/')
  }
}
