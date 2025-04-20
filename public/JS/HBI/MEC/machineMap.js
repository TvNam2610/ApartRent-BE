
/**
 * Normalize building name for consistent matching
 */
function normalizeWorkCenter(name) {
    return name
        .toLowerCase()         // Chuyển về chữ thường
        .replace(/[_\s]+/g, ''); // Xóa dấu gạch dưới và khoảng trắng
}

/**
 * Tải danh sách các tòa nhà 
 */
async function getMachinesBuilding(model = '') {
    try {
        
        url = model ? `machines-map/get-building?model=${encodeURIComponent(model)}` : 'machines-map/get-building';
        const response = await fetch(url, {
            method: 'GET', // Sử dụng phương thức GET để lấy dữ liệu
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const buildings = await response.json(); // Nhận dữ liệu từ API        
        return buildings; 
    } catch (error) {
        console.error('Lỗi khi tải danh sách tòa nhà:', error);
    }
}

/**
 * Hàm lấy danh sách mô hình và khởi tạo Awesomplete
 */
async function initModelAutocomplete() {
    try {
        const url = 'machines-map/get-models'; // URL của API
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });
        if (!response.ok) throw new Error('Network response was not ok');
        
        const models = await response.json();
        const modelList = models.map(model => model.model);

        const input = document.getElementById('txtFilterModel');
        new Awesomplete(input, {
            list: modelList,
            minChars: 1,
            autoFirst: true
        });
    } catch (error) {
        console.error('Error fetching models:', error);
    }
}

/**
 * Tải chi tiết mô hình và hiển thị trên form
 */
async function getModelDetails(model) {
    try {
        const url = model ? `machines-map/get-models-details?model=${encodeURIComponent(model)}` : 'machines-map/get-models-details';
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const data = await response.json();

        if (data.length > 0) {
            const tableBody = document.querySelector('#modelDetailsTableBody');
            tableBody.innerHTML = data.map(row => `
                <tr>
                    <td>${row.model_name}</td>
                    <td>${row.feature_name}</td>
                    <td>${row.feature_detail_name}</td>
                    <td>${row.feature_detail_description}</td>
                </tr>
            `).join('');

            // Hiển thị form chi tiết mô hình
            document.querySelector('#modelDetailsSection').style.display = 'block';
        } else {
            
            document.querySelector('#modelDetailsSection').style.display = 'none';
        }
    } catch (error) {
        console.error('Lỗi khi tải chi tiết mô hình:', error);
    }
}

/**
 * Hiển thị hoặc ẩn phần chi tiết mô hình dựa trên dữ liệu mô hình
 */
function toggleModelDetailsSection(show) {
    const section = document.getElementById('modelDetailsSection');
    if (show) {
        section.style.display = 'block'; // Hiển thị phần chi tiết mô hình
    } else {
        section.style.display = 'none'; // Ẩn phần chi tiết mô hình
    }
}
// Thêm sự kiện click cho nút tìm kiếm
document.getElementById('searchButton').addEventListener('click', () => {
    const model = document.getElementById('txtFilterModel').value.trim();
    if (model !== '') {
        getBuildingLocations(model); // Cập nhật bản đồ với dữ liệu mới nếu mô hình không rỗng
        //getModelDetails(model); // Gọi hàm để cập nhật dữ liệu chi tiết mô hình
    }
});

// Thêm sự kiện input để tự động tìm kiếm khi giá trị mô hình thay đổi
document.getElementById('txtFilterModel').addEventListener('input', () => {
    const model = document.getElementById('txtFilterModel').value.trim();
    if (model === '') {
        // Nếu mô hình rỗng, tự động gọi hàm tìm kiếm
        getBuildingLocations();
    }
});



// Gọi hàm khi trang tải xong nếu mô hình rỗng
document.addEventListener('DOMContentLoaded', () => {
    initModelAutocomplete(); // Khởi tạo Awesomplete khi trang tải xong
    const model = document.getElementById('txtFilterModel').value.trim();
    if (model === '') {
        getBuildingLocations(); // Hiển thị bản đồ với dữ liệu ban đầu nếu mô hình rỗng
    }
});

// JS cho 6 moda

/**
 * Tải vị trí của các tòa nhà và hiển thị trên bản đồ
 */

