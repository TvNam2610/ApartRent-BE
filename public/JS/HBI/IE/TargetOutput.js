
let currentPage = 1; // Trang hiện tại
let totalPages = 1; // Tổng số trang
let limit = 5; // Số bản ghi mỗi trang

// Lắng nghe sự kiện khi người dùng thay đổi số lượng bản ghi mỗi trang
document.getElementById('limitSelect').addEventListener('change', function () {
    limit = parseInt(this.value); // Lấy giá trị mới của limit
    currentPage = 1; // Reset lại về trang đầu tiên
    fetchHistory(currentPage, limit); // Gọi lại API với số lượng bản ghi mới và trang đầu tiên
});
document.getElementById('searchCode').addEventListener('input', function () {
    // Khi có thay đổi trong ô tìm kiếm, gọi lại fetchHistory với trang hiện tại và số lượng bản ghi
    const currentPage = 1; // Ví dụ, đặt lại về trang 1 khi thay đổi tìm kiếm
    const limit = parseInt(document.getElementById('limitSelect').value) || 10;
    fetchHistory(currentPage, limit);
});

// Tự động gọi api
document.addEventListener('DOMContentLoaded', () => {
    fetchHistory(currentPage,limit); // Gọi API tìm kiếm khi trang được tải
});

// Lắng nghe sự kiện thay đổi của ngày cố định và khoảng ngày
document.addEventListener('DOMContentLoaded', function () {
    const exactDateInput = document.getElementById('exactDate');
    const startDateInput = document.getElementById('startDate');
    const endDateInput = document.getElementById('endDate');

    // Khi chọn ngày cố định, ẩn khoảng ngày
    exactDateInput.addEventListener('change', function() {
        if (exactDateInput.value) {
            startDateInput.disabled = true;
            endDateInput.disabled = true;
        } else {
            startDateInput.disabled = false;
            endDateInput.disabled = false;
        }
    });

    // Khi chọn khoảng ngày, ẩn ngày cố định
    startDateInput.addEventListener('change', function() {
        if (startDateInput.value && endDateInput.value) {
            exactDateInput.disabled = true;
        } else {
            exactDateInput.disabled = false;
        }
    });

    endDateInput.addEventListener('change', function() {
        if (startDateInput.value && endDateInput.value) {
            exactDateInput.disabled = true;
        } else {
            exactDateInput.disabled = false;
        }
    });
});
// Lắng nghe sự kiện thay đổi ngày
document.getElementById('exactDate').addEventListener('change', function() {
    const currentPage = 1; // Reset về trang đầu
    const limit = parseInt(document.getElementById('limitSelect').value) || 5; // Số bản ghi mỗi trang
    fetchHistory(currentPage, limit); // Gọi lại API khi chọn ngày cố định
});

document.getElementById('startDate').addEventListener('change', function() {
    const currentPage = 1; // Reset về trang đầu
    const limit = parseInt(document.getElementById('limitSelect').value) || 5; // Số bản ghi mỗi trang
    fetchHistory(currentPage, limit); // Gọi lại API khi chọn khoảng ngày
});

document.getElementById('endDate').addEventListener('change', function() {
    const currentPage = 1; // Reset về trang đầu
    const limit = parseInt(document.getElementById('limitSelect').value) || 5; // Số bản ghi mỗi trang
    fetchHistory(currentPage, limit); // Gọi lại API khi chọn khoảng ngày
});
document.getElementById('workShop').addEventListener('change', function() {
    const currentPage = 1; // Reset về trang đầu
    const limit = parseInt(document.getElementById('limitSelect').value) || 5; // Số bản ghi mỗi trang
    fetchHistory(currentPage, limit); // Gọi lại API khi chọn khoảng ngày
});



// Hàm gọi API phân trang lịch sử
async function fetchHistory( page, limit) {
    try {
        // Lấy giá trị tìm kiếm từ ô tìm kiếm (searchCode)
        const searchCode = document.getElementById('searchCode').value.trim(); // Lấy giá trị tìm kiếm từ ô input

        const exactDate = document.getElementById('exactDate').value;
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;
        const workShop = document.getElementById('workShop').value


        //const response = await fetch(`warehouseInternal/get-history-print-internal?page=${page}&limit=${limit}`);
        // Tạo URL với tham số tìm kiếm nếu có
        let url = `TargetOutput/get-history-output-target?page=${page}&limit=${limit}`;
        if (searchCode) {
            url += `&searchCode=${encodeURIComponent(searchCode)}`; // Thêm tham số tìm kiếm vào URL
        }
        if (exactDate) {
            url += `&exactDate=${encodeURIComponent(exactDate)}`;
        }
        // if (startDate) {
        //     url += `&startDate=${encodeURIComponent(startDate)}`;
        // }
        // if (endDate) {
        //     url += `&endDate=${encodeURIComponent(endDate)}`;
        // }
        // Chỉ gửi tham số khoảng ngày nếu có
        if (startDate && endDate) {
            url += `&startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`;
        }
        if (workShop) {
            url += `&workShop=${encodeURIComponent(workShop)}`;
        }
        
        const response = await fetch(url);
        const result = await response.json();

        // Kiểm tra dữ liệu trả về từ API
        if (result && result.data && result.data.length > 0) {
            // Cập nhật dữ liệu vào bảng
            displayHistoryData(result.data);
            totalPages = result.totalPages; // Cập nhật tổng số trang
            renderPaginationControls(); // Render phân trang
            renderPageInfo(); // Hiển thị thông tin trang hiện tại

        } else {
            toastr.info('Không tìm thấy dữ liệu.', 'Thông báo', {
                timeOut: 3000,
                progressBar: true,
                closeButton: true
            });
        }
    } catch (error) {
        console.error('Error fetching history data:', error);
        toastr.error('Lỗi gọi API', 'Lỗi', {
            timeOut: 3000,
            progressBar: true,
            closeButton: true
        });
    }
}

