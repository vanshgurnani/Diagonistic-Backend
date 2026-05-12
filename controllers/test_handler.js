const dbUtils = require("../utils/db_operations");
const configs = require("../configs.json");
const commonUtils = require("../utils/common");
const XLSX = require("xlsx");
const DATABASE_COLLECTIONS = configs.CONSTANTS.DATABASE_COLLECTIONS;

module.exports.createTest = async (req, res) => {
  try {
    const email = req.decodedToken.email;
    console.log(email);

    const keys = [
      { property: "TestName", optional: false },
      { property: "Category", optional: false },
      { property: "rate", optional: false },
      { property: "discount", optional: true },
      { property: "available", optional: true },
      { property: "finalPrice", optional: true },
    ];

    // Validate the request body against the defined keys
    const payload = await commonUtils.validateRequestBody(req.body, keys);

    const { TestName, Category, rate, discount, available, finalPrice } =
      payload;

    const newTest = {
      email: email,
      TestName,
      Category,
      rate,
      discount,
      available,
      finalPrice,
    };

    // Execute the create operation
    const result = await dbUtils.create(newTest, DATABASE_COLLECTIONS.TEST);

    res
      .status(201)
      .json({ type: "Success", message: "Test created successfully", result });
  } catch (error) {
    console.error(`[createTest] Error occurred while creating test: ${error}`);
    res.status(500).json({ type: "Error", message: "Failed to create test." });
  }
};

