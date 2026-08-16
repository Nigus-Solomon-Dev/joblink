// Model index file - exports all models for easy importing

const User = require('./User');
const Company = require('./Company');
const Job = require('./Job');
const Application = require('./Application');
const Category = require('./Category');
const Skill = require('./Skill');
const Notification = require('./Notification');
const Conversation = require('./Conversation');
const Message = require('./Message');
const SavedJob = require('./SavedJob');
const TokenBlacklist = require('./TokenBlacklist');
const SiteSetting = require('./SiteSetting');

module.exports = {
  User,
  Company,
  Job,
  Application,
  Category,
  Skill,
  Notification,
  Conversation,
  Message,
  SavedJob,
  TokenBlacklist,
  SiteSetting,
};