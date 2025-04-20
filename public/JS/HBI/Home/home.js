const base_url=''
let viewType =1;
let viewTypeDay = document.getElementById('viewTypeDay');
let viewTypeWeek = document.getElementById('viewTypeWeek');
let day = document.getElementById('Day');
let week = document.getElementById('Week');
week.style.display = 'none';
let dateFilter = document.getElementById('dateFilter');
dateFilter.value = new Date().toISOString().slice(0, 10);

//set xem mặc định theo ngày
setActiveButton('viewTypeDay');

//click tongle giữa theo ngày và theo tuần
viewTypeDay.addEventListener('click', function(){
    let day = document.getElementById('Day');
    let week = document.getElementById('Week');
    setActiveButton('viewTypeDay');
    viewType = 1;
    day.style.display='block'
    week.style.display='none'
})

//set giá trị tuần hiện tại khi click chọn xem theo tuần
viewTypeWeek.addEventListener('click', function(){
    let day = document.getElementById('Day');
    let week = document.getElementById('Week');
    setActiveButton('viewTypeWeek');
    viewType = 2; 
    day.style.display='none'
    week.style.display='block '
    document.getElementById('weekFilter').value = new Date().getWeekNumber()
    document.getElementById('weekFilter').max = new Date().getWeekNumber()
    // document.getElementById('toWeekFilter').value = new Date().getWeekNumber()
    document.getElementById('toWeekFilter').max = new Date().getWeekNumber()
})

function setActiveButton(activeId) {
    const buttons = document.querySelectorAll('.viewType');
    buttons.forEach(button => {
        if (button.id === activeId) {
            button.classList.add('active');
        } else {
            button.classList.remove('active');
        }
    });
}

//chart option
let options={
    maintainAspectRatio: false,
    scales: {
        x: {
          stacked: true,
          title: {
            display: true,
            text: 'Lines',
            font: {
                size: 14,
                weight: 'bold',
            },
            align: 'end',
   
          },
        },
        y: {
          stacked: true,
    
          min:0,
          title: {
            display: true,
            text: 'Dozens',
            font: {
                size: 14,
                weight: 'bold',
            },
            align: 'end',
          },
         
        },
   },
   
   plugins: {
    
    legend:{
        position: "top",
        align:'end',
      
    }
  }
}


toastr.options = {
    "closeButton": true,
    "newestOnTop": false,
    // "progressBar": true,
    "positionClass": "toast-bottom-right",
    // "preventDuplicates": false,
    // "onclick": null,
    // "showDuration": "300",
    // "hideDuration": "1000",
    "timeOut": "3000",
    // "extendedTimeOut": "1000",
    // "showEasing": "swing",
    // "hideEasing": "linear",
    // "showMethod": "fadeIn",
    // "hideMethod": "fadeOut"
  }

//lấy tổng output của nhà máy theo ngày
async function factoryOutputSummary(date) {
    try {
        const url = base_url +'home/factoryOutputSummary';
        const data = {
            date: date
        };
        const headers = {
            'Content-Type': 'application/json',
        };
        const response = await fetch(url, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(data)
        });
        const responseData = await response.json();
   
        factoryOutput = document.getElementById('factoryOutput');
        factoryOutput.innerText = Math.ceil(responseData[0].OUTPUT);

    } catch (error) {
        console.error('Error posting data:', error);
    }
}

