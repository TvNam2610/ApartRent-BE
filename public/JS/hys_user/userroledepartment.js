
// set role mặc định
const roleMapping = {
    "Read": 1,
    "Update": 2,
    "Create": 3,
    "Delete": 4,
    "Import": 5,
    "Export": 6
};
// set bộ phận mặc định
const departmentMapping = {
    "MEC": 1,
    "IE": 2,
    "PR": 3,
    "PLANNING": 4,
    "CUTTING": 5,
    "WAREHOUSE": 6,
    "QA": 7,
    "HR": 8,
    "WH_LOG": 9,
    "ADMIN": 10,
    "FIN": 11,
    "COMP": 12,
    "IT": 13,
    "MAIN": 14,
    "DF": 15,
    "PAYROLL": 16,
    "PD": 17,
    "PROC": 18,
    "LEGAL": 19,
    "SSC": 20,
    "LAB": 21,
    "RCOMP": 22,
    "GVWAREHOUSE": 23,
    "PUR": 24,
    "REGHR": 25,
    "PBPUR": 26,
    "SOURCING": 27,
    "TEXTILE": 28,
    "OUTSOURCE": 29,
    "ID": 30
};
// set bảng mặc định để lấy thông tin
const defaultRoles = [
    { department: "MEC", roles: ["Read", "Update", "Create", "Delete", "Import", "Export"] },
    { department: "IE", roles: ["Read", "Update", "Create", "Delete", "Import", "Export"] },
    { department: "PR", roles: ["Read", "Update", "Create", "Delete", "Import", "Export"] },
    { department: "PLANNING", roles: ["Read", "Update", "Create", "Delete", "Import", "Export"] },
    { department: "CUTTING", roles: ["Read", "Update", "Create", "Delete", "Import", "Export"] },
    { department: "WAREHOUSE", roles: ["Read", "Update", "Create", "Delete", "Import", "Export"] },
    { department: "QA", roles: ["Read", "Update", "Create", "Delete", "Import", "Export"] },
    { department: "HR", roles: ["Read", "Update", "Create", "Delete", "Import", "Export"] },
    { department: "WH_LOG", roles: ["Read", "Update", "Create", "Delete", "Import", "Export"] },
    { department: "ADMIN", roles: ["Read", "Update", "Create", "Delete", "Import", "Export"] },
    { department: "FIN", roles: ["Read", "Update", "Create", "Delete", "Import", "Export"] },
    { department: "COMP", roles: ["Read", "Update", "Create", "Delete", "Import", "Export"] },
    { department: "IT", roles: ["Read", "Update", "Create", "Delete", "Import", "Export"] },
    { department: "MAIN", roles: ["Read", "Update", "Create", "Delete", "Import", "Export"] },
    { department: "DF", roles: ["Read", "Update", "Create", "Delete", "Import", "Export"] },
    { department: "PAYROLL", roles: ["Read", "Update", "Create", "Delete", "Import", "Export"] },
    { department: "PD", roles: ["Read", "Update", "Create", "Delete", "Import", "Export"] },
    { department: "PROC", roles: ["Read", "Update", "Create", "Delete", "Import", "Export"] },
    { department: "LEGAL", roles: ["Read", "Update", "Create", "Delete", "Import", "Export"] },
    { department: "SSC", roles: ["Read", "Update", "Create", "Delete", "Import", "Export"] },
    { department: "LAB", roles: ["Read", "Update", "Create", "Delete", "Import", "Export"] },
    { department: "RCOMP", roles: ["Read", "Update", "Create", "Delete", "Import", "Export"] },
    { department: "GVWAREHOUSE", roles: ["Read", "Update", "Create", "Delete", "Import", "Export"] },
    { department: "PUR", roles: ["Read", "Update", "Create", "Delete", "Import", "Export"] },
    { department: "REGHR", roles: ["Read", "Update", "Create", "Delete", "Import", "Export"] },
    { department: "PBPUR", roles: ["Read", "Update", "Create", "Delete", "Import", "Export"] },
    { department: "SOURCING", roles: ["Read", "Update", "Create", "Delete", "Import", "Export"] },
    { department: "TEXTILE", roles: ["Read", "Update", "Create", "Delete", "Import", "Export"] },
    { department: "OUTSOURCE", roles: ["Read", "Update", "Create", "Delete", "Import", "Export"] },
    { department: "ID", roles: ["Read", "Update", "Create", "Delete", "Import", "Export"] }
];

