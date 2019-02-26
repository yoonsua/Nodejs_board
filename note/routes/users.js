var express = require('express');
var mysql = require('mysql');
var router = express.Router();
var crypto = require('crypto');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var KakaoStrategy = require('passport-kakao').Strategy;

// db 연결
var connection = mysql.createConnection({
  host:'localhost',
  port:3306,
  user:'root',
  password:'1234',
  database:'note'
});
connection.connect();

passport.serializeUser(function (user, done) { 
  // console.log("serial : ");
  // console.log(user);
  done(null, user);
});

/*인증 후, 페이지 접근시 마다 사용자 정보를 Session에서 읽어옴.*/
passport.deserializeUser(function (user, done) {
  // console.log("deserial : ");
  // console.log(user);
  done(null, user);
});

passport.use(new LocalStrategy({
  usernameField: 'id',
  passwordField: 'password',
  session: true, // 사용여부
  passReqToCallback: true
}, function (req, id, password, done) {
  connection.query('select * from `user` where `id` = ?', id, function (err, result) { // user 조회
    if (err) {
      console.log('err :' + err);
      return done(false, null);
    } else {
      if (result.length === 0) {
        console.log('해당 유저가 없습니다');
        return done(false, null);
      } else {
        var hashpass = crypto.createHash("sha512").update(password).digest("hex");
        if (hashpass != result[0].password) {
          console.log('패스워드가 일치하지 않습니다');
          return done(false, null);
        } else {
          console.log('로그인 성공');
          return done(null, {
            id: result[0].id,
            name: result[0].name,
            no: result[0].no
          });
        }
      }
    }
  })
}));

router.get('/', function(req, res) {
  var sql = "select * from user;";
  var query = connection.query(sql, function(err, rows) {
    if(err) {throw err;}
    console.log(rows);
    res.render('users', { users:rows });
  });
});

router.get('/signup', function(req, res, next) {
  if (req.session.passport !== undefined) {
    if (req.session.passport.user !== undefined) {
      //로그인 한 사용자
      res.redirect('/');
    } else { // 로그아웃 한 사용자
      res.render('signup', {
        title: 'MyBoard',
        session: {}
      });
    }
  } else { // 처음 방문한 사용자
    res.render('signup', {
      title: 'MyBoard',
      session: {}
    });
  }
});

router.post('/signup', function(req, res, next) {
  var id = req.body.id;
  var password = req.body.password;
  var hashpass = crypto.createHash("sha512").update(password).digest("hex");
  var name  = req.body.name;
  var email = req.body.email;
  var address = req.body.address;
  var datas = [id, hashpass, name, email,address];
  console.log("데이터" + datas);
  var sql = "insert into user (id, password, name, email, address) values (?, ?, ?, ?, ?)";
  var query = connection.query(sql, datas, function(err, rows) {
    if(err) {
      throw err;
    }
    console.log("Data inserted !");
    res.redirect('/');
  });
});

router.get('/login', function(req, res, next) {
  if(req.session.passport !== undefined) {
    if(req.session.passport.user !== undefined) { //로그인 한 사용자      
      res.redirect('/');
    } else { // 로그아웃 한 사용자
      res.render('login', { title: 'Login', session:{} });
    }
  } else { // 처음 방문한 사용자
    res.render('login', { title: 'Login', session:{} });
  }
});

router.post('/login', passport.authenticate('local', {
  failureRedirect: '/users/login', // 실패
  failureFlash: true // 성공
}), // 인증실패시 401 리턴, {} -> 인증 스트레티지
function (req, res) {
  res.redirect('/');
}
);

router.get('/logout', function(req, res) {
  if(req.session.passport !== undefined) {
    if(req.session.passport.user !== undefined) { // 로그인 한 사용자
      req.logout(); // 로그아웃
      res.redirect('/');
      console.log(req.session);
    } else { // 로그아웃 사용자
      res.redirect('/');
    }
  } else {
    res.redirect('/');
  }
});

router.get('/kakao', passport.authenticate('kakao-login'));

// 카카오 로그인 연동 callback
router.get('/oauth/kakao/callback', passport.authenticate('kakao-login', {
  successRedirect: '/',
  failureRedirect: '/users/login'
}));

// kakaotalk 로그인 인증
passport.use('kakao-login', new KakaoStrategy({
  clientID: 'f86e66d7934c3673eeb42f3ba3b643e9',
  clientSecret: 'pPhROzT9Y9X9aROh6Fg0PkjsejNnHHgD',
  callbackURL: 'http://localhost:3000/users/oauth/kakao/callback'
}, function (accessToken, refreshToken, profile, done) {
  console.log('kakao login info');
  console.log(profile);
  
  var sql = "select * from user where id = ?";
  connection.query(sql, profile.id, function(err, result) {
    if(err) {
      return done(err);
    }
    var id = profile.id;
    var password = "kakao";
    var hashpass = crypto.createHash("sha512").update(password).digest("hex");
    var name = profile.username;
    var email = "kakao";
    var address = "kakao";
    var datas = [id, hashpass, name, email, address];
    if(result.length == 0) { // 신규 유저인 경우 -> 회원가입 & 세션저장
      var sql = "INSERT INTO user (id, password, name, email, address) values (?, ?, ?, ?, ?)";
      connection.query(sql, datas, function (err, result) {
        if(err) {
          return done(err);
        }
        console.log("kakao 신규 유저 저장");
        console.log(result);
        return done(null, { //세션 저장
          id:id,
          name: name,
          no: result.insertId
        });
      });
    } else { // 기존 가입 유저 -> 세션 저장
      return done(null, {
        id:result[0].id,
        name: result[0].name,
        no: result[0].no
      })
    }
  });
}));

module.exports = router;
