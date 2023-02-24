var express = require('express');
var db = require('../models/database');
var router = express.Router();

router.get('/login', function (req, res, next) {
    res.render("auth/login.ejs");
});

router.post('/login', async function (req, res) {
    let email = req.body.email;
    let password = req.body.password;
    let sql = 'SELECT * FROM users WHERE email = ?';
    db.query(sql, [email], (err, rows) => {
        if (rows <= 0) { res.redirect("/auth/login"); return; }
        let user = rows[0];
        let userPassword = user.password;
        const bcrypt = require("bcrypt");
        var kq = bcrypt.compareSync(password, userPassword);
        if (kq) {
            req.session.isLogin = true;
            req.session.name = user.name;
            if (req.session.back) {
                res.redirect(req.session.back);
            }
            else {
                res.redirect("/users");
            }
        }
        else {
            res.redirect("/auth/login");
        }
    });
});

module.exports = router;