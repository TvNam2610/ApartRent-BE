
document.addEventListener("DOMContentLoaded", () => {

    document.getElementById('searchBtn').addEventListener('click', fetchAndDisplayResults);
    document.getElementById('barcodeInput').addEventListener('change', scanBarcode);
    // Lắng nghe sự kiện click trên nút tải xuống Excel
    document.getElementById('exportExcelBtn').addEventListener('click', function () {
        const exportDate = document.getElementById('exportDate').value;

        // Kiểm tra xem người dùng đã chọn ngày chưa
        if (!exportDate) {
            toastr.warning('Vui lòng chọn ngày để xuất dữ liệu.', 'Cảnh báo', {
                timeOut: 3000,
                progressBar: true,
                closeButton: true
            });
            return;
        }

        // Gửi yêu cầu GET đến API để tải dữ liệu
        fetch(`warehouse-returns/export?date=${exportDate}`)
            .then(response => {
                if (response.ok) {
                    return response.blob();  // Nhận dữ liệu dưới dạng file blob
                }
                else if (response.status === 403) {
                    throw new Error('403: Bạn không có quyền truy cập.');
                } else {
                    throw new Error('Không thể tải dữ liệu.');
                }
            })
            .then(blob => {
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `warehouse_returns_${exportDate}.xlsx`;  // Đặt tên file tải xuống
                document.body.appendChild(a);
                a.click();
                a.remove();
            })
            .catch(error => {
                console.error(error);
                // alert('Đã xảy ra lỗi khi tải xuống.');
                if (error.message.includes('403')) {
                    toastr.error('Bạn không có quyền truy cập!', 'Lỗi 403', {
                        timeOut: 3000,
                        progressBar: true,
                        closeButton: true,
                    });
                } else {
                    toastr.error('Đã xảy ra lỗi khi tải xuống.', 'Lỗi', {
                        timeOut: 3000,
                        progressBar: true,
                        closeButton: true,
                    });
                }
            });
    });


    document.getElementById('exportExcelToDateBtn').addEventListener('click', function () {
        const startDate = document.getElementById('exportDateFrom').value;
        const endDate = document.getElementById('exportDateTo').value;

        // Kiểm tra nếu người dùng chưa chọn ngày
        if (!startDate || !endDate) {
            toastr.warning('Vui lòng chọn một khoảng thời gian.', 'Cảnh báo', {
                timeOut: 3000,
                progressBar: true,
                closeButton: true
            });
            return;
        }
        console.log(startDate, endDate)
        // Gửi yêu cầu API để tải xuống Excel
        fetch(`warehouse-returns/export-to-date?date_from=${startDate}&date_to=${endDate}`, {
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
});






function convertExcelDate(excelDate) {
    if (typeof excelDate === 'number') {
        const date = new Date((excelDate - 25569) * 86400 * 1000);
        return date;
    }
    return null; // Hoặc xử lý trường hợp khác nếu cần
}

// Hàm định dạng đối tượng Date thành chuỗi YYYY-MM-DD
function formatDateToYYYYMMDD(date) {
    if (!(date instanceof Date) || isNaN(date.getTime())) return null; // Kiểm tra nếu date hợp lệ
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Thêm 0 ở trước nếu tháng < 10
    const day = String(date.getDate()).padStart(2, '0'); // Thêm 0 ở trước nếu ngày < 10
    return `${year}-${month}-${day}`; // Định dạng YYYY-MM-DD
}

async function uploadFile() {
    const fileUpload = document.getElementById('fileUpload');
    const file = fileUpload.files[0]; // Lấy file từ input

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
            // Hiển thị loading spinner
            showLoading();
            // Gửi dữ liệu theo từng phần
            await sendDataInChunks(jsonData, 300); // Chia thành các phần 300 bản ghi

            // Ẩn modal loading khi quá trình hoàn tất
            hideLoading();
        };

        reader.readAsArrayBuffer(file);
    } else {
        toastr.warning("Vui lòng chọn một file Excel để tải lên!", "Cảnh báo", { timeOut: 700 });
        // Ẩn spinner loading nếu không có file
        hideLoading(); // Gọi hideLoading để ẩn spinner nếu không có file
    }
}

// Gọi API đẩy data vào DB theo từng phần
async function sendDataInChunks(jsonData, chunkSize) {
    const totalChunks = Math.ceil(jsonData.length / chunkSize); // Tính số phần cần gửi

    for (let i = 0; i < totalChunks; i++) {
        const chunk = jsonData.slice(i * chunkSize, (i + 1) * chunkSize); // Lấy phần dữ liệu cần gửi

        // Chuyển đổi dữ liệu cho từng bản ghi trong chunk
        const processedChunk = chunk.map(row => {
            const Date = convertExcelDate(row.Date); // Chuyển đổi ngày
            return {
                ...row,
                Date: formatDateToYYYYMMDD(Date), // Định dạng ngày
            };
        });

        try {
            const response = await fetch('warehousemanagement/insert-warehousereturns', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(processedChunk) // Gửi từng phần
            });
            // const data = await response.json();
            // console.log(`Response for chunk ${i + 1}:`, data);

            // toastr.success(`Đã gửi phần ${i + 1} dữ liệu lên server`, "Thông báo", { timeOut: 700 });


            if (response.ok) {
                const data = await response.json();
                console.log(`Response for chunk ${i + 1}:`, data);
                toastr.success(`Đã gửi phần ${i + 1} dữ liệu lên server`, "Thông báo", { timeOut: 3000 });
            } else if (response.status === 403) {
                toastr.error('Bạn không có quyền tải lên bản ghi này!', 'Lỗi', {
                    timeOut: 3000,
                    progressBar: true,
                    closeButton: true,
                });
                return; // Dừng xử lý ở đây, không chạy xuống các khối khác
            } else {
                console.error(`Unhandled error: HTTP ${response.status} for chunk ${i + 1}`);
                toastr.error(`Đã xảy ra lỗi HTTP ${response.status} khi gửi phần ${i + 1}`, "Lỗi", { timeOut: 3000 });
            }

            // Ẩn modal loading khi quá trình hoàn tất

            // Thêm thời gian chờ trước khi gửi phần tiếp theo
            // await new Promise(resolve => setTimeout(resolve, 2000)); // Chờ 2 giây
        } catch (error) {
            console.error('Error:', error);
            toastr.error(`Đã xảy ra lỗi khi gửi phần ${i + 1} dữ liệu lên server`, "Lỗi", { timeOut: 1000 });
            // Có thể dừng quá trình gửi nếu gặp lỗi, hoặc bạn có thể tiếp tục với các phần còn lại
            // break; 
        }
    }
    // Ẩn loading spinner khi đã gửi tất cả các chunk
    hideLoading();


}


// Hiển thị loading spinner
function showLoading() {
    document.getElementById('loadingModal').style.display = 'block'; // Hiển thị modal
}

// Ẩn loading spinner
function hideLoading() {
    document.getElementById('loadingModal').style.display = 'none'; // Ẩn modal
}



// end excel//




document.getElementById('searchBtn').addEventListener('click', async function () {
    await fetchAndDisplayResults();
});

// Hm quét mã vạch
async function scanBarcode() {
    const barcodeInput = document.getElementById('barcodeInput');
    const barcode = barcodeInput.value.trim();

    // Kiểm tra xem có mã vạch nào được nhập không
    if (!barcode) {
        toastr.warning("Vui lòng nhập mã vạch để quét!", "Cảnh báo", { timeOut: 1500 });
        return;
    }

    // Gọi hàm tìm kiếm với mã vạch đã quét
    await scanBarcodeApi(barcode);
}

// Hàm API quét mã vạch
async function scanBarcodeApi(barcode) {
    try {
        // Gửi yêu cầu POST đến API với mã vạch
        const response = await fetch(`warehouse-returns/search?barcode=${barcode}`);

        const result = await response.json(); // Chuyển đổi phản hồi sang JSON

        // Kiểm tra phản hồi từ server
        if (response.ok) {
            toastr.success("Quét thành công", "Thông báo", { timeOut: 1500 });
            displayResults(result); // Cập nhật bảng với dữ liệu sau khi quét barcode thành công

        } else {
            toastr.warning("Lỗi khi quét mã vạch: ", "Lỗi", { timeOut: 1500 });
        }
    } catch (error) {
        toastr.error("Có lỗi xảy ra khi quét mã vạch", "Lỗi", { timeOut: 1500 });
    }
    finally {
        barcodeInput.value = ''; // Reset ô input
    }
}



// Hàm api lấy dữ liệu chính của trang
async function fetchAndDisplayResults() {
    const formData = new FormData(document.getElementById('searchForm'));
    const params = new URLSearchParams(formData).toString();


    try {
        const response = await fetch(`warehouse-returns/search?${params}`);
        const result = await response.json();

        if (response.ok) {
            displayResults(result);
        } else {
            console.error('Lỗi khi tìm kiếm:', result.error);
            alert(result.error);
        }
    } catch (error) {
        console.error('Có lỗi xảy ra:', error);
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

    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`; // Định dạng kết quả
}


// hàm hiển thị dữ liệu
function displayResults(result) {
    const resultsBody = document.getElementById('resultsBody');
    resultsBody.innerHTML = ''; // Xóa nội dung cũ

    // Lấy thông tin người dùng từ localStorage
    const user = JSON.parse(localStorage.getItem('user')); // Lấy dữ liệu user từ localStorage
    const userRole = user ? user.position : []; // Lấy danh sách quyền của người dùng (ADMIN, ADMIN_IE, v.v.)
    result.data.forEach(item => {
        // Kiểm tra và hiển thị cảnh báo nếu cần



        const row = document.createElement('tr');

        row.dataset.id = item.id;  // Lưu ID vào thuộc tính dataset của tr
        row.dataset.status = item.status; // Lưu trạng thái vào dataset


        row.innerHTML = `
            <td>${item.id}</td>
            <td>${item.assortment}</td>
            <td>${item.ma}</td>
            <td>${item.qty_return_conver || ''}</td>
            <td>${item.unit || ''}</td>
            <td>${item.qty_loi || '-'}</td>
            <td>${item.return_user || ''}</td>
            <td>${item.return_line || ''}</td>
            <td>${formatDateTime(item.return_time) || ''}</td>

            <td>${item.location || ''}</td>
            <td class="status ${getStatusClass(item.status)}">${getStatusText(item.status)}</td>
            
          
           

            <td>
              
            <button class="btn btn-primary btn-print" id="printAgainBtn"
            data-barcode="${item.barcode}" 
            data-material="${item.ma}" 
            data-conversion="${item.qty_return_conver}" 
            data-unit="${item.unit}"
            data-location="${item.location}"
            data-core="${item.qty_loi}" 
            data-nvreturn="${item.return_user}">In lại</button>
            

                ${['ADMIN', 'ADMIN_WH'].includes(userRole) ?
                `<button class="btn btn-primary btn-status" data-id="${item.id}" data-status="${item.status}">Sửa</button>` : ''}                   
               

                ${item.status === 1 ? `
                    <button class="btn btn-success" onclick="updateStatus(${item.id}, 'yes')">Duyệt</button>
                ` : item.status === 2 ? `
                    <button class="btn btn-success" onclick="updateStatus(${item.id}, 'yes')">Duyệt</button>
                    <button class="btn btn-danger" onclick="updateStatus(${item.id},'no')">Hủy</button>
                ` : ''}
            </td>

            
        `;
        resultsBody.appendChild(row);
    });

    setupPagination(result.totalRecords, result.totalPages, result.currentPage);

}

// hàm cập nhật trạng thái
function updateStatus(itemId, action) {
    const row = document.querySelector(`tr[data-id="${itemId}"]`);  // Tìm dòng có ID tương ứng
    const statusCell = row.querySelector('td:nth-child(11)');

    // Kiểm tra nếu không tìm thấy ô trạng thái (statusCell)
    if (!statusCell) {
        console.error('Không tìm thấy ô trạng thái trong dòng', row);
        return; // Dừng hàm nếu không tìm thấy ô trạng thái
    }

    let newStatus;

    // Kiểm tra hành động là "Yes" hay "No"
    if (action === 'yes') {
        const currentStatus = parseInt(row.dataset.status);  // Lấy trạng thái hiện tại từ dataset

        // Nếu bấm Yes, thay đổi trạng thái tùy theo trạng thái hiện tại
        switch (currentStatus) {
            case 1:
                newStatus = 2; // Nếu status = 1, thay đổi thành 2
                break;
            case 2:
                newStatus = 3; // Nếu status = 2, thay đổi thành 3
                break;
            default:
                newStatus = currentStatus; // Giữ nguyên nếu không khớp trạng thái nào
        }
    } else if (action === 'no') {
        const currentStatus = parseInt(row.dataset.status);  // Lấy trạng thái hiện tại từ dataset

        // // Nếu bấm No, thay đổi trạng thái theo điều kiện mới
        // switch (currentStatus) {
        //     case 2:
        //         newStatus = 4; // Nếu status = 2, thay đổi thành 4 hoặc 7 hoặc 8
        //         break;
        //     default:
        //         newStatus = currentStatus; // Giữ nguyên nếu không khớp trạng thái nào
        // }
        // Nếu bấm No, hiển thị modal để người dùng chọn trạng thái
        if (currentStatus === 2) {
            showModal(itemId);  // Hiển thị modal khi trạng thái là 2
        } else {
            newStatus = currentStatus; // Giữ nguyên nếu không khớp trạng thái nào
            statusCell.className = getStatusClass(newStatus);
            statusCell.innerText = getStatusText(newStatus);
        }
    }
    // Hàm hiển thị modal
    function showModal(itemId) {
        const modal = document.getElementById('statusModalitem');
        const confirmButton = document.getElementById('confirmStatusChange');
        const cancelButton = document.getElementById('cancelStatusChange');
        const select = document.getElementById('statusReasonSelect');

        // Mở modal
        modal.style.display = 'block';

        // Xử lý khi bấm xác nhận
        confirmButton.onclick = function () {
            const selectedStatus = parseInt(select.value);  // Lấy giá trị đã chọn từ dropdown
            const row = document.querySelector(`tr[data-id="${itemId}"]`);
            const statusCell = row.querySelector('td:nth-child(11)');

            // Cập nhật trạng thái
            row.dataset.status = selectedStatus;
            statusCell.className = getStatusClass(selectedStatus);
            statusCell.innerText = getStatusText(selectedStatus);

            // Đóng modal
            modal.style.display = 'none';
            console.log(itemId, selectedStatus)
            // Cập nhật trạng thái qua AJAX (nếu cần)
            updateItemStatus(itemId, selectedStatus);
        };

        // Xử lý khi bấm hủy
        cancelButton.onclick = function () {
            modal.style.display = 'none';  // Đóng modal nếu người dùng bấm hủy
        };
    }

    // Cập nhật lại trạng thái hiển thị trên giao diện
    statusCell.className = getStatusClass(newStatus);
    statusCell.innerText = getStatusText(newStatus);

    // Cập nhật trạng thái mới vào dữ liệu (có thể gửi yêu cầu AJAX tới server để lưu)
    row.dataset.status = newStatus;

    // Gọi hàm cập nhật trạng thái vào hệ thống
    updateItemStatus(itemId, newStatus);

}


// Hàm gửi yêu cầu AJAX (giả lập) để cập nhật trạng thái
function updateItemStatus(itemId, newStatus) {
    console.log(`Cập nhật trạng thái của item ${itemId} thành ${newStatus}`);

    // Giả sử bạn gửi yêu cầu AJAX tới server để cập nhật trạng thái:
    fetch(`warehouse-returns/update-status/${itemId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus, whUser: username }) // Giả sử username đã được khai báo từ trước
    })
        .then(response => response.json())
        .then(data => {
            console.log('Trạng thái đã được cập nhật:', data);
            // Sau khi cập nhật trạng thái thành công, bạn có thể làm gì đó (ví dụ: làm mới giao diện hoặc gọi API khác)
            // Cập nhật giao diện nếu cần thiết
            changePage(document.getElementById('searchForm').getAttribute('data-page'));

        })
        .catch((error) => {
            console.error('Lỗi khi cập nhật trạng thái:', error);
        });
}



