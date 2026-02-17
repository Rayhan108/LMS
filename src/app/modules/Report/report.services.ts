import mongoose from "mongoose";

import { TaskModel } from "../Task/task.model";
import { SubmissionModel } from "../Submission/submission.model";
import { StudentProgressModel } from "./report.model";
import { AttendanceModel } from "../Attendence/attendence.model";
import { CourseModel } from "../Course/course.model";

const syncAndGetStudentProgress = async (
  courseId: string,
  studentId: string,
) => {
  // 1. Calculate Attendance Rate (%)
  const attendanceRecords = await AttendanceModel.find({
    course: courseId,
    student: studentId,
  });
  const totalDays = attendanceRecords.length;
  const presentDays = attendanceRecords.filter(
    (r) => r.status === "on time" || r.status === "late",
  ).length;
  const attendanceRate = totalDays > 0 ? (presentDays / totalDays) * 100 : 0;

  // 2. Fetch all tasks for the course
  const allTasks = await TaskModel.find({ course: courseId });
  const totalTasksCount = allTasks.length;

  // 3. Fetch all submissions by the student in this course
  const submissions = await SubmissionModel.find({
    course: courseId,
    student: studentId,
  });

  // 4. Calculate Average Grade as Percentage (%)
  const markedSubmissions = submissions.filter((s) => s.isMarked);
  const totalMarksObtained = markedSubmissions.reduce(
    (acc, curr) => acc + (curr.marks || 0),
    0,
  );
  // Calculating the mean of marks obtained (Assuming marks are entered out of 100)
  const avgGrade =
    markedSubmissions.length > 0
      ? totalMarksObtained / markedSubmissions.length
      : 0;

  // 5. Calculate Homework Submission Rate (%)
  const submittedTaskIds = submissions.map((s) => s.task.toString());
  const homeworkCompletedRate =
    totalTasksCount > 0 ? (submittedTaskIds.length / totalTasksCount) * 100 : 0;

  // 6. Calculate Overdue Tasks Rate (%)
  const now = new Date();
  const overdueTasksCount = allTasks.filter((task) => {
    const endDateTime = new Date(`${task.endDate}T${task.endTime}`);
    return now > endDateTime && !submittedTaskIds.includes(task._id.toString());
  }).length;
  const overdueRate =
    totalTasksCount > 0 ? (overdueTasksCount / totalTasksCount) * 100 : 0;

  // 7. Status Determination Logic (Priority: Critical > Attention > Behind > On Track)
  let status: "on track" | "behind" | "attention" | "critical" = "on track";

  // Critical if Attendance < 70% or Avg Grade < 40%
  if (attendanceRate < 70 || avgGrade < 40) {
    status = "critical";
  }
  // Attention if Attendance < 80% or 3+ overdue tasks
  else if (attendanceRate < 80 || overdueTasksCount >= 3) {
    status = "attention";
  }
  // Behind if Attendance < 90% or 1+ overdue task
  else if (attendanceRate < 90 || overdueTasksCount >= 1) {
    status = "behind";
  }

  // 8. Update or Create progress record in Database
  const progressData = {
    status,
    attendanceRate: parseFloat(attendanceRate.toFixed(2)),
    homeworkCompletedRate: parseFloat(homeworkCompletedRate.toFixed(2)),
    avgGrade: parseFloat(avgGrade.toFixed(2)), // Now stored as percentage
    overdueRate: parseFloat(overdueRate.toFixed(2)),
    totalTasks: totalTasksCount,
    completedTasks: submittedTaskIds.length,
  };

  const result = await StudentProgressModel.findOneAndUpdate(
    { course: courseId, student: studentId },
    progressData,
    { upsert: true, new: true },
  );

  return result;
};

