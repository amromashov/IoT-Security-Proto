'use strict';

//connecting to mysql (client)
const mysql = require("mysql2");

const connection = mysql.createConnection({
    host: "localhost",
    user: "root",
    database: "meter",
    password: "yZ356One"
});
connection.connect(function(err){
    if (err) {
        return console.error(err.message);
    } else {
        console.log("Successfully connected MySQL server");
    }
});

var query = connection.query('DROP TABLE IF EXISTS transactions, credentials, unused', [], function (error, results, fields) {
    if (error) throw error;
    console.log('dropped all tables');
});
query = connection.query("CREATE TABLE credentials ( user varchar(10) NOT NULL DEFAULT '', salt varchar(52200) NOT NULL DEFAULT '', publicKey char(64) NOT NULL DEFAULT '', secretKey char(64) NOT NULL DEFAULT '', PRIMARY KEY (publicKey) )", [], function (error, results, fields) {
    if (error) throw error;
    console.log('created credentials table');
});
query = connection.query("CREATE TABLE transactions ( id varchar(10) NOT NULL DEFAULT '', user varchar(5) NOT NULL DEFAULT '', ts varchar(20) NOT NULL DEFAULT '0', duration varchar(10) NOT NULL DEFAULT '0', PRIMARY KEY (id) )", [], function (error, results, fields) {
    if (error) throw error;
    console.log('created transactions table');
});
query = connection.query("CREATE TABLE unused ( publicKey varchar(128) NOT NULL DEFAULT '', PRIMARY KEY (publicKey) )", [], function (error, results, fields) {
    if (error) throw error;
    console.log('created unused table');
});

connection.end(function(err) {
    if (err) {
        return console.log(err.message);
    }
    console.log("Connection to MySQL dropped");
});
