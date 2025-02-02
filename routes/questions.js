var express = require('express');
var router = express.Router();
const { Question, Answer } = require("../models/questions");
const User = require('../models/user');
const { checkBody } = require('../modules/checkBody');
const uniqid = require('uniqid');
const cloudinary = require('cloudinary').v2;
const fs = require('fs');

// Récupère toutes les questions :
router.get('/', (req, res) => {
  Question.find().then((data) => {
    if (data.length > 0) {
      res.json({ result: true, questions: data });
    } else {
      res.json({ result: false, error: 'No question saved' });
    }
  })
});

// Récupère les informations d'une question :
router.get('/:id', (req, res) => {
  Question.findOne({ _id: req.params.id })
    .populate('answers')
    .then((data) => {
      console.log(data)
      res.json({ result: true, question: data });
    });
});

// Permet d'ajouter une nouvelle question :
router.post('/add', async (req, res) => {
  if (!checkBody(req.body, ["username", "title", "message"])) {
    return res.json({ result: false, error: "Missing or empty fields" });
  }
  let pictures = [];
  if (req.files && req.files.photoFromFront && req.files.photoFromFront.size > 0) {
    try {
      const photoPath = `./tmp/${uniqid()}.jpg`;
      await req.files.photoFromFront.mv(photoPath);
      console.log('Photo moved to:', photoPath);
      const resultCloudinary = await cloudinary.uploader.upload(photoPath);
      console.log('Photo uploaded to Cloudinary:', resultCloudinary.secure_url);
      fs.unlinkSync(photoPath);
      pictures.push(resultCloudinary.secure_url);
    } catch (uploadError) {
      console.error('Error during file upload:', uploadError);
      return res.json({ result: false, error: 'Error during file upload' });
    }
  }
  const user = await User.findOne({ username: req.body.username });
  if (!user) {
    return res.json({ result: false, error: 'User not found' });
  }
  const newQuestion = new Question({
    author: user._id,
    date: Date.now(),
    title: req.body.title,
    pictures: pictures,
    message: req.body.message,
    answers: [],
  });
  await newQuestion.save();
  const data = await Question.findOne({ _id: newQuestion._id });
  if (data) {
    res.json({ result: true, data });
  } else {
    res.json({ result: false, error: 'Question not saved' });
  }
});

// Permet d'ajouter une réponse à une question :
router.put('/addResponse/:id', (req, res) => {
  const { id } = req.params;
  const { author, pictures, content } = req.body;
  const newAnswer = new Answer({
    date: new Date(),
    author: author,
    pictures: pictures || [],
    content: content
  });
  Question.findById(id)
    .then((question) => {
      if (!question) {
        return res.status(404).json({ message: "Question not found" });
      }
      question.answers.push(newAnswer);
      question.save()
        .then((data) => {
          res.status(200).json({ result: true, question: data });
        })
    });
});

// Permet d'ajouter un like à une réponse :
router.put('/addLike/:questionId/:answerId', (req, res) => {
  const { questionId, answerId } = req.params;
  User.findOne({ username: req.body.username })
    .then((toto) => {
      const user = toto._id;
      Question.findById(questionId)
        .then((question) => {
          const answer = question.answers.id(answerId);
          if (answer.hasLiked.includes(user)) {
            return res.json({ result: false, message: "User has already liked this answer" });
          }
          answer.hasLiked.push(user);
          question.save()
            .then((data) => {
              res.status(200).json({ result: true, question: data });
            });
        });
      });
    });

  module.exports = router;