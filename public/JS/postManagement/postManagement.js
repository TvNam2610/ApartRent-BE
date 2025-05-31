// Mặc định trang và số lượng bản ghi
let currentPage = 1;  // Mặc định trang 1
let limit = document.getElementById("pageSize") ? document.getElementById("pageSize").value : 10;  // Mặc định limit là 10 nếu chưa chọn
let totalPages = 1;  // Mặc định tổng số trang
let currentStatus = "PENDING";  // Mặc định là "Pending" (1)
let posts = [];  // Mảng lưu trữ danh sách bài viết

// Lắng nghe sự kiện khi bấm vào tab trạng thái
const statusTabs = document.getElementById("statusTabs");
if (statusTabs) {
    statusTabs.addEventListener("click", function (e) {
        const target = e.target.closest("a"); // Lấy thẻ <a> khi bấm vào tab
        if (target) {
            // Thay đổi class active cho tab
            const currentActive = document.querySelector(".nav-link.active");
            if (currentActive) currentActive.classList.remove("active");
            target.classList.add("active");

            // Lấy giá trị của data-status từ tab được chọn
            currentStatus = target.getAttribute("data-status") || '';

            // Cập nhật lại số lượng bản ghi theo trạng thái (có thể cập nhật từ server)
            fetchData();  // Gọi lại API với trạng thái mới
        }
    });
}


// Kiểm tra và lắng nghe sự kiện thay đổi số lượng bản ghi (pageSize)
const pageSizeElement = document.getElementById("pageSize");
if (pageSizeElement) {
    pageSizeElement.addEventListener("change", function () {
        limit = this.value;  // Cập nhật giá trị limit khi người dùng thay đổi
        currentPage = 1;  // Reset về trang 1 khi thay đổi số lượng bản ghi
        fetchData();  // Gọi lại API với giá trị limit mới
    });
}

// Kiểm tra và lắng nghe sự kiện tìm kiếm
const searchButton = document.getElementById("search-button");
if (searchButton) {
    searchButton.addEventListener("click", function (e) {
        e.preventDefault();  // Ngăn chặn việc reload trang (submit form)

        currentPage = 1;  // Reset về trang 1 khi bấm tìm kiếm
        fetchData();  // Gọi lại API khi bấm tìm kiếm
    });
}



// Hàm cập nhật phân trang
function updatePagination(data) {
    const paginationContainer = document.querySelector('.pagination');
    paginationContainer.innerHTML = '';  // Xóa các trang hiện tại

    const totalPages = data.pagination.totalPages;  // Tổng số trang từ API
    currentPage = parseInt(data.pagination.currentPage);  // Cập nhật trang hiện tại từ API

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
            fetchData();  // Gọi lại API với trang mới
        }
    });
    prevButton.appendChild(prevLink);
    paginationContainer.appendChild(prevButton);

    // Hiển thị các trang gần với trang hiện tại, ví dụ: trang hiện tại và các trang xung quanh nó
    const range = 2;  // Hiển thị 2 trang xung quanh trang hiện tại
    let startPage = Math.max(1, currentPage - range);
    let endPage = Math.min(totalPages, currentPage + range);

    // Nếu có nhiều trang hơn, thêm nút "..." cho các trang bị bỏ qua
    if (startPage > 1) {
        const ellipsis = document.createElement('li');
        ellipsis.classList.add('page-item');
        const ellipsisLink = document.createElement('a');
        ellipsisLink.classList.add('page-link');
        ellipsisLink.href = '#';
        ellipsisLink.textContent = '...';
        ellipsisLink.addEventListener('click', function (e) {
            e.preventDefault();
            currentPage = 1;
            fetchData();
        });
        ellipsis.appendChild(ellipsisLink);
        paginationContainer.appendChild(ellipsis);
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
            fetchData();  // Gọi lại API với trang mới
        });

        pageItem.appendChild(pageLink);
        paginationContainer.appendChild(pageItem);
    }

    // Nếu có nhiều trang, thêm nút "..."
    if (endPage < totalPages) {
        const ellipsis = document.createElement('li');
        ellipsis.classList.add('page-item');
        const ellipsisLink = document.createElement('a');
        ellipsisLink.classList.add('page-link');
        ellipsisLink.href = '#';
        ellipsisLink.textContent = '...';
        ellipsisLink.addEventListener('click', function (e) {
            e.preventDefault();
            currentPage = totalPages;
            fetchData();
        });
        ellipsis.appendChild(ellipsisLink);
        paginationContainer.appendChild(ellipsis);
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
            fetchData();  // Gọi lại API với trang mới
        }
    });
    nextButton.appendChild(nextLink);
    paginationContainer.appendChild(nextButton);
}
document.addEventListener("DOMContentLoaded", function () {
    // Gọi hàm fetchData khi trang đã được tải xong
    fetchData();  // Gọi API mặc định khi trang được tải, không cần chờ chọn hay nhấn gì cả
});


// Hàm mở tab mới với đường dẫn
// function openDetailPage(maphieu) {
//     // Mở một tab mới với URL chứa maphieu
//     window.open(`/kaizen-get-by-data?maphieu=${maphieu}`, '_blank');
// }


