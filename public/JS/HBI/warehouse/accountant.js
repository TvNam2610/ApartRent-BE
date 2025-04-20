// const { text } = require("body-parser");

const baseUrl = "/warehouse/shippingMark/";
let dataExcel = []; 
let dataFileName = "";
let dataSheetName = "";
$(document).ready(async function () {
    var now = new Date();
    var month = (now.getMonth() + 1);
    var day = now.getDate();
    if (month < 10)
        month = "0" + month;
    if (day < 10)
        day = "0" + day;
    var today = now.getFullYear() + '-' + month + '-' + day;
    document.getElementById("findToDate").defaultValue = today;
    document.getElementById("findFromDate").defaultValue = today;
    DateChanged(today,today);
    loadDataTable();
    toastr.options = {
        "positionClass": "toast-bottom-right"
      };
});
async function uploadExcel() {
    if (window.FormData !== undefined) {
        LoadingShow();
        const file = document.getElementById('inputfilePlan').files[0];
        var dataJson = {};
        await file.arrayBuffer().then((res) => {
            let data = new Uint8Array(res);
            let workbook = XLSX.read(data, {
                type: "array"
            });
            let first_sheet_name = workbook.SheetNames[0];
            let worksheet = workbook.Sheets[first_sheet_name];
            dataJson = XLSX.utils.sheet_to_json(worksheet);
            let id =[];
            dataJson.forEach(function(item,index){
                let tt = 0;
                if(id.length != dataJson.length)
                for(var i=index; i < dataJson.length; i++){
                    if(dataJson[i]['po']==item['po'] && dataJson[i]['hbi_code']==item['hbi_code']  &&  dataJson[i]['date']==item['date']  && !check_arr(i, id)){
                        // console.log(i, id)
                        tt++;
                        dataJson[i].number = tt;
                        id.push(i);
                    }
                }
            });
        })
         
        if (typeof dataJson[0]["po"] != "undefined" && typeof dataJson[0]["hbi_code"] != "undefined" && typeof dataJson[0]["quantity_plan"] != "undefined") {
            $.ajax({
                url: baseUrl + 'planUpload',
                method: 'POST',
                data: {
                    'dataJson': dataJson
                },
                dataType: 'json',
                success: function (result) {
                    console.log(result);
                    let error=0;
                    let insert = 0;
                    let update = 0;
                    let replace = 0;
                    result.status.forEach (function (item, index) {
                        switch(item['plan_status']) {
                            case '0',0:
                                error += 1;
                                break;
                            case '1',1:
                                insert += 1;
                                break;
                            case '2',2:
                                update += 1;
                                break;
                            case '3',3:
                                replace += 1;
                                break;
                        }
                    })
                    
                    LoadingHide();
                    if(result.rs){
                        document.getElementById('inputfilePlan').files[0] = "";
                        document.getElementById('inputfilePlan').value = "";

                        if(error >0)
                        toastr.error(`Không thể insert ${error} bản ghi`);
                        if(insert >0){
                            toastr.success(`Insert ${insert} bản ghi mới thành công`);
                            loadDataTable();
                        }
                       
                        if(update >0)
                        toastr.success(`Update ${update} bản ghi thành công`);
                        if(replace >0)
                        toastr.success(`Replace ${replace} bản ghi thành công`);
                    }
                   

                    else
                    toastr.error(result.msg);

                    // document.getElementById('FilePo').value = "";
                }
            })
        } else {
            LoadingHide();
            toastr.error("File po sai định dạng");
            //document.getElementById('FilePo').value = "";
        }
    }
}

