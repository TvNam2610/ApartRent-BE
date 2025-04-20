
// Mặc định trang và số lượng bản ghi
let currentPage = 1;  // Mặc định trang 1
let limit = document.getElementById("pageSize") ? document.getElementById("pageSize").value : 10;  // Mặc định limit là 10 nếu chưa chọn
let totalPages = 1;  // Mặc định tổng số trang

// Kiểm tra và lắng nghe sự kiện thay đổi số lượng bản ghi (pageSize)
const pageSizeElement = document.getElementById("pageSize");
if (pageSizeElement) {
    pageSizeElement.addEventListener("change", function () {
        limit = this.value;  // Cập nhật giá trị limit khi người dùng thay đổi
        currentPage = 1;  // Reset về trang 1 khi thay đổi số lượng bản ghi
        fetchData();  // Gọi lại API với giá trị limit mới
    });
}

// Kiểm tra và lắng nghe sự kiện tìm kiếm
const searchButton = document.getElementById("search-button");
if (searchButton) {
    searchButton.addEventListener("click", function (e) {
        e.preventDefault();  // Ngăn chặn việc reload trang (submit form)

        currentPage = 1;  // Reset về trang 1 khi bấm tìm kiếm
        fetchData();  // Gọi lại API khi bấm tìm kiếm
    });
}

// Hàm gọi API
function fetchData() {
    const TeamLeaderID = document.getElementById("TeamLeaderID_search").value || '';  // Lấy mã nhân viên từ ô tìm kiếm
    const url = `team-leaders?page=${currentPage}&limit=${limit}&TeamLeaderID=${TeamLeaderID}`;  // Tạo URL với các tham số

    // Gọi API
    fetch(url)
        .then(response => response.json())
        .then(data => {
            if (data.success && data.data && data.data.rs) {
                const users = data.data.data;  // Lấy danh sách người dùng từ API
                totalPages = data.pagination.totalPages || 1;  // Cập nhật tổng số trang từ API
                const tableBody = document.querySelector("#table-1 tbody"); // Lấy tbody trong bảng
                tableBody.innerHTML = "";  // Xóa dữ liệu cũ trong bảng

                // Lặp qua danh sách người dùng và tạo các hàng bảng
                users.forEach(user => {
                    const row = document.createElement("tr");

                    row.innerHTML = `
                            <td>${user.ID}</td>
                            <td>${user.TeamLeaderID}</td>
                            <td>${user.FullName}</td> 
                            <td>${user.Email}</td> 
                            <td><a href="#" class="btn btn-primary" onclick="showModal(${user.ID})">Edit</a></td>
                        `;

                    tableBody.appendChild(row);  // Thêm hàng vào bảng
                });

                // Cập nhật phân trang
                updatePagination(data);
            } else {
                alert("Không có dữ liệu người dùng.");
            }
        })
        .catch(error => {
            console.error('Error fetching data:', error);
            alert("Có lỗi xảy ra khi lấy dữ liệu.");
        });
}

// Hàm cập nhật phân trang
function updatePagination(data) {
    const paginationContainer = document.querySelector('.pagination');
    paginationContainer.innerHTML = '';  // Xóa các trang hiện tại

    const totalPages = data.pagination.totalPages;  // Tổng số trang từ API
    currentPage = parseInt(data.pagination.currentPage);  // Cập nhật trang hiện tại từ API

    // Tạo nút Previous
    const prevButton = document.createElement('li');
    prevButton.classList.add('page-item');
    if (currentPage === 1) {
        prevButton.classList.add('disabled');
    }
    const prevLink = document.createElement('a');
    prevLink.classList.add('page-link');
    prevLink.href = '#';
    prevLink.innerHTML = '<i class="fas fa-chevron-left"></i>';
    prevLink.addEventListener('click', function (e) {
        e.preventDefault();
        if (currentPage > 1) {
            currentPage--;
            fetchData();  // Gọi lại API với trang mới
        }
    });
    prevButton.appendChild(prevLink);
    paginationContainer.appendChild(prevButton);

    // Hiển thị các trang gần với trang hiện tại, ví dụ: trang hiện tại và các trang xung quanh nó
    const range = 2;  // Hiển thị 2 trang xung quanh trang hiện tại
    let startPage = Math.max(1, currentPage - range);
    let endPage = Math.min(totalPages, currentPage + range);

    // Nếu có nhiều trang hơn, thêm nút "..." cho các trang bị bỏ qua
    if (startPage > 1) {
        const ellipsis = document.createElement('li');
        ellipsis.classList.add('page-item');
        const ellipsisLink = document.createElement('a');
        ellipsisLink.classList.add('page-link');
        ellipsisLink.href = '#';
        ellipsisLink.textContent = '...';
        ellipsisLink.addEventListener('click', function (e) {
            e.preventDefault();
            currentPage = 1;
            fetchData();
        });
        ellipsis.appendChild(ellipsisLink);
        paginationContainer.appendChild(ellipsis);
    }

    // Tạo các nút trang
    for (let i = startPage; i <= endPage; i++) {
        const pageItem = document.createElement('li');
        pageItem.classList.add('page-item');
        if (i === currentPage) {
            pageItem.classList.add('active');
        }

        const pageLink = document.createElement('a');
        pageLink.classList.add('page-link');
        pageLink.href = '#';
        pageLink.textContent = i;

        pageLink.addEventListener('click', function (e) {
            e.preventDefault();
            currentPage = i; // Cập nhật trang hiện tại
            fetchData();  // Gọi lại API với trang mới
        });

        pageItem.appendChild(pageLink);
        paginationContainer.appendChild(pageItem);
    }

    // Nếu có nhiều trang, thêm nút "..."
    if (endPage < totalPages) {
        const ellipsis = document.createElement('li');
        ellipsis.classList.add('page-item');
        const ellipsisLink = document.createElement('a');
        ellipsisLink.classList.add('page-link');
        ellipsisLink.href = '#';
        ellipsisLink.textContent = '...';
        ellipsisLink.addEventListener('click', function (e) {
            e.preventDefault();
            currentPage = totalPages;
            fetchData();
        });
        ellipsis.appendChild(ellipsisLink);
        paginationContainer.appendChild(ellipsis);
    }

    // Tạo nút Next
    const nextButton = document.createElement('li');
    nextButton.classList.add('page-item');
    if (currentPage === totalPages) {
        nextButton.classList.add('disabled');
    }
    const nextLink = document.createElement('a');
    nextLink.classList.add('page-link');
    nextLink.href = '#';
    nextLink.innerHTML = '<i class="fas fa-chevron-right"></i>';
    nextLink.addEventListener('click', function (e) {
        e.preventDefault();
        if (currentPage < totalPages) {
            currentPage++;
            fetchData();  // Gọi lại API với trang mới
        }
    });
    nextButton.appendChild(nextLink);
    paginationContainer.appendChild(nextButton);
}
document.addEventListener("DOMContentLoaded", function () {
    // Gọi hàm fetchData khi trang đã được tải xong
    fetchData();  // Gọi API mặc định khi trang được tải, không cần chờ chọn hay nhấn gì cả
});


