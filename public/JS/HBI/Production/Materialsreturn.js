$(document).ready(function () {
    // Kết nối tới máy chủ WebSocket
    const ws = new WebSocket('ws://10.144.12.131');
    let activeQuantityInput = null; // Biến lưu ô nhập đang được chọn

    ws.onopen = function () {
        console.log('Kết nối WebSocket tới máy chủ thành công');
    };

    ws.onmessage = function (event) {
        console.log(`Nhận được tin nhắn từ server: ${event.data}`);

        // Chỉ cập nhật giá trị nếu có ô nhập liệu được chọn
        if (activeQuantityInput) {
            activeQuantityInput.val(event.data); // Ghi giá trị vào ô được chọn
        } else {
            console.warn('Không có ô nào được chọn để nhập cân.');
        }
    };


    ws.onclose = function () {
        console.log('Kết nối WebSocket đã bị ngắt');
    };

    ws.onerror = function (error) {
        console.error('Lỗi WebSocket:', error.message);
    };


    // Hàm gọi API và hiển thị danh sách vật tư
    async function fetchMaterials() {
        const wlValue = $('#wl').val();
        if (wlValue !== '') {
            try {
                // Gọi API để lấy danh sách vật tư
                const response = await fetch(`get-materials?assortment=${wlValue}`);
                const data = await response.json();
                const materials = data.materials;

                const tableBody = $('#materialTable tbody');
                tableBody.empty(); // Xóa nội dung cũ trong bảng

                // Xóa danh sách vật tư đã chọn và ô nhập liệu cũ
                $('#selectedMaterials').html('<option value="">Chọn mã vật tư</option>');
                $('#conversionInputs').empty();

                // Kiểm tra nếu không có vật tư nào được tìm thấy
                if (materials.length === 0) {
                    toastr.warning("Thông tin bạn tìm kiếm không có dữ liệu !", "Cảnh báo", {
                        closeButton: true,
                        progressBar: true,
                        positionClass: "toast-top-right",
                        timeOut: "3000", // Thời gian tự động đóng
                        extendedTimeOut: "1000" // Thời gian kéo dài 
                    });
                    return;
                }

                materials.forEach(material => {

                    const row = $('<tr></tr>')
                        .data('materialAssortment', material.assortment)  // Lưu thông tin WL
                        .data('materialId', material.return_count_number) // Lưu lần return                       
                        .data('materialIdreturn', material.id) // Lưu ID vật tư
                        .data('material', material);       // Lưu thông tin vật tư
                    // Cột checkbox
                    const checkbox = $('<input type="checkbox">').val(material.ma).on('click', addSelectedMaterials);
                    row.append($('<td></td>').append(checkbox));

                    // Cột mã
                    row.append($('<td></td>').text(material.ma));

                    // Cột loại
                    row.append($('<td></td>').text(material.catergories));

                    // Cột đơn vị
                    row.append($('<td></td>').text(material.Uom1));

                    // vị trí
                    row.append($('<td></td>').text(material.Location));
                    // Cột số lõi
                    const qty_loiInput = $('<input style="width: 50%" type="number" min="1" placeholder="Nhập lõi">');
                    qty_loiInput.addClass('hidden');  // Ẩn ô nếu không phải "thread"
                    row.append($('<td></td>').append(qty_loiInput));

                    // Cột số lượng trả về
                    const quantityInput = $('<input id="quantityInput" style="width: 50%" type="number" min="1" placeholder="Nhập cân"> ');
                    quantityInput.addClass('hidden');

                    // Khi nhấp vào ô nhập liệu, gán nó làm ô đang được chọn
                    quantityInput.on('focus', function () {
                        activeQuantityInput = $(this); // Lưu ô được chọn
                    });
                    quantityInput.on('blur', function () {
                        activeQuantityInput = null; // Xóa khi mất tiêu điểm
                    });

                    row.append($('<td></td>').append(quantityInput));

                    const groupInput = $('<input type="text" disabled placeholder="Tổ">');  // Thêm ô input cho "Tổ" dạng disabled
                    row.append($('<td></td>').append(groupInput));

                    // Cột quy đổi
                    const conversionCell = $('<td></td>').text('0');  // Khởi tạo với giá trị quy đổi là 0
                    row.append(conversionCell);

                    // Thêm checkbox "Không đạt tiêu chuẩn"
                    const qualityCheckbox = $('<input type="checkbox" class="quality-checkbox">');
                    const qualityStatusCell = $('<td></td>').append(qualityCheckbox);
                    row.append(qualityStatusCell);

                    // Giới hạn số lượng trả về tối đa cho phép
                    let maxReturnQty = parseFloat(material.qty) - parseFloat(material.total_return_qty);

                    // Thêm sự kiện tính toán khi nhập số cân vào cột số lượng trả về hoặc số lõi
                    quantityInput.on('input', calculateResult);

                    qty_loiInput.on('input', calculateResult);

                    function calculateResult() {
                        const enteredWeight = quantityInput.val() || 0;  // Lấy giá trị số lượng trả về, mặc định là 0
                        const enteredLoi = qty_loiInput.val() || 0;      // Lấy giá trị số lõi, mặc định là 0
                        const tongL = enteredLoi * material.Wloi; // tính số lõi x cột E
                        const tongtruL = enteredWeight - tongL; // số cân - L
                        //console.log("Phep tính", tongtruL, "=", enteredWeight,"*", tongL)
                        const ketqua = tongtruL * material.Weight1;
                        // Tính kết quả

                        conversionCell.text(ketqua.toFixed(2));                      // Hiển thị kết quả quy đổi
                    }
                    // Lắng nghe sự kiện thay đổi trạng thái của checkbox "Không đạt tiêu chuẩn"
                    qualityCheckbox.on('change', function () {
                        const isChecked = $(this).prop('checked');
                        // Nếu checkbox được tích, đánh dấu là không đạt tiêu chuẩn (set = 1)
                        material.qualityStatus = isChecked ? 1 : 0;
                    });

                    tableBody.append(row);
                });
            } catch (error) {
                console.error('Lỗi khi gọi API:', error);
            }
        }
    }


    // Hàm xác nhận và thêm vật tư đã chọn vào bảng kết quả
    $('#confirmButton').on('click', async function () {
        const tableBody = $('#resultTable tbody');
        const selectedRows = $('#materialTable tbody input[type="checkbox"]:checked'); // Lấy các checkbox đã chọn
        // Lấy giá trị "Tổ" từ ô nhập đầu bảng
        const groupValue = $('#groupInput').val().trim();
        const idValue = $('#idInput').val().trim();  // Lấy giá trị từ trường ID người trả về

        // Kiểm tra xem ID người trả về có trống không
        if (!idValue) {
            toastr.error('Vui lòng nhập ID người trả về trước khi xác nhận!', 'Lỗi', {
                closeButton: true,
                progressBar: true,
                positionClass: "toast-top-right",
                timeOut: 5000,
                extendedTimeOut: 1000
            });
            return; // Dừng lại, không tiếp tục thêm vật tư
        }
        // Kiểm tra xem "Tổ" có để trống hay không
        if (!groupValue) {
            toastr.error('Vui lòng nhập Tổ trước khi xác nhận !', 'Lỗi', {
                closeButton: true,
                progressBar: true,
                positionClass: "toast-top-right",
                timeOut: 5000,
                extendedTimeOut: 1000
            });
            return; // Dừng lại, không tiếp tục thêm vật tư
        }
        selectedRows.each(async function () {
            const row = $(this).closest('tr'); // Lấy hàng cha chứa checkbox

            const ma = row.find('td:nth-child(2)').text(); // Mã
            const itemName = row.find('td:nth-child(3)').text(); // Loại
            const uom = row.find('td:nth-child(4)').text(); // Đơn vị
            const qtyLoi = Number(row.find('input[type="number"]').eq(0).val()) || 0; // Số lõi
            const quantity = Number(row.find('input[type="number"]').eq(1).val()) || 0; // Số lượng trả về
            const group = $('#groupInput').val();  // Lấy giá trị từ ô nhập "Tổ" đầu bảng
            const username_id = $('#idInput').val();  // Lấy giá trị từ ô nhập "Tổ" đầu bảng
            const Location = row.find('td:nth-child(5)').text(); // Loại
            const conversion = row.find('td:nth-child(9)').text(); // Quy đổi (điều chỉnh chỉ số cột)
            const materialIdreturn = row.data('materialIdreturn');
            const materialId = parseInt(row.data('materialId'), 10);
            const materialAssortment = String(row.data('materialAssortment'));
            const qualityStatus = row.data('material').qualityStatus || 0;        // Lấy trạng thái chất lượng từ đối tượng material         
            if (quantity === 0) {
                toastr.error(`Vui lòng nhập số cân cho vật tư với mã ${ma}.`, 'Lỗi nhập liệu', {
                    timeOut: 3000,
                    progressBar: true,
                    closeButton: true
                });
                return; // Dừng lại nếu chưa nhập số cân
            }
            if (!group || group.trim() === '') {
                toastr.error(`Vui lòng nhập tổ cho vật tư với mã ${ma}.`, 'Lỗi nhập liệu', {
                    timeOut: 3000,
                    progressBar: true,
                    closeButton: true
                });
                return; // Dừng lại nếu chưa nhập tổ
            }

            // Thêm dữ liệu vào bảng kết quả
            const newRow = $('<tr></tr>');
            newRow.append($('<td></td>').text(group));
            newRow.append($('<td></td>').text(ma));
            newRow.append($('<td></td>').text(quantity));
            newRow.append($('<td></td>').text(uom));
            newRow.append($('<td></td>').text(conversion));
            newRow.append($('<td></td>').text(Location));
            newRow.append($('<td></td>').text(qtyLoi));
            newRow.append($('<td></td>').text(idValue));

            const incrementedMaterialId = materialId + 1;
            const barcodeId = `R${materialIdreturn}-${incrementedMaterialId}`;

            // Tăng số lần vật tư xuất hiện để đảm bảo thứ tự
            newRow.append($('<td></td>').text(barcodeId));
            newRow.attr('data-barcode-id', barcodeId); // Lưu barcodeId vào thuộc tính data
            newRow.append($('<td></td>').text('Chờ xử lý')); // Thay thế bằng trạng thái nếu có
            newRow.append($('<td></td>').html('<button id="printBtn" class="btn btn-danger">In Tem</button>')); // Nút in



            // Sự kiện khi nút In được nhấn
            newRow.find('#printBtn').on('click', async function () {
                // Thực hiện chức năng in ở đây
                const locationbarcode = Location; // Vị trí
                const material = ma; // Mã vật tư
                const conversionQuantity = conversion; // Giá trị quy đổi
                const unit = uom; // Đơn vị
                const core = qtyLoi; // số lõi
                const barcode = barcodeId;  // barcode 
                const username_id_nv = username_id;
                const currentDateTime = new Date().toLocaleString('vi-VN', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                }); // Lấy ngày giờ hiện tại


                // Tạo file PDF với kích thước 3x5 cm (30x50 mm)
                const { jsPDF } = window.jspdf;
                const doc = new jsPDF({
                    orientation: 'landscape', // In ngang
                    unit: 'mm',
                    format: [30, 50], // Kích thước 3x5 cm
                    putOnlyUsedFonts: true,
                    floatPrecision: 16 // Độ chính xác số thực
                });

                doc.setFontSize(11);
                // Đổi font chữ sang thường cho phần "Mã: " không đậm
                doc.setFont('helvetica', 'normal'); doc.text(`Mã: `, 2, 4); // In "Mã: " không đậm
                doc.setFont('helvetica', 'bold'); doc.text(`${material}`, 10, 4); // In Mã đậm

                doc.setFont('helvetica', 'normal'); doc.text(`TL: `, 2, 9); // In "Mã: " không đậm
                doc.setFont('helvetica', 'bold'); doc.text(`${conversionQuantity}`, 10, 9); // In Mã đậm

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
                doc.text(`${locationbarcode}`, 9, 19); // In locationbarcode đậm

                // doc.setFont('helvetica', 'normal'); doc.text(`CODE: `, 5, 16); // In "Mã: " không đậm
                // doc.setFont('helvetica', 'bold'); doc.text(`${barcode}`, 15, 16); // In Mã đậm

                doc.setFont('helvetica', 'normal'); doc.text(`ID: `, 2, 24); // In "Mã: " không đậm
                doc.setFont('helvetica', 'bold'); doc.text(`${username_id_nv}`, 8, 24); // In Mã đậm


                // Hiển thị file PDF để in
                doc.autoPrint();
                doc.output('dataurlnewwindow'); // Mở trong tab mới để in


                await savePrintHistory(core, Location, material, conversionQuantity, uom, barcode, group, username_id_nv);
            });

            // Gán sự kiện cho nút "In Tất Cả"
            $('#printAllBtn').off('click').on('click', async function () {
                const tableBody = $('#resultTable tbody');
                const rows = tableBody.find('tr');

                const { jsPDF } = window.jspdf;
                const doc = new jsPDF({
                    orientation: 'landscape',
                    unit: 'mm',
                    format: [30, 50],
                    putOnlyUsedFonts: true,
                    floatPrecision: 16
                });

                rows.each(function (index) {
                    const row = $(this);
                    const ma = row.find('td:nth-child(2)').text(); // Mã
                    const conversionQuantity = row.find('td:nth-child(5)').text(); // Giá trị quy đổi
                    const uom = row.find('td:nth-child(4)').text(); // Đơn vị
                    const barcodeall = row.data('barcode-id'); // Lấy barcodeId từ thuộc tính data
                    const Location = row.find('td:nth-child(6)').text(); // Mã
                    const qtyLoi = row.find('td:nth-child(7)').text(); // Lõi                                  
                    const barcode = row.find('td:nth-child(9)').text(); // ID R
                    const username_id_nv = row.find('td:nth-child(8)').text(); // Code 
                    doc.setFontSize(11);
                    // Đổi font chữ sang thường cho phần "Mã: " không đậm
                    doc.setFont('helvetica', 'normal'); doc.text(`Mã: `, 2, 4); // In "Mã: " không đậm
                    doc.setFont('helvetica', 'bold'); doc.text(`${ma}`, 10, 4); // In Mã đậm

                    doc.setFont('helvetica', 'normal'); doc.text(`TL: `, 2, 9); // In "Mã: " không đậm
                    doc.setFont('helvetica', 'bold'); doc.text(`${conversionQuantity}`, 10, 9); // In Mã đậm


                    doc.text(`${uom}`, 24, 9); // In unit đậm

                    doc.setFont('helvetica', 'normal'); doc.text(`Lõi/G: `, 33, 9); // In "Mã: " không đậm
                    doc.setFont('helvetica', 'bold'); doc.text(`${qtyLoi}`, 43, 9); // In Mã đậm

                    doc.setFont('helvetica', 'normal'); doc.text(`Ngày: `, 2, 14); // In "Mã: " không đậm
                    doc.setFont('helvetica', 'bold'); doc.text(`${new Date().toLocaleDateString('vi-VN')}`, 13, 14); // In Mã đậm

                    // Đổi font chữ sang thường cho phần "VT: " không đậm
                    doc.setFont('helvetica', 'normal');
                    doc.text(`VT: `, 2, 19); // In "VT: " không đậm

                    // Đổi font chữ lại sang đậm cho locationbarcode
                    doc.setFont('helvetica', 'bold');
                    doc.text(`${Location}`, 9, 19); // In locationbarcode đậm      

                    // doc.setFont('helvetica', 'normal'); doc.text(`CODE: `, 5, 16); // In "Mã: " không đậm
                    // doc.setFont('helvetica', 'bold'); doc.text(`${barcode}`, 15, 16); // In Mã đậm

                    doc.setFont('helvetica', 'normal'); doc.text(`ID: `, 2, 24); // In "Mã: " không đậm
                    doc.setFont('helvetica', 'bold'); doc.text(`${username_id_nv}`, 8, 24); // In Mã đậm

                    // Nếu không phải là mục cuối cùng, thêm trang mới
                    if (index < rows.length - 1) {
                        doc.addPage();
                    }
                });

                // Mở file PDF trong tab mới
                doc.autoPrint();
                console.log("bắt đầu in")
                doc.output('dataurlnewwindow'); // Chỉ gọi một lần để mở tab in duy nhất


                await savePrintHistory(qtyLoi, Location, ma, conversionQuantity, uom, barcode, group, username_id);
            });

            tableBody.append(newRow); // Thêm hàng mới vào bảng kết quả           

            // Gọi API để cập nhật warehouse returns
            const barcode = barcodeId;
            const conversionQuantity = parseFloat(conversion);  // Chuyển đổi từ chuỗi thành số nguyên (radix 10)

            await updateWarehouseReturns(Location, qualityStatus, materialAssortment, ma, barcode, quantity, uom, conversionQuantity, qtyLoi, group, username_id);


        });



    });



    // Hàm thêm vật tư đã chọn vào select và điều chỉnh trạng thái của các input
    function addSelectedMaterials() {
        const selectedMaterials = $('#selectedMaterials');
        const materialCode = $(this).val();

        // Tìm đến hàng chứa checkbox này
        const row = $(this).closest('tr');
        // Tìm các input trong hàng này
        const quantityInput = row.find('input[type="number"]:eq(1)'); // Số lượng trả về
        //const groupInput = row.find('input[type="text"]');            // Tổ
        const qty_loiInput = row.find('input[type="number"]:eq(0)');  // Số lõi

        if (this.checked) {
            // Nếu checkbox được chọn, thêm vào select và hiện các input
            selectedMaterials.append(`<option value="${materialCode}">${materialCode}</option>`);
            quantityInput.removeClass('hidden'); // Hiện trường
            quantityInput.focus(); // Tự động focus vào ô nhập số cân
            //groupInput.removeClass('hidden');
            //console.log("đã chạy 0")
            // Kiểm tra loại vật tư và ẩn/hiện ô số lõi
            const material = row.data('material');
            if (material && material.catergories && material.catergories.toLowerCase() === "thread") {
                qty_loiInput.removeClass('hidden');  // Hiện ô nếu là "thread"
                //console.log("đã chạy 1")
            }

            // Lấy giá trị "Tổ" từ ô nhập đầu bảng và áp dụng cho hàng hiện tại
            const groupValue = $('#groupInput').val();
            row.find('input[type="text"]').val(groupValue);

        } else {
            // Nếu checkbox không được chọn, xóa khỏi select và ẩn các input
            selectedMaterials.find(`option[value="${materialCode}"]`).remove();
            quantityInput.addClass('hidden'); // Ẩn trường
            //groupInput.addClass('hidden');
            qty_loiInput.addClass('hidden');  // Ẩn ô số lõi
        }
    }

    // lấy thông tin tài khoản return => bắt nhập vào 

    // const user = JSON.parse(localStorage.getItem('username'));
    // const first_name = JSON.parse(localStorage.getItem('user')).first_name;
    // const username = user + "_" + first_name
    // console.log(user, first_name)
    // console.log(username)








    //api update thông tin return
    async function updateWarehouseReturns(location, qualityStatus, assortment, ma, barcode, quantity, unit, conversionQuantity, wloi, rtline, user) {
        try {
            const response = await fetch(`update-warehouse-returns`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    location,
                    qualityStatus,
                    assortment,
                    ma,
                    barcode,
                    quantity,
                    unit,
                    conversionQuantity,
                    wloi,
                    rtline,
                    user
                }),
            });

            if (!response.ok) {
                throw new Error(`Network response was not ok: ${response.statusText}`);
            }
            const result = await response.json();

            // Sau khi update thành công, gọi fetchMaterials để lấy dữ liệu mới
            await fetchMaterials();

            return result; // Trả về kết quả để xử lý nếu cần
        } catch (error) {
            toastr.error('Lỗi khi cập nhật warehouse returns.', 'Lỗi hệ thống', {
                timeOut: 3000,
                progressBar: true,
                closeButton: true
            });
        }
    }

    // Hàm lưu lịch sử in mã vạch
    async function savePrintHistory(core, location, material, conversionQuantity, unit, barcode, group, username_id_nv) {
        const payload = {
            core: core,
            location: location,
            materialCode: material,
            conversionQuantity: conversionQuantity,
            unit: unit,
            barcodeId: barcode,
            team: group,
            nv_return: username_id_nv,
            timestamp: new Date().toISOString() // Thêm thời gian in
        };

        try {
            const response = await fetch('save-print-history', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error('Lỗi khi lưu lịch sử in mã vạch.');
            }


        } catch (error) {
            console.error('Lỗi khi gọi API lưu lịch sử:', error);
        }
    }





    // Gán sự kiện bấm nút "Tìm kiếm" để gọi hàm fetchMaterials
    $('#searchBtn').on('click', function () {

        // Kiểm tra xem "Tổ" có được nhập hay chưa

        const wlValue = $('#wl').val().trim(); // Lấy giá trị của input "WO (Lô sản xuất)"


        // Kiểm tra nếu mã WL bị để trống
        if (wlValue === '') {
            toastr.error('Vui lòng nhập mã WL trước khi tìm kiếm.', 'Lỗi', {
                closeButton: true,
                progressBar: true,
                positionClass: "toast-top-right", // Vị trí hiển thị
                timeOut: 2000, // Thời gian tự động tắt (ms)
                extendedTimeOut: 1000 // Thời gian mở rộng khi hover
            });
            return; // Dừng thực hiện nếu mã WL trống
        }


        fetchMaterials();
    });
});