// Phân trang
function setupPagination(totalRecords, totalPages, currentPage) {
    const pagination = document.getElementById('pagination');
    pagination.innerHTML = ''; // Xóa nội dung cũ
    // Hiển thị thông tin trang hiện tại
    const pageInfo = document.createElement('div');
    pageInfo.className = 'page-info';
    pageInfo.textContent = `Trang ${currentPage} trên ${totalPages}`;
    pagination.appendChild(pageInfo);
    // Tạo nút Previous
    const prevButton = document.createElement('button');
    prevButton.textContent = '« Trước';
    prevButton.disabled = currentPage === 1;
    prevButton.addEventListener('click', () => changePage(currentPage - 1));
    pagination.appendChild(prevButton);

    // Số trang hiển thị xung quanh trang hiện tại
    const maxVisiblePages = 5; // Tổng số nút trang hiển thị
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    // Điều chỉnh startPage nếu endPage vượt quá totalPages
    if (endPage - startPage < maxVisiblePages - 1) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    // Tạo nút cho các trang
    for (let i = startPage; i <= endPage; i++) {
        const pageButton = document.createElement('button');
        pageButton.textContent = i;
        pageButton.className = currentPage === i ? 'active' : '';
        pageButton.addEventListener('click', () => changePage(i));
        pagination.appendChild(pageButton);
    }

    // Tạo nút Next
    const nextButton = document.createElement('button');
    nextButton.textContent = 'Sau »';
    nextButton.disabled = currentPage === totalPages;
    nextButton.addEventListener('click', () => changePage(currentPage + 1));
    pagination.appendChild(nextButton);



}





