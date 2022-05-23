const Sequelize = require('sequelize');
const Op = Sequelize.Op;
const _ = require('underscore');
const asyncLoop = require('node-async-loop');
const validator = require('../lib/validator');
const authService = require('../services/authService');
const appService = require('../services/appService');
const StudyCDEManager = require('../data/managers/StudyCDE');
const studyManager = require('../data/managers/study');
const {StudyCDESections} = require('../data/models/StudyCDESections');
const {StudyCDEQuestions} = require('../data/models/StudyCDEQuestions');
const {StudyCDEQuestionsAttributes} = require('../data/models/StudyCDEQuestionsAttributes');
const { Study } = require('../data/models/study');
const enums = require('../lib/enums');
const ROLES = enums.ROLES;



/**
* Adding Study Section in bulk
*/
function addStudySection(requestPayload, userId){
 return new Promise(async(resolve, reject)=>{
  try {

    //Creating Study Sections
    asyncLoop(requestPayload,async (sectionObj, next)=>{

      sectionObj["id"] = await StudyCDEManager.createStudyCDESections(
        {
        "study_id": sectionObj.study_id,
        "order": sectionObj.order,
        "name": sectionObj.name,
        "created_by": userId,
        "updated_by": userId
      });

      //Creating Questions
      await addStudySectionQuestions(sectionObj, userId);
      next();
    },(err)=>{
      if(err){
        console.log(err);
        return reject(err);
      }
      resolve();
    });
  } catch(err){
    console.log(err);
    reject(err);
  }
 });
}

/**
* Adding Study Question in bulk
*/
function addStudySectionQuestions(sectionObj, userId){
  return new Promise(async(resolve, reject)=>{
   try {

        if(Array.isArray(sectionObj.CDEQuestions) && sectionObj.CDEQuestions.length > 0){
          //Creating Sections Questions
          let bulkData = [];
          sectionObj.CDEQuestions.forEach(questionObj =>{
            bulkData.push({
              "study_id": sectionObj.study_id,
              "sections_id" : sectionObj.id,
              "order": questionObj.order,
              "shared_question": questionObj.shared_question,
              "category": questionObj.category,
              "language": questionObj.language,
              "question_group": questionObj.question_group,
              "question": questionObj.question,
              "hint": questionObj.hint,
              "variable_name": questionObj.variable_name,
              "response_type": questionObj.response_type,
              "descriptive": questionObj.descriptive,
              "not_to_ans_value": questionObj.not_to_ans_value,
              "child_node": questionObj.child_node,
              "linked_variable_name": questionObj.linked_variable_name,
              "linked_level": questionObj.linked_level,
              "question_attributes_list": questionObj.question_attributes_list,
              "question_attributes_label": questionObj.question_attributes_label,
              "created_by": userId,
              "updated_by": userId
            })
          });

          bulkData = await StudyCDEManager.createBulkStudyCDEQuestions(bulkData);

          //Updating Section Question Id in request payload
          sectionObj.CDEQuestions.forEach((questionInfo =>{
            let questionData = _.findWhere(bulkData, {category: questionInfo.category, language: questionInfo.language, question_group: questionInfo.question_group ,variable_name : questionInfo.variable_name});
            questionInfo["study_id"] = questionData.study_id;
            questionInfo["sections_id"] = questionData.sections_id;
            questionInfo["id"] = questionData.id;
          }))


          //Creating Question Attributes
          asyncLoop(sectionObj.CDEQuestions,async(questionInfo, next)=> {
            //Adding Questions Attributes
            questionInfo.CDEQuestionsAttributes = await addStudySectionQuestionAttributes(questionInfo, userId);
            next();
          },
          function(err, result){
              if(err){
                console.log(err);
                reject(errorLib.generateErrorMsg('addStudySectionQuestions', err));
              }
          });

        }
      resolve();
   } catch(err){
     console.log(err);
     reject(err);
   }
  });
}

/**
* Adding Study Question Attributes in bulk
*/
function addStudySectionQuestionAttributes(questionInfo, userId){
  return new Promise(async(resolve, reject)=>{
   try {
        if(Array.isArray(questionInfo.CDEQuestionsAttributes) && questionInfo.CDEQuestionsAttributes.length > 0){
          //Creating Sections Questions
          let bulkData = [];
          questionInfo.CDEQuestionsAttributes.forEach(attributeObj =>{
            bulkData.push({
              "study_id": questionInfo.study_id,
              "sections_id" : questionInfo.sections_id,
              "questions_id": questionInfo.id,
              "order": attributeObj.order,
              "response_type": attributeObj.response_type,
              "order": attributeObj.order,
              "not_to_ans": attributeObj.not_to_ans,
              "max_current_datetime": attributeObj.max_current_datetime,
              "choice_key": attributeObj.choice_key,
              "choice_label": attributeObj.choice_label,
              "choice_value": attributeObj.choice_value,
              "text_min_char": attributeObj.text_min_char,
              "text_max_char": attributeObj.text_max_char,
              "num_min_value": attributeObj.num_min_value,
              "num_max_value": attributeObj.num_max_value,
              "num_flot_max": attributeObj.num_flot_max,
              "min_datetime": attributeObj.min_datetime,
              "max_datetime": attributeObj.max_datetime,
              "min_date": attributeObj.min_date,
              "max_date": attributeObj.max_date,
              "min_time": attributeObj.min_time,
              "max_time": attributeObj.max_time,
              "created_by": userId,
              "updated_by": userId

            })
          });

           await StudyCDEManager.createBulkStudyCDEQuestionsAttributes(bulkData)

        }
        resolve();
   } catch(err){
     console.log(err);
     reject(err);
   }
  });
}



