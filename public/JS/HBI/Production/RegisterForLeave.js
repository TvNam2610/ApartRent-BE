
// // Hàm để điều chỉnh trường "Ngày Kết Thúc" dựa trên loại nghỉ
// function toggleLeaveOptions(workerId) {
//     const leaveType = document.getElementById(`leaveType${workerId}`).value;
//     const endDateInput = document.getElementById(`endDate${workerId}`);
//     const startDateInput = document.getElementById(`startDate${workerId}`);

//     if (leaveType.startsWith("half")) {
//         endDateInput.disabled = true;
//         endDateInput.value = startDateInput.value;
//     } else {
//         endDateInput.disabled = false;
//     }

//     // Cập nhật "Ngày Kết Thúc" khi "Ngày Nghỉ" thay đổi
//     startDateInput.addEventListener("change", function () {
//         if (leaveType.startsWith("half")) {
//             endDateInput.value = startDateInput.value;
//         }
//     });
// }
function toggleLeaveOptions(workerId) {
    const leaveType = document.getElementById(`leaveType${workerId}`).value;
    const endDateInput = document.getElementById(`endDate${workerId}`);
    const startDateInput = document.getElementById(`startDate${workerId}`);

    if (leaveType === "2" || leaveType === "3") { // Thay thế kiểm tra leaveType.startsWith("half")
        endDateInput.disabled = true;
        endDateInput.value = startDateInput.value;
    } else {
        endDateInput.disabled = false;
    }

    startDateInput.addEventListener("change", function () {
        if (leaveType === "2" || leaveType === "3") {
            endDateInput.value = startDateInput.value;
        }
    });
}


// Hàm tạo danh sách các ngày từ startDate đến endDate
function getDatesBetween(startDate, endDate) {
    let dates = [];
    let currentDate = new Date(startDate);
    let lastDate = new Date(endDate);

    while (currentDate <= lastDate) {
        let formattedDate = currentDate.toISOString().split("T")[0]; // Format YYYY-MM-DD
        dates.push(formattedDate);
        currentDate.setDate(currentDate.getDate() + 1);
    }
    return dates;
}

document.addEventListener("DOMContentLoaded", initApp);

function initApp() {
    setupAttendanceDate();
    setupUserPermissions();
    loadLines(""); // Gọi danh sách lines mặc định
    document.getElementById("workShopSelection").addEventListener("change", handleWorkShopChange);
    document.getElementById("saveBtn").addEventListener("click", handleSave);
}

// Thiết lập ngày mặc định
function setupAttendanceDate() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById("attendanceDate").value = today;
}

// Thiết lập quyền chỉnh sửa ngày
function setupUserPermissions() {
    const userData = localStorage.getItem("user");
    const user = JSON.parse(userData);
    const position = user?.position;
    const attendanceDateInput = document.getElementById("attendanceDate");

    if (position !== "ADMIN" && position !== "SuperAdmin") {
        attendanceDateInput.setAttribute("readonly", true);
    }
}

// Xử lý thay đổi WorkShop
function handleWorkShopChange() {
    const selectedWorkShop = this.value;
    loadLines(selectedWorkShop);
}


// Render danh sách Lines
function renderLineSelection(data) {
    const lineContainer = document.getElementById("lineSelection");
    lineContainer.innerHTML = "";

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
        btn.dataset.line = line.Line;

        btn.addEventListener("click", function () {
            document.querySelectorAll("#lineSelection button").forEach(btn => btn.classList.remove("active"));
            this.classList.add("active");

            fetchEmployeesByLine(line.Line);
        });

        lineContainer.appendChild(btn);
    });

    if (data.length > 0) {
        fetchEmployeesByLine(data[0].Line);
    }
}

// Gọi API lấy danh sách nhân viên theo Line
function fetchEmployeesByLine(selectedLine) {
    const position = JSON.parse(localStorage.getItem("user"))?.position;
    const teamLeaderId = localStorage.getItem("username");
    const attendanceDate = document.getElementById("attendanceDate").value;

    const apiUrl = `employees-by-team-leader?position=${position}&teamLeaderId=${teamLeaderId}&line=${selectedLine}&attendanceDate=${attendanceDate}`;

    fetch(apiUrl)
        .then(response => response.json())
        .then(employeeData => fetchLeaveCodes(leaveCodes => renderEmployeeTable(employeeData, leaveCodes)))
        .catch(error => console.error("Lỗi khi tải danh sách nhân viên:", error));
}