async function getBuildingLocations() {
    try {
        const model = document.getElementById('txtFilterModel').value.trim(); // Lấy giá trị mô hình từ input
        const buildingsWithCounts = await getMachinesBuilding(model); // Fetch building machine count data

        // Fetch building location data
        const url = '/mechanic/getbuilding-location'; // URL của API
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const data = await response.json(); // Nhận dữ liệu từ API

        if (data.rs) {
            const locations = data.data; // Dữ liệu các tòa nhà trên bản đồ
            const mapContainer = document.querySelector('.machine_map');

            // Xóa các điểm hiện tại trên bản đồ, nhưng giữ lại ảnh nền
            const existingPoints = mapContainer.querySelectorAll('.machine_map_point');
            existingPoints.forEach(point => point.remove());

            // Tạo một bản đồ từ tên tòa nhà đến số lượng máy
            const machineCountMap = buildingsWithCounts.reduce((map, building) => {
                map[normalizeWorkCenter(building.temp_name)] = building.machine_count;
                return map;
            }, {});

            // Tạo các phần tử với hiệu ứng rơi từng cái một
            locations.forEach((building, index) => {
                // Lấy số lượng máy từ bản đồ
                const machineCount = machineCountMap[normalizeWorkCenter(building.namecode)] || 0;

                // Chỉ tạo điểm nếu số lượng máy lớn hơn 0
                if (machineCount > 0) {
                    const point = document.createElement('div');
                    point.className = 'machine_map_point';
                    point.style.top = `${building.topmap}%`;
                    point.style.left = `${building.leftmap}%`;
                    point.setAttribute('data-building-name', building.building);
                    point.setAttribute('data-building-zoneCode', building.zone_code);
                    
                    const pointContainer = document.createElement('div');
                    pointContainer.className = 'machine_map_point_container';

                    const icon = document.createElement('span');
                    icon.className = 'material-symbols-outlined fall-animation';
                    icon.style.fontSize = '1.6em';
                    icon.style.fontWeight = 'bold';
                    icon.style.color = '#e74c3c';
                    icon.textContent = 'location_on';

                    const name = document.createElement('div');
                    name.className = 'machine_map_point_name fall-animation';
                    name.innerHTML = `${building.name} (${machineCount})`;

                    pointContainer.appendChild(icon);
                    pointContainer.appendChild(name);
                    point.appendChild(pointContainer);
                    mapContainer.appendChild(point);

                    // Áp dụng độ trễ cho animation của icon và name
                    icon.style.animationDelay = index * 0.5;
                    name.style.animationDelay = index * 0.5;
                }
            });

            // Thêm sự kiện click cho các điểm trên bản đồ
            document.querySelectorAll('.machine_map_point').forEach(point => {
                point.addEventListener('click', async () => {
                    const buildingName = point.getAttribute('data-building-name'); // Lấy tên tòa nhà từ thuộc tính data
                    const zoneCode = point.getAttribute('data-building-zoneCode'); // Lấy tên code từ thuộc tính data
                    const modalId = getModalIdForBuilding(buildingName); // Tìm modal ID dựa trên tên tòa nhà

                    if (modalId) {                  
                    const dataOpenModal =  await openModal(modalId, buildingName, zoneCode); // Mở modal
                    const dataOpenModalModel = await openModalModel(modalId, buildingName, model ,zoneCode)  
                    await updateModalContent(modalId,dataOpenModal,dataOpenModalModel);                       
                    }

                });
            });
        } else {
            console.error('Lỗi từ API:', data.msg);
        }

        // Hiển thị chi tiết mô hình nếu có mô hình, ẩn nếu không có mô hình
        toggleModelDetailsSection(model !== '');

        if (model !== '') {
            await getModelDetails(model);
        }
    } catch (error) {
        console.error('Lỗi khi tải dữ liệu vị trí tòa nhà:', error);
    }
}



async function openModal(modalId, buildingName ,zoneCode = '') {
    var modal = document.getElementById(modalId);    
   
    if (modal) {
        modal.style.display = "block";
        // Nếu modalId là 'modal1', tải dữ liệu từ API
        if (modalId === 'modal1' || modalId === 'modal2' || modalId === 'modal3' || modalId === 'modal4' || modalId === 'modal5' || modalId === 'modal6'|| modalId === 'modal7' || modalId === 'modal8' || modalId === 'modal9') {
            try {
                let url = `machines-map/location-counts?building=${buildingName}`;
                if (zoneCode && zoneCode !== 'null') { // Ensure zoneCode is not null or "null"
                    url += `&zoneCode=${zoneCode}`;
                }
                const response = await fetch(url, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });

                if (!response.ok) throw new Error('Network response was not ok');
                const data = await response.json();

                // Cập nhật nội dung của modal1 với dữ liệu từ API
               
                return data;
            } catch (error) {
                console.error('Lỗi khi tải dữ liệu modal:', error);
            }
        }
    }
}

async function openModalModel(modalId, buildingName, model, zoneCode) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = "block";

        if (['modal1', 'modal2', 'modal3', 'modal4', 'modal5', 'modal6','modal7', 'modal8','modal9'].includes(modalId)) {
            try {
                let url = `machines-map/location-counts-model?model=${encodeURIComponent(model)}&building=${encodeURIComponent(buildingName)}`;
                if (zoneCode && zoneCode !== '' ) { 
                    url += `&zoneCode=${zoneCode}`;
                }
                const response = await fetch(url, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });

                if (!response.ok) throw new Error('Network response was not ok');
                const dataModel = await response.json();
                return dataModel;
            
            } catch (error) {
                console.error('Lỗi khi tải dữ liệu modal:', error);
            }
        }
    }
}

