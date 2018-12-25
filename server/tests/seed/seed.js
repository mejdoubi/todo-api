const {ObjectID} = require('mongodb');
const jwt = require('jsonwebtoken');

const {Todo} = require('./../../models/todo');
const {User} = require('./../../models/user');

const userOneId = new ObjectID();
const userTwoId = new ObjectID();

const users = [{
  _id: userOneId,
  email: 'o.mejdoubi@gmail.com',
  password: 'userOnePass',
  tokens: [{
    access: 'auth',
    token: jwt.sign({_id: userOneId, access: 'auth'}, process.env.JWT_SECRET).toString()
  }]
}, {
  _id: userTwoId,
  email: 'othman.mejdoubi@realdev.be',
  password: 'userTwoPass',
  tokens: [{
    access: 'auth',
    token: jwt.sign({_id: userTwoId, access: 'auth'}, process.env.JWT_SECRET).toString()
  }]
}];

const todos = [{
  _id: new ObjectID(),
  text: 'First test todo',
  _creator: userOneId
}, {
  _id: new ObjectID(),
  text: 'Second test todo',
  completed: true,
  completedAt: 123,
  _creator: userTwoId
}];

const populateUsers = async () => {
  try {
    await User.deleteMany();
    await new User(users[0]).save();
    await new User(users[1]).save();
  } catch (e) {
    throw new Error(e);
  }
};

const populateTodos = async () => {
  try {
    await Todo.deleteMany();
    await Todo.insertMany(todos);
  } catch (e) {
    throw new Error(e);
  }
};

module.exports = {
  todos,
  users,
  populateTodos,
  populateUsers
};
