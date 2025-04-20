async function updateShiftExtension(workerId, shiftExtension, hours, date) {
    try {
        const response = await fetch('update-ot-shift-gap', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                workerId,
                shiftExtension,
                shiftExtensionHours: hours,
                shiftExtensionDate: date
            })
        });

        if (!response.ok) {
            throw new Error('Lỗi khi cập nhật giãn ca');
        }

        const data = await response.json();
        console.log('Cập nhật giãn ca thành công:', data);
    } catch (error) {
        console.error('Lỗi khi cập nhật giãn ca:', error);
        swal('Lỗi!', 'Không thể cập nhật giãn ca!', 'error');
    }
}

// Hàm gọi API cập nhật ca làm việc
async function updateShiftForSupervisor(supervisorID) {
    try {
        const response = await fetch('update-shift-supervisor', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ supervisorID })
        });

        if (!response.ok) {
            throw new Error('Lỗi khi cập nhật ca làm việc.');
        }

        const data = await response.json();
        console.log('Cập nhật Shift thành công:', data);

        // Làm mới danh sách sau khi cập nhật
        const position = JSON.parse(localStorage.getItem("user")).position;
        const supervisorId = localStorage.getItem("username");
        const tableBody = document.querySelector("table tbody");
        const attendanceData = await fetchAttendanceData(position, supervisorId);
        const teamLeaders = await fetchTeamLeaders();

        if (attendanceData) {
            renderTable(attendanceData, tableBody, teamLeaders);
        }

        return true;
    } catch (error) {
        console.error('Lỗi khi cập nhật ca:', error);
        return false;
    }
}


// Hàm gọi API để cập nhật TeamLeaderID
async function updateTeamLeader(id, newTeamLeaderID) {
    try {
        const response = await fetch('update-team-leader', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ id, newTeamLeaderID })
        });

        if (!response.ok) {
            throw new Error('Lỗi khi cập nhật TeamLeaderID');
        }

        const data = await response.json();
        console.log('Cập nhật thành công:', data);
        // Gọi lại API để làm mới trang và xóa checkbox đã chọn
        // Gọi lại API để làm mới trang và xóa checkbox đã chọn
        const position = JSON.parse(localStorage.getItem("user")).position;
        const supervisorId = localStorage.getItem("username");
        const tableBody = document.querySelector("table tbody");
        const attendanceData = await fetchAttendanceData(position, supervisorId);
        const teamLeaders = await fetchTeamLeaders();
        if (attendanceData) {
            renderTable(attendanceData, tableBody, teamLeaders);
        }
        // Gọi lại API để làm mới trang và xóa checkbox đã chọn
         //window.location.reload();
    } catch (error) {
        console.error('Lỗi khi cập nhật TeamLeaderID:', error);
    }
}

// Hàm lấy danh sách tổ trưởng từ API
async function fetchTeamLeaders() {
    try {
        const response = await fetch('get-all-team-leaders');
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Lỗi khi lấy danh sách Team Leaders:", error);
        return [];
    }
}

// Hàm lấy dữ liệu điểm danh từ API
async function fetchAttendanceData(position, supervisorId) {
    try {
        const response = await fetch(`lines-with-team-leaders?position=${position}&supervisorId=${supervisorId}`);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Lỗi khi lấy dữ liệu:", error);
        return null;
    }
}


