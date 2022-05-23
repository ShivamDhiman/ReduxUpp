const { BlobServiceClient } = require("@azure/storage-blob");
const blobServiceClient = BlobServiceClient.fromConnectionString(process.env.BLOB_CONNECTION_STRING);

/**
* This function is usae for to uplaod bundel file on blob container
*/
module.exports.uplaodFileOnBlob = async (container, fileName) => {
  return new Promise(async (resolve, reject)=>{
    try {
      let containerClient = blobServiceClient.getContainerClient(container);
      let blockBlobClient = containerClient.getBlockBlobClient(`${fileName}`);
      let blobOptions = { blobHTTPHeaders: { blobContentType: 'application/json' } };
      let uploadBlobResponse = await blockBlobClient.uploadFile(`${__dirname}/../uploads/${fileName}`, blobOptions);
      console.log(`Bundle file successfully uploaded`, uploadBlobResponse);
      resolve();
    } catch (error) {
      console.log(error);
      reject(error);
    }
  });
}

/**
* This function is usae for to create container on blob if not exist
*/
module.exports.createContainerIfNotExist = async (container) => {
  return new Promise(async(resolve, reject)=>{
    try {
      let containerName = container;
      let containerClient = blobServiceClient.getContainerClient(containerName);
      let createContainerResponse = await containerClient.create();
      console.log(`Create container ${containerName} successfully`, createContainerResponse.requestId);
    } catch (error) {
      console.log({"ErrorName": error.name, "ErrorCode": error.code, "statusCode": error.statusCode, container: container});
    }
    resolve();
  });
}
