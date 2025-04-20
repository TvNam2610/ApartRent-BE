
// -------------------------------------------------Lấy dữ liệu từ API-------------------------------------------------//
// Hàm gọi API lấy danh sách Lines theo vai trò
document.addEventListener("DOMContentLoaded", function () {

    let today = new Date().toISOString().split('T')[0];
    //document.getElementById("attendanceDate").value = today;
    const attendanceDateInput = document.getElementById("attendanceDate");
    attendanceDateInput.value = today;



    const userData = localStorage.getItem("user");
    const teamLeaderId = localStorage.getItem("username");
    const user = JSON.parse(userData);
    const position = user.position;   


    // Nếu không phải Admin hoặc SuperAdmin thì chặn chỉnh sửa ngày (chỉ đọc, không tắt hoàn toàn)
    if (position !== "ADMIN" && position !== "SuperAdmin") {
        attendanceDateInput.setAttribute("readonly", true); // Ngăn nhập liệu nhưng vẫn giữ giá trị
    }

    // Hàm tải danh sách lines
    function loadLines(workShop) {
        fetch(`lines-with-by-team-leaders?position=${position}&teamLeaderId=${teamLeaderId}&workShop=${workShop}`)
            .then(response => response.json())
            .then(data => {
                const lineContainer = document.getElementById("lineSelection");
                lineContainer.innerHTML = ""; // Xóa nội dung cũ nếu có

                // Hiển thị thông tin tổ trưởng nếu có dữ liệu
                const teamLeaderInfo = document.getElementById("teamLeaderInfo");
                if (data.length > 0 && data[0].TeamLeaderName) {
                    teamLeaderInfo.textContent = `Tổ trưởng: ${data[0].TeamLeaderName} - ID: ${data[0].TeamLeaderID}`;
                } else {
                    teamLeaderInfo.textContent = "";
                }

                data.forEach((line, index) => {
                    let btn = document.createElement("button");
                    btn.type = "button";
                    btn.className = `btn btn-outline-primary rounded-pill m-2 shadow-sm ${index === 0 ? "active" : ""}`;
                    btn.textContent = line.Line;
                    btn.dataset.line = line.Line; // Lưu Line để gọi API

                    btn.addEventListener("click", function () {
                        document.querySelectorAll("#lineSelection button").forEach(btn => btn.classList.remove("active"));
                        this.classList.add("active");

                        // Gọi API lấy danh sách nhân viên khi chọn line
                        fetchEmployeesByLine(line.Line);
                    });

                    lineContainer.appendChild(btn);
                });

                // Tự động gọi API cho line đầu tiên (nếu có)
                if (data.length > 0) {
                    fetchEmployeesByLine(data[0].Line);
                }
            })
            .catch(error => console.error("Lỗi khi tải danh sách Line:", error));
    }



    // Hàm gọi API danh sách nhân viên theo tổ trưởng và line
    function fetchEmployeesByLine(selectedLine) {
        const attendanceDate = document.getElementById("attendanceDate").value;
       // console.log("Ngày chấm công:", attendanceDate);
        //const apiUrl = `employees-by-team-leader?position=${position}&teamLeaderId=${teamLeaderId}&line=${selectedLine}`;
        const apiUrl = `employees-by-team-leader?position=${position}&teamLeaderId=${teamLeaderId}&line=${selectedLine}&attendanceDate=${attendanceDate}`;
       // console.log("Ngày chấm công222222:", apiUrl);
        fetch(apiUrl)
            .then(response => response.json())
            .then(data => {
                console.log("Danh sách nhân viên:", data);
                const tableBody = document.getElementById("attendanceTableBody");
                tableBody.innerHTML = ""; // Xóa dữ liệu cũ

                data.forEach((employee) => {
                    let row = document.createElement("tr");

                    row.innerHTML = `
                        <td>${employee.ID}</td>
                        <td>${employee.Employee_ID}</td>
                        <td>${employee.Employee_name}</td>
                        <td>${employee.WC}</td>
                        <td>${employee.OT_Hours}</td>
                        <td>${employee.TG_Hours}</td>                        
                        <td>
                            <input type="radio" class="attendance-radio" name="worker${employee.ID}" value="1" 
                                data-employee-id="${employee.Employee_ID}" 
                                data-attendance-date="${attendanceDate}" 
                                ${employee.Status === 1 ? "checked" : ""}>
                        </td>
                        <td>
                            <input type="radio" class="attendance-radio" name="worker${employee.ID}" value="0" 
                                data-employee-id="${employee.Employee_ID}" 
                                data-attendance-date="${attendanceDate}" 
                                ${employee.Status === 0 ? "checked" : ""}>
                        </td>
                    `;

                    tableBody.appendChild(row);
                });
                // Thêm sự kiện cập nhật khi bấm vào radio button
                addRadioEventListeners();
            })
            .catch(error => console.error("Lỗi khi tải danh sách nhân viên:", error));
    }

    // Hàm thêm sự kiện `change` cho radio button để cập nhật trạng thái điểm danh
    function addRadioEventListeners() {
        document.querySelectorAll('.attendance-radio').forEach(radio => {
            radio.addEventListener('change', async (event) => {
                const employeeId = event.target.dataset.employeeId;
                const attendanceDate = event.target.dataset.attendanceDate;
                const status = event.target.value; // 1: Đi làm, 0: Nghỉ

                try {
                    const response = await fetch('update-attendance-status', { // Thêm dấu `/` trước URL để gọi API đúng
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ employeeId, attendanceDate, status })
                    });

                    const result = await response.json();

                    if (response.ok) {
                        iziToast.success({
                            title: 'Thành công',
                            message: 'Cập nhật trạng thái điểm danh thành công!',
                            position: 'topRight'
                        });
                    } else {
                        iziToast.error({
                            title: 'Lỗi',
                            message: `Cập nhật thất bại: ${result.message}`,
                            position: 'topRight'
                        });
                    }
                } catch (error) {
                    console.error('Lỗi khi cập nhật:', error);
                    iziToast.error({
                        title: 'Lỗi hệ thống',
                        message: 'Không thể cập nhật trạng thái điểm danh!',
                        position: 'topRight'
                    });
                }
            });
        });
    }



    // Gọi API khi thay đổi ngày chấm công
    document.getElementById("attendanceDate").addEventListener("change", function () {
        const activeLine = document.querySelector("#lineSelection .active");
        if (activeLine) {
            fetchEmployeesByLine(activeLine.dataset.line);
        }
    });



    // Gọi hàm lần đầu với WorkShop mặc định là "A"
    loadLines("");

    // Lắng nghe sự kiện thay đổi trên dropdown và gọi hàm loadLines tương ứng
    document.getElementById("workShopSelection").addEventListener("change", function () {
        const selectedWorkShop = this.value;
        loadLines(selectedWorkShop);
    });
});