module.exports.getTest = async (req, res) => {
  try {
    // Extract email from the token
    const email = req.decodedToken.email;

    // Extract filter, sort, limit, and page from the request query
    const filter = req?.query?.filter ? JSON.parse(req.query.filter) : {};
    const sort = req?.query?.sort ? JSON.parse(req.query.sort) : {};
    const limit = req?.query?.limit ? parseInt(req.query.limit) : 5;
    const page = req?.query?.page ? parseInt(req.query.page) : 1;
    const skip = (page - 1) * limit;
    const searchQuery = req.query.searchQuery ? req.query.searchQuery : "";

    // Define the pipeline to project necessary fields, apply sorting, pagination, and filtering
    const pipeline = [
      {
        $match: {
          $and: [
            { email: email },
            {
              $or: [
                { TestName: { $regex: searchQuery, $options: "i" } },
                { Category: { $regex: searchQuery, $options: "i" } },
              ],
            },
            ...Object.entries(filter).map(([key, value]) => ({ [key]: value })),
          ],
        },
      },
      { $skip: skip },
      { $limit: limit },
      {
        $project: {
          _id: 1,
          email: 1,
          TestName: 1,
          Category: 1,
          rate: 1,
          discount: 1,
          finalPrice: 1,
          action: 1,
        },
      },
    ];

    // Pipeline for distinct categories
    const categoryPipeline = [
      {
        $match: {
          email: email,
        },
      },
      {
        $group: {
          _id: "$Category",
        },
      },
      {
        $project: {
          _id: 0,
          Category: "$_id",
        },
      },
    ];

    // Execute the aggregate query
    const [test, distinctCategories, totalCount] = await Promise.all([
      dbUtils.aggregate(pipeline, DATABASE_COLLECTIONS.TEST), // Execute with the email filter
      dbUtils.aggregate(categoryPipeline, DATABASE_COLLECTIONS.TEST), // Execute only the distinct categories stage
      dbUtils.countDocuments(pipeline, DATABASE_COLLECTIONS.TEST),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    res.status(200).json({
      type: "Success",
      page,
      limit,
      totalCount,
      totalPages,
      test,
      distinctCategories,
    });
  } catch (error) {
    console.error(`[TestController] Error occurred: ${error}`);
    res.status(500).json({ type: "Error", message: "Failed to fetch tests." });
  }
};

module.exports.updateTest = async (req, res) => {
  try {
    // Extract test ID from request parameters
    const id = req.body;
    // Extract update fields from request body
    const updateFields = { ...req.body };

    // Execute the update operation
    const result = await dbUtils.updateOne(
      { _id: id },
      { $set: updateFields },
      DATABASE_COLLECTIONS.TEST
    );

    res
      .status(200)
      .json({ type: "Success", message: "Test updated successfully", result });
  } catch (error) {
    console.error(`[updateTest] Error occurred while updating test: ${error}`);
    res.status(500).json({ type: "Error", message: "Failed to update test." });
  }
};

module.exports.deleteTest = async (req, res) => {
  try {
    // Extract test ID from request parameters
    const name = req.body;

    // Execute the delete operation
    const result = await dbUtils.deleteOne(
      { TestName: name },
      DATABASE_COLLECTIONS.TEST
    );

    res
      .status(200)
      .json({ type: "Success", message: "Test deleted successfully", result });
  } catch (error) {
    console.error(`[deleteTest] Error occurred while deleting test: ${error}`);
    res.status(500).json({ type: "Error", message: "Failed to delete test." });
  }
};

module.exports.createBulkTests = async (req, res) => {
  try {
    console.log("[createBulkTests] : upload bulk tests from sheet");
    // Extract email from the token
    const email = req.decodedToken.email;
    console.log(email);

    // Define the keys for validation
    const keys = [
      { property: "TestName", optional: false },
      { property: "Category", optional: false },
      { property: "rate", optional: false },
      { property: "discountPercentage", optional: true },
      { property: "available", optional: true },
      { property: "finalPrice", optional: true },
    ];

    let testData = [];

    console.log(req.file);

    // Check if the file is provided and properly parsed
    if (!req.file) {
      return res
        .status(400)
        .json({ type: "Error", message: "No file uploaded." });
    }

    // Read and parse spreadsheet data from uploaded buffer.
    const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
    const firstSheetName = workbook.SheetNames[0];

    if (!firstSheetName) {
      return res.status(400).json({
        type: "Error",
        message: "No sheet found in the uploaded file.",
      });
    }

    const worksheet = workbook.Sheets[firstSheetName];
    testData = XLSX.utils.sheet_to_json(worksheet, { defval: "" }).map((row) => {
      const normalizedRow = {};
      Object.entries(row).forEach(([key, value]) => {
        const normalizedKey = typeof key === "string" ? key.trim() : key;
        normalizedRow[normalizedKey] =
          typeof value === "string" ? value.trim() : value;
      });
      return normalizedRow;
    });

    // Remove fully empty rows that are commonly present in uploaded sheets.
    testData = testData.filter((row) =>
      Object.values(row).some(
        (value) => value !== "" && value !== null && value !== undefined
      )
    );

    testData = testData.map((row) => {
      const normalizedRow = { ...row };

      if (!normalizedRow.discountPercentage) {
        normalizedRow.discountPercentage = 0;
      }

      if (!normalizedRow.finalPrice) {
        normalizedRow.finalPrice = normalizedRow.rate;
      }

      return normalizedRow;
    });

    if (testData.length === 0) {
      return res.status(400).json({
        type: "Error",
        message: "No data found in the uploaded file.",
      });
    }

    try {
      // Validate and prepare bulk operations with row-level error tracking.
      const bulkOperations = [];
      const rowErrors = [];

      for (let index = 0; index < testData.length; index++) {
        const data = testData[index];
        try {
          const payload = await commonUtils.validateRequestBody(data, keys);
          bulkOperations.push({
            insertOne: {
              document: {
                ...payload,
                email: email,
              },
            },
          });
        } catch (error) {
          rowErrors.push({
            rowNumber: index + 2, // +2 for header row and 1-based indexing
            message: error.message,
          });
        }
      }

      if (rowErrors.length > 0) {
        return res.status(400).json({
          type: "Error",
          message: "Validation error in test data.",
          details: rowErrors,
        });
      }

      if (bulkOperations.length === 0) {
        return res.status(400).json({
          type: "Error",
          message: "No valid rows found in uploaded file.",
        });
      }

      // Execute bulkWrite operation
      const result = await dbUtils.bulkWrite(
        bulkOperations,
        DATABASE_COLLECTIONS.TEST,
        { ordered: false }
      );

      // Send success response
      return res.status(201).json({
        type: "Success",
        message: `${result.insertedCount || 0} test documents created successfully.`,
      });
    } catch (validationError) {
      // If validation error occurs while processing individual data
      console.error(
        `[createBulkTests] Data validation error: ${validationError}`
      );
      return res.status(400).json({
        type: "Error",
        message: "Validation error in test data.",
        details: validationError.message,
      });
    }
  } catch (error) {
    console.error(`[createBulkTests] Error occurred: ${error}`);
    return res
      .status(500)
      .json({ type: "Error", message: "Failed to create bulk tests." });
  } finally {
    console.log("[createBulkTests] : execution finished");
  }
};

module.exports.getAllTest = async (req, res) => {
  try {
    // Extract filter, sort, limit, and page from the request query
    const filter = req?.query?.filter ? JSON.parse(req.query.filter) : {};
    const sort = req?.query?.sort ? JSON.parse(req.query.sort) : {};
    const limit = req?.query?.limit ? parseInt(req.query.limit) : 100;
    const page = req?.query?.page ? parseInt(req.query.page) : 1;
    const skip = (page - 1) * limit;
    const searchQuery = req.query.searchQuery ? req.query.searchQuery : "";

    // Define the pipeline to project necessary fields, apply sorting, pagination, and filtering
    const pipeline = [
      {
        $match: {
          $and: [
            {
              $or: [
                { TestName: { $regex: searchQuery, $options: "i" } },
                { Category: { $regex: searchQuery, $options: "i" } },
              ],
            },
            ...Object.entries(filter).map(([key, value]) => ({ [key]: value })),
          ],
        },
      },
      { $skip: skip },
      { $limit: limit },
      {
        $project: {
          _id: 1,
          email: 1,
          TestName: 1,
          Category: 1,
          rate: 1,
          discount: 1,
          finalPrice: 1,
          action: 1,
        },
      },
    ];

    // Pipeline for distinct categories
    const categoryPipeline = [
      {
        $group: {
          _id: "$Category",
        },
      },
      {
        $project: {
          _id: 0,
          Category: "$_id",
        },
      },
    ];

    // Execute the aggregate query
    const [test, distinctCategories, totalCount] = await Promise.all([
      dbUtils.aggregate(pipeline, DATABASE_COLLECTIONS.TEST), // Execute with the email filter
      dbUtils.aggregate(categoryPipeline, DATABASE_COLLECTIONS.TEST), // Execute only the distinct categories stage
      dbUtils.countDocuments(pipeline, DATABASE_COLLECTIONS.TEST),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    res.status(200).json({
      type: "Success",
      page,
      totalCount,
      totalPages,
      test,
      distinctCategories,
    });
  } catch (error) {
    console.error(`[TestController] Error occurred: ${error}`);
    res.status(500).json({ type: "Error", message: "Failed to fetch tests." });
  }
};

module.exports.updateTestCategory = async (req, res) => {
  try {
    // Extract category and fields from the request body
    const { category, discount, ...updateFields } = req.body;

    // Validate inputs
    if (!category) {
      return res.status(400).json({
        type: "Error",
        message: "Category is required.",
      });
    }

    // Fetch tests matching the category
    const tests = await dbUtils.findMany(
      {
        email: req.decodedToken.email,
        Category: category,
      },
      DATABASE_COLLECTIONS.TEST
    );

    if (!tests.length) {
      return res.status(404).json({
        type: "Error",
        message: "No tests found for the provided category.",
      });
    }

    // Prepare bulk updates for each test
    const bulkUpdates = tests.map((test) => {
      const rate = test.rate;
      const finalPrice = rate - (rate * (discount || 0)) / 100;

      return {
        updateOne: {
          filter: { _id: test._id },
          update: {
            $set: {
              discount,
              finalPrice,
              ...updateFields, // Include additional fields from req.body
            },
          },
        },
      };
    });

    // Execute bulk update
    const updateResult = await dbUtils.bulkWrite(
      bulkUpdates,
      DATABASE_COLLECTIONS.TEST
    );

    res.status(200).json({
      type: "Success",
      message: "Tests updated successfully",
      updateResult,
    });
  } catch (error) {
    console.error(
      `[updateTestCategory] Error occurred while updating tests: ${error}`
    );
    res.status(500).json({
      type: "Error",
      message: "Failed to update tests.",
    });
  }
};


module.exports.getAllDistinctCategories = async (req, res) => {
  try {
    const email = req.decodedToken.email;
    // Define the pipeline to get distinct categories
    const pipeline = [
      {
        $match: { email: email },
      },
      {
        $group: {
          _id: "$Category", // Group by Category field
        },
      },
      {
        $project: {
          _id: 0, // Exclude the _id field in the response
          Category: "$_id", // Rename _id to Category
        },
      },
    ];

    // Execute the aggregation pipeline
    const distinctCategories = await dbUtils.aggregate(
      pipeline,
      DATABASE_COLLECTIONS.TEST
    );

    // Respond with the distinct categories
    res.status(200).json({
      type: "Success",
      distinctCategories,
    });
  } catch (error) {
    console.error(`[getAllDistinctCategories] Error: ${error}`);
    res.status(500).json({
      type: "Error",
      message: "Failed to fetch distinct categories.",
    });
  }
};
