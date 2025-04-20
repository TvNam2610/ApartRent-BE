const workShopSelectElement = document.getElementById("workShopSelection");
const attendanceDateElement = document.getElementById("attendanceDate");
const saveButton = document.getElementById("saveBtn")
const user = JSON.parse(localStorage.getItem("user"));
const teamLeaderId = JSON.parse(localStorage.getItem("username"))
const position = user.position;

// Hàm hiển thị cảnh báo xác nhận
function showConfirmationAlert(payload) {
    swal({
        title: 'Bạn có chắc chắn?',
        text: 'Khi xác nhận, thông tin mới sẽ được cập nhật!',
        icon: 'warning',
        buttons: true,
        dangerMode: true,
    }).then((willUpdate) => {
        if (willUpdate) {
            updateAllOTHours(payload)

        } else {
            swal('Cập nhật OT đã bị hủy!');
        }
    });
}

const updateOTHours = async (payload) => {
    try {
        const response = await fetch(`update-OT-hours`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            throw new Error('Failed to update employee');
        }

        const data = await response.json();
        console.log('Employee updated:', data);
    } catch (error) {
        console.error('Error updating employee:', error);
    }
};

const updateAllOTHours = async (selectedEmployees) => {
    try {
        const updatePromises = selectedEmployees.map(employee => updateOTHours(employee));
        await Promise.all(updatePromises);
        const activeLine = document.querySelector("#lineSelection .active");
        iziToast.success({
            title: 'Thông báo!',
            message: 'Cập nhập thành công!',
            position: 'topRight'
        });
        fetchEmployeesByLine(activeLine.textContent.trim(), position, teamLeaderId, attendanceDateElement.value);
        document.querySelectorAll("#workerTableBody tr").forEach(row => {
            let checkbox = row.querySelector("input[type='checkbox']");
            if (checkbox.checked) {
                checkbox.checked = false
                row.querySelector("select").classList.add("d-none");
                row.querySelector("textarea").classList.add("d-none");
            }
        })

    }
    catch (err) {
        console.error("Lỗi khi gửi dữ liệu đăng ký nghỉ:", err);
        iziToast.error({
            title: 'Thông báo!',
            message: 'Cập nhập không thành công!',
            position: 'topRight'
        });
    }

};


// hàm xử lý sự kiện thay đổi trnjg thái của radio button
function handleChangeRadio(workerId) {
    const radioButton = document.getElementById(`radio-worker-${workerId}`)
    const otSelection = document.querySelector(`#ot-hours-${workerId}`)
    const otSpan = document.querySelector(`.ot-hours-${workerId}`)
    const otNots = document.querySelector(`#notes-${workerId}`)
    const notsOtSpan = document.querySelector(`.notes-ot-${workerId}`)
    if (radioButton.checked) {
        otSelection.classList.remove("d-none")
        otNots.classList.remove("d-none");
        otSpan.classList.add("d-none");
        notsOtSpan.classList.add("d-none");
    }
    else {
        otSelection.classList.add("d-none")
        otSelection.value = '0'
        otNots.classList.add("d-none");
        otSpan.classList.remove("d-none");
        notsOtSpan.classList.remove("d-none");

    }
}
const renderTeamLeaderInfo = (teamLeaderId,teamLeaderName) => 
{
    // Hiển thị thông tin tổ trưởng nếu có dữ liệu
    const teamLeaderInfo = document.getElementById("teamLeaderInfo");
    if (teamLeaderId) {
        teamLeaderInfo.textContent = `Tổ trưởng: ${teamLeaderName} - ID: ${teamLeaderId}`;
    } else {
        teamLeaderInfo.textContent = "";
    }
}
const renderListLines = (lines) => {
    const lineContainer = document.getElementById("lineSelection");
    lineContainer.innerHTML = ""; // Xóa nội dung cũ nếu có
    lines.forEach((line, index) => {
        let btn = document.createElement("button");
        btn.type = "button";
        btn.className = `btn btn-outline-primary rounded-pill m-2 shadow-sm ${index === 0 ? "active" : ""}`;
        btn.textContent = line.Line;
        btn.dataset.line = line.Line; // Lưu Line để gọi API

        btn.addEventListener("click", function () {
            document.querySelectorAll("#lineSelection button").forEach(btn => btn.classList.remove("active"));
            this.classList.add("active");
            // Gọi API lấy danh sách nhân viên khi chọn line
            fetchEmployeesByLine(line.Line, position, teamLeaderId, attendanceDateElement.value);
        });
        lineContainer.appendChild(btn);
    });
}


// Hàm tải danh sách lines
function loadLines(workShop, position, teamLeaderId) {
    fetch(`lines-with-by-team-leaders?position=${position}&teamLeaderId=${teamLeaderId}&workShop=${workShop}`)
        .then(response => response.json())
        .then(data => {
            renderListLines(data)
            // Tự động gọi API cho line đầu tiên (nếu có)
            if (data.length > 0) {
                renderTeamLeaderInfo(data[0].TeamLeaderID,data[0].TeamLeaderName)
                fetchEmployeesByLine(data[0].Line, position, teamLeaderId, attendanceDateElement.value);
            }
        })
        .catch(error => console.error("Lỗi khi tải danh sách Line:", error));
}

