import mysql from 'mysql2';

// Tạo kết nối MySQL
const connection = mysql.createConnection({
    host: 'localhost',       // Thay đổi theo địa chỉ host của bạn (có thể là '127.0.0.1')
    user: 'root',            // Thay đổi theo username của bạn
    password: '123456', // Thay đổi theo mật khẩu của bạn
    database: 'real_estate_project', // Tên cơ sở dữ liệu bạn muốn kết nối
});

// Kiểm tra kết nối
connection.connect((err) => {
    if (err) {
        console.error('Lỗi kết nối tới cơ sở dữ liệu:', err.stack);
        return;
    }
    console.log('Đã kết nối đến cơ sở dữ liệu MySQL!');
});

export default connection;
