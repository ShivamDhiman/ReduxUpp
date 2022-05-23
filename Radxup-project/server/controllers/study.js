const Sequelize = require('sequelize');
const studyManager = require('../data/managers/study');
const armsManager = require('../data/managers/arms');
const userManager = require('../data/managers/users');
const auditLogManager = require('../data/managers/auditTrails');
const authService = require('../services/authService');
const blobService = require('../services/fileService');
const appService = require('../services/appService');
const enums = require('../lib/enums');
const validator = require('../lib/validator');
const { sequelize } = require('../data/connections/connection');
const _ = require('lodash');
const { Users } = require('../data/models/users');
const { Study } = require('../data/models/study');
const asyncLoop = require('node-async-loop');
const PARAMSTYPE = enums.PARAMSTYPE;
const ROLES = enums.ROLES;
const Op = Sequelize.Op;
const moment = require('moment');
/**
 * This function is use to get studyList
 */
module.exports.getStudyList = async (req, res) => {
  try {
    if (!req.user.hasRole([ROLES.SUPER_ADMIN])) {
      return res.status(403).json({ success: false, message: `You don't have these rights.` });
    }

    let sqlQuery = `SELECT id, name, status, participants, records_pushed, std_id, s.study_id FROM \"Study\" as s LEFT JOIN ((SELECT study_id, COUNT(id) as participants FROM \"Users\" where role_id = 3 GROUP BY study_id) as u FULL OUTER JOIN (SELECT study_id as std_id, COUNT(id) as records_pushed FROM \"Survey\" where sync_status='PUSHED' GROUP BY study_id) as sv ON u.study_id = sv.std_id) as t ON s.id = t.study_id OR s.id = t.std_id ORDER BY s.id DESC`;

    let [studyList] = await sequelize.query(sqlQuery);

    res.status(200).json({ success: true, data: studyList });
  } catch (error) {
    res.status(409).json({ success: false, message: error.message });
  }
};

/**
 * This function is use to get studyDetails
 */
module.exports.getStudyById = async (req, res) => {
  try {
    const { studyId } = req.params;
    if (!studyId) {
      return res.status(409).json({ success: false, message: `Study id is required.` });
    }

    let searchQuery = `SELECT * FROM \"Study\" as s LEFT JOIN
                      ((SELECT study_id as studyId, COUNT(id) as participants FROM \"Users\" where role_id=${3} AND study_id = '${studyId}' GROUP BY study_id) as u FULL OUTER JOIN
                      (SELECT study_id as std_id, COUNT(id) as records_pushed FROM \"Survey\" where sync_status='PUSHED' AND study_id = '${studyId}' GROUP BY std_id) as sv ON u.studyId = sv.std_id) as t
                      ON s.id = t.studyId OR s.id = t.std_id where s.id = '${studyId}'`;

    let [studyDetails] = await sequelize.query(searchQuery);

    if (studyDetails && studyDetails.length) {
      studyDetails = studyDetails[0];
      let armSearchQuery = `SELECT id, name, description, status, created_by, created_at, updated_by, updated_at FROM \"Arms\" where study_id = '${studyId}'`;
      let [arms] = await sequelize.query(armSearchQuery);

      studyDetails.arms = arms;
    }
    res.status(200).json({ success: true, data: studyDetails });
  } catch (error) {
    res.status(409).json({ success: false, message: error.message });
  }
};

/**
 * This function is use to get study Details
 */
module.exports.getStudyDetails = async (req, res) => {
  try {
    const { studyId } = req.params;
    if (!studyId) {
      return res.status(409).json({ success: false, message: `Study id is required.` });
    }
    let searchQuery = {
      where: {
        id: studyId
      }
    }
    let studyInfo = await studyManager.getStudyDetails(searchQuery)
    res.status(200).json({ success: true, data: studyInfo });
  } catch (error) {
    res.status(409).json({ success: false, message: error.message });
  }
};

/**
 * This function is use for create new study
 */
