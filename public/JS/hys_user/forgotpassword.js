// Lắng nghe sự kiện submit của form
document.getElementById("forgotPasswordForm").addEventListener("submit", function (e) {
    e.preventDefault(); // Ngăn không cho form gửi đi trực tiếp

    const emailField = document.getElementById("email");
    const email = emailField.value;

    // Kiểm tra email hợp lệ
    if (!email) {
        iziToast.error({
            title: 'Lỗi',
            message: 'Vui lòng nhập địa chỉ email.',
            position: 'topRight',
        });
        return;
    }

    // Gửi request đến server để thực hiện yêu cầu quên mật khẩu
    fetch('forgot-password', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email })
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                iziToast.success({
                    title: 'Thành Công',
                    message: data.message || 'Chúng tôi đã gửi liên kết để đặt lại mật khẩu vào email của bạn.',
                    position: 'topRight',
                });
                // Làm trống trường email sau khi xử lý
                emailField.value = '';
            } else {
                iziToast.error({
                    title: 'Lỗi',
                    message: data.message || 'Đã xảy ra lỗi. Vui lòng thử lại.',
                    position: 'topRight',
                });
                // Làm trống trường email sau khi xử lý
                emailField.value = '';
            }
        })
        .catch(error => {
            iziToast.error({
                title: 'Lỗi',
                message: 'Có lỗi xảy ra, vui lòng thử lại sau.',
                position: 'topRight',
            });
            // Làm trống trường email sau khi xử lý
            emailField.value = '';
        });
});