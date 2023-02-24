
var mysql = require('mysql');
var db = mysql.createConnection({
    host: 'localhost', user: 'root', password: '',
    database: 'nodejs'
});
db.connect(() => console.log('Connected to the database successfully !'));
module.exports = db;