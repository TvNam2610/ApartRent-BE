// // Đẩy file lên để xử lý thành JSON trước khi update
// async function uploadFile() {
//     const fileInput = document.getElementById('fileInput');
//     const file = fileInput.files[0]; // Lấy file từ input

//     if (file) {
//         const reader = new FileReader();

//         // Đọc file dưới dạng binary
//         reader.onload = async function (e) {
//             const data = new Uint8Array(e.target.result);
//             const workbook = XLSX.read(data, { type: 'array' });

//             // Lấy sheet đầu tiên
//             const firstSheet = workbook.Sheets[workbook.SheetNames[0]];

//             // Chuyển đổi sheet thành JSON
//             const jsonData = XLSX.utils.sheet_to_json(firstSheet);
//             console.log("JSON Data:", jsonData); // Kiểm tra dữ liệu JSON

//             // Gửi dữ liệu theo từng phần
//             await sendDataInChunks(jsonData, 500); // Chia thành các phần 500 bản ghi

//             // Sau khi hoàn thành gửi dữ liệu, gọi hàm fetchData để cập nhật bảng
//             fetchData(currentPage);

//             // Sau khi hoàn thành gửi dữ liệu, gọi API lấy dữ liệu từ DB và cập nhật
//             await processAfterUpload();
//         };

//         reader.readAsArrayBuffer(file);
//     } else {
//         showMessage("Vui lòng chọn một file Excel để tải lên!");
//     }
// }

// // Gọi API đẩy data vào DB theo từng phần
// async function sendDataInChunks(jsonData, chunkSize) {
//     const totalChunks = Math.ceil(jsonData.length / chunkSize); // Tính số phần cần gửi

//     for (let i = 0; i < totalChunks; i++) {
//         const chunk = jsonData.slice(i * chunkSize, (i + 1) * chunkSize); // Lấy phần dữ liệu cần gửi

//         // Gửi từng phần dữ liệu
//         try {
//             const response = await fetch('warehouseConversionRates/insert-warehouseConversionRates', {
//                 method: 'POST',
//                 headers: {
//                     'Content-Type': 'application/json'
//                 },
//                 body: JSON.stringify(chunk) // Gửi từng phần
//             });

//             const data = await response.json();
//             toastr.success(`Đã gửi Json ${i + 1} dữ liệu lên server!`, "Thông báo", { timeOut: 700 });
           
//             // Thêm thời gian chờ trước khi gửi phần tiếp theo
//             //await new Promise(resolve => setTimeout(resolve, 2000)); // Chờ 3 giây
//         } catch (error) {
//             toastr.error(`Đã xảy ra lỗi khi gửi phần ${i + 1} dữ liệu lên server`, "Lỗi", { timeOut: 700 });
//         }
//     }

//     // Hiển thị tổng số lượng bản ghi đã chèn sau khi hoàn thành
//     showMessage(`Đã đẩy lên : ${totalChunks} bản ghi JSON`, 'green');
// }

// Hàm chính: Upload file Excel, chuyển thành JSON và đẩy lên server
async function uploadFile() {
    const fileInput = document.getElementById('fileInput');
    const file = fileInput.files[0]; // Lấy file từ input

    if (file) {
        if (!file.name.endsWith('.xls') && !file.name.endsWith('.xlsx')) {
            showMessage("Vui lòng chọn một file Excel hợp lệ!", 'red');
            return;
        }

        const reader = new FileReader();

        reader.onload = async function (e) {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });

            // Lấy sheet đầu tiên
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];

            // Chuyển đổi sheet thành JSON
            const jsonData = XLSX.utils.sheet_to_json(firstSheet);
            console.log("JSON Data:", jsonData);

            // Gửi dữ liệu theo từng phần
            const chunkSize = 500;
            const totalChunks = Math.ceil(jsonData.length / chunkSize);
            const errors = await sendDataInChunks(jsonData, chunkSize);

            if (errors.length > 0) {
                toastr.error(`Có ${errors.length} chunk bị lỗi khi đẩy lên server`, "Lỗi", { timeOut: 1000 });
            } else {
                toastr.success("Tất cả dữ liệu đã được gửi thành công!", "Thành công", { timeOut: 1000 });
            }

            // Gọi hàm fetchData để cập nhật bảng sau khi hoàn tất
            fetchData(currentPage);
            await processAfterUpload();
        };

        reader.readAsArrayBuffer(file);
    } else {
        showMessage("Vui lòng chọn một file Excel để tải lên!", 'red');
    }
}

