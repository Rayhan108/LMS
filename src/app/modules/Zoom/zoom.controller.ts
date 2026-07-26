import crypto from "crypto";
import { Request, Response } from "express";
import httpStatus from "http-status";
import config from "../../config";
import catchAsync from "../../utils/catchAsync";
import { AttendanceModel } from "../Attendence/attendence.model";
import { ClassModel } from "../Class/class.model";
import { UserModel } from "../User/user.model";
import { ZoomServices } from "./zoom.services";

/**
 * zoom webhook handler (for attendance and status updates)
 */

const handleZoomWebhook = catchAsync(async (req: Request, res: Response) => {
  const { event, payload } = req.body;

  console.log("Received Webhook Event:", event);
  console.log("-----------------------------------------");
  console.log("🚩 ZOOM_WEBHOOK_RECEIVED:", event);
  console.log("🔍 FULL_PAYLOAD:", JSON.stringify(req.body, null, 2));
  // if (event === 'endpoint.url_validation') {
  //   const plainToken = payload.plainToken;
  //   // const secretToken = config.zoom_webhook_secret;
  //   const secretToken = process.env.ZOOM_WEBHOOK_SECRET;

  //   if (!secretToken) {
  //     return res.status(httpStatus.INTERNAL_SERVER_ERROR).send("Secret missing");
  //   }

  //   const hash = crypto
  //     .createHmac('sha256', secretToken)
  //     .update(plainToken)
  //     .digest('hex');

  //   return res.status(200).json({
  //     plainToken: plainToken,
  //     signature: hash,
  //   });
  // }
  if (event === "endpoint.url_validation") {
    const plainToken = payload?.plainToken;
    const secretToken = process.env.ZOOM_WEBHOOK_SECRET;

    if (!plainToken) {
      return res.status(httpStatus.BAD_REQUEST).json({
        message: "plainToken missing",
      });
    }

    if (!secretToken) {
      return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
        message: "Zoom webhook secret missing",
      });
    }

    const encryptedToken = crypto
      .createHmac("sha256", secretToken)
      .update(plainToken)
      .digest("hex");

    return res.status(200).json({
      plainToken,
      encryptedToken,
    });
  }

  if (!payload || !payload.object) {
      console.log("⚠️ WEBHOOK_WARNING: No payload object found");
    return res.status(200).send("No action needed for this event structure.");
  }

  const meetingId = payload.object.id?.toString();

  if (event === "meeting.participant_joined" && meetingId) {
    console.log("=========================================");
    console.log("🟢 EVENT: A Participant JOINED the meeting!");
    const participant = payload.object.participant;
    console.log("👤 Participant Details:", participant);
    
    const studentEmail = participant.email || participant.user_email;
    const studentName = participant.user_name;
    const joinTime = new Date(participant.join_time);
    
    console.log(`📧 Looking for student with email: ${studentEmail || 'undefined'} or name: ${studentName}`);
    console.log(`🆔 Zoom Meeting ID: ${meetingId}`);

    let student = null;
    const targetClass = await ClassModel.findOne({ zoomMeetingId: meetingId });

    if (studentEmail) {
      student = await UserModel.findOne({ email: studentEmail, role: "student" });
    } else if (studentName) {
      console.log("⚠️ Email not provided by Zoom. Falling back to Name matching...");
      // Try exact match first
      student = await UserModel.findOne({ fullName: studentName, role: "student" });
      if (!student) {
        // Try case-insensitive regex match
        student = await UserModel.findOne({ 
          fullName: { $regex: new RegExp(`^${studentName}$`, 'i') }, 
          role: "student" 
        });
      }
    }

    if (!targetClass) console.log("❌ DB_ERROR: No class found matching this Zoom Meeting ID.");
    if (!student) console.log(`❌ DB_ERROR: No student found with email ${studentEmail} or name ${studentName}.`);

    if (targetClass && student) {
        console.log("✅ SUCCESS: Found Class and Student in DB. Proceeding to mark attendance...");
        const classDateStr = targetClass.date.toISOString().split("T")[0];
        const scheduledStartTime = new Date(`${classDateStr} ${targetClass.time}`);
        const bufferThreshold = new Date(scheduledStartTime.getTime() + 15 * 60000);

        let attendanceStatus: "on time" | "late" = "on time";
        if (joinTime > bufferThreshold) {
          attendanceStatus = "late";
        }
        
        console.log(`🕒 Scheduled Time: ${scheduledStartTime.toLocaleTimeString()}, Join Time: ${joinTime.toLocaleTimeString()}`);
        console.log(`📌 Marking Attendance Status as: ${attendanceStatus.toUpperCase()}`);

        await AttendanceModel.findOneAndUpdate(
          { class: targetClass._id, student: student._id },
          {
            class: targetClass._id,
            course: targetClass.course,
            student: student._id,
            status: attendanceStatus,
            date: classDateStr,
            time: joinTime.toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
              hour12: true,
            }),
            markedBy: targetClass.createdBy,
          },
          { upsert: true, new: true },
        );
        console.log("🎉 Attendance successfully saved to database!");
      }
    }
    console.log("=========================================");
  }

  if (event === "meeting.participant_left" && meetingId) {
    console.log("=========================================");
    console.log("🔴 EVENT: A Participant LEFT the meeting!");
    const participant = payload.object.participant;
    console.log(`👤 Name: ${participant.user_name || "Unknown"}`);
    console.log(`📧 Email: ${participant.email || participant.user_email || "Unknown"}`);
    console.log(`🕒 Leave Time: ${new Date(participant.leave_time).toLocaleTimeString()}`);
    console.log("=========================================");
  }

  if (meetingId) {
    if (event === "meeting.started") {
      console.log(`🚀 Meeting STARTED (ID: ${meetingId})`);
      await ClassModel.findOneAndUpdate(
        { zoomMeetingId: meetingId },
        { zoomStatus: "started" },
      );
    }
    if (event === "meeting.ended") {
      console.log(`🛑 Meeting ENDED (ID: ${meetingId})`);
      await ClassModel.findOneAndUpdate(
        { zoomMeetingId: meetingId },
        { zoomStatus: "ended" },
      );
    }
    if (event === "recording.completed") {
      console.log(`🎥 Recording COMPLETED (ID: ${meetingId})`);
      const playUrl = payload.object.share_url;
      await ClassModel.findOneAndUpdate(
        { zoomMeetingId: meetingId },
        { recordingLink: playUrl, zoomStatus: "recorded" },
      );
    }
  }

  res.status(200).send();
});

/**
 * zoom oAUTH connection
 */
const zoomCallback = catchAsync(async (req: Request, res: Response) => {
  const { code, state } = req.query; // state = teacher userId

  if (!code || !state) {
    return res
      .status(400)
      .send("Invalid callback: missing code or teacher ID.");
  }

  await ZoomServices.exchangeCodeForToken(state as string, code as string);

  res.send(`
    <html>
      <head>
        <title>Zoom Connected</title>
        <style>
          body { display: flex; justify-content: center; align-items: center; height: 100vh; font-family: sans-serif; text-align: center; }
          h1 { color: #2D8CFF; }
          p { color: #4CAF50; font-size: 18px; }
        </style>
        <script>
       
          setTimeout(function() {
            window.location.href = "educology://zoom-success"; 
          }, 2000);
        </script>
      </head>
      <body>
        <div>
          <h1>Educology Zoom Integration</h1>
          <p>Success! Your Zoom account is now connected.</p>
          <p>Redirecting you back to the app...</p>
          <br>
          <a href="educology://zoom-success" style="text-decoration: none; color: blue;">Click here if you are not redirected automatically</a>
        </div>
      </body>
    </html>
  `);
});

export const ZoomControllers = {
  handleZoomWebhook,
  zoomCallback,
};