// Hàm hiển thị dữ liệu lên bảng HTML
function renderTable(data, tableBody, teamLeaders) {
    tableBody.innerHTML = ""; // Xóa nội dung cũ

    data.forEach((worker) => {
        const row = document.createElement("tr");
        row.innerHTML = `
             <td class="text-center align-middle">
                <div class="custom-control custom-checkbox">
                    <input type="checkbox" class="custom-control-input row-checkbox" id="worker-${worker.id}" data-worker-id="${worker.id}">
                    <label class="custom-control-label" for="worker-${worker.id}"></label>
                </div>
            </td>
            <td class="text-center align-middle">${worker.id}</td>
            <td class="text-center align-middle">${worker.Line}</td>
            <td class="text-center align-middle">
                <span class="team-leader-name">${worker.TeamLeaderName}</span>
                <select class="form-control team-leader-select d-none">
                    ${teamLeaders.map(leader => `<option value="${leader.ID}" ${leader.ID === worker.TeamLeaderID ? 'selected' : ''}>${leader.FullName}</option>`).join('')}
                </select>
            </td>
            <td class="text-center align-middle">${worker.Shift || '-'}</td>
            <td class="text-center align-middle">${worker.WorkShop}</td>
        `;
        tableBody.appendChild(row);

        // Xử lý sự kiện checkbox
        const checkbox = row.querySelector(`#worker-${worker.id}`);
        const teamLeaderName = row.querySelector(".team-leader-name");
        const teamLeaderSelect = row.querySelector(".team-leader-select");

        checkbox.addEventListener("change", function () {
            if (this.checked) {
                teamLeaderName.classList.add("d-none");
                teamLeaderSelect.classList.remove("d-none");
            } else {
                teamLeaderName.classList.remove("d-none");
                teamLeaderSelect.classList.add("d-none");
            }
        });
        // Xử lý sự kiện khi thay đổi tổ trưởng trong select
        teamLeaderSelect.addEventListener("change", function () {
            const selectedLeaderId = this.value; // ID của tổ trưởng được chọn
            const selectedLeaderName = this.options[this.selectedIndex].text; // Tên của tổ trưởng được chọn
            console.log(`Worker ID: ${worker.id}, New Team Leader ID: ${selectedLeaderId}, New Team Leader Name: ${selectedLeaderName}`);
            // Ở đây bạn có thể gọi API để cập nhật cơ sở dữ liệu, ví dụ:
            // updateTeamLeader(worker.id, selectedLeaderId);
            // Hiển thị cảnh báo xác nhận trước khi cập nhật
            showConfirmationAlert(worker.id, selectedLeaderId);
        });



    });
}

// Hàm xử lý "Select All" checkbox
function handleCheckboxAll(checkboxAll) {
    checkboxAll.addEventListener("change", function () {
        const isChecked = this.checked;
        document.querySelectorAll("tbody .row-checkbox").forEach(checkbox => {
            checkbox.checked = isChecked;
            const event = new Event("change"); // Kích hoạt sự kiện change cho từng checkbox
            checkbox.dispatchEvent(event);
        });
    });
}

// Hàm xử lý sự kiện thay đổi checkbox trong bảng
function handleCheckboxChange(checkboxAll) {
    document.addEventListener("change", function (e) {
        if (e.target.classList.contains("row-checkbox")) {
            const allCheckboxes = document.querySelectorAll("tbody .row-checkbox");
            const checkedCount = document.querySelectorAll("tbody .row-checkbox:checked").length;
            checkboxAll.checked = checkedCount === allCheckboxes.length;
        }
    });
}
// // Hàm xử lý sự kiện cho checkbox "Tích tất cả"
// function handleCheckboxAll(checkboxAll) {
//     checkboxAll.addEventListener("change", function () {
//         const isChecked = this.checked;
//         document.querySelectorAll("tbody .custom-control-input").forEach(checkbox => {
//             checkbox.checked = isChecked;
//         });
//     });
// }

// // Hàm xử lý sự kiện khi checkbox trong bảng thay đổi
// function handleCheckboxChange(checkboxAll) {
//     document.addEventListener("change", function (e) {
//         if (e.target.classList.contains("custom-control-input") && e.target.id !== "checkbox-all") {
//             const checkboxes = document.querySelectorAll("tbody .custom-control-input");
//             const checkedBoxes = document.querySelectorAll("tbody .custom-control-input:checked");
//             checkboxAll.checked = checkboxes.length === checkedBoxes.length;
//         }
//     });
// }

// Khối chính khởi tạo khi DOM được tải
document.addEventListener("DOMContentLoaded", async function () {
    // Lấy dữ liệu từ localStorage
    const userData = localStorage.getItem("user");
    const supervisorId = localStorage.getItem("username");
    const user = JSON.parse(userData);
    const position = user.position;
    const tableBody = document.querySelector("table tbody");
    const checkboxAll = document.getElementById("checkbox-all");

    // Khởi tạo danh sách tổ trưởng
    let teamLeaders = await fetchTeamLeaders();

    // Lấy và hiển thị dữ liệu điểm danh
    const attendanceData = await fetchAttendanceData(position, supervisorId);
    if (attendanceData) {
        renderTable(attendanceData, tableBody, teamLeaders);
    }

    // Gắn sự kiện cho checkbox
    handleCheckboxAll(checkboxAll);
    handleCheckboxChange(checkboxAll);
});



// Hàm hiển thị cảnh báo xác nhận
function showConfirmationAlert(workerId, newTeamLeaderID) {
    swal({
        title: 'Bạn có chắc chắn?',
        text: 'Khi xác nhận, Tổ trưởng mới sẽ được cập nhật!',
        icon: 'warning',
        buttons: true,
        dangerMode: true,
    }).then((willUpdate) => {
        if (willUpdate) {
            updateTeamLeader(workerId, newTeamLeaderID);
            swal('Đã cập nhật tổ trưởng mới thành công!', {
                icon: 'success',
            });
        } else {
            swal('Cập nhật tổ trưởng đã bị hủy!');
        }
    });
}

