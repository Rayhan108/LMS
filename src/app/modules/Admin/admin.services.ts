import { UserModel } from "../User/user.model";

const getAdminDashboardStatsFromDB = async (year: number) => {
  
  const [totalTeacher, totalAssistant, totalStudent, totalParents] = await Promise.all([
    UserModel.countDocuments({ role: 'teacher' }),
    UserModel.countDocuments({ role: 'assistant' }),
    UserModel.countDocuments({ role: 'student' }),
    UserModel.countDocuments({ role: 'parent' }),
  ]);

  // aggregation(Monthly Growth)
  const startOfYear = new Date(`${year}-01-01`);
  const endOfYear = new Date(`${year}-12-31T23:59:59`);

  const growthData = await UserModel.aggregate([
    {
      $match: {
        role: 'student',
        createdAt: { $gte: startOfYear, $lte: endOfYear }
      }
    },
    {
      $group: {
        _id: { $month: "$createdAt" },
        count: { $sum: 1 }
      }
    },
    { $sort: { "_id": 1 } }
  ]);

  // 
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  
  const studentGrowthChart = monthNames.map((month, index) => {
    const monthData = growthData.find(d => d._id === index + 1);
    return {
      month,
      count: monthData ? monthData.count : 0
    };
  });

  return {
    topCards: {
      totalTeacher,
      totalAssistant,
      totalStudent,
      totalParents
    },
    studentGrowthChart
  };
};

export const AdminServices = {
  getAdminDashboardStatsFromDB
};