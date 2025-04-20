let currentPage = 1; // Biến lưu trang hiện tại
let limit = 5; // Số lượng mục mỗi trang
let totalRecords = 0; // Tổng số bản ghi
let isdownloaded = false; // Giá trị mặc định cho isdownloaded
let includeHidden = false; // Giá trị mặc định cho includeHidden
let week = getCurrentWeek(); // Mặc định là tuần hiện tại
let year = new Date().getFullYear(); // Mặc định là năm hiện tại

async function uploadFile() {
    const fileInput = document.getElementById('fileInput');
    const file = fileInput.files[0]; // LÃ¡ÂºÂ¥y file tÃ¡Â»Â« input

    if (file) {
        const reader = new FileReader();

        // Đọc file dưới dạng binary
        reader.onload = async function (e) {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });

              // Lấy sheet đầu tiên
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];

            // ChuyÃ¡Â»Æ’n Ã„â€˜Ã¡Â»â€¢i sheet thÃƒ nh JSON
            const jsonData = XLSX.utils.sheet_to_json(firstSheet);

            // Chuyển sheet thành JSON
            const processedData = jsonData.map(row => {
                // Chuyển đổi ngày tháng và thời gian
                const sewingDate = convertExcelDate(row.Date); // Chuyển Excel date
                const sewTime = convertExcelTime(row.Time);// Chuyển Excel time (nếu có)
                return {
                    ...row,
                    Date: formatDateToYYYYMMDD(sewingDate),
                    Time: sewTime // Thêm thuộc tính sew_time
                };
            });

            //console.log("Processed JSON Data:", processedData); // Kiểm tra dữ liệu sau khi xử lý

            // Gửi dữ liệu đã xử lý lên server
            await sendDataToServer(processedData);
        };

        reader.readAsArrayBuffer(file);
    } else {
        toastr.warning("Vui lòng chọn một file Excel để tải lên!", "Cảnh báo", { timeOut: 700 });
    }
}

// Hàm chuyển đổi giá trị số Excel ngày tháng thành Date JavaScript
function convertExcelDate(excelDate) {
    if (typeof excelDate === 'number') {
        const date = new Date((excelDate - 25569) * 86400 * 1000);// 25569 là số ngày từ 1900-01-01 đến 1970-01-01
        return date;
    }
    return null; // Trả về null nếu không phải số hợp lệ
}


