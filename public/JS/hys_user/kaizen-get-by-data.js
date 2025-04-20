

// Hàm quy đổi time
function formatDateTime(isoString) {
    if (!isoString) return ''; // Trả về chuỗi rỗng nếu không có dữ liệu
    const date = new Date(isoString);
    return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`;
}

// Hàm xử lý API
function fetchData(maphieu) {
    const apiBaseUrl = window.location.origin;
    fetch(`${apiBaseUrl}/public/kaizen/${maphieu}`)
        .then(response => response.json())
        .then(data => {
            if (data.success && data.data.length > 0) {
                const item = data.data[0]; // Lấy dữ liệu đầu tiên trong mảng
                populateForm(item);
            } else {
                console.error("Không có dữ liệu hợp lệ từ API");
            }
        })
        .catch(error => console.error("Lỗi khi gọi API:", error));
}

// Hàm điền dữ liệu vào form
function populateForm(item) {
    const fields = [
        { id: "hoTen", value: item.ho_ten },
        { id: "viTri", value: item.vi_tri },
        { id: "thanhvien", value: item.thanhvien },
        { id: "maNV", value: item.ma_nv },
        { id: "email", value: item.email },
        { id: "phone", value: item.phone },
        { id: "boPhan", value: item.bo_phan },
        { id: "ngayDeXuat", value: formatDateTime(item.created_at) },
        { id: "tieuDe", value: item.tieu_de },
        { id: "maHang", value: item.ma_hang },
        { id: "soTienVND", value: item.so_tien },
        { id: "vanDe", value: item.van_de },
        { id: "nguyenNhan", value: item.nguyen_nhan },
        { id: "ketQua", value: item.y_tuong_kaizen },
        { id: "truongPhong", value: item.truong_phong },
        { id: "phuTrach", value: item.phu_trach }
    ];

    // Điền dữ liệu vào các trường form
    fields.forEach(field => {
        document.getElementById(field.id).value = field.value || '';
    });
    // Xử lý checkbox dựa trên ideastatus
    if (item.ideastatus === 1) {
        document.getElementById("newIdeaProposed").checked = true;
        document.getElementById("ideaImplemented").checked = false;
    } else if (item.ideastatus === 2) {
        document.getElementById("newIdeaProposed").checked = false;
        document.getElementById("ideaImplemented").checked = true;
    } else {
        document.getElementById("newIdeaProposed").checked = false;
        document.getElementById("ideaImplemented").checked = false;
    }

    // Kiểm tra trạng thái hiện tại và ẩn nút nếu đã được duyệt/từ chối
    if (item.status === 3 || item.status === 2) {
        document.querySelector('.btn-success').style.display = 'none';
        document.querySelector('.btn-danger').style.display = 'none';
    }
    // Kiểm tra và chọn radio nếu trùng với dac_diem_y_tuong
    const radioButtons = document.getElementsByName("dacDiemYTuong");
    radioButtons.forEach(radio => {
        if (radio.value === item.dac_diem_y_tuong) {
            radio.checked = true;
        }
    });

    // Xử lý hiển thị email hoặc phone
    toggleEmailPhoneDisplay(item.email, item.phone);

    // Xử lý đánh giá
    handleEvaluationDisplay(item.status, item.danh_gia);
}

// Hàm xử lý hiển thị email hoặc phone
function toggleEmailPhoneDisplay(email, phone) {
    const emailInput = document.getElementById("email");
    const phoneInput = document.getElementById("phone");

    if (email === "KXD") {
        emailInput.style.display = "none";
        phoneInput.style.display = "block";
        phoneInput.value = phone || "";
    } else if (phone === "0") {
        phoneInput.style.display = "none";
        emailInput.style.display = "block";
        emailInput.value = email || "";
    } else {
        emailInput.style.display = "block";
        phoneInput.style.display = "block";
        emailInput.value = email || "";
        phoneInput.value = phone || "";
    }
}


// Hàm xử lý hiển thị đánh giá
function handleEvaluationDisplay(status, danh_gia) {
    const checkboxes = document.querySelectorAll('.custom-control-input[type="checkbox"]');

    checkboxes.forEach(checkbox => {
        checkbox.disabled = (status == 2 || status == 3 || status == 4 || status == 5); // Nếu đã xác nhận, disable tất cả checkbox
        if (parseInt(checkbox.value) === danh_gia) {
            checkbox.checked = true;
        }
    });
}

// Xử lý checkbox chỉ cho phép chọn một lựa chọn
document.querySelectorAll('.custom-control-input[type="checkbox"]').forEach(checkbox => {
    checkbox.addEventListener('change', function () {
        // Nếu checkbox đã được chọn, thì bỏ chọn tất cả checkbox khác
        if (this.checked) {
            document.querySelectorAll('.custom-control-input[type="checkbox"]').forEach(cb => {
                if (cb !== this) {
                    cb.checked = false;
                }
            });
        }
    });
});




document.addEventListener("DOMContentLoaded", () => {
    // Lấy tham số "maphieu" từ URL và gọi hàm fetchData
    const maphieu = new URLSearchParams(window.location.search).get("maphieu");
    if (maphieu) {
        fetchData(maphieu);
    } else {
        console.error("Không tìm thấy maphieu trong URL");
    }

    // Handle button clicks for approve/reject
    document.querySelector('.btn-success').addEventListener('click', () => {
        validateForm(true); // Approve
    });

    document.querySelector('.btn-danger').addEventListener('click', () => {
        validateForm(false); // Reject
    });




});



// Handle checkbox change
function handleCheckboxChange() {
    const chapNhan = document.getElementById('chapNhan').checked;
    const dangKyTrinhBay = document.getElementById('dangKyTrinhBay').checked;
    const phanTichThem = document.getElementById('phanTichThem').checked;
    const khongDongY = document.getElementById('khongDongY').checked;

    const rejectedBtn = document.getElementById('rejectedBtn');
    const approvedBtn = document.getElementById('approvedBtn');

    // Kiểm tra điều kiện cho nút "Rejected" và "Approved"
    if ((chapNhan || dangKyTrinhBay)) {
        // Nếu chọn đánh giá có value 1 và 4 thì ẩn nút Rejected và hiển thị nút Approved
        approvedBtn.style.display = 'inline-block'; // Hiển thị nút Approved
        rejectedBtn.style.display = 'none';  // Ẩn nút Rejected

    } else if (phanTichThem || khongDongY) {
        // Nếu chọn đánh giá có value 2 và 3 thì ẩn nút Approved và hiển thị nút Rejected
        approvedBtn.style.display = 'none'; // Ẩn nút Approved
        rejectedBtn.style.display = 'inline-block'; // Hiển thị nút Rejected
    } else {
        // Nếu không chọn đánh giá nào thì ẩn cả hai nút
        rejectedBtn.style.display = 'none'; // Ẩn nút Rejected
        approvedBtn.style.display = 'none'; // Ẩn nút Approved
    }
}

// Gắn sự kiện thay đổi cho các ô kiểm
document.getElementById('chapNhan').addEventListener('change', handleCheckboxChange);
document.getElementById('dangKyTrinhBay').addEventListener('change', handleCheckboxChange);
document.getElementById('phanTichThem').addEventListener('change', handleCheckboxChange);
document.getElementById('khongDongY').addEventListener('change', handleCheckboxChange);




// function validateForm(event, isApproved) {
//     event.preventDefault(); // Ngăn chặn hành vi mặc định của thẻ <a>

//     let button = event.currentTarget; // Đảm bảo lấy đúng phần tử <a>
//     button.disabled = true; // Vô hiệu hóa nút để tránh gọi API 2 lần

//     // Get the status: 3 for approved, 2 for rejected
//     let status = isApproved ? 3 : 2;

//     // Get the rating based on checked checkbox
//     let rating = null;
//     if (document.getElementById("chapNhan").checked) {
//         rating = 1;  // Chấp nhận thực hiện
//     } else if (document.getElementById("phanTichThem").checked) {
//         rating = 2;  // Cần phân tích thêm
//     } else if (document.getElementById("khongDongY").checked) {
//         rating = 3;  // Không đồng ý
//     } else if (document.getElementById("dangKyTrinhBay").checked) {
//         rating = 4;  // Đăng ký trình bày báo cáo
//     }

//     if (!rating) {
//         iziToast.error({
//             title: 'Lỗi',
//             message: 'Vui lòng chọn một đánh giá.',
//             position: 'topRight'
//         });
//         button.disabled = false;  // Kích hoạt lại nút nếu không chọn rating
//         return;
//     }
//     // Kiểm tra nếu từ chối thì phải nhập lý do (note)
//     let note = document.getElementById("note") ? document.getElementById("note").value.trim() : "";
//     if (!isApproved && !note) {
//         iziToast.error({
//             title: 'Lỗi',
//             message: 'Vui lòng nhập lý do từ chối.',
//             position: 'topRight'
//         });
//         button.disabled = false;  // Kích hoạt lại nút nếu thiếu note
//         return;
//     }

//     // Lấy mã phiếu từ URL
//     const maphieu = new URLSearchParams(window.location.search).get("maphieu");
//     if (!maphieu) {
//         iziToast.error({
//             title: 'Lỗi',
//             message: 'Không tìm thấy mã phiếu trong URL.',
//             position: 'topRight'
//         });
//         button.disabled = false;  // Kích hoạt lại nút nếu không có mã phiếu
//         return;
//     }

//     const data = {
//         maphieu: maphieu,
//         status: status,
//         rating: rating,
//         note: note // Thêm lý do từ chối vào dữ liệu gửi đi
//     };

//     // Send the data to the backend API
//     fetch('public/update-status-and-review', {
//         method: 'POST',
//         headers: {
//             'Content-Type': 'application/json',
//         },
//         body: JSON.stringify(data),
//     })
//         .then(response => response.json())
//         .then(data => {


//             if (data.success) {
//                 iziToast.success({
//                     title: 'Thành công',
//                     message: isApproved ? 'Đã duyệt thành công.' : 'Đã từ chối.',
//                     position: 'topRight'
//                 });

//                 if (isApproved) {
//                     console.log('bắt đầu gửi mail')
//                     // Gọi API gửi email sau khi lưu dữ liệu thành công
//                     // fetch("public/send-email-kaizen-approval", {
//                     //     method: "POST",
//                     //     headers: {
//                     //         "Content-Type": "application/json"
//                     //     },
//                     //     body: JSON.stringify({ maphieu: maphieu })
//                     // })
//                     //     .then(res => res.json())
//                     //     .then(emailData => {
//                     //         if (emailData.success) {
//                     //             iziToast.success({
//                     //                 title: "Thông báo",
//                     //                 message: "Biểu mẫu đã được gửi thành công!",
//                     //                 position: "topRight"
//                     //             });
//                     //         } else {
//                     //             iziToast.error({
//                     //                 title: "Lỗi",
//                     //                 message: "Không thể gửi email, vui lòng thử lại!",
//                     //                 position: "topRight"
//                     //             });
//                     //         }
//                     //     })
//                     //     .catch(error => {
//                     //         console.error("Lỗi khi gửi email:", error);
//                     //         iziToast.error({
//                     //             title: "Lỗi",
//                     //             message: "Có lỗi khi gửi email!",
//                     //             position: "topRight"
//                     //         });
//                     //     });
//                 }

//                 // Gọi lại API để cập nhật giao diện
//                 fetchData(maphieu);
//             } else {
//                 iziToast.error({
//                     title: 'Lỗi',
//                     message: data.message,
//                     position: 'topRight'
//                 });
//             }
//         })
//         .catch(error => {
//             console.error('Error:', error);
//             iziToast.hide();  // Ẩn thông báo đang xử lý

//             iziToast.error({
//                 title: 'Lỗi',
//                 message: 'Có lỗi xảy ra. Vui lòng thử lại.',
//                 position: 'topRight'
//             });
//             button.disabled = false;  // Kích hoạt lại nút khi có lỗi
//         });
// }

// Gọi hàm khi trang được tải để đảm bảo trạng thái ban đầu của các nút
document.addEventListener('DOMContentLoaded', handleCheckboxChange);





function validateForm(event, isApproved) {
    event.preventDefault(); // Ngăn chặn hành vi mặc định của thẻ <a>

    let button = event.currentTarget; // Đảm bảo lấy đúng phần tử <a>
    button.disabled = true; // Vô hiệu hóa nút để tránh gọi API 2 lần

    // Nếu từ chối thì hiển thị modal thay vì gửi ngay
    if (!isApproved) {
        $("#rejectModal").modal("show"); // Hiển thị modal nhập lý do từ chối
        button.disabled = false; // Bật lại nút để có thể chọn lại
        return;
    }

    processForm(isApproved, button); // Nếu duyệt thì gửi dữ liệu luôn
}

function processForm(isApproved, button) {
    // Lấy trạng thái: 3 = Approved, 2 = Rejected
    let status = isApproved ? 3 : 2;

    // Lấy giá trị đánh giá (rating) dựa vào checkbox được chọn
    let rating = null;
    if (document.getElementById("chapNhan").checked) {
        rating = 1;
    } else if (document.getElementById("phanTichThem").checked) {
        rating = 2;
    } else if (document.getElementById("khongDongY").checked) {
        rating = 3;
    } else if (document.getElementById("dangKyTrinhBay").checked) {
        rating = 4;
    }

    if (!rating) {
        iziToast.error({
            title: 'Lỗi',
            message: 'Vui lòng chọn một đánh giá.',
            position: 'topRight'
        });
        button.disabled = false;
        return;
    }

    // Lấy mã phiếu từ URL
    const maphieu = new URLSearchParams(window.location.search).get("maphieu");
    if (!maphieu) {
        iziToast.error({
            title: 'Lỗi',
            message: 'Không tìm thấy mã phiếu trong URL.',
            position: 'topRight'
        });
        button.disabled = false;
        return;
    }

    // Nếu từ chối, kiểm tra lý do nhập vào từ modal
    let note = "";
    if (!isApproved) {
        note = document.getElementById("rejectNote").value.trim();
        if (!note) {
            iziToast.error({
                title: 'Lỗi',
                message: 'Vui lòng nhập lý do từ chối.',
                position: 'topRight'
            });
            button.disabled = false;
            return;
        }
        $("#rejectModal").modal("hide"); // Đóng modal sau khi nhập lý do
    }

    const data = {
        maphieu: maphieu,
        status: status,
        rating: rating,
        note: note
    };

    // Gửi dữ liệu đến backend
    fetch('public/update-status-and-review', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                iziToast.success({
                    title: 'Thành công',
                    message: isApproved ? 'Đã duyệt thành công.' : 'Đã từ chối.',
                    position: 'topRight'
                });

                // Nếu duyệt thì gửi email theo API duyệt
                if (isApproved) {
                    console.log('Bắt đầu gửi mail được duyệt');
                    //Gọi API gửi email khi duyệt
                    fetch("public/send-email-kaizen-approval", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({ maphieu: maphieu })
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
                }
                else {
                    console.log('Bắt đầu gửi mail không được duyệt');
                    const dataSendRejected = {
                        maphieu: maphieu,
                        email_nv: document.getElementById("email").value.trim(),
                        id_nv: document.getElementById("maNV").value.trim(),
                        hoten: document.getElementById("hoTen").value.trim(),
                        danhgia: rating.toString(),
                        status: status.toString(),
                        note: note
                    };

                    console.log(dataSendRejected);
                    //Gọi API gửi email khi duyệt

                    fetch("public/send-mail-app-final-public", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify(dataSendRejected)
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
                }

                // Cập nhật lại giao diện
                fetchData(maphieu);
            } else {
                iziToast.error({
                    title: 'Lỗi',
                    message: data.message,
                    position: 'topRight'
                });
            }
        })
        .catch(error => {
            console.error('Error:', error);
            iziToast.error({
                title: 'Lỗi',
                message: 'Có lỗi xảy ra. Vui lòng thử lại.',
                position: 'topRight'
            });
            button.disabled = false;
        });
}

function submitReject() {
    let rejectBtn = document.getElementById("rejectedBtn");
    processForm(false, rejectBtn); // Gửi dữ liệu sau khi nhập lý do từ modal
}




//
// function validateForm(event, isApproved) {
//     event.preventDefault(); // Ngăn chặn hành vi mặc định của thẻ <a>

//     let button = event.currentTarget; // Lấy đúng phần tử <a>
//     button.disabled = true; // Vô hiệu hóa nút để tránh gọi API 2 lần

//     // Xác định trạng thái: 3 = Approved, 2 = Rejected
//     let status = isApproved ? 3 : 2;

//     // Kiểm tra đánh giá (rating)
//     let rating = null;
//     if (document.getElementById("chapNhan").checked) {
//         rating = 1;
//     } else if (document.getElementById("phanTichThem").checked) {
//         rating = 2;
//     } else if (document.getElementById("khongDongY").checked) {
//         rating = 3;
//     } else if (document.getElementById("dangKyTrinhBay").checked) {
//         rating = 4;
//     }

//     if (!rating) {
//         iziToast.error({
//             title: 'Lỗi',
//             message: 'Vui lòng chọn một đánh giá.',
//             position: 'topRight'
//         });
//         button.disabled = false;
//         return;
//     }

//     // Lấy mã phiếu từ URL
//     const maphieu = new URLSearchParams(window.location.search).get("maphieu");
//     if (!maphieu) {
//         iziToast.error({
//             title: 'Lỗi',
//             message: 'Không tìm thấy mã phiếu trong URL.',
//             position: 'topRight'
//         });
//         button.disabled = false;
//         return;
//     }

//     // Nếu từ chối, hiển thị modal nhập lý do trước khi gửi API
//     if (!isApproved) {
//         $('#rejectModal').modal('show'); // Hiển thị modal Bootstrap
//         document.getElementById('submitRejectBtn').onclick = function () {
//             submitReject(maphieu, status, rating, button);
//         };
//         return;
//     }

//     // Nếu duyệt thì gửi API ngay
//     sendApprovalRequest(maphieu, status, rating, button, isApproved);
// }

// // Hàm gửi yêu cầu duyệt hoặc từ chối sau khi nhập lý do (chỉ dùng khi từ chối)
// function submitReject(maphieu, status, rating, button) {
//     const note = document.getElementById('rejectNote').value.trim();

//     if (!note) {
//         iziToast.error({
//             title: 'Lỗi',
//             message: 'Vui lòng nhập lý do từ chối!',
//             position: 'topRight'
//         });
//         return;
//     }

//     $('#rejectModal').modal('hide'); // Đóng modal
//     sendApprovalRequest(maphieu, status, rating, button, false, note);
// }

// // Hàm gửi API cập nhật trạng thái và xử lý email nếu được duyệt
// function sendApprovalRequest(maphieu, status, rating, button, isApproved, note = '') {
//     const data = {
//         maphieu: maphieu,
//         status: status,
//         rating: rating,
//         note: note // Chỉ có khi từ chối
//     };

//     fetch('public/update-status-and-review', {
//         method: 'POST',
//         headers: {
//             'Content-Type': 'application/json',
//         },
//         body: JSON.stringify(data),
//     })
//         .then(response => response.json())
//         .then(data => {
//             if (data.success) {
//                 iziToast.success({
//                     title: 'Thành công',
//                     message: isApproved ? 'Đã duyệt thành công.' : 'Đã từ chối.',
//                     position: 'topRight'
//                 });

//                 if (isApproved) {
//                     fetch("public/send-email-kaizen-approval", {
//                         method: "POST",
//                         headers: { "Content-Type": "application/json" },
//                         body: JSON.stringify({ maphieu: maphieu })
//                     })
//                         .then(res => res.json())
//                         .then(emailData => {
//                             if (emailData.success) {
//                                 iziToast.success({
//                                     title: "Thông báo",
//                                     message: "Biểu mẫu đã được gửi thành công!",
//                                     position: "topRight"
//                                 });
//                             } else {
//                                 iziToast.error({
//                                     title: "Lỗi",
//                                     message: "Không thể gửi email, vui lòng thử lại!",
//                                     position: "topRight"
//                                 });
//                             }
//                         })
//                         .catch(error => {
//                             console.error("Lỗi khi gửi email:", error);
//                             iziToast.error({
//                                 title: "Lỗi",
//                                 message: "Có lỗi khi gửi email!",
//                                 position: "topRight"
//                             });
//                         });
//                 }

//                 fetchData(maphieu); // Cập nhật giao diện
//             } else {
//                 iziToast.error({
//                     title: 'Lỗi',
//                     message: data.message,
//                     position: 'topRight'
//                 });
//             }
//         })
//         .catch(error => {
//             console.error('Lỗi:', error);
//             iziToast.error({
//                 title: 'Lỗi',
//                 message: 'Có lỗi xảy ra. Vui lòng thử lại.',
//                 position: 'topRight'
//             });
//         })
//         .finally(() => {
//             button.disabled = false; // Kích hoạt lại nút sau khi xử lý xong
//         });
// }



