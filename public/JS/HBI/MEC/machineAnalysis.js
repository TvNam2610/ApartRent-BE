
// main.js
async function getcountemptylocation() {
    try {
        const url = 'machines/count-empty-location'; // URL của API
        const headers = {
            'Content-Type': 'application/json',
        };
        const response = await fetch(url, {
            method: 'GET', // Thay đổi thành 'GET' nếu bạn không cần gửi dữ liệu
            headers: headers,
        });

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const responseData = await response.json();
        const countlocation = document.getElementById('machine-count');
        countlocation.innerText = responseData.total_count;

    } catch (error) {
        console.error('Error fetching data:', error);
    }
}
// hàm tính 
async function getcountbuildinglocation() {
    try {
        const url = 'machines/count-building-location'; // URL của API
        const headers = {
            'Content-Type': 'application/json',
        };
        const response = await fetch(url, {
            method: 'GET', // Thay đổi thành 'GET' nếu bạn không cần gửi dữ liệu
            headers: headers,
        });

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const responseData = await response.json();
         // Lấy tổng số máy và tổng số máy đang hoạt động
        const totalActiveCount = responseData.total_active_percentage;

        // Cập nhật nội dung HTML       
        document.getElementById('total_count_label').textContent = `${totalActiveCount}%`;

        const progressBar = document.getElementById('progress_bar');
        progressBar.style.width = `${totalActiveCount}%`;

        const countlocation = document.getElementById('machine-count-factory');
        countlocation.innerText = responseData.total_count;

    } catch (error) {
        console.error('Error fetching data:', error);
    }
}
// hàm tính %
async function getMachinesWithEmptyLocation() {
    try {
        const url = 'machines/latest-location-info'; // URL của API
        const headers = {
            'Content-Type': 'application/json',
        };
        const response = await fetch(url, {
            method: 'GET',
            headers: headers,
        });

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const responseData = await response.json();
        const tbody = document.getElementById('machineTableBody');
        tbody.innerHTML = ''; // Xóa nội dung hiện tại của tbody
        
        responseData.forEach(machine => {
            // Xác định lớp CSS dựa trên giá trị của máy
            let statusClass;
            switch (machine.status) {
                case '1':
                    statusClass = 'tag-success'; // Đang hoạt động
                    break;
                case '2':
                    statusClass = 'tag-warning'; // Bị hỏng
                    break;
                case '0':
                    statusClass = 'tag-danger'; // Không xác định
                    break;
                default:
                    statusClass = 'tag-secondary'; // Mặc định nếu không khớp với các giá trị trên
            }
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${machine.id}</td>
                <td>${machine.tag}</td>
                <td>${machine.model}</td>
                <td>${new Date(machine.updated_at).toLocaleString()}</td>
                <td><span class="tag ${statusClass}">${getStatusText(machine.status)}</span></td>
                <td>${machine.updated_by}</td>
                <td><button class="btn btn-primary btn-sm" onclick="showDetails(${machine.tag})">Select</button></td>

            `;
            tbody.appendChild(tr);
        });
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}

// Hàm giúp trả về văn bản tương ứng với mã trạng thái
function getStatusText(status) {
    switch (status) {
        case '1':
            return 'Đang hoạt động';
        case '2':
            return 'Bị hỏng';
        case '0':
            return 'Đang sửa';
        default:
            return 'Không xác định';
    }
}
// Hàm gọi khi bấm vào nút SELECT
function showDetails(machineTag) {
    getMachineDetails(machineTag);
}
//hiển thị chi tiết
function displayMachineDetails(details) {

    const fields = [
        'machine_id', 'plant', 'khu_vuc', 'manufacturer', 'machine_name', 
        'machine_model', 'serial', 'tag', 'current_location', 'status', 
        'old_location', 'new_location', 'location_change_date', 'location_updated_by', 
        'building', 'zone', 'location_code', 'building_code', 'zone_code', 
        'machine_type', 'model_description', 'features'
    ];

    fields.forEach(field => {
        const element = document.getElementById(`modal-${field}`);
        if (element) {
            element.textContent = details[field] ?? 'N/A';
        }
    });

    const dateElement = document.getElementById('modal-location_change_date');
    if (dateElement && details.location_change_date) {
        dateElement.textContent = new Date(details.location_change_date).toLocaleString();
       
    }

    const modal = document.getElementById('machineDetailsModal');
    if (modal) {
        modal.style.display = 'block';
    } else {
        console.error('Modal element not found');
    }
}
// đóng modal
function closeModal() {
    const modal = document.getElementById('machineDetailsModal');
    modal.style.display = 'none';
}

// Hàm để lấy chi tiết máy theo Tag
async function getMachineDetails(machineTag) {
    try {
        const url = `machines/details/${machineTag}`; 

        const headers = {
            'Content-Type': 'application/json',
        };
        const response = await fetch(url, {
            method: 'GET',
            headers: headers,
        });

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

         const machineDetailsArray = await response.json();

        // Kiểm tra nếu mảng không rỗng và lấy phần tử đầu tiên
        if (Array.isArray(machineDetailsArray) && machineDetailsArray.length > 0) {
            const machineDetails = machineDetailsArray[0];
            displayMachineDetails(machineDetails);
        } else {
            console.error('No machine details found in the response.');
        }
    } catch (error) {
        console.error('Error fetching machine details:', error);
    }
}

async function getLocationChangeTag() {
    try {
        const url = 'machines/list_location'; // URL của API
        const headers = {
            'Content-Type': 'application/json',
        };
        const response = await fetch(url, {
            method: 'GET',
            headers: headers,
        });

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const responseData = await response.json();
        const tbody = document.getElementById('locationTableBody');
        tbody.innerHTML = ''; // Xóa nội dung hiện tại của tbody
        
        responseData.forEach(machine => {
            const tr = document.createElement('tr');
            tr.innerHTML = `            
                <td><button class="btn btn-secondary btn-sm" style="background-color: #17a2b8;" onclick="showMachineDetails('${machine.machine_tag_list}')">Xem Chi Tiết</button></td>
                <td>${machine.locations}</td>
                <td>${machine.building}</td>
                <td>${machine.zone}</td>
                <td>${new Date(machine.updated_at).toLocaleString()}</td>
                <td>${machine.updated_by}</td>
                <td>${machine.machine_tag_list}</td>
            `;
            tbody.appendChild(tr);
        });
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}


async function showMachineDetails(machineTagList) {
    try {
        const tags = machineTagList.split(','); // Chia danh sách tags thành mảng
        const url = `machines/by-tags?tags=${tags.join(',')}`; // URL của API với query parameters
        const headers = {
            'Content-Type': 'application/json',
        };
        const response = await fetch(url, {
            method: 'GET',
            headers: headers,
        });

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const machines = await response.json();

        const tbody = document.getElementById('machineDetailsBody');
        tbody.innerHTML = ''; // Xóa nội dung hiện tại của tbody

        // Kiểm tra xem có dữ liệu không
        if (machines.length === 0) {
            tbody.innerHTML = '<tr><td colspan="13">No machine details available</td></tr>';
            $('#machineDetailsModalTag').modal('show'); // Hiển thị modal

            return;
        }    

        machines.forEach(machine => {
             let statusClass;
            switch (machine.status) {
                case '1':
                    statusClass = 'tag-success'; // Đang hoạt động
                    break;
                case '2':
                    statusClass = 'tag-warning'; // Bị hỏng
                    break;
                case '0':
                    statusClass = 'tag-danger'; // Không xác định
                    break;
                default:
                    statusClass = 'tag-secondary'; // Mặc định nếu không khớp với các giá trị trên
            }
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${machine.machine_id}</td>
                <td>${machine.tag}</td>
                <td>${machine.model}</td>
                <td>${machine.machine_name}</td>
                <td><span class="tag ${statusClass}">${getStatusText(machine.status)}</span></td>
                <td>${machine.new_location}</td>
                <td>${new Date(machine.location_change_date).toLocaleString()}</td>
                <td>${machine.location_updated_by}</td>
                <td>${machine.building}</td>
                <td>${machine.zone}</td>
                <td><button class="btn btn-primary btn-sm" onclick="showDetails(${machine.tag})">Chi Tiết</button></td>

            `;
            tbody.appendChild(tr);
        });

        $('#machineDetailsModalTag').modal('show'); // Hiển thị modal

    } catch (error) {
        console.error('Error fetching machine details:', error);
    }
}
// Gọi các hàm khi trang tải xong
document.addEventListener('DOMContentLoaded', () => {
    Promise.all([
        getcountemptylocation(),
        getcountbuildinglocation(),
        getLocationChangeTag()
    ]).then(() => {
        initializeDonutChart(); // Khởi tạo biểu đồ donut sau khi dữ liệu đã được lấy
         // Thêm sự kiện cho nút tải xuống Excel
        document.getElementById('download-excel').addEventListener('click', downloadExcel);


    }).catch(error => {
        console.error('Error fetching data:', error);
    });
});

