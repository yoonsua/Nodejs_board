var express = require('express');
var router = express.Router();
var mysql = require('mysql');

// db 연결
var connection = mysql.createConnection({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: '1234',
    database: 'note'
});
connection.connect();

router.get('/', function (req, res, next) {
    if (req.session.passport !== undefined) {
        if (req.session.passport.user !== undefined) {
            //로그인 한 사용자
            res.render('write', {
                title: 'MyBoard',
                session: req.session.passport
            });
        } else {
            res.redirect('/');
        }
    } else {
        res.redirect('/');
    }
});

router.get('/:no', function (req, res, next) {
    var sql = "SELECT b_no, b_title, b_content, b_writer, user.name as name, DATE_FORMAT((b_time), '%Y-%m-%d') AS b_time from board left join user on board.b_writer = user.`no` WHERE b_no = ? ORDER BY b_no DESC;";
    var no = req.params.no;
    var query = connection.query(sql, no, function (err, rows) {
        if (err) throw err;
        if (rows.length == 1) { // 조회하는 글이 1개일 때
            if (req.session.passport !== undefined) {
                if (req.session.passport.user !== undefined) { //로그인 한 사용자
                    res.render('detail', {
                        title: 'MyBoard',
                        session: req.session.passport,
                        note: rows[0]
                    });
                } else {
                    res.render('detail', {
                        title: 'MyBoard',
                        session: {},
                        note: rows[0]
                    });
                }
            } else {
                res.render('detail', {
                    title: 'MyBoard',
                    session: {},
                    note: rows[0]
                });
            }
            console.log(rows);
        } else { // 조회하는 글이 1개 이상이면 에러
            console.log("error");
            res.redirect('/');
        }
    });
});

router.post('/', function (req, res, next) {
    var title = req.body.title;
    var content = req.body.content;
    var writer_no = req.session.passport.user.no;
    var datas = [writer_no, title, content];
    var sql = "insert into board (b_writer, b_title, b_content) values (?, ?, ?)";
    var query = connection.query(sql, datas, function (err, rows) {
        if (err) throw err;
        res.redirect('/');
    });
});

router.get('/update/:no', function (req, res, next) {
    var sql = "SELECT * FROM board WHERE b_no = ?";
    var note_no = req.params.no;
    var query = connection.query(sql, note_no, function (err, rows) {
        if (rows.length == 1) { // 조회하는 글이 1개일 때
            if (req.session.passport !== undefined) {
                if (req.session.passport.user !== undefined) { //로그인 한 사용자
                    res.render('update', {
                        title: 'MyBoard',
                        session: req.session.passport,
                        note: JSON.stringify(rows[0])
                    });
                } else {
                    res.render('update', {
                        title: 'MyBoard',
                        session: {},
                        note: rows[0]
                    });
                }
            } else {
                res.render('update', {
                    title: 'MyBoard',
                    session: {},
                    note: rows[0]
                });
            }
            console.log(rows);
        }
    });
});

router.post('/update/:no', function (req, res, next) {
    var note_no = req.params.no;
    var title = req.body.title;
    var content = req.body.content;
    var sql = "UPDATE board SET b_title = ?, b_content = ? where b_no = ?";
    var datas = [title, content, note_no];
    console.log(datas);
    var query = connection.query(sql, datas, function (err, rows) {
        if (err) throw err;
        res.redirect('/');
    });
});

router.post('/delete/:no', function (req, res, next) {
    // req.params.no를 통해 글 삭제
    var note_no = req.params.no;
    var sql = "DELETE FROM board where b_no = ?";
    var query = connection.query(sql, note_no, function (err, rows) {
        if (err) throw err;
        res.redirect('/');
    });
});

module.exports = router;