async function FactoryEfficiency(date, viewType, weekValue, toWeek) {
    try {
        // Gửi yêu cầu đến API
        const url = base_url + 'home/getFactoryEfficiency';
        const data = {
            date: date,
            viewType: viewType,
            weekNumber: weekValue,
            toWeek: toWeek
        };
        const headers = { 'Content-Type': 'application/json' };
         
        const response = await fetch(url, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(data)
        });
        
        const responseData = await response.json();
               // console.log('API Response Data:', responseData);

        const result = responseData.result;
        
        // Xử lý kết quả dựa trên viewType
        const eff = result.map(item => item.factoryEff * 100);
        const eff1 = result.map(item => item.factoryEff1 * 100);
        const output = result.map(item => item.factoryOutput);
        
        let labels;
        if (viewType === 1) {
            // viewType === 1: Tính hiệu suất theo ngày
            labels = result.map(item => getDateDDMMYYYY(item.date));
            
            // Hiển thị hiệu suất của ngày cuối cùng
            if (eff.length > 0) {
                document.getElementById('FactoryEff').innerText = eff[eff.length - 1].toFixed(2) + '%';
            }else {
                document.getElementById('FactoryEff').innerText = '0%';
            }
            
        } else if (viewType === 2) {
            // viewType === 2: Tính hiệu suất theo tuần
            labels = toWeek === 0 
                ? result.map(item => getDateDDMMYYYY(item.date))
                : result.map(item => 'week ' + item.week);
              // Hiển thị hiệu suất tuần cuối cùng
            if (eff.length > 0) {
                factoryEffValue = eff[eff.length - 1].toFixed(2) + '%';
            } else {
                factoryEffValue = '0%'; // Đặt giá trị mặc định là 0%
            }
            document.getElementById('FactoryEff').innerText = factoryEffValue;
        }

        // Vẽ đồ thị
        fatoryGraph(labels, output, eff,eff1);
        

    } catch (error) {
        console.error('Error posting data:', error);
    }
}

//gọi api trẩ vệ hiệu suất , output theo wc
async function WorkCenterEfficiency(date,shift,typeFilter,weekValue) {
    try {
        let url = base_url +'home/getWorkCenterEff';
        let params = {
            date: date,
            typeFilter:typeFilter,
            shift:shift,
            weekNumber:weekValue
        };
        const headers = {
            'Content-Type': 'application/json',
        };
        let response = await fetch(url, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(params)
        });

        let responseData = await response.json();

        //vẽ biểu đồ theo ngày
        if(typeFilter==1){
            response = responseData.data.data;

            let data = []
            let lable = []
            let eff = []
             let eff1 = []
            for (let i = 0; i < response.length; i++) {
                data.push(Math.ceil(response[i].output));
                lable.push(response[i].workCenter);
                eff.push(response[i].Efficiency);
                eff1.push(response[i].Efficiency1);
            }
           
            draw_graph1(data, lable, eff, eff1)
            if (eff.length > 0) {
                 document.getElementById('FactoryEff').innerText = '0.00%';
            } else {
                document.getElementById('FactoryEff').innerText = '0.00%';
            }
        }

        //vẽ biểu đồ theo tuần
        else if(typeFilter==2){

            response = responseData.data;
            let data = []
            let lable = []
            let eff = []
            let eff1 = []
            for (let i = 0; i < response.length; i++) {
                data.push(Math.ceil(response[i].output));
                lable.push(response[i].workCenter);
                eff.push(response[i].Efficiency);
                eff1.push(response[i].Efficiency1);
            }
            
            draw_graph1(data, lable, eff,eff1)
            if (eff.length > 0) {
                 document.getElementById('FactoryEff').innerText = '0.00%';
            } else {
                document.getElementById('FactoryEff').innerText = '0.00%';
            }


        }
  
    } catch (error) {
        console.error('Error posting data:', error); 
    }

}