// Hàm chuyển đổi ngày tháng thành định dạng YYYY-MM-DD
function formatDateToYYYYMMDD(date) {
    if (!(date instanceof Date) || isNaN(date.getTime())) return null; // Kiểm tra nếu date hợp lệ
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Thêm 0 ở trước nếu tháng < 10
    const day = String(date.getDate()).padStart(2, '0'); // Thêm 0 ở trước nếu ngày < 10
    return `${year}-${month}-${day}`; // Định dạng YYYY-MM-DD
}
// Thêm hàm để chuyển đổi giá trị thời gian từ Excel
function convertExcelTime(excelTime) {
    if (typeof excelTime === 'number') {
        // Giả định rằng thời gian nằm trong định dạng số (time)
        const hours = Math.floor(excelTime * 24);
        const minutes = Math.round((excelTime * 24 - hours) * 60);
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`;
    }
    return null; // Xử lý trường hợp khác nếu cần
}

// Gọi API đẩy data vào DB
async function sendDataToServer(jsonData) {
    try {
        const response = await fetch('barcodesystem/molding', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(jsonData)
        });
        const data = await response.json();
        //console.log('Response:', data);
        toastr.success("Dữ liệu đã được đẩy lên server", "Thông báo", { timeOut: 700 });
        fetchPaginatedData(currentPage);
    } catch (error) {
        console.error('Error:', error);
    }
}



let machine = ''; // Biến chứa máy đã chọn
// Hàm để gọi API và lấy dữ liệu phân trang
async function fetchPaginatedData(page = 1) {
    try {
    
        const response = await fetch(`barcodesystem/get-molding?page=${page}&limit=${limit}&isdownloaded=${isdownloaded}&includeHidden=${includeHidden}&week=${week}&year=${year}&machine=${encodeURIComponent(machine)}`);
        
        const data = await response.json();
       // console.log(data); // Thêm dòng này

        totalRecords = data.totalCount; // Cập nhật tổng số bản ghi

        const allRecords = data.records.map(item => ({
            ...item,
            isdownloaded: item.isdownloaded || false // Đảm bảo có thuộc tính isdownloaded
        }));
       // console.log("test", allRecords)
        updateTable(allRecords);
        currentPage = data.page; // Cập nhật trang hiện tại
        renderPagination(data.totalCount); // Render phân trang
    } catch (error) {
        console.error('Error fetching paginated data:', error);
    }
}
document.addEventListener('DOMContentLoaded', function () {
    // Mã JavaScript của bạn sẽ chạy sau khi DOM đã sẵn sàng
    document.getElementById('machineSelect').addEventListener('change', updateMachine);
});

// This function will be triggered when a user selects a machine
function updateMachine() {
    // Lấy giá trị của máy được chọn
    machine = document.getElementById('machineSelect').value;
    console.log('Selected machine:', machine);

    if (machine) {
        // Gọi API với giá trị máy đã chọn và trang hiện tại
        fetchPaginatedData(currentPage);
    } else {
        console.log("Không có máy nào được chọn");
    }
}
// Hàm để xử lý thay đổi trạng thái isdownloaded
function toggleIsDownloaded(value) {
    isdownloaded = value;
    fetchPaginatedData(currentPage); // Gọi lại dữ liệu với trạng thái mới
}

// Hàm để xử lý việc hiển thị các mục ẩn
function toggleIncludeHidden(value) {
    includeHidden = value;
    fetchPaginatedData(currentPage); // Gọi lại dữ liệu với trạng thái mới
}

function updateWeek() {
    const weekSelect = document.getElementById('weekSelect');
    week = weekSelect.value ? parseInt(weekSelect.value) : getCurrentWeek(); // Cập nhật week
    fetchPaginatedData(currentPage); // Gọi lại dữ liệu với tuần mới
    fetchMachineList(year, week); // Gọi lại API để lấy danh sách máy theo tuần và năm

}

function updateYear() {
    const yearSelect = document.getElementById('yearSelect');
    year = yearSelect.value ? parseInt(yearSelect.value) : new Date().getFullYear(); // Cập nhật year
    fetchPaginatedData(currentPage); // Gọi lại dữ liệu với năm mới
    fetchMachineList(year, week); // Gọi lại API để lấy danh sách máy theo tuần và năm

}

// Function to get the current week of the year
function getCurrentWeek() {
    const date = new Date();
    const startDate = new Date(date.getFullYear(), 0, 1);
    const days = Math.floor((date - startDate) / (24 * 60 * 60 * 1000));
    return Math.ceil((days + startDate.getDay() + 1) / 7);
}

// Hàm lấy danh sách máy theo tuần và năm
function fetchMachineList(year, week) {
    fetch(`barcodesystem/distinct-mold-machines?year=${year}&week=${week}`)
        .then(response => response.json())
        .then(data => {
            if (data && data.length > 0) {
                populateMachineSelect(data); // Gọi hàm populateMachineSelect để hiển thị máy vào dropdown
            } else {
                console.error('Không có máy nào được trả về từ API');
            }
        })
        .catch(error => console.error('Lỗi khi lấy danh sách máy:', error));
}

// Hàm cập nhật dropdown máy
function populateMachineSelect(machines) {
  
    const machineSelect = document.getElementById('machineSelect');
    machineSelect.innerHTML = '<option value="">Chọn máy</option>'; // Reset dropdown

    // Thêm các máy vào dropdown
    machines.forEach(machine => {
        const option = document.createElement('option');
        option.value = machine.mold_machine; // Sử dụng mold_machine làm giá trị option
        option.textContent = machine.mold_machine; // Hiển thị mold_machine trong dropdown

        machineSelect.appendChild(option);
    });
}


// hàm hiển thị số liệu khi thay đổi
function updateLimit() {
    const limitSelect = document.getElementById('limitSelect');
    limit = parseInt(limitSelect.value); // Chuyển đổi giá trị từ select thành số nguyên
    currentPage = 1; // Reset trang về 1
    fetchPaginatedData(currentPage); // Gọi lại dữ liệu với limit mới
}

// Hàm để cập nhật bảng với dữ liệu mới
function updateTable(records) {
    //console.log("check data", records);
    const tableBody = document.querySelector('#example1 tbody');
    tableBody.innerHTML = ''; // Xóa nội dung cũ

    records.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><input type="checkbox" class="recordCheckbox" value="${item.wl_number}"></td>
            <td>${item.mold_machine}</td>
            <td>${item.wl_number}</td>
            <td>${item.selling_style}</td>
            <td>${item.manf_color}</td>
            <td>${item.size}</td>
            <td>${item.qty_demand}</td>
           <td>${formatDateToYYYYMMDD(new Date(item.sewing_date))}</td>

            <td>${item.sew_time}</td>
            <td>${item.mold_detail}</td>           
            <td><canvas id="barcode-${item.id}" class="barcode"></canvas></td>
            <td>${item.week}</td>   
            <td>${item.year}</td>   
            <td style="display:none">${item.barcode}</td>
            <td style="display:none">${item.Chieu_cao_Cup}</td>  
            <td style="display:none">${item.so_la}</td>  
            <td style="display:none">${item.pressingtime}</td>  
            <td style="display:none">${item.platen_temperature}</td>  
            <td style="display:none">${item.die_temperature}</td>  
            <td style="display:none">${item.Moldhead}</td> 
        `;

        // Thêm một thẻ <td> mới vào sau khi các thẻ <td> khác
        const newTd = document.createElement('td');
        // Cập nhật id cho từng input để phân biệt dựa trên cả wl_number và mold_detail
        newTd.innerHTML = `
            <input type="number" 
                   placeholder="Nhập SL" 
                   id="qty_calcu-${item.wl_number}-${item.mold_detail}" 
                   data-mold-detail="${item.mold_detail}" 
                   data-week="${item.week}" 
                   data-year="${item.year}" 
                   min="1"
                   style="width: 67px;">
        `;
        row.appendChild(newTd); // Thêm thẻ <td> vào cuối hàng

        // Thêm nút Insert
        const insertTd = document.createElement('td');
        insertTd.innerHTML = `<button class="insertButton" style="color:#fff" onclick="insertData('${item.wl_number}',
        '${item.mold_detail}',
        '${item.selling_style}',
        '${item.manf_color}',
        '${item.size}',
        '${item.mold_machine}',
        '${item.sew_time}',
        '${item.sewing_date}',        
        '${item.qty_demand}',
        '${item.id}')">Insert</button>`;
        row.appendChild(insertTd); // Thêm nút Insert vào cuối hàng

        const isDownloadedValue = item.isdownloaded.data[0]; // Lấy giá trị từ Buffer
        // Duyệt qua các ô trong dòng (trừ ô chứa nút Insert)
        Array.from(row.children).forEach(cell => {
            if (cell !== insertTd) { // Không thay đổi màu sắc của ô chứa nút Insert
                if (item.barcode_old !== null) {
                    cell.style.color = 'red';  // Đổi màu thành đỏ nếu barcode_old khác null
                } else if (isDownloadedValue === 1) {
                    cell.style.color = 'rgba(39, 174, 96, 1.0)';  // Đổi màu thành xanh lá cây nếu isdownloaded là 1
                } else if (item.count_insert !== null) {
                    cell.style.color = 'rgb(142, 68, 173)';  // Đổi màu thành tím nếu count_insert không phải null
                }
            }
        });

        tableBody.appendChild(row);

        // Tạo mã vạch Code128
        JsBarcode(`#barcode-${item.id}`, item.barcode, {
            format: "CODE128",
            displayValue: true,
            fontSize: 10,
            width: 1,
            height: 25
        });
    });
}