// hàm lấy dữ lệu OT
async function fetchOTs() {
    try {
        const response = await fetch('OTs');
        const data = await response.json();
        return data.data.data;
    } catch (error) {
        console.error("Lỗi khi lấy danh sách Team Leaders:", error);
        return [];
    }
}
// Hàm gọi API danh sách nhân viên theo tổ trưởng và line
async function fetchEmployeesByLine(selectedLine, position, teamLeaderId, attendanceDate) {
    try {
        const response = await fetch(`employees-by-team-leader?position=${position}&teamLeaderId=${teamLeaderId}&line=${selectedLine}&attendanceDate=${attendanceDate}`);
        const data = await response.json();
        let ots = await fetchOTs();
        renderTable(data, ots)
        return data;
    } catch (error) {
        console.error("Lỗi khi lấy danh sách Team Leaders:", error);
        return [];
    }
}

// hàm hiển thị body bảng
function renderTable(employees, OTs) {
    const tableBody = document.getElementById("workerTableBody");
    tableBody.innerHTML = ""; // Xóa dữ liệu cũ
    employees.forEach((employee) => {
        let row = document.createElement("tr");
        row.innerHTML = `
            <td class="text-center">   
                <input type="checkbox" id="radio-worker-${employee.ID}" onchange="handleChangeRadio(${employee.ID})">
            </td>
            <td class="text-center">${employee.ID}</td>
            <td class="text-center">${employee.Employee_ID}</td>
            <td class="text-center">${employee.Employee_name}</td>
            <td class="text-center">${employee.LineName}</td>
             <td class="text-center">
                 <span class="text-center ot-hours-${employee.ID} ${employee.OT_Hours !== 0 ? "" : "d-none"}">${employee.OT_Hours} giờ</span>
                 <select class="form-control d-none" id="ot-hours-${employee.ID}" name="otHours${employee.ID}" >
                 <option value ='0'>Chọn thời gian OT</option>
                 ${OTs.map((ot) => {
            return ` <option value = ${ot.hour} ${ot.hour === employee.OT_Hours ? "selected" : ""}>${ot.Code_Name}</option>`
        })
            }   
                 </select>
             </td>
             <td class="text-center align-middle p-3">
                <span class="text-center notes-ot-${employee.ID} ${employee.Notes_OT ? "" : "d-none"}">${employee.Notes_OT} </span>
                 <textarea  name="notes-${employee.ID}" class="d-none form-control" id="notes-${employee.ID}"  >${employee.Notes_OT ? employee.Notes_OT : ""}</textarea>
             </td>
        `;
        tableBody.appendChild(row);

    });
}

// hàm xử lý khi người dùng nhấn vào nút xác nhận đăng ký
function handleSave() {
    let dataArr = [];
    let isError = false;
    document.querySelectorAll("#workerTableBody tr").forEach(row => {
        let checkbox = row.querySelector("input[type='checkbox']");
        if (checkbox.checked) {
            let employeeID = row.children[2].textContent.trim();
            let notes = row.querySelector("textarea").value.trim();
            let otHours = row.querySelector("select").value;
            console.log("hour", Number(otHours) === 0)
            if (Number(otHours) === 0) {
                swal('Vui lòng chọn đầy đủ thông tin!');
                isError = true;
            }
            else {
                dataArr.push({
                    employeeID: Number(employeeID),
                    otHours: Number(otHours),
                    notes: notes,
                    attendanceDate: attendanceDateElement.value
                });
            }

        }

    })
    if (isError || dataArr.length === 0) {
        return;
    }
    if (!isError || dataArr.length > 0) {
        showConfirmationAlert(dataArr)
    }

}



//main 
document.addEventListener("DOMContentLoaded", async () => {
    let today = new Date().toISOString().split('T')[0];

    const start = () => {
        loadLines(workShopSelectElement.value, position, teamLeaderId);
        attendanceDateElement.value = today;
    }
    start();

    // Lắng nghe sự kiện thay đổi trên dropdown và gọi hàm loadLines tương ứng
    workShopSelectElement.addEventListener("change", () => {
        const selectedWorkShop = workShopSelectElement.value;
        loadLines(selectedWorkShop, position, teamLeaderId)
    })

    // Lắng nghe sự kiện thay đổi trên attendanceDateElement và gọi hàm lấy dữ liệu công nhân
    attendanceDateElement.addEventListener("change", function () {
        const activeLine = document.querySelector("#lineSelection .active");
        if (activeLine) {
            console.log("fetch employee")
            fetchEmployeesByLine(activeLine.textContent.trim(), position, teamLeaderId, attendanceDateElement.value)

        }
    });
    // gán sự kiện cho nút xác nhận đăng ký
    document.querySelector("#saveBtn").addEventListener("click", () => {
        handleSave();

    })

})