const workShopSelectElement = document.getElementById("workShopSelection");
const attendanceDateElement = document.getElementById("attendanceDate");
const saveButton = document.getElementById("saveBtn")
const user = JSON.parse(localStorage.getItem("user"));
const teamLeaderId = JSON.parse(localStorage.getItem("username"));
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
            updateAllTGHours(payload)
            
       } else {
           swal('Cập nhật OT đã bị hủy!');
       }
   });
}

//Hàm cập nhật thông tin tách giờ
const updateTGHours = async(payload) =>{
    try {
        const response = await fetch(`update-TG-hours`, {
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
}

//Hàm xử lý cập nhật nhiều bản ghi
const updateAllTGHours = async (payload) => {
    try{
        const updatePromises = payload.map(item => updateTGHours(item));
        await Promise.all(updatePromises);
        // alert("Đăng ký nghỉ thành công!");
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
                row.querySelector("input[type='text']").classList.add("d-none");
                row.querySelector("textarea").classList.add("d-none");
            }
        })
    }
    catch(err){
        console.error("Lỗi khi gửi dữ liệu đăng ký nghỉ:", err);
        iziToast.error({
            title: 'Thông báo!',
            message: 'Cập nhập không thành công!',
            position: 'topRight'
          });
    }
   
};



const renderListLines = (lines)=>{
    const lineContainer = document.getElementById("lineSelection");
    lineContainer.innerHTML = ""; // Xóa nội dung cũ nếu có
    // Hiển thị thông tin tổ trưởng nếu có dữ liệu
    const teamLeaderInfo = document.getElementById("teamLeaderInfo");
    if (lines.length > 0 && lines[0].TeamLeaderName) {
        teamLeaderInfo.textContent = `Tổ trưởng: ${lines[0].TeamLeaderName} - ID: ${lines[0].TeamLeaderID}`;
    } else {
        teamLeaderInfo.textContent = "";
    }

    lines.forEach((line, index) => {
        let btn = document.createElement("button");
        btn.type = "button";
        btn.className = `btn btn-outline-primary rounded-pill m-2 shadow-sm ${index === 0 ? "active" : ""}`;
        btn.textContent = line.Line;
        btn.dataset.line = line.Line; // Lưu Line để gọi API
        btn.addEventListener("click",async function () {
            document.querySelectorAll("#lineSelection button").forEach(btn => btn.classList.remove("active"));
            this.classList.add("active");

            // Gọi API lấy danh sách nhân viên khi chọn line
            fetchEmployeesByLine(line.Line,position,teamLeaderId,attendanceDateElement.value);
           
        });
        lineContainer.appendChild(btn);
    });
}

// Hàm tải danh sách lines
const loadLines = async (workShop,position,teamLeaderId) => {
    try{
        const res = await fetch(`lines-with-by-team-leaders?position=${position}&teamLeaderId=${teamLeaderId}&workShop=${workShop}`)
        const data = await res.json();
        if(data.length > 0)
        {
            renderListLines(data)
            fetchEmployeesByLine(data[0].Line, position, teamLeaderId, attendanceDateElement.value)
            fetchAllTG();
        }
        return data;
    }catch(error )
    {
         console.error("Lỗi khi tải danh sách Line:", error)
    }

}

//Hàm gọi API danh sách TG
const fetchAllTG = async () =>{
    try{
        const res = await fetch(`TGs`);
        const data = await res.json();
        sessionStorage.setItem("TGs",JSON.stringify(data.data.data))
        return data.data.data
    }catch(err){
        console.log("err",err)
        return []
    }
}

// Hàm gọi API danh sách nhân viên theo tổ trưởng và line
const fetchEmployeesByLine = async(selectedLine,position,teamLeaderId,attendanceDate) => {
    try {
        const response = await fetch(`employees-by-team-leader?position=${position}&teamLeaderId=${teamLeaderId}&line=${selectedLine}&attendanceDate=${attendanceDate}`);
        const data = await response.json();
        const TGs = JSON.parse(sessionStorage.getItem("TGs"))
        if(TGs)
        {
            renderDataTable(data,TGs)
        }
        else{
            const TGs = await fetchAllTG();
            renderDataTable(data,TGs)
        }
        return data;
    } catch (error) {
        console.error("Lỗi khi lấy danh sách Team Leaders:", error);
        return [];
    }
}

