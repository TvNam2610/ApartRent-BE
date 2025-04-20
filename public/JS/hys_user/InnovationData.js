// Đẩy file lên để xử lý thành JSON trước khi update
async function uploadFile() {
    const fileInput = document.getElementById('fileInput');
    const file = fileInput.files[0]; // Lấy file từ input

    if (file) {
        const reader = new FileReader();
        showLoadingModal();
        
        reader.onload = async function (e) {
          try {
              const data = new Uint8Array(e.target.result);
              const workbook = XLSX.read(data, { type: 'array' });
              const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
              const jsonData = XLSX.utils.sheet_to_json(firstSheet);

              console.log("JSON Data:", jsonData);
              await sendDataInChunks(jsonData, 500);
          } catch (error) {
              iziToast.error({
                  title: 'Lỗi đọc FILE',
                  message: 'Đã xảy ra lỗi khi xử lý file!',
                  position: 'topRight'
              });
              hideLoadingModal();
          }
      };

        reader.readAsArrayBuffer(file);
    } else {
        iziToast.error({
          title: 'Lỗi đẩy FILE',
          message: 'Vui lòng chọn một file Excel để tải lên !',
          position: 'topRight'
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
            const response = await fetch('insert-product-inventory-by-data', {
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
            iziToast.error({
              title: 'Lỗi',
              message: 'Đã xảy ra lỗi khi gửi dữ liệu lên server!',
              position: 'topRight'
          });
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

let totalPages = 1;  // Mặc định tổng số trang
let currentPage = 1; // Mặc định trang 1
let limit = document.getElementById("pageSize") ? document.getElementById("pageSize").value : 10; // Mặc định limit là 10 nếu chưa chọn

// Kiểm tra và lắng nghe sự kiện thay đổi số lượng bản ghi (pageSize)
const pageSizeElement = document.getElementById("pageSize");
if (pageSizeElement) {
  pageSizeElement.addEventListener("change", function () {
    limit = this.value; // Cập nhật giá trị limit khi người dùng thay đổi
    currentPage = 1; // Reset về trang 1 khi thay đổi số lượng bản ghi
    fetchData(); // Gọi lại API với giá trị limit mới
  });
}
document.getElementById('search-button').addEventListener('click', fetchData); // Trigger fetchData on button click


// // Hàm gọi API
// function fetchData() {
//     const modelInput = document.getElementById("model-input").value; 
//     const brandSelect = document.getElementById("brand").value; 
//     const current_locationInput = document.getElementById("current_location").value;
//     let url = `get-data-product-inventory-search?page=${currentPage}&limit=${limit}`; // Tạo URL với các tham số

   
//     if (modelInput) {
//         url += `&model=${encodeURIComponent(modelInput)}`;
//     }
//     if (brandSelect) {
//         url += `&brand=${encodeURIComponent(brandSelect)}`;
//     }
//     if(current_locationInput){
        
//         url += `&current_location=${encodeURIComponent(current_locationInput)}`;
//     }
//   // Gọi API
//   fetch(url)
//     .then(response => response.json())
//     .then(data => {
//         //console.log(data);
//       if (data.success && data.data && data.data.rs) {
//         const users = data.data.data; // Lấy danh sách người dùng từ API
//         const totalPages = data.pagination ? data.pagination.totalPages : 1; // Cập nhật tổng số trang từ API
//         const tableBody = document.querySelector("#table-1 tbody"); // Lấy tbody trong bảng
//         tableBody.innerHTML = ""; // Xóa dữ liệu cũ trong bảng

//         // Lặp qua danh sách người dùng và tạo các hàng bảng
//         users.forEach(item => {
//           const row = document.createElement("tr");
//           // Kiểm tra điều kiện nếu `stock_quantity` nhỏ hơn `min_quantity`
//           if (item.stock_quantity < item.min_quantity) {
//             row.style.backgroundColor = "#FFEFD5"; // Đổi nền dòng thành màu vàng
//           }


//           row.innerHTML = `
//                         <td>${item.codename}</td>
//                         <td>${item.english_name || "-"}</td>
//                         <td>${item.vietnamese_name}</td> 
//                         <td>${item.model}</td>
//                         <td>${item.brand}</td>
//                         <td>${item.specifications}</td> 
//                         <td>${item.stock_quantity}</td>
//                         <td>${item.order_quantity}</td> 
//                         <td>${item.unit}</td>
//                         <td>${item.current_location}</td>
//                         <td>${item.min_quantity}</td>
//                         <td>${item.max_quantity}</td>
//                         <td>${formatDateTime(item.updated_at)}</td> 
//                         <td>
//                             <div class="btn-group" role="group">
//                                <a class="btn btn-primary btn-sm edit-btn" data-id="${item.id}">Sửa</a>

//                                 <a href="#" class="btn btn-danger btn-sm">Xóa</a>
//                             </div>
//                         </td>
//                       `;

//           tableBody.appendChild(row); // Thêm hàng vào bảng
//         });

//         // Cập nhật phân trang
//         updatePagination(data);
//       } else {
//         alert("Không có dữ liệu người dùng.");
//       }
//     })
//     .catch(error => {
//       console.error('Error fetching data:', error);
//       alert("Có lỗi xảy ra khi lấy dữ liệu.");
//     });
// }

// Hàm tạo nút "..."
function createEllipsis(linkPage) {
  const ellipsis = document.createElement('li');
  ellipsis.classList.add('page-item');
  const ellipsisLink = document.createElement('a');
  ellipsisLink.classList.add('page-link');
  ellipsisLink.href = '#';
  ellipsisLink.textContent = '...';
  ellipsisLink.addEventListener('click', function (e) {
    e.preventDefault();
    currentPage = linkPage;
    fetchData();
  });
  ellipsis.appendChild(ellipsisLink);
  return ellipsis;
}

// Hàm cập nhật phân trang
function updatePagination(data) {
  const paginationContainer = document.querySelector('.pagination');
  paginationContainer.innerHTML = ''; // Xóa các trang hiện tại

  const totalPages = data.pagination ? data.pagination.totalPages : 1; // Tổng số trang từ API
  currentPage = parseInt(data.pagination ? data.pagination.currentPage : 1); // Cập nhật trang hiện tại từ API

  // Tạo nút Previous
  const prevButton = document.createElement('li');
  prevButton.classList.add('page-item');
  if (currentPage === 1) {
    prevButton.classList.add('disabled');
  }
  const prevLink = document.createElement('a');
  prevLink.classList.add('page-link');
  prevLink.href = '#';
  prevLink.innerHTML = '<i class="fas fa-chevron-left"></i>';
  prevLink.addEventListener('click', function (e) {
    e.preventDefault();
    if (currentPage > 1) {
      currentPage--;
      fetchData(); // Gọi lại API với trang mới
    }
  });
  prevButton.appendChild(prevLink);
  paginationContainer.appendChild(prevButton);

  // Hiển thị các trang gần với trang hiện tại, ví dụ: trang hiện tại và các trang xung quanh nó
  const range = 1; // Hiển thị 2 trang xung quanh trang hiện tại
  let startPage = Math.max(1, currentPage - range);
  let endPage = Math.min(totalPages, currentPage + range);

  // Nếu có nhiều trang hơn, thêm nút "..." cho các trang bị bỏ qua
  if (startPage > 1) {
    paginationContainer.appendChild(createEllipsis(1));
  }

  // Tạo các nút trang
  for (let i = startPage; i <= endPage; i++) {
    const pageItem = document.createElement('li');
    pageItem.classList.add('page-item');
    if (i === currentPage) {
      pageItem.classList.add('active');
    }

    const pageLink = document.createElement('a');
    pageLink.classList.add('page-link');
    pageLink.href = '#';
    pageLink.textContent = i;

    pageLink.addEventListener('click', function (e) {
      e.preventDefault();
      currentPage = i; // Cập nhật trang hiện tại
      fetchData(); // Gọi lại API với trang mới
    });

    pageItem.appendChild(pageLink);
    paginationContainer.appendChild(pageItem);
  }

  // Nếu có nhiều trang, thêm nút "..."
  if (endPage < totalPages) {
    paginationContainer.appendChild(createEllipsis(totalPages));
  }

  // Tạo nút Next
  const nextButton = document.createElement('li');
  nextButton.classList.add('page-item');
  if (currentPage === totalPages) {
    nextButton.classList.add('disabled');
  }
  const nextLink = document.createElement('a');
  nextLink.classList.add('page-link');
  nextLink.href = '#';
  nextLink.innerHTML = '<i class="fas fa-chevron-right"></i>';
  nextLink.addEventListener('click', function (e) {
    e.preventDefault();
    if (currentPage < totalPages) {
      currentPage++;
      fetchData(); // Gọi lại API với trang mới
    }
  });
  nextButton.appendChild(nextLink);
  paginationContainer.appendChild(nextButton);
}

document.addEventListener("DOMContentLoaded", function () {
  // Gọi hàm fetchData khi trang đã được tải xong
  fetchData(); // Gọi API mặc định khi trang được tải, không cần chờ chọn hay nhấn gì cả

});


// hàm quy đổi time
function formatDateTime(isoString) {
  if (!isoString) {
      return ''; // Hoặc trả về 'Chưa có dữ liệu'
  }
  const date = new Date(isoString);
  const day = String(date.getDate()).padStart(2, '0'); // Lấy ngày và thêm số 0 ở đầu nếu cần
  const month = String(date.getMonth() + 1).padStart(2, '0'); // Tháng (0-11 nên cộng thêm 1)
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0'); // Giờ
  const minutes = String(date.getMinutes()).padStart(2, '0'); // Phút
  const seconds = String(date.getSeconds()).padStart(2, '0'); // Giây

  return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`; // Định dạng kết quả
}



document.addEventListener("DOMContentLoaded", function() {
    const models = [
        // "FX3G-24MT", "FX-USB-AW", "Spindel 95W", "No 9815-V22A", "Cat5e UTP Moduler Plug",
        // "107x12x1.6mm", "N/A", "40x40 M6", "30x30 M6", "30x30 M5", "20x20 M5",
        // "Wifi & Bluetooth Based ESP32", "I4SM", "SW4DNX-ACT-EA", "SW1DND-GXW2-EA", "SW8D5C-GPPW-EA",
        // "DC B115", "HSS-Cable-5m0", "USB type B- USB type A", "FT-420-10", "DM542-05", "RCS110",
        // "FX2N-8EYT-ESS", "FX2N-16EYT", "DVP28SS2", "DVP14SS2", "PSP24-060S", "SK-043FE", "SK-050FE",
        // "ACA 2725-1", "ACA 1620-2", "626-2Z", "2M-280- 6", "2M-20- trục 6mm", "2M-60- trục 6mm",
        // "SDA 20x15", "SDA 12x20", "MA 25x300 SU", "MA 25x160 SU", "HLH 6x25", "HLQ 6x50S", "MA 16x50SCA",
        // "CDRB2BW30-180SZ-D-A93", "CM2KBZ20-25Z", "CJKB10-35Z", "CJ2B6-10SR", "CXSM15-100", "ZPT16CS-A5",
        // "ACS606", "2HSS57", "BLM57050-1000", "57HSE 2.2N", "57J1880EC-1000-LS", "57HS7630A4D8", "86CY6450",
        // "VCSF", "5Mil x 3/4''x20Y", "HYBT15A", "HYBT15A-2", "BTX1M-DDT", "S7-1200-1214CPU", "PL-05N",
        // "E1008", "SV1-3", "RV2-5B", "RV2-5R", "RV1-3R", "RV2-3Y", "RMT 32x200", "HLQ 6x30S", "RMT 16x330",
        // "RMH 10x250", "HRF 32", "TCM 16x10", "HFD 12x50", "MI 25x500 SCA", "MI 25x50 SU", "MI 25x300SCA",
        // "MI 20x100CA", "MI 25x160SCA", "CM2c20-150Z", "MI 20x200SU", "HYBT15", "HYBT-07", "HYBT15-2",
        // "CMSNDPM6-5", "DMSE-N50", "DMSE-NPN 12DU", "D-A93", "CRE-25R1R", "YW1P"
        '107x12x1.6mm','20x20 M5','2HSS57','2M-20- trục 6mm','2M-280- 6','2M-60- trục 6mm','30x30 M5','30x30 M6','40x40 M6','57HS7630A4D8','57HSE 2.2N','57J1880EC-1000-LS','5Mil x 3/4','x20Y','626-2Z','86CY6450','ACA 1620-2','ACA 2725-1','ACS606','BLM57050-1000','BTX1M-DDT','Cat5e UTP Moduler Plug','CDRB2BW30-180SZ-D-A93','CJ2B6-10SR','CJKB10-35Z','CM2c20-150Z','CM2KBZ20-25Z','CMSNDPM6-5','CRE-25R1R','CXSM15-100','D-A93','DC B115','DM542-05','DMSE-N50','DMSE-NPN 12DU','DVP14SS2','DVP28SS2','E1008','FT-420-10','FX-USB-AW','FX2N-16EYT','FX2N-8EYT-ESS','FX3G-24MT','HFD 12x50','HLH 6x25','HLQ 6x30S','HLQ 6x50S','HRF 32','HSS-Cable-5m0','HYBT-07','HYBT15','HYBT15-2','HYBT15A','HYBT15A-2','I4SM','MA 16x50SCA','MA 25x160 SU','MA 25x300 SU','MI 20x100CA','MI 20x200SU','MI 25x160SCA','MI 25x300SCA','MI 25x50 SU','MI 25x500 SCA','N/A','No 9815-V22A','PL-05N','PSP24-060S','RCS110','RMH 10x250','RMT 16x330','RMT 32x200','RV1-3R','RV2-3Y','RV2-5B','RV2-5R','S7-1200-1214CPU','SDA 12x20','SDA 20x15','SK-043FE','SK-050FE','Spind'
    ];

    const input = document.getElementById('model-input');
    input.addEventListener('input', function() {
        const val = this.value;
        let suggestions = models.filter(model => model.toLowerCase().includes(val.toLowerCase()));
        const datalist = document.getElementById('model-list');
        datalist.innerHTML = '';
        suggestions.forEach(model => {
            const option = document.createElement('option');
            option.value = model;
            datalist.appendChild(option);
        });
    });
});





// Hàm gọi API để thêm sản phẩm mới
async function addProduct() {
  // Thu thập dữ liệu từ form
  const product = {
      codename: document.getElementById('codename').value,
      english_name: document.getElementById('englishName').value,
      vietnamese_name: document.getElementById('vietnameseName').value,
      model: document.getElementById('model').value,
      brand: document.getElementById('brand').value,
      specifications: document.getElementById('specifications').value,
      stock_quantity: parseInt(document.getElementById('stockQuantity').value, 10) || 0,
      order_quantity: parseInt(document.getElementById('orderQuantity').value, 10) || 0,
      unit: document.getElementById('unit').value,
      current_location: document.getElementById('currentLocation').value,
      min_quantity: parseInt(document.getElementById('min_quantity').value, 10) || 0,
      max_quantity: parseInt(document.getElementById('max_quantity').value, 10) || 0,
  };

  try {
      // Gửi yêu cầu POST đến API backend
      const response = await fetch('insert-product', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
          },
          body: JSON.stringify(product),
      });

      const result = await response.json();

      if (response.ok && result.success) {
          iziToast.success({
              title: 'Thành công',
              message: 'Sản phẩm đã được thêm thành công!',
              position: 'topRight',
          });

          // Reset form sau khi thêm thành công
          document.getElementById('addProductForm').reset();
      } else {
          throw new Error(result.message || 'Có lỗi xảy ra khi thêm sản phẩm!');
      }
  } catch (error) {
      iziToast.error({
          title: 'Lỗi',
          message: `Không thể thêm sản phẩm: ${error.message}`,
          position: 'topRight',
      });
  }
}

// Hàm gọi API
function fetchData() {
  const modelInput = document.getElementById("model-input").value;
  const brandSelect = document.getElementById("brand").value;
  const current_locationInput = document.getElementById("current_location").value;
  let url = `get-data-product-inventory-search?page=${currentPage}&limit=${limit}`; // Tạo URL với các tham số


  if (modelInput) {
    url += `&model=${encodeURIComponent(modelInput)}`;
  }
  if (brandSelect) {
    url += `&brand=${encodeURIComponent(brandSelect)}`;
  }
  if (current_locationInput) {

    url += `&current_location=${encodeURIComponent(current_locationInput)}`;
  }
  // Gọi API
  fetch(url)
    .then(response => response.json())
    .then(data => {
     // console.log(data);
      if (data.success && data.data && data.data.rs) {
        const users = data.data.data; // Lấy danh sách người dùng từ API
        const totalPages = data.pagination ? data.pagination.totalPages : 1; // Cập nhật tổng số trang từ API
        const tableBody = document.querySelector("#table-1 tbody"); // Lấy tbody trong bảng
        tableBody.innerHTML = ""; // Xóa dữ liệu cũ trong bảng

        // Lặp qua danh sách người dùng và tạo các hàng bảng
        users.forEach(item => {
          const row = document.createElement("tr");
          // Kiểm tra điều kiện nếu `stock_quantity` nhỏ hơn `min_quantity`
          if (item.stock_quantity < item.min_quantity) {
            row.style.backgroundColor = "#FFEFD5"; // Đổi nền dòng thành màu vàng
          }


          row.innerHTML = `
                        <td>${item.codename}</td>
                        <td>${item.english_name || "-"}</td>
                        <td>${item.vietnamese_name}</td> 
                        <td>${item.model}</td>
                        <td>${item.brand}</td>
                        <td>${item.specifications}</td> 
                        <td>${item.stock_quantity}</td>
                        <td>${item.order_quantity}</td> 
                        <td>${item.unit}</td>
                        <td>${item.current_location}</td>
                        <td>${item.min_quantity}</td>
                        <td>${item.max_quantity}</td>
                        <td>${formatDateTime(item.updated_at)}</td> 
                        <td>
                            <div class="btn-group" role="group">
                               <a class="btn btn-primary btn-sm edit-btn" onclick="showModal(${item.id})">Sửa</a>
                                <a href="#" class="btn btn-danger btn-sm">Xóa</a>
                            </div>
                        </td>
                      `;

          tableBody.appendChild(row); // Thêm hàng vào bảng
        });

        // Cập nhật phân trang
        updatePagination(data);
      } else {
        alert("Không có dữ liệu người dùng.");
      }
    })
    .catch(error => {
      console.error('Error fetching data:', error);
      alert("Có lỗi xảy ra khi lấy dữ liệu.");
    });
}


// Hiển thị modal và đổ dữ liệu sản phẩm
function showModal(productId) {
  $.ajax({
    url: `product/${productId}`,  // API lấy thông tin sản phẩm
    method: 'GET',
    success: function (response) {
      console.log("trs",response)
      if (response.data) {
        const product = response.data;
        console.log(product)

        // Gán dữ liệu vào modal
        $('#productForm [name="id"]').val(product.id);
        $('#productForm [name="english_name"]').val(product.english_name || "");
        $('#productForm [name="vietnamese_name"]').val(product.vietnamese_name || "");
        $('#productForm [name="model"]').val(product.model || "");
        $('#productForm [name="brand"]').val(product.brand || "");
        $('#productForm [name="specifications"]').val(product.specifications || "");
        $('#productForm [name="stock_quantity"]').val(product.stock_quantity || 0);
        $('#productForm [name="order_quantity"]').val(product.order_quantity || 0);
        $('#productForm [name="unit"]').val(product.unit || "");
        $('#productForm [name="min_quantity"]').val(product.min_quantity || 0);
        $('#productForm [name="max_quantity"]').val(product.max_quantity || 0);
        $('#productForm [name="codename"]').val(product.codename || "");
        $('#productForm [name="current_location"]').val(product.current_location || "");
        $('#productForm [name="created_at"]').val(formatDateTime(product.created_at) || "").prop('readonly', true);
        $('#productForm [name="updated_at"]').val(formatDateTime(product.updated_at) || "").prop('readonly', true);
        
        // Hiển thị modal
        $('#exampleModal').modal('show');
      } else {
        iziToast.error({
          title: 'Lỗi',
          message: 'Không thể lấy thông tin sản phẩm.',
          position: 'topRight'
        });
      }
    },
    error: function () {
      alert('Đã xảy ra lỗi khi lấy dữ liệu.');
    }
  });
}



// Lắng nghe sự kiện khi bấm nút "Save changes"
$('#saveChanges').on('click', function () {
  // Lấy dữ liệu từ các trường trong modal
  const productId = $('#productForm [name="id"]').val();
  const data = {
    english_name: $('#productForm [name="english_name"]').val(),
    vietnamese_name: $('#productForm [name="vietnamese_name"]').val(),
    model: $('#productForm [name="model"]').val(),
    brand: $('#productForm [name="brand"]').val(),
    specifications: $('#productForm [name="specifications"]').val(),
    stock_quantity: $('#productForm [name="stock_quantity"]').val(),
    order_quantity: $('#productForm [name="order_quantity"]').val(),
    unit: $('#productForm [name="unit"]').val(),
    min_quantity: $('#productForm [name="min_quantity"]').val(),
    max_quantity: $('#productForm [name="max_quantity"]').val(),
    codename: $('#productForm [name="codename"]').val(),
    current_location: $('#productForm [name="current_location"]').val()
  };

  // Gửi yêu cầu API cập nhật thông tin sản phẩm
  $.ajax({
    url: `product/${productId}`,  // Cập nhật URL API của bạn
    method: 'PUT',  // Hoặc 'PATCH' tùy thuộc vào API của bạn
    data: JSON.stringify(data),  // Chuyển dữ liệu thành JSON string
    contentType: 'application/json',  // Đảm bảo API nhận dữ liệu JSON
    success: function (response) {
      if (response.success) {
        iziToast.success({
          title: 'Thông báo',
          message: 'Cập nhật thông tin sản phẩm thành công!',
          position: 'topRight'
        });
        $('#exampleModal').modal('hide');  // Đóng modal sau khi cập nhật thành công

        fetchData();  // Làm mới bảng sau khi cập nhật
      } else {
        iziToast.error({
          title: 'Lỗi',
          message: 'Không thể cập nhật thông tin sản phẩm.',
          position: 'topRight'
        });
      }
    },
    error: function () {
      alert('Đã xảy ra lỗi trong quá trình cập nhật.');
    }
  });
});