//vẽ biểu đồ kết hợp đường và cột thể hiện hiệu suất và output nhà máy
function fatoryGraph(labels,output,eff,eff1){
    const data = {
        labels: labels,
        datasets: [{
          type: 'bar',
          label: 'Factory Output',
          data: output,
          borderColor: 'rgba(39, 174, 96, 1)', // Màu xanh lá cây đậm
          backgroundColor: 'rgba(39, 174, 96, 0.7)',
          maxBarThickness: "50",
          yAxisID: 'y',
            order: 2,
          datalabels: {
                    anchor: 'end',
                    display: false,
                    align: 'top',
                    color: 'black',
                    formatter: Math.round, // Làm tròn số liệu hiển thị
                    offset: 5 // Khoảng cách giữa thanh và nhãn
                }
        },
        {
          type: 'line',
          label: 'Factory Efficiency',
        data: eff,
          fill: false,
          borderColor: 'rgba(75, 142, 192, 1)', // Màu xanh dương nhạt
          backgroundColor: 'rgba(75, 142, 192, 0.8)', // Nếu bạn muốn thêm màu nền cho đường
          yAxisID: 'y1',
            order: 1,
          datalabels: {
                    anchor: 'end',
                    align: 'top',
                    color: '#2980b9',
                    formatter: Math.round, // Làm tròn số liệu hiển thị
                    offset: 5 // Khoảng cách giữa thanh và nhãn
                }
        
        },
        {
                type: 'line',
                label: 'Efficiency Estimate',
                data: eff1, // Thay đổi giá trị 50 tùy theo giá bạn muốn cho đường màu vàng
                borderColor: 'rgba(255, 215, 0, 1)', // Màu vàng
                backgroundColor: 'rgba(255, 215, 0, 0.2)', // Màu nền trong suốt
                fill: false,
                yAxisID: 'y1',
            order: 0,
                 datalabels: {
                    anchor: 'end',
                    align: 'bottom',
                    color: '#e74c3c',
                    formatter: Math.round, // Làm tròn số liệu hiển thị
                    offset: 5 // Khoảng cách giữa đường và nhãn
                }
        }
        ]
      };

    const config = {
        type: 'scatter',
        data: data,
        plugins: [ChartDataLabels],

        options: {
            maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: 'Output (Dzs)',
                align: 'end',
            },
            },
            y1: {
                type: 'linear',
                display: true,
                position: 'right',
                title: {
                    display: true,
                    text: 'Efficiency (%)',
                    align: 'end',
                },
                min:0,
                max:100,
                grid: {
                    drawOnChartArea: true,
                },
            },
          }
        }
    };
      if (window.productionChart1) {
        window.productionChart1.destroy();
    }
    let ctx = document.getElementById('workcenter_output_chart');
    window.productionChart1 = new Chart(ctx, config);
}


//vẽ biểu đồ kết hợp đường và cột thể hiện hiệu suất và output theo workcenter
function draw_graph1(data,lable,Efficiency,Efficiency1) {
    var config = {
        data:{
            labels:lable,
            datasets:[
                {
                    type: 'bar',
                    label: 'Production',
                    data:data,
                    borderColor: 'rgba(39, 174, 96, 1)', // Màu xanh lá cây đậm
                    backgroundColor: 'rgba(39, 174, 96, 0.7)',
                    // borderWidth: 0,
                    order:2,
                    maxBarThickness: "50",
                    datalabels: {
                    anchor: 'end',
                    display: false,
                    align: 'top',
                    color: 'black',
                    formatter: Math.round, // Làm tròn số liệu hiển thị
                    offset: 5 // Khoảng cách giữa thanh và nhãn
                },
                      yAxisID: 'y',
                },

                {
                    type: 'line',
                    label: 'Efficiency',
                    data:Efficiency,
                    fill: false,
                    borderColor: 'rgba(75, 142, 192, 1)', // Màu xanh dương nhạt
                    backgroundColor: 'rgba(75, 142, 192, 0.8)', // Nếu bạn muốn thêm màu nền cho đường
                    order:1,
                    yAxisID: 'y1',
                    min: 0,
                    datalabels: {
                    anchor: 'end',
                    align: 'top',
                    color: '#2980b9',
                    formatter: Math.round, // Làm tròn số liệu hiển thị
                    offset: 5 // Khoảng cách giữa thanh và nhãn
                }
                },
                {
                    type: 'line',
                    label: 'Efficiency Estimate',
                    data: Efficiency1,
                    fill: false,
                    borderColor: 'rgba(255, 215, 0, 1)', // Màu vàng
                    backgroundColor: 'rgba(255, 215, 0, 0.2)', // Nếu bạn muốn thêm màu nền cho đường
                    order:1,
                    yAxisID: 'y1',
                    min: 0,
                   datalabels: {
                    anchor: 'end',
                    align: 'bottom',
                    color: '#e74c3c',
                    formatter: Math.round, // Làm tròn số liệu hiển thị
                    offset: 5 // Khoảng cách giữa đường và nhãn
                }
                }
    
            ],
        },
        plugins:  [ChartDataLabels], 
     
        options: {
            maintainAspectRatio: false,
            plugins: {
    
                legend:{
                    position: "top",
                    align:'center',
                    display:true
                }
            },
            scales: {
                x: {
                  stacked: true,
                  title: {
                    display: true,
                    text: 'workcenter',
                    font: {
                        size: 12,
                    },
                    align: 'end',
           
                  },
                },
                y: {
                  stacked: true,
            
                  min:0,
                  title: {
                    display: true,
                    text: 'dozens',
                    font: {
                        size: 12,
                      
                    },
                    align: 'end',
                  },
                  grid: {
                    drawOnChartArea: true,
                },
                },

                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    title: {
                        display: true,
                        text: 'Efficiency (%)',
                        align: 'end',
                    },
                    grid: {
                        drawOnChartArea: true,
                    },
                    beginAtZero: true,
                    min:0
                },
           },
        },
    };
    if (window.productionChart1) {
        window.productionChart1.destroy();
    }
    let ctx = document.getElementById('workcenter_output_chart');
    window.productionChart1 = new Chart(ctx, config);
};