// Gọi API lấy danh sách mã nghỉ
function fetchLeaveCodes(callback) {
    fetch("get-all-leave-types")
        .then(response => response.json())
        .then(callback)
        .catch(error => console.error("Lỗi khi tải danh sách mã nghỉ:", error));
}

// Render danh sách nhân viên vào bảng
function renderEmployeeTable(employeeData, leaveCodes) {
    const tableBody = document.getElementById("attendanceTableBody");
    tableBody.innerHTML = "";

    employeeData.forEach(employee => {
        let row = document.createElement("tr");

        let leaveCodeOptions = leaveCodes.map(code =>
            `<option value="${code.id}">${code.motive}</option>`
        ).join("");

        row.innerHTML = `
            <td class="p-0 text-center">
                <div class="custom-checkbox custom-control">
                    <input type="checkbox" class="custom-control-input" id="worker${employee.Employee_ID}">
                    <label for="worker${employee.Employee_ID}" class="custom-control-label"></label>
                </div>
            </td>
            <td>${employee.ID}</td>
            <td>${employee.Employee_ID}</td>
            <td>${employee.Employee_name}</td>
            <td>${employee.WC}</td>
            <td>
                <select class="form-control" id="leaveCode${employee.Employee_ID}" name="leaveCode${employee.Employee_ID}">
                    ${leaveCodeOptions}
                </select>
            </td>
            <td>
                <input type="date" class="form-control" id="startDate${employee.Employee_ID}" name="startDate${employee.Employee_ID}" value="${employee.StartDate || ''}">
            </td>
            <td>
                <select class="form-control" id="leaveType${employee.Employee_ID}" name="leaveType${employee.Employee_ID}" onchange="toggleLeaveOptions(${employee.Employee_ID})">
                    <option value="1">Nghỉ Cả Ngày</option>
                    <option value="2">Nửa Ngày - Đầu Ca</option>
                    <option value="3">Nửa Ngày - Cuối Ca</option>

                </select>
            </td>
            <td>
                <input type="date" class="form-control" id="endDate${employee.Employee_ID}" name="endDate${employee.Employee_ID}" value="${employee.EndDate || ''}">
            </td>
        `;

        tableBody.appendChild(row);
    });
}


// Gọi API lấy danh sách Lines
function loadLines(workShop) {
    const position = JSON.parse(localStorage.getItem("user"))?.position;
    const teamLeaderId = localStorage.getItem("username");

    fetch(`lines-with-by-team-leaders?position=${position}&teamLeaderId=${teamLeaderId}&workShop=${workShop}`)
        .then(response => response.json())
        //.then(renderLineSelection)
        .then(data => {
            renderLineSelection(data); // Xử lý hiển thị danh sách Line

            // // Lấy danh sách các email quản đốc (EmailSupt) từ dữ liệu trả về
            // const supervisorEmails = [...new Set(data.map(line => line.EmailSupt))]; // Loại bỏ trùng lặp email
            // console.log("Email quản đốc:", supervisorEmails);
            // if (callback) {
            //     callback(supervisorEmails); // Truyền danh sách email qua callback
            // }
        })
        .catch(error => console.error("Lỗi khi tải danh sách Line:", error));
}

