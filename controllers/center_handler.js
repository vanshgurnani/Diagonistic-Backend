const dbUtils = require("../utils/db_operations");
const commonUtils = require("../utils/common");
const configs = require("../configs.json");
const s3Utils = require("../utils/s3");
const emailService = require("../services/email_service");
const jwtService = require("../services/jwt");
const DATABASE_COLLECTIONS = configs.CONSTANTS.DATABASE_COLLECTIONS;

module.exports.sendCenterOtp = async (req, res) => {
  try {
      const { email } = req.body;

      // Check if the center email is provided
      if (!email) {
          return res.status(400).json({ error: "Center email is required." });
      }

      // Generate OTP
      const otpNumber = commonUtils.generateRandomOtp(configs.OTP_LENGTH);

      // Save OTP to the database or any other storage
      await dbUtils.create({ email: email, otp: otpNumber }, DATABASE_COLLECTIONS.CENTER_OTPS);

      // Send OTP via email (You can customize this according to your requirement)
      const emailSubject = "OTP for Center Registration";
      const emailText = `Your OTP for registration is: ${otpNumber}`;
      const emailHtml = `<p>Your OTP for registration is: <strong>${otpNumber}</strong></p>`;

      await emailService.sendMail(email, emailSubject, emailText, emailHtml);

      res.status(200).json({ message: "OTP sent successfully." });
  } catch (error) {
      console.error(`[sendCenterOtp] Error occurred: ${error}`);
      res.status(500).json({ error: "Failed to send OTP." });
  }
};

module.exports.createCenter = async(req,res) =>{
    try{       
        
        const requiredFields = [
            { property: "name", optional: true },
            { property: "contact", optional: true },
            { property: "email", optional: true },
            { property: "password", optional: true },
            { property: "firstName", optional: true },
            { property: "lastName", optional: true },
            { property: "ownerContact", optional: true },
            { property: "centerGST", optional: false },
            { property: "address", optional: false },
            { property: "staffNumber", optional: false },
            { property: "otp", optional: false }


        ];

        const payload = await commonUtils.validateRequestBody(req.body, requiredFields);

        const { name,
            contact,
            email, 
            password,
            firstName,
            lastName,
            ownerContact,
            centerGST,
            address,
            staffNumber,
            otp
        } = payload;

        const pipline = [
          {
              $match: {
                  email: email,
              },
          },
          {
              $sort: { createdAt: -1 },
          },
          {
              $limit: 1,
          },
      ];

      const storedOtp = await dbUtils.aggregate(
        pipline,
        DATABASE_COLLECTIONS.CENTER_OTPS
    );


        console.log(storedOtp);

        console.log(storedOtp[0].otp);

        console.log(otp);

        if (!storedOtp) {
            return res.status(400).json({ error: "OTP not found or expired." });
        }

        if (storedOtp[0].otp !== otp) {
            return res.status(400).json({ error: "Invalid OTP." });
        }

        const uploadedFiles = {
            addressProof: '',
            shopAct: '',
            pcpndt: '',
            iso: '',
            nabl: '',
            nabh: '',
            centerImg: ''
        };

        if (req.files) {
            for (const [fieldName, files] of Object.entries(req.files)) {
                for (const file of files) {
                    const fileName = `${fieldName}-${Date.now()}-${file.originalname}`;
                    const fileUrl = await s3Utils.uploadFileToS3(file, fileName, process.env.AWS_BUCKET_NAME);
                    uploadedFiles[fieldName] = fileUrl.Location;
                }
            }
        }

        const newCenter = {
            name,
            contact,
            email, 
            password,
            firstName,
            lastName,
            ownerContact,
            centerGST,
            address,
            staffNumber,
            addressProof: uploadedFiles.addressProof,
            shopAct: uploadedFiles.shopAct,
            pcpndt: uploadedFiles.pcpndt,
            iso: uploadedFiles.iso,
            nabl: uploadedFiles.nabl,
            nabh: uploadedFiles.nabh,
            centerImg: uploadedFiles.centerImg

        }

        const center = await dbUtils.create(newCenter, DATABASE_COLLECTIONS.CENTER);

        const newCenterVerify = {
          centerName: name,
          centerContact: contact,
          ownerFirstName: firstName,
          ownerLastName: lastName,
          ownerContact: ownerContact,
          ownerEmail: email
        }

        const centerVerfiy = await dbUtils.create(newCenterVerify, DATABASE_COLLECTIONS.CENTER_VERIFY);

        res.status(200).json({ type: "success" ,  center , centerVerfiy });
    }
    catch(error){
        console.error(`[CenterController] Error occurred: ${error}`);
        res.status(500).json({ type: 'Error', message: "Failed to create center." });
    }
};

module.exports.getCenter = async (req, res) => {
    try {
      // Extract filter, sort, limit, and page from the request query
      const filter = req?.query?.filter ? req.query.filter : {};
      const sort = req?.query?.sort ? JSON.parse(req.query.sort) : { createdAt: -1 };
      const limit = req?.query?.limit ? parseInt(req.query.limit) : 5;
      const page = req?.query?.page ? parseInt(req.query.page) : 1;
      const skip = (page - 1) * limit;
  
      // Define projection to include only necessary fields
      const projection = {
        password: 0
      };
  
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
              { $limit: limit },
              { $project: projection } // Projection step
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
      let result = await dbUtils.aggregate(pipeline, DATABASE_COLLECTIONS.CENTER);
  
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

module.exports.loginHandler = async (req, res) => {
  try {
      let requiredFields = [
          { property: "email", optional: true },
          { property: "password", optional: true },
      ];

      const { email , password } = await commonUtils.validateRequestBody(
          req.body,
          requiredFields
      );

      const user = await dbUtils.findOne(
          { ownerEmail: email },
          DATABASE_COLLECTIONS.CENTER
      );

      console.log("login user data ", user);

      let accessToken = null;
      if (password === user?.password) {
          accessToken = jwtService.generateToken({
              email: user.email,
              firstname: user.firstName,
              lastname: user.lastName,
              phonenumber: user.ownerContact
          });

          res.status(200).json({
              message: "Login Successfully!",
              accessToken: accessToken,
          });
      } else {
          res.status(403).json({
              error: "Invalid password.",
          });
      }
  } catch (error) {
      console.log(`[centerLoginHandler] Error occurred: ${error}`);
      res.status(500).json({
          error: error.message,
      });
  }
};