//Hàm xử lý sự kiện khi người dùng thay đổi checkbox
const handleOnChaneRadioButton = (event,employeeId)=>{
    const codeTGSelectElement = document.querySelector(`.code-tg-select-${employeeId}`);
    const hoursInputElement = document.querySelector(`#hours-input-${employeeId}`);
    const notesTGInputElement = document.querySelector(`#notes-tg-${employeeId}-input`);
    const notesTGSpan = document.querySelector(`#notes-tg-${employeeId}`)
    const tgHoursSpan = document.querySelector(`#code-tg-${employeeId}`)
    const codeTGSpan = document.querySelector(`#tg-hours-${employeeId}`)


    if(event.target.checked)
    {
        codeTGSelectElement.classList.remove("d-none")
        hoursInputElement.classList.remove("d-none")
        notesTGInputElement.classList.remove("d-none")
        notesTGSpan.classList.add("d-none")
        tgHoursSpan.classList.add("d-none")
        codeTGSpan.classList.add("d-none")
    }
    else{
        codeTGSelectElement.classList.add("d-none")
        hoursInputElement.classList.add("d-none")
        notesTGInputElement.classList.add("d-none")
        notesTGSpan.classList.remove("d-none")
        tgHoursSpan.classList.remove("d-none")
        codeTGSpan.classList.remove("d-none")
    }
}

//Hàm xử lý khi người dùng nhấn xác nhận đăng ký
const handleSave = (attendanceDate)=>{
    let dataArr = [];
    let isError = false;
    document.querySelectorAll("#workerTableBody tr").forEach(row => {
        let checkbox = row.querySelector("input[type='checkbox']");
        if(checkbox.checked){
            let employeeID = row.children[2].textContent.trim();
            let codeTG = row.querySelector("select").value;
            let hours = row.querySelector("input[type='text']").value.trim();
            let notes = row.querySelector("textarea").value.trim();
            console.log(employeeID,codeTG,hours,notes)
            
            if(Number(codeTG) === 0){
                isError = true;
                alert("Vui lòng chọn code TG");
                return;
            }
            if(!hours)
            {
                isError = true;
                alert("Vui lòng nhập thông tin");
                return;
            }
            const data = {
                employeeId:employeeID,
                attendanceDate:attendanceDate,
                tgHours:Number(hours),
                notesTg:notes,
                codeTG:codeTG

            }
            dataArr.push(data)
        }
       
    })
    if(isError || dataArr.length === 0)
    {
        return;
    }
    if(!isError || dataArr.length > 0){
        showConfirmationAlert(dataArr)
    }
}

// Hàm hiển thi dữ liệu lên giao diện
const renderDataTable= (employees,tgs)=>{
    const tableBody = document.querySelector("#workerTableBody");
    tableBody.innerHTML=""
    console.log("Tg",tgs)
    employees.forEach((employee)=>{
        let row = document.createElement("tr");
        row.innerHTML= `
                        <td class="text-center">   
                            <input type="checkbox" id="worker-${employee.ID}" onchange= "handleOnChaneRadioButton(event,${employee.ID})">
                        </div> </th>
                        <td class="text-center align-middle">${employee.ID}</th>
                        <td class="text-center align-middle">${employee.Employee_ID} </th>
                        <td class="text-center align-middle">${employee.Employee_name} </th>
                        <td class="text-center align-middle">
                            <span class="">${employee.LineName}</span>
                        </td>
                        <td class="text-center align-middle">
                            <span id="code-tg-${employee.ID}">
                                ${employee.CodeTG ? tgs.find((tg)=>tg.Code_Name === (employee.CodeTG) ).Name : "" }
                            </span>
                            <select class="form-control code-tg-select-${employee.ID} d-none">
                                <option value='0'>Chọn code TG</option>
                                ${tgs.map(tg => `<option value="${tg.Code_Name}"  ${tg.Code_Name === (employee.CodeTG) ? 'selected':''}>${tg.Name}</option>`).join('')}
                            </select>
                        </td>
                        <td class="text-center align-middle">
                            <span class="tg-hours" id="tg-hours-${employee.ID}">${employee.TG_Hours ? employee.TG_Hours:""}</span>
                            <input type="text" class="form-control d-none" id="hours-input-${employee.ID}" value="${employee.TG_Hours !== 0 ? employee.TG_Hours:"" }"/>
                        </td>
                        <td class="text-center align-middle p-3">
                            <span class="notes-tg" id="notes-tg-${employee.ID}">${employee.Notes_TG ? employee.Notes_TG:""}</span>
                            <textarea name="" id="notes-tg-${employee.ID}-input" class="form-control d-none">${employee.Notes_TG ?? ''}</textarea>
                        </td>
        `
        tableBody.appendChild(row);
    })
}

//main
document.addEventListener("DOMContentLoaded",()=>{

    const today = new Date().toISOString().split("T")[0];
    const start =  () =>{
        attendanceDateElement.value=today;
        loadLines(workShopSelectElement.value,position,teamLeaderId);
      
    }
    start();

    // Lắng nghe sự kiện thay đổi trên workShopElement và gọi hàm loadLines

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
    // Lắng nghe sự kiện on click nút xác nhận đăng ký
    saveButton.addEventListener("click",()=>{
        handleSave(attendanceDateElement.value);
    })
})