/**
 * Cập nhật nội dung của modal với dữ liệu từ API
 */


async function updateModalContent(modalId, dataOpenModal, dataOpenModalModel) {
    const modal = document.getElementById(modalId);

    if (modal) {
        // Xóa nội dung hiện tại
        const contentContainer = modal.querySelector('.content-container-building');
        contentContainer.innerHTML = '';

        const locationCodes = dataOpenModalModel.map(item => item.location_code);
        const locationCodeCounts = new Map(dataOpenModalModel.map(item => [item.location_code, item.location_code_count]));
        // Kiểm tra zone code để xác định modalId
        const firstZoneCode = dataOpenModal[0]?.zone_code; // Giả sử dataOpenModal không rỗng
        
        if (firstZoneCode) {
            if (firstZoneCode === 'QCA') {
                modalId = 'modal1';
            } else if (firstZoneCode === 'SA2') {
                modalId = 'modal8';
            }
            else if (firstZoneCode === 'SA1') {
                modalId = 'modal7';               
            }
             else if (firstZoneCode === 'SB2') {
                modalId = 'modal9';               
            }
            // Chỉ thay đổi CSS cho modal7 và modal-content
            if (modalId === 'modal7') {
                // Update the h3 content for modal7
                const h3 = modal.querySelector('h3');
                if (h3) {
                    h3.textContent = 'Khu Phụ Trợ A'; // Ensure the correct title is shown
                }
                contentContainer.style.flexWrap = 'wrap';
                contentContainer.style.gap = '10px';
                contentContainer.style.padding = '10px';
                contentContainer.style.display = 'grid';
                contentContainer.style.gridTemplateColumns = 'repeat(6, 1fr)';

                // Thay đổi CSS cho .modal-content
                const modalContent = modal.querySelector('.modal-content');
                if (modalContent) {
                    modalContent.style.backgroundColor = '#fefefe';
                    modalContent.style.margin = '5% auto';
                    modalContent.style.padding = '20px';
                    modalContent.style.border = '1px solid #888';
                    modalContent.style.width = '100%';
                    modalContent.style.maxWidth = '950px';
                    modalContent.style.borderRadius = '5px';
                    modalContent.style.position = 'relative';
                    modalContent.style.animation = 'rise 0.2s cubic-bezier(0.42, 0, 0.58, 1) forwards';
                }
                } else {
                    // Đặt CSS về mặc định nếu không phải modal7
                    contentContainer.style.flexWrap = '';
                    contentContainer.style.gap = '';
                    contentContainer.style.padding = '';
                    contentContainer.style.display = '';
                    contentContainer.style.gridTemplateColumns = '';

                    // Đặt lại CSS cho .modal-content về mặc định nếu không phải modal7
                    const modalContent = modal.querySelector('.modal-content');
                    if (modalContent) {
                        modalContent.style.backgroundColor = '';
                        modalContent.style.margin = '';
                        modalContent.style.padding = '';
                        modalContent.style.border = '';
                        modalContent.style.width = '';
                        modalContent.style.maxWidth = '';
                        modalContent.style.borderRadius = '';
                        modalContent.style.position = '';
                        modalContent.style.animation = '';
                    }
            }  
            if (modalId === 'modal1') {
                // Update the h3 content for modal7
                const h3 = modal.querySelector('h3');
                if (h3) {
                    h3.textContent = 'Mechanic Workshop A'; // Ensure the correct title is shown
                }
            contentContainer.style.flexWrap = 'wrap';
            contentContainer.style.gap = '10px';
            contentContainer.style.padding = '10px';
            contentContainer.style.display = 'grid';
            contentContainer.style.gridTemplateColumns = 'repeat(2, 1fr)';

            // Thay đổi CSS cho .modal-content
            const modalContent = modal.querySelector('.modal-content');
            if (modalContent) {
                modalContent.style.backgroundColor = '#fefefe';
                modalContent.style.margin = '5% auto';
                modalContent.style.padding = '20px';
                modalContent.style.border = '1px solid #888';
                modalContent.style.width = '100%';
                modalContent.style.maxWidth = '350px';
                modalContent.style.borderRadius = '5px';
                modalContent.style.position = 'relative';
                modalContent.style.animation = 'rise 0.2s cubic-bezier(0.42, 0, 0.58, 1) forwards';
            }
            }
            if (modalId === 'modal9') {
                // Update the h3 content for modal7
                const h3 = modal.querySelector('h3');
                if (h3) {
                    h3.textContent = 'Kho Máy Trung Tâm'; // Ensure the correct title is shown
                }
            contentContainer.style.flexWrap = 'wrap';
            contentContainer.style.gap = '10px';
            contentContainer.style.padding = '10px';
            contentContainer.style.display = 'grid';
            contentContainer.style.gridTemplateColumns = 'repeat(23, 1fr)';

            // Thay đổi CSS cho .modal-content
                const modalContent = modal.querySelector('.modal-content');
                console.log('modalContent found:', modalContent); // Kiểm tra xem phần tử có được tìm thấy không
            if (modalContent) {
                modalContent.style.backgroundColor = '#fefefe';
                modalContent.style.margin = '5% auto';
                modalContent.style.padding = '20px';
                modalContent.style.border = '1px solid #888';
                modalContent.style.width = '100%';
                modalContent.style.maxWidth = '1450px';
                modalContent.style.borderRadius = '5px';
                modalContent.style.position = 'relative';
                modalContent.style.animation = 'rise 0.2s cubic-bezier(0.42, 0, 0.58, 1) forwards';
                }
              
                
            }
            if (modalId === 'modal8') {
                // Update the h3 content for modal7
                const h3 = modal.querySelector('h3');
                if (h3) {
                    h3.textContent = 'Khu Phụ Trợ B'; // Ensure the correct title is shown
                }

            // Thay đổi CSS cho .modal-content
            const modalContent = modal.querySelector('.modal-content');
            if (modalContent) {
                modalContent.style.backgroundColor = '#fefefe';
                modalContent.style.margin = '5% auto';
                modalContent.style.padding = '20px';
                modalContent.style.border = '1px solid #888';
                modalContent.style.width = '100%';
                modalContent.style.maxWidth = '1450px';
                modalContent.style.borderRadius = '5px';
                modalContent.style.position = 'relative';
                modalContent.style.animation = 'rise 0.2s cubic-bezier(0.42, 0, 0.58, 1) forwards';
            }
            }
            // css cho modal1
            
        }
        // Kiểm tra modalId để quyết định cách hiển thị
        if ([  'modal6','modal4'].includes(modalId)) {
            // Hiển thị bình thường
              dataOpenModal.forEach(item => {
            const squareDiv = document.createElement('div');
            squareDiv.className = 'data-square'; // Thêm class để định dạng bằng CSS
                //   if (modalId === 'modal9') {
                //       squareDiv.classList.add('modal9-square');
                //   }
            // Tạo nội dung cho div
            const locationCodeDiv = document.createElement('div');
            locationCodeDiv.className = 'location-code';
                
            // Đổi màu nếu dòng chứa máy tìm kiếm
            if (locationCodes.includes(item.location_code)) {
                
                locationCodeDiv.textContent = `${item.location_name}`;
                squareDiv.style.background = '#17a3b8';
                squareDiv.style.border = '2px solid #ecf0f1';
                locationCodeDiv.style.color = '#ecf0f1'
            } else {
                locationCodeDiv.textContent = `${item.location_name}`;
                locationCodeDiv.style.color = 'black'; // Màu mặc định
            }

            const totalBuildingDiv = document.createElement('div');
            totalBuildingDiv.className = 'total-building';
            const locationCodeCount = locationCodeCounts.get(item.location_code) || 0;
            //totalBuildingDiv.textContent = `${locationCodeCount} / ${item.total_building} Máy`;

            // Chỉ hiển thị nếu locationCodeCount lớn hơn 0
            if (locationCodeCount > 0) {
                    totalBuildingDiv.innerHTML = `<span style="color: #d63031;">(${locationCodeCount})</span> ${item.total_building} Máy`;

            } else {
                totalBuildingDiv.textContent = `${item.total_building} Máy`; // Chỉ hiển thị total_building
            }

            // Đổi màu cho totalBuildingDiv nếu cần
            if (locationCodes.includes(item.location_code)) {
                totalBuildingDiv.style.color = '#ecf0f1';
            } else {
                totalBuildingDiv.style.color = 'black'; // Màu mặc định
            }
            
            // Thêm hiệu ứng nhấp nháy nếu total_building > 26
            if (item.total_building > 26 && ['Production Workshop A', 'Production Workshop B', 'Production Workshop C'].includes(item.building)) {
                squareDiv.classList.add('blink'); // Thêm class nhấp nháy
            }

            // Thêm sự kiện click cho div hình vuông
            squareDiv.addEventListener('click', () => {
                openDetailModal(item,dataOpenModalModel);
            });

            // Thêm nội dung vào squareDiv
            squareDiv.appendChild(locationCodeDiv);
            squareDiv.appendChild(totalBuildingDiv);

            // Thêm squareDiv vào contentContainer
            contentContainer.appendChild(squareDiv);
            });
        } else if (['modal3', 'modal8', 'modal7', 'modal1', 'modal5', 'modal2', 'modal9'].includes(modalId)) {
          
            // Xác định số lượng ô dựa trên modalId
            if (modalId === 'modal3') {
                squares = Array(48).fill(null);
            }
            else if (modalId === 'modal7') {
                squares = Array(30).fill(null);
            } 
            else if (modalId === 'modal8') {
                squares = Array(45).fill(null);
            }
                else if (modalId === 'modal1') {
                squares = Array(10).fill(null);
            } else if (modalId === 'modal5') {
                squares = Array(24).fill(null);
            }
            //     else if (modalId === 'modal4') {
            //     squares = Array(48).fill(null);
            // }
                 
                else if (modalId === 'modal2') {
                squares = Array(33).fill(null);
            }
                 
                else if (modalId === 'modal9') {
                squares = Array(138).fill(null);
            }
            else {
                // Nếu modalId không xác định, có thể trả về hoặc xử lý khác
                return;
        }

        // Điền dữ liệu vào các ô tương ứng
        dataOpenModal.forEach(item => {
            const preIndex = item.preindex; // Lấy chỉ số ô
            if (preIndex >= 1 && preIndex <= squares.length) {
                squares[preIndex - 1] = item; // Gán item vào ô tương ứng
            }
        });

            // Thêm dữ liệu vào modal dưới dạng các div hình vuông
            squares.forEach((item, index) => {
                const squareDiv = document.createElement('div');
                squareDiv.className = 'data-square';
                // Nếu modal là 'modal9', thêm class 'modal9-square'
                if (modalId === 'modal9') {
                    squareDiv.classList.add('modal9-square');
                }
                if (item) {
                    const locationCodeDiv = document.createElement('div');
                    locationCodeDiv.className = 'location-code';

                    // Đổi màu nếu dòng chứa máy tìm kiếm
                    if (locationCodes.includes(item.location_code)) {
                        locationCodeDiv.textContent = `${item.location_name}`;
                        squareDiv.style.background = '#17a3b8';
                        squareDiv.style.border = '2px solid #ecf0f1';
                        locationCodeDiv.style.color = '#ecf0f1';
                    } else {
                        locationCodeDiv.textContent = `${item.location_name}`;
                        locationCodeDiv.style.color = 'black'; // Màu mặc định
                    }

                    const totalBuildingDiv = document.createElement('div');
                    totalBuildingDiv.className = 'total-building';
                    const locationCodeCount = locationCodeCounts.get(item.location_code) || 0;

                    if (locationCodeCount > 0) {
                        totalBuildingDiv.innerHTML = `<span style="color: #d63031;">(${locationCodeCount})</span> ${item.total_building} Máy`;
                    } else {
                        totalBuildingDiv.textContent = `${item.total_building} Máy`; // Chỉ hiển thị total_building
                    }

                    // Thêm hiệu ứng nhấp nháy nếu total_building > 26
                    if (item.total_building > 26 && ['Production Workshop A', 'Production Workshop B', 'Production Workshop C'].includes(item.building)) {
                        squareDiv.classList.add('blink'); // Thêm class nhấp nháy
                    }

                    // Thêm sự kiện click cho div hình vuông
                    squareDiv.addEventListener('click', () => {
                        openDetailModal(item, dataOpenModalModel);
                    });

                    squareDiv.appendChild(locationCodeDiv);
                    squareDiv.appendChild(totalBuildingDiv);
                }
                else {
                  
                    squareDiv.style.border = '0px';
                    squareDiv.style.boxShadow = '0px 0px';
                    squareDiv.style.pointerEvents = 'none'
                    squareDiv.style.height = '25px';
                }

                // Thêm squareDiv vào contentContainer
                contentContainer.appendChild(squareDiv);
            });
        }
    }
}


