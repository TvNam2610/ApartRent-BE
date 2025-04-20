let weight1Value = 0; // Lưu trữ giá trị Weight1 mặc định là 0
let pushdata = {};  // Biến lưu trữ dữ liệu API
let currentPage = 1; // Trang hiện tại
let totalPages = 1; // Tổng số trang
let limit = 5; // Số bản ghi mỗi trang

// // Lắng nghe sự kiện nhập liệu vào ô mã vật tư
// document.getElementById('ma').addEventListener('input', async function () {
//     const ma = this.value.trim();

//     // Nếu mã không trống, gọi API
//     if (ma.length > 0) {
//         await fetchAPI(ma);
//     }
    
// });
// Lắng nghe sự kiện nhấn phím vào ô mã vật tư
document.getElementById('ma').addEventListener('keydown', async function (event) {
    // Kiểm tra nếu người dùng nhấn phím Enter (keyCode 13)
    if (event.key === 'Enter') {
        const ma = this.value.trim();
        event.preventDefault();  // Ngừng hành vi mặc định của form (không tải lại trang)


        // Nếu mã không trống, gọi API
        if (ma.length > 0) {
            await fetchAPI(ma);
        }
    }
});
// Hàm gọi API sử dụng async/await
async function fetchAPI(ma) {
    try {
        const encodedMa = encodeURIComponent(ma)
        const response = await fetch(`warehouseInternal/get-by-ma?ma=${encodedMa}`);
        const result = await response.json();

        // Kiểm tra dữ liệu trả về từ API
        if (result && result.data && result.data.length > 0) {
            // Cập nhật giá trị Weight1 từ API
            weight1Value = parseFloat(result.data[0].Weight1) || 0; // Nếu không có Weight1 thì mặc định là 0
            // Cập nhật các trường trong giao diện
            pushdata = result.data[0];
            console.log(pushdata)
            // Hiển thị dữ liệu trong bảng
            displayData(result.data);
        } else {
            toastr.info('Không tìm thấy dữ liệu.', 'Thông báo', {
                timeOut: 3000,
                progressBar: true,
                closeButton: true
            });
        }
    } catch (error) {
        console.error('Error fetching data:', error);
        toastr.error('Lỗi gọi API', 'Lỗi', {
            timeOut: 3000,
            progressBar: true,
            closeButton: true
        });
    }
}


// Hàm hiển thị dữ liệu trong bảng
function displayData(data) {
    const apiTableBody = document.getElementById('apiTableBody');
    apiTableBody.innerHTML = ''; // Làm mới bảng trước khi thêm dữ liệu mới

    // Duyệt qua dữ liệu và thêm vào bảng
    data.forEach(item => {
        const newRow = document.createElement('tr');
        newRow.innerHTML = `
                    <td>${item.ItemCD}</td>
                    <td>${item.ItemName}</td>
                    <td>${formatWeight(item.Weight)}</td> 
                    <td>${item.Uom}</td>
                    <td>${formatWeight(item.WLoi)}</td> 
                    <td>${formatWeight(item.Weight1)}</td>  
                    <td>${item.Uom1}</td>
                    <td>${item.Location}</td>
                `;
        apiTableBody.appendChild(newRow);
    });
}

// Hàm format cho Weight
function formatWeight(weight) {
    const parsedWeight = parseFloat(weight);  // Chuyển đổi thành kiểu số thực

    // Sử dụng toString() để chuyển thành chuỗi và loại bỏ phần thừa ở cuối
    return parsedWeight.toString().replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '');
}


// Lắng nghe sự kiện nhập liệu cân nặng
document.getElementById('weightInput').addEventListener('input', function () {
    const weight = parseFloat(this.value);
    const conversionResultField = document.getElementById('conversionResult');
    const printButton = document.getElementById('printLabelButton');

    if (!isNaN(weight)) {
        // Quy đổi: Nhân với Weight1 (hoặc 0 nếu không có)
        const conversion = weight * weight1Value || 0;  // Nếu weight1Value là 0 thì sẽ nhân với 0
        conversionResultField.value = conversion.toFixed(2);

        // Enable the 'Print Label' button once weight is entered
        printButton.disabled = false;
    } else {
        conversionResultField.value = '';
        printButton.disabled = true;
    }
});




