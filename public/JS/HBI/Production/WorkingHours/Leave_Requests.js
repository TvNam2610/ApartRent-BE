

// Mặc định trang và số lượng bản ghi
let currentPage = 1;  // Mặc định trang 1
let limit = document.getElementById("pageSize") ? document.getElementById("pageSize").value : 2;  // Mặc định limit là 10 nếu chưa chọn
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

// Hàm gọi API
function fetchData() {
    const userData = localStorage.getItem("user");
    const teamLeaderId = localStorage.getItem("username");

    if (!userData || !teamLeaderId) {
        console.error("User data or username not found in localStorage.");
        alert("Không thể lấy thông tin người dùng từ localStorage.");
        return;
    }

    const user = JSON.parse(userData);
    const position = user.position;

    if (!position) {
        console.error("Position is undefined.");
        alert("Không có thông tin vị trí của người dùng.");
        return;
    }

    const url = `filtered-supervisors-history`;

    // Create the request body
    const requestBody = JSON.stringify({
        filters: { SupervisorID: teamLeaderId }, // Use dynamic teamLeaderId
        position: position,
        page: currentPage,
        limit: limit  
    });

    console.log("Request URL:", url);
    console.log("Request Body:", requestBody);

    // Fetch API with POST request
    fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: requestBody
    })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log("API Response:", data); // Debug dữ liệu trả về từ API
            if (data.success && data.data?.data?.rs && Array.isArray(data.data.data.data)) {
                const users = data.data.data.data; // Lấy danh sách user từ API
                const totalPages = data.pagination?.totalPages || 1; // Lấy tổng số trang từ pagination
                 const pagination = data.data.pagination; // Thông tin phân trang

                const tableBody = document.querySelector("#table-1 tbody");
                tableBody.innerHTML = ""; // Xóa dữ liệu cũ trong bảng

                // Duyệt qua danh sách user và hiển thị
                users.forEach(user => {
                    const row = document.createElement("tr");

                    row.innerHTML = `
                        <td>${user.leave_request_code}</td>
                        <td>${new Date(user.created_at).toLocaleString('vi-VN', {
                        year: 'numeric', month: '2-digit', day: '2-digit',
                        hour: '2-digit', minute: '2-digit', second: '2-digit'
                    })}</td>
                        <td>
                            <div class="badge ${user.status === 'APPROVED' ? 'badge-success' : (user.status === 'PENDING' ? 'badge-warning' : 'badge-danger')} badge-shadow">
                                ${user.status}
                            </div>
                        </td>
                        <td>${user.SupervisorID}</td>
                        <td>${user.FullName}</td>
                        
                         <td class="text-center">
                            <a href="javascript:void(0);" onclick="openDetailPage('${user.leave_request_code}')" class="btn btn-info text-white">Chi tiết</a>
                                ${(user.status === "PENDING")
                            ? `<div class="btn-group" role="group" aria-label="Transaction Actions">
                                    <a class="btn btn-success text-white" onclick="approveLeave('${user.leave_request_code}')">Approved</a>
                                    <a class="btn btn-danger text-white" onclick="RejectLeave('${user.leave_request_code}')">Rejected</a>
                                </div>`
                            : ''
                        }
                            </td>
                    `;

                    tableBody.appendChild(row);
                });

                console.log("Total Pages:", data);
                console.log("Total Pages2:", totalPages);
                updatePagination(data); // Uncomment nếu có hàm phân trang
            } else {
                alert("Không có dữ liệu người dùng.");
            }
        })
        .catch(error => {
            console.error("Error fetching data:", error);
            //alert("Có lỗi xảy ra khi lấy dữ liệu. Vui lòng thử lại sau.");
        });
}



// Hàm cập nhật phân trang
function updatePagination(data) {
    const paginationContainer = document.querySelector('.pagination');
    paginationContainer.innerHTML = '';  // Xóa các trang hiện tại


    const pagination = data.data.pagination;
    const totalPages = pagination.totalPages; // Mặc định ít nhất có 1 trang
    currentPage = pagination.currentPage; // Trang hiện tại

   
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


// Gọi API cập nhật trạng thái
function updateKaizenStatus(leaveRequestCode, status) {
    fetch('leave-history/update-all-code-status', {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ leaveRequestCode, status })
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                //alert(`Cập nhật thành công: ${note}`);
                iziToast.success({
                    title: "Thông báo",
                    message: "Cập nhật thành công!",
                    position: "topRight"
                });
                fetchData();
            } else {
                //alert(`Lỗi: ${data.message}`);
                iziToast.error({
                    title: 'Lỗi',
                    message: data.message,
                    position: 'topRight'
                });
            }
        })
        .catch(error => console.error('Lỗi khi cập nhật trạng thái:', error));
}

// Khi bấm Approved (mặc định note = "Done")
function approveLeave(leaveRequestCode, status) {
    updateKaizenStatus(leaveRequestCode, "APPROVED");
} 
function RejectLeave(leaveRequestCode, status) {
    updateKaizenStatus(leaveRequestCode, "REJECTED");
}

function openDetailPage(leave_request_code) {
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