// Hàm hiển thị danh sách quyền mặc định và đánh dấu quyền người dùng
function renderRolesWithUserPermissions(userRoles = []) {
    const tableBody = document.getElementById('roleTableBody');
    tableBody.innerHTML = ''; // Xóa dữ liệu cũ

    defaultRoles.forEach(department => {
        const departmentName = department.department;
        const defaultRoleSet = new Set(department.roles);

        // Lấy quyền người dùng cho bộ phận này
        const userRoleSet = new Set(
            userRoles
                .filter(role => role.name_departments === departmentName)
                .map(role => role.role_name)
        );

        // Tạo dòng cho từng bộ phận
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${departmentName}</td>
            <td class="text-center"><input type="checkbox" ${userRoleSet.has('Read') ? 'checked' : ''} onchange="updateRole('${departmentName}', 'Read', this.checked)"></td>
            <td class="text-center"><input type="checkbox" ${userRoleSet.has('Update') ? 'checked' : ''} onchange="updateRole('${departmentName}', 'Update', this.checked)"></td>
            <td class="text-center"><input type="checkbox" ${userRoleSet.has('Create') ? 'checked' : ''} onchange="updateRole('${departmentName}', 'Create', this.checked)"></td>
            <td class="text-center"><input type="checkbox" ${userRoleSet.has('Delete') ? 'checked' : ''} onchange="updateRole('${departmentName}', 'Delete', this.checked)"></td>
            <td class="text-center"><input type="checkbox" ${userRoleSet.has('Import') ? 'checked' : ''} onchange="updateRole('${departmentName}', 'Import', this.checked)"></td>
            <td class="text-center"><input type="checkbox" ${userRoleSet.has('Export') ? 'checked' : ''} onchange="updateRole('${departmentName}', 'Export', this.checked)"></td>
        `;
        tableBody.appendChild(row);
    });
}

// Hàm tìm kiếm quyền người dùng
function getUserRole(event) {
    event.preventDefault();  // Ngăn chặn form reload lại trang
    const employeeId = document.getElementById('employeeId').value;

    if (!employeeId) {
        iziToast.error({
            title: 'Lỗi',
            message: 'Vui lòng nhập mã nhân viên!',
            position: 'topRight'
        });
        return;
    }


    // Gọi API lấy quyền người dùng
    fetch(`/check-role/${employeeId}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Hiển thị quyền với dữ liệu người dùng
                renderRolesWithUserPermissions(data.roles);
            } else {
                iziToast.error({
                    title: 'Lỗi',
                    message: data.message || 'Không tìm thấy quyền của người dùng.',
                    position: 'topRight'
                });
                // Hiển thị danh sách mặc định mà không đánh dấu quyền người dùng
                renderRolesWithUserPermissions();
            }
        })
        .catch(error => {
            console.error('Lỗi khi lấy quyền người dùng:', error);
            iziToast.error({
                title: 'Lỗi',
                message: 'Có lỗi xảy ra khi lấy quyền người dùng.',
                position: 'topRight'
            });
            renderRolesWithUserPermissions(); // Hiển thị danh sách mặc định
        });
}

// Hiển thị mặc định ngay khi tải trang
document.addEventListener('DOMContentLoaded', () => {
    renderRolesWithUserPermissions(); // Hiển thị danh sách mặc định không đánh dấu
});


//Hàm update quyền người dùng
function updateRole(department, role, isChecked) {
    const employeeId = document.getElementById('employeeId').value;

    if (!employeeId) {
        iziToast.error({
            title: 'Lỗi',
            message: 'Vui lòng nhập mã nhân viên trước khi cập nhật quyền.',
            position: 'topRight'
        });
        return;
    }
    const departmentId = departmentMapping[department];
    const roleId = roleMapping[role];


    if (!departmentId || !roleId) {
        iziToast.error({
            title: 'Lỗi',
            message: 'Không tìm thấy ánh xạ cho quyền hoặc bộ phận.',
            position: 'topRight'
        });
        return;
    }




    const action = isChecked ? 'grant' : 'revoke';
    const url = isChecked ? '/update-role' : '/delete-role';  // Gọi API phù hợp (grant :update hay revoke :xóa)

    fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            employeeId: employeeId, // Thêm mã nhân viên
            departmentId: departmentId,
            roleId: roleId,
            action: action
        })
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const message = isChecked
                    ? `Đã cấp quyền ${role} cho bộ phận ${department}`
                    : `Đã xóa quyền ${role} cho bộ phận ${department}`;
                iziToast.success({
                    title: 'Thành công',
                    message: message,
                    position: 'topRight'
                });
            } else {
                iziToast.error({
                    title: 'Lỗi',
                    message: 'Có lỗi xảy ra khi cập nhật quyền.',
                    position: 'topRight'
                });
            }
        })
        .catch(error => {
            console.error('Lỗi khi cập nhật quyền:', error);
            iziToast.error({
                title: 'Lỗi',
                message: 'Có lỗi xảy ra khi cập nhật quyền.',
                position: 'topRight'
            });
        });
}