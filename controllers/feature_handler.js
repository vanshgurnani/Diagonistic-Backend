const dbUtils = require("../utils/db_operations");
const commonUtils = require("../utils/common");
const configs = require("../configs.json");
const emailService = require("../services/email_service");
const DATABASE_COLLECTIONS = configs.CONSTANTS.DATABASE_COLLECTIONS;
const DATABASE = configs.CONSTANTS;


module.exports.createQuery = async (req, res) => {
    try {
        const email = req.decodedToken.email;
        const id = req.decodedToken.id;
        const firstname = req.decodedToken.firstname;
        const lastname = req.decodedToken.lastname;
        const phonenumber = req.decodedToken.phonenumber;

        const requiredFields = [
            { property: "reason", optional: true }
        ];

        const payload = await commonUtils.validateRequestBody(req.body, requiredFields);

        // Create a new query document
        const newQuery = {
            email: email,
            id: id, // Generate a new ID
            firstName: firstname,
            lastName: lastname,
            phoneNumber: phonenumber,
            reason: payload.reason
        };

        const savedQuery = await dbUtils.create(
            newQuery,
            DATABASE_COLLECTIONS.QUERY
        );

        res.status(201).json({
            type: "success",
            message: "Query created successfully.",
            query: savedQuery
        });
    } catch (error) {
        console.error(`[createQuery] Error occurred: ${error}`);
        res.status(500).json({ type: 'Error', message: "Failed to create query." });
    }
};

module.exports.getQuery = async (req, res) => {
    try {
        const sort = req?.query?.sort ? JSON.parse(req.query.sort) : { createdAt: -1 };
        const limit = req?.query?.limit ? parseInt(req.query.limit) : 10;
        const page = req?.query?.page ? parseInt(req.query.page) : 1;
        const skip = (page - 1) * limit;

        // Define the aggregation pipeline
        const pipeline = [
            {
                $sort: sort // Sort the results
            },
            {
                $skip: skip // Skip the appropriate number of documents
            },
            {
                $limit: limit // Limit the results to the specified limit
            }
        ];

        const queries = await dbUtils.aggregate(pipeline, DATABASE_COLLECTIONS.QUERY);

        const totalCount = queries.length;  

        const totalPages = Math.ceil(totalCount / limit); 
        
        res.status(200).json({
            type: 'Success',
            page,
            limit,
            totalCount,
            totalPages,
            queries
        });
    } catch (error) {
        console.error(`[getQuery] Error occurred: ${error}`);
        res.status(500).json({ type: 'Error', message: "Failed to retrieve queries." });
    }
};

module.exports.getCancel = async (req, res) => {
    try{
      // Extract filter, sort, limit, and page from the request query
      const filter = req?.query?.filter ? JSON.parse(req.query.filter) : {};
      const sort = req?.query?.sort ? JSON.parse(req.query.sort) : { createdAt: -1 };
      const limit = req?.query?.limit ? parseInt(req.query.limit) : 3;
      const page = req?.query?.page ? parseInt(req.query.page) : 1;
      const skip = (page - 1) * limit;
  
      const pipeline = [
        {
          $match: {
            action: DATABASE.STATUS.CANCELLLED
          }
        },
        { $sort: sort },
        { $skip: skip },
        { $limit: limit }
      ]
  
      const result = await dbUtils.aggregate(pipeline, DATABASE_COLLECTIONS.BOOKING);
      console.log(result);
  
      res.json({
        type: 'Success',
        page,
        limit,
        bookings: result
      })
    } catch (error) {
      console.error(`[getCancel] Error occurred: ${error}`);
      res.status(500).json({
        type: 'Error',
        message: 'An unexpected error occurred. Please try again later.',
      });
    }
};