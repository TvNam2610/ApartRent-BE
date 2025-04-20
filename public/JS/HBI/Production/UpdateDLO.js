

// Đẩy file lên để xử lý thành JSON trước khi update
async function uploadFile() {
    const fileInput = document.getElementById('fileInput');
    const file = fileInput.files[0]; // Lấy file từ input

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

            // Gửi dữ liệu theo từng phần
            await sendDataInChunks(jsonData, 500); // Chia thành các phần 500 bản ghi

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

        // Gửi từng phần dữ liệu
        try {
            const response = await fetch('insert-user-actual', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(chunk) // Gửi từng phần
            });

            const data = await response.json();
            updateProgressBar((i + 1) / totalChunks * 100);

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




let currentPage = 1; // Biến toàn cục để theo dõi trang hiện tại
//const limit = 10; // Số lượng bản ghi trên mỗi trang
let limit = 10; // Mặc định là 10 bản ghi mỗi trang

// Cập nhật giá trị limit khi người dùng thay đổi lựa chọn
function updateLimit() {
    limit = parseInt(document.getElementById('limit').value); // Lấy giá trị từ dropdown và chuyển sang số
    searchData(currentPage); // Gọi lại hàm searchData với trang hiện tại
}

async function searchData(page = 1) {
    const wc = document.getElementById('wc').value;
    const line = document.getElementById('line').value;
    const date = document.getElementById('date').value;
    const ws = document.getElementById('ws').value;
    const shift = document.getElementById('shift').value;
    
    try {
        // Gọi API để lấy dữ liệu
        const response = await fetch(`get-setup-user-actual?wc=${wc}&line=${line}&updateAt=${date}&ws=${ws}&shift=${shift}&page=${page}&limit=${limit}`);
        const result = await response.json();

        // Lấy tham chiếu đến bảng kết quả
        const resultsBody = document.getElementById('resultsBody');
        resultsBody.innerHTML = ''; // Xóa nội dung cũ

        // Lấy ngày hiện tại (chỉ phần ngày)
        const currentDate = new Date().toISOString().split('T')[0];

        // Tạo một tập hợp để kiểm tra trùng lặp
        const uniqueRows = new Set();
        const duplicateRows = new Set();
        // Thêm dữ liệu vào bảng
        result.data.forEach(item => {
            const createdAtDate = new Date(item.created_at).toISOString().split('T')[0]; // Chỉ lấy phần ngày
            console.log(createdAtDate);
            const rowKey = `${item.WC}-${item.Line}-${createdAtDate}`;
            console.log(rowKey)

            // Kiểm tra trùng lặp và thêm vào tập hợp duplicateRows nếu trùng
            if (uniqueRows.has(rowKey)) {
                duplicateRows.add(rowKey);
            } else {
                uniqueRows.add(rowKey);
            }
        });

        // Thêm dữ liệu vào bảng
        result.data.forEach(item => {
            const createdAtDate = new Date(item.created_at).toISOString().split('T')[0]; // Chỉ lấy phần ngày
            const rowKey = `${item.WC}-${item.Line}-${createdAtDate}`;
            // Nếu ngày trùng, áp dụng màu xanh cho toàn bộ row
            const row = document.createElement('tr');
            // row.style.backgroundColor = createdAtDate === currentDate ? '#bde9bd' : 'transparent'; // Đặt màu nền cho toàn row
            // Kiểm tra trùng lặp và áp dụng màu đỏ nếu trùng
            // if (uniqueRows.has(rowKey)) {
            //     row.style.backgroundColor = '#ffcccc'; // Đặt màu nền đỏ cho toàn row nếu trùng lặp
            // } else {
            //     uniqueRows.add(rowKey);
            //     // Nếu ngày trùng với ngày hiện tại, áp dụng màu xanh cho toàn bộ row
            //     row.style.backgroundColor = createdAtDate === currentDate ? '#bde9bd' : 'transparent'; // Đặt màu nền cho toàn row
            // }
            if (duplicateRows.has(rowKey)) {
                row.style.backgroundColor = '#ffcccc'; // Đặt màu nền đỏ cho toàn row nếu trùng lặp
            } else if (createdAtDate === currentDate) {
                row.style.backgroundColor = '#bde9bd'; // Đặt màu nền xanh cho toàn row nếu ngày trùng với ngày hiện tại
            } else {
                row.style.backgroundColor = 'transparent'; // Đặt màu nền trong suốt cho các row khác
            }
            row.innerHTML = `
                <td>${item.WS}</td>
                <td>${item.WC}</td>
                <td>${item.Line}</td>
                <td>${item.Count_Worker}</td>
                <td>${item.shift}</td>
                <td>${formatDateTime(item.created_at)}</td>
                <td>${new Date(item.update_at).toLocaleString()}</td>
                <td><button class="btn btn-danger" onclick="confirmDelete('${item.id}')">Xóa</button></td>

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
// Hàm xác nhận xóa bản ghi
function confirmDelete(id) {
    if (confirm('Bạn có chắc chắn muốn xóa bản ghi này?')) {
        deleteRecord(id);
    }
}
// Hàm xóa bản ghi theo id
async function deleteRecord(id) {
    console.log(id);
    try {
        const response = await fetch(`setup-user-actual/${id}`, {
            method: 'DELETE'
        });
        const result = await response.json();
        if (!response.ok) {
            if (response.status === 403 || result.message.includes('Bạn không có quyền')) {
                toastr.error(result.message, 'Lỗi quyền truy cập', {
                    timeOut: 3000,
                    progressBar: true,
                    closeButton: true
                });
            } else {
                throw new Error(result.message || 'Lỗi khi xóa bản ghi');
            }
        } else {
            toastr.success('Xóa bản ghi thành công!', 'Thành công', {
                timeOut: 3000,
                progressBar: true,
                closeButton: true
            });
            // Tải lại dữ liệu sau khi xóa
            searchData(currentPage);
        }
    } catch (error) {
        console.error('Lỗi khi xóa bản ghi:', error);
        toastr.error(error.message || 'Lỗi khi xóa bản ghi!', 'Lỗi', {
            timeOut: 3000,
            progressBar: true,
            closeButton: true
        });
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