// Hàm để xử lý dữ liệu khi nhấn nút Insert
async function insertData(wl_number, mold_detail, selling_style, manf_color, size, mold_machine, sew_time, sewing_date, qty_demand,id) {
    const qtyCalcuInput = document.querySelector(`#qty_calcu-${wl_number}-${mold_detail}`);
    //const qtyCalcu = qtyCalcuInput ? qtyCalcuInput.value : null;
    const qtyCalcu = qtyCalcuInput ? parseInt(qtyCalcuInput.value, 10) : null; // Chuyển qtyCalcu thành số nguyên

    const week = qtyCalcuInput ? qtyCalcuInput.getAttribute("data-week") : '';
    const year = qtyCalcuInput ? qtyCalcuInput.getAttribute("data-year") : '';
    const formattedSewingDate = formatDateToYYYYMMDD(new Date(sewing_date));

    if (qtyCalcu && qtyCalcu > 0) {
        // Tính toán số bản ghi cần thêm
        const recordsToInsert = Math.ceil(qty_demand / qtyCalcu); // Chia qty_demand cho qty_calcu và làm tròn lên

        // Hiển thị số bản ghi cần thêm
        //console.log(`Số bản ghi cần thêm cho ${wl_number} - ${mold_detail}: ${recordsToInsert}`);

        let remainingQty = qty_demand; // Số lượng còn lại cần phân bổ  
        const promises = []; // Mảng chứa các promise của API thêm
        // Gửi dữ liệu cho mỗi bản ghi, với count từ 1 đến recordsToInsert (4 lần)
        for (let count = 1; count <= recordsToInsert; count++) {
            let count_insert_qty = qtyCalcu;
            // Nếu đây là lần cuối cùng, tính số lượng còn lại
            if (count === recordsToInsert) {
                count_insert_qty = remainingQty; // Lần cuối cùng sẽ dùng phần còn lại của qty_demand
            } else {
                remainingQty -= qtyCalcu; // Trừ đi số lượng đã phân bổ cho các lần trước
            }
            const data_insert = {
                wl_number: parseInt(wl_number),
                qty_calcu: count_insert_qty, // Ép kiểu sang string để gửi
                count_insert: count, // Thêm count_insert vào dữ liệu
                mold_detail: mold_detail,
                selling_style: selling_style,
                manf_color: manf_color,
                size: size,
                mold_machine: mold_machine,
                sew_time: sew_time,
                sewing_date: formattedSewingDate,
                week: parseInt(week),
                year: parseInt(year)
            };
            //console.log("send data", data_insert)
            // Gửi log thông qua API
            //console.log("đã chọn",id)
            //sendAddMoldApi(data_insert);
            //deleteMoldApi(id);
            // Thêm API vào mảng promises
            promises.push(sendAddMoldApi(data_insert));
        }
        try {
            // Chờ tất cả các API thêm hoàn tất
            await Promise.all(promises);
            console.log("Tất cả API thêm đã hoàn thành.");
            // Gọi API xóa sau khi thêm xong
            await deleteMoldApi(id);
        } catch (error) {
            console.error("Lỗi khi thực hiện API:", error);
        }

    } else {
        alert("Vui lòng nhập số lượng hợp lệ!");
    }
}