document.getElementById('getprintAllBtn').addEventListener('click', async () => {
    try {
        const response = await fetch('get-latest-print-history');
        const data = await response.json();

        const tableBody = document.querySelector('#printHistoryTable tbody');
        tableBody.innerHTML = ''; // Xóa dữ liệu cũ trong bảng

        data.forEach(item => {
            const row = document.createElement('tr');
            const lastPrintedDate = new Date(item.last_printed).toLocaleDateString('vi-VN', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
            row.innerHTML = `
                <td>${item.id}</td>
                <td>${item.material_code}</td>
                <td>${item.unit}</td>
                <td>${item.conversion_quantity}</td>
                <td>${item.barcode_id}</td>
                <td>${item.location}</td>
                <td>${item.core}</td>
                <td>${lastPrintedDate}</td>
                <td>${item.team}</td>
                <td>${item.nv_return}</td>
                
                <td><button class="printAgainBtn"
            data-barcode="${item.barcode_id}" 
            data-material="${item.material_code}" 
            data-conversion="${item.conversion_quantity}" 
            data-unit="${item.unit}"
            data-location="${item.location}"
            data-core="${item.core}"
            data-date="${item.last_printed}"
            data-nvreturn="${item.nv_return}" >In lại</button></td>
            `;
            tableBody.appendChild(row);
        });

        // Hiển thị modal
        document.getElementById('printHistoryModal').style.display = 'flex';
    } catch (error) {
        console.error('Lỗi khi lấy lịch sử in:', error);
    }
});

function closeModal() {
    document.getElementById('printHistoryModal').style.display = 'none';
}

document.getElementById('printHistoryTable').addEventListener('click', function (event) {
    if (event.target.classList.contains('printAgainBtn')) {
        const button = event.target;
        const barcode = button.getAttribute('data-barcode');
        const material = button.getAttribute('data-material');
        const conversionQuantity = button.getAttribute('data-conversion');
        const unit = button.getAttribute('data-unit');
        const location = button.getAttribute('data-location');
        const core = button.getAttribute('data-core');
        const nvreturn = button.getAttribute('data-nvreturn');
        printBarcode(core, location, barcode, material, conversionQuantity, unit, nvreturn);
        //console.log(core,location, barcode, material, conversionQuantity, unit)
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
        //orientation: 'portrait',
        unit: 'mm',
        format: [30, 50],
        putOnlyUsedFonts: true,
        floatPrecision: 16
    });



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

    doc.setFont('helvetica', 'normal'); doc.text(`ID: `, 2, 24); // In "Mã: " không đậm
    doc.setFont('helvetica', 'bold'); doc.text(`${nvreturn}`, 8, 24); // In Mã đậm

    //doc.addImage(barcodeImage, 'PNG', 2, 12, 35, 20); // Tùy chỉnh vị trí và kích thước hình ảnh mã vạch
    // Hiển thị file PDF để in
    doc.autoPrint();
    doc.output('dataurlnewwindow'); // Mở trong tab mới để in
}

