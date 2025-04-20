// Mặc định trang và số lượng bản ghi
let currentPage = 1;  // Mặc định trang 1
let limit = document.getElementById("pageSize") ? document.getElementById("pageSize").value : 10;  // Mặc định limit là 10 nếu chưa chọn
let totalPages = 1;  // Mặc định tổng số trang
let currentStatus = "Pending";  // Mặc định là "Pending" (1)


//  Xử lý sự kiện khi bấm vào tab trạng thái
$('#statusTabs .nav-link').on('click', function (e) {
    e.preventDefault();
    currentStatus = $(this).data('status');

    //  Đặt lại trạng thái active cho tab
    $('#statusTabs .nav-link.active span.badge').removeClass('badge-white');
    $('#statusTabs .nav-link.active span.badge').addClass('badge-primary');
    $('#statusTabs .nav-link').removeClass('active');
    $(this).addClass('active');
    $('#statusTabs .nav-link.active span.badge').addClass('badge-white');


    fetchData()
   
});


//  Lắng nghe sự kiện khi thay đổi số lượng bản ghi
function handlePageSizeChange() {
    const pageSizeSelect = document.getElementById('pageSize');

    pageSizeSelect.addEventListener('change', function () {
        limit = parseInt(this.value); //  Lấy giá trị từ select
        currentPage = 1; //  Reset về trang đầu khi thay đổi số lượng bản ghi
        fetchData(); //  Gọi lại API với số lượng bản ghi mới
    });
}

// Gọi API cập nhật trạng thái
function updateStatus(employeeId, status, newLine) {
    fetch('approve-line-change', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            Employee_ID: employeeId,
            Status: status,
            New_Line: newLine
        })
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
function approveEmployee(employeeId, newLine) {
    updateStatus(employeeId, "Approved", newLine);
}

function rejectEmployee(employeeId, newLine) {
    updateStatus(employeeId, "Rejected", newLine);
}

//  Xử lý hiển thị phân trang
function updatePagination(data) {
    const paginationContainer = document.querySelector('.pagination');
    paginationContainer.innerHTML = ''; // Xóa các trang hiện tại

    const totalPages = data.totalPages; // Tổng số trang từ API
    currentPage = parseInt(data.currentPage); // Cập nhật trang hiện tại từ API

    //  Tạo nút Previous
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
            fetchData(); // Gọi lại API với trang mới
        }
    });
    prevButton.appendChild(prevLink);
    paginationContainer.appendChild(prevButton);

    //  Hiển thị các trang gần với trang hiện tại
    const range = 2; // Hiển thị 2 trang xung quanh trang hiện tại
    let startPage = Math.max(1, currentPage - range);
    let endPage = Math.min(totalPages, currentPage + range);

    //  Nếu có nhiều trang hơn, thêm nút "..." cho các trang bị bỏ qua
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

    //  Tạo các nút trang
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
            if (i !== currentPage) {
                currentPage = i;
                fetchData(); // Gọi lại API với trang mới
            }
        });

        pageItem.appendChild(pageLink);
        paginationContainer.appendChild(pageItem);
    }

    //  Nếu có nhiều trang, thêm nút "..." cho các trang bị bỏ qua
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

    //  Tạo nút Next
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
            fetchData(); // Gọi lại API với trang mới
        }
    });
    nextButton.appendChild(nextLink);
    paginationContainer.appendChild(nextButton);
}


document.addEventListener("DOMContentLoaded", function () {
    fetchData(); //  Gọi API khi trang tải xong
    handlePageSizeChange();
});


//  Gọi API lấy dữ liệu từ server
function fetchData() {
    const userData = JSON.parse(localStorage.getItem('user'));
    console.log(userData.employee_id)
    const status = currentStatus;
    if (!userData) {
        alert('Không tìm thấy thông tin người dùng!');
        return;
    }

    //  Đảm bảo limit được truyền vào URL
    let url = `get-approve-change-line-test?position=${userData.position}&page=${currentPage}&limit=${limit}&status=${status}&SupervisorID=${userData.employee_id}`;
    //  Kiểm tra nếu là Production_Superintendent thì thêm SupervisorID vào query
    // if (userData.position === 'Production_Superintendent' && userData.employee_id) {
    //     url += `&SupervisorID=${userData.employee_id}`;
    // }
  
    fetch(url)
        .then(response => response.json())
        .then(data => {
            if (data.success && data.data) {
        console.log(data)


                //  Render lại bảng dữ liệu
                renderTable(data.data);
                


                //  Cập nhật lại số trang
                updatePagination(data.pagination);


                // Update Pending, Processed, and Complete Counts dynamically
                if (data.statusCounts) {
                    // Update Pending count
                    const pendingCountElement = document.getElementById("pending-count");
                    if (pendingCountElement) {
                        pendingCountElement.textContent = data.statusCounts.pending;  // Update the count
                    }

                    // Update Processed count
                    const rejectedCountElement = document.getElementById("rejected-count");
                    if (rejectedCountElement) {
                        rejectedCountElement.textContent = data.statusCounts.rejected;  // Update the count
                    }
                    const approvedCountElement = document.getElementById("approved-count");
                    if (approvedCountElement) {
                        approvedCountElement.textContent = data.statusCounts.approved;  // Update the count
                    }

                    // Update Complete count
                    const completeCountElement = document.getElementById("complete-count");
                    if (completeCountElement) {
                        completeCountElement.textContent = data.statusCounts.complete;  // Update the count
                    }
                }
            } else {
                alert("Không có dữ liệu công nhân.");
            }
        })
        .catch(error => {
            console.error('Lỗi khi tải dữ liệu:', error);
            alert("Có lỗi xảy ra khi lấy dữ liệu.");
        });
}

//  Render bảng dữ liệu từ API
function renderTable(data) {
    const tableBody = document.getElementById('lineChangeTableBody');
    tableBody.innerHTML = '';

    data.forEach(user => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td class="text-center">${user.Employee_ID || '-'}</td>
            <td class="text-center">${user.Employee_name || '-'}</td>
            <td class="text-center">${user.Old_Line_Name || '-'}</td>
            <td class="text-center new-line">${user.New_Line_Name || '-'}</td>
            
            <td class="text-center" >
                        ${(user.Status === "Pending")
                        ? `<div class="btn-group" role="group" aria-label="Transaction Actions">
                                <a class="btn btn-success text-white" onclick="approveEmployee(${user.Employee_ID},${user.New_Line})">Approved</a>
                                <a class="btn btn-danger text-white" onclick="rejectEmployee(${user.Employee_ID},${user.New_Line})">Rejected</a>
                            </div>`
                        : user.Status === "Approved"
                            ? `<span class="badge bg-success text-white"> APPROVED</span>`
                            : `<span class="badge bg-danger text-white"> REJECTED</span>`
                    }
            </td>
        `;
        tableBody.appendChild(row);

    });

    //onclick="approveLeave('${user.leave_request_code}')"
    //onclick="RejectLeave('${user.leave_request_code}')"
    //attachEventHandlers(); //  Kết nối sự kiện sau khi render dữ liệu
}

//  Xử lý khi chuyển trang
function changePage(page) {
    if (page >= 1 && page <= totalPages) {
        currentPage = page;
        fetchData(); //  Gọi lại API khi chuyển trang
        scrollToTop(); //  Cuộn lên đầu bảng khi chuyển trang
    }
}

//  Cuộn lên đầu bảng khi chuyển trang
function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}