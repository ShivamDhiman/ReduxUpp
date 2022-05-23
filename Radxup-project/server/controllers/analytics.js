const feedbacksManager = require('../data/managers/feedback');
const enums = require('../lib/enums');
const SQL = require('sequelize');
const { sequelize } = require('../data/connections/connection');
const { Survey } = require('../data/models/survey');
const { Users } = require('../data/models/users');
const ROLES = enums.ROLES;
/**
 * This function is use for fetching all synced records
 */
module.exports.getSyncedRecords = async (req, res) => {
  try {
    if (!req.user.hasRole([ROLES.STUDY_ADMIN])) {
      return res.status(403).json({ success: false, message: `You don't have these rights.` });
    }
    let query = { where: {'study_id': req.user.study_id, sync_status: 'PUSHED' } };
    let response = await Survey.count(query);
    res.status(200).json({ success: true, data: { totalRecords: response } });
  } catch (error) {
    res.status(409).json({ success: false, message: error.message });
  }
};

/**
 * This function is use for fetching all enrolled participants
 */
module.exports.getEnrolledParticipants = async (req, res) => {
  try {
    if (!req.user.hasRole([ROLES.STUDY_ADMIN])) {
      return res.status(403).json({ success: false, message: `You don't have these rights.` });
    }
    let query = { where: { 'study_id': req.user.study_id, role_id: 3 } };
    let response = await Users.count(query);
    res.status(200).json({ success: true, data: { totalRecords: response } });
  } catch (error) {
    res.status(409).json({ success: false, message: error.message });
  }
};

/**
 * This function is use for fetching survey stats
 */
module.exports.getSurveyStats = async (req, res) => {
  try {
    if (!req.user.hasRole([ROLES.STUDY_ADMIN])) {
      return res.status(403).json({ success: false, message: `You don't have these rights.` });
    }
    let completedCount = await Survey.count({ where: {'study_id': req.user.study_id, status: 'COMPLETED' } });
    let totalCount = await Survey.count({ where: {'study_id': req.user.study_id } });
    let data = {
      completed: completedCount,
      totalRecords: totalCount,
    };
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(409).json({ success: false, message: error.message });
  }
};

/**
 * This function is use for fetching survey avg time
 */
module.exports.getSurveyAvgTime = async (req, res) => {
  try {
    if (!req.user.hasRole([ROLES.STUDY_ADMIN])) {
      return res.status(403).json({ success: false, message: `You don't have these rights.` });
    }

    let sqlQuery = `SELECT AVG(((DATE_PART('day', completed_at - initiated_at) * 24 + DATE_PART('hour', completed_at - initiated_at)) * 60 + DATE_PART('minute', completed_at- initiated_at) + DATE_PART('second', completed_at- initiated_at) / 60))::numeric(10,2)  as avgMinute from \"Survey\" s where study_id = ${req.user.study_id} and  status = 'COMPLETED' and initiated_at IS NOT null and completed_at IS NOT null;`;
    let avgTime = 0;
    const [results] = await sequelize.query(sqlQuery);
    if(Array.isArray(results) && results.length > 0 && results[0]['avgminute'] != null ){

      avgTime = parseFloat(results[0]['avgminute']);
    }
    res.status(200).json({ success: true, data: avgTime });
  } catch (error) {
    res.status(409).json({ success: false, message: error.message });
  }
};

/**
 * This function is use for fetching survey feedback of particular study
 */
module.exports.getFeedbackByStudyId = async (req, res) => {
  try {
    if (!req.user.hasRole([ROLES.STUDY_ADMIN])) {
      return res.status(403).json({ success: false, message: `You don't have these rights.` });
    }

    let query = {
      where: {
        study_id: req.user.study_id || 1,
      },
      attributes: ['average_rating', [SQL.fn('count', SQL.col('average_rating')), 'cnt']],
      order: [['average_rating', 'DESC']],
      group: ['average_rating'],
    };
    let stars = [5,4,3,2,1];
    let feedbackData = await feedbacksManager.getFeedbacks(query);
    feedbackData = stars.map(item => {
      let feed = feedbackData.find(feeds => feeds.dataValues.average_rating === item)
      return feed ? feed.dataValues : { average_rating: item, cnt: 0 }
    })
    let TotalResponses = feedbackData.reduce((feeds, item) => feeds + parseInt(item.cnt), 0);
    let responseObject = {
      TotalResponses,
      avgStars: Math.round(
        feedbackData.reduce((feeds, item) => {
          return feeds + item.average_rating * parseInt(item.cnt);
        }, 0) / TotalResponses
      ),
      allStars: feedbackData,
    };
    res.status(200).json({ success: true, data: responseObject });
  } catch (error) {
    console.log(error);
    res.status(409).json({ success: false, message: error.message });
  }
};
