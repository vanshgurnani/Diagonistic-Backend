const dbUtils = require("../utils/db_operations");
const configs = require("../configs.json");
const DATABASE_COLLECTIONS = configs.CONSTANTS.DATABASE_COLLECTIONS;

module.exports.getAllTest = async (req, res) => {
    try {
        // Extract filter, sort, limit, and page from the request query
        const filter = req?.query?.filter ? req.query.filter : {};
        const sort = req?.query?.sort ? JSON.parse(req.query.sort) : {};
        const limit = req?.query?.limit ? parseInt(req.query.limit) : 5;
        const page = req?.query?.page ? parseInt(req.query.page) : 1;
        const skip = (page - 1) * limit;
        const searchQuery = req.query.searchQuery ? req.query.searchQuery : "";

        // Define the pipeline to project necessary fields, apply sorting, pagination, and filtering
        const pipeline = [
            {
                $match: {
                    $or: [
                        { TestName: { $regex: searchQuery, $options: "i" } },
                        { Category: { $regex: searchQuery, $options: "i" } }
                    ],
                    ...filter
                }
            },
            { $skip: skip },
            { $limit: limit },
            {
                $project: {
                    _id: 0, // Excluding _id from the result
                    TestName: 1,
                    Category: 1
                }
            },
            {
                $group: {
                    _id: "$Category"
                }
            },
            {
                $project: {
                    _id: 0,
                    Category: "$_id"
                }
            }
        ];

        // Execute the aggregate query
        const [test, distinctCategories] = await Promise.all([
            dbUtils.aggregate(pipeline.slice(0, -2), DATABASE_COLLECTIONS.TEST), // Execute without the distinct categories stage
            dbUtils.aggregate(pipeline.slice(-2), DATABASE_COLLECTIONS.TEST) // Execute only the distinct categories stage
        ]);

        res.status(200).json({ type: 'Success', test, distinctCategories });
    } catch (error) {
        console.error(`[TestController] Error occurred: ${error}`);
        res.status(500).json({ type: 'Error', message: "Failed to fetch test." });
    }
};