/**
* This function is fetch Study CDE Data
*/
module.exports.getStudyCDEs = async (req, res) => {
    try {
      if (!req.user.hasRole([ROLES.STUDY_ADMIN, ROLES.SUPER_ADMIN])) {
        return res.status(403).json({ success: false, message: `You don't have these rights.` });
      }

      if(appService.isStringEmptyOrSpaces(req.query.studyId) || isNaN(parseFloat(req.query.studyId))){
        return res.status(406).json({ success: false, message: 'Request payload missing' });
      }

      //Creating search query
      let searchQuery = {
        where: {
            'study_id': parseFloat(req.query.studyId)
        },
        attributes:['id','study_id', 'order', 'name'],
        include: [
            {
                model: StudyCDEQuestions,
                attributes: ['id', 'study_id', 'sections_id',"order", 'shared_question', 'category', 'language', 'question_group', 'question', 'hint', 'variable_name', 'response_type', 'descriptive', 'not_to_ans_value', 'child_node', 'linked_variable_name', 'linked_level', 'question_attributes_list', 'question_attributes_label'],
                include:[
                    {
                    model: StudyCDEQuestionsAttributes,
                    attributes: ['id', 'study_id', 'sections_id', 'questions_id', 'response_type', 'order', 'not_to_ans', 'max_current_datetime', 'choice_key', 'choice_label', 'choice_value', 'text_min_char', 'text_max_char', 'num_min_value', 'num_max_value', 'num_flot_max', 'min_datetime', 'max_datetime', 'min_date', 'max_date', 'min_time', 'max_time']
                    }
                ],
            }
        ],
        order:
        [
            ["order", "ASC"],
            ["StudyCDEQuestions","order", "ASC"],
            ["StudyCDEQuestions","variable_name", "ASC"],
            ["StudyCDEQuestions","category", "ASC"],
            ["StudyCDEQuestions","language", "ASC"],
            ["StudyCDEQuestions","StudyCDEQuestionsAttributes","order", "ASC"],
            ["StudyCDEQuestions","linked_variable_name", "ASC"],
        ],
        required: true
    }

    if(req.query.questionGroup || req.query.category){
      searchQuery.include[0]['where'] = {};
      if(!appService.isStringEmptyOrSpaces(req.query.questionGroup)){
        searchQuery.include[0]['where']['question_group'] = req.query.questionGroup.trim();
      }

      if(!appService.isStringEmptyOrSpaces(req.query.category)){
        searchQuery.include[0]['where']['category'] = req.query.category.trim();
      }
    }

     //Fetching data
     let data = await StudyCDEManager.getStudyCDESectionsList(searchQuery);


     //Preparing study summary
     let summary = {
       "CDEsToCollect": 0,
       "CDEsToShare": 0
     }

     if(data.length >0){
      summary.CDEsToCollect =  _.uniq(_.pluck(_.where([].concat(..._.pluck(data,"StudyCDEQuestions")),{"language":"English"}),"variable_name")).length;
      summary.CDEsToShare = _.uniq(_.pluck(_.where([].concat(..._.pluck(data,"StudyCDEQuestions")),{"language":"English", "shared_question": true}),"variable_name")).length;
     }


     res.status(200).json({success : true, message: 'Data found', data: data, "summary": summary});

    } catch (error) {
        console.log(error);
        res.status(409).json({ success: false, message: error });
    }
};

/**
* This function is create Study CDE Data
*/
module.exports.createStudyCDEs = async (req, res) => {
    try {
      if (!req.user.hasRole([ROLES.STUDY_ADMIN, ROLES.SUPER_ADMIN])) {
        return res.status(403).json({ success: false, message: `You don't have these rights.` });
      }

      if (!req.body.payload) {
        return res.status(406).json({ success: false, message: 'Request payload missing' });
      }

      let requestPayload = req.body.payload;
      if(!Array.isArray(requestPayload) || requestPayload.length == 0 || !requestPayload[0].study_id || isNaN(parseFloat(requestPayload[0].study_id))){
        return res.status(406).json({ success: false, message: 'Request payload missing' });
      }
      // let validationResult = validator.validateRegisterPayload(params);
      // if (validationResult.error) {
      //   return res.status(400).json({ success: false, message: `Please enter valid ${PARAMSTYPE[validationResult.error.details[0].context.key]}`});
      // }

      //Searching Study Data already exists or not.
      let searchQuery = {
        where: {
          study_id: requestPayload[0].study_id
        }
      }

      let studySectionData = await StudyCDEManager.getStudyCDESectionsList(searchQuery);

      if(studySectionData && Array.isArray(studySectionData) && studySectionData.length > 0){

        //Delete Existing Attributes
        await StudyCDEManager.deleteStudyCDEQuestionsAttributes(searchQuery);
        //Delete Existing Questions
        await StudyCDEManager.deleteStudyCDEQuestions(searchQuery);
        //Delete Existing Sections
        await StudyCDEManager.deleteStudyCDESections(searchQuery);
        //return res.status(400).json({ success: false, message: 'CDE study mapping already exists' });
      }

      //Creating Study Sections
      await addStudySection(requestPayload, req.user.id);

      searchQuery = {
        where: {
          id: requestPayload[0].study_id
        }
      }
      let studyDetails = await studyManager.getStudyDetails(searchQuery);
      let auditPayload = {
        message: `${studyDetails.name} study CDE's to collect & share added`,
        personal_email: req.user.personal_email,
        user_id: req.user.id,
        study_id: requestPayload[0].study_id
      }
      await appService.addLog(auditPayload);

      res.status(200).json({ success: true, message: 'Successfully done.'});
    } catch (error) {
      console.log(error);
      res.status(409).json({ success: false, message: error });
    }
  };
