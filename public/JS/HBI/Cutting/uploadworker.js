// đẩy file lên để xử lý thành json trước khi update
async  function uploadFile() {
    const fileInput = document.getElementById('fileInput');
    const file = fileInput.files[0]; // Lấy file từ input

    if (file) {
        const reader = new FileReader();

        // Đọc file dưới dạng binary
        reader.onload = async function (e) {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });

            // Lấy sheet đầu tiên
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];

            // Chuyển đổi sheet thành JSON
            const jsonData = XLSX.utils.sheet_to_json(firstSheet);

            console.log("JSON Data:", jsonData); // Kiểm tra dữ liệu JSON

            // Gửi JSON đến server
            await sendDataToServer(jsonData);
        };

        reader.readAsArrayBuffer(file);
    } else {
        toastr.warning("Vui lòng chọn một file Excel để tải lên!", "Cảnh báo", { timeOut: 700 });
    }
}

// Gọi API đẩy data vào DB
async function sendDataToServer(jsonData) {
    try {
        const response = await fetch('scanbarcode/update-worker', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(jsonData)
        });
        const data = await response.json();
        console.log('Response:', data);
        toastr.success("Dữ liệu đã được update thành công", "Thông báo", { timeOut: 700 });
    } catch (error) {
        console.error('Error:', error);
    }
}

// // Xử lý sự kiện tìm kiếm
// $('#searchForm').on('submit', async function (event) {
//    event.preventDefault(); // Ngăn chặn gửi form

//     const worker = $('#worker').val();
//     const updatedAt = $('#updatedAt').val();
//     const barcode = $('#barcode').val(); // Trường mới
//     const startTime = $('#startTime').is(':checked');
//     const endTime = $('#endTime').is(':checked');
//     const onlyIncomplete = $('#onlyIncomplete').is(':checked');

//     // Gọi API để lấy dữ liệu
//     const response = await fetch(`scanbarcode/processtracking?worker=${worker}&updatedAt=${updatedAt}&barcode=${barcode}&startTime=${startTime}&endTime=${endTime}&onlyIncomplete=${onlyIncomplete}&page=${currentPage}&pageSize=${pageSize}`);
//     const results = await response.json();

//     // Hiển thị dữ liệu trong bảng
//     const tableBody = $('#resultsTableBody');
//     tableBody.empty(); // Xóa nội dung cũ

//     results.data.forEach(item => {
//         tableBody.append(`
//             <tr>
//                 <td>${item.barcode}</td>
//                 <td>${item.worker || 'Chưa phân công'}</td>
//                 <td>${item.start_time ? new Date(item.start_time).toLocaleString() : '-'}</td>
//                 <td>${item.end_time ? new Date(item.end_time).toLocaleString() : '-'}</td>
//                <td>${item.time_actual ? formatTime(item.time_actual) : '-'}</td>

//             </tr>
//         `);
//     });
//     // Hiển thị thông tin phân trang (tổng số bản ghi, tổng số trang, trang hiện tại)
//     const paginationInfo = $('#paginationInfo');
//     paginationInfo.text(`Trang ${results.currentPage} / ${results.totalPages} | Tổng số bản ghi: ${results.totalRecords}`);
//     console.log(results.currentPage, results.totalPages, results.totalRecords)
//     // Cập nhật các nút phân trang
//     updatePaginationButtons(results.currentPage, results.totalPages);
// });
// // Hàm cập nhật các nút phân trang
// function updatePaginationButtons(currentPage, totalPages) {
//     const prevButton = $('#prevPageButton');
//     const nextButton = $('#nextPageButton');

//     // Kích hoạt hoặc vô hiệu hóa nút "Tiếp theo"
//     nextButton.prop('disabled', currentPage >= totalPages);

//     // Kích hoạt hoặc vô hiệu hóa nút "Trước"
//     prevButton.prop('disabled', currentPage <= 1);
// }

// // Xử lý khi người dùng nhấn nút "Trước"
// $('#prevPageButton').on('click', function () {
//     if (currentPage > 1) {
//         currentPage--;
//         $('#searchForm').submit(); // Gửi lại form để lấy kết quả trang mới
//     }
// });

// // Xử lý khi người dùng nhấn nút "Tiếp theo"
// $('#nextPageButton').on('click', function () {
//     currentPage++;
//     $('#searchForm').submit(); // Gửi lại form để lấy kết quả trang mới
// });



// // Hàm chuyển đổi chuỗi thời gian (hh:mm:ss) thành giờ phút giây
// function formatTime(time) {
//     if (!time) return '-';  // Trả về dấu '-' nếu không có thời gian

//     const timeParts = time.split(':');  // Tách chuỗi thành mảng [hour, minute, second]

//     const hours = parseInt(timeParts[0], 10);  // Giờ
//     const minutes = parseInt(timeParts[1], 10);  // Phút
//     const seconds = parseInt(timeParts[2], 10);  // Giây

//     // Nếu giờ là 0, chỉ hiển thị phút và giây
//     if (hours === 0) {
//         return `${minutes} phút ${seconds} giây`;
//     }

//     // Trả về định dạng "x giờ y phút z giây"
//     return `${hours} giờ ${minutes} phút ${seconds} giây`;
// }

