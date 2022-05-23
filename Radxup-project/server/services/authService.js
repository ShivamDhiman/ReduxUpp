const jwt = require('jsonwebtoken');
const { Base64 } = require('js-base64');
const _ = require('underscore');
const SAML = require("saml-encoder-decoder-js");
const xmlparser = require('fast-xml-parser');
// const xmlParser = require("xml2json");
const userManager = require('../data/managers/users');
const appService = require('./appService');
const enums = require('../lib/enums');
const studyManager = require('../data/managers/study');
const ROLES = enums.ROLES;

/**
* This function is usae for to generate access token from SSO login
*/
module.exports.ssoLogin = async (req, res) => {
	try {
		if(!req.body.SAMLResponse) {
			return res.status(409).json({status: false, message: 'Invalid login attempt'});
		}

		const samlData = req.body.SAMLResponse;
	  SAML.decodeSamlPost(samlData, async (err, xml) => {
		  if (err) {
			  return res.status(409).json({status: false, message: 'Invalid login attempt'});
	    }

	   	// const jsonObject = xmlParser.toJson(xml, { object: true, sanitize: true, trim: true });
		//  let userProfileData = jsonObject['samlp:Response']['saml:Assertion']['saml:AttributeStatement']['saml:Attribute'];
		//  let netId = _.findWhere(userProfileData, {Name: 'urn:oid:1.3.6.1.4.1.5923.1.1.1.6'}) ? _.findWhere(userProfileData, {Name: 'urn:oid:1.3.6.1.4.1.5923.1.1.1.6'})['saml:AttributeValue']['$t'] : null;
		//  let first_name = _.findWhere(userProfileData, {Name: 'urn:oid:2.5.4.42'}) ? _.findWhere(userProfileData, {Name: 'urn:oid:2.5.4.42'})['saml:AttributeValue']['$t']: null;
		//  let last_name = _.findWhere(userProfileData, {Name: 'urn:oid:2.5.4.4'}) ? _.findWhere(userProfileData, {Name: 'urn:oid:2.5.4.4'})['saml:AttributeValue']['$t']: null;


		const XMLOptions = {
			ignoreAttributes : false,
			attributeNamePrefix : "",
		};

		const parser = new xmlparser.XMLParser(XMLOptions);
		let jsonObject = parser.parse(xml,null, true);
		let userProfileData = jsonObject['samlp:Response']['saml:Assertion']['saml:AttributeStatement']['saml:Attribute'];
		let netId = _.findWhere(userProfileData, {Name: 'urn:oid:1.3.6.1.4.1.5923.1.1.1.6'}) ? _.findWhere(userProfileData, {Name: 'urn:oid:1.3.6.1.4.1.5923.1.1.1.6'})['saml:AttributeValue']['#text'] : null;
		let first_name = _.findWhere(userProfileData, {Name: 'urn:oid:2.5.4.42'}) ? _.findWhere(userProfileData, {Name: 'urn:oid:2.5.4.42'})['saml:AttributeValue']['#text']: null;
		let last_name = _.findWhere(userProfileData, {Name: 'urn:oid:2.5.4.4'}) ? _.findWhere(userProfileData, {Name: 'urn:oid:2.5.4.4'})['saml:AttributeValue']['#text']: null;

		 let searchQuery = {
     		where: {
       		personal_email: netId
     	 }
   	 };

     let userProfile = await userManager.getUserProfile(searchQuery);
		 if(!userProfile) {
				return res.status(400).json({ success: false, message: 'Invalid login attempt' });
		 }

		 if(userProfile.role_id === ROLES.PARTICIPANT || userProfile.status === 'Inactive') {
        		return res.status(400).json({ success: false, message: 'Invalid login attempt' });
     	 }

		 if(!userProfile.first_name) {
				userProfile = await userManager.updateUserProfile({first_name: first_name, last_name: last_name }, {where: {id: userProfile.id}});
		 }

		 if(userProfile.role_id != 4) {
			searchQuery = {
				where: {
					id: userProfile.study_id
				},
				attributes: ['id']
			}

			let studyStatus = await studyManager.getStudyDetails(searchQuery);
			if(!studyStatus) {
					return res.status(409).json({status: false, message: 'You are not part of the live study'});
			}
		 }
		 let token = this.generateAuthToken(userProfile);
		 let options = {
				maxAge: 1 * 60 * 1000,
				httpOnly: true,
				secure: true
		 }

		 res.cookie('token', token, options);
	   res.redirect(302, `${process.env.WEB_URL}/login`);
		});
	} catch (error) {
		res.status(409).json({status: false, message: 'Invalid login attempt'});
	}
}


/**
* This function is usae for to authenticate api end points and validate access token for resource access
*/
module.exports.validateAccessToken = (req, res, callback) => {
	try {
		let accessToken = req.body.token || req.headers['Authorization'] || req.headers['authorization'];
		if(accessToken) {
			req.user = {};
			jwt.verify(accessToken, process.env.SECRET_KEY, async(err, decoded) => {
				if(decoded) {
					let currentTimeStamp = Math.floor((Date.now())/ 1000);
					if(decoded.exp < currentTimeStamp) {
						return res.status(401).send({success: false, message: 'Token Expired'});
					}

					let searchQuery = {
						where: {
							id: decoded.id
						}
					}

					let userProfile = await userManager.getUserProfile(searchQuery);
					if(!userProfile) {
						return res.status(401).send({success: false, message: 'User not found'});
					}
					req.user = userProfile;
					req.user.hasRole = function(roles) {
						// Return true if the user has the same role access
						return roles.includes(userProfile.role_id)
					}

					return callback(null, userProfile);
				} else {
					return res.status(401).send({success: false, message: 'Invalid token'});
				}
			});
		} else {
			return res.status(401).send({success: false, message: 'Missing token'});
		}
	} catch (error) {
		console.log(error);
		return res.status(403).send({success: false, message: 'Invalid token'});
	}
};


/**
* This function is use for to generate access token
*/
module.exports.generateAuthToken = (userDetails) => {
	let tokenSession = Math.floor((Date.now() + 1 * 6 * 60 * 60 * 1000)/ 1000); // Current Date + days + hours + minutes + seconds + milliseconds
	let tokenPlayload = {
		study_id : userDetails.study_id || 1,
		id		   : userDetails.id,
		role_id	 : userDetails.role_id,
   	exp		   : tokenSession
	}
	return jwt.sign(tokenPlayload, process.env.SECRET_KEY);
}

/**
* This function is use for to encrypt the request paylaod
*/
module.exports.encryptPayload = (payload)=> {
	return new Promise((resolve, reject) => {
		try {
			let dataString = Base64.btoa(JSON.stringify(payload));
			resolve(dataString);
		} catch (error) {
			error.message = 'Data encryption failed';
			reject(error);
		}
	});
}


/**
* This function is use for to decrypt the request paylaod
*/
module.exports.decryptPayload = (token)=> {
	return new Promise((resolve, reject) => {
		try {
			let playload = JSON.parse(Base64.atob(token));
			resolve(playload);
		} catch (error) {
			reject('Data decryption failed');
		}
	});
}
