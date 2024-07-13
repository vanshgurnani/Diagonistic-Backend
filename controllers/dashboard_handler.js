const axios = require("axios");
const dbUtils = require("../utils/db_operations");
const configs = require("../configs.json");
const DATABASE_COLLECTIONS = configs.CONSTANTS.DATABASE_COLLECTIONS;

module.exports.suggestLocation = async (req, res) => {
    try {
        const API_KEY = process.env.GOOGLE_MAP_API_KEY;
        const query = req.body.search;

        const apiUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${query}&key=${API_KEY}`;

        const response = await axios.get(apiUrl);

        const places = response.data.results;

        console.error(`[suggestLocation] places: ${JSON.stringify(places)}`);

        res.status(200).json({
            places: places,
            count: places.length,
        });
    } catch (error) {
        console.error(`[suggestLocation] Error occurred: ${error.message}`);
        res.status(500).json({
            error: error.message,
        });
    }
};

module.exports.dashboardGet = async (req, res) => {
    try {
        // Using the new countDocuments method
        const patientCount = await dbUtils.countDocuments(
            { roles: configs.CONSTANTS.ROLES.PATIENT },
            DATABASE_COLLECTIONS.USERS
        );

        const centerCount = await dbUtils.countDocuments(
            {},
            DATABASE_COLLECTIONS.CENTER
        );

        res.status(200).json({
            message: "Dashboard data fetched successfully",
            totalPatients: patientCount,
            totalCenters: centerCount
        });
    } catch (error) {
        console.error(`[getDashboard] Error occurred: ${error.message}`);
        res.status(500).json({
            error: error.message,
        });
    }
};

module.exports.centerData = async (req, res) => {
    try{
        // Pagination parameters with defaults
        const limit = req.query.limit ? parseInt(req.query.limit) : 5;
        const page = req.query.page ? parseInt(req.query.page) : 1;
        const skip = (page - 1) * limit;


        // Define the pipeline to project necessary fields, apply sorting, pagination, and filtering
        const pipeline = [
            {
                $match: {}
            },
            {
                $skip: skip
            },
            {
                $limit: limit
            },
            {
                $sort: {
                    createdAt: -1
                }
            },
            {
                $lookup: {
                    from: "bookings",
                    localField: "email",
                    foreignField: "centerEmail",
                    as: "bookings"
                }
            },
            {
                $addFields: {
                    totalBookings: { $size: "$bookings" }
                }
            },
            {
                $lookup: {
                    from: "payments",
                    let: { bookings: "$bookings" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $in: ["$razorpay_payment_id", { $map: { input: "$$bookings", as: "booking", in: "$$booking.paymentId" } }]
                                }
                            }
                        },
                        {
                            $group: {
                                _id: null,
                                totalRevenue: { $sum: "$amount" }
                            }
                        }
                    ],
                    as: "revenue"
                }
            },
            {
                $addFields: {
                    totalRevenue: { $ifNull: [{ $arrayElemAt: ["$revenue.totalRevenue", 0] }, 0] }
                }
            },
            {
                $project: {
                    centerName: 1,
                    totalBookings: 1,
                    totalRevenue: 1
                }
            }
        ];

        // Execute the aggregate query
        let result = await dbUtils.aggregate(pipeline, DATABASE_COLLECTIONS.CENTER);

        const totalCount = result.length;

        // Send Success response with permissions data
        res.status(200).json({
            type: 'Success',
            page,
            limit,
            totalCount,
            data: result
        });
    } catch (error) {
        console.error(`[centerData] Error occurred: ${error.message}`);
        res.status(500).json({
            error: error.message,
        });
    }
}