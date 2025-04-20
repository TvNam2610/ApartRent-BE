function showModal(leave_request_code) {
    console.log("History", leave_request_code);

    $.ajax({
        url: `leave-history/${leave_request_code}`,  // Thay bằng URL thực tế của bạn
        method: 'GET',
        success: function (response) {
            if (response) {
                const leaveDetails = response;  // Lấy dữ liệu từ API
                const leaveHistoryDetailBody = document.getElementById("leaveHistoryDetailBody");
                leaveHistoryDetailBody.innerHTML = ""; // Xóa dữ liệu cũ trong bảng

                leaveDetails.forEach(detail => {
                    const row = document.createElement("tr");
                    row.innerHTML = `
                        <td class="text-center">${detail.Employee_ID}</td>
                        <td class="text-center">${detail.code_name} - ${detail.motive}</td>
                        <td class="text-center">${new Date(detail.start_date).toLocaleDateString('vi-VN')}</td>
                        <td class="text-center">${new Date(detail.end_date).toLocaleDateString('vi-VN')}</td>
                         <td class="text-center">${detail.description}</td>
                        <td class="text-center">
                            <div class="badge ${detail.status === 'APPROVED' ? 'badge-success' : detail.status === 'REJECTED' ? 'badge-danger' : 'badge-warning'} badge-shadow">
                                ${detail.status}
                            </div>
                        </td>
                    `;
                    leaveHistoryDetailBody.appendChild(row); // Thêm hàng vào bảng
                });

                // Hiển thị modal
                $('#exampleModal').modal('show');
            } else {
                iziToast.error({
                    title: 'Lỗi',
                    message: 'Không có dữ liệu chi tiết.',
                    position: 'topRight'
                });
            }
        },
        error: function () {
            iziToast.error({
                title: 'Lỗi',
                message: 'Đã xảy ra lỗi khi lấy dữ liệu.',
                position: 'topRight'
            });
        }
    });
}



    // Mặc định trang và số lượng bản ghi
    let currentPage = 1;  // Mặc định trang 1
    let limit = document.getElementById("pageSize") ? document.getElementById("pageSize").value : 10;  // Mặc định limit là 10 nếu chưa chọn
    let totalPages = 1;  // Mặc định tổng số trang

    // Kiểm tra và lắng nghe sự kiện thay đổi số lượng bản ghi (pageSize)
    const pageSizeElement = document.getElementById("pageSize");
    if (pageSizeElement) {
        pageSizeElement.addEventListener("change", function () {
            console.log(this.value)
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
        const user_login = JSON.parse(localStorage.getItem("username"))
        const leaveRequestCode = document.getElementById("leaveRequestCode").value || '';  // Lấy mã phiếu từ ô nhập
        console.log(leaveRequestCode)
        //const url = `leave-history-create-by?page=${currentPage}&limit=${limit}&position=${user.position}&status=APPROVED&createdBy=${user.id}`;  // Tạo URL với các tham số
        const url = `get-view-attendance-history-leave?page=${currentPage}&limit=${limit}&created_by=${user_login}`;  // Tạo URL với các tham số
        
        // Gọi API
        fetch(url)
            .then(response => response.json())
            .then(data => {
                if (data) {
                    const leaveHistories = data.data.data;  // Lấy danh sách phiếu nghỉ từ API
                     totalPages = data.pagination.totalPages || 1;  // Cập nhật tổng số trang từ API
                    const tableBody = document.querySelector("#leave-history-body"); // Lấy tbody trong bảng
                    tableBody.innerHTML = "";  // Xóa dữ liệu cũ trong bảng
                    // Lặp qua danh sách phiếu nghỉ và tạo các hàng bảng
                    leaveHistories.forEach(history => {
                        const row = document.createElement("tr");
                        row.innerHTML = `
                            <td class="text-center"id="leaveRequesCode">${history.leave_request_code}</td>
                            <td class="text-center" id="createdBy">${user_login}</td>
                            <td class="text-center" id="createdAt">${new Date(history.created_at).toLocaleString('vi-VN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' })}</td>
                            <td class="text-center">
                                <div class="badge ${history.status === 'APPROVED' ? 'badge-success' : (history.status === 'PENDING' ? 'badge-warning' : 'badge-danger')} badge-shadow">
                                    ${history.status === 'APPROVED' ? 'APPROVED' : (history.status === 'PENDING' ? 'PENDING' : 'REJECTED')}
                                </div>
                            </td>


                            <td class="text-center">
                                <a href="#" class="btn btn-primary" onclick="showModal('${history.leave_request_code}')">Chi tiết</a>
                            </td>
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
