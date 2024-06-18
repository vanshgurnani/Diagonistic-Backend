const dbUtils = require("../utils/db_operations");
const commonUtils = require("../utils/common");
const configs = require("../configs.json");
const s3Utils = require("../utils/s3");
const DATABASE_COLLECTIONS = configs.CONSTANTS.DATABASE_COLLECTIONS;

module.exports.createBooking =  async(req,res) =>{
    try{
        const firstname = req.decodedToken.firstname;
        const lastname = req.decodedToken.lastname;
        const fullname = firstname + ' ' + lastname;
        const phonenumber = req.decodedToken.phonenumber;
        const email = req.decodedToken.email;

        console.log(fullname , phonenumber);

        const requiredFields = [
            { property: "centerEmail", optional: true },
            { property: "testName", optional: true },
            { property: "preferredDoctorName", optional: true },
            { property: "rate", optional: true },
            { property: "timeSlot", optional: true },
            

        ];

        const payload = await commonUtils.validateRequestBody(req.body, requiredFields);

        const { testName , preferredDoctorName , centerEmail, rate ,timeSlot } = payload;

        const newBooking = {
            patientName : fullname,
            phoneNumber : phonenumber,
            patientEmail : email, 
            centerEmail ,
            testName ,
            preferredDoctorName ,
            rate ,
            timeSlot

        }

        const newOrder = {
          centerEmail: centerEmail,
          patientName: fullname,
          patientEmail: email,
          testName: testName
        }

        const Booking = await dbUtils.create(newBooking, DATABASE_COLLECTIONS.BOOKING);

        const order = await dbUtils.create(newOrder, DATABASE_COLLECTIONS.ORDERED_TEST);

        res.status(200).json({ type: "success" ,  Booking , order });

    }
    catch(error){
        console.error(`[BookingController] Error occurred: ${error}`);
        res.status(500).json({ type: 'Error', message: "Failed to create booking." });
    }
};

module.exports.getBooking = async (req, res) => {
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
            bookingData: "$data"
          }
        }
      ];
  
      // Execute the aggregate query
      let result = await dbUtils.aggregate(pipeline, DATABASE_COLLECTIONS.BOOKING);
  
      // Check if any bookings are found
      if (!result || !result.length) {
        result = [
          {
            totalCount: 0,
            bookingData: []
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
        bookings: result[0].bookingData
      });
    } catch (error) {
      console.error(`[getBooking] Error occurred: ${error}`);
      res.status(500).json({ type: 'Error', message: "Internal server error." });
    }
};

module.exports.updateBooking = async (req, res) => {
    try {
        const bookingId = req.body.id; // Get booking ID from request parameters
        const updates = req.body; // Get updates from request body

        console.log(bookingId);

        // Update the booking record in the database
        const result = await dbUtils.updateOne({ _id: bookingId }, updates, DATABASE_COLLECTIONS.BOOKING);
        

        res.status(200).json({ type: 'Success', message: "Booking updated successfully." });
    } catch (error) {
        console.error(`[updateBooking] Error occurred: ${error}`);
        res.status(500).json({ type: 'Error', message: "Failed to update booking." });
    }
};

module.exports.deleteBooking = async (req, res) => {
    try {
        const bookingId = req.params.id; // Get booking ID from request parameters

        // Delete the booking record from the database
        const result = await dbUtils.deleteOne({ _id: bookingId }, DATABASE_COLLECTIONS.BOOKING);

        if (result && result.deletedCount > 0) {
            // If at least one document was deleted, send success response
            res.status(200).json({ type: 'Success', message: "Booking deleted successfully." });
        } else {
            // If no document was deleted, it means booking not found
            res.status(404).json({ type: 'Error', message: "Booking not found." });
        }
    } catch (error) {
        console.error(`[deleteBooking] Error occurred: ${error}`);
        res.status(500).json({ type: 'Error', message: "Failed to delete booking." });
    }
};

module.exports.uploadFilesAndUpdateBooking = async (req, res) => {
  try {
    const email = req.body.email;

    if (!email) {
      return res.status(400).json({ message: 'Email not provided!' });
    }

    const files = req.files.files;

    if (!files || files.length === 0) {
      return res.status(400).json({ message: 'No files provided!' });
    }

    const uploadedFiles = [];

    // Upload files and get file URLs
    for (let i = 0; i < files.length; i++) {
      const fileName = `${email}-file-${i + 1}.${files[i].originalname.split('.').pop()}`;
      console.log(`Uploading file ${fileName} to S3...`);
      const fileUrl = await s3Utils.uploadFileToS3(files[i], fileName, process.env.AWS_BUCKET_NAME);
      uploadedFiles.push(fileUrl.Location);
    }

    const filter = { patientEmail : email }; 

    const find = await dbUtils.findOne({patientEmail : email} , DATABASE_COLLECTIONS.BOOKING);

    console.log(find);

    const update = { $push: { report: { $each: uploadedFiles } } };

    const updatedBooking = await dbUtils.updateOne(filter, update, DATABASE_COLLECTIONS.BOOKING);

    if (!updatedBooking) {
      return res.status(404).json({ message: 'Booking not found!' });
    }

    res.status(200).json({ message: 'Files uploaded and booking updated successfully!', booking: updatedBooking });
  } catch (error) {
    console.error(`[uploadFilesAndUpdateBooking] Error occurred: ${error}`);
    res.status(400).json({ type: 'Error', message: error.message });
  }
};
