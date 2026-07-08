const mongoose = require('../config/database');
const User = require('./User');
const Category = require('./Category');
const Place = require('./Place');
const Post = require('./Post');
const PostImage = require('./PostImage');
const Comment = require('./Comment');
const Like = require('./Like');
const ViewHistory = require('./ViewHistory');
const Trip = require('./Trip');
const TripDay = require('./TripDay');
const TripPlace = require('./TripPlace');
const Notification = require('./Notification');
const Report = require('./Report');
const ChatMessage = require('./ChatMessage');

module.exports = {
  mongoose,
  User,
  Category,
  Place,
  Post,
  PostImage,
  Comment,
  Like,
  ViewHistory,
  Trip,
  TripDay,
  TripPlace,
  Notification,
  Report,
  ChatMessage
};
