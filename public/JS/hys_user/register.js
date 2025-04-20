
$(document).ready(function () {
    // Xử lý sự kiện gửi biểu mẫu
    $('#registrationForm').on('submit', async function (e) {
        e.preventDefault(); // Ngăn chặn hành động mặc định của biểu mẫu

        // Lấy dữ liệu từ biểu mẫu
        const firstName = $('#frist_name').val().trim();
        const lastName = $('#last_name').val().trim();
        const email = $('#email').val().trim();
        const employeeId = $('#employee_id').val().trim();
        const department = $('#department').val();
        const departmentName = $('#department option:selected').text();  // Lấy tên bộ phận
        const password = $('#password').val();
        const passwordConfirmation = $('#password_confirmation').val();
        const agree = $('#agree').is(':checked');

        // Kiểm tra nếu bất kỳ trường nào còn trống
        if (!firstName || !lastName || !email || !employeeId || !department || !password || !passwordConfirmation) {
            iziToast.error( {
                title: 'Lỗi',
                message: 'Vui lòng điền đầy đủ thông tin.',
                position: 'topRight'
            });
            return; // Ngừng gửi yêu cầu nếu có trường trống
        }
        // Kiểm tra nếu mật khẩu và xác nhận mật khẩu không khớp
        if (password !== passwordConfirmation) {
            iziToast.error({
                title: 'Lỗi',
                message: 'Mật khẩu và xác nhận mật khẩu không khớp.',
                position: 'topRight'
            });
            return;
        }
        // Kiểm tra mật khẩu có ít nhất 6 ký tự không
        if (password.length < 6) {
            iziToast.error({
                title: 'Lỗi',
                message: 'Mật khẩu phải có ít nhất 6 ký tự.',
                position: 'topRight'
            });
            return; // Ngừng gửi yêu cầu nếu mật khẩu không hợp lệ
        }
        // Kiểm tra điều khoản người dùng đồng ý
        if (!agree) {
            iziToast.error({
                title: 'Lỗi',
                message: 'Vui lòng đồng ý với các điều khoản và điều kiện.',
                position: 'topRight'
            });
            return;
        }



        // Tạo đối tượng dữ liệu người dùng
        const userData = {
            firstName: firstName,
            lastName: lastName,
            departmentName: departmentName,
            email: email,
            employeeId: employeeId,
            department: department,
            password: password,
            // role mặc định là 3, nếu cần có thể thay đổi
        };

        try {
            // Gửi yêu cầu POST đến API để tạo người dùng mới
            const response = await $.ajax({
                url: '/createUser', // Đường dẫn API để tạo tài khoản mới
                method: 'POST',
                contentType: 'application/json',
                data: JSON.stringify(userData)
            });
            // Hiển thị thông báo thành công bằng Toastr
            iziToast.warning({
                title: 'Thông Báo',
                message: response.message || 'Tạo người dùng thành công!',
                position: 'topRight'
            });
            
            

            // Làm trống các trường đầu vào sau khi tạo thành công
            $('#frist_name').val('');
            $('#last_name').val('');
            $('#email').val('');
            $('#employee_id').val('');
            $('#department').val(''); // Đặt lại phòng ban mặc định
            $('#password').val('');
            $('#password_confirmation').val('');
            $('#agree').prop('checked', false);


            // Có thể điều hướng đến trang khác hoặc làm mới trang ở đây
            setTimeout(() => {

                iziToast.info({
                    title: 'Chuyển Hướng',
                    message: 'Bạn sẽ được chuyển hướng đến trang đăng nhập sau 3 giây.',
                    position: 'topRight'
                });

                // Chuyển hướng đến trang đăng nhập sau 3 giây
                setTimeout(() => {
                    window.location.href = 'login'; // Thay đổi đường dẫn nếu cần
                }, 4000);
            }, 4000); // Đợi 3 giây trước khi hiển thị thông báo chuyển hướng
        } catch (error) {
            console.error('Error:', error);
            // Hiển thị thông báo lỗi bằng Toastr
            const errorMessage = error.responseJSON && error.responseJSON.error
                ? error.responseJSON.error
                : 'Có lỗi xảy ra. Vui lòng thử lại!';

            // Hiển thị thông báo lỗi bằng Toastr
            iziToast.error({
                title: 'Lỗi',
                message: errorMessage,
                position: 'topRight'
            });
        }
    });
});
// Hàm để load danh sách bộ phận
async function loadDepartments() {
    try {
        const response = await fetch('get-departments');
        const data = await response.json();
        if (data) {
            const departmentSelect = document.getElementById('department');

            // Xóa options cũ (nếu có)
            departmentSelect.innerHTML = '<option value="" disabled selected>Select Department</option>';

            // Thêm options mới từ API
            data.forEach(dept => {
                const option = document.createElement('option');
                option.value = dept.id;
                option.textContent = dept.name;
                departmentSelect.appendChild(option);
            });
        } else {
            console.error('Failed to load departments:', data.message);
        }
    } catch (error) {
        console.error('Error loading departments:', error);
    }
}

// Load departments khi trang được load
document.addEventListener('DOMContentLoaded', loadDepartments);