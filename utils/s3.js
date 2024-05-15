const AWS = require("aws-sdk");

const s3 = new AWS.S3({
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
    region: process.env.REGION,
});

module.exports.uploadFileToS3 = async (file, fileName, bucketName) => {
    try {
        // Prepare upload parameters
        const uploadParams = {
            Bucket: bucketName,
            Key: fileName,
            Body: file.buffer, // Provide the file content as the Body parameter
        };

        // Perform the upload
        const uploadResult = await s3.upload(uploadParams).promise();
        // Return the uploaded file information
        console.log(`Uploaded file details - ${JSON.stringify(uploadResult)}`);
        return uploadResult;
    } catch (error) {
        console.error(`Error uploading file to S3: ${error}`);
        throw error;
    }
};