// Màu sắc trạng thái
function getStatusClass(status) {
    switch (status) {
        case 4:
            return 'status-error';
        case 3:
            return 'status-completed';
        case 2:
            return 'status-processing';
        case 1:
            return 'status-processing';

        case 0:
            return 'status-processing';
        default:
            return 'status-error';
    }
}


// Trạng thái hiển thị
function getStatusText(status) {
    switch (status) {
        case 9:
            return 'Trả lại do sai mã và không có thông tin quy đổi';
        case 8:
            return 'Trả lại do lỗi chun';
        case 7:
            return 'Trả lại do sai mã';
        case 6:
            return 'Hàng cấp không đạt tiêu chuẩn';
        case 5:
            return 'Không có thông tin quy đổi';
        case 4:
            return 'Trả lại do sai khối lượng';
        case 3:
            return 'Hoàn Thành';
        case 2:
            return 'Kho đã nhận';
        case 1:
            return 'Đang chuyển về kho';
        case 0:
            return '';
        default:
            return 'Không xác định';
    }
}




document.addEventListener('DOMContentLoaded', () => {
    changePage(1); // Gọi API tìm kiếm khi trang được tải
});

async function changePage(page) {
    const form = document.getElementById('searchForm');
    form.setAttribute('data-page', page);

    // Cập nhật giá trị page vào formData
    const formData = new FormData(form);
    formData.set('page', page); // Cập nhật tham số page

    const params = new URLSearchParams(formData).toString();
    const response = await fetch(`warehouse-returns/search?${params}`);
    const result = await response.json();

    // Hiển thị kết quả
    if (response.ok) {
        displayResults(result);
    } else {
        console.error('Lỗi khi tìm kiếm:', result.error);
        alert(result.error);
    }
}