// Xử lý sự kiện khi nhấn nút "Lưu"
function handleSave() {
    const position = JSON.parse(localStorage.getItem("user"))?.position;
    const teamLeaderId = localStorage.getItem("username");

    fetch(`lines-with-by-team-leaders?position=${position}&teamLeaderId=${teamLeaderId}`)
        .then(response => response.json())
        .then(data => {
            renderLineSelection(data);
            const supervisorEmails = [...new Set(data.map(line => line.EmailSupt))];
            const supervisorSuptName = [...new Set(data.map(line => line.SuptName))];
            //console.log("Email quản đốc lấy ra là:", supervisorEmails);

            if (!supervisorEmails || supervisorEmails.length === 0) {
                iziToast.error({
                    title: "Lỗi",
                    message: "Không tìm thấy email quản đốc!",
                    position: "topRight"
                });
                return;
            }

            let selectedEmployees = [];
            let createdBy = localStorage.getItem("username");
            let randomTicketCode = generateRandomCode();

            document.querySelectorAll("#attendanceTableBody tr").forEach(row => {
                let checkbox = row.querySelector("input[type='checkbox']");
                if (checkbox.checked) {
                    let employeeID = row.children[2].textContent.trim();
                    let leaveCode = row.querySelector(`select[name="leaveCode${employeeID}"]`).value;
                    let startDate = row.querySelector(`input[name="startDate${employeeID}"]`).value;
                    let leaveType = row.querySelector(`select[name="leaveType${employeeID}"]`).value;
                    let endDateInput = row.querySelector(`input[name="endDate${employeeID}"]`);
                    let endDate = leaveType === "1" ? endDateInput.value : startDate;

                    selectedEmployees.push({
                        employeeID: employeeID,
                        leaveTypeID: leaveCode,
                        startDate: startDate,
                        endDate: endDate,
                        leaveDetailID: leaveType,
                        leaveRequestCode: randomTicketCode,
                        created_by: createdBy
                    });
                }
            });

            if (selectedEmployees.length === 0) {
                iziToast.warning({
                    title: 'Cảnh báo',
                    message: 'Vui lòng chọn ít nhất một công nhân để đăng ký nghỉ!',
                    position: 'topRight'
                });
                return;
            }

                // Kiểm tra tính hợp lệ của dữ liệu
                for (let employee of selectedEmployees) {
                    if (!employee.startDate) {
                        iziToast.error({
                            title: 'Lỗi nhập liệu',
                            message: `Vui lòng chọn ngày bắt đầu cho công nhân ${employee.employeeID}`,
                            position: 'topRight'
                        });
                        return;
                    }

                    if (employee.leaveDetailID === "1" && (!employee.endDate || new Date(employee.endDate) < new Date(employee.startDate))) {
                        iziToast.error({
                            title: 'Lỗi nhập liệu',
                            message: `Ngày kết thúc không hợp lệ cho công nhân ${employee.employeeID}`,
                            position: 'topRight'
                        });
                        return;
                    }
            }
            
            fetch("leave-history-insert-multiple", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(selectedEmployees)
            })
                .then(response => response.json())
                .then(() => {
                    iziToast.info({
                        title: 'Thông báo',
                        message: 'Hệ Thống Đang Xử Lý ...',
                        position: 'topRight'
                    });

                    supervisorEmails.forEach(email => {
                        fetch("send-mail-history-leave-final", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                emailQD: email,
                                maphieu: randomTicketCode,
                                supervisorSuptName: supervisorSuptName
                            })
                        })
                            .then(emailResponse => emailResponse.json())
                            .then(emailData => {
                                if (emailData.success) {
                                    iziToast.success({
                                        title: "Thành công",
                                        message: `Đăng ký và gửi thành công tới : ${email}`,
                                        position: "topRight"
                                    });
                                } else {
                                    iziToast.error({
                                        title: "Lỗi",
                                        message: `Không thể gửi email đến: ${email}, vui lòng thử lại!`,
                                        position: "topRight"
                                    });
                                }
                            })
                            .catch(error => {
                                console.error(`Lỗi khi gửi email đến: ${email}`, error);
                                iziToast.error({
                                    title: "Lỗi",
                                    message: `Có lỗi xảy ra khi gửi email đến: ${email}!`,
                                    position: "topRight"
                                });
                            });
                    });

                    resetForm();
                })
                .catch(error => {
                    console.error("Lỗi khi gửi dữ liệu đăng ký nghỉ:", error);
                    iziToast.error({
                        title: 'Lỗi hệ thống',
                        message: 'Có lỗi xảy ra! Vui lòng thử lại.',
                        position: 'topRight'
                    });
                });
        })
        .catch(error => {
            console.error("Lỗi khi tải danh sách Line:", error);
            iziToast.error({
                title: "Lỗi",
                message: "Không thể tải danh sách email quản đốc!",
                position: "topRight"
            });
        });
}


function resetForm() {
    document.querySelectorAll("#attendanceTableBody tr").forEach(row => {
        let checkbox = row.querySelector("input[type='checkbox']");
        let startDate = row.querySelector(`input[name^="startDate"]`);
        let endDate = row.querySelector(`input[name^="endDate"]`);

        // Bỏ chọn checkbox
        if (checkbox) checkbox.checked = false;

       
        if (startDate) startDate.value = "";      
        if (endDate) endDate.value = "";
    });
}

// Hàm tạo mã phiếu random
function generateRandomCode() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0"); // Tháng bắt đầu từ 0
    const day = String(now.getDate()).padStart(2, "0");
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const seconds = String(now.getSeconds()).padStart(2, "0");

    return `REQ${year}${month}${day}${hours}${minutes}${seconds}`;
}
























// // Hàm gọi API lấy danh sách Lines theo vai trò
// document.addEventListener("DOMContentLoaded", function () {

//     let today = new Date().toISOString().split('T')[0];
//     //document.getElementById("attendanceDate").value = today;
//     const attendanceDateInput = document.getElementById("attendanceDate");
//     attendanceDateInput.value = today;