async function deleteMoldApi(id) {
    try {
        const response = await fetch('barcodesystem/delete-insert-count', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({id})
        });
        const data = await response.json();
        //console.log('Response:', data);
        toastr.success("Dữ liệu đã được đẩy lên server", "Thông báo", { timeOut: 1500 });
        fetchPaginatedData(currentPage);
    } catch (error) {
        console.error('Error:', error);
    }
}
async function sendAddMoldApi(data_insert) {
    try {
        const response = await fetch('barcodesystem/add-insert-count', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data_insert)
        });
        const data = await response.json();
        //console.log('Response:', data);
        toastr.success("Dữ liệu đã được đẩy lên server", "Thông báo", { timeOut: 1500 });
        //fetchPaginatedData(currentPage);
    } catch (error) {
        console.error('Error:', error);
    }
}



// xử lý cho phần phân trang 
function renderPagination(totalCount) {
    const paginationContainer = document.querySelector('.pagination');
    paginationContainer.innerHTML = ''; // Xóa nội dung cũ
    const totalPages = Math.ceil(totalCount / limit);

    const prevButton = document.createElement('a');
    prevButton.href = '#';
    prevButton.classList.add('prev');
    prevButton.innerText = '« Trước';
    prevButton.onclick = (e) => {
        e.preventDefault();
        if (currentPage > 1) {
            fetchPaginatedData(currentPage - 1);
        }
    };
    paginationContainer.appendChild(prevButton);

    // Hiển thị các nút phân trang
    let startPage, endPage;
    if (totalPages <= 4) {
        startPage = 1;
        endPage = totalPages; // Nếu tổng trang ít hơn hoặc bằng 3, hiển thị tất cả
    } else {
        if (currentPage <= 2) {
            startPage = 1;
            endPage = 4; // Hiển thị trang 1, 2, 3
        } else if (currentPage >= totalPages - 1) {
            startPage = totalPages - 3;
            endPage = totalPages; // Hiển thị 3 trang cuối cùng
        } else {
            startPage = currentPage - 1;
            endPage = currentPage + 2; // Hiển thị trang trước và sau
        }
    }

    for (let i = startPage; i <= endPage; i++) {
        const pageLink = document.createElement('a');
        pageLink.href = `#`;
        pageLink.innerText = i;

        // Thêm class 'active' cho nút hiện tại
        if (i === currentPage) {
            pageLink.classList.add('active');
        }

        pageLink.onclick = (e) => {
            e.preventDefault();
            fetchPaginatedData(i); // Gọi hàm lấy dữ liệu cho trang được chọn
        };
        paginationContainer.appendChild(pageLink);
    }

    const nextButton = document.createElement('a');
    nextButton.href = '#';
    nextButton.classList.add('next');
    nextButton.innerText = 'Sau »';
    nextButton.onclick = (e) => {
        e.preventDefault();
        if (currentPage < totalPages) {
            fetchPaginatedData(currentPage + 1);
        }
    };
    paginationContainer.appendChild(nextButton);
}



// API lưu thông tin lịch sử
async function saveDownloadHistory(downloadItem) {
    const user = JSON.parse(localStorage.getItem('user')); 
    const username = user ? user.username : 'Unknown'; 
    const updatedDownloadItem = {
        ...downloadItem,
        by: username,
        data: downloadItem.fileData 
    };

    try {
        const response = await fetch('barcodesystem/download-history', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updatedDownloadItem)
        });
        const data = await response.json();
        //console.log('Lịch sử tải xuống đã được lưu:', data);
    } catch (error) {
        console.error('Error saving download history:', error);
    }
}


document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('submitEmployeeId').addEventListener('click', function() {
        const employeeId = document.getElementById('employeeIdInput').value.trim();
        if (employeeId === '') {
            toastr.warning("Vui lòng nhập ID nhân viên!", "Cảnh báo", { timeOut: 700 });
            return;
        }

        document.getElementById('employeeIdModal').style.display = 'none';
        downloadExcel(employeeId);
    });

    document.getElementById('submitclose').addEventListener('click', function() {
        console.log('Close button clicked');
        document.getElementById('employeeIdModal').style.display = 'none';
        toastr.info("Tải xuống đã bị hủy.");
    });
});

function showEmployeeIdModal() {
    document.getElementById('employeeIdModal').style.display = 'block';
}

