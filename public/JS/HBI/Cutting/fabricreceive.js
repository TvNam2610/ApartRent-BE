/*
    Author: TuyenNV
    DateTime: 
*/

// #region System variable
const baseUrl = "/cutting/fabric-receive/";
const userLogin = JSON.parse(localStorage.getItem("user"));
var wh_display = (userLogin.dept == Enum_Department.Warehouse || userLogin.position == "Admin") ? "" : "display-none";
var ccd_display = (userLogin.dept == Enum_Department.Cutting || userLogin.position == "Admin") ? "" : "display-none";
const statusList = [
    {
        index: 1, value : 'Active'
    },
    {
        index: 2, value : 'Done'
    },
    {
        index: 3, value : 'Canceled'
    },
    {
        index: 0, value : 'All'
    }
]

const warehouseStatusList = [
    {
        index: 0, value : 'Prepared'
    },
    {
        index: 1, value : 'Done'
    },
    {
        index: 2, value : 'Not yet'
    },
    {
        index: 3, value : 'All'
    }
]

const filterLocalStorage = "cutting_fr_filter";

// #endregion

// #region System Method

// Refresh data
function Refresh() {
    window.location.href = '/cutting/fabric-receive';
}

// Menu
$(".fr-navbar li:nth-child(1)").addClass("active");

// Configure some plugin to work properly
$.fn.modal.Constructor.prototype._enforceFocus = function () { };

$(document).on('click', '.dropdown-menu', function (e) {
    e.stopPropagation();
});

$(document).on('click', '.day', function (e) {
    $('.datepicker').css('display', 'none')
    e.preventDefault();
    e.stopPropagation();
})

// For select2 open then focus on input search
$(document).on('select2:open', () => {
    if (!event.target.multiple) {
        let ele = $('.select2-container--open .select2-search--dropdown .select2-search__field').last()[0];
        if (ele)
            ele.focus()
    }
});

