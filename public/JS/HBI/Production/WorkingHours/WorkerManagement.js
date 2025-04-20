
const teamLeaderID = JSON.parse(localStorage.getItem('username'));
const user = JSON.parse(localStorage.getItem('user'));  
const position = user.position;
let currentPage = 1;  // Mặc định trang 1
let limit =  10;  // Mặc định limit là 10 nếu chưa chọn
let totalPages = 1;  // Mặc định tổng số trang

const tableBody = document.getElementById('data-table').getElementsByTagName('tbody')[0];
//Hàm hiển thị modal lịch sử line của công nhân

const showViewLineHistoryModal = async (teamLeaderID)=>{
    try{
        const res = await fetch(`get-employee-line-history-by-addedby/${teamLeaderID}`)
        const employeeLineHistories = await res.json();
        $("#viewLineHistoryModal").modal('show');
        renderEmployeeLineHistoryTable(employeeLineHistories)
    }catch(err){
        console.log("err",err)
    }
}
const renderEmployeeLineHistoryTable = (employeeLineHistories) =>{
    const tableBody = document.getElementById("employeeLineHistoryTableBody");
    console.log("tableBody",tableBody)
    tableBody.innerHTML =''
    const html = employeeLineHistories.map((history)=>{
        const createdAt = new Date(history.created_at)
        return `
            <tr>
                <td>${history.ID}</td>
                <td>${history.Employee_ID}</td>
                <td>${history.Employee_name}</td>
                <td>${history.LineName}</td>
                <td>${createdAt.toLocaleDateString()} ${createdAt.toLocaleTimeString()}</td>

            </tr>
        `
    })
    tableBody.innerHTML = html.join("")
}

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
            handleUpdateMultiWorkerLine(payload);
           handleInsertLineHistory(payload)
        } else {
            swal('Thêm công nhân vào line bị hủy!');
        }
    });
}

// Kiểm tra khi người dùng cuộn tới đáy
function checkScrollPosition() {
  const container = document.querySelector('.table-wrapper');
  if (container.scrollTop + container.clientHeight >= container.scrollHeight) {
        console.log("currentPage",currentPage+1)
        currentPage = currentPage+1;
        getWorkersWithoutLine()
    //   loadMoreData();  // Gọi API khi cuộn tới cuối
  }
}
document.querySelector('.table-wrapper').addEventListener('scroll', checkScrollPosition);
// hàm sử lý dữ liệu truyền vào API insert lịch sử line công nhân

const handleInsertLineHistory = (dataArr)=>{
    const newEmployeeLineHistories = dataArr.map((data)=>{
        return {employeeID:data.employeeID,addedLine:data.line,addedBy:teamLeaderID}
    })
    insertMultiPrEmployeeHistory(newEmployeeLineHistories)
}

//hàm gọi API thêm lịch sử line của công nhân
const insertPrEmployeeLineHistory = async (data) => {
    try{
        const response = await fetch(`insert-employee-line-history`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });
        if(response.status !== 200){
            throw new Error('Failed to update employee');
        }
        console.log('Employee inserted:', response);
    }
    catch(error){
        console.error("error",error);
    }
}

const insertMultiPrEmployeeHistory = async (dataArr) => {
    try{
        const insertPromises = dataArr.map(data => insertPrEmployeeLineHistory(data));
        await Promise.all(insertPromises);

    }catch(error){
        console.error("error",error);
      
    }
}

// hàm gọi API lấy dữ liệu công nhân chưa thuộc line nào
const getWorkersWithoutLine = async () => {
    const response = await fetch(`get-employees-without-line?department=${'PRO'}&ml=nan&page=${currentPage}&limit=${limit}`);
    const workers = await response.json();
    let workersWithoutLine = JSON.parse(sessionStorage.getItem("workersWithoutLine"))
    if(workersWithoutLine.length > 0){
        workersWithoutLine = [...workersWithoutLine,...workers.data.data]
        sessionStorage.setItem("workersWithoutLine",JSON.stringify(workersWithoutLine));
        renderWorkersWithoutLine(workersWithoutLine)
    }
    else{
        sessionStorage.setItem("workersWithoutLine",JSON.stringify(workers.data.data));
        renderWorkersWithoutLine(workers.data.data)

    }
    console.log("workers",workers)
    return workers.data.data;
}

const getLinesByTeamLeaderID = async (teamLeaderID ,position) => {
    const response = await fetch(`get-lines-by-teamleader`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({teamLeaderID,position }),
    });
    const lines = await response.json();
    return lines;
}