$(function () {
            /* ChartJS
             * -------
             * Here we will create a few charts using ChartJS
             */

            //--------------
            //- AREA CHART -
            //--------------

            // Get context with jQuery - using jQuery's .get() method.
            var areaChartCanvas = $('#areaChart').get(0).getContext('2d')

            var areaChartData = {
                labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July'],
                datasets: [
                    {
                        label: 'Digital Goods',
                        backgroundColor: 'rgba(60,141,188,0.9)',
                        borderColor: 'rgba(60,141,188,0.8)',
                        pointRadius: false,
                        pointColor: '#3b8bba',
                        pointStrokeColor: 'rgba(60,141,188,1)',
                        pointHighlightFill: '#fff',
                        pointHighlightStroke: 'rgba(60,141,188,1)',
                        data: [28, 48, 40, 19, 86, 27, 90]
                    },
                    {
                        label: 'Electronics',
                        backgroundColor: 'rgba(210, 214, 222, 1)',
                        borderColor: 'rgba(210, 214, 222, 1)',
                        pointRadius: false,
                        pointColor: 'rgba(210, 214, 222, 1)',
                        pointStrokeColor: '#c1c7d1',
                        pointHighlightFill: '#fff',
                        pointHighlightStroke: 'rgba(220,220,220,1)',
                        data: [65, 59, 80, 81, 56, 55, 40]
                    },
                ]
            }

            var areaChartOptions = {
                maintainAspectRatio: false,
                responsive: true,
                legend: {
                    display: false
                },
                scales: {
                    x: {
                        grid: {
                            display: false,
                        }
                    },
                    y: {
                        grid: {
                            display: false,
                        }
                    }
                }
            }

            // This will get the first returned node in the jQuery collection.
            new Chart(areaChartCanvas, {
                type: 'line',
                data: areaChartData,
                options: areaChartOptions
            })

           


})

