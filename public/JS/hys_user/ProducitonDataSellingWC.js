// Đẩy file lên để xử lý thành JSON trước khi update
async function uploadFile() {
    const fileInput = document.getElementById('fileInput');
    const file = fileInput.files[0]; // Lấy file từ input

    if (file) {
        const reader = new FileReader();
        showLoadingModal();
        // Đọc file dưới dạng binary
        // reader.onload = async function (e) {
        //     const data = new Uint8Array(e.target.result);
        //     const workbook = XLSX.read(data, { type: 'array' });

        //     // Lấy sheet đầu tiên
        //     const firstSheet = workbook.Sheets[workbook.SheetNames[0]];

        //     // Chuyển đổi sheet thành JSON
        //     const jsonData = XLSX.utils.sheet_to_json(firstSheet);
        //     console.log("JSON Data:", jsonData); // Kiểm tra dữ liệu JSON
          
        //     // Gửi dữ liệu theo từng phần
        //     await sendDataInChunks(jsonData, 500); // Chia thành các phần 500 bản ghi

        //     // Sau khi hoàn thành gửi dữ liệu, gọi hàm ... để cập nhật bảng
        // };
        
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
            const response = await fetch('insert-data-selling-wc', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(chunk) // Gửi từng phần
            });

            const data = await response.json();
            updateProgressBar((i + 1) / totalChunks * 100);
          //   iziToast.success({
          //     title: 'Thông báo',
          //     message: 'Tải thành công dữ liệu lên server!',
          //     position: 'topRight'
          // });

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
// Hàm gọi API
function fetchData() {
    const sellingInput = document.getElementById("Selling-input").value; 
    const workCenterDropdown = document.getElementById("work-center").value;
    let url = `get-data-selling-wc?page=${currentPage}&limit=${limit}`; // Tạo URL với các tham số

    // Thêm các tham số Selling và Work Center vào URL nếu có
    if (sellingInput) {
        url += `&selling=${encodeURIComponent(sellingInput)}`;
    }
    if (workCenterDropdown) {
        url += `&work_center=${encodeURIComponent(workCenterDropdown)}`;
    }

  // Gọi API
  fetch(url)
    .then(response => response.json())
    .then(data => {
      if (data.success && data.data && data.data.rs) {
        const users = data.data.data; // Lấy danh sách người dùng từ API
        const totalPages = data.pagination ? data.pagination.totalPages : 1; // Cập nhật tổng số trang từ API
        const tableBody = document.querySelector("#table-1 tbody"); // Lấy tbody trong bảng
        tableBody.innerHTML = ""; // Xóa dữ liệu cũ trong bảng

        // Lặp qua danh sách người dùng và tạo các hàng bảng
        users.forEach(item => {
          const row = document.createElement("tr");

          row.innerHTML = `
                          <td>${item.id}</td>
                          <td>${item.selling}</td>
                          <td>${item.work_center}</td> 
                          <td>${formatDateTime(item.created_at)}</td>
                          <td>${formatDateTime(item.updated_at)}</td> 
                          <td><a href="#" class="btn btn-primary">Detail</a></td>
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
  populateWorkCenterDropdown();
});

// Function to populate Work Center dropdown
async function populateWorkCenterDropdown() {
    try {
        const response = await fetch('get-data-wc');
        const data = await response.json();
        
        const workCenterDropdown = document.getElementById('work-center');
        data.data.data.forEach(item => {
            const option = document.createElement('option');
            option.value = item.work_center;
            option.text = item.work_center;
            workCenterDropdown.appendChild(option);
        });
    } catch (error) {
        console.error('Error fetching work center data:', error);
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
  const hours = String(date.getHours()).padStart(2, '0'); // Giờ
  const minutes = String(date.getMinutes()).padStart(2, '0'); // Phút
  const seconds = String(date.getSeconds()).padStart(2, '0'); // Giây

  return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`; // Định dạng kết quả
}