module.exports.createStudy = async (req, res) => {
  try {
    if (!req.user.hasRole([ROLES.SUPER_ADMIN])) {
      return res.status(403).json({ success: false, message: `You don't have these rights.` });
    }

    if (!req.body.payload) {
      return res.status(406).json({ success: false, message: 'Request payload missing' });
    }

    let params = await authService.decryptPayload(req.body.payload);
    let validationResult = validator.validateStudyParams(params);

    if (validationResult.error) {
      return res.status(400).json({
        success: false,
        message: `Please enter valid ${PARAMSTYPE[validationResult.error.details[0].context.key]}`,
      });
    }

    let searchQuery = {
      where: {
        [Op.or]: [{ study_id: params.study_id }, { name: params.name }],
      },
    };

    let studyDetails = await studyManager.getStudyDetails(searchQuery);

    if (studyDetails) {
      return res.status(409).json({ success: false, message: 'Duplicate Study Id or Study name' });
    }

    let payload = {
      study_id: params.study_id,
      name: params.name,
      status: 'Onboarding',
      description: params.description,
      awardee_org: params.awardee_org,
      registration_description: params.registration_description || null,
      feedback_description: params.feedback_description || null,
      created_by: req.user.id,
      updated_by: req.user.id,
    };

    studyDetails = await studyManager.createStudyRecord(payload);
    if (params.arms && params.arms.length) {
      let arms = params.arms;
      let armsArr = [];
      arms.forEach((arm) => {
        let obj = {
          study_id: studyDetails.id,
          name: arm.name,
          description: arm.description,
          status: 'ACTIVE',
          created_by: req.user.id,
          updated_by: req.user.id,
        };

        armsArr.push(obj);
      });

      await armsManager.addArms(armsArr);
    }

    let auditPayload = {
      message: `New study ${params.name} created with ${params.study_id} study id`,
      personal_email: req.user.personal_email,
      user_id: req.user.id,
      study_id: studyDetails.id,
    };

    await appService.addLog(auditPayload);
    res.status(200).json({ success: true, message: 'Study successfully created', study_id: studyDetails.id });
  } catch (error) {
    res.status(409).json({ success: false, message: error.message });
  }
};

/**
 * This function is use for edit study
 */
module.exports.editStudy = async (req, res) => {
  try {
    if (!req.user.hasRole([ROLES.SUPER_ADMIN])) {
      return res.status(403).json({ success: false, message: `You don't have these rights.` });
    }

    if (!req.body.payload) {
      return res.status(406).json({ success: false, message: 'Request payload missing' });
    }

    let params = await authService.decryptPayload(req.body.payload);
    let validationResult = validator.validateStudyParams(params);

    if (validationResult.error) {
      return res.status(400).json({
        success: false,
        message: `Please enter valid ${PARAMSTYPE[validationResult.error.details[0].context.key]}`,
      });
    }

    let searchQuery = {
      where: {
        id: params.id,
      }
    };

    let studyDetails = await studyManager.getStudyDetails(searchQuery);

    if (!studyDetails) {
      return res.status(409).json({ success: false, message: 'Study not found' });
    }

    // if (studyDetails && studyDetails.status.toLowerCase() !== 'onboarding') {
    //   return res.status(409).json({ success: false, message: 'Study with Onboarding status can be updated only' });
    // }

    let updateQuery = {
      study_id: params.study_id,
      name: params.name,
      description: params.description,
      registration_description: params.registration_description || studyDetails.registration_description,
      feedback_description: params.feedback_description || studyDetails.feedback_description,
      awardee_org: params.awardee_org,
      updated_by: req.user.id
    };

    studyDetails = await studyManager.updateStudy(updateQuery, searchQuery);

    if (params.arms && params.arms.length) {
      searchQuery = {
        where: {
          study_id: params.id,
        },
      };

      let existingArms = await armsManager.getArmsList(searchQuery);
      if (existingArms && existingArms.length) {
        let armsId = existingArms.map((arm) => arm.id);

        let deleteQuery = { where: { id: armsId } };
        await armsManager.deleteArms(deleteQuery);
      }
      let arms = params.arms;
      let createArms = [];
      arms.forEach((arm) => {
        let obj = {
          study_id: params.id,
          name: arm.name,
          description: arm.description,
          created_by: req.user.id,
          updated_by: req.user.id,
          status: 'ACTIVE',
        };
        createArms.push(obj);
      });
      if (createArms && createArms.length) {
        await armsManager.addArms(createArms);
      }
    }

    let auditPayload = {
      message: `${params.name} study updated`,
      personal_email: req.user.personal_email,
      user_id: req.user.id,
      study_id: params.id,
    };

    await appService.addLog(auditPayload);
    res.status(200).json({ success: true, message: 'Study successfully updated' });
  } catch (error) {
    res.status(409).json({ success: false, message: error.message });
  }
};

/**
 * This function is use for update study status
 */
