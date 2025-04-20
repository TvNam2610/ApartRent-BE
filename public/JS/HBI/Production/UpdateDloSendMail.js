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
// Đẩy file lên để xử lý thành JSON trước khi update
async function uploadFile() {
    const fileInput = document.getElementById('fileInput');
    const file = fileInput.files[0]; // Lấy file từ input
    const user = JSON.parse(localStorage.getItem('username')); // Get user from localStorage
    if (file) {
        const reader = new FileReader();
        showLoadingModal();
        // Đọc file dưới dạng binary
        reader.onload = async function (e) {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });

            // Lấy sheet đầu tiên
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];

            // Chuyển đổi sheet thành JSON
            const jsonData = XLSX.utils.sheet_to_json(firstSheet);
            console.log("JSON Data:", jsonData); // Kiểm tra dữ liệu JSON

             // Add updated_by field to each record
             const enrichedData = jsonData.map(record => ({
                ...record,
                updated_by: user ? user.username : 'nouser' // Add fallback for user
            }));

            await sendDataInChunks(enrichedData, 20);

            // Sau khi hoàn thành gửi dữ liệu, gọi hàm ... để cập nhật bảng
        };

        reader.readAsArrayBuffer(file);
    } else {
        toastr.error('Vui lòng chọn một file Excel để tải lên !', 'Lỗi đẩy FILE', {
            timeOut: 3000,
            progressBar: true,
            closeButton: true
        });
    }
}

// Gọi API đẩy data vào DB theo từng phần
async function sendDataInChunks(jsonData, chunkSize) {
    const totalChunks = Math.ceil(jsonData.length / chunkSize); // Tính số phần cần gửi

    for (let i = 0; i < totalChunks; i++) {
        const chunk = jsonData.slice(i * chunkSize, (i + 1) * chunkSize); // Lấy phần dữ liệu cần gửi
        // Chuyển đổi dữ liệu cho từng bản ghi trong chunk
        const processedChunk = chunk.map(row => {
            const Date = convertExcelDate(row.created_date); // Chuyển đổi ngày
            return {
                ...row,
                created_date: formatDateToYYYYMMDD(Date), // Định dạng ngày
            };
        });
        // Gửi từng phần dữ liệu
        try {
            const response = await fetch('update-dlo-send-mail', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(processedChunk) // Gửi từng phần
            });

            const data = await response.json();
            updateProgressBar((i + 1) / totalChunks * 100);
            //toastr.success(`Tải thành công ${i + 1} dữ liệu lên server!`, "Thông báo", { timeOut: 5000 });

            // Thêm thời gian chờ trước khi gửi phần tiếp theo
            await new Promise(resolve => setTimeout(resolve, 2000)); // Chờ 2 giây
        } catch (error) {
            toastr.error(`Đã xảy ra lỗi khi gửi phần ${i + 1} dữ liệu lên server`, "Lỗi", { timeOut: 5000 });
        }
    }
    hideLoadingModal();
   
}

function showLoadingModal() { document.getElementById('loadingModal').style.display = 'block'; } 
function hideLoadingModal() { document.getElementById('loadingModal').style.display = 'none'; } 
function updateProgressBar(percentage) {
  const progressBar = document.getElementById('progressBar');
  const uploadPercentage = document.getElementById('uploadPercentage');
  
  progressBar.style.width = percentage + '%';
  uploadPercentage.innerText = Math.floor(percentage) + '%';
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

    return `${day}-${month}-${year}`; // Định dạng kết quả
}


let currentPage = 1; // Biến toàn cục để theo dõi trang hiện tại
//const limit = 10; // Số lượng bản ghi trên mỗi trang
let limit = 10; // Mặc định là 10 bản ghi mỗi trang

// Cập nhật giá trị limit khi người dùng thay đổi lựa chọn
function updateLimit() {
    limit = parseInt(document.getElementById('limit').value); // Lấy giá trị từ dropdown và chuyển sang số
    searchData(currentPage); // Gọi lại hàm searchData với trang hiện tại
}
function formatDateTime(isoString) {
    if (!isoString) {
        return ''; // Hoặc trả về 'Chưa có dữ liệu'
    }
    const date = new Date(isoString);
    const day = String(date.getDate()).padStart(2, '0'); // Lấy ngày và thêm số 0 ở đầu nếu cần
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Tháng (0-11 nên cộng thêm 1)
    const year = date.getFullYear();
  
    return `${year}-${month}-${day}`; // Định dạng kết quả
  }
