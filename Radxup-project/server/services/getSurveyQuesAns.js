const surveyManager = require('../data/managers/survey');
const { FSQuestions } = require('../data/models/formsSectionsQuestions');
const { FSQAttributes } = require('../data/models/formsSectionsQuestionsAttributes');
const { SurveyDetails } = require('../data/models/surveyDetails');
const { Users } = require('../data/models/users');
const moment = require('moment');
const { Study } = require('../data/models/study');
const formManager = require('../data/managers/forms');
const eicfManager = require('../data/managers/eICFForm');
const { eICFFQuestions } = require('../data/models/eICFFQuestions');
const { eICFFQAttributes } = require('../data/models/eICFFQAttributes');
const _ = require('lodash');

let questionTypes = {
    "Multiple Choice": "choice",
    "Dropdown": "choice",
    "Radio Button": "choice",
    "Number": "integer",
    "DateTime": "date",
    "Text Box": "text",
    "Descriptive": "text",
}

let responseTypes = {
    "Number": "valueInteger",
    "DateTime": "valueDate",
    "Date": "valueDate",
    "Radio Button": "valueInteger",
    "Text Box": "valueString",
    "Descriptive": "valueString",
}

module.exports.getSurveyQuesAns = ({ survey_ids }) => {
    return new Promise(async (resolve, reject) => {
        try {
            let searchQuery = {
                where: {
                    id: survey_ids,
                },
                attributes: [
                    "id", "study_id", "form_id", "form_code", "user_id", "form_group", "taken_by", "status", "initiated_at", "completed_at"
                ],
                include: [
                    {
                        model: Study,
                        attributes: ["id", "study_id"]
                    },
                    {
                        model: Users,
                        attributes: [
                            "id", "UID", "study_id", "first_name", "last_name", "personal_email", "mobile_phone", "participant_id", "role_id", "status", "initiated_by"],
                    },
                    {
                        model: SurveyDetails,
                        //where: { shared_question: true},
                        required: false,
                        attributes: [
                            "id", "question", "variable_name", "answer", "value"
                        ]
                    }
                ],
            }
            let data = await surveyManager.getSurveyList(searchQuery);

            if (!data){
                reject('No record found or Form got Archived');
            }

            let formCodes = _.uniqBy(data, "form_code");
            let promises = formCodes.map(form => {
                searchQuery = {
                    where: {
                        form_code: form.form_code,
                    },
                    attributes: [
                        "id", "study_id", "form_code", "category", "name", "status", "description",
                    ],
                    include: [
                        {
                            model: form.form_group === 'Form' ? FSQuestions : eICFFQuestions,
                            where: { language: 'English'},
                            required: false,    // required: false for include this field even if no data found
                            attributes: [
                                "id", "category", "language", "question_group", "question_type", "cde_variable_name", "shared_question", "question", "variable_name", "response_type", "descriptive", "not_to_ans_value"
                            ],
                            include: [
                                {
                                    model: form.form_group === 'Form' ? FSQAttributes : eICFFQAttributes,
                                    attributes: [
                                        "id", "questions_id", "response_type", "not_to_ans", "choice_key", "choice_label", "choice_value"
                                    ],
                                },
                            ]
                        },
                    ],
                }

                if(form.form_group === 'Form'){
                    return formManager.getForms(searchQuery);
                } else {
                    return eicfManager.getEICFForm(searchQuery);
                }
            })

            let formData = await Promise.all(promises);
            if(!formData){
                reject('No record found or Form got Archived');
            }

            formData = formData.map(form => form.toJSON ? form.toJSON() : form);
            data.forEach(srvy => srvy.Form = formData.find(form => srvy.form_code === form.form_code));
            data.forEach(srvy => {
                if(srvy.Form.FSQuestions){
                    srvy.Form.FSQuestions = srvy.Form.FSQuestions.map(que => ({ answers: (srvy.SurveyDetails.find(ans => ans.variable_name === que.variable_name) || {}), ...que }));
                }else{
                    srvy.Form.eICFFQuestions = srvy.Form.eICFFQuestions.map(que => ({ answers: (srvy.SurveyDetails.find(ans => ans.variable_name === que.variable_name) || {}), ...que }));
                }
                delete srvy.SurveyDetails;
            })
            let study_id = data[0].Study.study_id;

            let obj = {
                "resourceType": "Bundle",
                "id": `${study_id}${Date.now()}`,
                "identifier": [
                    {
                        "use": "official",
                        "system": "urn:colectiv:transactionId",
                        "value": `${study_id}${Date.now()}`
                    }
                ],
                "timestamp": new Date().toISOString(),
                "type": "transaction",
                entry: processEntry(data)
            }
            resolve(obj);
        } catch (error) {
            reject(error)
        }
    })
}