// Khởi tạo tooltip cho các phần tử có data-bs-toggle="tooltip"
const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl));


// Hàm gọi API
function fetchData() {
    const searchQuery = document.getElementById("employee_id_search").value || '';

    const status = currentStatus;
    //const url = `get-kaizen-system?page=${currentPage}&limit=${limit}&ma_nv=${employee_id}&status=${status}`;  // Tạo URL với các tham số
    const url = `/api/posts?searchQuery=${encodeURIComponent(searchQuery)}&status=${status}&page=${currentPage}&limit=${limit}`;


    // Gọi API
    fetch(url)
        .then(response => response.json())
        .then(data => {
            if (data) {
                posts = data.posts || [];
                totalPages = data.pagination.totalPages || 1;  // Cập nhật tổng số trang từ API
                const tableBody = document.querySelector("#table-1 tbody");
                tableBody.innerHTML = "";
          
                // Lặp qua danh sách người dùng và tạo các hàng bảng
                posts.forEach(item => {
                    const row = document.createElement("tr");

                    row.innerHTML = `
                            <td>${item.id}</td>

                            <td class="text-truncate" style="max-width: 200px;" data-bs-toggle="tooltip" data-bs-placement="top" title="${item.title}">${item.title}</td>
                            <td>${item.packageType}</td>
                            <td>${Number(item.realEstatePrice).toLocaleString('vi-VN')} VNĐ</td>
                            <td>${item.area} m²</td>
                            <td>${item.location}</td>
                            <td>${item.bedrooms}</td>
                            <td>
                                <span class="badge ${
                                item.realEstateStatus === 'FOR_RENT' ? 'badge-info' :
                                item.realEstateStatus === 'FOR_SALE' ? 'badge-success' :
                                'badge-secondary'
                                }">${item.realEstateStatus}</span>
                            </td>
                            <td>${new Date(item.createAt).toLocaleDateString('vi-VN')}</td>
                            <td>${item.username}</td>
                            <td class="d-flex justify-content-center align-items-center">
                                ${currentStatus === 'PENDING' ? `
                                <button class="btn btn-sm btn-success" onclick="approvePost(${item.id})">Approve</button>
                                <button class="btn btn-sm btn-danger" onclick="rejectPost(${item.id})">Reject</button>
                                ` : ''}
                            </td>
                        `;

                    tableBody.appendChild(row);  // Thêm hàng vào bảng
                });

                // Cập nhật phân trang
                updatePagination(data);

                // Update Pending, Processed, and Complete Counts dynamically
                if (data.statusCounts) {
                    // Update Pending count
                    const pendingCountElement = document.getElementById("pending-count");
                    if (pendingCountElement) {
                        pendingCountElement.textContent = data.statusCounts.pending;  // Update the count
                    }

                    // Update Processed count
                    const rejectedCountElement = document.getElementById("rejected-count");
                    if (rejectedCountElement) {
                        rejectedCountElement.textContent = data.statusCounts.rejected;  // Update the count
                    }
                    const approvedCountElement = document.getElementById("approved-count");
                    if (approvedCountElement) {
                        approvedCountElement.textContent = data.statusCounts.approved;  // Update the count
                    }
                }

            } else {
                alert("Không có dữ liệu người dùng.");
            }
        })
        .catch(error => {
            console.error('Error fetching data:', error);
            alert("Có lỗi xảy ra khi lấy dữ liệu.");
        });
}

function approvePost(postId) {
    const post = posts.find(p => p.id === postId);
    console.log(post);
    if (!post) return;
  
    fetch('/api/posts/update-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        postId,
        status: 'APPROVED',
        email: post.email,
        title: post.title,
        username: post.username
      })
    })
      .then(res => res.json())
      .then(data => {
        iziToast.success({ title: 'Duyệt bài', message: data.message, position: 'topRight' });
        fetchData(); // Refresh lại bảng
      })
      .catch(err => {
        iziToast.error({ title: 'Lỗi', message: 'Không thể duyệt bài', position: 'topRight' });
        console.error(err);
      });
  }

let rejectPostId = null;

function rejectPost(postId) {
    rejectPostId = postId;
    document.getElementById("rejectReason").value = "";
    $('#rejectModal').modal('show');
}

function confirmReject() {
    const reason = document.getElementById("rejectReason").value.trim();
    if (!reason) {
      iziToast.warning({ title: 'Thiếu lý do', message: 'Vui lòng nhập lý do từ chối', position: 'topRight' });
      return;
    }
  
    const post = posts.find(p => p.id === rejectPostId);
    if (!post) return;
  
    fetch('/api/posts/update-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        postId: post.id,
        status: 'REJECTED',
        reason,
        email: post.email,
        title: post.title,
        username: post.username
      })
    })
      .then(res => res.json())
      .then(data => {
        iziToast.info({ title: 'Từ chối bài', message: data.message, position: 'topRight' });
        $('#rejectModal').modal('hide');
        fetchData();
      })
      .catch(err => {
        iziToast.error({ title: 'Lỗi', message: 'Không thể từ chối bài', position: 'topRight' });
        console.error(err);
      });
}
  