// API xử lý thêm tổ trưởng mới 
document.getElementById('addTeamLeaderButton').addEventListener('click', function () {

    // Lấy giá trị từ các ô input
    const teamLeaderId = document.getElementById('teamLeaderId').value;
    const fullName = document.getElementById('fullName').value;
    const email = document.getElementById('email').value;

    // Kiểm tra dữ liệu hợp lệ (nếu cần)
    if (!teamLeaderId || !fullName ||!email) {
        iziToast.warning({
            title: 'Cảnh báo',
            message: 'vui lòng nhập đầy đủ thông tin',
            position: 'topRight'
        });
        return;
    }

    // Dữ liệu để gửi lên API
    const requestData = {
        TeamLeaderID: teamLeaderId,
        FullName: fullName,
        Email: email
    };

    // Gọi API
    fetch('team-leader/insert', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Có lỗi xảy ra khi thêm tổ trưởng.');
            }
            return response.json();
        })
        .then(data => {
            console.log(data);
            // Hiển thị thông báo thành công
            iziToast.success({
                title: 'Thông báo',
                message: 'Thêm tổ trưởng thành công!',
                position: 'topRight'
            });
            fetchData();  // Gọi lại API để load lại dữ liệu
        })
        .catch(error => {
            console.error(error);
            // Hiển thị thông báo thành công
            iziToast.error({
                title: 'Lỗi',
                message: 'Không thể thêm tổ trưởng !',
                position: 'topRight'
            });
        });
});



// Hiển thị modal
function showModal(userId) {
    // Lấy dữ liệu người dùng bằng ID (giả sử API trả về thông tin người dùng)
    $.ajax({
        url: `get-data-team-leader/${userId}`,  // Thay bằng URL API thực tế của bạn
        method: 'GET',
        success: function (response) {
            if (response.success && response.data) {
                const user = response.data.data[0];

                // Điền dữ liệu vào các trường trong modal
                $('#teamLeaderIdview').val(user.TeamLeaderID);
                $('#fullNameview').val(user.FullName);
                $('#emailView').val(user.Email);

                // Lưu userId vào modal để sử dụng sau này
                $('#editmodal').data('user-id', userId);


                // Mở modal
                $('#editmodal').modal('show');
            } else {
                iziToast.error({
                    title: 'Lỗi',
                    message: 'Không thể lấy thông tin người dùng.',
                    position: 'topRight'
                });
            }
        },
        error: function () {
            alert('Đã xảy ra lỗi khi lấy dữ liệu.');
        }
    });
}

// Lắng nghe sự kiện khi bấm nút "Save changes"
$('#saveChanges').on('click', function () {
    // Lấy dữ liệu từ các trường trong modal
    const userId = $('#editmodal').data('user-id');  // Giả sử modal có chứa userId
    console.log(userId);

    const firstName = $('#teamLeaderIdview').val();
    const lastName = $('#fullNameview').val();
    const email = $('#emailView').val();

    // Tạo đối tượng data chứa các giá trị cần update
    const data = {
        ID: userId,
        TeamLeaderID: firstName,
        FullName: lastName,
        Email: email
    };

    // Gửi yêu cầu API cập nhật
    $.ajax({
        url: `team-leader/update`,  // Cập nhật URL API của bạn
        method: 'PUT',  // Hoặc 'PATCH' tùy thuộc vào API của bạn
        data: JSON.stringify(data),  // Chuyển dữ liệu thành JSON string
        contentType: 'application/json',  // Đảm bảo API nhận dữ liệu JSON
        success: function (response) {
            if (response.success) {
                iziToast.success({
                    title: 'Thông báo',
                    message: 'Cập nhật thông tin người dùng thành công!',
                    position: 'topRight'
                });
                $('#editmodal').modal('hide');  // Đóng modal sau khi cập nhật thành công

                fetchData();  // Làm mới bảng sau khi cập nhật
            } else {
                iziToast.error({
                    title: 'Lỗi',
                    message: 'Không thể cập nhật thông tin người dùng.',
                    position: 'topRight'
                });
            }
        },
        error: function () {
            alert('Đã xảy ra lỗi trong quá trình cập nhật.');
        }
    });
});