// hàm render dữ liệu công nhân ra giao diện
const renderSelectedWorkers = (workers,lines) => {
    const tableBody = document.getElementById('selectedWorkers');
    console.log("workers",workers)
    tableBody.innerHTML = '';
    workers.forEach((worker, index) => {
        const row = `
            <tr>
                <td style="vertical-align: middle;">${worker.Employee_ID}</td>
                <td style="vertical-align: middle;">${worker.Employee_name}</td>
                <td>
                    <select id='selectLine${worker.Employee_ID}' ${worker.Line ? "disabled":""} class="form-control" onchange="handleChangeLine(event,'${worker.Employee_ID}')">
                        <option value="0">Chọn line</option>
                        ${lines ? lines.map(line => {
                            return `<option value="${line.ID}" ${line.ID === (worker.Line) ? 'selected' : ''} >${line.Line}</option>`
                        }).join(''):""}
                    </select>
                </td>
                <td>
                    <button class="btn btn-danger" onclick = "handleUnSelectedEmployee('${worker.Employee_ID}')">Xóa</button>

                </td>
        `
            tableBody.innerHTML += row;
        })
}

//Hàm xử lý sự kiện khi người dùng click vào nút thêm vào line
//Khi người dùng nhấn chuyển line thì sẽ chuyển đối tượng đó vào mảng đã có line cho tổ trưởng chọn line đồng thời xóa phần tử đó khỏi bảng chưa có line
const handleUpdateLineEmployee = async (employeeID) => {

    let employeeWithoutLine = JSON.parse(sessionStorage.getItem("workersWithoutLine"));
    let lines = JSON.parse(sessionStorage.getItem("lines"));    
    let selectedEmployees = JSON.parse(sessionStorage.getItem("selectedWorkers"))   
    if(selectedEmployees.length > 0 && document.getElementById("saveBtn").style.pointerEvents==="none"){
        selectedEmployees = []
        document.getElementById("saveBtn").style.pointerEvents==="auto"
    }
    //lấy ra thông tin của công nhân vừa được nhán thêm line 
    const employee = employeeWithoutLine.find(worker => worker.Employee_ID === employeeID);

    // xóa công nhân vừa nhấn thêm line khỏi mảng employeeWithoutLine 
    employeeWithoutLine = employeeWithoutLine.filter(worker => worker.Employee_ID !== employeeID);

     // thêm công nhân vừa được nhấn thêm vào mảng employees và selectedEmployees
    selectedEmployees = [employee,...selectedEmployees];
    console.log("em",selectedEmployees)

    // cập nhập lại dữ liệu ở session
    sessionStorage.setItem("workersWithoutLine",JSON.stringify(employeeWithoutLine));
    sessionStorage.setItem("selectedWorkers",JSON.stringify(selectedEmployees));

    //Hiển thị lại bảng dữ liệu
    renderSelectedWorkers(selectedEmployees,lines);
    renderWorkersWithoutLine(employeeWithoutLine);

}
// hàm render dữ liệu công nhân chưa thuộc line nào ra giao diện
const renderWorkersWithoutLine = (workers) => {
    const tableBody = document.getElementById('workersWithoutLineBody');
    tableBody.innerHTML = '';
    workers.forEach((worker, index) => {
        const row = `
            <tr>
                <td>${worker.Employee_ID}</td>
                <td>${worker.Employee_name}</td>
                <td>
                    <button class="btn btn-primary" onclick= "handleUpdateLineEmployee('${worker.Employee_ID}')">Thêm vào line</button>

                </td>
        `
            tableBody.innerHTML += row;
        })
}

//Hàm xử lý sự kiện khi người dùng chọn line cho công nhân
const handleChangeLine = async (event,employeeID) => {
    const lineID = event.target.value;
    let selectedWorkers = JSON.parse(sessionStorage.getItem("selectedWorkers"));
    selectedWorkers = selectedWorkers.map(worker => worker.Employee_ID === employeeID ? {...worker,Line:Number(lineID)}:worker);
    sessionStorage.setItem("selectedWorkers",JSON.stringify(selectedWorkers));
}