// function closeModal(modalId) {
//     var modal = document.getElementById(modalId);
//     if (modal) {
//         modal.style.display = "none";
//     }
// }

// Hàm để lấy modal ID dựa trên tên tòa nhà
function getModalIdForBuilding(buildingName) {
    switch (buildingName) {
        case 'Mechanic Workshop A':
            return 'modal1';
        case 'Mechanic Workshop B':
            return 'modal2';
        case 'Production Workshop A':
            return 'modal3';
        case 'Production Workshop B':
            return 'modal4';
        case 'Production Workshop C':
            return 'modal5';
        case 'LAB, ID, ĐÀO TẠO':
            return 'modal6';
        case 'Khu Phụ Trợ A':
            return 'modal7';
        case 'Khu Phụ Trợ B':
            return 'modal8';
        case 'Kho Máy Trung Tâm':
            return 'modal9';
        default:
            return null;
    }
}

// Đóng modal khi nhấp ra ngoài nội dung
window.onclick = function(event) {
    var modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        if (event.target === modal) {
            closeModal(modal.id);
        }
    });
}


function closeModal(modalId) {
    const detailModal = document.getElementById(modalId);
    detailModal.style.display = 'none';
}




function closeDetailModal() {
    const detailModal = document.getElementById('DetailModal');
    if (detailModal) {
        detailModal.style.display = 'none';
    }
}