function check_arr(element,arr){
    let count = 0;
    for (let i = 0; i < arr.length; i ++){
        if (arr[i] === element)  {
            count ++;
            break
        }
    }
    return (count >0) ? true : false
}
function ExcelDateToJSDate(date) {
    return new Date(Math.round((date - 25569) * 86400 * 1000));
}
function FindFromDate(fromDate){
    var toDate = document.getElementById("findToDate").value;
    if(subDate(toDate,fromDate)<0){
        document.getElementById("findToDate").value = fromDate;
    }
    DateChanged(fromDate,toDate);
}
function FindToDate(toDate){
    var fromDate = document.getElementById("findFromDate").value;
    if(subDate(toDate,fromDate)<0){
        document.getElementById("findFromDate").value = toDate;
    }
    DateChanged(fromDate,toDate);
}
function subDate(date1,date2){
    var fromDate = new Date(date1);
    var toDate = new Date(date2);
    return (fromDate-toDate)/(24*60*60*1000)
}
function DateChanged(fromDate,toDate) {
    var selectTable =  document.getElementById("selectTable").value;
    $.ajax({
        url: baseUrl + 'findDateChanged',
        method: 'POST',
        data: {
            'fromDate': fromDate,'toDate':toDate,'select_table':selectTable
        },
        dataType: 'json',
        success: function (result) {
            var optionPO = "<option selected>All</option>";
            var optionvendor = "<option selected>All</option>";
            if (result.data.length > 0) {
                let mvendor =[];
                if(selectTable == 'plan'|| selectTable == 'total'||selectTable == 'addin'|| selectTable=='planError'){
                    result.data.forEach(function (item, index) {
                        if (item['po'] != null) {
                            optionPO += `<option class="chart_header_option" value=${item['po']}>${item['po']}</option>\n`;
                            
                            if(!mvendor.includes(item['vendor'])){
                                optionvendor += `<option class="chart_header_option" value="${item['vendor']}">${item['vendor']}</option>\n`;
                                mvendor.push(item['vendor']);
                            }
                        }
                    });
                }
                else if(selectTable =='scan'){
                    var po = [];
                    var pallet = [];
                    result.data.forEach(function (item, index) {
                        if(!po.includes(item['po'])){
                            optionPO += `<option class="chart_header_option" value=${item['po']}>${item['po']}</option>\n`;
                            po.push(item['po']);
                        }
                            if(!pallet.includes(item['pallet'])){
                            optionvendor += `<option class="chart_header_option" value="${item['pallet']}">${item['pallet']}</option>\n`;
                            pallet.push(item['pallet']);
                        }
                        
                    });
                }
            
            }
            document.getElementById('findPo').innerHTML = optionPO;
            document.getElementById('findvendor').innerHTML = optionvendor;
        }
    })
}

