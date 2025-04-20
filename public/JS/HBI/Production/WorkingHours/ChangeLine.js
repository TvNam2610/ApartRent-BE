const workShopSelectElement = document.querySelector("#workShopSelection");
const attendanceDateElement =  document.querySelector("#attendanceDate");
const saveButton = document.getElementById("saveBtn");
const teamLeaderId = JSON.parse(localStorage.getItem("username"));
const user = JSON.parse(localStorage.getItem("user"));
const position = user.position;
let today = new Date().toISOString().split('T')[0];
attendanceDateElement.value = today;

const viewEmployeeHistoryButton = document.getElementById("viewEmployeeHistoryBtn")
//Hàm gọi API lấy dữ liệu lịch sử nhân viên theo mã công nhân và trạng thái

const fetchEmployeeHistoryByEmployeeIDandStatus = async (employeeID, status) => {
    try {
        const response = await fetch(`get-employee-history-by-employeeid-status`,{
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({employeeID, status}),
        });
        const data = await response.json();
        return data.data;
    } catch (error) {
        console.error("Lỗi khi lấy lịch sử nhân viên:", error);
        return [];
    }
}
const insertEmployeeHistory = async (payload) => {
    try{
        const response = await fetch(`insert-employee-history-change`, {
            method: 'POST',
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
    }catch(err){
        console.log(err)
    }
}
const insertMultiEmployeeHisory = async (dataArr) => {
    try{
        const inserPromises = dataArr.map(data => insertEmployeeHistory(data));
        await Promise.all(inserPromises);
         const activeLine = document.querySelector("#lineSelection .active");
        iziToast.success({
            title: 'Thông báo!',
            message: 'Cập nhập thành công!',
            position: 'topRight'
        });
        fetchEmployeesByLine(activeLine.textContent.trim(),position,teamLeaderId,attendanceDateElement.value);
        document.querySelectorAll("#workerTableBody tr").forEach(row => {
            let checkbox = row.querySelector("input[type='checkbox']");
            if(checkbox.checked){
                checkbox.checked = false
                row.querySelector("select").classList.add("d-none");
            }
        })
        
    }
    catch(err){
        iziToast.error({
            title: 'Thông báo!',
            message: 'Cập nhập không thành công!',
            position: 'topRight'
        });
    }
   
};

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
            console.log("payload",payload)
            insertMultiEmployeeHisory(payload)
             
        } else {
            swal('Cập nhật OT đã bị hủy!');
        }
    });
}

//Hàm xử lý dữ liệu trước khi lưu
const handleSave = (lines) => {
    let dataArr = [];
    document.querySelectorAll("#workerTableBody tr").forEach((row) => {
        const radioElement = row.querySelector(`input[type='checkbox']`);
        if (radioElement.checked) {
            const selectLineElement = row.querySelector(`select`);
        if(!selectLineElement.disabled){
            const selectedLine = selectLineElement.value;
            const employeeID = row.children[2].textContent.trim();
            const lineName = row.children[5].children[0].textContent.trim()
             const line = lines.find((line) => line.Line === lineName);
            const data = {
                employeeID: employeeID,
                oldLine:Number(line.id),
                newLine: Number(selectedLine),
                changedBy:teamLeaderId

            }
            dataArr.push(data);
        }
          
          
        }
    });
    if(dataArr.length > 0){
        console.log("dataArr",dataArr)
        showConfirmationAlert(dataArr);
    }

}

// Hàm xử lý sự kiện thay đổi trạng thái chọn checkbox
const handleChangeRadio = async (event,ID,employeeID) =>{
    const selectLinceElement = document.getElementById(`select-line-${ID}`);
    const lineSpan = document.getElementById(`line-name-${ID}`)
    const employeeHistory = await fetchEmployeeHistoryByEmployeeIDandStatus(employeeID,"Pending");
    if(event.target.checked){ 
        if(employeeHistory.length > 0){
            swal('Công nhân này đang có 1 yêu cầu chuyển line chờ duyệt!');
            selectLinceElement.disabled = true;
        }
        selectLinceElement.classList.remove("d-none");
        lineSpan.classList.add("d-none");
    }
    else{
        selectLinceElement.classList.add("d-none");
        lineSpan.classList.remove("d-none");
    }
   
    
}