// Gửi dữ liệu JSON theo từng phần (chunk) và xử lý lỗi
async function sendDataInChunks(jsonData, chunkSize) {
    const totalChunks = Math.ceil(jsonData.length / chunkSize);
    const errors = [];

    for (let i = 0; i < totalChunks; i++) {
        const chunk = jsonData.slice(i * chunkSize, (i + 1) * chunkSize);

        try {
            const response = await fetch('warehouseConversionRates/insert-warehouseConversionRates', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(chunk)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const data = await response.json();
            toastr.success(`Chunk ${i + 1} đã gửi thành công!`, "Thông báo", { timeOut: 700 });
        } catch (error) {
            console.error(`Error on chunk ${i + 1}:`, error);
            errors.push({ chunkIndex: i, error: error.message });
            toastr.error(`Chunk ${i + 1} bị lỗi`, "Lỗi", { timeOut: 700 });
        }
    }

    return errors;
}











// Sau khi upload xong, gọi API lấy dữ liệu và cập nhật
async function processAfterUpload() {
    try {
        // Gọi API lấy dữ liệu từ bảng
        const response = await fetch('warehouseConversionRates/get-list', {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });

        if (response.ok) {
            const data = await response.json();

            // Tính toán giá trị quy đổi và cập nhật lại
            await calculateAndUpdate(data);
        } else {
            toastr.error("Không thể lấy dữ liệu từ bảng", "Lỗi", { timeOut: 700 });
        }
    } catch (error) {
        
        toastr.error("Lỗi khi kết nối API", "Lỗi", { timeOut: 700 });
    }
}

// Hàm tính toán và cập nhật dữ liệu
async function calculateAndUpdate(data) {
    try {
        for (const item of data) {
            // Lấy các giá trị cần thiết
            const { ma, return_count, return_qty, qty_loi, Weight1, Wloi } = item;

            // Đảm bảo Weight1 > 0 để tránh chia cho 0
            if (parseFloat(Weight1) <= 0) {
                console.warn(`Weight1 không hợp lệ cho mã ${ma}, bỏ qua bản ghi này.`);
                continue;
            }
            
            // Tính toán giá trị quy đổi
            const qtyReturnConver = (
                (return_qty - (qty_loi * parseFloat(Wloi))) * parseFloat(Weight1)
            ).toFixed(2); // Làm tròn 2 chữ số thập phân

            // // Tính toán giá trị quy đổi
            // const qtyReturnConver = (
            //     (return_qty - (qty_loi * parseFloat(Wloi))) / parseFloat(Weight1)
            // ); // Không làm tròn, giữ nguyên giá trị

            // Gọi API cập nhật
            await updateQtyReturnConver(qtyReturnConver, ma, return_count);
        }

        toastr.success("Đã cập nhật toàn bộ dữ liệu thành công!", "Hoàn tất", { timeOut: 1000 });
    } catch (error) {
        
        toastr.error("Lỗi trong quá trình cập nhật", "Lỗi", { timeOut: 700 });
    }
}

// Gọi API để cập nhật từng bản ghi
async function updateQtyReturnConver(qtyReturnConver, ma, returnCount) {
    try {
        const response = await fetch('warehouseConversionRates/update-qty-return', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ qtyReturnConver, ma, returnCount })
        });

        if (!response.ok) throw new Error(`Không thể cập nhật mã ${ma}`);
    } catch (error) {
        toastr.error(`Lỗi khi cập nhật mã ${ma}`, "Lỗi", { timeOut: 700 });
    }
}


// Cập nhật thông điệp tải lên
function showMessage(msg, color) {
    const messageElement = document.getElementById('message');
    messageElement.textContent = msg;
    messageElement.style.color = color; // Thay đổi màu thông điệp theo loại thông báo
}

// Phân trang dữ liệu
let currentPage = 1;
let limit = 10;

async function fetchData(page, itemCD = '') {
    const encodedItemCD = encodeURIComponent(itemCD)
    const response = await fetch(`warehouseConversionRates/conversion-rates?page=${page}&limit=${limit}&itemCD=${encodedItemCD}`);
    const data = await response.json();
    renderTable(data);
}

function renderTable(data) {
    const tableBody = document.getElementById('tableBody');
    tableBody.innerHTML = ''; // Xóa dữ liệu cũ

    data.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.ItemCD}</td>
            <td>${item.ItemName}</td>
            <td>${formatWeight(item.Weight)}</td> 
            <td>${item.Uom}</td>
            <td>${formatWeight(item.WLoi)}</td> 
            <td>${formatWeight(item.Weight1)}</td>           
            <td>${item.Uom1}</td>
            <td>${item.Location}</td>
        `;
        tableBody.appendChild(row);
    });

    document.getElementById('currentPage').textContent = currentPage;
}


// Hàm format cho Weight
function formatWeight(weight) {
    const parsedWeight = parseFloat(weight);  // Chuyển đổi thành kiểu số thực

    // Sử dụng toString() để chuyển thành chuỗi và loại bỏ phần thừa ở cuối
    return parsedWeight.toString().replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '');
}
function changePage(direction) {
    currentPage += direction;
    fetchData(currentPage);
}

async function searchData() {
    const itemCD = document.getElementById('itemCDSearch').value;
    currentPage = 1; // Reset trang về 1
    fetchData(currentPage, itemCD);
}

// Tải dữ liệu khi trang được tải
document.addEventListener('DOMContentLoaded', function () {
    initItemCDAutocomplete(); // Khởi tạo gợi ý cho ItemCD
    fetchData(currentPage); // Tải dữ liệu cho bảng
});

// Hàm khởi tạo gợi ý cho ItemCD
async function initItemCDAutocomplete() {
    try {
        const url = 'warehouseConversionRates/item-suggestions'; // URL của API gợi ý
        const response = await fetch(url);
        const items = await response.json();
        const itemList = items.map(item => item.ItemCD); // Danh sách ItemCD để gợi ý

        const input = document.getElementById('itemCDSearch');
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