// hàm quy đổi time
function formatDateTime(isoString) {
    if (!isoString) {
        return ''; // Hoặc trả về 'Chưa có dữ liệu'
    }
    const date = new Date(isoString);
    const day = String(date.getDate()).padStart(2, '0'); // Lấy ngày và thêm số 0 ở đầu nếu cần
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Tháng (0-11 nên cộng thêm 1)
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0'); // Giờ
    const minutes = String(date.getMinutes()).padStart(2, '0'); // Phút
    const seconds = String(date.getSeconds()).padStart(2, '0'); // Giây

    return `${day}-${month}-${year} ${hours}:${minutes}:${seconds}`; // Định dạng kết quả
}
// hàm quy đổi time
function formatDate(isoString) {
    if (!isoString) {
        return ''; // Hoặc trả về 'Chưa có dữ liệu'
    }
    const date = new Date(isoString);
    const day = String(date.getDate()).padStart(2, '0'); // Lấy ngày và thêm số 0 ở đầu nếu cần
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Tháng (0-11 nên cộng thêm 1)
    const year = date.getFullYear();

    return `${day}-${month}-${year}`; // Định dạng kết quả
}


// Hàm hiển thị dữ liệu vào bảng
function displayHistoryData(data) {
    const historyTableBody = document.getElementById('historyTableBody');
    historyTableBody.innerHTML = ''; // Làm mới bảng trước khi thêm dữ liệu mới

    // Duyệt qua dữ liệu và thêm vào bảng
    data.forEach(item => {
        const newRow = document.createElement('tr');
        newRow.innerHTML = `
            <td>${item.line|| '-'}</td>
            <td>${item.zone|| '-'}</td>
            <td>${item.work_center|| '-'}</td>
            <td>${item.work_shop|| '-'}</td>
            <td>${item.shift}</td>
            <td>${item.style|| '-'}</td>
            <td>${formatDate(item.date) || '-'}</td>
            <td>${item.target_eff * 100 || '-'}</td>
            <td>${item.target_output|| '-'}</td>
           <td>${formatDateTime(item.updated_at) || '-'}</td>
        `;
        historyTableBody.appendChild(newRow);
    });
}


function renderPaginationControls() {
    const paginationControls = document.getElementById('paginationControls');
    paginationControls.innerHTML = ''; // Làm mới phân trang trước khi thêm mới

    // Hàm giúp xác định các trang cần hiển thị
    function getVisiblePages() {
        const pages = [];
        const start = Math.max(1, currentPage - 2); // Trang bắt đầu (2 trang trước trang hiện tại)
        const end = Math.min(totalPages, currentPage + 2); // Trang kết thúc (2 trang sau trang hiện tại)

        for (let i = start; i <= end; i++) {
            pages.push(i);
        }

        return pages;
    }

    // Render nút "Previous" (trang trước)
    const prevButton = document.createElement('li');
    prevButton.classList.add('page-item');
    prevButton.classList.toggle('disabled', currentPage === 1);
    prevButton.innerHTML = `<a href="#" class="page-link">« Trước</a>`;
    prevButton.addEventListener('click', (event) => {
        event.preventDefault();
        changePage(currentPage - 1);
    });
    paginationControls.appendChild(prevButton);

    // Lấy danh sách các trang cần hiển thị
    const visiblePages = getVisiblePages();

    // Render các nút trang
    visiblePages.forEach(page => {
        const pageButton = document.createElement('li');
        pageButton.classList.add('page-item');
        pageButton.classList.toggle('active', page === currentPage);
        pageButton.innerHTML = `<a href="#" class="page-link">${page}</a>`;
        pageButton.addEventListener('click', (event) => {
            event.preventDefault();
            changePage(page);
        });
        paginationControls.appendChild(pageButton);
    });

    // Render nút "Next" (trang sau)
    const nextButton = document.createElement('li');
    nextButton.classList.add('page-item');
    nextButton.classList.toggle('disabled', currentPage === totalPages);
    nextButton.innerHTML = `<a href="#" class="page-link">Sau »</a>`;
    nextButton.addEventListener('click', (event) => {
        event.preventDefault();
        changePage(currentPage + 1);
    });
    paginationControls.appendChild(nextButton);
}

// Hàm thay đổi trang
function changePage(page) {
    if (page < 1 || page > totalPages) return; // Kiểm tra trang hợp lệ

    currentPage = page;
    fetchHistory(currentPage, limit); // Gọi lại API với trang mới
}

// Hàm hiển thị thông tin trang hiện tại và tổng số trang
function renderPageInfo() {
    const pageInfo = document.getElementById('currentPageInfo');
    pageInfo.textContent = `Trang ${currentPage} trên ${totalPages}`;
}







