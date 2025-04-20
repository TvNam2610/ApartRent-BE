

    $(document).ready(function () {
        // Khi nhấn nút quét mã
        $('#barcodeForm').on('submit', function (event) {
            event.preventDefault();
            const codename = $('#barcodeInput').val();
            fetchProductDetails(codename);
        });
    });
    // Lấy thông tin sản phẩm qua API
    function fetchProductDetails(codename) {
        $.ajax({
            url: `product-by-name/${codename}`, // Thay URL của API
            method: 'GET',
            success: function (response) {
                if (response && response.data) {
                    displayProductDetails(response.data.data[0]);
                } else {
                    alert('Không tìm thấy sản phẩm với mã barcode này');
                }
            },
            error: function () {
                alert('Lỗi khi gọi API');
            }
        });
    }

    // Hiển thị thông tin sản phẩm chi tiết
    function displayProductDetails(product) {
        $('#productDetails').html(`
            <div class="row">
                <div class="col-md-6">
                    <table class="table table-striped">
                        <tr><th>Tên sản phẩm</th><td>${product.vietnamese_name}</td></tr>
                        <tr><th>Model</th><td>${product.model}</td></tr>
                        <tr><th>Brand</th><td>${product.brand}</td></tr>
                    </table>
                </div>
                <div class="col-md-6">
                    <table class="table table-striped">
                        <tr><th>Số lượng</th><td>${product.stock_quantity}</td></tr>
                        <tr><th>Unit</th><td>${product.unit}</td></tr>
                        <tr><th>Vị trí</th><td>${product.current_location}</td></tr>
                    </table>
                </div>
            </div>
            <button type="button" class="btn btn-primary btn-sm" onclick="addToList(${JSON.stringify(product).replace(/"/g, '&quot;')})">
                Thêm sản phẩm
            </button>
        `);
    }

    // Thêm sản phẩm vào danh sách và lưu vào localStorage
    // function addToList(product) {
    //     let products = JSON.parse(localStorage.getItem('productList')) || [];
    //     products.push(product);
    //     localStorage.setItem('productList', JSON.stringify(products));
    //     displayProductList(products);
    // }

    function addToList(product) {
        let products = JSON.parse(localStorage.getItem('productList')) || [];
        
        // Kiểm tra xem codename đã tồn tại trong danh sách hay chưa
        let existingProduct = products.find(p => p.codename === product.codename);
        
        if (existingProduct) {
            // Hiển thị cảnh báo nếu codename đã tồn tại
            iziToast.warning({
                title: 'Cảnh báo',
                message: 'Vật tư đã được thêm vào danh sách rồi!',
                position: 'topRight'
            });
        } else if (product.stock_quantity === 0) {
            // Hiển thị cảnh báo nếu stock_quantity bằng 0
            iziToast.warning({
                title: 'Cảnh báo',
                message: 'Không thể thêm sản phẩm có số lượng tồn kho bằng 0!',
                position: 'topRight'
            });
        } else {
            products.push(product);
            localStorage.setItem('productList', JSON.stringify(products));
            displayProductList(products);
        }
    }
    

    // Hiển thị danh sách sản phẩm dưới dạng bảng
    function displayProductList(products) {
        const tableBody = $('#productListTableBody');
        tableBody.html(''); // Xóa nội dung cũ

        if (products.length === 0) {
            tableBody.append(`<tr><td colspan="6" class="text-muted text-center">Danh sách trống.</td></tr>`);
        } else {
            products.forEach((product, index) => {
                tableBody.append(`
                    <tr>
                        <td>${index + 1}</td>
                        <td>${product.vietnamese_name}</td>
                        <td>${product.codename}</td>
                        <td>${product.stock_quantity}</td>
                        <td>
                            <input type="number" class="form-control form-control-sm export-quantity" 
                                   data-index="${index}" min="1" max="${product.stock_quantity}" placeholder="Nhập SL">
                        </td>
                        <td>
                            <button class="btn btn-danger btn-sm delete-product" data-index="${index}">
                                Xóa
                            </button>
                        </td>
                    </tr>
                `);
            });
        }
    }

    // Xóa sản phẩm khỏi danh sách
    function deleteProduct(index) {
        let products = JSON.parse(localStorage.getItem('productList')) || [];
        products.splice(index, 1); // Xóa sản phẩm tại vị trí index
        localStorage.setItem('productList', JSON.stringify(products));
        displayProductList(products);
    }

    // Khởi tạo danh sách sản phẩm khi tải trang
    let products = JSON.parse(localStorage.getItem('productList')) || [];
    displayProductList(products);

    // Xử lý sự kiện nhập số lượng xuất
    $(document).on('input', '.export-quantity', function () {
        const index = $(this).data('index');
        let quantity = parseInt($(this).val(), 10);

        // Kiểm tra xem giá trị có hợp lệ không (là số và lớn hơn 0)
        if (isNaN(quantity) || quantity <= 0) {
            quantity = 1; // Nếu không hợp lệ, gán số lượng mặc định là 1
        }

        // Lấy danh sách sản phẩm từ localStorage
        const productList = JSON.parse(localStorage.getItem('productList')) || [];

        const product = productList[index];

        // Kiểm tra số lượng xuất không lớn hơn số lượng hiện có
        if (quantity > product.stock_quantity) {          

            iziToast.warning({
                title: 'Cảnh báo',
                message: 'Số lượng xuất không được lớn hơn số lượng trong kho hiện có!',
                position: 'topRight'
            });
            $(this).val(product.stock_quantity); // Gán lại số lượng xuất bằng số lượng tồn kho nếu người dùng nhập quá
            quantity = product.stock_quantity; // Cập nhật giá trị số lượng xuất
        }

        // Cập nhật số lượng cho sản phẩm tại vị trí 'index'
        productList[index].quantity = quantity;

        // Lưu lại danh sách sản phẩm đã cập nhật vào localStorage
        localStorage.setItem('productList', JSON.stringify(productList));

        console.log(`Sản phẩm thứ ${index + 1} có số lượng xuất: ${quantity}`);
    });

    // Xử lý sự kiện xóa sản phẩm
    $(document).on('click', '.delete-product', function () {
        const index = $(this).data('index');
        deleteProduct(index);
    });
    

    // Xử lý sự kiện xuất phiếu
    $("#swal-6").click(function () {
         // Lấy giá trị số lượng và ghi chú từ các ô input
        const note = $('#note').val().trim();  // Lấy ghi chú và loại bỏ khoảng trắng thừa

        // Kiểm tra xem người dùng đã nhập ghi chú chưa
        if (note === '') {
            swal('Vui lòng nhập ghi chú!', {
                icon: 'error',
            });
            return;  // Dừng lại nếu ghi chú không được nhập
        }
        // Lấy danh sách sản phẩm từ localStorage
        const productList = JSON.parse(localStorage.getItem('productList')) || [];

        // Kiểm tra xem có sản phẩm nào chưa có số lượng xuất hợp lệ không
        for (let i = 0; i < productList.length; i++) {
            const quantity = productList[i].quantity;
    
            if (isNaN(quantity) || quantity <= 0) {
                swal(`Sản phẩm thứ ${i + 1} chưa có số lượng hợp lệ. Vui lòng nhập lại!`, {
                    icon: 'error',
                });
                return;  // Dừng lại nếu có sản phẩm chưa có số lượng hợp lệ
            }
        }

        swal({
            title: 'Bạn có chắc muốn xuất vật tư?',
            text: 'Sau khi xuất, bạn sẽ không thể khôi phục thao tác này!',
            icon: 'warning',
            buttons: true,
            dangerMode: true,
        })
        .then((willexport) => {
            if (willexport) {
                // Xóa dữ liệu khỏi localStorage

                const note = $('#note').val() || '';  // Lấy giá trị ghi chú, nếu không có thì mặc định là rỗng
                localStorage.removeItem('productList');

                 // Tạo mã đơn hàng
                 const orderId = generateOrderId();
                 console.log("Mã đơn hàng: ", orderId);

                const productsData = productList.map(product => ({
                    product_id: product.codename,
                    quantity: product.quantity,
                    product_name: product.vietnamese_name,
                    note: note,  // Nếu không có ghi chú, mặc định là chuỗi rỗng
                    type: product.type || 'export',  // Nếu không có loại, mặc định là 'out'
                    orderid: orderId  
                }));


                // Gọi API để cập nhật dữ liệu (Ví dụ sử dụng fetch)
                fetch('insert-product-inventory-history-export', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ 
                        products: productsData  // Gửi danh sách sản phẩm xuất kho
                    }),
                })
                .then(response => response.json())
                .then(data => {
                    console.log('Cập nhật thành công:', data);
                    swal('Xuất thành công!', {
                        icon: 'success',
                    });
                    // Cập nhật lại giao diện hoặc thực hiện các thao tác cần thiết khác

                     // 1. Reset form (Làm mới form)
                     $('#note').val('');  // Xóa ghi chú
                     $('.export-quantity').val('');  // Xóa tất cả các ô nhập số lượng
                     displayProductList([]);  // Danh sách trống sau khi xuất kho
                    // Nếu bạn muốn làm mới trang thay vì reset form:
                 //location.reload(); // Tải lại trang để cập nhật lại tất cả

                    // Gửi email thông báo yêu cầu xử lý đơn hàng
                    fetch('send-order-confirmation-email', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            products: productsData  // Gửi danh sách sản phẩm xuất kho
                        }),
                    })
                    .then(response => response.json())
                    .then(emailData => {
                        console.log('Email đã được gửi:', emailData);
                    })
                    .catch(emailError => {
                        console.error('Lỗi khi gửi email:', emailError);
                    });

                })
                .catch(error => {
                    console.error('Có lỗi xảy ra khi cập nhật:', error);
                    swal('Có lỗi xảy ra. Vui lòng thử lại!', {
                        icon: 'error',
                    });
                });
            } else {
                swal('Hủy Xuất Thành Công!');
            }
        });
    });






    // Hàm tạo mã đơn hàng theo định dạng "DHyyyyMMddHHmmss"
    function generateOrderId() {
        const currentDate = new Date();
        
        const year = currentDate.getFullYear();  // Lấy năm
        const month = String(currentDate.getMonth() + 1).padStart(2, '0');  // Lấy tháng, đảm bảo 2 chữ số
        const day = String(currentDate.getDate()).padStart(2, '0');  // Lấy ngày, đảm bảo 2 chữ số
        const hours = String(currentDate.getHours()).padStart(2, '0');  // Lấy giờ, đảm bảo 2 chữ số
        const minutes = String(currentDate.getMinutes()).padStart(2, '0');  // Lấy phút, đảm bảo 2 chữ số
        const seconds = String(currentDate.getSeconds()).padStart(2, '0');  // Lấy giây, đảm bảo 2 chữ số
        
        // Tạo mã đơn hàng với định dạng "DHyyyyMMddHHmmss"
        return `DH${year}${month}${day}${hours}${minutes}${seconds}`;
    }





    document.getElementById('exportToPdf').addEventListener('click', function () {
        const { jsPDF } = window.jspdf; // Lấy jsPDF từ window.jspdf
        const doc = new jsPDF();
    
        // Đặt font là DejaVu Sans (font mặc định của jsPDF hỗ trợ UTF-8)
        doc.setFont('DejaVu', 'normal');
    
        const table = document.getElementById('productListTableBody');
    
        // Tiêu đề
        doc.text("Danh sách sản phẩm cần xuất", 10, 10);
    
        const rows = [];
        table.querySelectorAll('tr').forEach((row, index) => {
            const cols = row.querySelectorAll('td');
            const data = Array.from(cols).map(col => col.textContent.trim());
            if (data.length > 0) {
                rows.push(data);  // Chỉ lấy dữ liệu cột
            }
        });
    
        // Tạo bảng PDF
        doc.autoTable({
            head: [['#', 'Tên sản phẩm', 'Code', 'SL Hiện Có', 'Số lượng xuất']],
            body: rows,
            startY: 20,
            theme: 'striped', // Thêm theme để bảng dễ nhìn
        });
    
        // Xuất file PDF
        doc.save('DanhSachSanPham.pdf');
    });

    
    
    
    
   
    
    


    document.getElementById('exportToExcel').addEventListener('click', function () {
        const table = document.getElementById('productListTableBody');
        const rows = [];
        table.querySelectorAll('tr').forEach(row => {
            const cols = row.querySelectorAll('td');
            rows.push(Array.from(cols).map(col => col.textContent.trim()));
        });
    
        const ws = XLSX.utils.aoa_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Danh sách sản phẩm");
        XLSX.writeFile(wb, "DanhSachSanPham.xlsx");
    });
    
    