// Thêm sự kiện cho nút đóng
document.querySelector('#DetailModal .close').addEventListener('click', closeDetailModal);





const buildingModalConfig = {
    'Mechanic Workshop A': 0,
    'Mechanic Workshop B': 0,
    'Production Workshop A': 26,
    'Production Workshop B': 26,
    'Production Workshop C': 26,
    'LAB, ID, ĐÀO TẠO': 0,
    'Khu Phụ Trợ A': 0,
    'Khu Phụ Trợ B': 0,
    'Kho Máy Trung Tâm': 0
};


/**
 * Hiển thị modal chi tiết với thông tin về vị trí được nhấp
 */

async function openDetailModal(item, dataOpenModalModel) {
    const building = item.building;

    if (buildingModalConfig[building] !== undefined) {
        // Nếu building thuộc các workshop cơ khí
        if (building === 'Mechanic Workshop A' || building === 'Mechanic Workshop B' ||
            building === 'LAB, ID, ĐÀO TẠO' || building === 'Khu Phụ Trợ A' || 
            building === 'Khu Phụ Trợ B' || building === 'Kho Máy Trung Tâm' || 
                 building === 'Production Workshop C') {
            await openMechanicWorkshopDetail(item, dataOpenModalModel);
        }
        // Nếu building thuộc các workshop sản xuất
        else if (building === 'Production Workshop A' || building === 'Production Workshop B' ) {
            await openProductionWorkshopDetail(item, dataOpenModalModel);
        }
    } else {
        console.error('Building không hợp lệ hoặc không được hỗ trợ');
    }
}


