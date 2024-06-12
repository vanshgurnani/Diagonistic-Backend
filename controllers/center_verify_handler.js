const dbUtils = require("../utils/db_operations");
const commonUtils = require("../utils/common");
const configs = require("../configs.json");
const s3Utils = require("../utils/s3");
const emailService = require("../services/email_service");
const DATABASE_COLLECTIONS = configs.CONSTANTS.DATABASE_COLLECTIONS;

module.exports.getCenterVerify = async (req, res) => {
    try {
      // Extract filter, sort, limit, and page from the request query
      const filter = req?.query?.filter ? req.query.filter : {};
      const sort = req?.query?.sort ? JSON.parse(req.query.sort) : { createdAt: -1 };
      const limit = req?.query?.limit ? parseInt(req.query.limit) : 5;
      const page = req?.query?.page ? parseInt(req.query.page) : 1;
      const skip = (page - 1) * limit;

      // Define the pipeline to project necessary fields, apply sorting, pagination, and filtering
      const pipeline = [
        {
          $match: filter
        },
        {
          $facet: {
            totalCount: [{ $count: "total" }],
            data: [
              { $sort: sort },
              { $skip: skip },
              { $limit: limit }
            ]
          }
        },
        { $unwind: "$totalCount" },
        {
          $project: {
            totalCount: "$totalCount.total",
            centerData: "$data"
          }
        }
      ];
  
      // Execute the aggregate query
      let result = await dbUtils.aggregate(pipeline, DATABASE_COLLECTIONS.CENTER_VERIFY);
  
      // Check if any bookings are found
      if (!result || !result.length) {
        result = [
          {
            totalCount: 0,
            centerData: []
          }
        ];
      }
  
      const totalDocumentCount = result[0].totalCount;
      const totalPages = Math.ceil(totalDocumentCount / limit);
  
      // Send Success response with bookings data
      res.status(200).json({
        type: 'Success',
        page,
        limit,
        totalPages,
        totalCount: result[0].totalCount,
        center: result[0].centerData
      });
    } catch (error) {
      console.error(`[getCenter] Error occurred: ${error}`);
      res.status(500).json({ type: 'Error', message: "Internal server error." });
    }
};