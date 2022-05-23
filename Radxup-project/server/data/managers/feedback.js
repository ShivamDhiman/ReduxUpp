const { sequelize } = require('../connections/connection');
const { Feedbacks } = require('../models/feedbacks');
const errorLib = require('../../lib/errorLib');

module.exports.getFeedbacks = (query) => {
  return new Promise((resolve, reject) => {
    Feedbacks.findAll(query || {})
      .then((result) => {
        resolve(result);
      })
      .catch((err) => {
        console.log(err);
        reject(errorLib.generateErrorMsg('getFeedbacks', err));
      });
  });
};

module.exports.createFeedback = (payload) => {
  return new Promise((resolve, reject) => {
    Feedbacks.create(payload)
      .then((user) => {
        return resolve(user);
      })
      .catch((err) => {
        reject(errorLib.generateErrorMsg('createFeedback', err));
      });
  });
};