const username = JSON.parse(localStorage.getItem('user')).username;

function submitStatusUpdate() {
    const newStatus = document.getElementById('newStatus').value;
    const id = document.getElementById('updateButton').dataset.id;

    // Gửi yêu cầu cập nhật trạng thái lên server
    fetch(`warehouse-returns/update-status/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus, whUser: username })
    })
        .then(response => response.json())
        .then(data => {
            console.log('Trạng thái đã được cập nhật:', data);
            closeModal(); // Đóng modal sau khi cập nhật
            // Cập nhật giao diện nếu cần thiết
            changePage(document.getElementById('searchForm').getAttribute('data-page'));

        })
        .catch((error) => {
            console.error('Lỗi khi cập nhật trạng thái:', error);
        });
}






// Lắng nghe sự kiện click cho nút "Sửa"
document.addEventListener('click', async (e) => {
    if (e.target.classList.contains('btn-status')) {
        const id = e.target.getAttribute('data-id');
        try {
            // Gọi API để lấy dữ liệu
            const response = await fetch(`warehouse-returns/${id}`);
            if (!response.ok) throw new Error('Không thể lấy dữ liệu');
            const data = await response.json();
            const item = data.data[0];
            console.log(item.qty_return_conver)
            // Điền dữ liệu vào modal
            document.getElementById('editId').value = item.id;
            document.getElementById('edit-returnQty').value = item.return_qty;
            document.getElementById('edit-status').value = item.status;
            document.getElementById('edit-qtyReturnCover').value = item.qty_return_conver;
            document.getElementById('edit-qtyLoi').value = item.qty_loi;
            document.getElementById('edit-location').value = item.location;

            // Hiển thị modal bằng cách thay đổi thuộc tính display
            const editModal = document.getElementById('editModal');
            editModal.style.display = 'block';  // Mở modal
        } catch (error) {
            alert('Có lỗi xảy ra khi lấy dữ liệu: ' + error.message);
        }
    }
});

// Lắng nghe sự kiện click nút Xác nhận trong modal
document.getElementById('saveChanges').addEventListener('click', async () => {
    const id = document.getElementById('editId').value;
    const returnQty = parseInt(document.getElementById('edit-returnQty').value); // Chuyển về số nguyên
    const status = parseInt(document.getElementById('edit-status').value); // Chuyển về số nguyên
    const qtyReturnCover = parseFloat(document.getElementById('edit-qtyReturnCover').value); // Chuyển về số thập phân
    const qtyLoi = parseFloat(document.getElementById('edit-qtyLoi').value); // Chuyển về số thập phân

    const location = document.getElementById('edit-location').value;
    // Kiểm tra nếu giá trị nhập vào không hợp lệ (nhỏ hơn 0)
    if (returnQty < 0 || status < 0 || qtyReturnCover < 0 || qtyLoi < 0) {
        alert("Số lượng không thể nhỏ hơn 0!");
        return; // Dừng việc gửi yêu cầu nếu có giá trị không hợp lệ
    }
    // Gửi yêu cầu API để cập nhật dữ liệu
    const response = await fetch(`warehouse-returns/update-return/${id}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            return_qty: returnQty,
            status: status,
            qty_return_conver: qtyReturnCover,
            qty_loi: qtyLoi,
            location: location
        })
    });

    if (response.ok) {
        toastr.success('Cập nhật thành công', 'Thông báo', {
            timeOut: 3000,
            progressBar: true,
            closeButton: true
        });
        document.getElementById('editModal').style.display = 'none';  // Đóng modal
        //window.location.reload();
        // Cập nhật giao diện nếu cần thiết
        changePage(document.getElementById('searchForm').getAttribute('data-page'));

        //location.reload();  // Tải lại trang để hiển thị dữ liệu mới
    } else {
        toastr.enrro('Lỗi khi update dữ liệu', 'Cảnh báo', {
            timeOut: 3000,
            progressBar: true,
            closeButton: true
        });
    }
});