async function downloadExcel(employeeId) {
    const selectedData = getSelectedData();
    if (selectedData.length === 0) {
        toastr.warning("Vui lòng chọn ít nhất một mục để tải xuống!", "Cảnh báo", { timeOut: 700 });
        return;
    }

    // Tạo dữ liệu với mã vạch có dấu *
    const dataWithBarcodes = selectedData.map(item => ({
        ...item,
        barcode: `*${item.barcode}*`, // Thêm dấu * vào mã vạch
        Worker: employeeId // Add employee ID to Worker field
    }));

    // Khởi tạo workbook và worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Daily Report');

    // Thêm các dòng tiêu đề phía trên
    worksheet.mergeCells('A1:H1');
    worksheet.getCell('A1').value = 'Hanes Brands Inc';
    worksheet.getCell('A1').font = { bold: true, size: 14 };
    worksheet.getCell('A1').alignment = { horizontal: 'center' };

    worksheet.mergeCells('F2:G2');
    worksheet.getCell('F2').value = 'BÁO CÁO SẢN XUẤT HÀNG NGÀY (Mold+Die)';
    worksheet.getCell('F2').font = { bold: true, size: 12 };
    worksheet.getCell('F2').alignment = { horizontal: 'center' };

    worksheet.getCell('F3').value = 'Ngày:';
    worksheet.getCell('H3').value = new Date().toLocaleDateString(); // Thêm ngày hiện tại
    worksheet.getCell('A4').value = 'Công đoạn: BASE';

    // Thêm tiêu đề cột vào dòng 5
    const headers = [
        'Máy','WL con', 'Selling', 'Mnf_color', 'Size', 'Quantity', 'Date', 'Time', 'Detail', 'Barcode',
        'Chiều cao CUP', 'Số lá', 'Thời gian ép', 'Nhiệt độ chày', 'Nhiệt độ cối', 'Đầu mold','Worker'
    ];
    const headerRow = worksheet.addRow(headers);
    headerRow.eachCell(cell => {
        cell.font = { bold: true, color: { argb: 'FF0000' } }; // Định dạng chữ cho tiêu đề cột
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: '00C0FF' } // Màu nền cho tiêu đề cột
        };
        cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
        };
    });
   
    // Thêm dữ liệu vào từ dòng 6
    dataWithBarcodes.forEach(item => {
        const newItem = {
            mold_machine: item.mold_machine,
            WL: item.wl_number,
            Selling: item.selling_style,
            Mnf_color: item.manf_color,
            Size: item.size,
            Quantity: Number(item.qty_demand),
            Date: item.sewing_date,
            Time: item.sew_time,
            Detail: item.mold_detail,
            Barcode: item.barcode,
            "Chiều cao CUP": item.Chieu_cao_Cup,
            "Số lá": item.so_la,
            "Thời gian ép": item.pressingtime,
            "Nhiệt độ chày": item.platen_temperature,
            "Nhiệt độ cối": item.die_temperature,
            "Đầu mold": item.Moldhead,
            Worker: item.Worker // Include Worker field
        };

        //console.log("Item to add:", newItem);
        const row = worksheet.addRow([
            newItem.mold_machine,
            newItem.WL,
            newItem.Selling,
            newItem.Mnf_color,
            newItem.Size,
            newItem.Quantity,
            newItem.Date,
            newItem.Time,
            newItem.Detail,
            newItem.Barcode,
            newItem["Chiều cao CUP"],
            newItem["Số lá"],
            newItem["Thời gian ép"],
            newItem["Nhiệt độ chày"],
            newItem["Nhiệt độ cối"],
            newItem["Đầu mold"],
            newItem.Worker
            
        ]);
        //console.log("Row added to worksheet:", row.values); // Kiểm tra giá trị dòng vừa thêm

        // Thêm viền cho từng ô trong dòng
        row.eachCell(cell => {
            cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
            };
        });
    });

    // Đặt độ rộng cột
    worksheet.columns = [
        { width: 10 }, { width: 15 }, { width: 15 }, { width: 10 },
        { width: 10 }, { width: 15 }, { width: 10 }, { width: 15 },
        { width: 20 }, { width: 15 }, { width: 15 }, { width: 15 },
        { width: 15 }, { width: 15 }, { width: 15 }
    ];

    // Hiển thị hộp thoại xác nhận tải xuống
    const confirmation = confirm(`Bạn có muốn tải xuống file Excel không?`);
    if (confirmation) {
        // Tạo blob để tải xuống file Excel
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/octet-stream' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');

        // Đặt tên file với ngày tháng và mã ngẫu nhiên
        const today = new Date();
        const formattedDate = today.toISOString().slice(0, 10);
        const randomSuffix = Date.now();
        a.href = url;
        a.download = `${formattedDate}_mold_data${randomSuffix}.xlsx`;

        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        // Lưu lịch sử tải xuống và cập nhật trạng thái vào cơ sở dữ liệu
        await saveDownloadHistory({ name: `${formattedDate}_mold_data${randomSuffix}.xlsx`, type: 'Excel', fileData: dataWithBarcodes });
        await updateDownloadStatus(selectedData);
        // Cập nhật worker theo barcode
        for (const item of selectedData) {
            await updateWorkerByBarcode(employeeId, item.barcode);
        }
    } else {
        toastr.info("Tải xuống đã bị hủy.");
    }
}
async function updateWorkerByBarcode(worker, barcode) {
    try {
        const response = await fetch('scanbarcode/update-worker-barcode', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ worker, barcode })
        });

        if (!response.ok) {
            throw new Error('Failed to update worker by barcode');
        }

        const result = await response.json();
        console.log('Worker updated successfully:', result);
    } catch (error) {
        console.error('Error updating worker by barcode:', error);
    }
}