function processEntry(data){
    let result = [];
    data.forEach(srvy => {
        result.push(
            {
                "resource": {
                    "resourceType": "Person",
                    "id": srvy.User.UID,
                    "identifier": [
                    {
                        "use": "official",
                        "system": "urn:collectiv:participantId",
                        "value": srvy.User.UID
                    }
                    ],
                    "name": [
                    {
                        "use": "official",
                        "family": srvy.User.last_name,
                        "given": [
                            srvy.User.first_name
                        ]
                    }
                    ],
                    "telecom": [
                        {
                            "use": "home"
                        },
                        {
                            "system": "email",
                            "value": srvy.User.personal_email,
                            "use": "home"
                        }
                    ]
                },
                "request": {
                    "method": "POST",
                    "url": "https://radxup-dev.azurewebsites.net"
                }
            },
            {
                "resource": {
                    "resourceType": "Questionnaire",
                    "id": srvy.form_code,
                    "identifier": [
                        {
                            "use": "official",
                            "system": `urn:collectiv:${'formEventName'}`,
                            "value": srvy.form_code
                        },
                        {
                        "use": "official",
                        "system": "urn:colectiv:study_id",
                        "value": "STD001"
                        }
                    ],
                    "code": [
                        {
                            "system": "urn:radxup:cdeset",
                            "code": "core_cde_v2"
                        }
                    ],
                    "title": "RADxUP Core CDE",
                    "version": "2.0.0",
                    "status": "active",
                    "date": moment().format('YYYY-MM-DD'),
                    item: srvy.Form[srvy.form_group === 'Form' ? 'FSQuestions' : 'eICFFQuestions'].map(que => ({
                        linkId: que.variable_name,
                        text: que.question,
                        code: [
                            {
                                system: "urn:radxup_cde:core",
                                code: que.variable_name
                            }
                        ],
                        type: questionTypes[que.response_type],
                        answerOption: ['Radio Button', 'Multiple Choice', 'Dropdown'].includes(que.response_type) ? que[srvy.form_group === 'Form' ? 'FSQAttributes' : 'eICFFQAttributes'].map(attr => ({ valueCoding: { display: attr.choice_label, code: parseInt(attr.choice_value) }})) : undefined,
                        required: !!que.not_to_ans_value ? false : true,
                    }))
                },
                "request": {
                    "method": "POST",
                    "url": "https://radxup-dev.azurewebsites.net"
                }
            },
            {
                "resource": {
                    "resourceType": "QuestionnaireResponse",
                    "id": srvy.id,
                    "identifier": [
                        {
                            "use": "official",
                            "system": "urn:collectiv:surveyId",
                            "value": srvy.id
                        }
                    ],
                    "status": "completed",
                    "subject": {
                        "reference": `Person/${srvy.User.UID}`
                    },
                    "questionnaire": `Questionnaire/${srvy.form_code}`,
                    "authored": new Date().toISOString(),
                    item: srvy.Form[srvy.form_group === 'Form' ? 'FSQuestions' : 'eICFFQuestions'].map(que => ({
                        linkId: que.variable_name,
                        answer: !['Multiple Choice', 'Radio Button', 'Dropdown'].includes(que.response_type) ?
                            que.answers && que.answers.answer ? [{
                                [responseTypes[que.response_type] || que.response_type]: que.answers.answer,
                            }] : []
                        :
                        que.answers && que.answers.answer ? que.answers.answer.split(',').map((attr, i) => {
                            let value = que.answers.value && que.answers.value.split(',');
                            if(value && value[i]){
                                return ({
                                    valueCoding: {
                                        display: attr,
                                        code: parseInt(value[i])
                                    }
                                })
                            } else {
                                return ({})
                            }
                        }) : []
                    }))
                },
                "request": {
                    "method": "POST",
                    "url": "https://radxup-dev.azurewebsites.net"
                }
            }
        )
    })
    return result;
}