//Handle delete employee's line 
function handleUnSelectedEmployee(employeeID){
     
        
            let employeeWithoutLine = JSON.parse(sessionStorage.getItem("workersWithoutLine"));
            let lines = JSON.parse(sessionStorage.getItem("lines"));    
            let selectedEmployees = JSON.parse(sessionStorage.getItem("selectedWorkers"))
    
            //lấy ra công nhân vừa bị nhấn bỏ chọn trong mảng selected
            const employee = selectedEmployees.find((selectedEmployee)=> selectedEmployee.Employee_ID === employeeID);
    
            //lọc các công nhân khác mã công nhân vừa bị bỏ chọn
            selectedEmployees = selectedEmployees.filter(worker => worker.Employee_ID !== employeeID);
            
            // thêm công nhân vvừa bị bỏ chọn vào lại mảng employeeWithoutLine
            employeeWithoutLine = [{...employee,Line:null },...employeeWithoutLine];
    
            // cập nhập lại dữ liệu ở session
            sessionStorage.setItem("workersWithoutLine",JSON.stringify(employeeWithoutLine));
            sessionStorage.setItem("selectedWorkers",JSON.stringify(selectedEmployees));
        
            //Hiển thị lại bảng dữ liệu
            renderSelectedWorkers(selectedEmployees,lines);
            renderWorkersWithoutLine(employeeWithoutLine);
}


//Hàm xử lý sự kiện khi người dùng nhập mã công nhân vào input và lọc dữ liệu công nhân theo thông tin người dùng nhập
async function handleChangeFilterInput (event,position){
    console.log("event",event.target.value);
    console.log("position",position);

    if(position ==='left')
    {
        const workers = JSON.parse(sessionStorage.getItem("workersWithoutLine"))
        const filtered = event.target.value !== ''? workers.filter(worker => worker.Employee_ID.includes(event.target.value) ||worker.Employee_name.includes(event.target.value)):workers;
        renderWorkersWithoutLine(filtered);

    }
    else{
        const selectedWorkers = JSON.parse(sessionStorage.getItem("selectedWorkers"));
        const lines = JSON.parse(sessionStorage.getItem("lines"));
        if(selectedWorkers.length > 0)
        {
            const filtered = event.target.value !== ''? selectedWorkers.filter(worker => worker.Employee_ID.includes(event.target.value) ||worker.Employee_name.includes(event.target.value)):selectedWorkers;
            renderSelectedWorkers(filtered,lines);

        }
    }
}


// hàm gọi API update line cho công nhân vào bảng employee
const handleUpdateWorkerLine = async (payload) => {
    try{
        const response = await fetch(`update-line-for-employee`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });
        if(response.status !== 200){
            throw new Error('Failed to update employee');
        }
        console.log('Employee updated:', response);

    }
    catch(error){
        console.error("error",error);
    }
}

// hàm xử lý update nhiều công nhân cùng lúc
const handleUpdateMultiWorkerLine = async (dataArr) => {
    try{
        const updatePromises = dataArr.map(data => handleUpdateWorkerLine(data));
        await Promise.all(updatePromises);
        iziToast.success({
            title: 'Thông báo!',
            message: 'Cập nhập thành công!',
            position: 'topRight'
        });

        //clear selected workers
        sessionStorage.setItem("selectedWorkers",JSON.stringify([]));
        renderSelectedWorkers([],[])
    }catch(error){
        console.error("error",error);
        iziToast.error({
            title: 'Thông báo!',
            message: 'Cập nhập không thành công!',
            position: 'topRight'
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const saveButton = document.getElementById('saveBtn');
    const start = async () => {
        getWorkersWithoutLine();
        const lines = await getLinesByTeamLeaderID(teamLeaderID,position);
        sessionStorage.setItem("lines",JSON.stringify(lines));
        sessionStorage.setItem("selectedWorkers",JSON.stringify([]));
    }
    start();
    saveButton.addEventListener('click', async () => {
        const selectedWorkers = JSON.parse(sessionStorage.getItem("selectedWorkers"));
        let dataArr = [];
        let isError = false;
        selectedWorkers.forEach(worker => {
            if(!worker.Line){
                alert("Vui lòng chọn line !")
                isError = true;
                return;
            }
            dataArr.push({
                employeeID: worker.Employee_ID,
                line: worker.Line
            })
        })
        if(!isError)
        {
            showConfirmationAlert(dataArr);
        }

    })

    // gắn sự kiện cho nút lịch sử thêm
    document.getElementById("viewHistoryBtn").addEventListener("click",()=>{
        console.log("view history")
        showViewLineHistoryModal(teamLeaderID)
    })
})