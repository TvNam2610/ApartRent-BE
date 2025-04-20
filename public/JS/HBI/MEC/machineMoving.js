
$(document).ready(function () {


    let mechanic_id =   document.getElementById("mechanicID")
    let machine_tag  = document.getElementById("machineTag")
    let locationCode = document.getElementById("locationCode")

    $('#modelId').modal('show');
    $( "#modelId" ).on('shown.bs.modal', function(){
        mechanic_id.focus();
        //locationCode.disabled = true;

    });
     // Hàm để lưu dữ liệu bảng vào localStorage
    function saveTableData() {
        let tableBody = document.getElementById("machine_info_body");
        let rows = tableBody.querySelectorAll('tr');
        let machines = [];

        rows.forEach(row => {
            let cells = row.querySelectorAll('td');
            let machine = {
                type: cells[0].innerText,
                serial: cells[1].innerText,
                brand: cells[2].innerText,
                model: cells[3].innerText,
                status: cells[4].innerText,
                tag: cells[5].innerText,
                location: cells[6].innerText
            };
            machines.push(machine);
        });

        localStorage.setItem('machines', JSON.stringify(machines));
    } 


    // Hàm để tải dữ liệu từ localStorage và hiển thị lại bảng
    function loadTableData() {
        let machines = JSON.parse(localStorage.getItem('machines')) || [];
        let tableBody = document.getElementById("machine_info_body");
         // Xóa tất cả các hàng hiện có trước khi thêm dữ liệu mới
    //tableBody.innerHTML = '';
        machines.forEach(machine => {
            let newRow = document.createElement("tr");

            newRow.innerHTML = `
                <td>${machine.type}</td>
                <td>${machine.serial}</td>
                <td>${machine.brand}</td>
                <td>${machine.model}</td>
                <td>${machine.status}</td>                
                <td>${machine.tag}</td>
                <td>${machine.location}</td>
                <td><button class="btn btn-danger btn-sm delete-btn" data-tag="${machine.serial}">Xóa</button></td>
            `;

            tableBody.appendChild(newRow);
        });
        // Gán lại sự kiện cho các nút xóa
        document.querySelectorAll('.delete-btn').forEach(button => {
            button.addEventListener('click', function() {
                this.closest('tr').remove(); // Xóa dòng khỏi bảng
                saveTableData(); // Cập nhật localStorage sau khi xóa
            });
        });
    }
    // Hàm để xóa tất cả các dữ liệu trong bảng
    function clearTable() {
        let tableBody = document.getElementById("machine_info_body");
        tableBody.innerHTML = '';
        localStorage.removeItem('machines'); // Xóa dữ liệu trong localStorage
    }
    // Kiểm tra xem máy đã tồn tại trong bảng chưa
    function isMachineAlreadyAdded(serial) {
        let tableBody = document.getElementById("machine_info_body");
        let rows = tableBody.querySelectorAll('tr');
        return Array.from(rows).some(row => {
            let cell = row.querySelector('td:nth-child(2)'); // Cột chứa serial
            return cell && cell.innerText === serial;
        });
    }
    // Hàm để làm sạch form và localStorage
    function clearForm() {
        console.log("Clearing form...");

        // Xóa dữ liệu trong localStorage
        let tableBody = document.getElementById("machine_info_body");
        tableBody.innerHTML = '';
        localStorage.removeItem('machines');

        // Làm sạch các trường trong form
        machine_tag.value = '';
        locationCode.value = '';

        // Cập nhật các trường khác nếu cần
        document.getElementById('building').value = '';
        document.getElementById('zone').value = '';
        document.getElementById('location').value = '';
        document.getElementById('remarks').value = '';

        // Đặt con trỏ vào trường mã máy để chuẩn bị cho lần quét tiếp theo
        machine_tag.focus();
    }

    



    mechanic_id.addEventListener("change", async function () {
        let data = await getMechanicById(mechanic_id.value)
 
        if (data && data.length > 0) {
            $('#modelId').modal('hide');
            $('#passwordModal').modal('show'); // Hiển thị modal nhập mật khẩu

            //machine_tag.focus();
            toastr.info("Vui lòng nhập mật khẩu để làm việc!")

            let mechanic_name = document.getElementById('mechanic_name')
            mechanic_name.innerHTML = data[0].fullname
            let mechanic_id = document.getElementById('mechanic_id')
            mechanic_id.innerHTML = data[0].id_mec

            // Lưu mật khẩu vào biến
            mechanicPassword = data[0].passmec;
            // Đặt focus vào ô nhập mật khẩu
            document.getElementById('passwordInput').focus();
        }
        else {
            toastr.warning("Bạn không được cấp quyền truy cập trang này .");
        }
    });
   
 

    // Xử lý sự kiện xác nhận mật khẩu
    document.getElementById("submitPasswordBtn").addEventListener("click", async function () {
        let password = document.getElementById('passwordInput').value;

        // Kiểm tra mật khẩu
        if (password === mechanicPassword) {
            $('#passwordModal').modal('hide'); // Ẩn modal nhập mật khẩu

            if (password === "123") {
                // Nếu mật khẩu là "123", mở modal đổi mật khẩu
                $('#changePasswordModal').modal('show');

                // Xử lý sự kiện đổi mật khẩu
                document.getElementById("changePasswordBtn").addEventListener("click", async function () {
                    let newPassword = document.getElementById('newPasswordInput').value; // Mật khẩu mới
                    let confirmPassword = document.getElementById('confirmPasswordInput').value; // Xác nhận mật khẩu

                    // Kiểm tra điều kiện mật khẩu
                    if (!newPassword || newPassword.trim() === "") {
                        toastr.warning("Mật khẩu mới không được để trống!");
                        return;
                    }

                    if (newPassword.length < 6) {
                        toastr.warning("Mật khẩu mới phải có ít nhất 6 ký tự!");
                        return;
                    }

                    if (newPassword === "123") {
                        toastr.warning("Mật khẩu mới không được là '123'!");
                        return;
                    }

                    if (newPassword !== confirmPassword) {
                       // alert("Mật khẩu xác nhận không khớp!");
                        toastr.warning("Mật khẩu xác nhận không khớp!");
                        return;
                    }

                    // Gọi API đổi mật khẩu
                    let result = await updateUserPassword(mechanic_id.value, newPassword);
                    if (result && result.rs) {
                        $('#changePasswordModal').modal('hide'); // Đóng modal đổi mật khẩu nếu thành công
                        machine_tag.focus(); // Đặt focus lại vào ô nhập mã máy
                    }
                });
            } else {
                machine_tag.focus(); // Đặt focus vào ô nhập mã máy
                toastr.info("Vui lòng quét mã vạch trên máy trước!");
            }
        } else {
            toastr.error("Mật khẩu không đúng. Vui lòng thử lại.");
        }
    });



    // Xử lý sự kiện thay đổi mã máy
    machine_tag.addEventListener("change", async function() {
        let data = await getMachineByTag(machine_tag.value);

        if (data && data.length > 0) {
            if (isMachineAlreadyAdded(data[0].serial)) {
                toastr.warning("Máy này đã được thêm rồi. Không thể thêm lại.");
                machine_tag.value = '';
                machine_tag.focus();
                return;
            }
            locationCode.focus();
            //toastr.info("Quét mã vạch.");
            toastr.success("Quét máy thành công.");

            let tableBody = document.getElementById("machine_info_body");
            let newRow = document.createElement("tr");

            newRow.innerHTML = `
                <td>${data[0].type}</td>
                <td>${data[0].serial}</td>
                <td>${data[0].brand}</td>
                <td>${data[0].model}</td>
                <td>${data[0].status}</td>
                <td>${data[0].tag}</td>
                <td>${data[0].location}</td>
                <td><button class="btn btn-danger btn-sm delete-btn" data-tag="${data[0].serial}">Xóa</button></td>
            `;

            tableBody.insertBefore(newRow, tableBody.firstChild);
            // Thêm sự kiện xóa cho nút
            newRow.querySelector('.delete-btn').addEventListener('click', function() {
                this.closest('tr').remove(); // Xóa dòng khỏi bảng
                saveTableData(); // Cập nhật localStorage sau khi xóa
            });  
            // Lưu dữ liệu vào localStorage
            saveTableData();

            // Làm sạch ô nhập mã máy để chuẩn bị cho lần quét tiếp theo
            machine_tag.value = '';
            machine_tag.focus();
        } else {
            // Nếu không tìm thấy máy, kiểm tra xem có phải là mã locationCode không
            let locationData = await getLocationByCode(machine_tag.value);
            if (locationData && locationData.length > 0) {
                // Nếu đúng là mã locationCode, chuyển giá trị vào trường locationCode
                locationCode.value = machine_tag.value;
                

                toastr.info("Đã phát hiện mã địa điểm, tự động chuyển sang trường mã vị trí.");
                machine_tag.value = '';
                // locationCode.focus(); // Chuyển focus sang trường nhập mã vị trí
                // Tự động kích hoạt sự kiện `change` cho locationCode
                locationCode.dispatchEvent(new Event('change'));               
                
            } else {
                toastr.warning("Không tìm thấy máy hoặc địa điểm phù hợp.");
                machine_tag.value = '';
                machine_tag.focus();
            }
        
        }
    });
    
    
    locationCode.addEventListener("change", async function() {
    let data = await getLocationByCode(locationCode.value);

    if (data && data.length > 0) {
        let machine_tags = JSON.parse(localStorage.getItem('machines'));
        let machineFound = false;

        // Kiểm tra xem vị trí có trùng với bất kỳ máy nào trong danh sách không
        for (let machine of machine_tags) {
            if (machine.location === locationCode.value) {
                machineFound = true;
                toastr.warning(`Vị trí này trùng với máy có tag: ${machine.tag}. Máy sẽ bị xóa.`);             
             
                
                // Xóa máy khỏi danh sách
                machine_tags = machine_tags.filter(m => m.location !== locationCode.value);
                
                // Cập nhật lại localStorage với danh sách máy đã xóa
                localStorage.setItem('machines', JSON.stringify(machine_tags));
                
                // Cập nhật bảng hiển thị máy
                let tableBody = document.getElementById("machine_info_body");
                let rows = tableBody.querySelectorAll('tr');
                rows.forEach(row => {
                    let tagCell = row.querySelector('td:nth-child(6)');
                    if (tagCell && tagCell.textContent === machine.tag) {
                        row.remove(); // Xóa dòng khỏi bảng
                    }
                });

                break; // Thoát khỏi vòng lặp nếu đã tìm thấy và xóa
            }
        }
       
      
        // Luôn thực hiện các hành động bên dưới mà không cần kiểm tra machineFound
            let result = await updateMachineLocationByBarCode(machine_tags.map(m => m.tag), locationCode.value, mechanic_id.value);
            toastr.success(result.msg);
            clearForm();

            document.getElementById('building').value = data[0].building;
            document.getElementById('zone').value = data[0].zone;
            document.getElementById('location').value = data[0].location;
            document.getElementById('remarks').value = data[0].remarks;
            
            machine_tag.focus();
    } else {
        locationCode.value = '';
        locationCode.focus();
        toastr.warning("Không tìm thấy địa điểm phù hợp 2.");
    }
});

    // Thêm sự kiện cho nút Xóa tất cả
    document.getElementById("clearAllBtn").addEventListener("click", function() {
        clearTable();
        toastr.success("Đã xóa tất cả máy.");
    })
    // Tải dữ liệu từ localStorage khi trang được tải
    loadTableData();
    async function getMechanicById(mechanic_id) {

        let url = 'mechanic/get_by_id';
        let datasend = {
            mechanic_id: mechanic_id
        };
    
       let response = await fetch(url, {
            method: 'POST',
            body: JSON.stringify(datasend),
            headers: {
                'Content-Type': 'application/json'
            },
        })
       
        let responseData = await response.json();
        response = responseData.data;
        return response;
   
    }

    async function getMachineByTag(tag) {

        let url = 'machine/get_by_tag';
        let datasend = {
            tag: tag
        };
    
       let response = await fetch(url, {
            method: 'POST',
            body: JSON.stringify(datasend),
            headers: {
                'Content-Type': 'application/json'
            },
        })
       
        let responseData = await response.json();
        response = responseData.data;
        return response;
   
    }

    async function getLocationByCode(code) {

        let url = 'location/get_by_code';
        let datasend = {
            code: code
        };
    
       let response = await fetch(url, {
            method: 'POST',
            body: JSON.stringify(datasend),
            headers: {
                'Content-Type': 'application/json'
            },
        })
       
        let responseData = await response.json();
        response = responseData.data;
        return response;
   
    }

    async function updateMachineLocationByBarCode(tags,code,mechanic_id) {
        let url = 'machine/update_location';
        let datasend = {
            machine_tags: tags,
            location_code: code,
            mechanic_id: mechanic_id
        };

        let response = await fetch(url, {
            method: 'POST',
            body: JSON.stringify(datasend),
            headers: {
                'Content-Type': 'application/json'
            },
        })
        let responseData = await response.json();
        return responseData;
    }

    async function updateUserPassword(mechanicId, newPassword) {
        const apiUrl = "machine/updatePassword";
        let datasend = {
            mechanicId: mechanicId,
            newPassword: newPassword
        };

        try {
            let response = await fetch(apiUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(datasend)
            });
            let data = await response.json();
            toastr.success(`Đổi mật khẩu thành công`);        
           

            return data;
        } catch (error) {
            console.error("Error:", error);
            alert("Có lỗi xảy ra khi gọi API.");
        }
    }

});