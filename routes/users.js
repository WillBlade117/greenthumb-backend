var express = require('express');
var router = express.Router();
const User = require("../models/user");
const uid2 = require("uid2");
const bcrypt = require("bcrypt");
const {checkBody} = require('../modules/checkBody')


// Crée un compte utilisateur :
router.post('/signup', function (req, res) {
  if (!checkBody(req.body, ["username", "email", "password"])) {
    res.json({ result: false, error: "Missing or empty fields" });
    return;
  }
  User.findOne({ username: req.body.username })
    .then((data) => {
      if (!data) {
        const hash = bcrypt.hashSync(req.body.password, 10);
        const newUser = new User({
          username: req.body.username,
          email: req.body.email,
          password: hash,
          token: uid2(32),
          date: Date.now(),
          notifications: false,
          experience: 0,
          level: 1,
          isAdmin: false,
        });
        newUser.save().then((user) => {
          res.json({ result: true, user: { username: user.username, token: user.token }});
        });
      } else {
        res.json({ result: false, error: "User already exists" });
      }
    })
});

// Vérifie si l'utilisateur existe dans la base de données :
router.post("/signin", (req, res) => {
  if (!checkBody(req.body, ["email", "password"])) {
    res.json({ result: false, error: "Missing or empty fields" });
    return;
  }

  User.findOne({ email: req.body.email })
  .then((user) => {
    if (user && bcrypt.compareSync(req.body.password, user.password)) {
      res.json({ result: true, user: { username: user.username, token: user.token } });
    } else {
      res.json({ result: false, error: "User not found or wrong password" });
    }
  });
});

module.exports = router;