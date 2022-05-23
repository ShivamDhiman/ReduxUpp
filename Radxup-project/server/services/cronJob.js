const schedule = require('node-schedule-tz');
const moment = require('moment');
const { Op } = require('sequelize');
const authService = require('./authService');
const appService = require('./appService');
const errorLib = require('../lib/errorLib');
const _ = require('underscore');
const formDependencyEngine = require('./formDependencyEngine');
const userManager = require('../data/managers/users');
const {Users} = require('../data/models/users');
const asyncLoop = require('node-async-loop');

// cron job runs every 30 second
schedule.scheduleJob('*/30 * * * * *', ()=> {
  console.log("Every 30 second cron job start......................", new Date());
  //formDependencyEngine.startFormDependencyEngine();
  sendFormsCronJob();
});

// cron job runs every 1 minute
schedule.scheduleJob('* * * * *', ()=> {
  console.log("Every minute cron job start......................", new Date());
  setFormExpireStatusCronJob();
  sendReminderCronJob();
});

// cron job runs every 10 minute
schedule.scheduleJob('*/10  * * * *', ()=> {
  console.log("Every mid night cron job start......................", new Date());
  formDependencyEngine.unblockStatus();
});

module.exports.sendForm = async(req, res)=>{
  try {
    if( appService.isStringEmptyOrSpaces(req.query.user_id) || appService.isStringEmptyOrSpaces(req.query.form_code)){
      return res.status(409).json({success: false, message: 'Request information is missing'});
    }
    req.query.user_id = parseInt(req.query.user_id);
    //Fetch userInfomation
    let userProfile = await userManager.getUserProfile({where:{id:req.query.user_id }});
    userProfile = JSON.parse(JSON.stringify(userProfile));

    let searchQuery = {
      where:{
        user_id: req.query.user_id,
        form_code: req.query.form_code
      }
    }
    //Skiping form if
    if(appService.isStringEmptyOrSpaces(userProfile.personal_email)){
      let updateQuery = {
        form_sent_error: 'Email Id not found'
      }
      userManager.updateUserFormMapping (searchQuery, updateQuery);
    } else {

      let formInfo = await userManager.getUserFormMapping(searchQuery);

      if(!formInfo){
        res.status(409).json({ success: false, message: 'Data not found' });
      }
      let survey_link;
      //Calculate link expire time
      let linkExpireTime = moment("2099-12-31").endOf("day");
      if(formInfo.form_expire){
        linkExpireTime = moment();
        linkExpireTime.add(parseInt(formInfo.form_expire_time), "day");
      }

      //Send form
      let tokenInfo = {
        id: userProfile.id,
        personal_email: userProfile.personal_email,
        form_code: formInfo.form_code,
        form_name: formInfo.form_name,
        form_group: formInfo.form_group,
        study_id: userProfile.study_id || 1,
        linkExp: linkExpireTime.unix()
      }

      userProfile['survey_link'] = await authService.encryptPayload(tokenInfo);

      userProfile['form_code'] = formInfo.form_code;
      userProfile['form_group'] = formInfo.form_group;
      userProfile['form_name'] = formInfo.form_name;
      userProfile['query'] = userProfile.survey_link;
        
      await appService.initiateEmailProcess(userProfile);

      let updateQuery = {
        'survey_link': userProfile.survey_link,
        'form_expire_at': linkExpireTime.toDate(),
        'status': 'Sent',
        'form_sent': true,
        'form_send_date': moment()
      }
      //Update user form mapping status
      userManager.updateUserFormMapping (searchQuery, updateQuery);
      res.status(200).json({ success: true, message: "Email Sent" });
    }
    
    
  } catch (error) {
    res.status(409).json({ success: false, message: error.message });
  }
}

