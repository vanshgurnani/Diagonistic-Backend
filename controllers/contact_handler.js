const dbUtils = require("../utils/db_operations");
const commonUtils = require("../utils/common");
const configs = require("../configs.json");
const DATABASE_COLLECTIONS = configs.CONSTANTS.DATABASE_COLLECTIONS;

module.exports.createContact = async (req, res) => {
    try{
        
        let requiredFields = [
            { property: "email", optional: true },
            { property: "fullName", optional: true },
            { property: "message", optional: true },
        ];
        let data = await commonUtils.validateRequestBody(req.body, requiredFields);

        const Contact = await dbUtils.create(data, DATABASE_COLLECTIONS.CONTACT);

        res.status(200).json({ type: "success" ,  Contact});
    }
    catch(error){
        console.error(`[ContactController] Error occurred: ${error}`);
        res.status(500).json({ type: 'Error', message: "Failed to save contact." });
    }
}


module.exports.getContact = async (req, res) => {
    try{

        const Contact = await dbUtils.findMany({}, DATABASE_COLLECTIONS.CONTACT);

        res.status(200).json({ type: "success" ,  Contact});
    }
    catch(error){
        console.error(`[ContactController] Error occurred: ${error}`);
        res.status(500).json({ type: 'Error', message: "Failed to save contact." });
    }
}