async function downloadPDF() {
    const selectedData = getSelectedData();
    if (selectedData.length === 0) {
        toastr.warning("Vui lòng chọn ít nhất một mục để tải xuống!", "Cảnh báo", { timeOut: 1000 });
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a5' });
    
    const columns = ['Machine', 'WL', 'Selling', 'Mnf_color', 'Size', 'Quantity', 'Date', 'Time', 'Detail',
     
        'Cup_Ht',          
        'Leaf_Count',     
        'Press_T',          
        'Die_Temp',        
        'Mold_Temp',      
        'Mold_Head', 
        'Barcode',
    ];
    const startX = 5; // Vị trí X
    const startY = 10; // Vị trí Y
    const rowHeight = 7; // Chiều cao hàng (giảm để phù hợp khổ A5)
    const columnWidths = [12, 12, 13, 10, 10, 10,15,15, 10, 10, 10, 10, 10, 10, 10, 18]; // Giảm độ rộng cột
    doc.setFontSize(7); // Giảm kích thước font
    // Hàm chuẩn hóa giá trị
    function normalizeValue(value) {
        // Kiểm tra nếu giá trị là null, undefined, chuỗi rỗng, NaN, hoặc chuỗi "null"
        if (value === null || value === undefined || value.trim() === '' || value === 'null' || Number.isNaN(value)) {
            return '-';
        }
        return value;
    }

    // Vẽ tiêu đề cột
    columns.forEach((col, index) => {
        const columnTitle = doc.splitTextToSize(col, columnWidths[index] - 2); // Giảm một chút để tránh bị tràn

        doc.text(columnTitle, startX + columnWidths.slice(0, index).reduce((a, b) => a + b, 0), startY);
    });

    // Vẽ các hàng
    selectedData.forEach((item, rowIndex) => {
        //console.log("Item:", item); // Ghi log dữ liệu của từng mục
        const yPos = startY + (rowIndex + 1) * rowHeight; // Tính toán vị trí Y cho mỗi hàng
        const values = [
            item.mold_machine,
            item.wl_number,
            item.selling_style,
            item.manf_color,
            item.size,
            item.qty_demand.toString(),
            item.sewing_date,
            item.sew_time,
            item.mold_detail,
            normalizeValue(item.Chieu_cao_Cup),
            normalizeValue(item.so_la),
            normalizeValue(item.pressingtime),
            normalizeValue(item.platen_temperature),
            normalizeValue(item.die_temperature),
            normalizeValue(item.Moldhead)
        ];

        values.forEach((value, index) => {
            const xPos = startX + columnWidths.slice(0, index).reduce((a, b) => a + b, 0); // Tính toán vị trí X
            doc.text(value, xPos, yPos);
        });

         // Tạo mã vạch
         const barcodeCanvas = document.createElement('canvas');
         JsBarcode(barcodeCanvas, item.barcode, {
             format: "CODE128",
             displayValue: false,
             width: 2, // Giảm độ rộng
             height: 15  // Giảm chiều cao
         });
 
         const barcodeDataUrl = barcodeCanvas.toDataURL("image/png");
         const barcodeX = startX + columnWidths.reduce((a, b) => a + b, 0) - 21; // Vị trí cho mã vạch
         const barcodeY = yPos - 6; // Điều chỉnh vị trí Y để không chèn hàng
         doc.addImage(barcodeDataUrl, 'PNG', barcodeX, barcodeY,35, 10); // Thay đổi kích thước mã vạch
     });

    const currentDate = new Date();
    const formattedDate = currentDate.toISOString().split('T')[0];
    const randomSuffix = Date.now();
    const fileName = `${formattedDate}_mold_data_${randomSuffix}.pdf`;

    doc.save(fileName);
    await saveDownloadHistory({ name: fileName, type: 'PDF', fileData: selectedData  });
    await updateDownloadStatus(selectedData);
}


function getSelectedData() {
    const selectedRows = document.querySelectorAll('.recordCheckbox:checked');
    const selectedData = [];

    selectedRows.forEach(row => {
        const rowData = row.closest('tr').children;
        selectedData.push({

            mold_machine: rowData[1].innerText,
            wl_number: rowData[2].innerText,
            selling_style: rowData[3].innerText,
            manf_color: rowData[4].innerText,
            size: rowData[5].innerText,
            qty_demand: rowData[6].innerText,
            sewing_date: rowData[7].innerText,
            sew_time: rowData[8].innerText,
            mold_detail: rowData[9].innerText,
            barcode: rowData[13].innerText,
            Chieu_cao_Cup: rowData[14].innerText,
            so_la: rowData[15].innerText,
            pressingtime: rowData[16].innerText,
            platen_temperature: rowData[17].innerText,
            die_temperature: rowData[18].innerText,
            Moldhead: rowData[19].innerText,

        });
    });
    //console.log("Selected Data:", selectedData);

    return selectedData;
}

document.getElementById('selectAll').addEventListener('change', function() {
    const checkboxes = document.querySelectorAll('.recordCheckbox');
    checkboxes.forEach(checkbox => {
        checkbox.checked = this.checked;
    });
});


// API lịch sử
async function fetchDownloadHistory() {
    try {
        const response = await fetch('barcodesystem/get-history'); // Thay bằng URL API của bạn
        const data = await response.json();
        updateDownloadHistoryTable(data);
    } catch (error) {
        console.error('Error fetching download history:', error);
    }
}

// hiển thị lịch sử vào form
function updateDownloadHistoryTable(historyData) {
    const tableBody = document.querySelector('#downloadHistoryTable tbody');
    tableBody.innerHTML = ''; // Xóa nội dung cũ

    historyData.forEach(item => {
         // Định dạng ngày giờ theo định dạng mong muốn
         const downloadDate = new Date(item.download_date);

         // Định dạng theo múi giờ địa phương
         const formattedDate = downloadDate.toLocaleString('vi-VN', {
             timeZone: 'Asia/Ho_Chi_Minh' // Chỉnh múi giờ nếu cần
         });
 
         const row = document.createElement('tr');
         row.innerHTML = `
             <td>${item.file_name}</td>
             <td>${item.file_type}</td>
             <td>${formattedDate}</td> 
             <td>${item.download_by}</td>
               <td>
                <button onclick="downloadFile('${item.file_name}')">Tải Xuống</button>
            </td>
         `;
         tableBody.appendChild(row);
    });
}

// API update trạng thái khi tải xuống
async function updateDownloadStatus(selectedData) {
    try {
        const response = await fetch('barcodesystem/update-download-status', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(selectedData) // Gửi dữ liệu đã chọn để cập nhật
        });
        const data = await response.json();
        //console.log('Cập nhật trạng thái tải xuống thành công:', data);
    } catch (error) {
        console.error('Lỗi cập nhật trạng thái:', error);
    }
}


