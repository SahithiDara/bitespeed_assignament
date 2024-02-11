const mysql = require('mysql2')
var host= process.env.MYSQL_HOST
var user= process.env.MYSQL_USER
var password=process.env.MYSQL_PASSWORD
var database= process.env.MYSQL_DATABASE
var dbport= process.env.MYSQL_DBPORT

console.log('------------')
console.log(host)
console.log(user)
console.log(password)
console.log(database)
console.log(dbport)
console.log('------------')


// using freemysqlhosting.net to host mysql DB
const pool = mysql.createPool({
  host: host,
  user: user,
  password: password,
  database: database,
  port: dbport
}).promise()

module.exports = pool;