// Mặc định trang và số lượng bản ghi
let currentPage = 1;  // Mặc định trang 1
let limit = document.getElementById("pageSize") ? document.getElementById("pageSize").value : 10;  // Mặc định limit là 10 nếu chưa chọn
let totalPages = 1;  // Mặc định tổng số trang
let currentStatus = 1;  // Mặc định là "Pending" (1)


// Lắng nghe sự kiện khi bấm vào tab trạng thái
const statusTabs = document.getElementById("statusTabs");
if (statusTabs) {
    statusTabs.addEventListener("click", function (e) {
        const target = e.target.closest("a"); // Lấy thẻ <a> khi bấm vào tab
        if (target) {
            // Thay đổi class active cho tab
            const currentActive = document.querySelector(".nav-link.active");
            if (currentActive) currentActive.classList.remove("active");
            target.classList.add("active");

            // Lấy giá trị của data-status từ tab được chọn
            currentStatus = target.getAttribute("data-status") || '';

            // Cập nhật lại số lượng bản ghi theo trạng thái (có thể cập nhật từ server)
            fetchData();  // Gọi lại API với trạng thái mới
        }
    });
}


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

// Lắng nghe sự kiện khi bấm vào nút tìm kiếm cho bộ phận
const searchButtonBophan = document.getElementById("search-button-bophan");
if (searchButtonBophan) {
    searchButtonBophan.addEventListener("click", function (e) {
        e.preventDefault();  // Ngăn chặn việc reload trang (submit form)
        currentPage = 1;  // Reset về trang 1 khi bấm tìm kiếm

        // Lấy giá trị tìm kiếm
        const maphieu = document.getElementById("model-input").value || '';  // Lấy mã phiếu từ ô nhập
        const boPhan = document.getElementById("boPhan").value || '';  // Lấy bộ phận từ ô chọn bộ phận

        // Lưu giá trị vào sessionStorage (hoặc một biến toàn cục)
        sessionStorage.setItem("maphieu", maphieu);
        sessionStorage.setItem("boPhan", boPhan);

        fetchData();  // Gọi lại API khi bấm tìm kiếm
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


// Hàm mở tab mới với đường dẫn
function openDetailPage(maphieu) {
    // Mở một tab mới với URL chứa maphieu
    window.open(`/kaizen-get-by-data?maphieu=${maphieu}`, '_blank');
}

// Define an array of departments
const departments = [
    "", "PRO-CCD", "PRO-Sew", "Sewing A-C", "Sewing B", "MEC", "ID",
    "IE", "QA", "WH", "LOG", "PLANNING", "HR", "MAINT", "COMPL",
    "IT", "FIN-OPS", "FIN-PAYROLL", "FIN-SSC", "PD", "LAB", "PROCUREMENT"
];

// Populate the "Bộ phận" dropdown dynamically
const boPhanSelect = document.getElementById("boPhan");
departments.forEach(function (department) {
    const option = document.createElement("option");
    option.value = department;
    option.textContent = department;
    boPhanSelect.appendChild(option);
});


// Hàm gọi API
function fetchData() {
    const employee_id = document.getElementById("employee_id_search").value || '';  // Lấy mã nhân viên từ ô tìm kiếm
    const maphieu = sessionStorage.getItem("maphieu") || '';  // Lấy mã phiếu từ sessionStorage
    const boPhan = sessionStorage.getItem("boPhan") || '';  // Lấy bộ phận từ sessionStorage

    const status = currentStatus;
    //const url = `get-kaizen-system?page=${currentPage}&limit=${limit}&ma_nv=${employee_id}&status=${status}`;  // Tạo URL với các tham số
    const url = `get-kaizen-system?page=${currentPage}&limit=${limit}&ma_nv=${employee_id}&maphieu=${maphieu}&bo_phan=${boPhan}&status=${status}`;


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
                            <td>${user.maphieu || ''}</td>
                            <td>${user.ho_ten}</td>
                            <td>${user.thanhvien}</td>
                          
                            <td>${user.ma_nv}</td>
                            <td>${user.bo_phan}</td>
                            <td>${user.truong_phong}</td>                           
                            <td>
                                <div class="badge ${user.danh_gia === null ? 'badge-secondary' :
                            user.danh_gia === 1 ? 'badge-success' :
                                user.danh_gia === 2 ? 'badge-warning' :
                                    user.danh_gia === 3 ? 'badge-danger' :
                                        user.danh_gia === 4 ? 'badge-primary' : ''} badge-shadow">
                                                    ${user.danh_gia === null ? "Chưa đánh giá" :
                            user.danh_gia === 1 ? "Chấp nhận thực hiện" :
                                user.danh_gia === 2 ? "Cần phân tích thêm" :
                                    user.danh_gia === 3 ? "Không đồng ý" :
                                        user.danh_gia === 4 ? "Đăng ký trình bày báo cáo" : ''}
                                </div>
                            </td>


                            <td>${new Date(user.created_at).toLocaleString('vi-VN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' })}</td>
                          
                           
                            <td>
                                <div class="badge ${user.status === 4 ? 'badge-success' :
                            user.status === 5 ? 'badge-danger' :
                                'badge-default'
                        }">
                                    ${user.status === 4 ? "Approved" :
                            user.status === 5 ? "Rejected" :
                                "-"
                        }
                                </div>
                            </td>

                            <td>
                                <a href="javascript:void(0);" class="btn btn-primary" onclick="openDetailPage('${user.maphieu}')">Detail</a>
                            </td>

                          

                            <td>
                                ${(user.status === 2 || user.status === 3)
                            ? `<div class="btn-group" role="group" aria-label="Transaction Actions">
                                            <a class="btn btn-success text-white" onclick="approveKaizen('${user.maphieu}', '${user.email}', '${user.ma_nv}', '${user.ho_ten}','${user.danh_gia}','${user.status}')">Approved</a>
                                            <a class="btn btn-danger text-white" onclick="openRejectModal('${user.maphieu}', '${user.email}', '${user.ma_nv}', '${user.ho_ten}','${user.danh_gia}','${user.status}')">Rejected</a>
                                        </div>`
                            : ''
                        }
                            </td>




                        `;

                    tableBody.appendChild(row);  // Thêm hàng vào bảng
                });

                // Cập nhật phân trang
                updatePagination(data);

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
                alert("Không có dữ liệu người dùng.");
            }
        })
        .catch(error => {
            console.error('Error fetching data:', error);
            alert("Có lỗi xảy ra khi lấy dữ liệu.");
        });
}

// Gọi API cập nhật trạng thái
function updateKaizenStatus(maphieu, status, note, callback) {
    fetch('update-status-and-note', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ maphieu, status, note })
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                //alert(`Cập nhật thành công: ${note}`);
                iziToast.info({
                    title: "Thông báo",
                    message: "Biểu mẫu đang xử lý ...",
                    position: "topRight"
                });
                //location.reload();
                fetchData();  // Gọi lại API khi bấm tìm kiếm
                // Chỉ gọi gửi mail sau khi cập nhật thành công
                if (typeof callback === "function") {
                    callback();
                }
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
function approveKaizen(maphieu ,email_nv, id_nv, hoten, danhgia, status) {
    //updateKaizenStatus(maphieu, 4, "Done");
    //sendKaizenEmail(maphieu, email_nv, id_nv, hoten, danhgia, '4'); // Gửi email sau khi duyệt
    updateKaizenStatus(maphieu, 4, "Done", () => {
        sendKaizenEmail(maphieu, email_nv, id_nv, hoten, danhgia, '4');
    });
}

// Khi bấm Rejected thì mở modal nhập lý do
function openRejectModal(maphieu, email, ma_nv, ho_ten, danh_gia, status) {
    rejectMaphieu = maphieu;
    rejectemail_nv = email;
    rejectid_nv = ma_nv;
    rejecthoten = ho_ten;
    rejectdanhgia = danh_gia;
    document.getElementById("rejectNote").value = ""; // Xóa nội dung cũ
    $('#rejectModal').modal('show'); // Hiển thị modal với Bootstrap
}

// Khi xác nhận Rejected
function submitReject() {
    const note = document.getElementById("rejectNote").value.trim();
    if (!note) {
        //alert("Vui lòng nhập lý do từ chối!");
        iziToast.warning({
            title: "Cảnh báo",
            message: "Vui lòng nhập lý do từ chối!",
            position: "topRight"
        });
        return;
    }
    //updateKaizenStatus(rejectMaphieu, 5, note);
    updateKaizenStatus(rejectMaphieu, 5, note, () => {
        sendKaizenEmail(rejectMaphieu, rejectemail_nv, rejectid_nv, rejecthoten, rejectdanhgia, '5', note);
    });

    //sendKaizenEmail(rejectMaphieu, rejectemail_nv, rejectid_nv, rejecthoten, rejectdanhgia, '5', note); // Gửi email sau khi từ chối
    $('#rejectModal').modal('hide'); // Đóng modal
}




async function sendKaizenEmail(maphieu, email_nv, id_nv, hoten, danhgia, status, note = "") {
    const data = {
        maphieu,
        email_nv,
        id_nv,
        hoten,
        danhgia,
        status,
        note
    };

    console.log("📩 Dữ liệu gửi đi:", data);

    try {
        const response = await fetch('send-mail-app-final', {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });

        const result = await response.json();
        console.log("✅ Phản hồi từ server:", result);
        iziToast.success({
            title: "Thông báo",
            message: "Biểu mẫu đã được duyệt và gửi thành công!",
            position: "topRight"
        });
       // alert("Email đã được gửi thành công!");
    } catch (error) {
        console.error("❌ Lỗi khi gửi mail:", error);
       // alert("Lỗi khi gửi email!");
        iziToast.error({
            title: "lỗi",
            message: "Lỗi khi gửi mail:",
            position: "topRight"
        });
    }
}








// Lắng nghe sự kiện click trên nút tải xuống Excel từ date tới date
document.getElementById('exportExcelToDateBtn').addEventListener('click', function () {
    const startDate = document.getElementById('exportDateFrom').value;
    const endDate = document.getElementById('exportDateTo').value;
    const status = document.getElementById('status').value;

    // Kiểm tra nếu người dùng chưa chọn ngày
    if (!startDate || !endDate) {
        toastr.warning('Vui lòng chọn một khoảng thời gian.', 'Cảnh báo', {
            timeOut: 3000,
            progressBar: true,
            closeButton: true
        });
        return;
    }

    // Gửi yêu cầu API để tải xuống Excel
    fetch(`export-to-date-kaizen?date_from=${startDate}&date_to=${endDate}&status=${status}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    })
        //.then(response => response.blob()) // Nhận dữ liệu dưới dạng blob (file)
        .then(response => {
            if (response.ok) {
                return response.blob(); // Nhận dữ liệu dưới dạng blob (file)
            } else if (response.status === 403) {
                throw new Error('403: Bạn không có quyền truy cập.');
            } else {
                throw new Error('Không thể tải file.');
            }
        })
        .then(blob => {
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);  // Tạo URL cho file
            link.download = `data-${startDate}_to_${endDate}.xlsx`;  // Đặt tên file tải về
            link.click();  // Bắt đầu tải file
        })
        .catch((error) => {
            console.error('Lỗi khi tải file Excel:', error);
            if (error.message.includes('403')) {
                toastr.error('Bạn không có quyền tải file này!', 'Lỗi 403', {
                    timeOut: 3000,
                    progressBar: true,
                    closeButton: true,
                });
            } else {
                toastr.error('Đã xảy ra lỗi khi tải file.', 'Lỗi', {
                    timeOut: 3000,
                    progressBar: true,
                    closeButton: true,
                });
            }
        });
});


