const dbUtils = require("../utils/db_operations");
const commonUtils = require("../utils/common");
const configs = require("../configs.json");
const DATABASE_COLLECTIONS = configs.CONSTANTS.DATABASE_COLLECTIONS;

module.exports.getAllTest = async (req,res) => {
    try{
        const projection = {
            TestName: 1
        }
        const test = await dbUtils.findMany({}, DATABASE_COLLECTIONS.TEST , projection);

        res.status(200).json({ type: 'Success', test });
    }
    catch(error){
        console.error(`[TestController] Error occurred: ${error}`);
        res.status(500).json({ type: 'Error', message: "Failed to fetch test." });
    }
};