const getCourseDashboardOverview = async (courseId: string) => {
  // 1. Fetch the course to get the total number of enrolled students
  const course = await CourseModel.findById(courseId);
  if (!course) {
    throw new Error("Course not found");
  }
  const totalEnrolled = course.students.length;

  // 2. Aggregate existing progress records from database
  const stats = await StudentProgressModel.aggregate([
    { $match: { course: new mongoose.Types.ObjectId(courseId) } },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 }
      }
    }
  ]);

  // 3. Extract counts for specific statuses
  const attention = stats.find(s => s._id === 'attention')?.count || 0;
  const behind = stats.find(s => s._id === 'behind')?.count || 0;
  const critical = stats.find(s => s._id === 'critical')?.count || 0;
  const recordedOnTrack = stats.find(s => s._id === 'on track')?.count || 0;

  // 4. Logic: Anyone not in 'attention', 'behind', or 'critical' is 'on track'
  // This ensures the summary matches the total student list in your UI
  const totalNonOnTrack = attention + behind + critical;
  const onTrack = totalEnrolled - totalNonOnTrack;

  return {
    onTrack: onTrack >= 0 ? onTrack : 0,
    attention,
    behind,
    critical,
    totalStudents: totalEnrolled
  };
};

const getStudentListWithStatus = async (courseId: string) => {
    // 1. Fetch the course and its enrolled students list
    const course = await CourseModel.findById(courseId).populate('students');
    
    if (!course) {
        throw new Error("Course not found");
    }

    // 2. Fetch all existing progress records for this course
    const progressRecords = await StudentProgressModel.find({ course: courseId });

    // 3. Map through all enrolled students to ensure everyone is included
    const fullStudentList = course.students.map((student: any) => {
        // Find if this student has a progress record
        const progress = progressRecords.find(
            (p) => p.student.toString() === student._id.toString()
        );

        // If progress exists, return it with student details
        if (progress) {
            return {
                _id: progress._id,
                student: {
                    _id: student._id,
                    fullName: student.fullName,
                    image: student.image,
                    contact: student.contact
                },
                status: progress.status,
                attendanceRate: progress.attendanceRate,
                avgGrade: progress.avgGrade,
                homeworkCompletedRate: progress.homeworkCompletedRate,
                overdueRate: progress.overdueRate,
                updatedAt: progress.updatedAt
            };
        }

        // If no progress record exists yet, return default "on track" status with 0 values
        return {
            student: {
                _id: student._id,
                fullName: student.fullName,
                image: student.image,
                contact: student.contact
            },
            status: 'on track',
            attendanceRate: 0,
            avgGrade: 0,
            homeworkCompletedRate: 0,
            overdueRate: 0,
            message: "No activity recorded yet"
        };
    });

    return fullStudentList;
};


const getOverallCourseAcademicStats = async (courseId: string) => {
  const course = await CourseModel.findById(courseId);
  if (!course) throw new Error("Course not found");

  const totalStudents = course.students.length;
  if (totalStudents === 0) {
    return { attendanceRate: 0, homeworkRate: 0, avgGrade: 0, overdueRate: 0, totalEnrolled: 0 };
  }

  // 1. Overall Attendance Rate for the whole class
  const attendanceStats = await AttendanceModel.aggregate([
    { $match: { course: new mongoose.Types.ObjectId(courseId) } },
    {
      $group: {
        _id: null,
        totalRecords: { $sum: 1 },
        presentCount: {
          $sum: { $cond: [{ $in: ["$status", ["on time", "late"]] }, 1, 0] }
        }
      }
    }
  ]);
  const attendanceRate = attendanceStats.length > 0 
    ? (attendanceStats[0].presentCount / attendanceStats[0].totalRecords) * 100 
    : 0;

  // 2. Total Tasks and Submissions data
  const allTasks = await TaskModel.find({ course: courseId });
  const totalTasksCount = allTasks.length;
  const potentialSubmissions = totalTasksCount * totalStudents;

  const allSubmissions = await SubmissionModel.find({ course: courseId });
  
  // 3. Overall Homework Submission Rate
  const homeworkRate = potentialSubmissions > 0 
    ? (allSubmissions.length / potentialSubmissions) * 100 
    : 0;

  // 4. Overall Average Grade
  const markedSubmissions = allSubmissions.filter(s => s.isMarked);
  const totalMarks = markedSubmissions.reduce((acc, curr) => acc + (curr.marks || 0), 0);
  const avgGrade = markedSubmissions.length > 0 
    ? (totalMarks / markedSubmissions.length) 
    : 0;

  // 5. Overall Overdue Rate
  const now = new Date();
  let totalOverdueCount = 0;

  allTasks.forEach(task => {
    const endDateTime = new Date(`${task.endDate}T${task.endTime}`);
    if (now > endDateTime) {
      // Find students who did NOT submit this specific task
      const submissionsForThisTask = allSubmissions.filter(
        s => s.task.toString() === task._id.toString()
      ).length;
      totalOverdueCount += (totalStudents - submissionsForThisTask);
    }
  });

  const overdueRate = potentialSubmissions > 0 
    ? (totalOverdueCount / potentialSubmissions) * 100 
    : 0;

  return {
    totalEnrolled: totalStudents,
    attendanceRate: parseFloat(attendanceRate.toFixed(2)),
    homeworkRate: parseFloat(homeworkRate.toFixed(2)),
    avgGrade: parseFloat(avgGrade.toFixed(2)),
    overdueRate: parseFloat(overdueRate.toFixed(2))
  };
};

