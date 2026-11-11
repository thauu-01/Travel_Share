import mongoose from '../config/database.config.js';
import User from './User.js';
import Category from './Category.js';
import Place from './Place.js';
import Post from './Post.js';
import PostImage from './PostImage.js';
import Comment from './Comment.js';
import Like from './Like.js';
import ViewHistory from './ViewHistory.js';
import Trip from './Trip.js';
import TripDay from './TripDay.js';
import TripPlace from './TripPlace.js';
import Notification from './Notification.js';
import Report from './Report.js';
import ChatMessage from './ChatMessage.js';
import Payment from './Payment.js';
import { Counter, getNextSequenceValue } from './counter.js';

export {
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
  ChatMessage,
  Payment,
  Counter,
  getNextSequenceValue
};

export default {
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
  ChatMessage,
  Payment,
  Counter,
  getNextSequenceValue
};