// Đóng modal khi bấm nút đóng
document.querySelector('.btn-close').addEventListener('click', () => {
    const editModal = document.getElementById('editModal');
    editModal.style.display = 'none';  // Ẩn modal khi bấm nút đóng
});
// Đóng modal khi nhấn vào nút "Hủy" hoặc "Đóng"
document.querySelector('#editModal .btn-close').addEventListener('click', () => {
    document.getElementById('editModal').style.display = 'none'; // Ẩn modal
});

document.querySelector('#editModal .btn-secondary').addEventListener('click', () => {
    document.getElementById('editModal').style.display = 'none'; // Ẩn modal
});




// In lại barcode
document.getElementById('resultsTable').addEventListener('click', function (event) {
    if (event.target.id === 'printAgainBtn') {
        const button = event.target;
        const barcode = button.getAttribute('data-barcode');
        const material = button.getAttribute('data-material');
        const conversionQuantity = button.getAttribute('data-conversion');
        const unit = button.getAttribute('data-unit');
        const location = button.getAttribute('data-location');
        const core = button.getAttribute('data-core');
        const nvreturn = button.getAttribute('data-nvreturn');
        printBarcode(core, location, barcode, material, conversionQuantity, unit, nvreturn);
        console.log(core, location, barcode, material, conversionQuantity, unit, nvreturn)
    }
});
function printBarcode(core, location, barcode, material, conversionQuantity, unit, nvreturn) {


    const currentDateTime = new Date().toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        // hour: '2-digit',
        // minute: '2-digit',
        // second: '2-digit',
        // hour12: false // Sử dụng định dạng 24 giờ
    }); // Lấy ngày giờ hiện tại


    // Tạo file PDF với kích thước 3x5 cm (30x50 mm)
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: [30, 50],
        putOnlyUsedFonts: true,
        floatPrecision: 16
    });

    // Thêm thông tin vào PDF
    // doc.setFontSize(8); // Thay đổi kích thước phông chữ cho phù hợp với không gian
    // doc.text(`Mã: ${material}`, 5, 4); // Vị trí của text
    // doc.text(`TL: ${conversionQuantity}`, 5, 7); // Thêm số lượng quy đổi
    // doc.text(`${unit}`, 35, 7); // Thêm đơn vị
    // doc.text(`Ngày: ${currentDateTime}`, 5, 11); // Ngày giờ hiện tại



    doc.setFontSize(11);
    // Đổi font chữ sang thường cho phần "Mã: " không đậm
    doc.setFont('helvetica', 'normal'); doc.text(`Mã: `, 2, 4); // In "Mã: " không đậm
    doc.setFont('helvetica', 'bold'); doc.text(`${material}`, 10, 4); // In Mã đậm

    doc.setFont('helvetica', 'normal'); doc.text(`TL: `, 2, 9); // In "Mã: " không đậm
    doc.setFont('helvetica', 'bold'); doc.text(`${conversionQuantity}`, 10, 9); // In Mã đậm

    //doc.text(`${unit}`, 35, 7); // In unit đậm
    doc.text(`${unit}`, 24, 9); // In unit đậm

    doc.setFont('helvetica', 'normal'); doc.text(`Lõi/G: `, 33, 9); // In "Mã: " không đậm
    doc.setFont('helvetica', 'bold'); doc.text(`${core}`, 43, 9); // In Mã đậm



    doc.setFont('helvetica', 'normal'); doc.text(`Ngày: `, 2, 14); // In "Mã: " không đậm
    doc.setFont('helvetica', 'bold'); doc.text(`${currentDateTime}`, 13, 14); // In Mã đậm

    // Đổi font chữ sang thường cho phần "VT: " không đậm
    doc.setFont('helvetica', 'normal');
    doc.text(`VT: `, 2, 19); // In "VT: " không đậm

    // Đổi font chữ lại sang đậm cho locationbarcode
    doc.setFont('helvetica', 'bold');
    doc.text(`${location}`, 9, 19); // In locationbarcode đậm


    // doc.setFont('helvetica', 'normal'); doc.text(`CODE: `, 5, 16); // In "Mã: " không đậm
    // doc.setFont('helvetica', 'bold'); doc.text(`${barcode}`, 15, 16); // In Mã đậm

    doc.setFont('helvetica', 'normal'); doc.text(`ID: `, 2, 24); // In "Mã: " không đậm
    doc.setFont('helvetica', 'bold'); doc.text(`${nvreturn}`, 8, 24); // In Mã đậm




    //doc.addImage(barcodeImage, 'PNG', 2, 12, 35, 20); // Tùy chỉnh vị trí và kích thước hình ảnh mã vạch
    // Hiển thị file PDF để in
    doc.autoPrint();
    doc.output('dataurlnewwindow'); // Mở trong tab mới để in
}