// Hàm khởi tạo biểu đồ donut
async function initializeDonutChart() {
    try {
        const url = 'machines/by-building'; // URL của API
        const response = await fetch(url);
        const data = await response.json();

        // Cập nhật phần tử <select> với danh sách tòa nhà
        const select = document.getElementById('building');
        select.innerHTML = ''; // Xóa tất cả tùy chọn hiện có
        // Thêm tùy chọn "ALL" vào đầu danh sách
        const allOption = document.createElement('option');
        allOption.value = 'ALL';
        allOption.textContent = 'ALL';
        select.appendChild(allOption);

        data.forEach(item => {
            const option = document.createElement('option');
            option.value = item.building;
            option.textContent = item.building;
            select.appendChild(option);
        });
                
        
        // Vẽ biểu đồ Doughnut
        const labels = data.map(item => item.building);
        const machineCounts = data.map(item => item.machine_count);
        const backgroundColors = [
            '#f56954', '#00a65a', '#f39c12', '#00c0ef', '#3c8dbc',
            '#d2d6de', '#f39c12', '#00c0ef', '#3c8dbc', '#d2d6de',
            '#f56954' // Thêm nhiều màu nếu cần
        ];

        const donutChartCanvas = $('#donutChart').get(0).getContext('2d');
        const donutData = {
            labels: labels,
            datasets: [{
                data: machineCounts,
                backgroundColor: backgroundColors.slice(0, labels.length),
                datalabels: {
                    display: true, // Hiển thị giá trị
                    color: 'white',
                    formatter: (value) => {
                        return value; // Hiển thị giá trị dữ liệu
                    },
                    font: {
                        weight: 'bold'
                    }
                }
            }]
        };

        const donutOptions = {
            maintainAspectRatio: false,
            responsive: true,
            plugins: {
                datalabels: {
                    display: true,
                    color: '#ffffff',
                    font: {
                        size: 14,
                        weight: 'bold'
                    },
                    formatter: (value) => {
                        return value; // Hiển thị giá trị dữ liệu
                    }
                }
            }
        };


        new Chart(donutChartCanvas, {
            type: 'doughnut',
            data: donutData,
            options: donutOptions,
                        plugins: [ChartDataLabels] // Đảm bảo plugin được sử dụng

        });
    } catch (error) {
        console.error('Error initializing donut chart:', error);
    }
}

