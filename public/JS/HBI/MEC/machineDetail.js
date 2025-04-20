document.addEventListener("DOMContentLoaded", function() {
    function getQueryParam(param) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(param);
    }

    function formatDate(dateString) {
        if (!dateString) return 'Đang update';

        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'Đang update'; // Kiểm tra ngày hợp lệ

        // Định dạng giờ, ngày, tháng, năm
        const optionsTime = {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        };

        const optionsDate = {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        };

        // Lấy giờ, phút, giây
        const time = date.toLocaleTimeString('vi-VN', optionsTime);

        // Lấy ngày, tháng, năm
        const formattedDate = date.toLocaleDateString('vi-VN', optionsDate);

        return `${time} ${formattedDate}`;
    }

    function moveMapPoint(building) {
        const mapPoint = document.querySelector('.machine_map_point');        
        // Gửi yêu cầu để lấy dữ liệu từ API
        fetch('/mechanic/getbuilding-location')
            .then(response => response.json())
            .then(data => {
                //console.log('Dữ liệu nhận được từ API:', data); // Xem cấu trúc dữ liệu

                if (data.rs) {
                    const buildingDataArray = data.data;
                    //console.log('Danh sách tòa nhà:', buildingDataArray); // Xem danh sách các tòa nhà
                    // Tìm kiếm đối tượng tòa nhà khớp trong mảng
                    let found = false; // Biến để kiểm tra xem tòa nhà có được tìm thấy không
                    for (const item of buildingDataArray) {
                        if (item.name.trim().toLowerCase() === building.trim().toLowerCase()) {
                            //console.log('Tòa nhà khớp:', item); // Xem dữ liệu của tòa nhà khớp
                            const position = {
                                top: `${item.top}%`,
                                left: `${item.left}%`
                            };
                            mapPoint.style.top = position.top;
                            mapPoint.style.left = position.left;
                            found = true; // Đánh dấu tòa nhà đã được tìm thấy
                            break; // Ngừng lặp khi tìm thấy
                        }
                    }

                    if (!found) {
                        console.warn('Không tìm thấy tòa nhà:', building);
                        mapPoint.style.top = '0%';
                        mapPoint.style.left = '0%';
                    }
                } else {
                    console.error('Lỗi lấy dữ liệu vị trí:', data.msg); // Xem thông báo lỗi từ API
                    mapPoint.style.top = '0%';
                    mapPoint.style.left = '0%';
                }
            })
            .catch(error => {
                console.error('Lỗi khi gọi API vị trí:', error); // Xem lỗi khi gọi API
                mapPoint.style.top = '0%';
                mapPoint.style.left = '0%';
            });
    }

    function calculateTimeInMinutes(date1, date2) {
        const diff = new Date(date2).getTime() - new Date(date1).getTime();
        return Math.floor(diff / (1000 * 60)); // Quy đổi thành phút
    }

    function calculateTimeStats(locationData) {
        let timeactual = 0;
        let timelose = 0;

        if (locationData.rs && Array.isArray(locationData.data)) {                                    
            const data = locationData.data;
            data.sort((a, b) => new Date(a.updated_at) - new Date(b.updated_at));

            for (let i = 0; i < data.length - 1; i++) {
                const entry = data[i];
                const nextEntry = data[i + 1];

                const timeDiff = calculateTimeInMinutes(entry.updated_at, nextEntry.updated_at);
                const buildingName = entry.building.trim().toLowerCase();

                if (['mechanic workshop a', 'mechanic workshop b'].includes(buildingName)) {
                    timelose += timeDiff;
                } else if (['production workshop a', 'production workshop b', 'production workshop c'].includes(buildingName)) {
                    timeactual += timeDiff;
                }
                //console.log(`From ${entry.building} to ${nextEntry.building} - Time difference: ${timeDiff} minutes`);

            }

            //console.log(`Thời gian thực tế: ${timeactual} phút`);
            //console.log(`Thời gian mất: ${timelose} phút`);

            // Cập nhật giao diện với thời gian máy sử dụng
            const totalTime = locationData.data.length ? calculateTimeInMinutes(locationData.data[0].updated_at, locationData.data[locationData.data.length - 1].updated_at) : 0;
           const usageTimePercentage = totalTime > 0 ? Math.min(100, (timelose / totalTime) * 100) : 0;   // time cho vào kho

            const downtimePercentage = totalTime > 0 ? Math.min(100, (timeactual / totalTime) * 100) : 0;   // time đang sản xuất

            // console.log(`Tổng thời gian: ${totalTime} phút`);
            // console.log(`Thời gian máy sử dụng (percentage): ${usageTimePercentage.toFixed(2)}%`);
            // console.log(`Thời gian máy hỏng (percentage): ${downtimePercentage.toFixed(2)}%`);

            
            // document.getElementById('usage-time-percentage').textContent = `${usageTimePercentage.toFixed(2)}%`;
            // document.getElementById('usage-time-bar').style.width = `${usageTimePercentage.toFixed(2)}%`;

            document.getElementById('downtime-percentage').textContent = `${downtimePercentage.toFixed(2)}%`;
            document.getElementById('downtime-bar').style.width = `${downtimePercentage.toFixed(2)}%`;
 
        } else {
            console.error('Dữ liệu lịch sử vị trí không hợp lệ:', locationData);
        }
    }

    

    const machineId = getQueryParam('id');
    if (machineId) {
        fetch(`/mechanic/get_machine_by_id/${machineId}`)
            .then(response => response.json())
            .then(data => {
                //console.log(data);  // Xem dữ liệu trả về từ API
                if (data.rs) {
                    const machineData = data.data;
                    if (machineData) {
                        document.getElementById('brand').textContent = machineData.manufacturer || 'Không có thông tin';
                        document.getElementById('model').textContent = machineData.model || 'Không có thông tin';
                        document.getElementById('tag').textContent = machineData.tag || 'Không có thông tin';
                        document.getElementById('serial').textContent = machineData.serial || 'Không có thông tin';
                        document.getElementById('detail').textContent = machineData.name || 'Không có thông tin';
                        document.getElementById('status').textContent = machineData.status === "1" ? "Online" : "Offline";

                        document.getElementById('building').textContent = machineData.building || 'Không có thông tin';
                        document.getElementById('zone').textContent = machineData.zone || 'Không có thông tin';
                        document.getElementById('location').textContent = machineData.location || 'Không có thông tin';
                        document.getElementById('area').textContent = machineData.remarks || 'Không có thông tin';

                        document.getElementById('last-building').textContent = machineData.building || 'Đang update';
                        document.getElementById('last-zone').textContent = machineData.zone || 'Đang update';
                        document.getElementById('last-location').textContent = machineData.new_location || 'Đang update';
                        document.getElementById('last-area').textContent = machineData.remarks || 'Đang update';
                        document.getElementById('last-updated-at').textContent = formatDate(machineData.updated_at) || 'Đang update';

                        // Di chuyển thẻ điểm trên bản đồ
                        moveMapPoint(machineData.building || 'Chưa xác định');
 
                        // Fetch lịch sử vị trí
                        //console.log(machineData.tag)
                        fetch(`/mechanic/get_machinelocation_old/${machineData.tag}`)
                            .then(response => response.json())
                            .then(locationData => {
                                //console.log(locationData);  
                                calculateTimeStats(locationData); // Gọi hàm tính toán thời gian

                                if (locationData.rs && Array.isArray(locationData.data)) {                                    

                                    const locationHistory = document.querySelector('.machine_detail_content_location_history');
                                    //locationHistory.innerHTML = ''; // Clear existing content
                                    const minUpdatedAt = Math.max(...locationData.data.map(entry => new Date(entry.updated_at).getTime()));
                                    locationData.data.forEach(entry => {
                                        const historyDiv = document.createElement('div');
                                        historyDiv.className = 'location_history';
                                        const entryUpdatedAt = new Date(entry.updated_at).getTime();
                                        const color = entryUpdatedAt === minUpdatedAt ? '#27ae60' : '#3498db';
                                        const icon = entryUpdatedAt === minUpdatedAt ? 'arrow_back' : 'arrow_upward';
                                      
                                        historyDiv.innerHTML = `
                                            <p>Building : ${entry.building || 'Chưa xác định'}, Zone : ${entry.zone || 'Chưa xác định'}, Location : ${entry.location || 'Chưa xác định'}, Area : ${entry.remarks || 'Chưa xác định'}</p>
                                            <span>${formatDate(entry.updated_at || 'Chưa xác định')}</span></p>
                                            <span class="material-symbols-outlined" style="font-size: 2.5em; color:${color}">
                                                ${icon}
                                            </span>
                                        `;

                                        locationHistory.appendChild(historyDiv);
                                    });

                                } else {
                                    console.error('Dữ liệu lịch sử vị trí không hợp lệ:', locationData);
                                }
                            })
                            .catch(error => console.error('Lỗi khi gọi API lịch sử vị trí:', error));
                    } else {
                        console.error('Dữ liệu máy không được xác định.');
                    }
                } else {
                    console.error('Lỗi:', data.msg);
                }
            })
            .catch(error => console.error('Lỗi khi gọi API:', error));
    } else {
        console.error('ID máy không được cung cấp');
    }
});