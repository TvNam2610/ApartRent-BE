import db from '../database/database.js'; // Kết nối cơ sở dữ liệu

class UserModel {
  static async getUserByEmail(email) {
    const query = "SELECT * FROM user WHERE email = ?";
    const { rs, data } = await db.executeQueryWithParams(query, [email]);
    return { rs, data };
  }
}

export default UserModel;
