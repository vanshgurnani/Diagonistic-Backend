module.exports.sendDynamicEmailTemplate = (title,username,content) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verification Email</title>
</head>
<body style="background-color: #ffffff; font-family: Arial, sans-serif; font-size: 16px; line-height: 1.4; color: #333333; margin: 0; padding: 0;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px; text-align: center;">
        <h2 style="background-color: #FAD02E; color: black; padding: 10px; border-radius: 5px; max-width: 200px; margin: 15px auto;">Diagnostic</h2>
        <div style="font-size: 18px; font-weight: bold; margin-bottom: 20px;">${title}</div>
        <div style="font-size: 16px; margin-bottom: 20px;">
            <p>Dear ${username},</p>
            <p>Thank you for registering with Diagnostic.</p>
            <p>${content}</p>
        </div>
        <div style="font-size: 14px; color: #999999; margin-top: 20px;">
            If you have any questions or need assistance, please feel free to reach out to Diagnostic <a href="mailto:contact@blackcheriemedia.com">here</a>. We are here to help!
        </div>
    </div>
</body>
</html>

`;

module.exports.sendBookingConfirmationEmailTemplate = (title, booking , date , time) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
</head>
<body style="background-color: #ffffff; font-family: Arial, sans-serif; font-size: 16px; line-height: 1.4; color: #333333; margin: 0; padding: 0;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px; text-align: center;">
        <h2 style="background-color: #FAD02E; color: black; padding: 10px; border-radius: 5px; max-width: 200px; margin: 15px auto;">Diagnostic</h2>
        <div style="font-size: 18px; font-weight: bold; margin-bottom: 20px;">${title}</div>
        <div style="font-size: 16px; margin-bottom: 20px;">
            <p>Dear ${booking.patientName},</p>
            <p>Thank you for visiting DiagnoWeb for your recent test. We hope that your experience was pleasant and that everything went smoothly.</p>
            <p>Here are the details of your visit:</p>
            <p><strong>Patient Name:</strong> ${booking.patientName}</p>
            <p><strong>Test Name:</strong> ${booking.testName}</p>
            <p><strong>Preferred Doctor:</strong> ${booking.preferredDoctorName}</p>
            <p><strong>Date:</strong> ${date}</p>
            <p><strong>Time:</strong> ${time}</p>
            <p>We truly appreciate your trust in us for your healthcare needs. If you have any feedback or need further assistance, please do not hesitate to reach out to us at <a href="mailto:contact@blackcheriemedia.com">contact@blackcheriemedia.com</a>. Your feedback is valuable in helping us improve our services.</p>
            <p>Thank you once again for choosing DiagnoWeb. We look forward to serving you in the future.</p>
        </div>
        <div style="font-size: 14px; color: #999999; margin-top: 20px;">
            Best regards,<br>
            DiagnoWeb Team
        </div>
    </div>
</body>
</html>
`;

module.exports.sendBookingCancellationEmailTemplate = (title, booking, date, time) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
</head>
<body style="background-color: #ffffff; font-family: Arial, sans-serif; font-size: 16px; line-height: 1.4; color: #333333; margin: 0; padding: 0;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px; text-align: center;">
        <h2 style="background-color: #FAD02E; color: black; padding: 10px; border-radius: 5px; max-width: 200px; margin: 15px auto;">Diagnostic</h2>
        <div style="font-size: 18px; font-weight: bold; margin-bottom: 20px;">${title}</div>
        <div style="font-size: 16px; margin-bottom: 20px;">
            <p>Dear ${booking.patientName},</p>
            <p>We regret to inform you that your recent test appointment has been canceled. Below are the details of the canceled booking:</p>
            <p><strong>Patient Name:</strong> ${booking.patientName}</p>
            <p><strong>Test Name:</strong> ${booking.testName}</p>
            <p><strong>Preferred Doctor:</strong> ${booking.preferredDoctorName}</p>
            <p><strong>Original Appointment Date:</strong> ${date}</p>
            <p><strong>Original Appointment Time:</strong> ${time}</p>
            <p>We understand that cancellations can be inconvenient, and we apologize for any disruption this may have caused. If you'd like to reschedule or if you have any concerns, please don't hesitate to reach out to us at <a href="mailto:contact@blackcheriemedia.com">contact@blackcheriemedia.com</a>.</p>
            <p>Thank you for your understanding, and we hope to serve you in the future.</p>
        </div>
        <div style="font-size: 14px; color: #999999; margin-top: 20px;">
            Best regards,<br>
            DiagnoWeb Team
        </div>
    </div>
</body>
</html>
`;
