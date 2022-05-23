const Sequelize = require('sequelize');
const { Op } = require("sequelize");
const _ = require('underscore');
const asyncLoop = require('node-async-loop');
const appService = require('../services/appService');
const authService = require('../services/authService');
const CDEsManager = require('../data/managers/CDE');
const StudyCDEManager = require('../data/managers/StudyCDE');
const FormManager = require('../data/managers/forms');

const { CDEeICFAttributes } = require('../data/models/CDEeICFAttributes');

const { CDEQuestions } = require('../data/models/CDEQuestions');
const { CDEQuestionsAttributes } = require('../data/models/CDEQuestionsAttributes');
const {StudyCDEQuestions} = require('../data/models/StudyCDEQuestions');
const {StudyCDEQuestionsAttributes} = require('../data/models/StudyCDEQuestionsAttributes');
const enums = require('../lib/enums');;
const ROLES = enums.ROLES;


function fetcheICFCDELib (params){
    return new Promise(async(resolve, reject)=>{
        let searchQuery = {
            where: {
                cde_status: 'Active'
            },
            attributes:['id', 'order', 'category', 'language', 'question_group', 'question', 'hint', 'variable_name', 'response_type', 'descriptive', 'not_to_ans_value', 'child_node', 'linked_variable_name', 'linked_level', 'question_attributes_list', 'question_attributes_label', 'cde_version', 'cde_status'],
            include:[
                {
                model: CDEeICFAttributes,
                attributes: ['id', 'questions_id', 'response_type', 'order', 'not_to_ans', 'max_current_datetime', 'choice_key', 'choice_label', 'choice_value', 'text_min_char', 'text_max_char', 'num_min_value', 'num_max_value', 'num_flot_max', 'min_datetime', 'max_datetime', 'min_date', 'max_date', 'min_time', 'max_time']
                }
            ],
            order:
            [
                ["order", "ASC"],
                ["variable_name", "ASC"],
                ["category", "ASC"],
                ["language", "ASC"],
                ["CDEeICFAttributes","order", "ASC"],
                ["linked_variable_name", "ASC"],
            ],
            required: true
        };

        if(params.category && !appService.isStringEmptyOrSpaces(params.category)){
            searchQuery.where['category'] = params.category;
        }

        resolve(await CDEsManager.geteICFCDEQuestionsList(searchQuery));

    });
}

