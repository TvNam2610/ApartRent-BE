 // Define an array of departments
 const departments = [
    "Chọn bộ phận","PRO-CCD", "PRO-Sew", "Sewing A-C", "Sewing B", "MEC", "ID", 
    "IE", "QA", "WH", "LOG", "PLANNING", "HR", "MAINT", "COMPL", 
    "IT", "FIN-OPS", "FIN-PAYROLL", "FIN-SSC", "PD", "LAB", "PROCUREMENT"
];

// Populate the "Bộ phận" dropdown dynamically
const boPhanSelect = document.getElementById("boPhan");
departments.forEach(function(department) {
    const option = document.createElement("option");
    option.value = department;
    option.textContent = department;
    boPhanSelect.appendChild(option);
});

// Cập nhật thông tin Trưởng phòng với email
const departmentData = {
    //"PRO-CCD": { truongPhong: "Đinh Thái Sơn", emailbophan: "Trung.Nguyen27@hanes.com", phuTrach: "Lã Thị Lành" },
   "PRO-CCD": { truongPhong: "Đinh Thái Sơn", emailbophan: "Le.Ha@hanes.com", phuTrach: "Lã Thị Lành" },
    "PRO-Sew": { truongPhong: "Nguyễn Xuân Hồng", emailbophan: "Hong.NguyenXuan@hanes.com", phuTrach: "Lã Thị Lành" },
    "Sewing A-C": { truongPhong: "Nguyễn Hữu Tuân", emailbophan: "Tuan.Nguyen7@hanes.com", phuTrach: "Lã Thị Lành" },
    "Sewing B": { truongPhong: "Vũ Trường Hải", emailbophan: "Hai.Vu@hanes.com", phuTrach: "Lã Thị Lành" },
    "MEC": { truongPhong: "Hoàng Văn Thoại", emailbophan: "thoai.hoang3@hanes.com", phuTrach: "Lã Thị Lành" },
    "ID": { truongPhong: "Bùi Hoàng Hùng", emailbophan: "Hung.Bui@hanes.com", phuTrach: "Lã Thị Lành" },
    "IE": { truongPhong: "Bùi Minh Đức", emailbophan: "bui.duc@hanes.com", phuTrach: "Lã Thị Lành" },
    "QA": { truongPhong: "Phạm Văn Hồng", emailbophan: "Duan.Nguyen5@hanes.com", phuTrach: "Lã Thị Lành" },
    "WH": { truongPhong: "Phạm Minh Đức", emailbophan: "PhamMinh.Duc@hanes.com", phuTrach: "Lã Thị Lành" },
    "LOG": { truongPhong: "Nguyễn Văn Kiên", emailbophan: "Kien.Nguyen2@hanes.com", phuTrach: "Lã Thị Lành" },
    "PLANNING": { truongPhong: "Đoàn Thị Hà", emailbophan: "Ha.Doan@hanes.com", phuTrach: "Lã Thị Lành" },
    "HR": { truongPhong: "Lê Thị Minh Nguyệt", emailbophan: "Ngat.Nghiem@hanes.com,Nguyet.Le4@hanes.com", phuTrach: "Lã Thị Lành" },
    "MAINT": { truongPhong: "Đỗ Hoài Nam", emailbophan: "Nam.Do@hanes.com", phuTrach: "Lã Thị Lành" },
    "COMPL": { truongPhong: "Nguyễn Thị Huyền", emailbophan: "NguyenThi.Huyen@hanes.com", phuTrach: "Lã Thị Lành" },
    "IT": { truongPhong: "Bùi Bá Hoàn", emailbophan: "Hoan.Bui4@hanes.com", phuTrach: "Lã Thị Lành" },
    "FIN-OPS": { truongPhong: "Phạm Thị Ngọc Diện", emailbophan: "Nguyen.Oanh1@hanes.com,Dien.Pham@hanes.com", phuTrach: "Lã Thị Lành" },
    "FIN-PAYROLL": { truongPhong: "Phạm Ngọc Lan", emailbophan: "Lan.Pham@hanes.com", phuTrach: "Lã Thị Lành" },
    "FIN-SSC": { truongPhong: "Chu Thị Ngọc Anh", emailbophan: "ChuThi.NgocAnh@hanes.com", phuTrach: "Lã Thị Lành" },
    "PD": { truongPhong: "Lê Thị Minh Hiếu", emailbophan: "LeThiMinh.Hieu@hanes.com", phuTrach: "Lã Thị Lành" },
    "LAB": { truongPhong: "Trần Thị Thúy Nga", emailbophan: "Chinh.Nguyen2@hanes.com,Tuoi.Nguyen4@hanes.com", phuTrach: "Lã Thị Lành" },
    "PROCUREMENT": { truongPhong: "Kien/Tr.Ha", emailbophan: "Nguyen.Kien@hanes.com,TrinhThi.ThuHa@hanes.com", phuTrach: "Lã Thị Lành" },
};

