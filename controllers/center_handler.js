const dbUtils = require("../utils/db_operations");
const commonUtils = require("../utils/common");
const configs = require("../configs.json");
const s3Utils = require("../utils/s3");
const DATABASE_COLLECTIONS = configs.CONSTANTS.DATABASE_COLLECTIONS;

module.exports.createCenter = async(req,res) =>{
    try{
        const requiredFields = [
            { property: "centerName", optional: true },
            { property: "centerContact", optional: true },
            { property: "centerEmail", optional: true },
            { property: "password", optional: true },
            { property: "ownerName", optional: true },
            { property: "ownerContact", optional: true },
            { property: "ownerEmail", optional: true },
            { property: "centerGST", optional: false },
            { property: "address", optional: false },
            { property: "staffNumber", optional: false },

        ];

        const payload = await commonUtils.validateRequestBody(req.body, requiredFields);

        const { centerName,
            centerContact,
            centerEmail, 
            password,
            ownerName,
            ownerContact,
            ownerEmail,
            centerGST,
            address,
            staffNumber 
        } = payload;

        const uploadedFiles = {
            addressProof: '',
            shopAct: '',
            pcpndt: '',
            iso: '',
            nabl: '',
            nabh: ''
        };

        if (req.files) {
            for (const [fieldName, files] of Object.entries(req.files)) {
                for (const file of files) {
                    const fileName = `${fieldName}-${Date.now()}-${file.originalname}`;
                    const fileUrl = await s3Utils.uploadFileToS3(file, fileName, process.env.AWS_BUCKET_NAME);
                    uploadedFiles[fieldName] = fileUrl.Location;
                }
            }
        }

        const newCenter = {
            centerName,
            centerContact,
            centerEmail, 
            password,
            ownerName,
            ownerContact,
            ownerEmail,
            centerGST,
            address,
            staffNumber,
            addressProof: uploadedFiles.addressProof,
            shopAct: uploadedFiles.shopAct,
            pcpndt: uploadedFiles.pcpndt,
            iso: uploadedFiles.iso,
            nabl: uploadedFiles.nabl,
            nabh: uploadedFiles.nabh

        }

        const Center = await dbUtils.create(newCenter, DATABASE_COLLECTIONS.CENTER);

        res.status(200).json({ type: "success" ,  Center });
    }
    catch(error){
        console.error(`[CenterController] Error occurred: ${error}`);
        res.status(500).json({ type: 'Error', message: "Failed to create center." });
    }
}