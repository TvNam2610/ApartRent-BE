function displayResults(result) {
    const resultsBody = document.getElementById('resultsBody');
    resultsBody.innerHTML = ''; // Xóa nội dung cũ

    result.data.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.id}</td>
            <td>${item.assortment}</td>
            <td>${new Date(item.return_date).toLocaleDateString('vi-VN')}</td>            
            <td>${item.ma}</td>
            <td>${item.qty}</td>
            <td>${item.line}</td>
            <td>${item.catergories}</td>
        `;
        resultsBody.appendChild(row);
    });

    setupPagination(result.totalRecords, result.totalPages, result.currentPage);
    
}


function setupPagination(totalRecords, totalPages, currentPage) {
    const pagination = document.getElementById('pagination');
    pagination.innerHTML = ''; // Xóa nội dung cũ
    // Hiển thị thông tin trang hiện tại
    const pageInfo = document.createElement('div');
    pageInfo.className = 'page-info';
    pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
    pagination.appendChild(pageInfo);
    // Tạo nút Previous
    const prevButton = document.createElement('button');
    prevButton.textContent = '« Trước';
    prevButton.disabled = currentPage === 1;
    prevButton.addEventListener('click', () => changePage(currentPage - 1));
    pagination.appendChild(prevButton);

    // Số trang hiển thị xung quanh trang hiện tại
    const maxVisiblePages = 5; // Tổng số nút trang hiển thị
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    // Điều chỉnh startPage nếu endPage vượt quá totalPages
    if (endPage - startPage < maxVisiblePages - 1) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    // Tạo nút cho các trang
    for (let i = startPage; i <= endPage; i++) {
        const pageButton = document.createElement('button');
        pageButton.textContent = i;
        pageButton.className = currentPage === i ? 'active' : '';
        pageButton.addEventListener('click', () => changePage(i));
        pagination.appendChild(pageButton);
    }

    // Tạo nút Next
    const nextButton = document.createElement('button');
    nextButton.textContent = 'Sau »';
    nextButton.disabled = currentPage === totalPages;
    nextButton.addEventListener('click', () => changePage(currentPage + 1));
    pagination.appendChild(nextButton);



}

document.addEventListener('DOMContentLoaded', () => {
    changePage(1); // Gọi API tìm kiếm khi trang được tải
});

async function changePage(page) {
    const form = document.getElementById('searchForm');
    form.setAttribute('data-page', page);

    // Cập nhật giá trị page vào formData
    const formData = new FormData(form);
    formData.set('page', page); // Cập nhật tham số page

    const params = new URLSearchParams(formData).toString();
    const response = await fetch(`warehouse-assortment/search?${params}`);
    const result = await response.json();

    // Hiển thị kết quả
    if (response.ok) {
        displayResults(result);
    } else {
        console.error('Lỗi khi tìm kiếm:', result.error);
        alert(result.error);
    }
}













document.getElementById('searchBtn').addEventListener('click', async function () {
    await fetchAndDisplayResults();
});

async function fetchAndDisplayResults() {
    const formData = new FormData(document.getElementById('searchForm'));
    const params = new URLSearchParams(formData).toString();


    try {
        const response = await fetch(`warehouse-assortment/search?${params}`);
        const result = await response.json();

        if (response.ok) {
            displayResults(result);
        } else {
            console.error('Lỗi khi tìm kiếm:', result.error);
            alert(result.error);
        }
    } catch (error) {
        console.error('Có lỗi xảy ra:', error);
    }
}