// Hàm xử lý cho workshop 1
async function openMechanicWorkshopDetail(item, dataOpenModalModel) {
    try {
    
        // Lấy dữ liệu và xử lý hiển thị cho workshop 1
        const response = await fetch(`machines-map/machine-details-workcenter?building=${encodeURIComponent(item.building)}&location=${encodeURIComponent(item.location_name)}`);
        
        if (!response.ok) throw new Error('Network response was not ok');
        
        const detailData = await response.json();
        const detailModal = document.getElementById('DetailModal');

        if (detailModal) {
            const detailContent = detailModal.querySelector('.content-container-building');
            detailContent.innerHTML = '';
            let detailItemToUseModal = null; // Biến để lưu item cần sử dụng

            detailData.forEach(detailItem => {
                document.getElementById('detailModalName').innerText = `${detailItem.location_name}`;
                const squareDiv = document.createElement('div');
                squareDiv.className = 'data-square';

                // Tạo nội dung cho div
                const locationCodeDiv = document.createElement('div');
                locationCodeDiv.className = 'location-code';
                locationCodeDiv.textContent = `${detailItem.machine_name}`;

                const machineModelDiv = document.createElement('div');
                machineModelDiv.className = 'location-code';
                machineModelDiv.textContent = `${detailItem.machine_model}`;

                const totalBuildingDiv = document.createElement('div');
                totalBuildingDiv.className = 'total-building';
                totalBuildingDiv.textContent = `${detailItem.tag}`;

                const matchingModel = dataOpenModalModel.find(model => model.tag === detailItem.tag);
                if (matchingModel) {
                    squareDiv.style.backgroundColor = '#17a3b8';
                    squareDiv.style.color = '#ecf0f1';
                }

                squareDiv.appendChild(locationCodeDiv);
                squareDiv.appendChild(machineModelDiv);
                squareDiv.appendChild(totalBuildingDiv);
                detailContent.appendChild(squareDiv);
                squareDiv.addEventListener('click', () => {
                        showDetails(detailItemToUseModal);
                    });

                if (!detailItemToUseModal) {
                    detailItemToUseModal = detailItem; 
                } 
            });
            addActionButtonClickEvent(detailItemToUseModal, dataOpenModalModel);

            detailModal.style.display = 'block';
        }
    } catch (error) {
        console.error('Lỗi khi tải dữ liệu chi tiết:', error);
    }
}


