// Hàm thực hiện đăng xuất
function handleLogout(event) {
    event.preventDefault();

    fetch('/logout', {
        method: 'POST',
        credentials: 'include'
    })
        .then(response => {
            if (!response.ok) {
                throw new Error("Lỗi khi đăng xuất");
            }

            // Thành công: Xóa thông tin người dùng và chuyển hướng
            localStorage.removeItem("user");
            localStorage.removeItem("username");
            window.location.href = "login";
        })
        .catch(error => {
            console.error("Có lỗi xảy ra khi đăng xuất:", error);
            alert("Đăng xuất không thành công. Vui lòng thử lại.");
        });
}



// Thiết lập sự kiện cho nút logout
function setupLogoutHandler() {
    const logoutButton = document.getElementById("logout");
    if (logoutButton) {
        logoutButton.addEventListener("click", handleLogout);
    } else {
        console.warn("Không tìm thấy nút logout trong DOM.");
    }
}




// Hàm cập nhật tên người dùng trong dropdown
function updateUserDropdown() {
    const user = JSON.parse(localStorage.getItem("user")); // Lấy thông tin người dùng từ localStorage
    if (user && user.first_name) {
        const dropdownTitle = document.querySelector(".dropdown-title");
        if (dropdownTitle) {
            dropdownTitle.textContent = `Xin chào : ${user.first_name}`; // Cập nhật tên người dùng
        }
    } else {
        console.warn("Không tìm thấy thông tin người dùng trong localStorage.");
    }
}


// Khởi chạy khi DOM đã sẵn sàng
document.addEventListener("DOMContentLoaded", function () {
    updateUserDropdown(); // Hiển thị tên người dùng
    setupLogoutHandler(); // Thiết lập sự kiện đăng xuất
});