// Hàm chuyển đổi số thập phân thành hỗn số với mẫu số tự động
function convertToMixedNumber(decimal) {
    // Kiểm tra giá trị đầu vào
    if (isNaN(decimal) || decimal < 0) {
        return "";
    }

    const integerPart = Math.floor(decimal);
    const fractionalPart = decimal - integerPart;

    // Nếu không có phần thập phân, trả về phần nguyên
    if (fractionalPart === 0) {
        return `${integerPart}`;
    }

    // Tìm mẫu số gần nhất
    let denominator = 1;
    while (fractionalPart * denominator % 1 !== 0 && denominator < 100) {
        denominator++;
    }

    const numerator = Math.round(fractionalPart * denominator);

    // Rút gọn phân số
    const gcd = (a, b) => {
        if (b === 0) return Math.abs(a);
        return gcd(b, a % b); // Điều kiện dừng hợp lý
    };

    const divisor = gcd(numerator, denominator);

    const simplifiedNumerator = numerator / divisor;
    const simplifiedDenominator = denominator / divisor;

    // Hiển thị kết quả
    return simplifiedNumerator === 0 ? `${integerPart}` : `${integerPart} ${simplifiedNumerator}/${simplifiedDenominator}`;
}




// Đẩy file lên để xử lý thành JSON trước khi update
async function uploadFile() {
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
            let jsonData = XLSX.utils.sheet_to_json(firstSheet);
            //console.log("JSON Data:", jsonData); // Kiểm tra dữ liệu JSON

            // Chuyển đổi chiều cao thành hỗn số
            jsonData = jsonData.map(item => {
                item.Chieu_cao_CupL = convertToMixedNumber(parseFloat(item.Chieu_cao_CupL));
                item.Chieu_cao_CupO = convertToMixedNumber(parseFloat(item.Chieu_cao_CupO));
                return item;
            });
            // Hiển thị loading spinner
            showLoading();

            console.log("JSON Data:", jsonData); // Kiểm tra dữ liệu JSON
            // Gửi dữ liệu theo từng phần
            await sendDataInChunks(jsonData, 200); // Chia thành các phần 500 bản ghi

            // Ẩn modal loading khi quá trình hoàn tất
            hideLoading();

           
        };

        reader.readAsArrayBuffer(file);
    } else {
        showMessage("Vui lòng chọn một file Excel để tải lên!");
        hideLoading(); // Gọi hideLoading để ẩn spinner nếu không có file
    }
}

// Gọi API đẩy data vào DB theo từng phần
async function sendDataInChunks(jsonData, chunkSize) {
    const totalChunks = Math.ceil(jsonData.length / chunkSize); // Tính số phần cần gửi

    for (let i = 0; i < totalChunks; i++) {
        const chunk = jsonData.slice(i * chunkSize, (i + 1) * chunkSize); // Lấy phần dữ liệu cần gửi

        // Gửi từng phần dữ liệu
        try {
            const response = await fetch('moldstandard/insert', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(chunk) // Gửi từng phần
            });

            const data = await response.json();
            toastr.success(`Đã gửi Json ${i + 1} dữ liệu lên server!`, "Thông báo", { timeOut: 700 });

            // Thêm thời gian chờ trước khi gửi phần tiếp theo
            await new Promise(resolve => setTimeout(resolve, 1000)); // Chờ 3 giây
        } catch (error) {
            console.error('Error:', error);
            toastr.error(`Đã xảy ra lỗi khi gửi phần ${i + 1} dữ liệu lên server`, "Lỗi", { timeOut: 700 });
        }
    }

    // Hiển thị tổng số lượng bản ghi đã chèn sau khi hoàn thành
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











// Phân trang dữ liệu
let currentPage = 1;
let limit = 10;

async function fetchData(page, Style = '') {
    const response = await fetch(`moldstandards/get-search?page=${page}&limit=${limit}&Style=${Style}`);
    const data = await response.json();
    renderTable(data);
}

function renderTable(data) {
    const tableBody = document.getElementById('resultsTableBody');
    tableBody.innerHTML = ''; // Xóa dữ liệu cũ

    data.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
           
                            <td>${item.Code}</td>
                            <td>${item.Style}</td>
                            <td>${item.Mnf_color}</td>
                            <td>${item.SIZE}</td>
                            <td>${item.MoldheadO}</td>
                            <td>${item.Chieu_cao_CupO}</td>
                            <td>${item.so_la_O}</td>
                            <td>${item.pressingtimeO}</td>
                            <td>${item.platen_temperatureO}</td>
                            <td>${item.die_temperatureO}</td>
                            <td>${item.MoldheadL}</td>
                            <td>${item.Chieu_cao_CupL}</td>
                            <td>${item.so_la_L}</td>
                            <td>${item.pressingtimeL}</td>
                            <td>${item.platen_temperatureL}</td>
                            <td>${item.die_temperatureL}</td>
                            <td>${item.Checker}</td>
                            <td>${item.Status}</td>
                      
        `;
        tableBody.appendChild(row);
    });

    document.getElementById('currentPage').textContent = currentPage;
    updatePaginationButtons();
}

function changePage(direction) {
    currentPage += direction;
    fetchData(currentPage);
}

async function searchMoldstandards() {
    const Style = document.getElementById('itemCDSearch').value;
    currentPage = 1; // Reset trang về 1
    fetchData(currentPage, Style);
}

// Tải dữ liệu khi trang được tải
document.addEventListener('DOMContentLoaded', function () {
    fetchData(currentPage); // Tải dữ liệu cho bảng
});


function updatePaginationButtons() {
    const prevButton = document.getElementById('prevPage');
    prevButton.disabled = currentPage === 1;
}