// Xử lý sự kiện khi bấm nút "Cập Nhật Ca"
document.getElementById("updateShiftBtn").addEventListener("click", async function () {
    const supervisorID = localStorage.getItem("username"); // Lấy SupervisorID từ localStorage

    if (!supervisorID) {
        swal("Lỗi!", "Không tìm thấy SupervisorID trong hệ thống!", "error");
        return;
    }

    swal({
        title: "Bạn có chắc chắn?",
        text: "Ca làm việc của Supervisor sẽ được cập nhật!",
        icon: "warning",
        buttons: ["Hủy", "Xác nhận"],
        dangerMode: true,
    }).then(async (willUpdate) => {
        if (willUpdate) {
            const success = await updateShiftForSupervisor(supervisorID);

            if (success) {
                swal("Thành công!", "Shift đã được cập nhật!", "success")                    
            } else {
                swal("Lỗi!", "Không thể cập nhật ca. Vui lòng thử lại!", "error");
            }
        } else {
            swal("Cập nhật đã bị hủy!");
        }
    });
});




document.getElementById("registerShiftExtensionBtn").addEventListener("click", async function () {
    const tableBody = document.querySelector("table tbody");
    const attendanceData = await fetchAttendanceData(JSON.parse(localStorage.getItem("user")).position, localStorage.getItem("username"));
    const lineSelection = document.getElementById("lineSelection");

    // Xóa nội dung cũ trong modal
    lineSelection.innerHTML = "";

    // Thêm danh sách line với ô nhập giờ
    attendanceData.forEach(worker => {
        const div = document.createElement("div");
        div.className = "list-group-item d-flex align-items-center py-2";
        div.innerHTML = `
            <div class="custom-control custom-checkbox flex-grow-1">
                <input type="checkbox" class="custom-control-input line-checkbox" id="line-${worker.Line}" value="${worker.Line}">
                <label class="custom-control-label" for="line-${worker.Line}">${worker.Line} (${worker.TeamLeaderName})</label>
            </div>
            <div class="input-group w-25">
                <input type="number" class="form-control form-control-sm shift-hours-input border-primary" 
                    id="hours-${worker.Line}" min="0" step="0.5" placeholder="Giờ" 
                    value="${worker.shift_extension ? worker.shift_extension_hours : ''}" 
                    ${!worker.shift_extension ? 'disabled' : ''}>
            </div>
        `;
        lineSelection.appendChild(div);

        // Khi tích/bỏ tích checkbox, kích hoạt hoặc vô hiệu hóa và xóa ô nhập giờ
        const checkbox = div.querySelector(`#line-${worker.Line}`);
        const hoursInput = div.querySelector(`#hours-${worker.Line}`);
        checkbox.addEventListener("change", function () {
            hoursInput.disabled = !this.checked;
            if (this.checked && !hoursInput.value) {
                hoursInput.value = 3.5; // Giá trị mặc định khi chọn
            } else if (!this.checked) {
                hoursInput.value = ''; // Xóa giá trị khi bỏ tích
            }
        });
    });

    // Mở modal (Bootstrap 4.3.1)
    $('#shiftExtensionModal').modal('show');

    // Sự kiện cho nút "Chọn Tất Cả"
    const selectAllBtn = document.getElementById("selectAllLinesBtn");
    let allSelected = false; // Trạng thái chọn tất cả
    selectAllBtn.addEventListener("click", function () {
        allSelected = !allSelected;
        const checkboxes = lineSelection.querySelectorAll(".line-checkbox");
        checkboxes.forEach(checkbox => {
            checkbox.checked = allSelected;
            const hoursInput = checkbox.closest(".list-group-item").querySelector(".shift-hours-input");
            hoursInput.disabled = !allSelected;
            if (allSelected && !hoursInput.value) {
                hoursInput.value = 4; // Mặc định 4 khi chọn tất cả
            } else if (!allSelected) {
                hoursInput.value = ''; // Xóa giá trị khi bỏ chọn tất cả
            }
        });
        this.textContent = allSelected ? "Bỏ Chọn Tất Cả" : "Chọn Tất Cả"; // Cập nhật nhãn nút
    });
});



