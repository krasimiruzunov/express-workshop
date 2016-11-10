const Category = require('mongoose').model('Category')
const Thread = require('mongoose').model('Thread')

module.exports = {
  index: (req, res) => {
    let page = parseInt(req.query.page || 1)
    let limit = parseInt(req.session.categoriesLimit || 5)
    let field = req.session.sortCategoryField || ''
    let direction = req.session.sortCategoryDirection || ''
    let options = {
      populate: 'createdBy',
      page: page,
      limit: limit
    }

    if (field) {
      options.sort = { [field]: direction === 'asc' ? 1 : -1 }
    }

    Category.paginate({}, options).then(result => {
      res.render('categories/index', { categories: result.docs, pages: result.pages, page: result.page, categoriesLimit: limit, field: field, direction: direction })
    })
  },
  create: (req, res) => {
    if (req.session.body === undefined || (req.headers.referer && req.headers.referer.indexOf('/category/create') < 0)) {
      req.session.body = null
      req.session.errors = null
    }
    res.render('categories/category', { action: { text: 'Add', url: `/category/store` }, body: req.session.body, errors: req.session.errors })
  },
  store: (req, res) => {
    req.check('name', 'Name is required').notEmpty()
    req.check('name', 'Name must be minimum 2 characters').isLength({ min: 2 })

    let errors = req.validationErrors()
    if (errors) {
      req.session.body = req.body
      req.session.errors = errors
      res.redirect(req.headers.referer)
    } else {
      req.session.body = null
      req.session.errors = null
      let category = new Category({
        name: req.body.name,
        createdBy: req.user
      })
      category.save((err) => {
        if (err) {
          req.session.body = req.body
          req.session.errors = [{ msg: 'There is already a category with this name' }]
          res.redirect(req.headers.referer)
        } else {
          req.session.body = null
          req.session.errors = null
          res.redirect('/categories')
        }
      })
    }
  },
  edit: (req, res) => {
    Category.findById(req.params.id)
      .exec()
      .then(category => {
        if (req.session.body === undefined || (req.headers.referer && req.headers.referer.indexOf('/category/' + req.params.id + '/edit') < 0)) {
          req.session.body = null
          req.session.errors = null
        }
        res.render('categories/category', { category: category, action: { text: 'Update', url: `/category/${category._id}/update` }, body: req.session.body, errors: req.session.errors })
      })
  },
  update: (req, res) => {
    req.check('name', 'Name is required').notEmpty()
    req.check('name', 'Name must be minimum 2 characters').isLength({ min: 2 })

    let errors = req.validationErrors()
    if (errors) {
      req.session.body = req.body
      req.session.errors = errors
      res.redirect(req.headers.referer)
    } else {
      req.session.body = null
      req.session.errors = null
      Category.findOne({
        _id: { $ne: req.params.id },
        name: req.body.name
      })
      .exec()
      .then(category => {
        if (category) {
          req.session.body = req.body
          req.session.errors = [{ msg: 'There is already a category with this name' }]
          res.redirect(req.headers.referer)
        } else {
          req.session.body = null
          req.session.errors = null
          Category.findById(req.params.id)
          .exec()
          .then(category => {
            if (category) {
              category.name = req.body.name
              category.createdBy = req.user
              category.save()
              .then(err => {
                if (err) console.log(err)
                res.redirect('/categories')
              })
            } else {
              res.redirect('/categories')
            }
          })
        }
      })
    }
  },
  delete: (req, res) => {
    Category.findById(req.params.id)
    .populate('threads')
    .exec()
    .then(category => {
      category.remove()
      res.redirect(req.headers.referer)
    })
  },
  limit: (req, res) => {
    req.session.categoriesLimit = req.body.limit
    res.send({ success: true, message: 'Limit was successfully set' })
  },
  sort: (req, res) => {
    if (req.user) {
      req.session.sortCategoryField = req.body.field
      req.session.sortCategoryDirection = req.body.direction
      res.send({ success: true, message: 'Sort was successfully set' })
    }
  },
  threads: (req, res) => {
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

    if (field) {
      options.sort = { [field]: direction === 'asc' ? 1 : -1 }
    }
    Category.findOne({ name: req.params.name })
    .exec()
    .then(category => {
      let query = Thread.find({}).where('category').equals(category._id)
      Thread.paginate(query, options).then(result => {
        res.render('categories/threads', { categoryName: req.params.name, threads: result.docs, pages: result.pages, page: result.page, threadsLimit: limit, field: field, direction: direction })
      })
    })
  }
}
