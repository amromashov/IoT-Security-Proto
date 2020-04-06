const passport = require('passport')
const fabric = require('../fabric')
const db = require('../db')

function user (app) {
  app.get('/', renderWelcome)  
  app.get('/register', renderRegister)
  app.post('/register', registerUser)
  app.get('/profile', passport.authenticationMiddleware(), renderProfile)
  app.get('/transactions', passport.authenticationMiddleware(), renderTransactions)
  app.get('/devices', passport.authenticationMiddleware(), renderDevices)
  app.post('/login', passport.authenticate('local', {
    successRedirect: '/profile',
    failureRedirect: '/'
  }))
  app.post('/register_device', passport.authenticationMiddleware(), registerDevice)

}

function renderWelcome (req, res) {
  res.render('user/welcome')
}

function renderProfile (req, res) {
  res.render('user/profile', {
    username: req.user.username
  })
}

function renderRegister (req, res) {
  res.render('user/register')
}

function registerUser (req, res) {
  var (result, error) = fabric.registerUser(req.body.user)
  result = db.putUser(req.body.user, req.body.password)
  res.redirect('/')
}

function renderTransactions (req, res) {
  let amount = req.body.amount || 0
  let transactions = fabric.getTransactions(req.body.did, amount)
  res.render('user/device', {
    transactions: transactions
  })
}

function renderDevicesList (req, res) {
  let devices = fabric.getUser(req.body.user)
  res.render('user/devices_list', {
    devices: devices,
  })
}

function registerDevice (req, res) {
  var did = "";
  var secret = "";
  var salt = "";
  var device_name = Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 5);
  var untill = 50 * 1024;
  var counter = 0;
  while (counter < untill) {
      salt += Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 1);
      counter++;
  }
  counter = 0;
  while (counter < 64) {
      did += Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 1);
      secret += Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 1);
      counter++;
  }

  var device = {
      owner : req.user.username,
      device : device_name,
      secret : secret,
      did : did,
      salt : salt,
  };

  var (result, error) = fabric.registerDevice(device)

  (result, error) = db.registerDevice(device.user, did)

  res.redirect('/profile')
}

module.exports = user