async function searchData(page = 1) {
    const wc = document.getElementById('wc').value;
    const line = document.getElementById('line').value;
    const date = document.getElementById('date').value;
    const ws = document.getElementById('ws').value;
    const shift = document.getElementById('shift').value;
    
    try {
        // Gọi API để lấy dữ liệu
        const response = await fetch(`search-setup-send-mail?wc=${wc}&line=${line}&updateAt=${date}&ws=${ws}&shift=${shift}&page=${page}&limit=${limit}`);
        const result = await response.json();

        // Lấy tham chiếu đến bảng kết quả
        const resultsBody = document.getElementById('resultsBody');
        resultsBody.innerHTML = ''; // Xóa nội dung cũ

        // Lấy ngày hiện tại (chỉ phần ngày)
        const currentDate = new Date().toISOString().split('T')[0];
        console.log(currentDate)

        // Tạo một tập hợp để kiểm tra trùng lặp
        const uniqueRows = new Set();
        const duplicateRows = new Set();
        // Thêm dữ liệu vào bảng
        result.data.forEach(item => {
            const createdAtDate = formatDateTime(item.created_at); // Chỉ lấy phần ngày
            const rowKey = `${item.WC}-${item.Line}-${createdAtDate}`;
            // Kiểm tra trùng lặp và thêm vào tập hợp duplicateRows nếu trùng
            if (uniqueRows.has(rowKey)) {
                duplicateRows.add(rowKey);
            } else {
                uniqueRows.add(rowKey);
            }
        });

        // Thêm dữ liệu vào bảng
        result.data.forEach(item => {
            const createdAtDate = formatDateTime(item.created_at); // Chỉ lấy phần ngày
            const rowKey = `${item.WC}-${item.Line}-${createdAtDate}`;
            // Nếu ngày trùng, áp dụng màu xanh cho toàn bộ row
            const row = document.createElement('tr');
            if (duplicateRows.has(rowKey)) {
                row.style.backgroundColor = '#ffcccc'; // Đặt màu nền đỏ cho toàn row nếu trùng lặp
            } else if (createdAtDate === currentDate) {
                row.style.backgroundColor = '#CCCC00'; // Đặt màu nền xanh cho toàn row nếu ngày trùng với ngày hiện tại
            } else {
                row.style.backgroundColor = 'transparent'; // Đặt màu nền trong suốt cho các row khác
            }
            row.innerHTML = `
                <td>${item.WS}</td>
                <td>${item.WC}</td>
                <td>${item.Line}</td>
                <td>${item.Count_Worker}</td>
                <td>${item.shift}</td>
                <td>${item.OT1 || 0 }</td>
                <td>${item.OT2 || 0}</td>
                <td>${formatDateTime(item.created_at)}</td>
                <td>${item.N1 || 0}</td>
                <td>${item.N2 || 0}</td>
                <td>${item.N3 || 0}</td>
                <td>${item.N4 || 0}</td>
                <td>${item.TachGio || 0}</td>
                <td>${item.Supt || "-"}</td>
                <td>${new Date(item.update_at).toLocaleString()}</td>

            `;
            resultsBody.appendChild(row);
        });

        // Cập nhật trạng thái phân trang
        document.getElementById('currentPage').textContent = currentPage;
        updatePaginationButtons();
        // Hiện phần kết quả
        document.getElementById('resultsContainer').style.display = 'block';
    } catch (error) {
        console.error('Lỗi khi tìm kiếm dữ liệu:', error);
    }
}
function updatePaginationButtons() {
    const prevButton = document.getElementById('prevPage');
    prevButton.disabled = currentPage === 1;
}
function changePage(direction) {
    currentPage += direction;
    searchData(currentPage);
}
// Gọi API tìm kiếm khi trang được tải lần đầu
document.addEventListener('DOMContentLoaded', () => {
    searchData(currentPage);
});
