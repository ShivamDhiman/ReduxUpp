const asyncLoop = require('node-async-loop');
const short = require('short-uuid');
const pdf = require("html-pdf");
const path = require('path');
const fs = require('fs');
const templateService = require('./templateService.js');
const formsManager = require('../data/managers/forms');
const userManager = require('../data/managers/users');
const studyManager = require('../data/managers/study');
const eICFManager = require('../data/managers/eICF');
const formEmailManager = require('../data/managers/formEmailMapping');
const auditLogManager = require('../data/managers/auditTrails');
const emailService = require('./emailService');

const options = { format: 'Letter' };

/**
* This function is use to check string is empty, null or blank
*/
module.exports.isStringEmptyOrSpaces =(stringValue) => {
  return stringValue === undefined || stringValue === null || stringValue.match(/^ *$/) !== null;
}

/**
* This function is use for to generate otp pin
*/
exports.getOtp = function() {
	return Math.floor(10000 + Math.random() * 9000);
};


/**
 *
 * This function is used to remove duplicate object from array
 */
module.exports.removeDuplicateObj = (ArrayOfObject) =>{
  let jsonObject = ArrayOfObject.map(JSON.stringify);
  let uniqueSet = new Set(jsonObject);
  let uniqueArray = Array.from(uniqueSet).map(JSON.parse);
  return uniqueArray;
}

/**
* This function is use for to generate user uniq id
*/
module.exports.generateUUID = (email) => {
  try {
    let uid = short.generate();
    return uid.toUpperCase().substr(0, 6) + Math.floor(Date.now() / 1000).toString().substr(-6);
  } catch (error) {
    console.log(error);
    return error;
  }
}

/**
* This function is use for to initiate email trigger process
*/
module.exports.initiateEmailProcess = (payload, isReminderEmail = false) => {
  return new Promise(async (resolve, reject) => {
    try {
      let searchQuery = {
        where: {
          form_group: payload.form_group,
          form_code: payload.form_code,
          status: 'Published'
        }
      }

      let formEmailMapping = await formEmailManager.getFormEmail(searchQuery);
      if(!isReminderEmail){

      } else {

      }

      if(!formEmailMapping) {
        searchQuery.where['error'] = 'Email Template not attached'
        console.log(searchQuery.where)
         return resolve();
      }

      if(isReminderEmail && this.isStringEmptyOrSpaces(formEmailMapping.email_reminder_code)){
        searchQuery.where['error'] = 'Email Template not attached'
        console.log(searchQuery.where)
         return resolve();
      }

      if(!isReminderEmail && this.isStringEmptyOrSpaces(formEmailMapping.email_code)){
        searchQuery.where['error'] = 'Email Template not attached'
        console.log(searchQuery.where)
         return resolve();
      }

      searchQuery = {
        where: {
          email_code: (isReminderEmail?  formEmailMapping.email_reminder_code: formEmailMapping.email_code),
          status: 'Active'
        }
      }

      let emailTemplateData = await studyManager.getStudyEmailTemplate(searchQuery);
      if(!emailTemplateData) {
        console.log({status: false, message: `Email template not found for query ${searchQuery}`});
        resolve();
      }

      let emailBody = await templateService.generateEmailBodyTemplate(payload, emailTemplateData);
      let emailOptions = {
        email: payload.personal_email,
        subject: emailTemplateData.subject,
        template: emailBody
      }

      emailService.sendEmail(emailOptions);
      resolve();
    } catch (error) {
      reject(error)
    }
  });
}


