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

      res.status(200).json({ message: "OTPs sent successfully." });
  } catch (error) {
      console.error(`[sendCenterOtp] Error occurred: ${error}`);
      res.status(500).json({ error: "Failed to send OTP." });
  }
};

module.exports.createCenter = async(req,res) =>{
    try{       
        
        const requiredFields = [
            { property: "centerName", optional: true },
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

        const { centerName,
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

        const existingCenter = await dbUtils.findOne({ email: email }, DATABASE_COLLECTIONS.CENTER);

        const existingPatient = await dbUtils.findOne({ email: email }, DATABASE_COLLECTIONS.USERS);

        if (existingCenter) {
            return res.status(400).json({type: "error", message: "This Email is already alloted a Center." });
        }

        if (existingPatient) {
            return res.status(400).json({type: "error", message: "This Email is already alloted a Patient and you are not authorized to create center." });
        }



        console.log(storedOtp);

        console.log(storedOtp[0].otp);

        console.log(otp);

        if (!storedOtp) {
            return res.status(400).json({type: "error" , message: "OTP not found or expired." });
        }

        if (storedOtp[0].otp !== otp) {
            return res.status(400).json({type: "error" , message: "Invalid OTP." });
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

        if (!uploadedFiles.centerImg) {
            uploadedFiles.centerImg = 'https://static.vecteezy.com/system/resources/thumbnails/017/177/954/small/round-medical-cross-symbol-on-transparent-background-free-png.png';
        }

        const newCenterVerify = {
            centerName: centerName,
            centerContact: contact,
            ownerFirstName: firstName,
            ownerLastName: lastName,
            ownerEmail: email,
            centerGST,
            address,
            staffNumber,
            addressProof: uploadedFiles.addressProof,
            shopAct: uploadedFiles.shopAct,
            pcpndt: uploadedFiles.pcpndt,
            iso: uploadedFiles.iso,
            nabl: uploadedFiles.nabl,
            nabh: uploadedFiles.nabh,
            centerImg: uploadedFiles.centerImg,
            isIso: !!uploadedFiles.iso,
            isNabl: !!uploadedFiles.nabl,
            isNabh: !!uploadedFiles.nabh
          }
  
        const centerVerfiy = await dbUtils.create(newCenterVerify, DATABASE_COLLECTIONS.CENTER_VERIFY);

        const newCenter = {
            centerName,
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
            centerImg: uploadedFiles.centerImg,
            isIso: !!uploadedFiles.iso,
            isNabl: !!uploadedFiles.nabl,
            isNabh: !!uploadedFiles.nabh

        }

        const center = await dbUtils.create(newCenter, DATABASE_COLLECTIONS.CENTER);

        res.status(200).json({ type: "success" ,  center , centerVerfiy});
    }
    catch(error){
        console.error(`[CenterController] Error occurred: ${error}`);
        res.status(500).json({ type: 'Error', message: "Failed to create center." });
    }
};

module.exports.getCenter = async (req, res) => {
    try {
        // Extract filter, sort, limit, page, testName, and address from the request query
        const filter = req?.query?.filter ? JSON.parse(req.query.filter) : {};
        const sort = req?.query?.sort ? JSON.parse(req.query.sort) : { createdAt: -1 };
        const limit = req?.query?.limit ? parseInt(req.query.limit) : 5;
        const page = req?.query?.page ? parseInt(req.query.page) : 1;
        const skip = (page - 1) * limit;
        const testName = req?.query?.testName || '';
        const address = req?.query?.address || '';

        // Add address filter if provided
        if (address) {
            filter.address = new RegExp(address, 'i');
        }

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
                $lookup: {
                    from: 'tests', // The collection name for tests
                    localField: 'email', // The local field to match
                    foreignField: 'email', // The foreign field to match
                    as: 'testDetails', // The name of the array field to add
                    pipeline: [
                        { $match: { TestName: new RegExp(testName, 'i') } },
                        { $sort: { createdAt: -1 } },
                        { $limit: limit },
                        {
                            $project: {
                                _id: 0,
                                TestName: 1,
                                finalPrice: 1
                            }
                        }
                    ]
                }
            },
            {
                $match: {
                    $or: [
                        { 'testDetails': { $ne: [] } }, // Centers with matching test details
                        { 'testDetails': { $exists: false } } // Centers without test details
                    ]
                }
            },
            { $sort: sort },
            { $project: projection }
        ];

        // Execute the aggregate query
        let result = await dbUtils.aggregate(pipeline, DATABASE_COLLECTIONS.CENTER);

        // If no testName provided, count all documents
        const countFilter = Object.keys(filter).length ? {
            ...filter,
            'testDetails.TestName': new RegExp(testName, 'i')
        } : {};
        
        // Count the total documents that match the filter
        const totalDocumentCount = await dbUtils.countDocuments(countFilter, DATABASE_COLLECTIONS.CENTER);

        // Send Success response with center data
        res.status(200).json({
            type: 'Success',
            page,
            limit,
            totalPages: Math.ceil(totalDocumentCount / limit),
            totalCount: totalDocumentCount,
            center: result
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
          { email: email },
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
          saved: req.body.saved
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

      if (result.modifiedCount === 0) {
          return res.status(404).json({ error: "Center not found or no changes made." });
      }

      res.status(200).json({ type: "success", message: "Center updated successfully." });
  } catch (error) {
      console.error(`[CenterController] Error occurred: ${error}`);
      res.status(500).json({ type: 'Error', message: "Failed to update center." });
  }
};

module.exports.updateProfile = async(req, res) => {
    try{
        const email = req.decodedToken.email;

        console.log(email);

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

  
        res.status(200).json({ type: "success", message: "Center updated successfully.", result });

    }
    catch (error) {
        console.error(`[updateCenterProfile] Error occurred: ${error}`);
        res.status(500).json({ type: 'Error', message: "Failed to update center." });
    }
};