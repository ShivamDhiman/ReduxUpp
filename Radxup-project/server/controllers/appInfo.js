const { Op } = require("sequelize");
const _ = require('underscore');
const fs = require("fs").promises;

var waterfall = require('async-waterfall');
const AppInfoMNGR = require('../data/managers/appInfo');
const AppVersion = 2.0;
const AlterAppVersion = 2.1;

/**
 * 
 * @returns 
 */
function deleteExistingData(sequelize, migrationStatus){
    return new Promise(async(resolve, reject)=>{
        try {
            if(parseFloat(migrationStatus.oldVersion)>=AppVersion){
                migrationStatus["deleteStatus"] = "Not Required";
                return resolve(migrationStatus);
            }
             // Clear Data Query
             let clerDataQuery = await fs.readFile(`${global.serverPath}/data/migration/v${AppVersion}/0_clearData.sql`, 'utf8');
             await sequelize.query(clerDataQuery);
            migrationStatus["deleteStatus"] = "Success";
            resolve(migrationStatus);
        }catch(err){
            console.log(JSON.stringify({"Method":"deleteExistingData", "err": err}));
            reject(err);
        }
    })
}


/**
 * 
 * @returns 
 */
 function updateTableStruct(sequelize, migrationStatus){
    return new Promise(async(resolve, reject)=>{
        try {
            if(parseFloat(migrationStatus.oldVersion)>=AlterAppVersion){
                migrationStatus["tableUpdateStatus"] = "Not Required";
                return resolve(migrationStatus);
            }
             //Alter Existing Table;
             let alterTables = await fs.readFile(`${global.serverPath}/data/migration/v${AppVersion}/8_alter_tables.sql`, 'utf8');
             await sequelize.query(alterTables);
            migrationStatus["tableUpdateStatus"] = "Success";
            resolve(migrationStatus);
        }catch(err){
            console.log(JSON.stringify({"Method":"updateTableStruct", "err": err}));
            reject(err);
        }
    })
}

/**
 * 
 * @returns 
 */
 function insertData(sequelize, migrationStatus){
    return new Promise(async(resolve, reject)=>{
        try {
            if(parseFloat(migrationStatus.oldVersion)>=AppVersion){
                migrationStatus["insertStatus"] = "Not Required";
                return resolve(migrationStatus);
            }

            //Clear Existing Data;
            let cleanData = await fs.readFile(`${global.serverPath}/data/migration/v${AppVersion}/0_clearData.sql`, 'utf8');
            await sequelize.query(cleanData);
            // Study Data
            let studyData = await fs.readFile(`${global.serverPath}/data/migration/v${AppVersion}/1_study.sql`, 'utf8');
            await sequelize.query(studyData);
            // User Data
            let userData = await fs.readFile(`${global.serverPath}/data/migration/v${AppVersion}/2_users.sql`, 'utf8');
            await sequelize.query(userData);
            // CDE Sesstion
            let cdeSesstionData = await fs.readFile(`${global.serverPath}/data/migration/v${AppVersion}/3_cdesections.sql`, 'utf8');
            await sequelize.query(cdeSesstionData);
            //CDE Questions
            let cdeQuestionData = await fs.readFile(`${global.serverPath}/data/migration/v${AppVersion}/4_cdequestions.sql`, 'utf8');
            await sequelize.query(cdeQuestionData);
            //CDE Question Attributes
            let cdeQAttributeData = await fs.readFile(`${global.serverPath}/data/migration/v${AppVersion}/5_cdequestionsattributes.sql`, 'utf8');
            await sequelize.query(cdeQAttributeData);
            //CDE EICF Questions
            let cdeEICFQuestionData = await fs.readFile(`${global.serverPath}/data/migration/v${AppVersion}/6_cde_eicf_questions.sql`, 'utf8');
            await sequelize.query(cdeEICFQuestionData);
            //CDE EICF Question Attributes
            let cdeEICFQAttributeData = await fs.readFile(`${global.serverPath}/data/migration/v${AppVersion}/7_cde_eicf_questionsattributes.sql`, 'utf8');
            await sequelize.query(cdeEICFQAttributeData);

            migrationStatus["insertStatus"] = "Success";
            resolve(migrationStatus);
        }catch(err){
            console.log(JSON.stringify({"Method":"insertData", "err": err}));
            reject(err);
        }
    })
}