document.getElementById("saveShiftExtension").addEventListener("click", async function () {
    const date = document.getElementById("shiftExtensionDate").value;
    const selectedLines = Array.from(document.querySelectorAll(".line-checkbox:checked"));

    if (!date) {
        swal('Lỗi!', 'Vui lòng chọn ngày giãn ca!', 'warning');
        return;
    }
    if (selectedLines.length === 0) {
        swal('Lỗi!', 'Vui lòng chọn ít nhất một line!', 'warning');
        return;
    }

    // Gom tất cả dữ liệu thành một mảng
    const dataToSend = [];
    for (const checkbox of selectedLines) {
        const workerLine = checkbox.value;
        const hoursInput = document.getElementById(`hours-${workerLine}`);
        const hours = hoursInput.value;

        if (!hours) {
            swal('Lỗi!', `Vui lòng nhập số giờ cho ${checkbox.nextElementSibling.textContent}!`, 'warning');
            return;
        }

        dataToSend.push({
            workerLine: workerLine,
            hours: hours,
            date: date,
            shift_gap : '1'
        });
    }

    // Log toàn bộ dữ liệu sẽ gửi đi
    console.log("Dữ liệu gửi đi:", dataToSend);

    //Gửi dữ liệu đến hàm updateShiftExtension (hoặc API)
    try {
        await updateShiftExtension(dataToSend); // Giả định hàm này hỗ trợ nhận mảng
    } catch (error) {
        console.error('Lỗi khi gửi dữ liệu:', error);
        swal('Lỗi!', 'Đã xảy ra lỗi khi lưu dữ liệu. Vui lòng thử lại sau!', 'error');
        return;
    }

    // Đóng modal và làm mới bảng
    $('#shiftExtensionModal').modal('hide');
    const tableBody = document.querySelector("table tbody");
    const attendanceData = await fetchAttendanceData(JSON.parse(localStorage.getItem("user")).position, localStorage.getItem("username"));
    const teamLeaders = await fetchTeamLeaders();
    renderTable(attendanceData, tableBody, teamLeaders);
});
async function updateShiftExtension(dataToSend) {
    console.log(dataToSend)
    try {
        const response = await fetch('update-ot-shift-gap', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dataToSend)
        });

        if (!response.ok) {
            throw new Error('Lỗi khi cập nhật giãn ca');
        }

        const data = await response.json();
        console.log('Cập nhật giãn ca thành công:', data);
        swal("Thành công!", "Cập nhật giãn ca thành công!", "success")  
    } catch (error) {
        console.error('Lỗi khi cập nhật giãn ca:', error);
        swal('Lỗi!', 'Không thể cập nhật giãn ca!', 'error');
    }
}

// Check time đăng ký giãn ca ( Trong tuần )
document.getElementById("shiftExtensionDate").addEventListener("change", function () {
    const selectedDate = new Date(this.value); // Ngày được chọn
    const today = new Date(); // Lấy ngày hiện tại

    // Tìm ngày bắt đầu tuần (Thứ Hai) và ngày kết thúc tuần (Chủ Nhật)
    const startDate = new Date(today); // Ngày bắt đầu
    const endDate = new Date(today); // Ngày kết thúc

    startDate.setDate(today.getDate() - today.getDay() + 1); // Tính ngày Thứ Hai (đầu tuần)
    endDate.setDate(today.getDate() + (7 - today.getDay())); // Tính ngày Chủ Nhật (cuối tuần)

    // Xóa thông tin giờ, phút, giây để chỉ so sánh theo ngày
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);
    selectedDate.setHours(0, 0, 0, 0);

    // Log ra ngày bắt đầu và ngày kết thúc
    // console.log("Ngày bắt đầu (Thứ Hai):", startDate.toLocaleDateString());
    // console.log("Ngày kết thúc (Chủ Nhật):", endDate.toLocaleDateString());
    // console.log("Ngày hiện tại (Cố định):", today.toLocaleDateString());

    if (selectedDate < startDate || selectedDate > endDate) {
       // alert(`Ngày đăng ký phải nằm trong khoảng từ ${startDate.toLocaleDateString()} đến ${endDate.toLocaleDateString()}.`);
        iziToast.warning({
            title: 'Cảnh Báo',
            message: `Ngày đăng ký phải nằm trong khoảng từ ${startDate.toLocaleDateString()} đến ${endDate.toLocaleDateString()}.`,
            position: 'topCenter'
        });
        this.value = ""; // Xóa giá trị đã nhập nếu không hợp lệ
    } else {
        console.log("Ngày hợp lệ:", this.value);
    }
});