// // Cập nhật thông tin Trưởng phòng với email
// const departmentData = {
//     "PRO-CCD": { truongPhong: "Đinh Thái Sơn", emailbophan: "trung.nguyen27@hanes.com", phuTrach: "Lã Thị Lành" },
// };



// Update Trưởng phòng và Người phụ trách based on department
document.getElementById("boPhan").addEventListener("change", function() {
    const selectedDepartment = this.value;
    const truongPhongField = document.getElementById("truongPhong");
    const phuTrachField = document.getElementById("phuTrach");

    if (departmentData[selectedDepartment]) {
        truongPhongField.value = departmentData[selectedDepartment].truongPhong;
        phuTrachField.value = departmentData[selectedDepartment].phuTrach;
    } else {
        truongPhongField.value = "";
        phuTrachField.value = "";
    }
});

document.getElementById("ngayDeXuat").value = new Date().toLocaleString("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
});

// Real-time email validation
document.getElementById("email").addEventListener("input", function() {
    let email = this.value.trim();
    let emailRegex = /^(.*@gmail\.com|.*@hanes\.com)$/;
    
    if (!emailRegex.test(email)) {
        document.getElementById("emailError").style.display = "block";
    } else {
        document.getElementById("emailError").style.display = "none";
    }
});

// Hàm tạo mã phiếu duy nhất
function generateUniqueCode() {
    const now = new Date();
    const timestamp = now.getFullYear().toString() + 
                      (now.getMonth() + 1).toString().padStart(2, '0') + 
                      now.getDate().toString().padStart(2, '0') + 
                      now.getHours().toString().padStart(2, '0') + 
                      now.getMinutes().toString().padStart(2, '0') + 
                      now.getSeconds().toString().padStart(2, '0');

    const randomString = Math.random().toString(36).substring(2, 6).toUpperCase(); // Chuỗi ngẫu nhiên 4 ký tự
    return `MP-${timestamp}-${randomString}`; // Ví dụ: MP-20240209123045-ABCD
}

