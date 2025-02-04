const request = require('supertest');
const app = require('./app.js');
const User = require('./models/user.js');
const mongoose = require('mongoose');

const connectionString = process.env.CONNECTION_STRING;

describe('POST /users/signup', () => {

  beforeAll(async () => {
    await mongoose.connect(connectionString, { useNewUrlParser: true, useUnifiedTopology: true });
  });

  afterAll(async () => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    await mongoose.connection.close();
  });
  

  it('Créer un utilisateur avec un nom d\'utilisateur, un email et un mot de passe valides', async () => {
    const response = await request(app)
      .post('/users/signup')
      .send({
        username: 'john_doe',
        email: 'john@example.com',
        password: '123456',
      });

    expect(response.status).toBe(200); 
    expect(response.body.result).toBe(true);
    expect(response.body.user).toHaveProperty('username', 'john_doe');
    expect(response.body.user).toHaveProperty('token');
  });

  it('Retourner une erreur si des champs sont manquants', async () => {
    const response = await request(app)
      .post('/users/signup')
      .send({
        username: 'john_doe',
        email: 'john@example.com',
      });

    expect(response.body.result).toBe(false);
    expect(response.body.error).toBe('Missing or empty fields');
  });

  it('Retourner une erreur si l\'utilisateur existe déjà', async () => {
    await new User({
      username: 'john_doe',
      email: 'john@example.com',
      password: '123456',
      token: 'someRandomToken',
    }).save();

    const response = await request(app)
      .post('/users/signup')
      .send({
        username: 'john_doe',
        email: 'john@example.com',
        password: '123456',
      });

    expect(response.body.result).toBe(false);
    expect(response.body.error).toBe('User already exists');
  });
});

describe('POST /plants/add', () => {

  beforeAll(async () => {
    await mongoose.connect(connectionString, { useNewUrlParser: true, useUnifiedTopology: true });
  });

  afterAll(async () => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    await mongoose.connection.close();
  });

  it('Créer une plante sans photo', async () => {
    const response = await request(app)
      .post('/plants/add')
      .send({
        username: 'john_doe',
        name: 'Plante Sans Photo',
        description: 'Une plante sans photo'
      });

    expect(response.status).toBe(200);
    expect(response.body.result).toBe(true);
    expect(response.body.data).toHaveProperty('name', 'Plante Sans Photo');
    expect(response.body.data.pictures).toHaveLength(0);
  });

  it('Retourner une erreur si des champs sont manquants', async () => {
    const response = await request(app)
      .post('/plants/add')
      .send({
        username: 'john_doe',
        name: 'Plante Incomplete'
      });

    expect(response.body.result).toBe(false);
    expect(response.body.error).toBe('Missing or empty fields');
  });

  it('Retourner une erreur si l\'utilisateur n\'existe pas', async () => {
    const response = await request(app)
      .post('/plants/add')
      .send({
        username: 'non_existent_user',
        name: 'Plante pour utilisateur inexistant',
        description: 'Une plante test pour un utilisateur inexistant'
      });

    expect(response.body.result).toBe(false);
    expect(response.body.error).toBe('User not found');
  });
});