google.charts.load("current", {packages:["timeline"]});
google.charts.setOnLoadCallback(drawChart);

    function drawChart() {
        for (let index = 1; index <13; index++) {
            var name = `example7.${index}`;
            var container = document.getElementById(name);
            var chart = new google.visualization.Timeline(container);
            var dataTable = new google.visualization.DataTable();
            
            dataTable.addColumn({ type: 'string', id: 'Room' });
            dataTable.addColumn({ type: 'string', id: 'Name' });
            dataTable.addColumn({ type: 'date', id: 'Start' });
            dataTable.addColumn({ type: 'date', id: 'End' });
            
            // Thêm một hàng dữ liệu "ẩn" để ép khung giờ từ 6h đến 14h
            dataTable.addRows([
              [ 'Magnolia Room', 'Wl1', new Date(0,0,0,6,8,0), new Date(0,0,0,8,0,0)],
              [ 'Magnolia Room', 'Wl2',    new Date(0,0,0,8,0,0), new Date(0,0,0,9,0,0)],
              [ 'Magnolia Room', 'Wl3',    new Date(0,0,0,9,0,0), new Date(0,0,0,10,0,0)],
              [ 'Magnolia Room', 'Wl4',         new Date(0,0,0,12,0,0), new Date(0,0,0,14,0,0)],
            ]);
            
            var options = {
              timeline: { 
                showRowLabels: false
              },
              avoidOverlappingGridLines: false,
              colors: ['red', '#e0440e', '#e6693e', '#ec8f6e', '#f3b49f', '#f6c7b6'],
              hAxis: {
                minValue: new Date(0, 0, 0, 6, 0, 0),  // Khởi đầu từ 6h
                maxValue: new Date(0, 0, 0, 14, 0, 0), // Kết thúc tại 14h
                format: 'H:mm'
              }
            };
            
            // Vẽ biểu đồ
            chart.draw(dataTable, options);            
        }
      }
