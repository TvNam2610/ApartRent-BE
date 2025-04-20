$(document).ready(function () {
    $('#loginForm').on('submit', function (e) {
        e.preventDefault(); // Ngăn chặn hành động gửi mặc định của biểu mẫu

        const employeeId = $('#employeeId').val(); // Lấy giá trị ID nhân viên từ input
        const password = $('#password').val(); // Lấy giá trị mật khẩu từ input (nếu cần)
        // Kiểm tra nếu tài khoản hoặc mật khẩu để trống
        if (!employeeId || !password) {
            iziToast.warning({
                title: 'Cảnh báo',
                message: 'Tài khoản và mật khẩu không được để trống!',
                position: 'topRight'
            });
            return; // Ngừng thực hiện nếu có trường trống
        }
        // Gọi API đăng nhập
        $.ajax({
            url: '/login', // Đường dẫn đến API đăng nhập
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ employeeId, password }), // Chuyển đổi dữ liệu thành JSON
            success: function (response) {
                // Lưu thông tin người dùng vào localStorage
                localStorage.setItem('user', JSON.stringify(response.user)); // Lưu vào localStorage
                localStorage.setItem('username', response.user.username); // Lưu vào localStorage


                // window.location.href = '/'; // Ví dụ chuyển hướng đến dashboard
                // Lấy bộ phận của người dùng từ thông tin đã lưu
                const user = response.user;
                const department = user.department_user; // Giả sử bạn có trường department trong user

                // Chuyển hướng đến trang dựa trên bộ phận của người dùng
                let redirectUrl = '/'; // URL mặc định nếu không có bộ phận cụ thể

                // Kiểm tra bộ phận của người dùng và chuyển hướng theo bộ phận
                switch (department) {
                    case 'PR':
                        redirectUrl = 'Production/PayrollCheck'; // Trang dành cho bộ phận nhân sự
                        break;
                    case 'WAREHOUSE':
                        redirectUrl = '/warehouse/warehousemanagement'; // Trang dành cho bộ phận tài chính
                        break;
                    case 'MEC':
                        redirectUrl = 'mechanic/MachineAnalysis'; // Trang dành cho bộ phận IT
                        break;
                    case 'CUTTING':
                        redirectUrl = 'Cutting/'; // Trang dành cho bộ phận IT
                        break;
                    case 'IE':
                        redirectUrl = '/'; // Trang dành cho bộ phận IT
                        break;
                    default:
                        redirectUrl = '/'; // Nếu không xác định được bộ phận, chuyển hướng về trang chính
                        break;
                }

                // Chuyển hướng đến URL phù hợp
                window.location.href = redirectUrl;

                
            },
            error: function (xhr) {
                // Nếu có lỗi trong quá trình đăng nhập
                const errorMessage = xhr.responseJSON && xhr.responseJSON.message
                    ? xhr.responseJSON.message // Sử dụng message thay vì error
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
});

