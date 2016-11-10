const controllers = require('../controllers')
const auth = require('../config/auth')

module.exports = (app) => {
  app.get('/', controllers.home.index)

  app.get('/admins/all', [auth.isAuthenticated, auth.isInRole('Admin')], controllers.admins.index)
  app.post('/admins/add', [auth.isAuthenticated, auth.isInRole('Admin')], controllers.admins.add)
  app.get('/admins/:id/remove', [auth.isAuthenticated, auth.isInRole('Admin')], controllers.admins.remove)

  app.get('/users/register', controllers.users.register)
  app.post('/users/store', controllers.users.store)
  app.get('/users/login', controllers.users.login)
  app.post('/users/authenticate', controllers.users.authenticate)
  app.get('/users/profile/:username', auth.isAuthenticated, controllers.users.profile)
  app.get('/users/:id/threads', auth.isAuthenticated, controllers.users.threads)
  app.get('/users/:id/answers', auth.isAuthenticated, controllers.users.answers)
  app.get('/users/all', auth.isAuthenticated, controllers.users.all)
  app.post('/users/block', auth.isAuthenticated, controllers.users.block)
  app.get('/users/:id/unblock', auth.isAuthenticated, controllers.users.unblock)
  app.post('/users/logout', controllers.users.logout)

  app.get('/categories', controllers.categories.index)
  app.get('/category/create', auth.isAuthenticated, controllers.categories.create)
  app.post('/category/store', auth.isAuthenticated, controllers.categories.store)
  app.get('/category/:id/edit', auth.isAuthenticated, controllers.categories.edit)
  app.post('/category/:id/update', auth.isAuthenticated, controllers.categories.update)
  app.post('/categories/limit', auth.isAuthenticated, controllers.categories.limit)
  app.post('/categories/sort', controllers.categories.sort)
  app.get('/category/:id/delete', auth.isAuthenticated, controllers.categories.delete)
  app.get('/category/:name/threads', controllers.categories.threads)

  app.get('/threads', controllers.threads.index)
  app.get('/thread/create', [auth.isAuthenticated, auth.notBlocked], controllers.threads.create)
  app.post('/thread/store', [auth.isAuthenticated, auth.notBlocked], controllers.threads.store)
  app.get('/thread/:id/edit', auth.isAuthenticated, controllers.threads.edit)
  app.post('/thread/:id/update', auth.isAuthenticated, controllers.threads.update)
  app.post('/thread/:id/vote/:vote', controllers.threads.vote)
  app.post('/thread/:id/answer', [auth.isAuthenticated, auth.notBlocked], controllers.threads.answer)
  app.post('/threads/limit', auth.isAuthenticated, controllers.threads.limit)
  app.get('/thread/:id/delete', auth.isAuthenticated, controllers.threads.delete)
  app.get('/thread/:id/:title', controllers.threads.details)

  app.get('/answer/:id/edit', auth.isAuthenticated, controllers.answers.edit)
  app.post('/answer/:id/update', auth.isAuthenticated, controllers.answers.update)
  app.post('/answer/:id/vote/:vote', controllers.answers.vote)
  app.post('/answer/:id/comment', [auth.isAuthenticated, auth.notBlocked], controllers.answers.comment)
  app.get('/answer/:id/delete', auth.isAuthenticated, controllers.answers.delete)

  app.all('*', (req, res) => {
    res.render('404')
  })
}