function findvendorChanged(obj) {
    var selectTable =  document.getElementById("selectTable").value;
    var fromDate =  document.getElementById("findFromDate").value;
    var toDate =  document.getElementById("findToDate").value;
    $.ajax({
        url: baseUrl + 'findvendorChanged',
        method: 'POST',
        data: {
            'vendor': obj,'select_table':selectTable,'fromDate':fromDate,'toDate':toDate
        },
        dataType: 'json',
        success: function (result) {
            var optionPO = "<option selected>All</option>";
            if (result.data.length > 0) {
                result.data.forEach(function (item, index) {
                    if (item['po'] != null) {
                        optionPO += `<option class="chart_header_option" value=${item['po']}>${item['po']}</option>\n`;
                    }
                });
            }
            document.getElementById('findPo').innerHTML = optionPO;
        }
    })
}
function findPoChanged(obj){
}
function changeSelectTable(obj){ 
    var fromDate =  document.getElementById("findFromDate").value;
    var toDate =  document.getElementById("findToDate").value;
    if(obj =="total"){
        DateChanged(fromDate,toDate);
        document.getElementById("form_checkAbnormal").innerHTML = `<label class="form-check-label" for="checkAbnormal">
        Lọc bản ghi bất thường
        </label>
        <input class="form-check-input" type="checkbox" onclick="checkedTotal()" checked ="true" value="1" id="checkAbnormal">`;
        document.getElementById("delete_all_plan").innerHTML = "";
        document.getElementById("titlevendor").innerHTML = "vendor:";
    }
    if(obj =="scan"){
        DateChanged(fromDate,toDate);
        document.getElementById("form_checkAbnormal").innerHTML = `<label class="form-check-label" for="checkAbnormal">
        Bảng scan chi tiết
        </label>
        <input class="form-check-input" type="checkbox"  value="1" id="checkAbnormal">`;
        document.getElementById('findvendor').innerHTML ="";
        document.getElementById("delete_all_plan").innerHTML = "";
        document.getElementById("titlevendor").innerHTML = "pallet:";

    }
    if(obj =="plan" || obj =="planError"){
        DateChanged(fromDate,toDate);
        document.getElementById("form_checkAbnormal").innerHTML ="";
        document.getElementById("delete_all_plan").innerHTML = "";
        document.getElementById("titlevendor").innerHTML = "vendor:";
        DateChanged(fromDate,toDate);
        if(obj =="plan"){
            document.getElementById("delete_all_plan").innerHTML =`<button type="button" class="btn btn-danger bnt-fil-download" onclick="deleteAllPlan()">
            <i class="fa-solid fa-trash-can"></i></button>`;
            document.getElementById("form_checkAbnormal").innerHTML = `<label class="form-check-label" for="checkAbnormal">
            Lọc theo vendor
            </label>
            <input class="form-check-input" type="checkbox" onclick="CheckerPlan()" value="1" id="checkAbnormal">`;
          
        }
        
        document.getElementById("titlevendor").innerHTML = "vendor:";

    }
    if(obj =="addin"){
        DateChanged(fromDate,toDate);;
        document.getElementById("titlevendor").innerHTML = "vendor:";
        document.getElementById("form_checkAbnormal").innerHTML ="";
        document.getElementById("delete_all_plan").innerHTML = "";

    }
}



function CheckerPlan() {
    var checkBox = document.getElementById('checkAbnormal').checked;
    if(checkBox){
        document.getElementById("delete_all_plan").innerHTML = "";
    }
    else{
        document.getElementById("delete_all_plan").innerHTML =`<button type="button" class="btn btn-danger bnt-fil-download" onclick="deletAllPlan()">
        <i class="fa-solid fa-trash-can"></i></button>`;
    }
}