// Hàm gọi API danh sách nhân viên theo tổ trưởng và line
const fetchEmployeesByLine = async(selectedLine,position,teamLeaderId,attendanceDate) => {
    try {
        const response = await fetch(`employees-by-team-leader?position=${position}&teamLeaderId=${teamLeaderId}&line=${selectedLine}&attendanceDate=${attendanceDate}`);
        const data = await response.json();
         renderTable(data,lines)
        return data;
    } catch (error) {
        console.error("Lỗi khi lấy danh sách Team Leaders:", error);
        return [];
    }
}


// Hàm tải danh sách lines
const loadLines = async (workShop,position,teamLeaderId) => {
    try{
        const response = await fetch(`lines-with-by-team-leaders?position=${position}&teamLeaderId=${teamLeaderId}&workShop=${workShop}`);
        const data = await response.json();
          // Tự động gọi API cho line đầu tiên (nếu có)
        const teamLeaderInfo = document.getElementById("teamLeaderInfo");
        if (data.length > 0 && data[0].TeamLeaderName) {
            teamLeaderInfo.textContent = `Tổ trưởng: ${data[0].TeamLeaderName} - ID: ${data[0].TeamLeaderID}`;
        } else {
            teamLeaderInfo.textContent = "";
        }
        return data

       
    }catch(err){
        console.log(err)
    }   
   
}

//Render button line
const renderButtonLine = async (lines) => {
    const lineContainer = document.getElementById("lineSelection");
    lineContainer.innerHTML = ""; // Xóa nội dung cũ nếu có
    // Hiển thị thông tin tổ trưởng nếu có dữ liệu
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
            fetchEmployeesByLine(line.Line,position,teamLeaderId,attendanceDateElement.value);
        });

        lineContainer.appendChild(btn);
    });
}



//Render data table
function renderTable (employees,lines){
    const tableBody = document.getElementById("workerTableBody");
    tableBody.innerHTML = ""; // Xóa dữ liệu cũ
    employees.forEach((employee) => {
        let row = document.createElement("tr");
        row.innerHTML = `
            <td class="text-center">   
                <input type="checkbox" id="radio-worker-${employee.ID}" onchange="handleChangeRadio(event,${employee.ID},${employee.Employee_ID})">
            </td>
            <td class="text-center">${employee.ID}</td>
            <td class="text-center">${employee.Employee_ID}</td>
            <td class="text-center">${employee.Employee_name}</td>
            <td class="text-center">${employee.WC}</td>
             <td class="text-center">
                <span id="line-name-${employee.ID}">${employee.LineName}</span>
                 <select class="form-control d-none" id="select-line-${employee.ID}" name="line${employee.ID}" >
                    ${lines.map((line)=>{
                        return `<option value ="${line.id}" ${employee.LineName === line.Line ? "selected":''} >${line.Line}</option>`
                    }).join("")}
                 </select>
             </td>
        `;
        tableBody.appendChild(row);
        //Gán sự kiện thay đổi cho select line
        row.querySelector(`#select-line-${employee.ID}`).addEventListener("change", function (event) {
            const lineSpan = document.getElementById(`line-name-${employee.ID}`);
            const line = lines.find((line) => line.id === parseInt(event.target.value));

            /*
                Kiểm tra xem select hiện tại có giá trị khác với giá trị line hiện tại của công nhân không
                Nếu khác thì hiển thị nút lưu
                Ngược lại thì chạy else

            */
            if(lineSpan.textContent.trim() !== line.Line){
                saveButton.classList.remove("d-none");
                console.log("different line")
            }
            
            /*
                Trong else, Kiểm tra xem có radion đi nào đươc chọn không.
                Có thì tiếp tục kiểm tra xem line hiện tại của công nhân có khác với line mới chọn không
                Nếu khác thì hiển thị nút lưu
            */
            else{
                console.log("same line")
                document.querySelectorAll(`#workerTableBody tr input[type='checkbox']`).forEach((radio) => {
                    const workerID = row.children[1].textContent.trim();
                    if(radio.checked && radio.id !== `radio-worker-${workerID}`){
                        console.log("radio.id",radio.id)
                        const lineSpan = document.getElementById(`line-name-${workerID}`);
                        const selectLine = document.getElementById(`select-line-${workerID}`);
                        const line = lines.find((line) => line.id === parseInt(selectLine.value));
                        if(lineSpan.textContent.trim() !== line.Line)
                        {                
                            saveButton.classList.remove("d-none");
                        }
                        else
                        {                
                            saveButton.classList.add("d-none");
                        }

                    }
                })
            }
        })
    });

}
const renderEmployeeHistoryTableBody = (dataArr) => {
    const tableBody = document.getElementById("employeeHistoryTableBody")
    tableBody.innerHTML = ''
    const html =dataArr ?  dataArr.map((data) => {
        return `
            <tr>
                <td>
                    ${data.ID}
                </td>
                <td>
                    ${data.Employee_ID}
                </td>
                <td>
                    ${data.Employee_ID}
                </td>
                <td>
                    ${data.Old_Line}

                </td>
                <td>
                    ${data.New_Line}

                </td>
                <td>
                    ${new Date(data.Change_Date).toLocaleDateString()} ${new Date(data.Change_Date).toLocaleTimeString()}

                </td>
                <td >
                    <span class = "p-3 ${data.Status ==='Pending' ? 'badge badge-secondary' :data.Status ==='Reject' ? ' badge badge-danger' : " badge badge-success"}">${data.Status}</span> 
                </td>
            </tr>
        `
    }):'<tr class="text-center">Không có dữ liệu!</tr>'
    tableBody.innerHTML = typeof html ==='string' ? html: html.join("");
}

