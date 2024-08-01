const dbUtils = require("../utils/db_operations");
const commonUtils = require("../utils/common");
const configs = require("../configs.json");
const s3Utils = require("../utils/s3");
const template = require("../utils/template");
const emailService = require("../services/email_service");
const DATABASE_COLLECTIONS = configs.CONSTANTS.DATABASE_COLLECTIONS;
const DATABASE = configs.CONSTANTS;

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
            { property: "paymentId", optional: true }
            

        ];

        const payload = await commonUtils.validateRequestBody(req.body, requiredFields);

        const { testName , preferredDoctorName , centerEmail, rate ,timeSlot, paymentId } = payload;

        const newBooking = {
            patientName : fullname,
            phoneNumber : phonenumber,
            patientEmail : email, 
            centerEmail ,
            testName ,
            preferredDoctorName ,
            rate ,
            timeSlot ,
            paymentId

        }

        
        const Booking = await dbUtils.create(newBooking, DATABASE_COLLECTIONS.BOOKING);
        
        const newOrder = {
          bookingId: Booking._id,
          paymentId: Booking.paymentId,
          centerEmail: centerEmail,
          patientName: fullname,
          patientEmail: email,
          testName: testName
        }

        const order = await dbUtils.create(newOrder, DATABASE_COLLECTIONS.ORDERED_TEST);

        const dateObj = new Date(timeSlot);
        const date = dateObj.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
        const time = dateObj.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit'
        });

        const emailSubject = "DiagnoWeb Booking Confirmation";
        const content = `
          Dear ${fullname},
    
          Thank you for booking your test with DiagnoWeb. Here are the details of your booking:
    
          Test Name: ${testName}
          Preferred Doctor: ${preferredDoctorName}
          Center Email: ${centerEmail}
          Rate: ${rate}
    
          Date: ${date}
          Time: ${time}
    
          Please make sure to be at the venue at least 15 minutes before your scheduled time.
    
          If you have any questions, feel free to contact us at [Contact Information].
    
          Best regards,
          DiagnoWeb Team
        `;
    
        const html = template.sendDynamicEmailTemplate(emailSubject, fullname, content);
    
        await emailService.sendMail(email, emailSubject, null, html);
    


        res.status(200).json({ type: "success" ,  Booking , order });

    }
    catch(error){
        console.error(`[BookingController] Error occurred: ${error}`);
        res.status(500).json({ type: 'Error', message: "Failed to create booking." });
    }
};

module.exports.getBooking = async (req, res) => {
  try {
    const email = req.decodedToken.email;

    // Extract filter, sort, limit, and page from the request query
    const filter = req?.query?.filter ? JSON.parse(req.query.filter) : {};
    const sort = req?.query?.sort ? JSON.parse(req.query.sort) : { createdAt: -1 };
    const limit = req?.query?.limit ? parseInt(req.query.limit) : 3;
    const page = req?.query?.page ? parseInt(req.query.page) : 1;
    const skip = (page - 1) * limit;

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Define the pipeline to project necessary fields, apply sorting, pagination, and filtering
    const pipeline = [
      {
        $match: { ...filter, centerEmail: email }
      },
      {
        $lookup: {
          from: 'payments', // Replace with your payment collection name
          localField: 'paymentId',
          foreignField: 'razorpay_payment_id',
          as: 'paymentDetails'
        }
      },
      {
        $facet: {
          totalCount: [{ $count: "total" }],
          data: [
            { $sort: sort },
            { $skip: skip },
            { $limit: limit }
          ],
          statusCounts: [
            {
              $group: {
                _id: "$action",
                count: { $sum: 1 }
              }
            }
          ]
        }
      },
      {
        $project: {
          totalCount: { $arrayElemAt: ["$totalCount.total", 0] },
          bookingData: "$data",
          statusCounts: {
            $arrayToObject: {
              $map: {
                input: "$statusCounts",
                as: "status",
                in: { k: "$$status._id", v: "$$status.count" }
              }
            }
          }
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
          bookingData: [],
          statusCounts: {
            ACCEPTED: 0,
            REJECTED: 0,
            PENDING: 0
          }
        }
      ];
    }

    const totalDocumentCount = result[0].totalCount;
    const totalPages = Math.ceil(totalDocumentCount / limit);

    const monthlyBookingCountPipeline = [
      {
        $match: {
          centerEmail: email,
          createdAt: {
            $gte: startOfMonth,
            $lte: endOfMonth
          }
        }
      },
      {
        $count: "monthlyCount"
      }
    ];

    const monthlyCountResult = await dbUtils.aggregate(monthlyBookingCountPipeline, DATABASE_COLLECTIONS.BOOKING);
    const monthlyBookingCount = monthlyCountResult.length ? monthlyCountResult[0].monthlyCount : 0;

    // Send Success response with bookings data
    res.status(200).json({
      type: 'Success',
      page,
      limit,
      totalPages,
      monthlyBookingCount,
      totalCount: result[0].totalCount,
      statusCounts: result[0].statusCounts,
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

        const files = req.files ? req.files.files : [];

        let uploadedFiles = [];
        if (files.length > 0) {
            // Upload files and get URLs
            uploadedFiles = await Promise.all(
                files.map(async (file, index) => {
                    const fileName = `${bookingId}-file-${index + 1}.${file.originalname.split('.').pop()}`;
                    console.log(`Uploading file ${fileName} to S3...`);
                    const fileUrl = await s3Utils.uploadFileToS3(file, fileName, process.env.AWS_BUCKET_NAME);
                    return fileUrl.Location;
                })
            );
        }

        // Add the uploaded file URLs to the updates if there are any
        if (uploadedFiles.length > 0) {
            updates.report = uploadedFiles;
        }

        const booking = await dbUtils.findOne(
          { _id: bookingId },
          DATABASE_COLLECTIONS.BOOKING
        )

        // Update the booking record in the database
        const result = await dbUtils.updateOne({ _id: bookingId }, updates, DATABASE_COLLECTIONS.BOOKING);

        if(updates.action === "VISITED") {

          const ordered = await dbUtils.updateOne({ bookingId: bookingId }, { $set: { status: DATABASE.STATUS.PREVIOUS  } }, DATABASE_COLLECTIONS.ORDERED_TEST);

          const dateObj = new Date(booking.timeSlot);
          const date = dateObj.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          });
          const time = dateObj.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
          });

          const emailSubject = "DiagnoWeb Visited Confirmation";

          const html = template.sendBookingConfirmationEmailTemplate(emailSubject, booking, date, time);
      
          await emailService.sendMail(booking.patientEmail, emailSubject, null, html);

          

          console.log(`Ordered tests updated: ${ordered}`);

        }
        

        res.status(200).json({ type: 'Success', message: "Booking updated successfully.", result});
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