function loadDataTable() {
    var fromDate =  document.getElementById("findFromDate").value;
    var toDate =  document.getElementById("findToDate").value;
    var vendor = document.getElementById("findvendor").value;
    var po = document.getElementById("findPo").value;
    var selectTable = document.getElementById("selectTable").value;
    var checkBox = false;
    if(selectTable=="plan" || selectTable=="total" || selectTable=="scan"){
        checkBox = document.getElementById('checkAbnormal').checked;
    }
    DateChanged(fromDate,toDate);
    $.ajax({
        url: baseUrl + 'LoadDataTable',
        method: 'POST',
        data: {
            'fromDate': fromDate,
            'toDate': toDate,
            'vendor': vendor,
            'po': po,
            'selectTable':selectTable,
            'checkBox':checkBox
        },
        dataType: 'json',
        success: function (result) {
            LoadingShow();
            var tableHeader="";
            var tableBody = "";
            switch(selectTable){
                case 'total':
                    {
                    tableHeader = `<th scope="col" class="listItem-header-actual">#</th>
                    <th scope="col" class="listItem-header-actual">PO</th>
                    <th scope="col"class="listItem-header-actual">Code</th>
                    <th scope="col" class="listItem-header-actual">Quantity plan</th>
                    <th scope="col" class="listItem-header-actual">Quantity actual</th>
                    <th scope="col" class="listItem-header-actual">Quantity confirm</th>
                    <th scope="col" class="listItem-header-actual">vendor</th>
                    <th scope="col" class="listItem-header-actual">date</th>
                    `;
                    var i =0;
                    dataExcel = [];
                    dataFileName = "Total table";
                    dataSheetName="Total data";
                    result.data.forEach(function (item, index) {
                        if (item["quantity_plan"] != item["quantity_actual"]||!checkBox) {
                            dataExcel.push({"PO":item["po"],
                                "Code":item["hbi_code"],
                                "Quantity plan":item["quantity_plan"],
                                "Lisence plates":item["license_plates"],
                                "Quantity plan":item["quantity_actual"],
                                "Quantity actual":item["quantity_actual"],
                                "Quantity confirm":item["quantity_confirm"],
                                "vendor":item["vendor"],
                                "date":formatDate(item["plan_date"],'yyyy-MM-dd')
                            });
                            i++;
                            tableBody += `<tr>
                            <td class="listItem-body-actual">${i}</th>
                            <td class="listItem-body-actual">${item["po"]}</td>
                            <td class="listItem-body-actual">${item["hbi_code"]}</td>
                            <td class="listItem-body-actual">${formatNumber(item["quantity_plan"])}</td>
                            <td class="listItem-body-actual">${formatNumber(item["quantity_actual"])}</td>
                            <td class="listItem-body-plan">
                                <!-- Button trigger modal -->
                                <div class="row">
                                <h class="quantityConfirmItem col-10" id="quantityConfirmItem${index}">${formatNumber(item["quantity_confirm"])}</h>
                                <a class="quntittModelOn col-2"  data-bs-toggle="modal" data-bs-placement="bottom" data-bs-target="#quantityComfirm" 
                                data-bookid='{"po":"${item["po"]}", "hbi_code":"${item["hbi_code"]}", "plan_date":"${item["plan_date"]}","quantityPlan":"${item["quantity_plan"]}","quantityActual":"${item["quantity_actual"]}","index":"${index}","quantity_confirm":"${item["quantity_confirm"]}"}'>
                                    <i class="fa-regular fa-pen-to-square"></i>
                                </a>
                                </div>
                            </td>
                            <td class="listItem-body-actual">${item["vendor"]}</td>
                            <td class="listItem-body-actual">${formatDate(item["plan_date"],'yyyy-MM-dd')}</td>
                            </tr>`;
                        }
                    });}
                    break;
                case 'scan':
                    if(!checkBox){
                        tableHeader = `<th scope="col" class="listItem-header-actual">#</th>
                        <th scope="col" class="listItem-header-actual">PO</th>
                        <th scope="col"class="listItem-header-actual">Code</th>
                        <th scope="col" class="listItem-header-actual">Quantity actual</th>
                        <th scope="col" class="listItem-header-actual">Unit</th>
                        <th scope="col"class="listItem-header-actual">Pallet</th>
                        <th scope="col"class="listItem-header-actual">Date</th>
                        `;
                        dataExcel = [];
                        dataFileName = "Scan table";
                        dataSheetName="Scan data";
                        result.data.forEach(function (item, index) {
                            dataExcel.push({"PO":item["po"],
                            "Code":item["hbi_code"], 
                            "Quantity actual":item["quantity_actual"],
                            "Unit":item["unit"],
                            "Pallet":item["pallet"],
                            "Date":formatDate(item["date"],'yyyy-MM-dd')
                        });
                            tableBody += `<tr>
                            <td class="listItem-body-actual">${index +1}</th>
                            <td class="listItem-body-actual">${item["po"]}</td>
                            <td class="listItem-body-actual">${item["hbi_code"]}</td>
                            <td class="listItem-body-actual">${formatNumber(item["quantity_actual"])}</td>
                            <td class="listItem-body-actual">${item["unit"]}</td>
                            <td class="listItem-body-actual">${item["pallet"]}</td>
                            <td class="listItem-body-actual">${formatDate(item["date"],'yyyy-MM-dd')}</td>

                            </tr>`;
                        });
                    }
                    else{
                        tableHeader = `<th scope="col" class="listItem-header-actual">#</th>
                    <th scope="col" class="listItem-header-actual">PO</th>
                    <th scope="col"class="listItem-header-actual">Code</th>
                    <th scope="col"class="listItem-header-actual">Pallet</th>
                    <th scope="col"class="listItem-header-actual">Lisence plates</th>
                    <th scope="col" class="listItem-header-actual">Quantity actual</th>
                    <th scope="col" class="listItem-header-actual">date</th>
                    <th scope="col" class="listItem-header-actual">Id employee</th>
                    `;
                    dataExcel = [];
                    dataFileName = "Scan table";
                    dataSheetName="Scan data";
                    result.data.forEach(function (item, index) {
                        dataExcel.push({"PO":item["po"],
                        "Code":item["hbi_code"],
                        "Pallet":item["pallet"],
                        "Lisence plates":item["license_plates"],
                        "Quantity actual":item["quantity_actual"],
                        "date":formatDate(item["date"],'yyyy-MM-dd hh:mm:ss'),
                        "Id employee":item["id_employee"]
                    });
                        tableBody += `<tr>
                        <td class="listItem-body-actual">${index +1}</th>
                        <td class="listItem-body-actual">${item["po"]}</td>
                        <td class="listItem-body-actual">${item["hbi_code"]}</td>
                        <td class="listItem-body-actual">${item["pallet"]}</td>
                        <td class="listItem-body-actual">${item["license_plates"]}</td>
                        <td class="listItem-body-actual">${formatNumber(item["quantity_actual"])}</td>
                        <td class="listItem-body-actual">${formatDate(item["date"],'yyyy-MM-dd hh:mm:ss')}</td>
                        <td class="listItem-body-actual">${item["id_employee"]}</td>
                        </tr>`;
                    });
                    }
                    
                    break;
                case 'plan':
                    
                    if(!checkBox){
                             tableHeader = `<th scope="col" class="listItem-header-actual">#</th>
                        <th scope="col" class="listItem-header-actual">Po release</th>
                        <th scope="col" class="listItem-header-actual">PO</th>
                        <th scope="col"class="listItem-header-actual">Code</th>
                        <th scope="col" class="listItem-header-actual">Location</th>
                        <th scope="col" class="listItem-header-actual">Quantity plan</th>
                        <th scope="col" class="listItem-header-actual">Unit</th>
                        <th scope="col" class="listItem-header-actual">Package quantity</th>
                        <th scope="col" class="listItem-header-actual">Vendor</th>
                        <th scope="col" class="listItem-header-actual">Date</th>
                        <th scope="col" class="listItem-header-actual">/</th>
                        `;
                        dataExcel = [];
                        dataFileName = "Plan table";
                        dataSheetName="Plan data";
                        result.data.forEach(function (item, index) {
                            
                            dataExcel.push({
                                "po_release":item["po_release"],"po":item["po"],
                                "hbi_code":item["hbi_code"],
                                "location":item["location"],
                                "quantity_plan":item["quantity_plan"],
                                "unit":item["unit"],
                                "package_quantity":item["package_quantity"],
                                "vendor":item["vendor"],
                                "date":formatDate(item["DATE"],'MM/dd/yyyy'),
                                "po_line_nbr":item["po_line_nbr"],
                                "status":""
                            });
                            tableBody += `<tr>
                            <td class="listItem-body-actual">${index+1}</th>
                            <td class="listItem-body-actual">${item["po_release"]}</td>
                            <td class="listItem-body-actual">${item["po"]}</td>
                            <td class="listItem-body-actual">${item["hbi_code"]}</td>
                            <td class="listItem-body-actual">${item["location"]}</td>
                            <td class="listItem-body-actual">${formatNumber(item["quantity_plan"])}</td>
                            <td class="listItem-body-actual">${item["unit"]}</td>
                            <td class="listItem-body-actual">${item["package_quantity"]}</td>
                            <td class="listItem-body-actual">${item["vendor"]}</td>
                            <td class="listItem-body-actual">${formatDate(item["DATE"],'yyyy-MM-dd')}</td>
                            <td class="listItem-body-actual">  
                            <button type="button" onclick=" deletePlan('${item["po"]}','${item["hbi_code"]}','${formatDate(item["DATE"],'yyyy-MM-dd')}','${item["number"]}')" class="like btn btn-danger bnt-delete_item">Xoá</button>
                            </td>
                            </tr>`;
                        });
                    }
                    else{
                        tableHeader = `<th scope="col" class="listItem-header-actual">#</th>
                        <th scope="col" class="listItem-header-actual">Date</th>
                        <th scope="col" class="listItem-header-actual">Vendor</th>
                        <th scope="col"class="listItem-header-actual">Total</th>
                        `;
                        dataExcel = [];
                        dataFileName = "Plan table";
                        dataSheetName="Plan data";
                        let total = 0;
                        result.data.forEach(function (item, index) {
                            total+=item["total"];
                            dataExcel.push({
                                "Date":item["DATE"],
                                "Vendor":item["vendor"],
                                "Total":item["total"]
                            });
                            tableBody += `<tr>
                            <td class="listItem-body-actual">${index+1}</th>
                            <td class="listItem-body-actual">${formatDate(item["DATE"],'yyyy-MM-dd')}</td>
                            <td class="listItem-body-actual">${item["vendor"]}</td>
                            <td class="listItem-body-actual">${item["total"]}</td>
                            </tr>`;
                        });
                        dataExcel.push({
                            "Date":"Grand total",
                            "Vendor":"",
                            "Total":total
                        });
                        tableBody += `<tr>
                        <td class="listItem-body-actual"></th>
                        <td class="listItem-body-actual">Grand total</td>
                        <td class="listItem-body-actual"></td>
                        <td class="listItem-body-actual">${total}</td>
                        </tr>`;

                    }
                        break;
                case 'planError':
                    tableHeader = `<th scope="col" class="listItem-header-actual">#</th>
                    <th scope="col" class="listItem-header-actual">Po release</th>
                    <th scope="col" class="listItem-header-actual">PO</th>
                    <th scope="col"class="listItem-header-actual">Code</th>
                    <th scope="col" class="listItem-header-actual">Location</th>
                    <th scope="col" class="listItem-header-actual">Quantity plan</th>
                    <th scope="col" class="listItem-header-actual">Unit</th>
                    <th scope="col" class="listItem-header-actual">Package quantity</th>
                    <th scope="col" class="listItem-header-actual">Vendor</th>
                    <th scope="col" class="listItem-header-actual">Date</th>
                    `;
                    dataExcel = [];
                    dataFileName = "Plan error table";
                    dataSheetName="Plan error data";
                    result.data.forEach(function (item, index) {
                        dataExcel.push({
                        "po_release":item["po_release"],"po":item["po"],
                        "hbi_code":item["hbi_code"],
                        "location":item["location"],
                        "quantity_plan":item["quantity_plan"],
                        "unit":item["unit"],
                        "package_quantity":item["package_quantity"],
                        "vendor":item["vendor"],
                        "date":formatDate(item["DATE"],'MM/dd/yyyy'),
                        "po_line_nbr":item["po_line_nbr"],
                        "status":""
                    });
                        tableBody += `<tr>
                        <td class="listItem-body-actual">${index+1}</th>
                        <td class="listItem-body-actual">${item["po_release"]}</td>
                        <td class="listItem-body-actual">${item["po"]}</td>
                        <td class="listItem-body-actual">${item["hbi_code"]}</td>
                        <td class="listItem-body-actual">${item["location"]}</td>
                        <td class="listItem-body-actual">${formatNumber(item["quantity_plan"])}</td>
                        <td class="listItem-body-actual">${item["unit"]}</td>
                        <td class="listItem-body-actual">${formatNumber(item["package_quantity"])}</td>
                        <td class="listItem-body-actual">${item["vendor"]}</td>
                        <td class="listItem-body-actual">${formatDate(item["DATE"],'yyyy-MM-dd')}</td>
                        </tr>`;
                    });
                    break;
                case 'addin':
                        {tableHeader = `<th scope="col" class="listItem-header-actual">#</th>
                        <th scope="col" class="listItem-header-actual">PO-NUMBER</th>
                        <th scope="col"class="listItem-header-actual">PO-RELEASE</th>
                        <th scope="col" class="listItem-header-actual">PO-CODE</th>
                        <th scope="col" class="listItem-header-actual">LINE-FC1</th>
                        <th scope="col" class="listItem-header-actual">PO-LINE-NBR1</th>
                        <th scope="col" class="listItem-header-actual">ITEM-DETAIL1</th>
                        <th scope="col" class="listItem-header-actual">REC-QTY1</th>
                        <th scope="col" class="listItem-header-actual">REC-UOM1</th>
                        <th scope="col" class="listItem-header-actual">BIN</th>
                        <th scope="col" class="listItem-header-actual">Vendor</th>
                        `;
                        let LINE_FC1 = "A";
                        let po_Code = "DIRM";
                        let conpany = "3844";
                        dataExcel = [];
                        dataFileName = "ADD-IN";
                        dataSheetName="ADDIN";
                        result.data.forEach(function (item, index) {	
                            dataExcel.push({"COMPANY":conpany,
                                            "PO-NUMBER":item["po"],
                                            "PO-RELEASE":item["po_release"],
                                            "PO-CODE":po_Code,
                                            "LINE-FC1":LINE_FC1,
                                            "PO-LINE-NBR1":item["po_line_nbr"],
                                            "ITEM-DETAIL1":item["hbi_code"],
                                            "REC-QTY1":item["quantity"],
                                            "REC-UOM1":item["unit"],
                                            "LOCATION1":"",
                                            "NAME1":"",
                                            "BIN":item["location"],
                                            "Column1":"",
                                            "Results from PO30.1":"",
                                            "vendor":item["vendor"],
                                        });
                            tableBody += `<tr>
                            <td class="listItem-body-actual">${index+1}</th>
                            <td class="listItem-body-actual">${item["po"]}</td>
                            <td class="listItem-body-actual">${item["po_release"]}</td>
                            <td class="listItem-body-actual">${po_Code}</td>
                            <td class="listItem-body-actual">${LINE_FC1}</td>
                            <td class="listItem-body-actual">${item["po_line_nbr"]}</td>
                            <td class="listItem-body-actual">${item["hbi_code"]}</td>
                            <td class="listItem-body-actual">${formatNumber(item["quantity"])}</td>
                            <td class="listItem-body-actual">${item["unit"]}</td>
                            <td class="listItem-body-actual">${item["location"]}</td>
                            <td class="listItem-body-actual">${item["vendor"]}</td>
                            </tr>`;
                        });}
                    break;
            }
            document.getElementById('tableHeader').innerHTML = tableHeader;
            document.getElementById('tableBody').innerHTML = tableBody;
            LoadingHide();
        }
    })
}
function deleteAllPlan(){
    var fromDate =  document.getElementById("findFromDate").value;
    var toDate =  document.getElementById("findToDate").value;
    var vendor = document.getElementById("findvendor").value;
    var po = document.getElementById("findPo").value; 
    $.ajax({
        url: baseUrl + 'deleteAllPlan',
        method: 'POST',
        data: {
            'data': {"po":po,
            'vendor': vendor,
            'fromDate': fromDate,
            'toDate': toDate}
        },
        dataType: 'json',
        success: function (result) {
            toastr.remove();
            if(result.rs){
                loadDataTable()
                toastr.success(result.msg);
            }
            else{
                toastr.error(result.msg);
            }
        }}
    )
    
}
function deletePlan(po,hbi_code,date,number){
    $.ajax({
        url: baseUrl + 'deletePlan',
        method: 'POST',
        data: {
            'data': {"po":po,
            'hbi_code': hbi_code,
            'date':date,
            'number': number}
        },
        dataType: 'json',
        success: function (result) {
            toastr.remove();
            if(result.rs){
                loadDataTable()
                toastr.success(result.msg);
            }
            else{
                toastr.error(result.msg);
            }
        }
    });
}