module.exports.updateStudyStatus = async (req, res) => {
  try {
    if (!req.user.hasRole([ROLES.SUPER_ADMIN])) {
      return res.status(403).json({ success: false, message: `You don't have these rights.` });
    }

    if (!req.body.payload) {
      return res.status(406).json({ success: false, message: 'Request payload missing' });
    }

    let params = await authService.decryptPayload(req.body.payload);
    let searchQuery = {
      where: {
        id: params.id,
      },
    };

    let studyDetails = await studyManager.getStudyDetails(searchQuery);

    if (!studyDetails) {
      return res.status(409).json({ success: false, message: 'Study not found' });
    }

    let updateQuery = {
      status: params.status,
    };
    await studyManager.updateStudy(updateQuery, searchQuery);

    let auditPayload = {
      message: `${studyDetails.name} study status updated to ${params.status} from ${studyDetails.status}`,
      personal_email: req.user.personal_email,
      user_id: req.user.id,
      study_id: studyDetails.id,
    };

    await appService.addLog(auditPayload);
    res.status(200).json({ success: true, message: 'Study status successfully updated' });
  } catch (error) {
    res.status(409).json({ success: false, message: error.message });
  }
};
/**
 * This function is use for get arms list
 */
module.exports.getArmsList = async (req, res) => {
  try {
    if (!req.user.hasRole([ROLES.STUDY_ADMIN, ROLES.STUDY_COORDINATOR])) {
      return res.status(403).json({ success: false, message: `You don't have these rights.` });
    }

    if (!req.query.study_id) {
      return res.status(409).json({ success: false, message: 'Study id missing in request' });
    }

    let searchQuery = {
      where: {
        study_id: req.query.study_id,
      },
    };

    let armsList = await armsManager.getArmsList(searchQuery);
    res.status(200).json({ success: true, data: armsList });
  } catch (error) {
    res.status(409).json({ success: false, message: error.message });
  }
};

module.exports.uploadDocument = async (req, res) => {
  try {
    if (!req.user.hasRole([ROLES.STUDY_ADMIN, ROLES.SUPER_ADMIN])) {
      return res.status(403).json({ success: false, message: `You don't have these rights.` });
    }

    if (!(req.files && req.files.length > 0)) {
      return res.status(400).json({ success: false, message: 'File not attached in request' });
    }

    if (!req.body.study_id) {
      return res.status(409).json({ success: false, message: 'Study id missing in request' });
    }
    let filePath = req.files[0].path;
    let fileName = req.files[0].originalname;
    if (fileName) {
      fileName = fileName && fileName.split(' ').join('_');
    }
    let study_id = req.body.study_id;
    let document_type = req.body.document_type;
    let status = req.body.status || 'pending';
    let version = 1;

    let searchQuery = {
      where: {
        id: study_id,
      },
    };

    let studyDetails = await studyManager.getStudyDetails(searchQuery);
    if (!studyDetails) {
      return res.status(409).json({ success: false, message: 'Study details not found' });
    }

    searchQuery = {
      where: {
        study_id,
        document_type,
      },
    };

    await blobService.createShareIfNotExists(process.env.BLOB_CONTAINER);
    await blobService.createDirectoryIfNotExists(process.env.BLOB_CONTAINER, process.env.BLOB_DOCUMENT_DIR);
    await blobService.uploadFileOnBlob(process.env.BLOB_CONTAINER, process.env.BLOB_DOCUMENT_DIR, fileName, filePath);
    await blobService.deleteFileFromLocal(filePath);
    let url = `${process.env.BLOB_SERVICE_URL}/${process.env.BLOB_CONTAINER}/${process.env.BLOB_DOCUMENT_DIR}/${fileName}`;
    let response = await studyManager.getStudyDocuments(searchQuery);

    if (response) {
      version = response.length + 1;
    }
    let updateQuery = {
      study_id,
      document_type,
      url,
      document_name: fileName,
      version,
      status,
    };
    response = await studyManager.updateStudyDocument(updateQuery);
    let auditPayload = {
      message: `New ${document_type} document uploaded for ${studyDetails.name} study`,
      personal_email: req.user.personal_email,
      user_id: req.user.id,
      study_id: studyDetails.id,
    };

    await appService.addLog(auditPayload);
    res.status(200).json({ success: true, message: 'Document uploaded successfully' });
  } catch (error) {
    console.log(error);
    res.status(409).json({ success: false, message: error.message });
  }
};