/**
 * Start Migration Process.
 */
module.exports.startMigration = (sequelize)=>{
    try{    
        console.info("##############################################");
        console.info(`         RADx-UP Version ${AlterAppVersion}        `);
        console.info("         Migration Started                    ");
        console.info("----------------------------------------------");
        console.info(`DB Host ${process.env.DB_HOST}                `);
        console.info(`DB Name ${process.env.DB_NAME}                `);
        console.info("----------------------------------------------");

        let migrationStatus = {};
        let searchQuery = {};
        waterfall([
            async function(next){
                //Check current running version
                searchQuery = {where:{"name": "Migration Version"}};

                let migrationInfo = await AppInfoMNGR.getAppInfo(searchQuery);

                if(migrationInfo && migrationInfo.value){
                    migrationStatus["oldVersion"] = migrationInfo.value;
                } else{
                    //Inserting migration information object
                    await AppInfoMNGR.addAppInfo({"name": "Migration Version","value": AppVersion});
                    migrationStatus["oldVersion"] = 0
                }

                next(null, migrationStatus);
            },
            async function(result, next){
                //Delete existing data and reset counter
                deleteExistingData(sequelize, migrationStatus)
                .then(result =>{
                    migrationStatus = result;
                    next(null, migrationStatus);
                })
                .catch(err =>{
                    migrationStatus = err;
                    next(migrationStatus, null);
                });
            },
            async function (result, next){
                //Update table structure as per new requirements
                updateTableStruct(sequelize, migrationStatus)
                .then(result =>{
                    migrationStatus = result;
                    next(null, migrationStatus);
                })
                .catch(err =>{
                    migrationStatus = err;
                    next(migrationStatus, null);
                });
            },
            async function (result, next){
                //Insert new data [Applicaiton data preparation]
                insertData(sequelize, migrationStatus)
                .then(result =>{
                    migrationStatus = result;
                    next(null, migrationStatus);
                })
                .catch(err =>{
                    migrationStatus = err;
                    next(migrationStatus, null);
                });
            },
            async function (result, next){
                //Update Migrated Version in DB
                searchQuery = {where:{"name": "Migration Version"}};

                let updateQuery = {"value": AlterAppVersion}

                await AppInfoMNGR.updateAppInfo(updateQuery, searchQuery);
                migrationStatus["newVersion"] = AlterAppVersion;
                next(null, migrationStatus);
            }
        ],(err,res)=>{
            if(err){
                console.error("##############################################");
                console.error(`           RADx-UP Version ${AlterAppVersion}           `);
                console.error("           Migration Error               ");
                console.error("==============================================");
                console.error(JSON.stringify({"Method":"startMigration", "migrationStatus": migrationStatus, "waterfallErr": err}));
                console.error("##############################################");
            } else {
                console.info("##############################################");
                console.info(`           RADx-UP Version ${AlterAppVersion}           `);
                console.info("           Migration Status              ");
                console.info("==============================================");
                console.info(`   Migration Old Version   : ${migrationStatus.oldVersion}`);
                console.info(`   Migration New Version   : ${migrationStatus.newVersion}`);
                console.info(`   Migration Deleted       : ${migrationStatus.deleteStatus}`);
                console.info(`   Migration Table Updated : ${migrationStatus.tableUpdateStatus}`);
                console.info(`   Migration Data Inserted : ${migrationStatus.insertStatus}`);
                console.info("##############################################");
            } 
            
        });
        
    }catch(err){
        console.error("#########################################");
        console.error(`||         RADx-UP Version ${AppVersion}         ||`);
        console.error("#########################################");
        console.error("||         Migration Error             ||");
        console.error("=========================================");
        console.error(JSON.stringify({"Method":"startMigration", "migrationStatus": migrationStatus, "waterfallErr": err}));
        console.error("#########################################");
    }
}