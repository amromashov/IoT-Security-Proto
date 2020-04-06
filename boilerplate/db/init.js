const bcrypt = require('bcrypt')
const mysql  = require('mysql2/promise');
const config = require('../config')
const connection = mysql.createConnection(config.MySQL);

module.exports.putUser = async function putUser (username, password) {
  const saltRounds = 10
  const salt = bcrypt.genSaltSync(saltRounds)
  const passwordHash = bcrypt.hashSync(password, salt)
  const user = [username, passwordHash]
  let [rows, fields] = await connection.execute('INSERT INTO credentials SET ?', user);
  return null
}

module.exports.getUser = async function getUser (username) {
  let [rows, fields] = await connection.execute('SELECT * FROM `credentials` WHERE `username` = ?', [username]);
  return rows[0]
}

module.exports.getAllUsers = async function getAllUsers () {
  let [rows, fields] = await connection.execute('SELECT * FROM `credentials`');
  return rows
}

module.exports.registerDevice = async function registerDevice (user, did, callback) {
  let [rows, fields] = await connection.execute('INSERT INTO devices SET ?', [did, user]);
  return null
}