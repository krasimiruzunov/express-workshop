const User = require('mongoose').model('User')

module.exports = {
  index: (req, res) => {
    let page = parseInt(req.query.page || 1)
    let options = {
      page: page,
      limit: 20,
      sort: { createdAt: -1 }
    }
    User.find({ roles: { $in: ['Admin'] } })
    .exec()
    .then(admins => {
      let query = User.find({ roles: { $ne: 'Admin' } })
      User.paginate(query, options).then(result => {
        res.render('admins/index', { admins: admins, users: result.docs, pages: result.pages, page: result.page })
      })
    })
  },
  add: (req, res) => {
    let userIds = req.body.users
    if (Array.isArray(userIds)) {
      for (let i = 0; i < userIds.length; i++) {
        User.findById(userIds[i])
        .exec()
        .then(user => {
          if (user) {
            if (user.roles.indexOf('Admin') < 0) {
              user.roles.push('Admin')
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
            if (user.roles.indexOf('Admin') < 0) {
              user.roles.push('Admin')
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
  remove: (req, res) => {
    User.findById(req.params.id)
    .exec()
    .then(user => {
      if (user) {
        user.roles = user.roles.filter(role => { return role !== 'Admin' })
        user.save()
        .then(err => {
          if (err) console.log(err)
          res.redirect(req.headers.referer)
        })
      } else {
        res.redirect(req.headers.referer)
      }
    })
  }
}