let isDownloading = false;

async function downloadExcel() {
    if (isDownloading) return; // Nếu đang tải, không làm gì cả
    isDownloading = true;
    try {
        // Lấy giá trị của building từ form và mã hóa URL
        const building = document.getElementById('building').value;
        const encodedBuilding = encodeURIComponent(building); // Mã hóa tham số để xử lý ký tự đặc biệt       
        const url = `machines/export-machines?building=${encodedBuilding}`;
        
        // Gửi yêu cầu GET đến API để tải file
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            }
        });

        // Kiểm tra phản hồi từ server
        if (!response.ok) {
            throw new Error(`Network response was not ok: ${response.statusText}`);
        }

        // Lấy tên file từ header nếu có
        const contentDisposition = response.headers.get('Content-Disposition');
        const filename = contentDisposition ? 
            contentDisposition.split('filename=')[1].replace(/"/g, '') : 'machines.xlsx';

        // Chuyển đổi phản hồi thành blob
        const data = await response.blob();

        // Tạo URL cho blob và tải file
        const blobUrl = window.URL.createObjectURL(data);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = filename; // Tên file từ header hoặc tên mặc định
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(blobUrl); // Giải phóng URL tạm thời
        document.body.removeChild(a);

    } catch (error) {
        toastr.error('Bạn không có quyền tải bản ghi này!', 'Lỗi', {
            timeOut: 3000,
            progressBar: true,
            closeButton: true,
        });
    }
    finally {
        isDownloading = false; // Reset trạng thái
    }
}


 // Hàm để lấy vai trò từ localStorage
function getUserRole() {
    const user = localStorage.getItem('user');
    if (user) {
        try {
            const userData = JSON.parse(user);
            return userData.roles; // Giả sử vai trò được lưu trữ trong trường 'role'
        } catch (error) {
            console.error('Error parsing user data from localStorage:', error);
        }
    }
    return null;
}

// Nội dung HTML cho admin
const adminContent = `
    <div class="row">
        <div class="col-md-8">
            <div class="card">
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-12">
                            <div class="progress-group">
                                <span>Use Rating</span>
                                <span id="total_count_label" class="float-right"></span>
                                <div class="progress progress-sm">
                                    <div id="progress_bar" class="progress-bar bg-primary" style="width: 0%"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="col-md-4">
            <div class="card">
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-12" style="padding: 10px;">
                            <form id="export-form">
                                <div class="form-group" style="display: flex;">
                                    <button type="button" id="download-excel" class="btn btn-primary" style="height: auto; margin-right: 10px;" onclick="downloadExcel()">Download Excel</button>
                                    <select id="building" name="building" class="form-control"></select>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
`;

// Nội dung HTML cho không phải admin
const nonAdminContent = `
    <div class="row">
        <div class="col-md-12">
            <div class="card">
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-12">
                            <div class="progress-group">
                                <span>Use Rating</span>
                                <span id="total_count_label" class="float-right"></span>
                                <div class="progress progress-sm">
                                    <div id="progress_bar" class="progress-bar bg-primary" style="width: 0%"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div id="building" style="display:none">
            <div style="display:none">
              <button type="button" id="download-excel" onclick="downloadExcel()">Download Excel</button>
            </div>
        </div>
    </div>
`;

// Chèn nội dung tương ứng vào phần tử với ID 'content'
document.addEventListener('DOMContentLoaded', () => {
    const userRole = getUserRole();
    const contentDiv = document.getElementById('content');

    // if (userRole === 'ADMIN') {
    //     contentDiv.innerHTML = adminContent;
    // } else {
    //     contentDiv.innerHTML = nonAdminContent;
    // }
    contentDiv.innerHTML = adminContent;
});