//     const userData = localStorage.getItem("user");
//     const teamLeaderId = localStorage.getItem("username");
//     const user = JSON.parse(userData);
//     const position = user.position;


//     // Nếu không phải Admin hoặc SuperAdmin thì chặn chỉnh sửa ngày (chỉ đọc, không tắt hoàn toàn)
//     if (position !== "ADMIN" && position !== "SuperAdmin") {
//         attendanceDateInput.setAttribute("readonly", true); // Ngăn nhập liệu nhưng vẫn giữ giá trị
//     }

//     // Hàm tải danh sách lines
//     function loadLines(workShop) {
//         fetch(`lines-with-by-team-leaders?position=${position}&teamLeaderId=${teamLeaderId}&workShop=${workShop}`)
//             .then(response => response.json())
//             .then(data => {
//                 const lineContainer = document.getElementById("lineSelection");
//                 lineContainer.innerHTML = ""; // Xóa nội dung cũ nếu có

//                 // Hiển thị thông tin tổ trưởng nếu có dữ liệu
//                 const teamLeaderInfo = document.getElementById("teamLeaderInfo");
//                 if (data.length > 0 && data[0].TeamLeaderName) {
//                     teamLeaderInfo.textContent = `Tổ trưởng: ${data[0].TeamLeaderName} - ID: ${data[0].TeamLeaderID}`;
//                 } else {
//                     teamLeaderInfo.textContent = "";
//                 }

//                 data.forEach((line, index) => {
//                     let btn = document.createElement("button");
//                     btn.type = "button";
//                     btn.className = `btn btn-outline-primary rounded-pill m-2 shadow-sm ${index === 0 ? "active" : ""}`;
//                     btn.textContent = line.Line;
//                     btn.dataset.line = line.Line; // Lưu Line để gọi API

//                     btn.addEventListener("click", function () {
//                         document.querySelectorAll("#lineSelection button").forEach(btn => btn.classList.remove("active"));
//                         this.classList.add("active");

//                         // Gọi API lấy danh sách nhân viên khi chọn line
//                         fetchEmployeesByLine(line.Line);
//                     });

//                     lineContainer.appendChild(btn);
//                 });

//                 // Tự động gọi API cho line đầu tiên (nếu có)
//                 if (data.length > 0) {
//                     fetchEmployeesByLine(data[0].Line);
//                 }
//             })
//             .catch(error => console.error("Lỗi khi tải danh sách Line:", error));
//     }



//     // Hàm gọi API lấy danh sách mã nghỉ
//     function fetchLeaveCodes(callback) {
//         fetch("get-all-leave-types") // Thay bằng API thực tế
//             .then(response => response.json())
//             .then(data => {
//                 callback(data); // Trả dữ liệu về callback
//             })
//             .catch(error => console.error("Lỗi khi tải danh sách mã nghỉ:", error));
//     }

//     // Hàm gọi API danh sách nhân viên theo line
//     function fetchEmployeesByLine(selectedLine) {
//         const attendanceDate = document.getElementById("attendanceDate").value;
//         const apiUrl = `employees-by-team-leader?position=${position}&teamLeaderId=${teamLeaderId}&line=${selectedLine}&attendanceDate=${attendanceDate}`;

//         fetch(apiUrl)
//             .then(response => response.json())
//             .then(employeeData => {
//                 //console.log("Danh sách nhân viên:", employeeData);
//                 const tableBody = document.getElementById("attendanceTableBody");
//                 tableBody.innerHTML = ""; // Xóa dữ liệu cũ

//                 // Gọi API lấy danh sách mã nghỉ trước khi render bảng
//                 fetchLeaveCodes((leaveCodes) => {
//                     employeeData.forEach((employee) => {
//                         let row = document.createElement("tr");

//                         // Tạo danh sách <option> cho Mã Nghỉ
//                         let leaveCodeOptions = leaveCodes.map(code =>
//                             `<option value="${code.code_name}">${code.motive}</option>`
//                         ).join("");


//                         row.innerHTML = `
//                         <td class="p-0 text-center">
//                             <div class="custom-checkbox custom-control">
//                                 <input type="checkbox" class="custom-control-input" id="worker${employee.Employee_ID}">
//                                 <label for="worker${employee.Employee_ID}" class="custom-control-label"> </label>
//                             </div>
//                         </td>
//                         <td>${employee.ID}</td>
//                         <td>${employee.Employee_ID}</td>
//                         <td>${employee.Employee_name}</td>
//                         <td>${employee.WC}</td>