module.exports.getDocuments = async (req, res) => {
  try {
    if (!req.user.hasRole([ROLES.STUDY_ADMIN, , ROLES.SUPER_ADMIN])) {
      return res.status(403).json({ success: false, message: `You don't have these rights.` });
    }

    if (!req.query.study_id) {
      return res.status(409).json({ success: false, message: 'Study id missing in request' });
    }

    let searchQuery = {
      where: {
        study_id: req.query.study_id,
      },
      attributes: ['document_type', 'document_name', 'status', 'id'],
    };

    let response = await studyManager.getStudyDocuments(searchQuery);
    let arr = [];
    if (response && response.length) {
      let obj = {
        'IRB Approval': [],
        'IRB Protocol': [],
        'Data Use Agreement': [],
        'Informed Consent Form': [],
        Other: [],
      };
      obj = { ...obj, ..._.groupBy(response, 'dataValues.document_type') };

      for (const [key, value] of Object.entries(obj)) {
        arr.push({
          document_type: key,
          document: value,
        });
      }
    }
    res.status(200).json({ success: true, data: arr });
  } catch (error) {
    res.status(409).json({ success: false, message: error.message });
  }
};

module.exports.updateDocumentsStatus = async (req, res) => {
  try {
    if (!req.user.hasRole([ROLES.STUDY_ADMIN, , ROLES.SUPER_ADMIN])) {
      return res.status(403).json({ success: false, message: `You don't have these rights.` });
    }

    if (!req.body.payload) {
      return res.status(406).json({ success: false, message: 'Request payload missing' });
    }

    let params = await authService.decryptPayload(req.body.payload);

    let searchQuery = {
      where: {
        study_id: params.study_id,
        id: {
          [Op.in]: params.documentIds,
        },
      },
    };

    let updateQuery = {
      status: params.status || 'Approved',
    };

    await studyManager.updateStudyDocumentStatus(updateQuery, searchQuery);
    searchQuery = {
      where: {
        id: params.study_id,
      },
    };

    let studyDetails = await studyManager.getStudyDetails(searchQuery);
    let auditPayload = {
      message: `${studyDetails.name} study document status updated as ${params.status}`,
      personal_email: req.user.personal_email,
      user_id: req.user.id,
      study_id: params.study_id,
    };
    console.log(auditPayload);
    await appService.addLog(auditPayload);
    res.status(200).json({ success: true, message: 'Document status updated' });
  } catch (error) {
    res.status(409).json({ success: false, message: error.message });
  }
};

/**
 * This function is use for fetching study stats
 */
module.exports.getStudyStats = async (req, res) => {
  try {
    if (!req.user.hasRole([ROLES.SUPER_ADMIN])) {
      return res.status(403).json({ success: false, message: `You don't have these rights.` });
    }

    let sqlQuery = `SELECT COUNT(id) as count, status FROM \"Study\" GROUP BY status UNION ALL SELECT COUNT(id), 'TotalRecords' status FROM \"Study\"`;

    let [data] = await sequelize.query(sqlQuery);
    let response = {};
    if (data && data.length) {
      response = data.reduce((prev, itr) => ({ ...prev, [itr.status]: itr.count }), {});
    }

    res.status(200).json({ success: true, data: response });
  } catch (error) {
    res.status(409).json({ success: false, message: error.message });
  }
};

/**
 * This function is use for to add study admin
 */
