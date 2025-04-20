// Hiển thị modal
function showModal(userId) {
    // Lấy dữ liệu người dùng bằng ID (giả sử API trả về thông tin người dùng)
    $.ajax({
        url: `users/${userId}`,  // Thay bằng URL API thực tế của bạn
        method: 'GET',
        success: function (response) {
            if (response.success && response.data) {
                const user = response.data.data[0];
                console.log(user)

                // Điền dữ liệu vào các trường trong modal
                $('#firstName').val(user.first_name);
                $('#lastName').val(user.last_name);
                $('#password').val(user.password);
                $('#position').val(user.position);
                $('#department_user').val(user.department_user);                
                $('#email').val(user.email);
                // Cập nhật select với giá trị từ API
                $('#enabled').val(user.enabled === 0 ? "0" : "1");  // 0 = Open, 1 = Locked
                $('#accountLocked').val(user.account_locked === 0 ? "0" : "1"); // 0 = Not Locked, 1 = Locked
                // Lưu userId vào modal để sử dụng sau này
                $('#exampleModal').data('user-id', userId);


                // Mở modal
                $('#exampleModal').modal('show');
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
    const userId = $('#exampleModal').data('user-id');  // Giả sử modal có chứa userId

    const firstName = $('#firstName').val();
    const lastName = $('#lastName').val();
    const password = $('#password').val();
    const position = $('#position').val();
    const department_user = $('#department_user').val();
    const email = $('#email').val();
    const enabled = $('#enabled').val();
    const accountLocked = $('#accountLocked').val();

    // Tạo đối tượng data chứa các giá trị cần update
    const data = {
        first_name: firstName,
        last_name: lastName,
        password: password,
        position: position,
        department_user: department_user,
        email: email,
        enabled: enabled === '0' ? 0 : 1,  // Chuyển '0'/'1' thành 0/1
        account_locked: accountLocked === '0' ? 0 : 1  // Chuyển '0'/'1' thành 0/1
    };

    // Gửi yêu cầu API cập nhật
    $.ajax({
        url: `users/${userId}`,  // Cập nhật URL API của bạn
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
                $('#exampleModal').modal('hide');  // Đóng modal sau khi cập nhật thành công
                
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
        const employee_id = document.getElementById("employee_id_search").value || '';  // Lấy mã nhân viên từ ô tìm kiếm
        const url = `user-information?page=${currentPage}&limit=${limit}&employee_id=${employee_id}`;  // Tạo URL với các tham số

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
                            <td>${user.id}</td>
                            <td>${user.first_name || ''} ${user.last_name || ''}</td>
                            <td>${user.employee_id}</td>
                            <td>${user.department_user}</td>
                            <td>${user.position}</td>
                            <td>${new Date(user.created_at).toLocaleString('vi-VN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' })}</td>
                            <td>
                                <div class="badge ${user.enabled === 0 ? 'badge-success' : 'badge-danger'} badge-shadow">
                                    ${user.enabled === 0 ? "Active" : "Not Active"}
                                </div>
                            </td>
                            <td>                          
                                <div class="badge ${user.account_locked === 0 ? 'badge-success' : 'badge-danger'} badge-shadow">
                                    ${user.account_locked === 0 ? "Hoạt Động" : "Khóa"}
                                </div>
                            </td>
                            <td>${user.last_login_ip || ''}</td>
                            <td>${user.last_login_user_agent || ''}</td>  
                            <td><a href="#" class="btn btn-primary" onclick="showModal(${user.id})">Detail</a></td>
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