function fetchCDELib (category, onlyQuestions = false){
    return new Promise(async(resolve, reject)=>{

        if(onlyQuestions == false){
            //Creating search query
            let searchQuery = {
                attributes:['id', 'order', 'name', 'linked_variable_name', 'question_attributes_list', 'question_attributes_label', 'cde_version', 'cde_status'],
                include: [
                    {
                        model: CDEQuestions,
                        attributes: ['id', 'sections_id',"order", 'category', 'language', 'question_group', 'question', 'hint', 'variable_name', 'response_type', 'descriptive', 'not_to_ans_value', 'child_node', 'linked_variable_name', 'linked_level', 'question_attributes_list', 'question_attributes_label', 'cde_version', 'cde_status'],
                        include:[
                            {
                            model: CDEQuestionsAttributes,
                            attributes: ['id', 'sections_id', 'questions_id', 'response_type', 'order', 'not_to_ans', 'max_current_datetime', 'choice_key', 'choice_label', 'choice_value', 'text_min_char', 'text_max_char', 'num_min_value', 'num_max_value', 'num_flot_max', 'min_datetime', 'max_datetime', 'min_date', 'max_date', 'min_time', 'max_time']
                            }
                        ],
                    }
                ],
                order:
                [
                    ["order", "ASC"],
                    ["CDEQuestions","sections_id", "ASC"],
                    ["CDEQuestions","order", "ASC"],
                    ["CDEQuestions","variable_name", "ASC"],
                    ["CDEQuestions","category", "ASC"],
                    ["CDEQuestions","language", "ASC"],
                    ["CDEQuestions","CDEQuestionsAttributes","order", "ASC"],
                    ["CDEQuestions","linked_variable_name", "ASC"],
                ],
                required: true
            }

            if(!appService.isStringEmptyOrSpaces(category)){
                searchQuery.include[0]["where"]= {'category': category.trim()}
            }
            //Fetching data
            resolve(await CDEsManager.getCDESectionsList(searchQuery));
        } 
        else {
            //Creating search query
            let searchQuery = {
                attributes: ['id', 'sections_id',"order", 'category', 'language', 'question_group', 'question', 'hint', 'variable_name', 'response_type', 'descriptive', 'not_to_ans_value', 'child_node', 'linked_variable_name', 'linked_level', 'question_attributes_list', 'question_attributes_label', 'cde_version', 'cde_status'],
                include:[
                    {
                    model: CDEQuestionsAttributes,
                    attributes: ['id', 'sections_id', 'questions_id', 'response_type', 'order', 'not_to_ans', 'max_current_datetime', 'choice_key', 'choice_label', 'choice_value', 'text_min_char', 'text_max_char', 'num_min_value', 'num_max_value', 'num_flot_max', 'min_datetime', 'max_datetime', 'min_date', 'max_date', 'min_time', 'max_time']
                    }
                ],
                order:
                [
                    ["sections_id", "ASC"],
                    ["order", "ASC"],
                    ["variable_name", "ASC"],
                    ["category", "ASC"],
                    ["language", "ASC"],
                    ["CDEQuestionsAttributes","order", "ASC"],
                ],
                required: true
            }

            if( !appService.isStringEmptyOrSpaces(category)){
                searchQuery["where"]= {'category': category.trim()}
            }
            //Fetching data
            resolve(await CDEsManager.getCDEQuestionsList(searchQuery));
        }
    });
}