// Load khi tải trang xong
$(document).ready(function () {
    // init time picker
    let date = new Date().toLocaleDateString("vi-VN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    });
    let html = `<option value='${date};${date}' selected>Hôm nay</option>`;
    for (let i = 0; i < Timepickers.length; i++) {
        let ele = Timepickers[i];
        // html += `<option value='${ele.value}' ${i == 0 ? 'selected' : ''}>${ele.text}</option>`
		html += `<option value='${ele.value}'>${ele.text}</option>`
    }
    $("#txtFilterTime").append(html);

    // init datepicker for all input date type
    $('.isDate').datepicker({
        format: "dd/mm/yyyy",
        clear: true
    });

    // get list marker data
    if(localStorage.getItem(filterLocalStorage) != null){
        let filter = JSON.parse(localStorage.getItem(filterLocalStorage));
        $("#txtFilterPlant").val(filter ? filter.filterPlant : '');
        $("#txtFilterGroup").val(filter ? filter.filterGroup : '');
        $("#txtFilterStatus").val(filter ? filter.filterStatus : '');
        $("#txtFilterWarehouseStatus").val(filter ? filter.filterWarehouseStatus : '');
        
        if(filter.viewType){
            $("#cbViewType").attr('checked', true);
        }else{
            $("#cbViewType").attr('checked', false);
            $(`#txtFilterWeek`).val(filter ? filter.filterWeek : new Date().getWeekNumber());
        }

        displayFilter();
    }
    changeViewType();
    getListMarkerData();
})

function deleteFilter(obj){
    let filter = JSON.parse(localStorage.getItem(filterLocalStorage));
    filter[obj.key] = '';
    localStorage.setItem(filterLocalStorage, JSON.stringify(filter));
    Refresh();
}

function displayFilter(){
    if(localStorage.getItem(filterLocalStorage) != null){
        let filter = JSON.parse(localStorage.getItem(filterLocalStorage));
        let statusVal = statusList.filter(x => x.index == filter.filterStatus)[0].value;
        let warehouseStatusVal = warehouseStatusList.filter(x => x.index == filter.filterWarehouseStatus)[0].value;
        let filterPlant = filter.filterPlant ? `<span class="label label-info mr-2" style="cursor: pointer;" onclick="deleteFilter({key: 'filterPlant'})">${filter.filterPlant}<i class="fa fa-times"></i></span>` : "";
        let filterGroup = filter.filterGroup ? `<span class="label label-info mr-2" style="cursor: pointer;" onclick="deleteFilter({key: 'filterGroup'})">${filter.filterGroup}<i class="fa fa-times"></i></span>` : "";
        let filterStatus = filter.filterStatus ? `<span class="label label-info mr-2" style="cursor: pointer;" onclick="deleteFilter({key: 'filterStatus'})">${statusVal}<i class="fa fa-times"></i></span>` : "";
        let filterWarehouseStatus = filter.filterWarehouseStatus ? `<span class="label label-info mr-2" style="cursor: pointer;" onclick="deleteFilter({key: 'filterWarehouseStatus'})">${warehouseStatusVal}<i class="fa fa-times"></i></span>` : "";
        let weekVal = filter.filterWeek ? `<span class="label label-info mr-2" style="cursor: pointer;" onclick="deleteFilter({key: 'filterWeek'})">WK: ${filter.filterWeek}<i class="fa fa-times"></i></span>` : "";

        $("#filter-area").html(filterPlant + filterGroup + filterStatus + filterWarehouseStatus + weekVal);
    }
}

function changeViewType() {
    let weekVal = new Date().getWeekNumber();
    if(localStorage.getItem(filterLocalStorage) != null){
        let filter = JSON.parse(localStorage.getItem(filterLocalStorage));
        if(!filter.viewType){
            weekVal = filter.filterWeek != '' ? filter.filterWeek : new Date().getWeekNumber();
        }
    }
    
    $(`#dateValue`).css("display", "none");
    $(`#weekValue`).css("display", "none");
    let viewType = $(`#cbViewType`).is(":checked");
    if (!viewType) {
        $(`#dateValue`).css("display", "none");
        $(`#weekValue`).css("display", "block");
        $(`#txtFilterWeek`).focus();
        $(`#txtFilterWeek`).val(weekVal);
    }
    else {
        $(`#dateValue`).css("display", "block");
        $(`#weekValue`).css("display", "none");
    }
}

// Setup change time to 5 option
function changeDateFilter() {
    let val = this.event.target.value;
    if (val.toString() == "5")
        $("#filterTime").css("display", "block");
    else
        $("#filterTime").css("display", "none");
}

function getListMarkerData() {
    let filterPlant = $("#txtFilterPlant").val();
    let filterGroup = $("#txtFilterGroup").val();
    let filterWarehouseStatus = $("#txtFilterWarehouseStatus").val();
    let filterStatus = $("#txtFilterStatus").val();
    let filterDate = '';
    let filterWeek = '';
    let viewType = $("#cbViewType").is(":checked"); // Select date or week
    if (viewType) {
        filterDate = $("#txtFilterTime").val();
        if (filterDate.toString() == "5") {
            filterDate = $("#txtFilterFrom").val() + ";" + $("#txtFilterTo").val();
        }
    }
    else {
        filterWeek = $("#txtFilterWeek").val();
    }

    let action = baseUrl + 'get-marker-data';
    let datasend = {
        filterPlant: filterPlant,
        filterGroup: filterGroup,
        filterStatus: filterStatus,
        filterDate: filterDate,
        filterWeek: filterWeek,
        filterWarehouseStatus: filterWarehouseStatus,
        viewType: viewType
    };

    localStorage.setItem(filterLocalStorage, JSON.stringify(datasend));
    displayFilter();
    LoadingShow();
    PostDataAjax(action, datasend, function (response) {
        LoadingHide();
        if (response.rs) {
            let data = response.data;
            let html = "";

            for (let i = 0; i < data.length; i++) {
                let ele = data[i];
                let isCanceled = ele.cancel_date ? "background: #fbc8c4" : "";
                // add row to table
                  // <td style="vertical-align: middle">
                    //     <span class="txtTime" id="action-time-${ele.id}"></span>
                    // </td>
                html += `<tr class='tr-${ele.id}' style='${isCanceled}'>
                    <td>${ele.id}</td>
					<td>${ele.isParentTicket == 0 ? '' : '<span class="label label-danger mr-2">YCT</span>'}</td>
                    <td>${ele.receive_date}</td>
                    <td>${ele.receive_time}</td>
                    <td>${ele._group}</td>
                    <td>${ele.cut_date}</td>
                    <td id="call-date-${ele.id}">
                        ${ele.marker_call_date == undefined ? "" : ele.marker_call_date}
                    </td>
                    <td>
                        ${ele.cancel_date != undefined ? `<div class='rounded-circle white' id='marker-circle-${ele.id}'></div>`
                        : ele.marker_call_by == undefined ? `<div class='rounded-circle red' id='marker-circle-${ele.id}'></div>`
                            : `<div class='rounded-circle green' id='marker-circle-${ele.id}'></div>`
                    }  
                    </td>
                    <td>
                        ${ele.cancel_date != undefined ? `<div class='rounded-circle white' id='wh-circle-${ele.id}'></div>`
                        : (ele.wh_prepare == '0' && ele.wh_confirm_by == undefined) ? `<div class='rounded-circle yellow' id='wh-circle-${ele.id}'></div>`
                            : ele.wh_confirm_by != undefined ? `<div class='rounded-circle green' id='wh-circle-${ele.id}'></div>`
                                : `<div class='rounded-circle red' id='wh-circle-${ele.id}'></div>`
                    }
                    </td>
                    <td>
                        ${ele.cancel_date != undefined ? `<div class='rounded-circle white' id='ccd-circle-${ele.id}'></div>`
                        : ele.ccd_confirm_by != undefined && ele.ccd_status == 1 ? `<div class='rounded-circle green' id='ccd-circle-${ele.id}'></div>`
                            : ele.ccd_confirm_by != undefined && ele.ccd_status == 0 ? `<div class='rounded-circle yellow' id='ccd-circle-${ele.id}'></div>`
                                : `<div class='rounded-circle red' id='ccd-circle-${ele.id}'></div>`
                    }  
                    </td> 
                    <td>
                        ${ele.cancel_date != undefined ? `<div class='rounded-circle white' id='issue-circle-${ele.id}'></div>`
                        : ele.issue_date == undefined ? `<div class='rounded-circle red' id='issue-circle-${ele.id}'></div>`
                            : `<div class='rounded-circle green' id='issue-circle-${ele.id}'></div>`
                    }  
                    </td>
                    <td>
                        ${ele.cancel_reason != undefined ? ele.cancel_reason : ele.note}
                    </td>
					<td>
                        ${ele.wh_note ? ele.wh_note : ''}
                    </td>
                    <td>
                        ${ele.cancel_date == undefined || userLogin.position == "Admin"? 
                            `<div>
                            <button class='btn btn-sm btn-primary' data-groupId='${ele.id}' onclick='printTicket(${ele.id})'>Print</button>
                            <button class='btn btn-sm btn-primary' data-groupId='${ele.id}' onclick='OpenCancelModal(${ele.id})'>Cancel</button>
                            <a class='btn btn-sm btn-primary ${ccd_display}' href="/cutting/fabric-receive/marker-update?group=${ele.id}">Marker</a>
                            <a class='btn btn-sm btn-primary ${ccd_display}' href="/cutting/fabric-receive/scan-marker-data-detail?group=${ele.id}">CCD</a>
                            <button class='btn btn-sm btn-primary ${wh_display}' data-groupId='${ele.id}' onclick='issue(${ele.id})'>ISSUE</button>
                            <a class='btn btn-sm btn-primary ${wh_display}' href="/cutting/fabric-receive/marker-data-detail?group=${ele.id}">WH</a>
                            </div>`  
                            : ''}
                    </td>
                </tr>`;
            }

            $("#fabric-plan-table-body").html('').append(html);

            $("#lbSumMarkerData").text(data.length);
            $("#lbLastestUpdate").text(data.length > 0 ? data[0].marker_call_date : 0);

            // for (let i = 0; i < data.length; i++) {
            //     let ele = data[i];
            //     // checking marker was called then continue counting if called
            //     let totalMinutes = 0;
            //     let now = new Date();
            //     if (ele.marker_call_date != undefined && ele.ccd_confirm_date == undefined) {
            //         var callDate = new Date(ele.marker_call_date);
            //         var nextDay = callDate.addDays(1); // 6:00 next day from call day
            //         if (now > nextDay) {
            //             var days = now.getDate() - callDate.getDate();
            //             var counterTime = now - callDate;
            //             totalMinutes = Math.round(counterTime / (1000 * 60)) - 480 * days; // 480 = 8 * 60 from 22h previous day to 06h next day
            //         }
            //         else {
            //             var maxCallDate = new Date(callDate.formatDateMMDDYYYY() + " 22:00:00"); // 22:00
            //             if (now > maxCallDate) {
            //                 var counterTime = maxCallDate - callDate;
            //                 totalMinutes = Math.round(counterTime / (1000 * 60));
            //             }
            //             else {
            //                 var counterTime = now - callDate;
            //                 totalMinutes = Math.round(counterTime / (1000 * 60));
            //             }
            //         }
            //         RunTime(ele.id, totalMinutes);
            //     }
            //     else {
            //         var counterTime = new Date(ele.ccd_confirm_date) - new Date(ele.marker_call_date);
            //         let totalMinutes = Math.round(counterTime / (1000 * 60));
            //         $("#action-time-" + ele.id).text(totalMinutes);
            //     }
            // }
        }
        else {
            toastr.error(response.msg, "Thất bại");
        }
    });
}

function downloadMarkerData() {
    let filterPlant = $("#txtFilterPlant").val();
    let filterGroup = $("#txtFilterGroup").val();
    let filterWarehouseStatus = $("#txtFilterWarehouseStatus").val();
    let filterStatus = $("#txtFilterStatus").val();
    let filterDate = '';
    let filterWeek = '';
    let viewType = $("#cbViewType").is(":checked"); // Select date or week
    if (viewType) {
        filterDate = $("#txtFilterTime").val();
        if (filterDate.toString() == "5") {
            filterDate = $("#txtFilterFrom").val() + ";" + $("#txtFilterTo").val();
        }
    }
    else {
        filterWeek = $("#txtFilterWeek").val();
    }

    let action = baseUrl + 'download-marker-data';
    let datasend = {
        filterPlant: filterPlant,
        filterGroup: filterGroup,
        filterStatus: filterStatus,
        filterDate: filterDate,
        filterWeek: filterWeek,
        filterWarehouseStatus: filterWarehouseStatus
    };

    LoadingShow();
    fetch(action, {
        method: 'POST',
        body: JSON.stringify(datasend),
        headers: {
            'Content-Type': 'application/json'
        },
    }).then(function (resp) {
        return resp.blob();
    }).then(function (blob) {
        LoadingHide();
        return download(blob, GetTodayDate() + "_Demand_Fabric_Ticket.xlsx");
    });
}

function downloadRollData() {
    let filterPlant = $("#txtFilterPlant").val();
    let filterGroup = $("#txtFilterGroup").val();
    let filterWarehouseStatus = $("#txtFilterWarehouseStatus").val();
    let filterStatus = $("#txtFilterStatus").val();
    let filterDate = '';
    let filterWeek = '';
    let viewType = $("#cbViewType").is(":checked"); // Select date or week
    if (viewType) {
        filterDate = $("#txtFilterTime").val();
        if (filterDate.toString() == "5") {
            filterDate = $("#txtFilterFrom").val() + ";" + $("#txtFilterTo").val();
        }
    }
    else {
        filterWeek = $("#txtFilterWeek").val();
    }

    let action = baseUrl + 'download-roll-data';
    let datasend = {
        filterPlant: filterPlant,
        filterGroup: filterGroup,
        filterStatus: filterStatus,
        filterDate: filterDate,
        filterWeek: filterWeek,
        filterWarehouseStatus: filterWarehouseStatus
    };

    LoadingShow();
    fetch(action, {
        method: 'POST',
        body: JSON.stringify(datasend),
        headers: {
            'Content-Type': 'application/json'
        },
    }).then(function (resp) {
        return resp.blob();
    }).then(function (blob) {
        LoadingHide();
        return download(blob, GetTodayDate() + "_Roll_Data.xlsx");
    });
}

function uploadExcel() {
    var e = event;
    var fileName = e.target.files[0].name;
    $('.fileUploadName').text(fileName);

    if (window.FormData !== undefined) {

        var fileUpload = $("#fileFabricReceiveUpload").get(0);
        var files = fileUpload.files;

        // Create FormData object
        var fileData = new FormData();

        // Looping over all files and add it to FormData object
        for (var i = 0; i < files.length; i++) {
            fileData.append("file" + i, files[i]);
        }

        LoadingShow();
        $.ajax({
            url: baseUrl + 'upload-fabric-file',
            method: 'POST',
            contentType: false,
            processData: false,
            data: fileData,
            success: function (result) {
                LoadingHide();
                result = JSON.parse(result);
                if (result.rs) {
                    var listFiles = result.data
                    let html = '';
                    for (var i = 0; i < listFiles.length; i++) {
                        let ele = listFiles[i];

                        let options = "";
                        for (var j = 0; j < ele.sheets.length; j++) {
                            let item = ele.sheets[j];
                            if (item.sheetname == 'Upload-YCV')
                                options += "<option value =" + item.id + " selected>" + item.sheetname + "</option>";
                            else
                                options += "<option value=" + item.id + ">" + item.sheetname + "</option>";
                        }

                        html += `<tr id='tr-file-${ele.name}'>
                            <td class='fileName'>${ele.name}</td>
                            <td>
                                <select class='form-control sheetName'>${options}</select>
                            </td>
                            <td>
                                <input type='number' class='form-control headerRow' min='1' value='1' />
                            </td>
                            <td>
                                <button class="btn btn-outline-success" onclick="deleteRow({name: '${ele.name}'})"><i class="fa fa-close"></i></button>
                            </td>
                        </tr>`;
                    }

                    $("#file-table-body").append(html);
                }
                else {
                    toastr.error(result.msg);
                }
            },
            error: function (err) {
                LoadingHide();
                toastr.error(err.statusText);
            }
        });
    } else {
        toastr.error("FormData is not supported.");
    }
}

function deleteRow(file) {
    $(event.currentTarget).parent().parent().remove();
}

function saveUploadData() {

    let fileList = $(".fileName");
    let sheetList = $(".sheetName");
    let headerList = $(".headerRow");
    let listData = [];

    for (let i = 0; i < fileList.length; i++) {
        file = $(fileList[i]).text();
        sheet = $(sheetList[i]).val();
        header = $(headerList[i]).val();

        listData.push({
            file: file,
            sheet: sheet,
            header: header,
        });
    }

    if (listData.length <= 0) {
        toastr.warning("Không có tập tin cần upload", "Warning");
        return false;
    }

    // send to server
    let action = baseUrl + 'save-upload-data';
    let datasend = {
        listData: listData
    };
    LoadingShow();
    PostDataAjax(action, datasend, function (response) {
        LoadingHide();
        if (response.rs) {
            toastr.success(response.msg, "Thành công")
            $("#modalUploadData").modal('hide');
            getListMarkerData();
            $("#file-table-body").html('');
            $("#fileFabricReceiveUpload").val('');
        }
        else {
            toastr.error(response.msg, "Thất bại");
        }
    });
}

function uploadExcelReturnData() {
    if (window.FormData !== undefined) {

        var fileUpload = $("#fileFabricReturnUpload").get(0);
        var files = fileUpload.files;

        // Create FormData object
        var fileData = new FormData();

        // Looping over all files and add it to FormData object
        for (var i = 0; i < files.length; i++) {
            fileData.append("file" + i, files[i]);
        }

        LoadingShow();
        $.ajax({
            url: baseUrl + 'upload-fabric-file',
            method: 'POST',
            contentType: false,
            processData: false,
            data: fileData,
            success: function (result) {
                LoadingHide();
                result = JSON.parse(result);
                if (result.rs) {
                    var listFiles = result.data
                    let html = '';
                    for (var i = 0; i < listFiles.length; i++) {
                        let ele = listFiles[i];

                        let options = "";
                        for (var j = 0; j < ele.sheets.length; j++) {
                            let item = ele.sheets[j];
                            if (item.sheetname == 'upload-return')
                                options += "<option value =" + item.id + " selected>" + item.sheetname + "</option>";
                            else
                                options += "<option value=" + item.id + ">" + item.sheetname + "</option>";
                        }

                        html += `<tr id='tr-file-${ele.name}'>
                            <td class='fileName'>${ele.name}</td>
                            <td>
                                <select class='form-control sheetName'>${options}</select>
                            </td>
                            <td>
                                <input type='number' class='form-control headerRow' min='1' value='1' />
                            </td>
                        </tr>`;
                    }

                    $("#return-file-table-body").append(html);
                }
                else {
                    toastr.error(result.msg);
                }
            },
            error: function (err) {
                LoadingHide();
                toastr.error(err.statusText);
            }
        });
    } else {
        toastr.error("FormData is not supported.");
    }
}

function saveUploadReturnData() {

    let fileList = $(".fileName");
    let sheetList = $(".sheetName");
    let headerList = $(".headerRow");
    let listData = [];

    for (let i = 0; i < fileList.length; i++) {
        file = $(fileList[i]).text();
        sheet = $(sheetList[i]).val();
        header = $(headerList[i]).val();

        listData.push({
            file: file,
            sheet: sheet,
            header: header,
        });
    }

    if (listData.length <= 0) {
        toastr.warning("Không có tập tin cần upload", "Warning");
        return false;
    }

    // send to server
    let action = baseUrl + 'save-upload-return-data';
    let datasend = {
        listData: listData
    };
    LoadingShow();
    PostDataAjax(action, datasend, function (response) {
        LoadingHide();
        if (response.rs) {
            toastr.success(response.msg, "Thành công")
            $("#modalUploadReturnData").modal('hide');
            getListMarkerData();
            $("#file-table-body").html('');
            $("#fileFabricReturnUpload").val('');
        }
        else {
            toastr.error(response.msg, "Thất bại");
        }
    });
}

function issue(id) {
    swal("Bạn có chắc phiếu này đã được issue? R U sure this ticket has been issued?", {
        buttons: ["No", "Yes!"],
    })
        .then((willDelete) => {
            if (willDelete) {
                // Call to server
                LoadingShow();
                var action = baseUrl + 'issue-update';
                var datasend = {
                    id: id
                };

                PostDataAjax(action, datasend, function (response) {
                    LoadingHide();
                    if (response.rs) {
                        toastr.success(response.msg);
                        
                    }
                    else {
                        toastr.error(response.msg);
                    }
                });
            }
        });
}

// Interval array
var arrInterval = [];

// Action
function Action(actionType) {
    var ele = $(event.target);
    var groupId = "";
    var cancelReason = "";
    var cancelStep = "";
    if (actionType == Enum_Kanban_Action.Cancel) {
        groupId = $("#txtGroupId").val();
        cancelReason = $("#txtReason").val();
        cancelStep = $("#txtCancelStep").val();
    }
    else {
        groupId = ele.attr("data-groupId");
    }
    var actionTime = $("#action-time-" + groupId).text();

    // Call to server
    LoadingShow();
    var action = baseUrl + 'action';
    var datasend = {
        groupId: groupId,
        action: actionType,
        actionTime: actionTime,
        cancelReason: cancelReason,
        cancelStep: cancelStep
    };

    PostDataAjax(action, datasend, function (response) {
        if (response.rs) {
            LoadingHide();
            toastr.success(response.msg);

            switch (actionType) {
                case Enum_Kanban_Action.Cancel: {
                    $("#modalReason").modal('hide');
                    $("#txtReason").val('');
                    ClearTime(groupId);
                    $("#tr-" + groupId).remove();
                } break;
                case Enum_Kanban_Action.CCDSend: {
                    $("#tr-" + groupId).remove();
                } break;
                case Enum_Kanban_Action.WHSend: {
                    $("#tr-" + groupId).remove();
                } break;
            }
        }
        else {
            LoadingHide();
            toastr.error(response.msg);
        }
    });
}

//
function OpenCancelModal(groupId) {
    $("#txtGroupId").val(groupId);
    $("#modalReason").modal('show');
}

// Call click: Change CP and SP to red
function Call(groupId, message) {
    // var row = document.getElementById("tr-" + groupId); // find row to copy
    // var table = document.getElementById("table-kanban-body"); // find table to append to
    // var clone = row.cloneNode(true); // copy children too
    // $("#tr-" + groupId).remove();
    // if (message.newestAssWo.length > 0) {
    //     $(clone).insertAfter("#tr-" + message.newestAssWo);
    // }
    // else {
    //     table.prepend(clone);
    // }

    $("#call-date-" + groupId).text(message.callDate);
    ClearTime(groupId);
    RunTime(groupId, 0);
    CCDChange(groupId, "red");
    WHChange(groupId, "red");
}

// CCDSend click: Change CCD to yellow
function CCDSend(groupId) {
    CCDChange(groupId, "yellow");
}

// WHSend click: Change WH to yellow
function WHSend(groupId) {
    WHChange(groupId, "yellow");
}

// Cancel click: Change both CCD and WH to white
function Cancel(groupId) {
    // $("#call-date-" + groupId).text("");
    // ClearTime(groupId);
    // CCDChange(groupId, "white");
    // WHChange(groupId, "white");
    // $("#tr-" + groupId).remove();
    getListMarkerData();
}

// CCDChange change color
function CCDChange(groupId, color) {
    $("#ccd-circle-" + groupId).css("background", color);
}

// WHChange change color
function WHChange(groupId, color) {
    $("#wh-circle-" + groupId).css("background", color);
}

// IssueChange change color
function IssueChange(groupId, color) {
    $("#issue-circle-" + groupId).css("background", color);
}

function printTicket(groupId) {
    // form data

    // send to server
    let action = baseUrl + 'print-ticket';
    let datasend = {
        groupId: groupId
    };
    LoadingShow();
    PostDataAjax(action, datasend, function (response) {
        LoadingHide();
        if (response.rs) {
            window.open("/Assets/fabricPrint.html");
        }
        else {
            toastr.error(response.msg, "Thất bại");
        }
    });
}

// Count time run every 1 minute
function RunTime(groupId, clickTime) {
    var actionTime = $("#action-time-" + groupId);
    var time = clickTime;
    actionTime.text(time);
    if (time > 240) {
        actionTime.addClass("text-danger");
    }
    function Timer() {
        time++;
        actionTime.text(time);
        if (time > 240) {
            actionTime.addClass("text-danger");
        }
    }

    var myInterval = setInterval(Timer, 1000 * 60);
    arrInterval.push({ groupId: groupId, id: myInterval });
}

// Clear interval
function ClearTime(groupId) {
    var actionTime = $("#action-time-" + groupId);
    actionTime.text(0);
    actionTime.removeClass("text-danger");
    if (arrInterval.length > 0) {
        let intervalId = arrInterval.filter(function (x) {
            return x.groupId.toString() === groupId;
        });

        if (intervalId.length > 0) {
            clearInterval(intervalId[0].id);
        }
    }
}

// #endregion

// #region Socket

const socket = io();

socket.on('ccd-fabric-receive-action', (data) => {
    let message = data.message;
    let groupId = message.groupId;
    switch (message.actionType) {
        case Enum_Kanban_Action.Cancel:
            Cancel(groupId);
            break;
        case Enum_Kanban_Action.Call:
            //Call(groupId, message);
            getListMarkerData();
            break;
        case Enum_Kanban_Action.CCDSend:
            CCDSend(groupId);
            break;
        case Enum_Kanban_Action.WHSend:
            WHSend(groupId);
            break;
        case Enum_Kanban_Action.Issue:
            IssueChange(groupId, "green");
            break;
        default: Refresh(); break;
    }
});

// #endregion