module.exports.addStudyAdmin = async (req, res) => {
  try {
    if (!req.user.hasRole([ROLES.SUPER_ADMIN])) {
      return res.status(403).json({ success: false, message: `You don't have these rights.` });
    }

    let params = await authService.decryptPayload(req.body.payload);
    if (!params.id) {
      return res.status(409).json({ success: false, message: 'Study id missing in request' });
    }

    let users = params.users;
    if (!(users && Array.isArray(users) && users.length)) {
      return res.status(409).json({ success: false, message: 'Study admins data missing in request' });
    }

    let searchQuery = {
      where: {
        id: params.id
      }
    };

    let studyDetails = await studyManager.getStudyDetails(searchQuery);
    if (!studyDetails) {
      return res.status(409).json({ success: false, message: 'Study details not found' });
    }

    searchQuery = {
      where: {
        personal_email: users
      }
    };

    let usersList = await userManager.getUsersList(searchQuery);
    let newUsers = [];
    let deletedUsers = [];
    let reactivateUser = [];
    let existingUsers = [];
    if (usersList && usersList.length > 0) {
      existingUsers = _.map(usersList, (item) => item.dataValues.personal_email);
      users.forEach((user) => {
        if (!existingUsers.includes(user)) {
          newUsers.push(user);
        }
      });
    } else {
      newUsers = users;
    }

    searchQuery = {
      where: {
        study_id: params.id,
        role_id: ROLES.STUDY_ADMIN
      }
    };

    let studyUsersList = await userManager.getUsersList(searchQuery);
    if (studyUsersList && studyUsersList.length > 0) {
      let studyUsers = _.map(studyUsersList, (item) => item.dataValues.personal_email);
      studyUsers.forEach((netId) => {
        if (existingUsers.includes(netId)) {
          reactivateUser.push(netId)
        } else {
          deletedUsers.push(netId);
        }
      });

      let updateQuery = {
        status: 'Inactive'
      };

      if (deletedUsers && deletedUsers.length > 0) {
        searchQuery = {
          where: {
            personal_email: {
              [Op.in]: deletedUsers
            }
          }
        };
        await userManager.updateUserProfile(updateQuery, searchQuery);
      }

      if (reactivateUser && reactivateUser.length) {
        searchQuery = {
          where: {
            personal_email: {
              [Op.in]: reactivateUser
            }
          }
        };

        updateQuery = {
          status: 'Active',
        };
        await userManager.updateUserProfile(updateQuery, searchQuery);
      }
    }

    if (newUsers && newUsers.length > 0) {
      await createAdminsProfiles(newUsers, params.id, req);
    }

    let auditPayload = {
      message: `Study admins added or update on ${studyDetails.name} study`,
      personal_email: req.user.personal_email,
      user_id: req.user.id,
      study_id: studyDetails.id,
    };

    await appService.addLog(auditPayload);
    res.status(200).json({ success: true, message: 'Study admin successfully added', data: params.users });
  } catch (error) {
    res.status(409).json({ success: false, message: error.message });
  }
};

/**
 * This local function is use for create study admin profiles
 */
function createAdminsProfiles(users, studyId, req) {
  let regex = new RegExp('[a-z0-9]+@[a-z]+.[a-z]{2,3}');
  return new Promise(async (resolve, reject) => {
    let usersProfiles = [];
    asyncLoop(users, async(email, next) => {
      if (regex.test(email)) {
        let payload = {
          personal_email: email,
          role_id: parseInt(ROLES.STUDY_ADMIN),
          status: 'Active',
          study_id: studyId,
          initiated_by: 'SUPER_ADMIN',
          UID: appService.generateUUID(),
          created_by: req.user.id,
          updated_by: req.user.id,
        };

        let userProfile = await userManager.createUserProfile(payload);

        payload = {
          study_id: studyId,
          user_id: userProfile.id,
          status: 'Active',
          created_by: req.user.id,
          updated_by: req.user.id,
        }

        await userManager.createUserStudyMapping(payload);
        next();
      } else {
        next();
      }
    },
    function(err) {
      if(err) {
        console.log(err);
      }
      resolve();
    });
  });
}

function getFormData(userMappedForms) {
  let formList = [];
  return new Promise((resolve, reject) => {
    asyncLoop(userMappedForms, async(formDetail, next) => {

      let searchQuery = {
        where: {
          form_code: formDetail.form_code
        },
        attributes: ['name']
      }
      let formData;
      if(formDetail.form_group == 'Form'){
        formData = await formsManager.getForms(searchQuery);
      } else {
        formData = await eICFManager.getEICFForm(searchQuery);
      }
      formDetail.dataValues['form_name'] = formData.name;
      formList.push(formDetail);
      next();
    },
    function(err){
      if(err) {
        console.log(err);
      }

      resolve(formList)
    });
  });
}

/**
 * This function is use for to add study admin
 */