function fetchStudyQuestion(studyId, category, template = false){
    return new Promise(async(resolve, reject)=>{
        try{
            if(template == false){
                 //Creating search query
                let searchQuery = {
                    where: {
                        "study_id": studyId,
                        "category": category,
                        "language": "English"
                    },
                    attributes: ['id', 'study_id', 'sections_id',"order", 'shared_question', 'category', 'language', 'question_group', 'question', 'hint', 'variable_name', 'response_type', 'descriptive', 'not_to_ans_value', 'child_node', 'linked_variable_name', 'linked_level', 'question_attributes_list', 'question_attributes_label', 'cde_version', 'cde_status'],
                    include:[
                        {
                        model: StudyCDEQuestionsAttributes,
                        attributes: ['id', 'study_id', 'sections_id', 'questions_id', 'response_type', 'order', 'not_to_ans', ['max_current_datetime' , 'max_currentdt'], 'choice_key', 'choice_label', 'choice_value', 'text_min_char', 'text_max_char', 'num_min_value', 'num_max_value', 'num_flot_max', 'min_datetime', 'max_datetime', 'min_date', 'max_date', 'min_time', 'max_time']
                        }
                    ],
                    order: 
                    [
                        ["sections_id", "ASC"],
                        ["order", "ASC"],
                        ["variable_name", "ASC"],
                        ["category", "ASC"],
                        ["language", "ASC"],
                        ["StudyCDEQuestionsAttributes","order", "ASC"],
                        ["linked_variable_name", "ASC"],
                    ],
                    required: true
                }
                resolve(await StudyCDEManager.getStudyCDEQuestionsList(searchQuery));
            } else {
                //Creating search query
                let searchQuery = {
                    where: {
                        'study_id': parseFloat(studyId)
                    },
                    attributes:['id','study_id', 'order', 'name', 'linked_variable_name', 'question_attributes_list', 'question_attributes_label', 'cde_version', 'cde_status'],
                    include: [
                        {
                            where:{
                                "study_id": studyId,
                                "category": category
                            },
                            model: StudyCDEQuestions,
                            attributes: ['id', 'study_id', 'sections_id',"order", 'shared_question', 'category', 'language', 'question_group', 'question', 'hint', 'variable_name', 'response_type', 'descriptive', 'not_to_ans_value', 'child_node', 'linked_variable_name', 'linked_level', 'question_attributes_list', 'question_attributes_label', 'cde_version', 'cde_status'],
                            include:[
                                {
                                model: StudyCDEQuestionsAttributes,
                                attributes: ['id', 'study_id', 'sections_id', 'questions_id', 'response_type', 'order', 'not_to_ans', ['max_current_datetime' , 'max_currentdt'], 'choice_key', 'choice_label', 'choice_value', 'text_min_char', 'text_max_char', 'num_min_value', 'num_max_value', 'num_flot_max', 'min_datetime', 'max_datetime', 'min_date', 'max_date', 'min_time', 'max_time']
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
                resolve(await StudyCDEManager.getStudyCDESectionsList(searchQuery));
            }
        } catch(err){
            reject(err);
        }
    });
}


/**
* Get CDEs List
*/
module.exports.getCDEList= async (req, res) => {
    try {

        if (!req.user.hasRole([ROLES.STUDY_ADMIN, ROLES.SUPER_ADMIN])) {
            return res.status(403).json({ success: false, message: `You don't have these rights.` });
        }

        let params = {};
        if(req.query.query) {
            //Getting query input from request
            params = await authService.decryptPayload(req.query.query);
        }

        let data = await fetchCDELib();
        res.status(200).json({success : true, message: 'Data found', data: data});
    } catch (err) {
        console.log(err);
        return res.status(400).json({success: false, message: err.message});
    }
}


/**
* Get CDEs category wise summary
*/
module.exports.getCDESummary= async (req, res) => {
    try{


        if (!req.user.hasRole([ROLES.STUDY_ADMIN, ROLES.SUPER_ADMIN])) {
            return res.status(403).json({ success: false, message: `You don't have these rights.` });
        }

        if(!req.query.studyId || appService.isStringEmptyOrSpaces(req.query.studyId) || isNaN(parseFloat(req.query.studyId))){
            return res.status(406).json({ success: false, message: 'Request payload missing'});
        }

        let summaryInfo ={
            "Adult": {
                cdeCount: 0,
                studyCDECount: 0,
                usedCDECount: 0
            },
            "Pediatric": {
                cdeCount: 0,
                studyCDECount: 0,
                usedCDECount: 0
            }
        }

        //Count of Total CDE
        let searchQuery = {
            where: {
                "language": "English"
            },
            attributes: ['category',[Sequelize.fn('COUNT', Sequelize.col('category')), 'count']],
            group:['category']
        }

        let cdeCount = await CDEsManager.getCDEQuestionsList(searchQuery);
        if(cdeCount && cdeCount.length >0){
            let adultCount =  _.findWhere(cdeCount, {"category": "Adult"});
            let pediatricCount =  _.findWhere(cdeCount, {"category": "Pediatric"});
            if(adultCount){
                summaryInfo.Adult.cdeCount = adultCount.count;
            }
            if(pediatricCount){
                summaryInfo.Pediatric.cdeCount = pediatricCount.count;
            }
        }
       
        //Count of Total Study Question 
        searchQuery = {
            where: {
                "study_id": parseFloat(req.query.studyId),
                "language": "English",
            },
            attributes: ['category','variable_name'],
        }

        let studyCDE = await StudyCDEManager.getStudyCDEQuestionsList(searchQuery);
        let adultVariables = _.pluck(_.where(studyCDE,{'category': 'Adult'}),'variable_name'); 
        let pediatricVariables = _.pluck(_.where(studyCDE,{'category': 'Pediatric'}),'variable_name');

        summaryInfo.Adult.studyCDECount = adultVariables.length;
        summaryInfo.Pediatric.studyCDECount = pediatricVariables.length;

        //Count of used in form
        searchQuery = {
            where:{
                "study_id": parseFloat(req.query.studyId),
                "language": "English",
                "status": "Published"
            },
            attributes: ['id'],
        } 

        let formList = await FormManager.getFormsList(searchQuery);

        formList = _.pluck(formList,"id");

        //Pediatric variables
        searchQuery = {
            where:{
                "study_id": parseFloat(req.query.studyId),
                "category": "Pediatric",
                "question_type" :'CDE Question',
                "variable_name": {[Op.in]: pediatricVariables},
                "form_id": {[Op.in]: formList}
            },
            attributes: ['study_id', 'variable_name',[Sequelize.fn('COUNT', Sequelize.col('variable_name')), 'count']],
            group:['study_id', 'variable_name']
        } 
        
        let variableCount = await FormManager.getFormsQuestionsList(searchQuery);
        summaryInfo.Pediatric.usedCDECount = (variableCount && variableCount.length >0?variableCount.length: 0 );

        //Adult
        
        searchQuery = {
            where:{
                "study_id": parseFloat(req.query.studyId),
                "category": "Adult",
                "question_type" :'CDE Question',
                "variable_name": {[Op.in]: adultVariables},
                "form_id": {[Op.in]: formList}
            },
            attributes: ['study_id', 'variable_name',[Sequelize.fn('COUNT', Sequelize.col('variable_name')), 'count']],
            group:['study_id', 'variable_name']
        } 

        variableCount = await FormManager.getFormsQuestionsList(searchQuery);
        summaryInfo.Adult.usedCDECount = (variableCount && variableCount.length >0?variableCount.length: 0 );

        res.status(200).json({success : true, message: 'Data found', data: summaryInfo});
    } catch(err){
        console.log(err);
        return res.status(400).json({success: false, message: err.message});
    }
}


/**
* Get CDEs list category wise
*/
module.exports.getCategoryCDEList= async (req, res) => {
    try {

        if (!req.user.hasRole([ROLES.STUDY_ADMIN, ROLES.SUPER_ADMIN])) {
            return res.status(403).json({ success: false, message: `You don't have these rights.` });
        }
        
        if(!req.query.query){
            return res.status(406).json({ success: false, message: 'Request payload missing'});
        }
        let params = await authService.decryptPayload(req.query.query);

        if(!params.studyId || isNaN(parseFloat(params.studyId)) || !params.category || appService.isStringEmptyOrSpaces(params.category)){
            return res.status(406).json({ success: false, message: 'Request payload missing'});
        }

        if(params.template && params.template == "true" || params.template == true){
            params["template"] = true;
        } else {
            params["template"] = false;
        }
        //Fetching CDE library question only.
        let CDEQuestions = await fetchCDELib(params.category.trim(), true);
        let studyCDEs = await fetchStudyQuestion(parseFloat(params.studyId), params.category.trim(), false);

        let searchQuery = {
            where: {
                "study_id": parseFloat(params.studyId),
                "language": "English",
                "category": params.category.trim(),
                "status": "Published"
            },
            attributes: ['id'],
        } 

        let formList = await FormManager.getFormsList(searchQuery);
        
        let usedVariables = [];
        if(formList && formList.length >0){
            formList = _.pluck(formList,"id");
            searchQuery = {
                where: {
                    "study_id": parseFloat(params.studyId),
                    "language": "English",
                    "category": params.category.trim(),
                    "form_id": {[Op.in]: formList}
                },
                attributes: ['category','variable_name'],
            } 
            
    
            usedVariables = await FormManager.getFormsQuestionsList(searchQuery);
            
            if(usedVariables.length == 0){
                usedVariables = [];
            }
        }

        
        //Mapping Study Mapping Information
        studyCDEs.forEach(questionObj=>{
            CDEQuestions.forEach( qObj =>{
                qObj["variable_used"]= false;
                if(qObj.study_mapped && qObj.study_mapped == true){
                    return;
                }
                if(qObj.variable_name == questionObj.variable_name){
                    qObj["study_mapped"]= true;
                } else {
                    qObj["study_mapped"]= false;
                }
            });
        })

        usedVariables.forEach(formVariable =>{
            CDEQuestions.forEach( qObj =>{
                if(qObj.variable_used && qObj.variable_used == true){
                    return;
                }
                if(qObj.variable_name == formVariable.variable_name){
                    qObj["variable_used"]= true;
                } else {
                    qObj["variable_used"]= false;
                }
            });
        })
        
       
        //Fetching Template
        if(params.template){
            studyCDEs = await fetchStudyQuestion(parseFloat(params.studyId), params.category.trim(), true);
            studyCDEs.forEach(sectionObj =>{
                sectionObj.StudyCDEQuestions.forEach( questionObj =>{
                    questionObj["study_mapped"]= true;
                    questionObj["variable_used"]= false;
                });
            });

            usedVariables.forEach(formVariable =>{
                studyCDEs.forEach(sectionObj =>{
                    sectionObj.StudyCDEQuestions.forEach( questionObj =>{
                        if(questionObj.variable_used && questionObj.variable_used == true){
                            return;
                        }
                        if(questionObj.variable_name == formVariable.variable_name){
                            questionObj["variable_used"]= true;
                        } else {
                            questionObj["variable_used"]= false;
                        }
                    });
                });
            });

            studyCDEs = JSON.stringify(studyCDEs);
            studyCDEs = studyCDEs.replace(/\"StudyCDEQuestions\":/ig, '\"FSQuestions\":').replace(/\"StudyCDEQuestionsAttributes\":/ig, '\"FSQAttributes\":').replace(/\"max_currentdt\":/ig, '\"max_current_datetime\":');
            studyCDEs = JSON.parse(studyCDEs);

            //Final List of unused variables
            // let studyCDEsList = [];
            // studyCDEs.forEach(sectionObj =>{
            //     let questionList = _.where(sectionObj.FSQuestions,{"variable_used": false});
            //     if(questionList.length > 0){
            //         sectionObj.FSQuestions = JSON.parse(JSON.stringify(questionList));
            //         studyCDEsList.push(sectionObj);
            //     }
            // });
            // studyCDEs = JSON.parse(JSON.stringify(studyCDEsList));  
        }

        CDEQuestions = JSON.stringify(CDEQuestions);
        CDEQuestions = CDEQuestions.replace(/\"CDEQuestions\":/ig, '\"FSQuestions\":').replace(/\"CDEQuestionsAttributes\":/ig, '\"FSQAttributes\":')
        CDEQuestions = JSON.parse(CDEQuestions);
        
        res.status(200).json({success : true, message: 'Data found', data: {
            "cde": CDEQuestions,
            "template": (params.template? studyCDEs: null)
        }});
    } catch (err) {
        console.log(err);
        return res.status(400).json({success: false, message: err.message});
    }
}


/**
* Get eICF CDEs List
*/
module.exports.geteICFCDEList= async (req, res) => {
    try {

        if (!req.user.hasRole([ROLES.STUDY_ADMIN, ROLES.SUPER_ADMIN])) {
            return res.status(403).json({ success: false, message: `You don't have these rights.` });
        }

        let params = {};
        if(req.query.query) {
            //Getting query input from request
            params = await authService.decryptPayload(req.query.query);
        }

        let data = await fetcheICFCDELib(params);
        data = JSON.stringify(data);
        data = data.replace(/\"CDEeICFAttributes\":/ig, '\"FSQAttributes\":')
        data = JSON.parse(data);
        res.status(200).json({success : true, message: 'Data found', data: data});
    } catch (err) {
        console.log(err);
        return res.status(400).json({success: false, message: err.message});
    }
}

