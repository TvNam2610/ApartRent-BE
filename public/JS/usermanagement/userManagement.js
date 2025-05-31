let currentPage = 1;
let pageSize = 10;
let currentSearch = "";
let lockUserId = null;

document.addEventListener("DOMContentLoaded", function () {
    loadUsers();

    document.getElementById("pageSize").addEventListener("change", function () {
        pageSize = this.value;
        currentPage = 1;
        loadUsers();
    });

    document.getElementById("search-button").addEventListener("click", function (e) {
        e.preventDefault();
        currentSearch = document.getElementById("user_search").value.trim();
        currentPage = 1;
        loadUsers();
    });
});

function loadUsers() {
    fetch(`users?page=${currentPage}&limit=${pageSize}&search=${currentSearch}`)
        .then(res => res.json())
        .then(data => {
            renderTable(data.users);
            renderPagination(data.totalPages);
        })
        .catch(err => {
            console.error("Lỗi khi tải danh sách người dùng:", err);
        });
}

function renderTable(users) {
    const tbody = document.querySelector("#user-table tbody");
    tbody.innerHTML = "";

    if (users.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" class="text-center">Không có dữ liệu</td></tr>`;
        return;
    }

    users.forEach((user, index) => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td class="text-center">${(currentPage - 1) * pageSize + index + 1}</td>
            <td>${user.email}</td>
            <td>${user.username}</td>
            <td>${user.phone || "-"}</td>
            <td>${new Date(user.createAt).toLocaleDateString()}</td>
            <td><span class="badge badge-${user.status === 'active' ? 'success' : 'danger'}">${user.status} </span></td>
            <td>
                ${
                    user.status === 'locked'
                    ? '<span class="text-muted">Đã khóa</span>'
                    : `<button class="btn btn-danger" onclick="openLockModal('${user.id}')">Khóa</button>`
                }
            </td>
        `;
        tbody.appendChild(row);
    });
}

function renderPagination(totalPages) {
    const pagination = document.querySelector(".pagination");
    pagination.innerHTML = "";

    const prev = document.createElement("li");
    prev.className = `page-item ${currentPage === 1 ? "disabled" : ""}`;
    prev.innerHTML = `<a class="page-link" href="#"><i class="fas fa-chevron-left"></i></a>`;
    prev.addEventListener("click", () => {
        if (currentPage > 1) {
            currentPage--;
            loadUsers();
        }
    });
    pagination.appendChild(prev);

    for (let i = 1; i <= totalPages; i++) {
        const li = document.createElement("li");
        li.className = `page-item ${i === currentPage ? "active" : ""}`;
        li.innerHTML = `<a class="page-link" href="#">${i}</a>`;
        li.addEventListener("click", () => {
            currentPage = i;
            loadUsers();
        });
        pagination.appendChild(li);
    }

    const next = document.createElement("li");
    next.className = `page-item ${currentPage === totalPages ? "disabled" : ""}`;
    next.innerHTML = `<a class="page-link" href="#"><i class="fas fa-chevron-right"></i></a>`;
    next.addEventListener("click", () => {
        if (currentPage < totalPages) {
            currentPage++;
            loadUsers();
        }
    });
    pagination.appendChild(next);
}

function openLockModal(userId) {
    lockUserId = userId;
    document.getElementById("lockReason").value = "";
    $('#lockModal').modal('show');
}

function confirmLock() {
    const reason = document.getElementById("lockReason").value.trim();

    if (!reason) {
        iziToast.warning({
            title: 'Cảnh báo',
            message: 'Vui lòng nhập lý do khóa!',
            position: 'topRight'
        });
        return;
    }

    fetch(`users/${lockUserId}/lock`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ reason })
    })
    .then(res => {
        if (!res.ok) throw new Error("Không thể khóa tài khoản.");
        return res.json();
    })
    .then(() => {
        $('#lockModal').modal('hide');
        iziToast.success({
            title: 'Thành công',
            message: 'Tài khoản đã bị khóa!',
            position: 'topRight'
        });
        loadUsers();
    })
    .catch(err => {
        console.error(err);
        iziToast.error({
            title: 'Lỗi',
            message: 'Đã xảy ra lỗi khi khóa tài khoản.',
            position: 'topRight'
        });
    });
}
