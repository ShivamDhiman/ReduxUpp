const azure = require('azure-storage');
const fileService = azure.createFileService(process.env.BLOB_CONNECTION_STRING);
const fs = require('fs');

/**
* This function is use for to create container on blob if not exist
*/
module.exports.createShareIfNotExists = (container) => {
  return new Promise((resolve, reject) => {
    fileService.createShareIfNotExists(container, (error, result, response) => {
      if(error) {
        console.log(`Getting error while creating share(Blob Container) on blob if not exist in blobService.createShareIfNotExists: ${error}`);
        return reject(error);
      }
      resolve();
    });
  });
}


/**
* This function is use for to create directory on blob if not exist
*/
module.exports.createDirectoryIfNotExists = (container, directory) => {
  return new Promise((resolve, reject) => {
    fileService.createDirectoryIfNotExists(container, directory, (error, result, response) => {
      if(error) {
        console.log(`Getting error while creating directory on blob if not exist in blobService.createDirectoryIfNotExists: ${error}`);
        return reject(error);
      }

      resolve();
    });
  });
}


/**
* This function is use for to upload file on blob
*/
module.exports.uploadFileOnBlob = (container, directory, fileName, filePath) => {
  return new Promise((resolve, reject) => {
    fileService.createFileFromLocalFile(container, directory, fileName, filePath, (error, result, response) => {
      if (error) {
        console.log(`Getting error while uploading file on blob in blobService.uploadFileOnBlob: ${error}`);
        return reject(error)
      }
      console.log(result);
      resolve(result);
    });
  });
}


/**
* This function is use for to generate signature token for access image on blob
*/
module.exports.generateSignatureToken = (container, directory, fileName) => {
  return new Promise((resolve, reject) => {
    try {
      let startDate = new Date();
      let expiryDate = new Date(startDate);
      expiryDate.setMinutes(startDate.getMinutes() + 60);
      startDate.setMinutes(startDate.getMinutes());
      let sharedAccessPolicy = {
        AccessPolicy: {
          Permissions: azure.BlobUtilities.SharedAccessPermissions.READ,
          Start: startDate,
          Expiry: expiryDate
        }
      };

      let sharedAccessSignatureToken = fileService.generateSharedAccessSignature(container, directory, fileName,  sharedAccessPolicy);
      resolve(sharedAccessSignatureToken);
    } catch (error) {
      console.log(`Getting error while generating signature token in blobService.generateSignatureToken: ${error}`);
      reject(error);
    }
  });
}

/**
* This function is use for to create file on local
*/
module.exports.createFileOnLocal = (path, data) => {
  return new Promise((resolve, reject) => {
    fs.writeFile(path, data, function(error, data) {
      if (error) {
        return reject(error);
      }
      resolve(path);
    });
  });
}

/**
* This function is use for to delete file from local
*/
module.exports.deleteFileFromLocal = (path) => {
  return new Promise((resolve, reject) => {
    fs.unlink(path, function(error, data) {
      if (error) {
        return reject(error);
      }
      resolve(data);
    });
  });
}

/**
* This function is use for to read file
*/
module.exports.readFile =(path) => {
  return new Promise((resolve, reject) => {
    fs.readFile(path, 'utf8', function(error, data) {
      if (error) {
        return reject(error);
      }
      resolve(data);
    });
  });
}
