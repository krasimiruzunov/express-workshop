const Thread = require('mongoose').model('Thread')

module.exports = {
  index: (req, res) => {
    let page = parseInt(req.query.page || 1)
    let options = {
      populate: 'category createdBy',
      page: page,
      limit: 20,
      sort: { lastAnswer: -1 }
    }

    Thread.paginate({}, options).then(result => {
      res.render('home/index', { threads: result.docs, pages: result.pages, page: result.page })
    })
  }
}
