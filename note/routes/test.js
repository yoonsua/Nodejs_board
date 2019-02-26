var express = require('express');
var router = express.Router();

router.get('/', function(req, res, next) {
    var name = req.query.name;
    var number = req.query.number;
    res.render('test', { name: name, number: number });
});

router.post('/', function(req, res, next) {
    var name = req.body.name; // post일 경우 body 사용
    var number = req.body.number;
    res.render('test', { name: name, number: number });
});

module.exports = router;