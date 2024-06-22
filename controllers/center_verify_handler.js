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

module.exports.updateCenter = async (req, res) => {
  try {
      const email = req.body.email;

      if (!email) {
          return res.status(400).json({ error: "Email is required." });
      }

      const updateFields = {
          name: req.body.name,
          contact: req.body.contact,
          password: req.body.password,
          firstName: req.body.firstName,
          lastName: req.body.lastName,
          ownerContact: req.body.ownerContact,
          centerGST: req.body.centerGST,
          address: req.body.address,
          staffNumber: req.body.staffNumber,
          status: req.body.status,
          available: req.body.available,
      };

      const uploadedFiles = {};

      if (req.files) {
          for (const [fieldName, files] of Object.entries(req.files)) {
              for (const file of files) {
                  const fileName = `${fieldName}-${Date.now()}-${file.originalname}`;
                  const fileUrl = await s3Utils.uploadFileToS3(file, fileName, process.env.AWS_BUCKET_NAME);
                  uploadedFiles[fieldName] = fileUrl.Location;
              }
          }
      }

      const update = {
          ...updateFields,
          addressProof: uploadedFiles.addressProof,
          shopAct: uploadedFiles.shopAct,
          pcpndt: uploadedFiles.pcpndt,
          iso: uploadedFiles.iso,
          nabl: uploadedFiles.nabl,
          nabh: uploadedFiles.nabh,
          centerImg: uploadedFiles.centerImg
      };

      const result = await dbUtils.updateOne({ email: email }, { $set: update }, DATABASE_COLLECTIONS.CENTER);

      const verifyResult = await dbUtils.updateOne({ ownerEmail: email }, { $set: update }, DATABASE_COLLECTIONS.CENTER_VERIFY);

      if (result.modifiedCount === 0  || verifyResult.modifiedCount === 0 ) {
          return res.status(404).json({ error: "Center not found or no changes made." });
      }

      res.status(200).json({ type: "success", message: "Center updated successfully." });
  } catch (error) {
      console.error(`[CenterController] Error occurred: ${error}`);
      res.status(500).json({ type: 'Error', message: "Failed to update center." });
  }
};