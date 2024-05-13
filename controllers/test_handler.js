const dbUtils = require("../utils/db_operations");
const configs = require("../configs.json");
const DATABASE_COLLECTIONS = configs.CONSTANTS.DATABASE_COLLECTIONS;

module.exports.createTest = async (req, res) => {
    try {
      // Define the required fields and their optional status
      const keys = [
        { property: 'TestName', optional: false },
        { property: 'Category', optional: false },
        { property: 'rate', optional: false },
        { property: 'discount', optional: false },
        { property: 'available', optional: false },
        { property: 'finalPrice', optional: false }
      ];
  
      // Validate the request body against the defined keys
      const payload = await commonUtils.validateRequestBody(req.body, keys);
  
      // Execute the create operation
      const result = await dbUtils.create(payload, DATABASE_COLLECTIONS.TEST);
  
      res.status(201).json({ type: 'Success', message: "Test created successfully", result });
    } catch (error) {
      console.error(`[createTest] Error occurred while creating test: ${error}`);
      res.status(500).json({ type: 'Error', message: "Failed to create test." });
    }
};
  

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
                    _id: 1, 
                    TestName: 1,
                    Category: 1 , 
                    rate : 1 , 
                    discount : 1 , 
                    finalPrice : 1,
                    action : 1
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

module.exports.updateTest = async (req, res) => {
    try {
      // Extract test ID from request parameters
      const { id } = req.params;
      // Extract update fields from request body
      const updateFields = req.body;
  
      // Execute the update operation
      const result = await dbUtils.updateOne({ _id: id }, updateFields, DATABASE_COLLECTIONS.TEST);
  
      res.status(200).json({ type: 'Success', message: "Test updated successfully", result });
    } catch (error) {
      console.error(`[updateTest] Error occurred while updating test: ${error}`);
      res.status(500).json({ type: 'Error', message: "Failed to update test." });
    }
};

module.exports.deleteTest = async (req, res) => {
    try {
      // Extract test ID from request parameters
      const { id } = req.params;
  
      // Execute the delete operation
      const result = await dbUtils.deleteOne({ _id: id }, DATABASE_COLLECTIONS.TEST);
  
      res.status(200).json({ type: 'Success', message: "Test deleted successfully", result });
    } catch (error) {
      console.error(`[deleteTest] Error occurred while deleting test: ${error}`);
      res.status(500).json({ type: 'Error', message: "Failed to delete test." });
    }
};

module.exports.createBulkTests = async (req, res) => {
    try {
        // Extract test data from the request body
        const testData = req.body;

        // Prepare bulk operations array for bulkWrite
        const bulkOperations = testData.map(data => ({
            insertOne: {
                document: data
            }
        }));

        // Execute bulkWrite operation
        const result = await dbUtils.bulkWrite(bulkOperations, DATABASE_COLLECTIONS.TEST);

        // Send success response
        res.status(200).json({ type: 'Success', message: `${result.insertedCount} test documents created successfully.` });
    } catch (error) {
        console.error(`[createBulkTests] Error occurred: ${error}`);
        res.status(500).json({ type: 'Error', message: "Internal server error." });
    }
};