document.addEventListener('DOMContentLoaded', () => {
    fetchPaginatedData(currentPage); // Lấy dữ liệu cho trang đầu tiên
    fetchDownloadHistory(); // Lấy lịch sử tải xuống
    fetchMachineList(year, week); // Lấy danh sách máy cho tuần và năm mặc định
});



async function downloadFile(fileName) {
    try {
        // Lấy dữ liệu từ API
        const response = await fetch(`barcodesystem/download-file?fileName=${encodeURIComponent(fileName)}`);

        // Kiểm tra xem phản hồi có thành công không
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Không thể tải file: ${errorText}`);
        }

        // Lấy dữ liệu JSON từ phản hồi
        const jsonData = await response.json();

        // Tạo dữ liệu với mã vạch có dấu *
        const dataWithBarcodes = jsonData.map(item => ({
            ...item,
            barcode: `${item.barcode}`  // Thêm dấu * vào mã vạch
        }));

        // Khởi tạo workbook và worksheet
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Daily Report');

        // Thêm các dòng tiêu đề phía trên
        worksheet.mergeCells('A1:H1');
        worksheet.getCell('A1').value = 'Hanes Brands Inc';
        worksheet.getCell('A1').font = { bold: true, size: 14 };
        worksheet.getCell('A1').alignment = { horizontal: 'center' };

        worksheet.mergeCells('F2:G2');
        worksheet.getCell('F2').value = 'BÁO CÁO SẢN XUẤT HÀNG NGÀY (Mold+Die)';
        worksheet.getCell('F2').font = { bold: true, size: 12 };
        worksheet.getCell('F2').alignment = { horizontal: 'center' };

        worksheet.getCell('F3').value = 'Ngày:';
        worksheet.getCell('H3').value = new Date().toLocaleDateString(); // Thêm ngày hiện tại
        worksheet.getCell('A4').value = 'Công đoạn: BASE';

        // Thêm tiêu đề cột vào dòng 5
        const headers = [
            'Máy', 'WL con', 'Selling', 'Mnf_color', 'Size', 'Quantity', 'Date', 'Time', 'Detail', 'Barcode',
            'Chiều cao CUP', 'Số lá', 'Thời gian ép', 'Nhiệt độ chày', 'Nhiệt độ cối', 'Đầu mold','Worker'
        ];
        const headerRow = worksheet.addRow(headers);
        headerRow.eachCell(cell => {
            cell.font = { bold: true, color: { argb: 'FF0000' } };  // Định dạng chữ cho tiêu đề cột
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: '00C0FF' } // Màu nền cho tiêu đề cột
            };
            cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
            };
        });

        // Thêm dữ liệu vào từ dòng 6
        dataWithBarcodes.forEach(item => {
            const newItem = {
                mold_machine: item.mold_machine,
                WL: item.wl_number,
                Selling: item.selling_style,
                Mnf_color: item.manf_color,
                Size: item.size,
                Quantity: Number(item.qty_demand),
                Date: item.sewing_date,
                Time: item.sew_time,
                Detail: item.mold_detail,
                Barcode: item.barcode,
                "Chiều cao CUP": item.Chieu_cao_Cup,
                "Số lá": item.so_la,
                "Thời gian ép": item.pressingtime,
                "Nhiệt độ chày": item.platen_temperature,
                "Nhiệt độ cối": item.die_temperature,
                "Đầu mold": item.Moldhead,
                Worker: item.Worker // Include Worker field
            };

            // console.log("Item to add:", newItem);
            const row = worksheet.addRow([
                newItem.mold_machine,
                newItem.WL,
                newItem.Selling,
                newItem.Mnf_color,
                newItem.Size,
                newItem.Quantity,
                newItem.Date,
                newItem.Time,
                newItem.Detail,
                newItem.Barcode,
                newItem["Chiều cao CUP"],
                newItem["Số lá"],
                newItem["Thời gian ép"],
                newItem["Nhiệt độ chày"],
                newItem["Nhiệt độ cối"],
                newItem["Đầu mold"],
                newItem.Worker
            ]);
            //console.log("Row added to worksheet:", row.values); // Kiểm tra giá trị dòng vừa thêm

            // Thêm viền cho từng ô trong dòng
            row.eachCell(cell => {
                cell.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' }
                };
            });
        });

        // Đặt độ rộng cột
        worksheet.columns = [
            { width: 10 }, { width: 15 }, { width: 15 }, { width: 10 },
            { width: 10 }, { width: 15 }, { width: 10 }, { width: 15 },
            { width: 20 }, { width: 15 }, { width: 15 }, { width: 15 },
            { width: 15 }, { width: 15 }, { width: 15 }
        ];

        // Hiển thị hộp thoại xác nhận tải xuống
        const confirmation = confirm(`Bạn có muốn tải xuống file Excel không?`);
        if (confirmation) {
            // Tạo blob để tải xuống file Excel
            const buffer = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buffer], { type: 'application/octet-stream' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');

            // Đặt tên file với ngày tháng và mã ngẫu nhiên
            const today = new Date();
            const formattedDate = today.toISOString().slice(0, 10);
            const randomSuffix = Date.now();
            a.href = url;
            a.download = `${formattedDate}_mold_data${randomSuffix}.xlsx`;

            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);

           
        } else {
            toastr.info("Tải xuống đã bị hủy.");
        }
    } catch (error) {
        toastr.error(`Lỗi khi tải file: ${error.message}`, "Lỗi", { timeOut: 700 });
    }
}










let currentSort = {
    column: null,
    order: 'asc' // Mặc định là tăng dần
};

document.querySelectorAll('th[data-sort]').forEach(th => {
    th.addEventListener('click', () => {
        const sortBy = th.getAttribute('data-sort');

        // Xác định thứ tự sắp xếp
        if (currentSort.column === sortBy) {
            currentSort.order = currentSort.order === 'asc' ? 'desc' : 'asc'; // Đổi thứ tự
        } else {
            currentSort.column = sortBy; // Cột mới được sắp xếp
            currentSort.order = 'asc'; // Đặt về mặc định là ASC
        }

        // Gọi hàm để sắp xếp dữ liệu
        sortTable(currentSort.column, currentSort.order);
        
        // Cập nhật kiểu cho các tiêu đề
        document.querySelectorAll('th').forEach(th => {
            th.classList.remove('sort-asc', 'sort-desc'); // Xóa kiểu trước đó
        });
        th.classList.add(currentSort.order === 'asc' ? 'sort-asc' : 'sort-desc'); // Thêm kiểu mới
    });
});

// Hàm sắp xếp
function sortTable(column, order) {
    const tableBody = document.querySelector('#example1 tbody');
    const rows = Array.from(tableBody.querySelectorAll('tr')); // Lấy tất cả các hàng

    rows.sort((a, b) => {
        const aText = a.querySelector(`td:nth-child(${getColumnIndex(column)})`).innerText;
        const bText = b.querySelector(`td:nth-child(${getColumnIndex(column)})`).innerText;

        if (order === 'asc') {
            return aText.localeCompare(bText);
        } else {
            return bText.localeCompare(aText);
        }
    });

    // Xóa và thêm hàng theo thứ tự đã sắp xếp
    rows.forEach(row => tableBody.appendChild(row));
}

// Hàm để xác định chỉ số cột
function getColumnIndex(column) {
    const columns = {
        wl_number: 1,
        selling_style: 2,
        manf_color: 3,
        size: 4,
        qty_demand: 5,
        sewing_date: 6,
        sew_time: 7,
        mold_detail: 8,
        barcode: 9,
        mold_machine :10,
    };
    return columns[column]; // Trả về chỉ số tương ứng với tên cột
}