const sendReminderCronJob = ()=>{
  return new Promise(async(resolve,reject)=>{
    try {

      let searchQuery = {
        where: {
          "reminder": true,
          "form_sent": true,
          [Op.or]:[
            {
            'reminder_scheduled_at': {[Op.eq]: null}
            },
            {
            'reminder_scheduled_at': {[Op.lte]: moment().toDate()}
            }
          ],
          "status": {[Op.notIn]:['Link Not Sent', 'Completed', 'Expired']}
        },
        include:[{
          model: Users,
          where: {"personal_email": {[Op.not]: null}}
        }],
        require: true
      }

      let reminderData = await userManager.getUserFormMappingList(searchQuery);
      if(reminderData && reminderData.length === 0) {
        return resolve();
      }

      asyncLoop(reminderData, async(formInfo, next)=>{
        if(appService.isStringEmptyOrSpaces(formInfo.User.personal_email) == false){
          
          let userProfile = formInfo.User;

          userProfile['survey_link'] = formInfo.survey_link;
          userProfile['form_code'] = formInfo.form_code;
          userProfile['form_group'] = formInfo.form_group;
          userProfile['form_name'] = formInfo.form_name;
          userProfile['query'] = formInfo.survey_link;

          let nextReminderAt = moment();
          
          if(formInfo.hours_reminder > 0){
            nextReminderAt.add(parseInt(formInfo.hours_reminder), "hours");
          }
          if(formInfo.days_reminder > 0){
            nextReminderAt.add(parseInt(formInfo.days_reminder), "days");
          }
          
          searchQuery = {
            where:{
              id: formInfo.id
            }
          }
          let updateQuery = {
            'reminder_scheduled_at': nextReminderAt.toDate()
          }

          await appService.initiateEmailProcess(userProfile, true);
          await userManager.updateUserFormMapping(searchQuery, updateQuery);
          next();
        }
      },(err,res)=> {
        if(err) {
          return reject(errorLib.generateErrorMsg('sendReminderCronJob', err));
        }

        resolve();
      });
    } catch(err){
      reject(errorLib.generateErrorMsg('sendReminderCronJob', err));
    }
  });
}

const sendFormsCronJob = ()=>{
  return new Promise(async(resolve,reject)=>{
    try {
        //Fetch form which is not send yet and participant facing = true
        let formlist = await userManager.getUserFormMappingList({
          where:{
            sendEmailNow: true,
            participant_facing: true,
            form_sent: false,
            form_sent_error: '',
            scheduled_at: {[Op.lte]:moment().toDate()}
          },
          limit: 50
        });

        if(formlist && formlist.length === 0) {
          return resolve();
        }

        asyncLoop(formlist, async(formInfo, next)=>{
          //Fetch userInfomation
          let userProfile = await userManager.getUserProfile({where:{id:formInfo.user_id }});
          userProfile = JSON.parse(JSON.stringify(userProfile));
          let searchQuery = {
            where:{
              id: formInfo.id
            }
          }
          //Skiping form if
          if(appService.isStringEmptyOrSpaces(userProfile.personal_email)){
            let updateQuery = {
              form_sent_error: 'Email Id not found'
            }
            userManager.updateUserFormMapping (searchQuery, updateQuery);
          } else {
            let survey_link;
            //Calculate link expire time
            let linkExpireTime = moment("2099-12-31").endOf("day");
            if(formInfo.form_expire){
              linkExpireTime = moment();
              linkExpireTime.add(parseInt(formInfo.form_expire_time), "day");
            }

            //Send form
            let tokenInfo = {
              id: userProfile.id,
              personal_email: userProfile.personal_email,
              form_code: formInfo.form_code,
              form_group: formInfo.form_group,
              form_name: formInfo.form_name,
              study_id: userProfile.study_id || 1,
              linkExp: linkExpireTime.unix()
            }

            userProfile['survey_link'] = await authService.encryptPayload(tokenInfo);

            userProfile['form_code'] = formInfo.form_code;
            userProfile['form_group'] = formInfo.form_group;
            userProfile['form_name'] = formInfo.form_name;
            userProfile['query'] = userProfile.survey_link;
            
            await appService.initiateEmailProcess(userProfile);

            let updateQuery = {
              'survey_link': userProfile.survey_link,
              'form_expire_at': linkExpireTime.toDate(),
              'status': 'Sent',
              'form_sent': true,
              'form_send_date': moment()
            }
            //Update user form mapping status
            userManager.updateUserFormMapping (searchQuery, updateQuery);
          }
          next();
        },(err,res)=>{
          if(err){
            reject(errorLib.generateErrorMsg('sendFormsCronJob', err));
          } else {
            resolve();
          }
        });


    } catch(err){
      reject(errorLib.generateErrorMsg('sendFormsCronJob', err));
    }
  });
}

const setFormExpireStatusCronJob = ()=>{
  return new Promise(async(resolve,reject)=>{
    try {
      let searchQuery = {
        where: {
          form_sent: true,
          status: {[Op.notIn]:['Scheduled', 'Link Not Sent', 'Completed', 'Expired']},
          form_expire: true,
          initiated_at: {[Op.eq]: null},
          form_expire_at: {[Op.lte]: new Date()}
        }
      }

      let expiredForms = await userManager.getUserFormMappingList(searchQuery);
      if(expiredForms && expiredForms.length > 0){
        let expiredFormIds = _.pluck(expiredForms, "id");
        searchQuery = {
          where: {
            id:{[Op.in]: expiredFormIds}
          }
        }

        let updateQuery = {
          status : "Expired"
        }

        await userManager.updateUserFormMapping(searchQuery, updateQuery);
      }
      resolve();
    } catch(err){
      reject(errorLib.generateErrorMsg('setFormExpireStatusCronJob', err));
    }
  });
}
