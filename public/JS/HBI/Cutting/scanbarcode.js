let lastScannedBarcode = ''; // Biến lưu mã vạch đã quét gần nhất




document.getElementById('barcodeInput').addEventListener('change', scanBarcode);

async function scanBarcode() {
    const barcodeInput = document.getElementById('barcodeInput');
    const barcode = barcodeInput.value.trim();

    //
    if (!barcode) {
        toastr.warning("Vui lòng nhập mã vạch để quét!", "Cảnh báo", { timeOut: 1500 });
        return;
    }

    // Kiểm tra xem mã vạch hiện tại có giống với mã đã quét gần nhất không
    if (barcode === lastScannedBarcode) {
        toastr.warning("Mã vạch này đã được quét gần đây. Vui lòng quét mã khác!", "Cảnh báo", { timeOut: 1500 });
        barcodeInput.value = ''; // Làm sạch ô input sau khi cảnh báo
        return;
    }
    

    

    try {
        const response = await fetch('scanbarcode/scan-barcode', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ barcode }) // Gửi mã vạch đến server
        });

        if (response.ok) {
            const data = await response.json();
            toastr.success(data.message, "Thông báo", { timeOut: 1500 });
            fetchIncompleteBarcodes(); // Gọi lại hàm để cập nhật bảng
            lastScannedBarcode = barcode; // Cập nhật mã vạch đã quét

        } else {
            const errorData = await response.json();
            // Kiểm tra thông báo cụ thể từ server
            if (errorData.error) {
                toastr.warning(errorData.error, "Lỗi", { timeOut: 1500 });
            } else {
                toastr.error("Có lỗi xảy ra!", "Lỗi", { timeOut: 1500 });
            }
        }
    } catch (error) {
       
        toastr.error("Có lỗi xảy ra khi quét mã vạch", "Lỗi", { timeOut: 1500 });
    } finally {
        barcodeInput.value = ''; // Reset ô input
    }
}

// Đặt focus vào ô quét mã khi trang được tải
window.onload = function() {
    const barcodeInput = document.getElementById('barcodeInput');
    barcodeInput.focus(); // Đặt focus vào ô input
    fetchIncompleteBarcodes(); // Gọi hàm để lấy barcode không hoàn thành

};


function formatDateTime(dateTime) {
    const date = new Date(dateTime);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Tháng bắt đầu từ 0
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}



async function fetchIncompleteBarcodes() {
    try {
        const response = await fetch('scanbarcode/incomplete-barcodes');
        const barcodes = await response.json();
        
        // Giả sử bạn có một bảng với id là "barcodeTable"
        const tableBody = document.getElementById('barcodeTableBody');
        tableBody.innerHTML = ''; // Xóa nội dung hiện tại

        barcodes.forEach(barcode => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${barcode.tracking_id}</td>
                <td>${barcode.barcode}</td>
                <td>${barcode.start_time ? formatDateTime(barcode.start_time) : 'Chưa có bắt đầu'}</td>
                <td>${barcode.end_time ? formatDateTime(barcode.end_time) : 'Chưa kết thúc'}</td>
                <td>
                    ${barcode.worker ? barcode.worker : 'Chưa phân công nhân'}
                </td>

            `;
            tableBody.appendChild(row);
        });
    } catch (error) {
        console.error('Lỗi khi lấy danh sách barcode không hoàn thành:', error);
    }
}


