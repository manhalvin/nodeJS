var express = require('express');
var db = require('../models/database');
const bcrypt = require('bcrypt');
const multer = require('multer');
const path = require('path');
const allowed_file_size = 2;

const { check, validationResult } = require('express-validator');
var router = express.Router();

// router.get('/', function (req, res, next) {
//   // let sql = `SELECT * FROM users`;
//   let sql = `SELECT * FROM users ORDER BY ${sortField} ${sortOrder} LIMIT ?, ?`;
//   const offset = (pageNumber - 1) * pageSize;
//   let errors = null;
//   db.query(sql, [offset, pageSize], function (err, data) {
//     res.render("users/index.ejs", {
//       users: data,
//       errors: errors,
//       pageNumber: pageNumber,
//       pageSize: pageSize,
//       totalPages: Math.ceil(totalRecords / pageSize),
//       sortField: sortField,
//       sortOrder: sortOrder
//     });
//   });
// });

router.get('/', function (req, res) {

  if(!res.session){
    if(!req.session.isLogin){
      res.redirect("/auth/login");
    }
  }

  const perPage = 5;
  const page = req.query.page || 1;
  const sortField = req.query.sortField || 'id';
  const sortOrder = req.query.sortOrder || 'asc';

  db.query(`SELECT * FROM users ORDER BY ${sortField} ${sortOrder} LIMIT ? OFFSET ?`, [perPage, (page - 1) * perPage], function (error, results, fields) {
    if (error) throw error;

    const users = results;
    db.query("SELECT COUNT(*) AS count FROM users", function (error, results, fields) {
      if (error) throw error;

      const count = results[0].count;
      const totalPages = Math.ceil(count / perPage);
      const url = req.originalUrl.split("?")[0];

      res.render('users/index.ejs', {
        users: users,
        page: page,
        pages: totalPages,
        url: url,
        sortField: sortField,
        sortOrder: sortOrder,
        name:req.session.name
      });
    });
  });
});


// router.get('/index', function (req, res) {
//   const perPage = 10;
//   const page = req.query.page || 1;
//   const sortField = req.query.sortField || 'id'; // Define sortField variable

//   // Query the database to get the users data with pagination and sorting
//   User.findAndCountAll({
//     limit: perPage,
//     offset: (page - 1) * perPage,
//     order: [[sortField, 'ASC']],
//   })
//     .then(function (data) {
//       const users = data.rows;
//       const count = data.count;
//       const totalPages = Math.ceil(count / perPage);
//       const url = req.originalUrl.split("?")[0];

//       res.render('users/index.ejs', {
//         users: users,
//         current: page,
//         pages: totalPages,
//         url: url,
//         sortField: sortField, // Pass sortField variable to the view
//       });
//     })
//     .catch(function (err) {
//       console.log('Oops! something went wrong, : ', err);
//     });
// });


router.get('/create', function (req, res, next) {
  let errors, name, email, status = null;
  res.render("users/create.ejs", { errors: errors, email: email, name: name, status: status });
});

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads/')
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname))
  }
});

const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    check(file.mimetype).isIn(['image/jpeg', 'image/png']).withMessage('Only JPG and PNG images are allowed')
    cb(null, true) // Added callback parameter
  }
});

// file.filename, file.mimetype, file.size, file.path
router.post('/store', upload.single('file'), [
  check('name', 'Tên không được để trống').notEmpty(),
  check('file').custom((value, { req, res }) => {
    if (!req.file) {
      throw new Error('Please select a file to upload')
    }

    if (!['image/jpeg', 'image/png'].includes(req.file.mimetype)) {
      throw new Error('Only JPG and PNG images are allowed');
    }

    if ((req.file.size / (1024 * 1024)) > allowed_file_size) {
      throw Error('File too large');
    }
    return true
  }),
  check('email', 'Email không được để trống').notEmpty(),
  check('email')
    .isEmail().withMessage('Email không hợp lệ')
    .custom((value, { req }) => {
      return new Promise((resolve, reject) => {
        const query = `SELECT COUNT(*) as count FROM users WHERE email = ?`;
        db.query(query, [value], (err, results) => {
          if (err) {
            reject(new Error('Lỗi Database'));
          } else {
            const count = results[0].count;
            if (count > 0) {
              reject(new Error('Email đã tồn tại trên hệ thống'));
            } else {
              resolve();
            }
          }
        });
      });
    }),
  check('password', 'Mật khẩu quá ít 5 ký tự').isLength({ min: 5 }),
  check('confirm_password')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Password confirmation does not match password');
      }
      return true;
    })
], function (req, res, next) {
  let name = req.body.name;
  let email = req.body.email;
  let password = req.body.password;
  let status = req.body.status;
  let file = req.file;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.render('users/create.ejs', {
      errors: errors.mapped(),
      name: name,
      email: email,
      status: status
    })
  } else {

    const saltRounds = 10;
    bcrypt.hash(password, saltRounds, (err, hash) => {
      if (err) {
        throw new Error(err.message);
      }
      data = {
        name: name,
        email: email,
        password: hash,
        status: status,
        file_name: file.filename,
        file_mimetype: file.mimetype,
        file_size: file.size,
        file_path: file.path
      }
      db.query('INSERT INTO users SET ?', data, function (err, response) {
        if (err) throw err;
        res.redirect("/users/");
      });
    });
  }

});

router.get('/edit/:id', function (req, res, next) {
  var id = req.params.id;
  let errors;
  let sql = `SELECT id,name, email, status FROM users where id=${id}`;
  db.query(sql, function (err, data) {
    res.render("users/edit.ejs", { user: data[0], errors: errors });
  });
});

router.post('/update', [
  check('name', 'Tên không được để trống').notEmpty(),
  check('name').isLength({ min: 5 }).withMessage('Họ tên ít nhất trên 5 ký tự'),
  check('status', 'Status empty !').notEmpty()
], function (req, res, next) {
  const errors = validationResult(req);

  let user = { id: req.body.id, name: req.body.name, status: req.body.status };
  if (!errors.isEmpty()) {
    res.render('users/edit.ejs', {
      errors: errors.mapped(),
      user: user
    })
  } else {
    let id = req.body.id;
    let name = req.body.name;
    let status = req.body.status;

    db.query(`UPDATE users SET name=?,status=? WHERE id = ?`, [name, status, id],
      function (err, data) {
        if (data.affectedRows == 0) {
          console.log(`No find id: ${id} to update`);
        }
        res.redirect("/users/");
      })
  }

});

router.get('/delete/:id', function (req, res) {
  let id = req.params.id;
  let sql = `DELETE FROM users WHERE id = ?`;
  db.query(sql, [id], function (err, data) {
    if (data.affectedRows == 0) {
      console.log(`No find id: ${id} to delete`);
    }
    res.redirect('/users');
  })
});


module.exports = router;