//                         <td>
//                             <select class="form-control" id="leaveCode${employee.Employee_ID}" name="leaveCode${employee.Employee_ID}">
//                                 ${leaveCodeOptions}
//                             </select>
//                         </td>
//                         <td>
//                             <input type="date" class="form-control" id="startDate${employee.Employee_ID}" name="startDate${employee.Employee_ID}"
//                                 value="${employee.StartDate || ''}">
//                         </td>
//                         <td>
//                             <select class="form-control" id="leaveType${employee.Employee_ID}" name="leaveType${employee.Employee_ID}" onchange="toggleLeaveOptions(${employee.Employee_ID})">
//                                 <option value="full">Nghỉ Cả Ngày</option>
//                                 <option value="half-start">Nửa Ngày - Đầu Ca</option>
//                                 <option value="half-end">Nửa Ngày - Cuối Ca</option>
//                             </select>
//                         </td>
//                         <td>
//                             <input type="date" class="form-control" id="endDate${employee.Employee_ID}" name="endDate${employee.Employee_ID}"
//                                 value="${employee.EndDate || ''}">
//                         </td>


//                     `;

//                         tableBody.appendChild(row);
//                     });
//                 });
//             })
//             .catch(error => console.error("Lỗi khi tải danh sách nhân viên:", error));
//     }










//     // Gọi hàm lần đầu với WorkShop mặc định là "A"
//     loadLines("");

//     // Lắng nghe sự kiện thay đổi trên dropdown và gọi hàm loadLines tương ứng
//     document.getElementById("workShopSelection").addEventListener("change", function () {
//         const selectedWorkShop = this.value;
//         loadLines(selectedWorkShop);
//     });


//     document.getElementById("saveBtn").addEventListener("click", function () {
//         let selectedEmployees = []; // Mảng chứa danh sách công nhân đã chọn

//         document.querySelectorAll("#attendanceTableBody tr").forEach(row => {
//             let checkbox = row.querySelector("input[type='checkbox']");
//             if (checkbox.checked) {
//                 let employeeID = row.children[2].textContent.trim(); // Lấy Mã Công Nhân
//                 let leaveCode = row.querySelector(`select[name="leaveCode${employeeID}"]`).value; // Lấy Mã Nghỉ
//                 let startDate = row.querySelector(`input[name="startDate${employeeID}"]`).value; // Ngày bắt đầu
//                 let leaveType = row.querySelector(`select[name="leaveType${employeeID}"]`).value; // Loại nghỉ
//                 let endDateInput = row.querySelector(`input[name="endDate${employeeID}"]`);
//                 let endDate = leaveType === "full" ? endDateInput.value : startDate; // Nếu nghỉ cả ngày, lấy ngày kết thúc, nếu không thì giống ngày bắt đầu
//                 let randomTicketCode = generateRandomCode(); // Tạo mã phiếu random

//                 selectedEmployees.push({
//                     employee_id: employeeID,
//                     leave_code: leaveCode,
//                     start_date: startDate,
//                     end_date: endDate,
//                     leave_type: leaveType,
//                     random_ticket_code: randomTicketCode
//                 });
//             }
//         });

//         if (selectedEmployees.length === 0) {
//             alert("Vui lòng chọn ít nhất một công nhân để đăng ký nghỉ!");
//             return;
//         }

//         // 🟢 Log dữ liệu gửi đi để kiểm tra
//         console.log("Dữ liệu gửi đi:", selectedEmployees);

//         // // Gửi dữ liệu đến API
//         // fetch("register-leave", {
//         //     method: "POST",
//         //     headers: {
//         //         "Content-Type": "application/json"
//         //     },
//         //     body: JSON.stringify({ leave_requests: selectedEmployees })
//         // })
//         //     .then(response => response.json())
//         //     .then(data => {
//         //         alert("Đăng ký nghỉ thành công!");
//         //         console.log("Kết quả API:", data);
//         //     })
//         //     .catch(error => {
//         //         console.error("Lỗi khi gửi dữ liệu đăng ký nghỉ:", error);
//         //         alert("Có lỗi xảy ra! Vui lòng thử lại.");
//         //     });
//     });

//     // Hàm tạo mã phiếu random
//     function generateRandomCode() {
//         const now = new Date();
//         const dateTime = now.getFullYear().toString() +
//             (now.getMonth() + 1).toString().padStart(2, '0') +
//             now.getDate().toString().padStart(2, '0') +
//             now.getHours().toString().padStart(2, '0') +
//             now.getMinutes().toString().padStart(2, '0');

//         const randomChars = Math.random().toString(36).substring(2, 6).toUpperCase(); // 4 ký tự ngẫu nhiên (chữ và số)

//         return `REQ${dateTime}${randomChars}`;
//     }



// });