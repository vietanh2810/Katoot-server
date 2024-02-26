const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

const db = {};

db.mongoose = mongoose;
db.user = require("./user.model");
db.role = require("./role.model");
db.refreshToken = require("./refreshToken.model");
db.quiz = require("./quiz.model");
db.playerResult = require("./playerResult.js");
db.session = require("./session.js");
db.leaderBoard = require("./leaderBoard.js");

db.ROLES = ["user", "admin", "moderator"];

module.exports = db;