// let currentPage = 1;
// let pageSize = 10;  // Số bản ghi mỗi trang
// Xử lý sự kiện tìm kiếm
$('#searchForm').on('submit', async function (event) {
    event.preventDefault(); // Ngăn chặn gửi form

    const worker = $('#worker').val();
    const updatedAt = $('#updatedAt').val();
    const barcode = $('#barcode').val(); // Trường mới
    const startTime = $('#startTime').is(':checked');
    const endTime = $('#endTime').is(':checked');
    const onlyIncomplete = $('#onlyIncomplete').is(':checked');

    // Gọi API để lấy dữ liệu với trang hiện tại và kích thước trang
    const response = await fetch(`scanbarcode/processtracking?worker=${worker}&updatedAt=${updatedAt}&barcode=${barcode}&startTime=${startTime}&endTime=${endTime}&onlyIncomplete=${onlyIncomplete}&page=${currentPage}&pageSize=${pageSize}`);
    const results = await response.json();

    // Kiểm tra xem API có trả về kết quả không
    if (!results || !results.data) {
        alert('Không có dữ liệu để hiển thị.');
        return;
    }

    // Hiển thị dữ liệu trong bảng
    const tableBody = $('#resultsTableBody');
    tableBody.empty(); // Xóa nội dung cũ

    results.data.forEach(item => {
        tableBody.append(`
            <tr>
                <td>${item.barcode}</td>
                <td>${item.worker || 'Chưa phân công'}</td>
                <td>${item.start_time ? new Date(item.start_time).toLocaleString() : '-'}</td>
                <td>${item.end_time ? new Date(item.end_time).toLocaleString() : '-'}</td>
                <td>${item.time_actual ? formatTime(item.time_actual) : '-'}</td>
            </tr>
        `);
    });

    // Hiển thị thông tin phân trang (tổng số bản ghi, tổng số trang, trang hiện tại)
    const paginationInfo = $('#paginationInfo');
    paginationInfo.text(`Trang ${results.currentPage} / ${results.totalPages} | Tổng số bản ghi: ${results.totalRecords}`);

    // Cập nhật các nút phân trang
    updatePaginationButtons(results.currentPage, results.totalPages);
});

// Hàm cập nhật các nút phân trang
function updatePaginationButtons(currentPage, totalPages) {
    const prevButton = $('#prevPageButton');
    const nextButton = $('#nextPageButton');

    // Kích hoạt hoặc vô hiệu hóa nút "Tiếp theo"
    nextButton.prop('disabled', currentPage >= totalPages);

    // Kích hoạt hoặc vô hiệu hóa nút "Trước"
    prevButton.prop('disabled', currentPage <= 1);
}
// Xử lý khi người dùng nhấn nút "Trước"
$('#prevPageButton').on('click', function () {
    if (currentPage > 1) {
        currentPage--;  // Giảm số trang
        fetchSearchResults(); // Gọi lại hàm tìm kiếm với trang mới
    }
});

// Xử lý khi người dùng nhấn nút "Tiếp theo"
$('#nextPageButton').on('click', function () {
    currentPage++;  // Tăng số trang
    fetchSearchResults(); // Gọi lại hàm tìm kiếm với trang mới
});
// Hàm gọi API tìm kiếm lại với trang mới
async function fetchSearchResults() {
    // Lấy lại giá trị các trường tìm kiếm hiện tại
    const worker = $('#worker').val();
    const updatedAt = $('#updatedAt').val();
    const barcode = $('#barcode').val(); // Trường mới
    const startTime = $('#startTime').is(':checked');
    const endTime = $('#endTime').is(':checked');
    const onlyIncomplete = $('#onlyIncomplete').is(':checked');

    // Gọi API để lấy dữ liệu với trang hiện tại và kích thước trang
    const response = await fetch(`scanbarcode/processtracking?worker=${worker}&updatedAt=${updatedAt}&barcode=${barcode}&startTime=${startTime}&endTime=${endTime}&onlyIncomplete=${onlyIncomplete}&page=${currentPage}&pageSize=${pageSize}`);
    const results = await response.json();

    // Kiểm tra xem API có trả về kết quả không
    if (!results || !results.data) {
        alert('Không có dữ liệu để hiển thị.');
        return;
    }

    // Hiển thị dữ liệu trong bảng
    const tableBody = $('#resultsTableBody');
    tableBody.empty(); // Xóa nội dung cũ

    results.data.forEach(item => {
        tableBody.append(`
            <tr>
                <td>${item.barcode}</td>
                <td>${item.worker || 'Chưa phân công'}</td>
                <td>${item.start_time ? new Date(item.start_time).toLocaleString() : '-'}</td>
                <td>${item.end_time ? new Date(item.end_time).toLocaleString() : '-'}</td>
                <td>${item.time_actual ? formatTime(item.time_actual) : '-'}</td>
            </tr>
        `);
    });

    // Hiển thị thông tin phân trang (tổng số bản ghi, tổng số trang, trang hiện tại)
    const paginationInfo = $('#paginationInfo');
    paginationInfo.text(`Trang ${results.currentPage} / ${results.totalPages} | Tổng số bản ghi: ${results.totalRecords}`);

    // Cập nhật các nút phân trang
    updatePaginationButtons(results.currentPage, results.totalPages);
}

// Hàm chuyển đổi chuỗi thời gian (hh:mm:ss) thành giờ phút giây
function formatTime(time) {
    if (!time) return '-';  // Trả về dấu '-' nếu không có thời gian

    const timeParts = time.split(':');  // Tách chuỗi thành mảng [hour, minute, second]

    const hours = parseInt(timeParts[0], 10);  // Giờ
    const minutes = parseInt(timeParts[1], 10);  // Phút
    const seconds = parseInt(timeParts[2], 10);  // Giây

    // Nếu giờ là 0, chỉ hiển thị phút và giây
    if (hours === 0) {
        return `${minutes} phút ${seconds} giây`;
    }

    // Trả về định dạng "x giờ y phút z giây"
    return `${hours} giờ ${minutes} phút ${seconds} giây`;
}

let currentPage = 1;
let pageSize = 10;  // Số bản ghi mỗi trang