/**
* This function is use for to initiate generate ICF PDF templates
*/
module.exports.generateICFPdfTemplate = (user_id, form_code, ICFLanguage, signature_Path) => {
  return new Promise(async (resolve, reject) => {
    let searchQuery = {
      where: {
        id: user_id
      }
    }
    let participantProfile = await userManager.getUserProfile(searchQuery);
    if(!participantProfile || !participantProfile.personal_email || participantProfile.status === 'ANONYMOUS') {
      return resolve();
    }

    let ICFContents = await getAttachedICFList(form_code, ICFLanguage);
    let emailBodyTempalte = await templateService.generateEmailTemplates(participantProfile, 'PARTICIPANT_INVITE');// Temp email body
    let icfAttachments = await generateICFContentPDF(ICFContents, signature_Path);
    let emailOptions = {
      email: participantProfile.personal_email,
      subject: "E-Consent Signed PDF",
      template: emailBodyTempalte,
      attachments: icfAttachments.attachments
    }

    emailService.sendEmail(emailOptions);
    resolve();
  });
}

/**
* This function is use for to generate ICF PDF content
*/
function generateICFContentPDF(ICFContents, signature_Path) {
  return new Promise(async (resolve, reject) => {
    try {
      let attachments = [];
      let signaturePaths = [];
      asyncLoop(ICFContents,async(ICFContent, next)=> {
        let ICFTemplate = await templateService.generateICFTemplate(ICFContent, signature_Path);
        let icfPDFDetails = await generateIcfPDF(ICFTemplate);
        attachments.push({
          filename : icfPDFDetails.name,
          path : icfPDFDetails.path,
          contentType : 'application/pdf'
        });
        signaturePaths.push(icfPDFDetails.path);
        next();
      },
      function(error, result) {
        if(error) {
          console.log(error);
        }
        resolve({attachments: attachments, signaturePaths: signaturePaths});
      });
    } catch (error) {
      console.log(error);
      resolve();
    }
  });
}

/**
* This function is use for to generate ICF PDF
*/
function generateIcfPDF(ICFTemplate) {
  return new Promise(async (resolve, reject) => {
    try {
     let currentTimeStamp = Math.floor(Date.now() / 1000);
     let icfPdfPath = path.join(__dirname, `../uploads/ICF_${currentTimeStamp}.pdf`);
     pdf.create(ICFTemplate, options).toFile(icfPdfPath, function (err, res) {
       if (err) {
         console.log("Error while generating HTML to PDF...... ", err);
       }
       console.log(res);
       resolve({path: icfPdfPath, name: `ICF_${currentTimeStamp}.pdf`});
     });
    } catch (error) {
     console.log(error);
     resolve();
    }
  });
}


/**
* This function is use for to list all attached ICF's
*/
function getAttachedICFList(form_code, ICFLanguage) {
  return new Promise(async (resolve, reject) => {
    try {
      let searchQuery = {
        where: {
          form_code: form_code,
          language: ICFLanguage
        }
      }

      let formDetails = await formsManager.getForms(searchQuery);
      let ICFList = [];
      if(formDetails.eICFName1) {
        searchQuery = {
          where: {
            name: formDetails.eICFName1,
            version: formDetails.eICFVersion1,
            language: ICFLanguage
          },
          attributes:['body']
        }
        let icfContent = await eICFManager.getICF(searchQuery);
        ICFList.push(icfContent.body);
      }

      if(formDetails.eICFName2) {
        searchQuery = {
          where: {
            name: formDetails.eICFName2,
            version: formDetails.eICFVersion2,
            language: ICFLanguage
          },
          attributes:['body']
        }
        let icfContent = await eICFManager.getICF(searchQuery);
        ICFList.push(icfContent.body);
      }

      if(formDetails.eICFName3) {
        searchQuery = {
          where: {
            name: formDetails.eICFName3,
            version: formDetails.eICFVersion3,
            language: ICFLanguage
          },
          attributes:['body']
        }

        let icfContent = await eICFManager.getICF(searchQuery);
        ICFList.push(icfContent.body);
      }

      resolve(ICFList);
    } catch (error) {
      console.log(error);
      resolve();
    }
  });
}


module.exports.addLog = (auditLogPayload) =>{
  return new Promise(async (resolve, reject) => {
    await auditLogManager.addLog(auditLogPayload);
    resolve();
  });
}
