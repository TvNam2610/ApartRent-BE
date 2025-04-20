let currentData = []; // Biến để lưu trữ dữ liệu hiện tại

async function fetchData() {
    const url = `getline-output`; // Tạo URL
    try {
        const response = await fetch(url); // Sử dụng URL đã ghi lại
        const data = await response.json();
        const gridContainer = document.getElementById('line-output-grid');
        if (!gridContainer) {
            console.error('Không tìm thấy phần tử gridContainer');
            return; // Dừng lại nếu không tìm thấy phần tử
        }

        gridContainer.innerHTML = ''; // Xóa nội dung cũ
   
        // Sử dụng DocumentFragment để tránh nhiều lần repaint/reflow
        const fragment = document.createDocumentFragment();

        // Lưu trữ dữ liệu mới
        currentData = data;

        // Tạo lưới 8x6 cho ca 1 và ca 2
        const grid = Array.from({ length: 2 }, () => 
            Array.from({ length: 6 }, () => Array(8).fill(null))
        );

        // Lấp đầy dữ liệu vào lưới
        data.forEach(item => {
            const shift = item.line.endsWith('-1') ? 0 : 1; // Ca 1 là chỉ số 0, ca 2 là chỉ số 1
            const index = item.line.replace('-1', '').replace('-2', ''); // Lấy tên dòng mà không có ca
            const columnIndex = index.charCodeAt(0) - 65; // Chuyển đổi từ A-H thành chỉ số 0-7
            const rowIndex = parseInt(index.slice(1)) - 1; // Chuyển đổi hàng từ 1-6 thành 0-5

            // Lấp đầy ô tương ứng
            if (columnIndex >= 0 && columnIndex < 8 && rowIndex >= 0 && rowIndex < 6) {
                grid[shift][rowIndex][columnIndex] = item; // Gán item vào ô
            }
        });

        // Hiển thị dữ liệu lên lưới
        const currentShift = document.querySelector('input[name="shift"]:checked').value; // Lấy ca hiện tại
        const shiftIndex = parseInt(currentShift) - 1; // Chuyển đổi từ chuỗi sang số

        const selectedGrid = grid[shiftIndex];

        selectedGrid.forEach((row, rowIndex) => {
            row.forEach((item, columnIndex) => {
                const indexLabel = `${String.fromCharCode(65 + columnIndex)}${rowIndex + 1}-${shiftIndex + 1}`;
                const gridItem = document.createElement('div');
                gridItem.className = 'grid-item';

                //  // Thêm sự kiện click
                //  gridItem.addEventListener('click', () => {
                //     if (item) {
                //         const line = item.line; // Lấy tên line từ item
                //         window.location.href = `ShowDetail/${line}`; // Chuyển hướng đến trang chi tiết
                //     }
                // });
                // Thêm sự kiện click
                gridItem.addEventListener('click', () => {
                    let line = item ? item.line : null; // Lấy tên line từ item nếu có, nếu không sẽ là null

                    // Nếu không có line, lấy tên dòng theo indexLabel
                    if (!line && indexLabel) {
                        line = `${indexLabel}`; // Hoặc bạn có thể định dạng khác tùy ý
                    }

                    if (line) {
                        window.location.href = `ShowDetail/${line}`; // Chuyển hướng đến trang chi tiết
                    } else {
                        console.error('Không có thông tin line để chuyển hướng');
                    }
                });

                

                if (item) {
                    const effPercent = (item.eff * 100).toFixed(2); // Chuyển đổi thành phần trăm và làm tròn
                    const effClass = item.eff < 0.5 ? 'low' : ''; // Gán lớp 'low' nếu hiệu suất dưới 50%

                    gridItem.innerHTML = `
                        <div class="line">${indexLabel}</div>
                        <div class="output">${item.output}</div>
                        <div class="eff ${effClass}">${effPercent}%</div>
                    `;
                } else {
                    gridItem.innerHTML = `<div class="index">${indexLabel}</div>`; // Hiển thị ô trống
                }

                gridContainer.appendChild(gridItem);
            });
        });
        // Append toàn bộ fragment vào container
        gridContainer.appendChild(fragment);

    } catch (error) {
        console.error('Lỗi khi lấy dữ liệu:', error);
    }
}

// Gọi hàm fetchData khi trang được tải
document.addEventListener('DOMContentLoaded', async () => {
    await fetchData();
    setInterval(fetchData, 300000); // Làm mới dữ liệu mỗi 5 phút (120000ms)
});

// // Xử lý sự kiện cho nút chuyển ca
// document.querySelectorAll('input[name="shift"]').forEach(input => {
//     input.addEventListener('change', fetchData); // Gọi lại hàm fetchData khi ca thay đổi
// });


// Xử lý sự kiện cho nút chuyển ca
document.querySelectorAll('input[name="shift"]').forEach(input => {
    input.addEventListener('change', debounce(fetchData, 300)); // Gọi lại hàm fetchData khi ca thay đổi, với debounce 300ms
});

// Hàm debounce để hạn chế việc gọi hàm liên tục khi ca thay đổi
function debounce(func, wait) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}
