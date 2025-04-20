$(document).ready(function () {
    if (window.location.pathname.includes('/Cutting/Epattern')) {
        console.log("Đang ở trang epattern.ejs");

        // Append toggle sidebar checkbox and barcode input field
        $('#header').append(`
            <div style="display: flex; align-items: center;">
                <a id="toggleSidebar" style="cursor: pointer;">
                    <i class="material-icons">menu</i>
                </a>
                <input type="text" id="barcodeInput" placeholder="Quét mã vạch" autofocus style="margin-left: 10px;"/>
                <h4 style="padding-left:25px">Scale = </h4><input type="number" id="scaleInput" value="0.027" placeholder="0.027" step="0.001" min="0.001" style="margin-left: 10px; width: 90px;" />

            </div>
        `);
        // Đặt chiều rộng cho header theo trạng thái của sidebar
        function adjustHeaderWidth() {
            const sidebarVisible = $('#sidebar').is(':visible');
            $('#header').css('width', sidebarVisible ? 'calc(100% - 200px)' : 'calc(100% - 0px)');
        }

        // Khởi tạo
        adjustHeaderWidth();

        // $('#toggleSidebar').change(function () {
        //     $('#sidebar').toggle(!this.checked);
        //     adjustHeaderWidth(); // Cập nhật chiều rộng mỗi khi toggle

        // });
        $('#toggleSidebar').on('click', function () {
            $('#sidebar').toggle();
            adjustHeaderWidth();
        });
        
        $('#barcodeInput').on('keypress', async function(event) {
            if (event.key === 'Enter') {
                const barcodeValue = $(this).val().trim(); // Loại bỏ khoảng trắng
        
                if (!barcodeValue) { // Kiểm tra nếu mã rỗng
                    toastr.warning("Mã barcode không được để trống."); // Hiển thị thông báo
                    $(this).val(''); // Xóa input
                    return; // Dừng lại, không chạy hàm xử lý
                }
        
                console.log("Mã vạch quét được:", barcodeValue);
                await main(barcodeValue); // Gọi hàm xử lý mã vạch
                $(this).val(''); // Clear the input after processing
            }
        });

       
        
    }
});


// call api lấy dữ liệu
async function getBarcodeData(barcode) {
    try {
        const url = `epattern/process-barcode`; 
        const headers = {
            'Content-Type': 'application/json',
        };

        const response = await fetch(url, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({ barcode })
        });
        if (response.status === 400) {
            toastr.warning("Mã barcode không được để trống.", "Cảnh báo", { timeOut: 700 });
            return null;
        } else if (response.status === 500) {
            toastr.error("Không tìm thấy thư mục.", "Lỗi", { timeOut: 700 });
            return null;
        } else if (response.status === 200) {
            toastr.success("Quét thành công.", "Thông báo", { timeOut: 700 });
        }
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const barcodeData = await response.json();
        return barcodeData; // Giả sử dữ liệu trả về là chuỗi cần thiết
    } catch (error) {
        console.error('Error fetching barcode data:', error);
    }
}

// hàm xử lý dữ liệu
async function main(barcode) {
    const inputData = await getBarcodeData(barcode);
    if (inputData) {
        // Tách các đoạn PU và PD
        const commands = inputData.split(';');

        // Khởi tạo mảng để lưu các đoạn lệnh PU và PD
        const filteredCommands = commands
            .map(cmd => cmd.trim())
            .filter(cmd => cmd.startsWith('PU') || cmd.startsWith('PD'));

        const filteredResult = filteredCommands.filter(item => {
            if (item.startsWith('PD')) {
                const values = item.slice(2, -1).split(',');
                return values.length >= 10 || values.length == 2;
            }
            return true;
        });

        const result = filteredResult.map(cmd => {
            const coords = cmd.substring(2).split(',');
            return { command: cmd.substring(0, 2), coordinates: coords };
        });

        const result2 = pairCoordinates(result);
        
        // Gọi hàm vẽ sau khi đã có result2
        drawOnCanvas(result2);
    }
}

// xóa ảnh
function clearCanvas(ctx) {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
}
// laajt hinhf1  laanf 
function setupCanvas() {
    const canvas = document.getElementById('myCanvas');
    const ctx = canvas.getContext('2d');
    
    // Thiết lập các thuộc tính của canvas chỉ một lần
    //const scale = 0.027;
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.scale(1, -1);
    ctx.translate(-canvas.width / 2, -canvas.height / 2);

    return ctx; // Trả về context để sử dụng sau này
}
// Chạy hàm khi trang đã được tải xong
document.addEventListener('DOMContentLoaded', function() {
    setupCanvas(); // Gọi hàm chỉ một lần
});
 // Gọi hàm thiết lập
//vẽ
function drawOnCanvas(result2) {
    const canvas = document.getElementById('myCanvas');
    const ctx = canvas.getContext('2d');
    clearCanvas(ctx); // Xóa canvas trước khi vẽ mới

   
    //const scale = 0.027;
    const scale = parseFloat($('#scaleInput').val()); // Lấy giá trị scale từ input

    // ctx.translate(canvas.width / 2, canvas.height / 2);
    // ctx.scale(1, -1);
    // ctx.translate(-canvas.width / 2, -canvas.height / 2);

    ctx.strokeStyle = '#9966FF';
    ctx.lineWidth = 2;

    let currentX = 0, currentY = 0;
    let isPenDown = false;

    result2.forEach(cmd => {
        const instruction = cmd.command;
        const points = cmd.coordinates;

        if (instruction === 'PU') {
            isPenDown = false;
            if (points.length >= 1) {
                currentX = points[0][0] * scale;
                currentY = points[0][1] * scale;
            }
        } else if (instruction === 'PD') {
            ctx.beginPath();
            ctx.moveTo(currentX, currentY);
            isPenDown = true;

            //ctx.fillStyle = 'rgb(234, 128, 252,0.5)';
            ctx.fillStyle = 'rgba(87, 88, 187,0.5)';

            points.forEach(([x, y], index) => {
                const nextX = x * scale;
                const nextY = y * scale;

                ctx.lineTo(nextX, nextY);
                currentX = nextX;
                currentY = nextY;

                if (index === points.length - 1) {
                    ctx.closePath();
                    ctx.fill();
                }
            });
            ctx.stroke();
        } else {
            console.warn('Lệnh không hợp lệ:', instruction);
        }
    });
}


// chia tọa độ các cặp
function pairCoordinates(commands) {
    return commands.map(command => {
        const pairedCoordinates = [];
        const coordinates = command.coordinates.filter(c => c !== '');

        for (let i = 0; i < coordinates.length; i += 2) {
            pairedCoordinates.push([parseInt(coordinates[i]), parseInt(coordinates[i + 1])]);
        }

        return { command: command.command, coordinates: pairedCoordinates };
    });
}
