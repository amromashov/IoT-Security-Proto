const passport = require('passport')
const fabric = require('../fabric')
const db = require('../db')

function initUser (app) {
  app.get('/operator', renderWelcome)  
  app.get('/operator_profile', passport.authenticationMiddleware(), renderProfile)
  app.post('/operator_login', passport.authenticate('local', {
    successRedirect: '/operator_profile',
    failureRedirect: '/operator'
  }))
  app.get('/operator_list_users', passport.authenticationMiddleware(), renderListUsers)
  app.get('/operator_register', passport.authenticationMiddleware(), renderRegisterUser)
  app.post('/operator_register', passport.authenticationMiddleware(), registerUser)
}

function renderWelcome (req, res) {
  res.render('operator/welcome')
}

function renderProfile (req, res) {
  res.render('operator/profile')
}

function renderUser (req, res) {
  res.render('operator/user', {
    user: db.getUser(),
  })
}

function renderRegisterUser (req, res) {
  res.render('operator/register')
}


function renderListUsers (req, res) {
  let users = db.getAllUsers();
  res.render('operator/list_users', {
    users: users,
  })
}

function registerUser (req, res) {
  var (result, error) = fabric.registerUser(req.body.user)
  result = db.putUser(req.body.user, req.body.password)
  res.redirect('/operator_profile')
}

module.exports = initUser
