var express = require('express');
var router = express.Router();
var mysql = require('mysql');

// db 연결
var connection = mysql.createConnection({
  host:'localhost',
  port:3306,
  user:'root',
  password:'1234',
  database:'note'
});
connection.connect();

/* GET home page. */
router.get('/', function(req, res, next) {
  // 글 전체 목록 조회 후 notes에 넣기
  // res.session.passport를 이용하여 로그인 안 한 사용자는 session:{}으로 주고 로그인 한 사용자는 res.session.passport
  var sql = "SELECT b_no, b_title, user.name as name, DATE_FORMAT((b_time), '%Y-%m-%d') AS b_time from board left join user on board.b_writer = user.`no` ORDER BY b_no DESC;";
  var sql = connection.query(sql, function (err, rows) {
    if (err) {
      throw err;
    }
    if (req.session.passport !== undefined) {
      if (req.session.passport.user !== undefined) {
        //로그인 한 사용자
        res.render('index', {
          title: 'MyBoard',
          session: req.session.passport,
          notes:rows
        });
      } else {
        res.render('index', {
          title: 'MyBoard',
          session: {},
          notes:rows
        });
      }
    } else {
      res.render('index', {
        title: 'MyBoard',
        session: {},
        notes:rows
      });
    }
    console.log(rows);
  });
});

module.exports = router;