const getDetailedTabularReport = async (courseId: string, searchTerm: string = '') => {
  // 1. Fetch Course and filter students by search name if provided
  const course = await CourseModel.findById(courseId).populate({
    path: 'students',
    match: searchTerm ? { fullName: { $regex: searchTerm, $options: 'i' } } : {},
    select: 'fullName image contact'
  });

  if (!course) throw new Error("Course not found");

  // 2. Fetch all metadata for calculations
  const allTasks = await TaskModel.find({ course: courseId });
  const homeworkTasks = allTasks.filter(t => t.type === 'homework');
  const examTasks = allTasks.filter(t => t.type === 'exam');
  
  const allAttendance = await AttendanceModel.find({ course: courseId });
  const allSubmissions = await SubmissionModel.find({ course: courseId });

  // 3. Unique dates count for total attendance days
  const totalAttendanceDays = [...new Set(allAttendance.map(a => a.date))].length;

  // 4. Map students to the specific UI format
  const report = course.students.map((student: any) => {
    const studentId = student._id.toString();

    // Attendance Calculation: "09/10 (90%)"
    const studentAttendance = allAttendance.filter(a => 
      a.student.toString() === studentId && (a.status === 'on time' || a.status === 'late')
    ).length;
    const attPercentage = totalAttendanceDays > 0 ? Math.round((studentAttendance / totalAttendanceDays) * 100) : 0;
    const attendanceString = `${String(studentAttendance).padStart(2, '0')}/${String(totalAttendanceDays).padStart(2, '0')} (${attPercentage}%)`;

    // Homework Calculation: "09/10"
    const studentHwSubmissions = allSubmissions.filter(s => 
      s.student.toString() === studentId && 
      homeworkTasks.some(h => h._id.toString() === s.task.toString())
    ).length;
    const hwCompletedString = `${String(studentHwSubmissions).padStart(2, '0')}/${String(homeworkTasks.length).padStart(2, '0')}`;
    
    // H.W. Pending Calculation: "01"
    const hwPendingCount = homeworkTasks.length - studentHwSubmissions;
    const hwPendingString = String(hwPendingCount > 0 ? hwPendingCount : 0).padStart(2, '0');

    // Exam Grade Calculation: "88%"
    const studentExamMarks = allSubmissions.filter(s => 
      s.student.toString() === studentId && 
      s.isMarked &&
      examTasks.some(e => e._id.toString() === s.task.toString())
    );
    const totalExamMarks = studentExamMarks.reduce((acc, curr) => acc + (curr.marks || 0), 0);
    const avgExamGrade = studentExamMarks.length > 0 ? Math.round(totalExamMarks / studentExamMarks.length) : 0;

    return {
      studentName: student.fullName,
      attendance: attendanceString,
      hwCompleted: hwCompletedString,
      hwPending: hwPendingString,
      examGrade: `${avgExamGrade}%`
    };
  });

  return report;
};

export const ReportServices = {
  syncAndGetStudentProgress,
  getCourseDashboardOverview,
  getStudentListWithStatus,
  getOverallCourseAcademicStats,
  getDetailedTabularReport
};