// Hàm xử lý cho workshop 2
async function openProductionWorkshopDetail(item, dataOpenModalModel) {
    try {
        // Lấy số lượng ô cho tòa nhà hiện tại
        const numSquares = buildingModalConfig[item.building] || 2; // Mặc định là 40 nếu không tìm thấy

        // Fetch dữ liệu từ API
        const response = await fetch(`machines-map/machine-details-workcenter?building=${encodeURIComponent(item.building)}&location=${encodeURIComponent(item.location_name)}`);
        
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        
        const detailData = await response.json();
        
        // Lấy modal để hiển thị chi tiết
        const detailModal = document.getElementById('DetailModal');
        
        if (detailModal) {
            const detailContent = detailModal.querySelector('.content-container-building');
            detailContent.innerHTML = ''; // Xóa nội dung hiện tại

            // Tạo một mảng phần tử trống theo số lượng ô cần thiết
            const squares = Array(numSquares).fill(null).map((_, index) => index + 1);

            
            // Điền dữ liệu vào các vị trí tương ứng với `locationindex`
            detailData.forEach((detailItem) => {
                const locationIndex = detailItem.locationindex;

                if (locationIndex !== null && locationIndex >= 1 && locationIndex <= numSquares) {
                    squares[locationIndex - 1] = detailItem; // Gán detailItem vào ô locationIndex
                }
            });

            
            // Lấp đầy các ô trống từ đầu về cuối với dữ liệu `locationindex = null`
            let forwardIndex = 0; // Bắt đầu từ ô đầu tiên
            detailData.forEach((detailItem) => {
                if (detailItem.locationindex === null) {
                    // Tìm ô trống tiếp theo từ đầu đến cuối
                    while (forwardIndex < numSquares && typeof squares[forwardIndex] === 'object') {
                        forwardIndex++; // Tìm ô trống tiếp theo
                    }
                    if (forwardIndex < numSquares) {
                        squares[forwardIndex] = detailItem; // Điền dữ liệu vào ô trống
                        forwardIndex++; // Chuyển sang ô tiếp theo
                    }
                }
            });           


            // Tạo bảng grid với số lượng ô đã xác định
            const grid = document.createElement('div');
            grid.className = 'grid-container';
            grid.style.display = 'grid';
            grid.style.gridTemplateColumns = `repeat(${Math.min(numSquares, 13)}, 1fr)`; // Tối đa 13 cột
            grid.style.gap = '10px'; // Khoảng cách giữa các ô
            let detailItemToUse = null;

            // Duyệt qua các ô để hiển thị
            squares.forEach((detailItemOrNumber) => {
                const squareDiv = document.createElement('div');
                squareDiv.className = 'data-square';
                squareDiv.style.border = '2px solid #16a085';
                squareDiv.style.padding = '10px';
                squareDiv.style.textAlign = 'center';
                
                if (typeof detailItemOrNumber === 'object') {
                    // Nếu có dữ liệu `detailItem`, hiển thị thông tin
                    document.getElementById('detailModalName').innerText = `${detailItemOrNumber.location_name}`;
                    const locationCodeDiv = document.createElement('div');
                    locationCodeDiv.className = 'location-code';
                    locationCodeDiv.textContent = `${detailItemOrNumber.machine_name || 'N/A'}`;

                    const machineModelDiv = document.createElement('div');
                    machineModelDiv.className = 'location-code';
                    machineModelDiv.textContent = `${detailItemOrNumber.machine_model || 'N/A'}`;

                    const totalBuildingDiv = document.createElement('div');
                    totalBuildingDiv.className = 'total-building';
                    totalBuildingDiv.textContent = `${detailItemOrNumber.tag || 'N/A'}`;

                    // Kiểm tra nếu item.tag trùng với bất kỳ tag trong dataOpenModalModel
                    const matchingModel = dataOpenModalModel.find(model => model.tag === detailItemOrNumber.tag);

                    if (matchingModel) {
                        squareDiv.style.backgroundColor = '#17a3b8'; // Màu xanh
                        squareDiv.style.color = '#ecf0f1'; // Màu chữ trắng
                    }

                    // Thêm nội dung vào squareDiv
                    squareDiv.appendChild(locationCodeDiv);
                    squareDiv.appendChild(machineModelDiv);
                    squareDiv.appendChild(totalBuildingDiv);
                   
                     squareDiv.addEventListener('click', () => {
                        showDetails(detailItemToUse);
                    });
                   // document.getElementById('actionButton').addEventListener('click', () => openDetailModalTable(detailItemOrNumber, dataOpenModalModel));
                    detailItemToUse = detailItemOrNumber; 

                } else {
                    // Nếu không có dữ liệu, hiển thị số thứ tự
                    squareDiv.textContent = detailItemOrNumber;
                }
                // Thêm squareDiv vào grid
                grid.appendChild(squareDiv);
            });
            
            // Thêm grid vào detailContent 
            detailContent.appendChild(grid);
            addActionButtonClickEvent(detailItemToUse, dataOpenModalModel);

            // Hiển thị modal chi tiết
            detailModal.style.display = 'block';
        }
    } catch (error) {
        console.error('Lỗi khi tải dữ liệu chi tiết:', error);
    }
}


function addActionButtonClickEvent(detailItemToUseModal, dataOpenModalModel) {
    const actionButton = document.getElementById('actionButton');
    actionButton.onclick = () => {
        if (detailItemToUseModal) {
            openDetailModalTable(detailItemToUseModal, dataOpenModalModel);
        }
    };
}


// Đóng modal khi nhấn vào biểu tượng đóng
document.getElementById('closeDetailModalTable').onclick = function() {
    document.getElementById('DetailModalTable').style.display = 'none';
}


// Hàm gọi API để cập nhật vị trí locationindex cho một danh sách máy
async function updateLocationIndex(updates) {
    try {
        const response = await fetch('machines-map/update-location-index', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updates) // Gửi danh sách cập nhật
        });

        if (!response.ok) throw new Error('Failed to update location index');

        const result = await response.json();
        toastr.success("Cập nhật thành công vị trí của máy!");
    } catch (error) {
        console.error('Error updating location index:', error);
        toastr.error("Cập nhật thất bại!");
    }
}


