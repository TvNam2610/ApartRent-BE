let editingPackageId = null;

document.addEventListener('DOMContentLoaded', function () {
    loadPackages();
});

function loadPackages() {
    fetch('packages')
        .then(res => res.json())
        .then(data => {
            renderTable(data);
        })
        .catch(err => {
            console.error(err);
            iziToast.error({
                title: 'Lỗi',
                message: 'Không thể tải danh sách gói tin.',
                position: 'topRight'
            });
        });
}

function renderTable(packages) {
    const tbody = document.querySelector('#package-table tbody');
    tbody.innerHTML = '';

    if (packages.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center">Không có dữ liệu</td></tr>';
        return;
    }

    packages.forEach((pkg, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${pkg.name}</td>
            <td>${Number(pkg.price).toLocaleString('vi-VN')} VNĐ</td>
            <td>${pkg.type}</td>
            <td>
                <button class="btn btn-primary" onclick="editPackage(${pkg.id})">Sửa</button>
                <button class="btn btn-danger" onclick="confirmDeletePackage(${pkg.id})">Xóa</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function openAddModal() {
    editingPackageId = null;
    document.getElementById('packageId').value = '';
    document.getElementById('packageName').value = '';
    document.getElementById('packagePrice').value = '';
    document.getElementById('packageType').value = 'daily';
    $('#packageModal').modal('show');
}

function editPackage(id) {
    fetch(`packages/${id}`)
        .then(res => res.json())
        .then(pkg => {
            editingPackageId = id;
            document.getElementById('packageId').value = pkg.id;
            document.getElementById('packageName').value = pkg.name;
            document.getElementById('packagePrice').value = pkg.price;
            document.getElementById('packageType').value = pkg.type;
            $('#packageModal').modal('show');
        })
        .catch(err => {
            console.error(err);
            iziToast.error({
                title: 'Lỗi',
                message: 'Không thể tải thông tin gói tin.',
                position: 'topRight'
            });
        });
}

function savePackage() {
    const id = editingPackageId;
    const name = document.getElementById('packageName').value.trim();
    const price = document.getElementById('packagePrice').value;
    const type = document.getElementById('packageType').value;

    if (!name || !price || !type) {
        iziToast.warning({
            title: 'Cảnh báo',
            message: 'Vui lòng điền đầy đủ thông tin.',
            position: 'topRight'
        });
        return;
    }

    const method = id ? 'PUT' : 'POST';
    const url = id ? `packages/${id}` : 'packages';
    const body = { name, price, type };

    fetch(url, {
        method,
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    })
    .then(res => {
        if (!res.ok) throw new Error('Lỗi server');
        return res.json();
    })
    .then(() => {
        $('#packageModal').modal('hide');
        loadPackages();
        iziToast.success({
            title: 'Thành công',
            message: id ? 'Cập nhật gói tin thành công!' : 'Thêm gói tin mới thành công!',
            position: 'topRight'
        });
    })
    .catch(err => {
        console.error(err);
        iziToast.error({
            title: 'Lỗi',
            message: 'Không thể lưu gói tin.',
            position: 'topRight'
        });
    });
}


function confirmDeletePackage(id) {
    iziToast.question({
        timeout: 20000,
        close: false,
        overlay: true,
        displayMode: 'once',
        title: 'Xác nhận',
        message: 'Bạn có chắc muốn xóa gói tin này?',
        position: 'center',
        buttons: [
            ['<button><b>Đồng ý</b></button>', function (instance, toast) {
                instance.hide({ transitionOut: 'fadeOut' }, toast, 'button');
                deletePackage(id);
            }, true],
            ['<button>Hủy</button>', function (instance, toast) {
                instance.hide({ transitionOut: 'fadeOut' }, toast, 'button');
            }]
        ]
    });
}

function deletePackage(id) {
    fetch(`packages/${id}`, {
        method: 'DELETE'
    })
    .then(res => {
        if (!res.ok) throw new Error('Xóa thất bại');
        return res.json();
    })
    .then(() => {
        loadPackages();
        iziToast.success({
            title: 'Thành công',
            message: 'Đã xóa gói tin.',
            position: 'topRight'
        });
    })
    .catch(err => {
        console.error(err);
        iziToast.error({
            title: 'Lỗi',
            message: 'Không thể xóa gói tin.',
            position: 'topRight'
        });
    });
}