function getDate(full_date){
    year = full_date.substr(0, 4);
    month = full_date.substr(5, 2);
    day = full_date.substr(8, 2);
    return date = year + month + day;
}

function getDateDDMMYYYY(full_date){
    year = full_date.substr(0, 4);
    month = full_date.substr(5, 2);
    day = full_date.substr(8, 2);
    return date = day +'/'+ month +'/'+ year;
}


pageLoad = async function () {
    LoadingShow();
    let full_date = document.getElementById('dateFilter').value;
    let shiftSelect = document.getElementById('shiftSelect').value;
    let weekValue = document.getElementById('weekFilter').value;
    let toWeek = document.getElementById('toWeekFilter').value;
    let area = document.getElementById('areaSelect').value;
    let date = getDate(full_date);

    if(area==0){

        if(toWeek!=='' && toWeek!=0 && Number(weekValue) > Number(toWeek)){
            toastr.warning("from week phải nhỏ hơn to week");
            return ;
        }
        await FactoryEfficiency(date,viewType,Number(weekValue),Number(toWeek));
    }
    else if(area==1){
         await WorkCenterEfficiency(date,shiftSelect,viewType,weekValue)
    }
    await factoryOutputSummary(date)
    LoadingHide();
}

pageLoad()

// document.getElementById('zone_select').addEventListener('change',getGroupSummary);
document.getElementById('btn_submit').addEventListener('click',pageLoad);

// document.getElementById('filter').addEventListener('click', function(e) {
//     var dropdownDiv = document.getElementById('dropdown-div');
//     // Kiểm tra trạng thái hiện tại của dropdownDiv
//     if (dropdownDiv.style.display === 'block') {
//         dropdownDiv.style.display = 'none'; // Nếu đang hiển thị, ẩn đi
//     } else {
//         dropdownDiv.style.display = 'block'; // Nếu đang ẩn, hiển thị
//     }
// });


// document.addEventListener('click', function(event) {
//     var dropdownDiv = document.getElementById('dropdown-div');
//     var toggleButton = document.getElementById('filter');
//     if (!dropdownDiv.contains(event.target) && !toggleButton.contains(event.target)) {
//         dropdownDiv.style.display = 'none';
//     }
// });

//lấy số thự tự tuần hiện tại
Date.prototype.getWeekNumber = function () {
    var d = new Date(Date.UTC(this.getFullYear(), this.getMonth(), this.getDate()));
    var dayNum = d.getUTCDay() || 7; // Get the day number, with Sunday being 7 instead of 0
    if (dayNum !== 1) { // Move the date to the nearest Monday
        d.setUTCDate(d.getUTCDate() + 1 - dayNum);
    }
    var yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    var startDay = yearStart.getUTCDay() || 7;
    if (startDay !== 1) { // Move the year start to the nearest Monday if it's not already
        yearStart.setUTCDate(yearStart.getUTCDate() + 1 - startDay);
    }
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
};


