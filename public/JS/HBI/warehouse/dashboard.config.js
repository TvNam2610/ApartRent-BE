let labels = ['0.5','1','1.5','2','2.5','3','3.5','4','4.5'];

let data = {
  labels: labels,
  datasets: [{
    label: 'ID:210625',
    data: [25, 30, 29, 28, 12, 32, 27,22,21],
    backgroundColor: [
      'rgba(255, 99, 132, 0.2)',
    ],
    borderColor: [
      'rgb(255, 99, 132)',
      'rgb(255, 159, 64)',
      'rgb(255, 205, 86)',
      'rgb(75, 192, 192)',
      'rgb(54, 162, 235)',
      'rgb(153, 102, 255)',
      'rgb(201, 203, 207)'
    ],
    borderWidth: 3
  },
  {
    label: 'ID:180067',
    data: [20, 35, 30, 25, 10, 33, 23,20 ,19],
    backgroundColor: [
      'rgba(155, 29, 132, 0.2)',
    ],
    borderColor: [
      'rgb(255, 99, 132)',
      'rgb(255, 159, 64)',
      'rgb(255, 205, 86)',
      'rgb(75, 192, 192)',
      'rgb(54, 162, 235)',
      'rgb(153, 102, 255)',
      'rgb(201, 203, 207)'
    ],
    borderWidth: 3
  },
]
};

let configChart1 = {
  type: 'line',
  data: data,
  options: {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        title: {
            display: true,
            font: {
                size: 30
            },
            text: 'Real time output box scanned'
        }
    },
    scales: {
      x: {
        min: 0,
        display: true, 
        beginAtZero: true, 
      },
      y: {
        min: 0,
        ticks: {
          beginAtZero: true,
          callback: function(value, index, ticks) {
            return `${value} pcs`;
          }
      },
      }
    }
  }
  };