// Lắng nghe sự kiện bấm nút "In Tem"
document.getElementById('printLabelButton').addEventListener('click', async function () {
    // Lấy các giá trị từ các trường cần thiết
    const location = pushdata.Location;
    const ma = pushdata.ItemCD;
    const conversionResultField = document.getElementById('conversionResult').value;
    const socan = document.getElementById('weightInput').value; 
    const Uom1 = pushdata.Uom1;
    const user = localStorage.getItem('username');
    // Gọi hàm in tem barcode
    printBarcode(location, ma, conversionResultField, Uom1, user);
    await insertWarehouseInternal(ma, conversionResultField, Uom1, socan, location, user);
    console.log(ma, conversionResultField, Uom1, socan, location, user)

    // Sau khi in tem và cập nhật kho thành công, gọi lại hàm fetchHistory
    await fetchHistory();  // Gọi lại hàm fetchHistory
    // Sau khi in tem, làm sạch các trường nhập liệu và vô hiệu hóa lại nút "In Tem"
    document.getElementById('weightInput').value = ''; // Xóa giá trị trong ô nhập số cân
    document.getElementById('conversionResult').value = ''; // Xóa giá trị trong ô quy đổi
    document.getElementById('ma').value = ''; // Xóa giá trị trong ô nhập mã vật tư
    document.getElementById('printLabelButton').disabled = true; // Vô hiệu hóa lại nút "In Tem"
});


// In tem
function printBarcode(location, ma, conversionResultField, Uom1, user) {

    const currentDateTime = new Date().toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false // Sử dụng định dạng 24 giờ
    }); // Lấy ngày giờ hiện tại

    // Tạo file PDF với kích thước 3x5 cm (30x50 mm)
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: [25, 50],
        putOnlyUsedFonts: true,
        floatPrecision: 16
    });



    doc.setFontSize(10);


      // Đổi font chữ sang thường cho phần "Mã: " không đậm
      doc.setFont('helvetica', 'normal'); doc.text(`Mã  `, 2, 6); // In "Mã: " không đậm
      doc.setFont('helvetica', 'bold'); doc.text(`${ma}`, 9, 6); // In Mã đậm
  
      doc.setFont('helvetica', 'normal'); doc.text(`TL  `, 2, 12); // In "Mã: " không đậm
      doc.setFont('helvetica', 'bold'); doc.text(`${conversionResultField}`, 9, 12); // In Mã đậm
  
  
      doc.text(`${Uom1}`, 30, 12); // In unit đậm
  
  
  
      doc.setFont('helvetica', 'normal'); doc.text(`Ngày  `, 2, 18); // In "Mã: " không đậm
      doc.setFont('helvetica', 'normal'); doc.text(`${currentDateTime}`, 11, 18); // In Mã đậm
  
      // Đổi font chữ sang thường cho phần "VT: " không đậm
      doc.setFont('helvetica', 'normal');
      doc.text(`VT  `, 25, 24.5); // In "VT: " không đậm
  
      // Đổi font chữ lại sang đậm cho locationbarcode
      doc.setFont('helvetica', 'bold');
      doc.text(`${location}`, 30, 24.5); // In locationbarcode đậm
  
      doc.setFont('helvetica', 'normal'); doc.text(`NV  `, 2, 24.5); // In "Mã: " không đậm
      doc.setFont('helvetica', 'bold'); doc.text(`${user}`, 9, 24.5); // In Mã đậm


    // Hiển thị file PDF để in
    doc.autoPrint();
    doc.output('dataurlnewwindow'); // Mở trong tab mới để in
}


//api insert thông tin return
async function insertWarehouseInternal(ma, qty_return_conver, unit, return_qty, location, return_user) {
    try {
        const response = await fetch(`warehouseInternal/insert-internal`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                ma, qty_return_conver, unit, return_qty, location, return_user
            }),
        });

        if (!response.ok) {
            throw new Error(`Network response was not ok: ${response.statusText}`);
        }
        const result = await response.json();
        return result; // Trả về kết quả để xử lý nếu cần
    } catch (error) {
        toastr.error('Lỗi khi thêm!', 'Lỗi hệ thống', {
            timeOut: 3000,
            progressBar: true,
            closeButton: true
        });
    }
}

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
    initItemCDAutocomplete(); // Khởi tạo gợi ý cho ItemCD
    fetchHistory(currentPage,limit); // Gọi API tìm kiếm khi trang được tải
});