async function openDetailModalTable(detailItemToUseModal, dataOpenModalModel) {
    const detailModal = document.getElementById('DetailModalTable');
    const detailContent = detailModal.querySelector('.content-container-building-table');
    detailContent.innerHTML = ''; // Xóa nội dung hiện tại

    try {
        // Lấy dữ liệu từ API
        const response = await fetch(`machines-map/get-machines-by-location-index?building=${encodeURIComponent(detailItemToUseModal.building)}&zoneCode=${encodeURIComponent(detailItemToUseModal.new_location)}`);
        
        if (!response.ok) throw new Error('Network response was not ok');

        const detailDataTable = await response.json();
        
        // Tạo bảng
        const table = document.createElement('table');
        table.className = 'detail-table';

        // Thêm tiêu đề cho bảng
        const headerRow = document.createElement('tr');
        const headers = ['Index', 'Machine ID', 'Machine Name', 'Machine Tag', 'Building', 'Zone', 'Line', 'New Index'];

        headers.forEach(headerText => {
            const header = document.createElement('th');
            header.textContent = headerText;
            headerRow.appendChild(header);
        });
        table.appendChild(headerRow);

        const updates = []; // Danh sách cập nhật
        detailDataTable.forEach(machine => {
            const row = document.createElement('tr');
            const values = [
                machine.locationindex !== null ? machine.locationindex : 'Chưa Xác Định',
                machine.machine_id,
                machine.machine_name,
                machine.machine_tag,
                machine.building,
                machine.zone,
                machine.line
            ];

           
            // Thêm dữ liệu vào từng ô của hàng
            values.forEach(value => {
                const cell = document.createElement('td');
                cell.textContent = value;
                row.appendChild(cell);
            });

            // Thêm dropdown để chọn vị trí mới (1-26)
            const selectCell = document.createElement('td');
            const locationSelect = document.createElement('select');
            locationSelect.setAttribute('data-tag', machine.machine_tag); // Gán data-tag cho select
            for (let i = 1; i <= 26; i++) {
                const option = document.createElement('option');
                option.value = i;
                option.textContent = i;
                if (machine.locationindex === i) option.selected = true; // Giữ nguyên vị trí hiện tại
                locationSelect.appendChild(option);
            }
            selectCell.appendChild(locationSelect);
            row.appendChild(selectCell);

          
            table.appendChild(row);
        });

        // Thêm nút để cập nhật tất cả vị trí
        const updateAllButton = document.createElement('button');
        updateAllButton.textContent = 'Cập nhật tất cả';
        updateAllButton.className = 'update-all-button';
       
         updateAllButton.addEventListener('click', async () => {
            const updates = []; // Khởi tạo lại danh sách cập nhật
            const locationIndexes = new Set(); // Set để theo dõi các locationindex

            for (const machine of detailDataTable) {
                const selectElement = document.querySelector(`select[data-tag="${machine.machine_tag}"]`);
                let newIndex;

                if (selectElement) {
                    newIndex = selectElement.value || (machine.locationindex !== null ? machine.locationindex : 1);
                } else {
                    newIndex = machine.locationindex !== null ? machine.locationindex : 1; // Nếu không chọn, lấy giá trị hiện tại hoặc mặc định 1
                }

                // Kiểm tra trùng locationindex
                if (locationIndexes.has(newIndex)) {
                                       
                    toastr.warning(`Vị trí ${newIndex} đã sử dụng cho máy ${machine.machine_tag} !`);
                    return; // Dừng thực hiện và không gọi API
                }
                locationIndexes.add(newIndex); // Thêm newIndex vào Set

                //console.log(`Máy: ${machine.machine_tag}, Vị trí mới: ${newIndex}`); // Log để kiểm tra giá trị

                // Thêm vào danh sách cập nhật
                updates.push({ tag: machine.machine_tag, locationindex: newIndex });
            }

            //console.log('Danh sách cập nhật:', JSON.stringify(updates, null, 2)); // Log mảng updates

            if (updates.length > 0) {
                await updateLocationIndex(updates);
                await openDetailModal(detailItemToUseModal, dataOpenModalModel);
                openDetailModalTable(detailItemToUseModal, dataOpenModalModel); // Làm mới bảng sau khi cập nhật                             
                 
            } else {
                toastr.info("Không có cập nhật nào để thực hiện!");
            }
        });




        detailContent.appendChild(updateAllButton); // Thêm nút cập nhật tất cả
        detailContent.appendChild(table);
        detailModal.style.display = 'block'; // Hiển thị modal
    } catch (error) {
        console.error('Error fetching machine details:', error);
    }
}



function showDetails(item) {
    getMachineDetails(item);
}
// Hàm để lấy chi tiết máy theo Tag
async function getMachineDetails(item) {
    try {
        const url = `machines/details/${item.tag}`; 
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
function closeModalDetailmachine() {
    const modal = document.getElementById('machineDetailsModal');
    modal.style.display = 'none';
}