module.exports.addStudyManagers = async (req, res) => {
  try {
    if (!req.user.hasRole([ROLES.STUDY_ADMIN])) {
      return res.status(403).json({ success: false, message: `You don't have these rights.` });
    }

    let params = await authService.decryptPayload(req.body.payload);

    let searchQuery = {
      where: {
        id: req.user.study_id,
      },
    };

    let studyDetails = await studyManager.getStudyDetails(searchQuery);
    if (!studyDetails) {
      return res.status(409).json({ success: false, message: 'Study details not found' });
    }

    searchQuery = {
      where: {
        personal_email: params.email,
      },
      attributes: ['id', 'personal_email', 'study_id', 'role_id'],
    };

    let userProfile = await userManager.getUserProfile(searchQuery);
    if (userProfile) {
      if(userProfile.study_id == req.user.study_id){
        if(userProfile.role_id != params.role_id){
          return res.status(409).json({ success: false, message: 'User already exists with different role.' });
        }
        return res.status(409).json({ success: false, message: 'User already exists.' });
      }
      return res.status(409).json({ success: false, message: 'User already aligned with another study.' });
    }

    let payload = {
      personal_email: params.email,
      role_id: params.role_id,
      study_id: studyDetails.id,
      status: 'Active',
      UID: appService.generateUUID(),
      created_by: req.user.id,
      updated_by: req.user.id,
    };

    await userManager.createUserProfile(payload);
    let userRole = params.role_id == 1 ? 'Admin' : 'Coordinator';
    let auditPayload = {
      message: `Study ${userRole} ${params.email} added on ${studyDetails.name} study`,
      personal_email: req.user.personal_email,
      user_id: req.user.id,
      study_id: studyDetails.id,
    };

    await appService.addLog(auditPayload);
    res.status(200).json({ success: true, message: `Study ${userRole} successfully added` });
  } catch (error) {
    res.status(409).json({ success: false, message: error.message });
  }
};

/**
 * This function is use for to add study admin
 */
module.exports.updateStudyManagerStatus = async (req, res) => {
  try {
    if (!req.user.hasRole([ROLES.STUDY_ADMIN])) {
      return res.status(403).json({ success: false, message: `You don't have these rights.` });
    }

    let params = await authService.decryptPayload(req.body.payload);

    let searchQuery = {
      where: {
        id: req.user.study_id,
      },
    };

    let studyDetails = await studyManager.getStudyDetails(searchQuery);
    if (!studyDetails) {
      return res.status(409).json({ success: false, message: 'Study details not found' });
    }

    searchQuery = {
      where: {
        personal_email: params.email,
      },
      attributes: ['id', 'personal_email'],
    };

    let userProfile = await userManager.getUserProfile(searchQuery);
    if (!userProfile) {
      return res.status(409).json({ success: false, message: 'User not found' });
    }

    let payload = {
      status: params.status || 'Inactive',
      updated_by: req.user.id,
    };

    await userManager.updateUserProfile(payload, searchQuery);
    let userRole = params.role_id == 1 ? 'Admin' : 'Coordinator';
    let auditPayload = {
      message: `Study ${userRole} ${userProfile.personal_email} deregistered on ${studyDetails.name} study`,
      personal_email: req.user.personal_email,
      user_id: req.user.id,
      study_id: studyDetails.id,
    };

    await appService.addLog(auditPayload);
    res.status(200).json({ success: true, message: `Study ${userRole} successfully deregistered` });
  } catch (error) {
    res.status(409).json({ success: false, message: error.message });
  }
};

/**
 * This function is use for get study admins list
 */
module.exports.getStudyAdmin = async (req, res) => {
  try {
    if (!req.user.hasRole([ROLES.SUPER_ADMIN])) {
      return res.status(403).json({ success: false, message: `You don't have these rights.` });
    }
    if (!req.query.study_id) {
      return res.status(409).json({ success: false, message: 'Study id missing in request' });
    }

    let searchQuery = {
      where: {
        study_id: req.query.study_id,
        role_id: 1,
        status: 'Active',
      },
    };

    let data = await userManager.getUsersList(searchQuery);
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(409).json({ success: false, message: error.message });
  }
};

/**
 * This function is use for fetching study stats
 */
module.exports.getAuditLogs = async (req, res) => {
  try {
    if (!req.user.hasRole([ROLES.SUPER_ADMIN])) {
      return res.status(403).json({ success: false, message: `You don't have these rights.` });
    }
    let gteDate = moment().startOf('day').subtract(3, 'days');
    searchQuery = {
      where: {
        updated_at: {
          [Op.gte]: gteDate,
        },
      },
      include: [
        {
          model: Study,
          attributes: ['study_id'],
        },
      ],
      order: [['id', 'DESC']],
      raw: true,
    };

    let auditLogs = await auditLogManager.getAuditLogs(searchQuery);
    auditLogs = JSON.stringify(auditLogs);
    auditLogs = auditLogs.replace(/\"Study.study_id\":/gi, '"study_id":');
    auditLogs = JSON.parse(auditLogs);
    res.status(200).json({ success: true, data: auditLogs });
  } catch (error) {
    res.status(409).json({ success: false, message: error.message });
  }
};