// Hàm validate và gửi dữ liệu
function validateForm() {
    let fields = ["hoTen", "maNV", "viTri", "boPhan", "tieuDe", "vanDe", "nguyenNhan","ketQua"];
    
    for (let id of fields) {
        let element = document.getElementById(id);
        if (!element.value.trim()) {
            iziToast.warning({
                title: 'Cảnh báo',
                message: 'Vui lòng nhập tất cả các trường bắt buộc!',
                position: 'topRight'
            });
            return;
        }
    }

   
    // Kiểm tra xem có ít nhất 1 checkbox được chọn không
    const newIdeaProposed = document.getElementById("newIdeaProposed").checked;
    const ideaImplemented = document.getElementById("ideaImplemented").checked;
    if (!newIdeaProposed && !ideaImplemented) {
        iziToast.warning({
            title: 'Cảnh báo',
            message: 'Vui lòng chọn một trong hai trạng thái ý tưởng Kaizen!',
            position: 'topRight'
        });
        return;
    }

    // Tạo mã phiếu duy nhất
    const maPhieu = generateUniqueCode();
    const selectedDepartment = document.getElementById("boPhan").value.trim();

    const emailBoPhan = departmentData[selectedDepartment]?.emailbophan || "";



    // Xác định trạng thái dựa trên checkbox được chọn
    let statusIdea = 0; // Mặc định là 0 nếu không chọn gì (nhưng đã kiểm tra ở trên nên không xảy ra)
    if (newIdeaProposed) {
        statusIdea = 1; // Ý tưởng mới đã được đề xuất
    } else if (ideaImplemented) {
        statusIdea = 2; // Ý tưởng đã được thực hiện
    }



     // Chuẩn bị dữ liệu gửi API
    const formData = {
        maphieu: maPhieu, // Thêm mã phiếu
        ho_ten: document.getElementById("hoTen").value.trim(),
        thanhvien: document.getElementById("thanhvien").value.trim(),
        email: document.getElementById("email").value.trim(),
        phone: document.getElementById("phone").value.trim(),
        ma_nv: document.getElementById("maNV").value.trim(),
        vi_tri: document.getElementById("viTri").value.trim(),
        bo_phan: document.getElementById("boPhan").value.trim(),
        tieu_de: document.getElementById("tieuDe").value.trim(),
        dac_diem_y_tuong: document.querySelector('input[name="dacDiemYTuong"]:checked').value,
        ma_hang: document.getElementById("maHang").value.trim(),
        so_tien: parseFloat(document.getElementById("soTienVND").value.replace(/,/g, '')) || 0,
        van_de: document.getElementById("vanDe").value.trim(),
        nguyen_nhan: document.getElementById("nguyenNhan").value.trim(),
        y_tuong_kaizen: document.getElementById("ketQua").value.trim(),
        truong_phong: document.getElementById("truongPhong").value.trim(),
        phu_trach: document.getElementById("phuTrach").value.trim(),
        emailbophan: emailBoPhan,
        ideastatus: statusIdea // Thêm trường status
    };
    console.log(formData)

    fetch('public/insert-suggestion', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            iziToast.warning({
                title: 'Thông báo',
                message: 'Biểu mẫu đang gửi đi...',
                position: 'topRight'
            });

              // Gọi API gửi email sau khi lưu dữ liệu thành công
              fetch("public/send-email-kaizen", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ emailbophan: formData.emailbophan, maphieu: formData.maphieu })
            })
            .then(res => res.json())
            .then(emailData => {
                if (emailData.success) {
                    iziToast.success({
                        title: "Thông báo",
                        message: "Biểu mẫu đã được gửi thành công!",
                        position: "topRight"
                    });
                } else {
                    iziToast.error({
                        title: "Lỗi",
                        message: "Không thể gửi email, vui lòng thử lại!",
                        position: "topRight"
                    });
                }
            })
            .catch(error => {
                console.error("Lỗi khi gửi email:", error);
                iziToast.error({
                    title: "Lỗi",
                    message: "Có lỗi khi gửi email!",
                    position: "topRight"
                });
            });

            // Reset form
            document.getElementById("addProductForm").reset();  


        } else {
            iziToast.error({
                title: 'Lỗi',
                message: 'Đã xảy ra lỗi khi gửi biểu mẫu!',
                position: 'topRight'
            });
        }
    })
    .catch(error => {
        console.error('Lỗi khi gửi biểu mẫu:', error);
        iziToast.error({
            title: 'Lỗi',
            message: 'Đã xảy ra lỗi khi gửi biểu mẫu!',
            position: 'topRight'
        });
    });
}


function formatCurrency(input) {
    // Remove non-numeric characters (except commas)
    let value = input.value.replace(/[^0-9]/g, '');

    // Format the number with commas
    value = value.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

    // Set the formatted value back to the input field
    input.value = value;
}
function setDefaultValue(input) {
    // If the field is empty after losing focus, set the value to 0
    if (!input.value.trim()) {
        input.value = '0';
    }
}



document.getElementById("phone").addEventListener("input", function() {
    const phone = this.value.trim();
    const phoneError = document.getElementById("phoneError");
    const phoneRegex = /^[0-9]{10}$/;

    if (!phoneRegex.test(phone)) {
        phoneError.style.display = "block";
        this.value = phone.slice(0, 10); // Chỉ cho phép nhập tối đa 10 số
    } else {
        phoneError.style.display = "none";
    }
});

// Logic để chỉ chọn 1 trong 2 checkbox
document.getElementById("newIdeaProposed").addEventListener("change", function () {
    if (this.checked) {
        document.getElementById("ideaImplemented").checked = false;
    }
});

document.getElementById("ideaImplemented").addEventListener("change", function () {
    if (this.checked) {
        document.getElementById("newIdeaProposed").checked = false;
    }
});


function toggleContactField() {
    const position = document.getElementById('viTri').value;
    const emailField = document.getElementById('email');
    const phoneField = document.getElementById('phone');

    if (position === 'congnhan') {
        emailField.style.display = 'none';
        emailField.required = false;
        phoneField.style.display = 'block';
        phoneField.required = true;
    } else {
        phoneField.style.display = 'none';
        phoneField.required = false;
        emailField.style.display = 'block';
        emailField.required = true;
    }
}



    
   