// Hàm khởi tạo gợi ý cho ItemCD
async function initItemCDAutocomplete() {
    try {
        const url = 'warehouseConversionRates/item-suggestions'; // URL của API gợi ý
        const response = await fetch(url);
        const items = await response.json();
        const itemList = items.map(item => item.ItemCD); // Danh sách ItemCD để gợi ý

        const input = document.getElementById('ma');
        new Awesomplete(input, {
            list: itemList,
            minChars: 1, // Gợi ý sau khi nhập 1 ký tự
            maxItems: 100, // Hiển thị tối đa 5 gợi ý
            autoFirst: true // Tự động chọn gợi ý đầu tiên
        });
    } catch (error) {
        console.error('Lỗi khi lấy danh sách ItemCD:', error);
    }
}


// Hàm gọi API phân trang lịch sử
async function fetchHistory( page, limit) {
    try {
        // Lấy giá trị tìm kiếm từ ô tìm kiếm (searchCode)
        const searchCode = document.getElementById('searchCode').value.trim(); // Lấy giá trị tìm kiếm từ ô input

        //const response = await fetch(`warehouseInternal/get-history-print-internal?page=${page}&limit=${limit}`);
        // Tạo URL với tham số tìm kiếm nếu có
        let url = `warehouseInternal/get-history-print-internal?page=${page}&limit=${limit}`;
        if (searchCode) {
            url += `&searchCode=${encodeURIComponent(searchCode)}`; // Thêm tham số tìm kiếm vào URL
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

    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`; // Định dạng kết quả
}

// Hàm hiển thị dữ liệu vào bảng
function displayHistoryData(data) {
    const historyTableBody = document.getElementById('historyTableBody');
    historyTableBody.innerHTML = ''; // Làm mới bảng trước khi thêm dữ liệu mới

    // Duyệt qua dữ liệu và thêm vào bảng
    data.forEach(item => {
        const newRow = document.createElement('tr');
        newRow.innerHTML = `
            <td>${item.ma}</td>
            <td>${item.return_qty}</td>
            <td>${item.unit}</td>
            <td>${item.location}</td>
            <td>${item.qty_return_conver}</td>
            <td>${item.return_user}</td>
            <td>${formatDateTime(item.created_at) || ''}</td>
            <td>
                <button class="btn btn-primary btn-print" id="printAgainBtn"
                data-ma="${item.ma}"
                data-quydoi="${item.qty_return_conver}"
                data-unit="${item.unit}"
                data-user="${item.return_user}"
                data-location="${item.location}"
                >In lại</button>

                <button class="btn btn-danger btn-delete" data-id="${item.id}">Xóa</button>

            </td>
        `;
        historyTableBody.appendChild(newRow);
    });

    // Thêm sự kiện cho các nút xóa
    const deleteButtons = document.querySelectorAll('.btn-delete');
    deleteButtons.forEach(button => {
        button.addEventListener('click', function () {
            const id = button.dataset.id; // Lấy id của bản ghi từ data-id

            if (confirm('Bạn có chắc chắn muốn xóa bản ghi này?')) {
                deleteWarehouseInternalById(id);
            }
        });
    });
}
// Hàm xóa bản ghi theo ID (Gọi API từ backend)
async function deleteWarehouseInternalById(id) {
    try {
        const response = await fetch(`warehouseInternal/delete/${id}`, {
            method: 'DELETE',
        });

        const result = await response.json();

        if (response.ok) {
            toastr.success('Xóa bản ghi thành công!', 'Thông báo', {
                timeOut: 3000,
                progressBar: true,
                closeButton: true
            });

            // Cập nhật lại bảng dữ liệu sau khi xóa (nếu cần)
            fetchHistory(currentPage, limit); // Giả sử bạn có một hàm này để cập nhật bảng
        } else {
            toastr.error(result.message || 'Không thể xóa bản ghi', 'Lỗi', {
                timeOut: 3000,
                progressBar: true,
                closeButton: true
            });
        }
    } catch (error) {
        console.error('Error deleting record:', error);
        toastr.error('Lỗi khi xóa bản ghi', 'Lỗi', {
            timeOut: 3000,
            progressBar: true,
            closeButton: true
        });
    }
}

// Hàm render phân trang
// function renderPaginationControls() {
//     const paginationControls = document.getElementById('paginationControls');
//     paginationControls.innerHTML = ''; // Làm mới phân trang trước khi thêm mới

//     // Render nút "Previous" (trang trước)
//     const prevButton = document.createElement('li');
//     prevButton.classList.add('page-item');
//     prevButton.classList.toggle('disabled', currentPage === 1);
//     prevButton.innerHTML = `<a href="#" class="page-link">« Trước</a>`;
//     prevButton.addEventListener('click', (event) => {
//         event.preventDefault();
//         changePage(currentPage - 1);
//     });
//     paginationControls.appendChild(prevButton);

//     // Render các nút trang
//     for (let page = 1; page <= totalPages; page++) {
//         const pageButton = document.createElement('li');
//         pageButton.classList.add('page-item');
//         pageButton.classList.toggle('active', page === currentPage);
//         pageButton.innerHTML = `<a href="#" class="page-link">${page}</a>`;
//         pageButton.addEventListener('click', (event) => {
//             event.preventDefault();
//             changePage(page);
//         });
//         paginationControls.appendChild(pageButton);
//     }

//     // Render nút "Next" (trang sau)
//     const nextButton = document.createElement('li');
//     nextButton.classList.add('page-item');
//     nextButton.classList.toggle('disabled', currentPage === totalPages);
//     nextButton.innerHTML = `<a href="#" class="page-link">Sau »</a>`;
//     nextButton.addEventListener('click', (event) => {
//         event.preventDefault();
//         changePage(currentPage + 1);
//     });
//     paginationControls.appendChild(nextButton);
// }
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


// Truyền dữ liệu trước khi in lại
document.getElementById('resultsTable').addEventListener('click', function (event) {
    if (event.target.id === 'printAgainBtn') {
        const button = event.target;
        const ma = button.getAttribute('data-ma');
        const quydoi = button.getAttribute('data-quydoi');
        const unit = button.getAttribute('data-unit');
        const location = button.getAttribute('data-location');
        const user = button.getAttribute('data-user');
        printAgainBtn(ma, quydoi, unit, location, user);
    }
});

// Form in lại
function printAgainBtn(ma, quydoi, unit, location, user) {

    
    const currentDateTime = new Date().toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false // Sử dụng định dạng 24 giờ
    }); // Lấy ngày giờ hiện tại

    // Tạo file PDF với kích thước 3x5 cm (30x50 mm)
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: [25, 50],
        //format: [50.8, 101.6], // 2x4 inch
        putOnlyUsedFonts: true,
        floatPrecision: 16
    });

    doc.setFontSize(10);
    // Đổi font chữ sang thường cho phần "Mã: " không đậm
    doc.setFont('helvetica', 'normal'); doc.text(`Mã  `, 2, 6); // In "Mã: " không đậm
    doc.setFont('helvetica', 'bold'); doc.text(`${ma}`, 9, 6); // In Mã đậm

    doc.setFont('helvetica', 'normal'); doc.text(`TL  `, 2, 12); // In "Mã: " không đậm
    doc.setFont('helvetica', 'bold'); doc.text(`${quydoi}`, 9, 12); // In Mã đậm


    doc.text(`${unit}`, 30, 12); // In unit đậm



    doc.setFont('helvetica', 'normal'); doc.text(`Ngày  `, 2, 18); // In "Mã: " không đậm
    doc.setFont('helvetica', 'normal'); doc.text(`${currentDateTime}`, 11, 18); // In Mã đậm

    // Đổi font chữ sang thường cho phần "VT: " không đậm
    doc.setFont('helvetica', 'normal');
    doc.text(`VT  `, 25, 24.5); // In "VT: " không đậm

    // Đổi font chữ lại sang đậm cho locationbarcode
    doc.setFont('helvetica', 'bold');
    doc.text(`${location}`, 30, 24.5); // In locationbarcode đậm

    doc.setFont('helvetica', 'normal'); doc.text(`NV  `, 2, 24.5); // In "Mã: " không đậm
    doc.setFont('helvetica', 'bold'); doc.text(`${user}`, 9, 24.5); // In Mã đậm


    // Hiển thị file PDF để in
    doc.autoPrint();
    doc.output('dataurlnewwindow'); // Mở trong tab mới để in
}


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
    fetch(`warehouseInternal/export-one-day?date=${exportDate}`)
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
            a.download = `warehouse_internal_${exportDate}.xlsx`;  // Đặt tên file tải xuống
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

// Lắng nghe sự kiện click trên nút tải xuống Excel từ date tới date
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

    // Gửi yêu cầu API để tải xuống Excel
    fetch(`warehouseInternal/export-to-date?date_from=${startDate}&date_to=${endDate}`, {
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


