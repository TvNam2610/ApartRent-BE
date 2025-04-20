
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
// Hàm gọi API
function fetchData() {
    const modelInput = document.getElementById("model-input").value; 
    //const brandSelect = document.getElementById("brand").value; 
    const transaction_status = document.getElementById("transaction_status").value;
    let url = `get-data-product-inventory-history-export?page=${currentPage}&limit=${limit}`; // Tạo URL với các tham số

   
    if (modelInput) {
        url += `&transaction_orderid=${encodeURIComponent(modelInput)}`;
    }
    // if (brandSelect) {
    //     url += `&brand=${encodeURIComponent(brandSelect)}`;
    // }
    if(transaction_status){
        
        url += `&transaction_status=${encodeURIComponent(transaction_status)}`;
    }
  // Gọi API
  fetch(url)
    .then(response => response.json())
    .then(data => {
        //console.log(data);
      if (data.success && data.data && data.data.rs) {
        const users = data.data.data; // Lấy danh sách người dùng từ API
        const totalPages = data.pagination ? data.pagination.totalPages : 1; // Cập nhật tổng số trang từ API
        const tableBody = document.querySelector("#table-1 tbody"); // Lấy tbody trong bảng
        tableBody.innerHTML = ""; // Xóa dữ liệu cũ trong bảng

        // Lặp qua danh sách người dùng và tạo các hàng bảng
        users.forEach(item => {
          const row = document.createElement("tr");

          row.innerHTML = `
                        <td>${item.transaction_id}</td>
                        <td>${item.orderid}</td>
                        <td>${item.product_id}</td> 
                        <td>${item.product_name}</td>
                        <td>${item.quantity}</td>
                        <td>${item.model}</td> 
                        <td>${item.brand}</td>
                        <td>${item.unit}</td> 
                        <td>${item.stock_quantity}</td>
                        <td>${item.current_location}</td>
                                               
                        <td>
                            <div class="badge 
                                ${item.transaction_status === 'pending' ? 'badge-warning' :
                                item.transaction_status === 'approved' ? 'badge-success' :
                                item.transaction_status === 'rejected' ? 'badge-danger' : ''
                            } badge-shadow">
                                ${item.transaction_status === 'pending' ? 'Đang xử lý' : 
                                item.transaction_status === 'approved' ? 'Đã duyệt' : 
                                item.transaction_status === 'rejected' ? 'Không Duyệt' : ''}
                            </div>
                        </td>

                        <td>${formatDateTime(item.transaction_created_at)}</td>  


                        <td>
                            ${item.transaction_status === 'pending' ? `
                                <div class="btn-group" role="group" aria-label="Transaction Actions">
                                    <a class="btn btn-success" onclick="updateStatus('${item.orderid}', 'approved','${item.stock_quantity - item.quantity}','${item.product_id}')">Approved</a>
                                    <a class="btn btn-danger" onclick="updateStatus('${item.orderid}', 'rejected','${item.stock_quantity}','${item.product_id}')">Rejected</a>
                                </div>
                            ` : ''}
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
  const range = 2; // Hiển thị 2 trang xung quanh trang hiện tại
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




// Hàm cập nhật trạng thái
async function updateStatus(orderid, status, quantity_new,product_id) {
  try {
        // Kiểm tra nếu quantity_new nhỏ hơn 0
        if (quantity_new < 0) {
          // Cảnh báo không thể xác nhận xuất hàng nếu số lượng mới nhỏ hơn 0
          iziToast.error({
              title: 'Lỗi',
              message: 'Không thể xác nhận xuất hàng vì kho đã hết!',
              position: 'topRight'
          });
          return;  // Dừng việc thực hiện nếu quantity_new nhỏ hơn 0
      }
      // Tạo đối tượng yêu cầu với thông tin đơn hàng và trạng thái mới
      const requestBody = {
          orders: [
              {
                  orderid: orderid,
                  status: status,
                  quantity_new : quantity_new,
                  codename :product_id
              }
          ]
      };
//console.log(requestBody)
      // Gọi API để cập nhật trạng thái
      const response = await fetch('update-inventory-transaction-status-by-order', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestBody)
      });

      // Kiểm tra kết quả trả về từ API
      const result = await response.json();
      if (response.ok) {
          //alert(result.message || 'Cập nhật trạng thái thành công!'); // Thông báo thành công

          iziToast.success({
            title: 'Thông báo',
            message: result.message || 'Cập nhật trạng thái thành công!',
            position: 'topRight'
        });
          fetchData(); // Gọi lại hàm fetchData để cập nhật bảng dữ liệu
      } else {
          throw new Error(result.message || 'Có lỗi xảy ra khi cập nhật trạng thái.');
      }
  } catch (error) {
      console.error('Error updating status:', error);
      alert('Có lỗi xảy ra khi cập nhật trạng thái.');
  }
}