const getPrEmployeeHistoryByTeamLeaderIDAndStatus = async (teamLeaderID,status) => {
    try{
        const res = await fetch(`get-pr-employee-history-by-teamleaderId-and-status?teamLeaderID=${teamLeaderID}&status=${status}`)
        const data = await res.json();
        renderEmployeeHistoryTableBody(data.data)
    
    }catch(err){
        console.log("err",err)
    }
}

//main
document.addEventListener("DOMContentLoaded",()=>{
    const start = async () =>{
        lines = await loadLines(workShopSelectElement.value,position,teamLeaderId);
        renderButtonLine(lines);
        fetchEmployeesByLine(lines[0].Line,position,teamLeaderId,attendanceDateElement.value);
        // Lắng nghe sự kiện click vào nút xác nhận lưu
        saveButton.addEventListener("click", () => {
            console.log("Click save button");
            handleSave(lines);
        })
    }
    start()
    // Lắng nghe sự kiện thay đổi trên dropdown và gọi hàm loadLines tương ứng
    workShopSelectElement.addEventListener("change",()=>{
        const selectedWorkShop = workShopSelectElement.value;
        loadLines(selectedWorkShop,position,teamLeaderId)
    })

     // Lắng nghe sự kiện thay đổi trên attendanceDateElement và gọi hàm lấy dữ liệu công nhân
     attendanceDateElement.addEventListener("change", function () {
        const activeLine = document.querySelector("#lineSelection .active");
        if (activeLine) {
            fetchEmployeesByLine(activeLine.textContent.trim(),position,teamLeaderId,attendanceDateElement.value)

        }
    });

    //Lắng nghe sự kiện click vào nút xem lịch sử
    viewEmployeeHistoryButton.addEventListener("click",()=>{
        $("#viewEmployeeHistoryModal").modal('show');
        getPrEmployeeHistoryByTeamLeaderIDAndStatus(teamLeaderId,'PeNding')

    })
    //Lắng nghe sự kiện change status
    document.getElementById("selectStatus").addEventListener("change",(event)=>{
        console.log('value',event.target.value)
        getPrEmployeeHistoryByTeamLeaderIDAndStatus(teamLeaderId,event.target.value)
    })

    //Lắng nghe sự kiện close modal
    document.getElementById("closeButton").addEventListener("click",()=>{
        document.getElementById("selectStatus").value = "Pending";
        console.log(`document.getElementById("selectStatus")`,document.getElementById("selectStatus").children)
    })
   
    
})