var confirmData;
var myModal = document.getElementById('quantityComfirm');
myModal.addEventListener('show.bs.modal', function () {
    var bookdata = $(event.relatedTarget).data('bookid');
    document.getElementById('modalQuantityPlan').innerHTML = bookdata["quantityPlan"]
    document.getElementById('modalQuantityActual').innerHTML = bookdata["quantityActual"]
    var quantityConfirm = document.getElementById(`quantityConfirmItem${bookdata["index"]}`).innerHTML; 
    if(quantityConfirm != "null") {
        document.getElementById('modalQuantityConfirm').value = document.getElementById(`quantityConfirmItem${bookdata["index"]}`).innerHTML;
    }
    else{
        document.getElementById('modalQuantityConfirm').value="";
    }
    
    document.getElementById("modalQuantityConfirm").focus();
    confirmData = {
        "po": bookdata["po"],
        "hbi_code": bookdata["hbi_code"],
        "plan_date": bookdata["plan_date"],
        "quantity_confirm":bookdata["quantity_confirm"]
    }
 
})
$("#quantityComfirm" ).on('shown.bs.modal', function(){
    document.getElementById("modalQuantityConfirm").focus();
})

function saveQuantity(){
    var quantityComfirm = (document.getElementById('modalQuantityConfirm').value).replaceAll(',','');
    toastr.remove();
    toastr.success(quantityComfirm);
    if(parseInt(quantityComfirm)>=0){
        if( confirmData["quantity_confirm"] != quantityComfirm){
           
            confirmData["quantity_confirm"] = quantityComfirm;
            const d = new Date(confirmData["plan_date"]);
            $.ajax({
                url: baseUrl + 'updateQuantity',
                method: 'POST',
                data: {
                    'data': confirmData
                },
                dataType: 'json',
                success: function (result) {
                    if (result.rs) {
                        toastr.success(result.msg);
                         $('#quantityComfirm').modal('hide');
                        loadDataTable();
                    }
                    else{
                        toastr.error(result.msg);
                    }   
                }
            })
        }
    }
    else{toastr.error("Bạn cần nhập vào qunatity confirm là số tự nhiên");}
}

function formatDate(date,format) {
    if (typeof date == 'string') {
        date1 = new Date(date);
        var month = date1.getMonth() + 1 < 10 ? `0${date1.getMonth()+1}` : date1.getMonth() + 1;
        var day = date1.getDate() < 10 ? `0${date1.getDate()}` : date1.getDate();
        var year = date1.getFullYear();
        var hour = date1.getHours();
        var minute = date1.getMinutes();
        var second = date1.getSeconds();
         console.log(format)
        switch (format){
            
            case 'yyyy-MM-dd':
                console.log(format)
                return `${date1.getFullYear()}-${month}-${day}`;
            case 'MM/dd/yyyy':
                console.log(format)
                return `${month}/${day}/${year}`;
            case 'yyyy-MM-dd hh:mm:ss':
                console.log('fd')
                return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
        }
    }
   
   
}
async function  DownloadReport(){
    loadDataTable();
    exportToExcel(dataFileName,dataSheetName,dataExcel);
}
function exportToExcel(fileName, sheetName, data) {
    let wb;
    let ws;
    wb = XLSX.utils.book_new();
    ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, `${fileName}.xlsx`);
}
function formatNumber(data){
    let num = data;
    let ar = [];
    let res ="";
    
    while(num/1000 > 0){
        let pd = num % 1000;
        
        let a = "";
        if(pd<100 && pd >10 && num >=1000)
            a = "0"+Math.round(pd*100)/100;
        else if(pd<10 && num >=1000)
            a = "00"+Math.round(pd*100)/100;
        else 
            a = Math.round(pd)
        num = Math.round(num/1000 - pd/1000)
        // ar.push(Math.round(pd*100)/100);
        ar.push(a);
        
    }
    ar.reverse().forEach(function (item, index) {
        if(index+1 < ar.length) {
            res += item + ",";
        }
        else
        res += item;
    })
    return res;
}
