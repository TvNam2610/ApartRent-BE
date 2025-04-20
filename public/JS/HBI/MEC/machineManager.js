
var baseUrl = "/mechanic/";
var machineArr = []; // danh sách machine
var modelArr = [] // danh sách model
var locationArr = [] // danh sách location
let pageIndex = 1 ;
let featureOptions = [];

// Refresh data
function refresh() {
    window.location.href = '/mechanic/machine';
}


$.fn.modal.Constructor.prototype._enforceFocus = function() {};

$(document).on('click', '.dropdown-menu', function (e) {
    e.stopPropagation();
});

$(document).on('click', '.day', function (e) {
    $('.datepicker').css('display', 'none')
    e.preventDefault();
    e.stopPropagation();
})


// Load khi tải trang xong
$(document).ready(async function () {
    $('#txtASMMachineType').select2({
        placeholder: "Select a machine type",
        allowClear: true,
        tags: true,
        width: '100%'
    })
    // select2
    $(".listSelect").select2({
        placeholder: "Select an option",
        tags: true,
        allowClear: true,
        width: '100%'
    });
    $(".listSelect_no_tag").select2({
        placeholder: "Select an option",
    
        allowClear: true,
        width: '100%'
    });

    $('.isDate').datepicker({
        format: "mm-dd-yyyy",
    });

    $('.modal').on('shown.bs.modal', function () {
        $(this).find('[autofocus]').focus();
    });

    // Reload page with current tab
    if(!localStorage.getItem('machineActiveTab'))
        localStorage.setItem('machineActiveTab', "#sewing-machine-panel");
    $("#machine-tab a").on('click', function(e){
        localStorage.setItem('machineActiveTab', $(e.currentTarget).attr('href'));
    });
    var activeTab = localStorage.getItem('machineActiveTab');
    if(activeTab){
        $(".mdl-tabs__panel").removeClass("is-active");
        $(".mdl-tabs__tab").removeClass("is-active");
        $(activeTab).addClass("is-active");
        let currentTab =  $(document.querySelector(`[href='${activeTab}']`));
        currentTab.click();
        currentTab.addClass('is-active');
    }


    // getAllMachine();
    // getAllLocation()
    getAllModel();

    // Bind select option for model select
    setTimeout(async () => {

        getKindOfMachine();
        if (machineArr.length > 0) {
            // let html = "<option value='' selected>Tất cả</option>";
            let html = "<option value=''>" +'Chọn 1 option'+ "</option>";
            for (let i = 0; i < machineArr.length; i++) {
                let ele = machineArr[i];
                html += "<option value='"+ele.name+"'>"+ele.name+"</option>";
            }
            $("#txtModelMachine, #txtUModelMachine").html('');
            $("#txtModelMachine, #txtUModelMachine").append(html);
            // $('#txtASMMachineType').html('');
            // $('#txtASMMachineType').append(html);


       
            html = "<option value=''>Tất cả</option>";
            for (let i = 0; i < machineArr.length; i++) {
                let ele = machineArr[i];
                html += "<option value='"+ele.id+"'>"+ele.name+"</option>";
            }
 
            $("#txtFilterMachine").html('');
            $("#txtFilterMachine").append(html);


        //   $('#txtASMMachineType').val('');
        //    await getKindOfMachine(txtASMMachineType.value.trim())
        //    await getModelByMachineType()

           
            
        }
    }, 300)
})


function DropDownListModel(list, selector){


    selector.html('');
    let html = "";
    for(let i = 0; i < list.length; i++){
      
            let ele = list[i];
            html += "<option value='"+ele.id+"'>"+ ele.model+ "</option>";
    }
    selector.append(html);
   
}

function pageIndexChange(Index){
    pageIndex = Index;
    getAllSewingMachine(pageIndex)
}

function nextPage(){
    pageIndex = pageIndex + 1;
    getAllSewingMachine(pageIndex)
}
function prevPage(){
    pageIndex = pageIndex - 1;
    getAllSewingMachine(pageIndex)
}

document.getElementById('pageSize').addEventListener('change', function() {
    getAllSewingMachine();
});

$(document).ready(function() {
    // Khi modal được mở
    $('#modalAddModel').on('shown.bs.modal', function () {
        $.ajax({
            url: baseUrl + 'getAllFeatures',
            method: 'GET',
            success: function(response) {
                if (response.rs) {
                    // Tạo các checkbox cho tính năng
                    let checkboxes = response.data.map(feature => {
                        return `
                            <div class="form-check">
                                <input class="form-check-input" type="checkbox" name="featureCheckbox" id="feature${feature.id}" value="${feature.id}">
                                <label class="form-check-label" for="feature${feature.id}">
                                    ${feature.feature}
                                </label>
                            </div>
                        `;
                    }).join('');
                    $('#featureContainer').html(checkboxes);
                } else {
                    toastr.error(response.msg, "Lỗi");
                }
            },
            error: function() {
                toastr.error("Lỗi kết nối", "Lỗi");
            }
        });
    });
});

/*
    SEWING MACHINE
*/
function getAllSewingMachine(){

    let tag = $("#txtFilterSMTag").val() ?  $("#txtFilterSMTag").val().trim('') : '';
    let location = $("#txtFilterLocation").val() ? $("#txtFilterLocation").val().trim('') : '';
    let model = $("#txtFilterModel").val() ? $("#txtFilterModel").val().trim('') : '';
    let status = $("#txtFilterStatus").val().trim('');
    let loaimay = $("#txtFilterSMType").val() ? $("#txtFilterSMType").val().trim(''):'';
    
    let pageSize = $("#pageSize").val() ? $("#pageSize").val() : 200;
    let action = baseUrl + 'getMachinePaging';
    let datasend = {

        tag: tag,
        Location: location,
        model: model,
        status: status,
        loaimay:loaimay,
        pageIndex: pageIndex,
        pageSize: pageSize
      
    };
    LoadingShow();
    PostDataAjax(action, datasend, function (response) {
        LoadingHide();
        if(response.rs){
            let data = response.data.data;
            let totalPage = response.data.totalPage;

            const maxPagesToShow = 8;
            const startPage = Math.max(1, pageIndex - Math.floor(maxPagesToShow / 2));
            const endPage = Math.min(totalPage, startPage + maxPagesToShow - 1);
          

            let pagination_ul = $('#pagination_ul');
            let li_list = "";
            if(pageIndex!=1){
                li_list+=`  <li class="page-item" onclick= "prevPage()">
                                <a class="page-link"  aria-label="Previous">
                                <span aria-hidden="true">&laquo;</span>
                                <span class="sr-only">Previous</span>
                                </a>
                            </li>
                        `
            }
       

            for (let i = startPage; i <= endPage; i++) {
                if (i == pageIndex) {
                    li_list += `<li class="page-item active"><a class="page-link" onclick="pageIndexChange(`+i+`)">`+i+`</a></li>`;
                } else {
                    li_list += `<li class="page-item"><a class="page-link" onclick="pageIndexChange(`+i+`)">`+i+`</a></li>`;
                }
               
            }
            if(pageIndex!=totalPage){
            li_list+=`  <li class="page-item" onclick= "nextPage()">
                            <a class="page-link"  aria-label="Previous">
                            <span aria-hidden="true">&raquo;</span>
                            <span class="sr-only">Next</span>
                            </a>
                        </li>
                    `
            }


     
            pagination_ul.html('');
            pagination_ul.html(li_list);

            let html = "";
            for (let i = 0; i < data.length; i++) {
                let ele = data[i];
                html += "<tr>"
                         + "<td width='5%'>"+ ele.RowNumber +"</td>"
                        + "<td width='10%'>"+ ele.tag +"</td>"
                        + "<td width='10%'>"+ ele.manufacturer +"</td>"
                        + "<td width='10%'>"+ ele.serial +"</td>"
                        + "<td width='15%'>"+ ele.model +"</td>"
                        + "<td width='10%'>"+ ele.model_thucte +"</td>"
                        + "<td width='10%'>"+ ele.name +"</td>"
                        + "<td width='10%'>"+ ele.location +"</td>"
                        // + "<td width='10%'>"+ formatDDMMYYHHMMSS(ele.updated_at) +"</td>"
                        + "<td width='10%'>"+ ele.updated_by +"</td>"
                        // + "<td width='10%'>"+ ele.bin +"</td>"
                 
                        // + "<td width='10%' style='background-color: "+ (ele.status == 1 ? "#1ee81e" : ele.status == 2 ? "#fd0d0d" : "yellow") +"'>"+ (ele.status == 1 ? "Good" : ele.status == 2 ? "Error" : "Repairing") +"</td>"
                        + "<td width='5%' >" +(ele.status == 1 ? "Good" : ele.status == 2 ? "Error" : "Repairing")+"</td>"


                        + `<td width='5%'>
                                <a href='javascript:void(0)' onclick='getSewingMachineDetail("${ele.id}")'><i class='fa fa-edit' style='font-size: 14px'></i></a>
                                <a href='/mechanic/machineDetail?id=${ele.id}'><i class='fa fa-eye' style='font-size: 14px'></i></a>                                
                           
                            </td>`
                        + "</tr>";
            }
            $("#sewing-machine-table-body").html('');
            $("#sewing-machine-table-body").html(html);
            $("#sewing-machine-count").text("(" + data.length + ")");
        }
        else{
            $("#sewing-machine-table-body").html('');
            toastr.error(response.msg, "Thất bại");
        }
    });
}    

// add machine 
function addSewingMachine(){
    let serialNo =  $("#txtASMSerial");   //* ok
    let tag =  $("#txtASMTag");  //* ok
    let model =  $("#txtASMMachineModel");
    let type= $("#txtASMType") 
    let mecLocation =  $("#txtASMLocation");
    let brand = $("#txtASMBrand")
    let status =  $("#txtASMStatus");


    if (!CheckNullOrEmpty(model, "Model không được để trống"))
        return false;
    if (!CheckNullOrEmpty(type, "Kiểu máy không được để trống"))
        return false;
    if (!CheckNullOrEmpty(serialNo, "Serial máy không được để trống"))
        return false;
    if (!CheckNullOrEmpty(tag, "Tag máy không được để trống"))
        return false;

    let action = baseUrl + 'add_machine';

    let datasend = {
        serialNo: serialNo.val(),
        tag: tag.val(),

        model: model.val(),
        mecLocation: mecLocation.val(),
        type:type.val(),
        brand:brand.val(),

        status: status.val(),
        username:localStorage.getItem('username'),
    };
    console.log(" dữ liệu đã send",datasend)

 
  
    PostDataAjax(action, datasend, function (response) {
        // LoadingHide();
        if(response.rs){
            toastr.success("Thành công", "Thêm thành công");
            getAllSewingMachine();
        }
        else{
            // Hiển thị thông báo không có quyền xóa
            toastr.error(response.msg || 'Bạn không có quyền thêm bản ghi này!', 'Lỗi', {
                timeOut: 3000,
                progressBar: true,
                closeButton: true,
            });
        }
    });
}



// download machine
function downloadSewingMachine() {
    LoadingShow();
    let tag = $("#txtFilterSMTag").val() ?  $("#txtFilterSMTag").val().trim('') : '';
    let location = $("#txtFilterLocation").val() ? $("#txtFilterLocation").val().trim('') : '';
    let model = $("#txtFilterModel").val() ? $("#txtFilterModel").val().trim('') : '';
    let status = $("#txtFilterStatus").val().trim('');
    let loaimay = $("#txtFilterSMType").val() ? $("#txtFilterSMType").val().trim(''):'';
    
    let pageSize = 0;
    let action = baseUrl + 'download_machine';
    let datasend = {

        tag: tag,
        Location: location,
        model: model,
        status: status,
        loaimay:loaimay,
        pageIndex: 1,
        pageSize: pageSize
      
    };

    fetch(action, {
            method: 'POST',
            body: JSON.stringify(datasend),
            headers: {
                'Content-Type': 'application/json'
        },
    }).then(function (resp) {
        // Kiểm tra phản hồi
        if (!resp.ok) {
            LoadingHide(); // Ẩn loading khi có lỗi
            // Hiển thị thông báo không có quyền xóa
            toastr.error('Bạn không có quyền tải bản ghi này!', 'Lỗi', {
                timeOut: 3000,
                progressBar: true,
                closeButton: true,
            });
            return;
        }
        console.log(resp);
        return resp.blob();
    }).then(function (blob) {
        // Chỉ tiếp tục nếu nhận được blob
        if (blob) {
            LoadingHide();
            return download(blob, GetTodayDate() + "_machine.xlsx");
        }
        
    });
}


/*
    MODEL
*/
function getAllModel(){
    let keyword =  $("#txtModel").val();
    let machine = $("#txtMachineType").val();

    let action = baseUrl + 'getMachineModel';
    let datasend = {
        model: keyword,
        machineType: machine
    };
    LoadingShow();
    PostDataAjax(action, datasend, function (response) {
        LoadingHide();
        if(response.rs){
            let data = response.data;
            let html = "";
            modelArr=data;
            for (let i = 0; i < data.length; i++) {
                let ele = data[i];
                html += "<tr>"
                        + "<td width='5%'>"+ (i+1) +"</td>"
                        + "<td width='10%'>"+ ele.model +"</td>"                       
                        + "<td width='10%'>"+ ele.machine_type +"</td>"
                        + "<td width='10%'>"+ ele.abb +"</td>"
                        + "<td width='20%'>"+ '- '+(ele.features.split(',').join('<br>- ')) +"</td>"
                        + "<td width='10%'>"+ ele.updated_by +"</td>"
                        + "<td width='20%'>"+ formatDDMMYYHHMMSS(ele.updated_at) +"</td>"
                        + `<td width='5%'>
                                <a href='javascript:void(0)' onclick='getModelDetail(${ele.id})'>
                                    <i class='fa fa-edit' style='font-size: 14px'></i>
                                </a>
                                <a href='javascript:void(0)' onclick='deleteModel(${ele.id})'>
                                    <i class='fa fa-trash' style='font-size: 14px; color: red;'></i>
                                </a>
                            </td>`
                        + "</tr>";
            }
            $("#model-table-body").html('');
            $("#model-table-body").html(html);
            $("#model-count").text("(" + data.length + ")");


            DropDownListModel(data,$(".list-model"))
           
        }
        else{
            toastr.error(response.msg, " ");
        }
    });
}    


// download model
async function downloadModel() {
    try {
        LoadingShow(); // Hiển thị loading

        let keyword = $("#txtModel").val();
        let action = baseUrl + 'machineModel/download';
        let datasend = {
            keyword: keyword === "" ? "" : keyword
        };

        // Gửi yêu cầu đến server
        const resp = await fetch(action, {
            method: 'POST',
            body: JSON.stringify(datasend),
            headers: {
                'Content-Type': 'application/json'
            }
        });

        // Kiểm tra phản hồi
        if (!resp.ok) {
            LoadingHide(); // Ẩn loading khi có lỗi
            toastr.error('Bạn không có quyền tải bản ghi này!', 'Lỗi', {
                timeOut: 3000,
                progressBar: true,
                closeButton: true,
            });
            return;
        }

        // Nhận và kiểm tra blob
        const blob = await resp.blob();
        if (blob) {
            LoadingHide(); // Ẩn loading sau khi nhận blob
            return download(blob, GetTodayDate() + "_model.xlsx");
        } else {
            LoadingHide(); // Ẩn loading nếu không nhận được blob
            toastr.error('Không có dữ liệu để tải!', 'Lỗi', {
                timeOut: 3000,
                progressBar: true,
                closeButton: true,
            });
        }
    } catch (error) {
        // Xử lý lỗi nếu có
        LoadingHide();
        console.error('Lỗi khi tải file:', error);
        toastr.error('Đã xảy ra lỗi khi tải file!', 'Lỗi', {
            timeOut: 3000,
            progressBar: true,
            closeButton: true,
        });
    }
}




// add machine 
function addModel() {
    let name = $("#txtModelName");
    let machine = $("#txtModelMachine");
    let des = $("#txtModelDes");
    let username = localStorage.getItem("username");
    let selectedFeatures = $("input[name='featureCheckbox']:checked").map(function () {
        return $(this).val();
    }).get(); // Lấy giá trị của tất cả các checkbox được chọn

    // Chuyển đổi mảng thành chuỗi phân cách bởi dấu phẩy
    let featureDetails = selectedFeatures.length ? selectedFeatures.join(',') : '';

    // console.log("Các tính năng đã chọn:", selectedFeatures); // Ghi lại các tính năng được chọn
    // console.log("Chuỗi tính năng:", featureDetails); // Ghi lại chuỗi phân cách bởi dấu phẩy


    if (!CheckNullOrEmpty(name, "Tên model không được để trống"))
        return false;

    if (selectedFeatures.length === 0) {
        toastr.error("Bạn phải chọn ít nhất một tính năng", "Lỗi");
        return false;
    }

    let action = baseUrl + 'addMachineModel';
    let datasend = {
        model: name.val(),
        machineType: machine.val(),
        description: des.val(),
        username: username,
        featureDetails: featureDetails // Thêm thông tin tính năng vào dữ liệu gửi đi

    };
        //console.log("Dữ liệu gửi đi:", datasend);

    LoadingShow();
    PostDataAjax(action, datasend, function (response) {
        LoadingHide();
        if(response.rs){
            // Hiển thị thông báo thành công
            toastr.success('Thêm bản ghi thành công!', 'Thành công', {
                timeOut: 3000,  // Thời gian hiển thị (3 giây)
                progressBar: true,  // Hiển thị thanh tiến độ
                closeButton: true,  // Hiển thị nút đóng thông báo
            });
            getAllModel();    
            name.val('');
            machine.val('');
            des.val('');  
            $("input[name='featureCheckbox']").prop('checked', false); // Bỏ chọn tất cả checkbox
            $("#modalAddModel").modal("hide");

        }
        else {
             name.val('');
            machine.val('');
            des.val('');  
            $("input[name='featureCheckbox']").prop('checked', false); // Bỏ chọn tất cả checkbox
            $("#modalAddModel").modal("hide");
            // Hiển thị thông báo không có quyền xóa
            toastr.error(response.msg || 'Bạn không có quyền thêm bản ghi này!', 'Lỗi', {
                timeOut: 3000,
                progressBar: true,
                closeButton: true,
            });

        
        }
    });
}

// update machine 
function updateModel(){
    let id = $("#txtUModelId");
    let name =  $("#txtUModelName");
    let des =  $("#txtUModelDes");
    let machine =  $("#txtUModelMachine");
    let username = localStorage.getItem("username");


    if (!CheckNullOrEmpty(name, "Model không được để trống"))
        return false;

    let action = baseUrl + 'machineModel/update';
    let datasend = {
        id: id.val(),
        model: name.val(),
        machineType: machine.val(),
        description: des.val(),
        username: username
    };
    LoadingShow();
    PostDataAjax(action, datasend, function (response) {
        LoadingHide();
        if(response.rs){
            let data = response.data;
            toastr.success("Thành công", "Cập nhật thành công");
            addFeatureDetails();

            getAllModel();
            $("#modalUpdateModel").modal("hide");
        }
        else{
            // Hiển thị thông báo không có quyền xóa
            toastr.error(response.msg || 'Bạn không có quyền sửa bản ghi này!', 'Lỗi', {
                timeOut: 3000,
                progressBar: true,
                closeButton: true,
            });
        }
    });
}

// get machine detail
function getModelDetail(id){
    let action = baseUrl + 'machine-model/' + id;
    console.log(id)
    LoadingShow();
    GetDataAjax(action, function (response) {
        LoadingHide();
        if(response.rs){
            let data = response.data;

            $("#txtUModelId").val(data.id);
            $("#txtUModelName").val(data.model);
            $("#txtUModelUpdatedBy").val(data.updated_by);
            $("#txtUModelDes").val(data.description);
            $("#txtUModelMachine").val(data.machine_type);

            getModelFeature(id)
    
        }
        else{
            toastr.error(response.msg, "Thất bại");
        }
    });
    
    $("#modalUpdateModel").modal("show");
    LoadingHide();
}
  


//
// Hàm lấy danh sách tính năng cho model theo model_id
// Biến toàn cục để lưu modelId
let currentModelId = null;


function getModelFeature(id) {
    currentModelId = id;
    let action = baseUrl + 'get_model_feature/' + id;

    LoadingShow();
    GetDataAjax(action, function (response) {
        LoadingHide();
        if (response.rs) {
            let data = response.data;    
            console.log(data)

            // Hiển thị các tính năng hiện tại
            let html = "";
            for (let i = 0; i < data.length; i++) {
                html += `<div id="feature_${data[i].feature_detail_id}">
                            <input style="width:80%; height:34px" readonly value="${data[i].feature}">
                            <button onclick="deleteFeature(${data[i].feature_detail_id})" class="btn btn-danger">
                                <i class='fa fa-trash' style='font-size: 14px'></i>
                            </button>
                        </div>`;
            }
            let div = document.getElementById('model_feature');
            div.innerHTML = '';
            div.innerHTML = html;

            // Cập nhật danh sách tính năng để thêm mới
            getAllFeature();
        } else {
            toastr.error(response.msg, " ");
        }
    });
}
function addFeatureDetails() {
    let modelId = getModelId(); // Lấy modelId từ hàm getModelId
    let featureDetails = getSelectedFeatureIds(); // Lấy danh sách ID tính năng đã chọn
    if (featureDetails.length === 0) {
        toastr.error("Chưa chọn tính năng nào.", "Lỗi");
        return;
    }

    // Đảm bảo featureDetails là mảng số
    let featureDetailsArray = featureDetails.map(Number);

    let action = baseUrl + 'add_feature_details/' + modelId;
    let datasend = { featureDetails: featureDetailsArray };



    LoadingShow();
    PostDataAjax(action, datasend, function(response) {
        LoadingHide();
        if (response.rs) {
            toastr.success("Thành công", "Thêm tính năng thành công");
            // Cập nhật hoặc làm mới giao diện nếu cần
        } else {
            
            // Hiển thị thông báo không có quyền xóa
            toastr.error(response.msg || 'Bạn không có quyền thêm bản ghi này!', 'Lỗi', {
                timeOut: 3000,
                progressBar: true,
                closeButton: true,
            });
        }
    });
}

// Hàm lấy danh sách các ID tính năng được chọn
function getSelectedFeatureIds() {
    let selectedIds = [];
    document.querySelectorAll('.list-feature').forEach(select => {
        let selectedValue = select.value;
        if (selectedValue) {
            selectedIds.push(selectedValue);
        }
    });
    return selectedIds;
}

// Hàm lấy tất cả các tính năng để thêm mới
function getAllFeature() {
    let action = baseUrl + 'get_feature';

    LoadingShow();
    GetDataAjax(action, function (response) {
        LoadingHide();
        if (response.rs) {
           // let data = response.data;
                        featureOptions = response.data; // Lưu dữ liệu tính năng vào biến toàn cục

                        updateDropdownLists(); // Cập nhật tất cả các dropdown list

           // DropDownListFeature(data, $(".list-feature"));
        } else {
            toastr.error(response.msg, " ");
        }
    });

}

// Hàm cập nhật dropdown list với các tính năng
function DropDownListFeature(list, selector) {

    selector.html('');
    let html = "";
    for (let i = 0; i < list.length; i++) {
        let ele = list[i];
        html += `<option value='${ele.feature_detail_id}'>${ele.feature} (${ele.abbreviation})</option>`;
    }
    selector.append(html);
 
}

// Hàm thêm tính năng mới vào model
function addFeature() {
    let div = document.getElementById('model_feature');
    div.innerHTML += `<div>
                        <select class="listSelect_no_tag list-feature" style="width:80%; height:34px"></select>
                        <button onclick="deleteFeatureFromList(this)" class="btn btn-danger">
                            <i class='fa fa-trash' style='font-size: 14px'></i>
                        </button>
                      </div>`;
    
    // Cập nhật dropdown list với các tính năng
    updateDropdownLists();
}
function updateDropdownLists() {
            document.querySelectorAll('.list-feature').forEach(select => {
                // Lưu giá trị hiện tại
                let selectedValue = select.value;

                // Cập nhật dropdown list
                DropDownListFeature(featureOptions, $(select));

                // Khôi phục giá trị đã chọn trước đó
                select.value = selectedValue;
            });
}

// Hàm xóa tính năng từ danh sách hiển thị
function deleteFeatureFromList(button) {
    let div = button.parentElement;
    div.parentNode.removeChild(div);
}



// Hàm xóa tính năng khỏi model theo feature_detail_id
function deleteFeature(featureDetailId) {
    let modelId = getModelId(); // Lấy modelId từ nơi nào đó trong giao diện hoặc context của bạn

    let actionRemove = baseUrl + 'remove_feature_details/' + modelId;

    PostDataAjax(actionRemove, { featureDetails: [featureDetailId] }, function(response) {
        if (response.rs) {
            console.log('Xóa tính năng thành công');
            // Xóa tính năng khỏi giao diện
            let div = document.getElementById(`feature_${featureDetailId}`);
            if (div) div.remove();
        } else {
            // Hiển thị thông báo không có quyền xóa
            toastr.error(response.msg || 'Bạn không có quyền sửa bản ghi này!', 'Lỗi', {
                timeOut: 3000,
                progressBar: true,
                closeButton: true,
            });
        }
    });
}
function getModelId() {
    console.log("model vừa lấy là :",currentModelId)
    return currentModelId; 
}
function PostDataAjax(url, data, callback) {
    fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
    .then(response => response.text()) // Đọc phản hồi dưới dạng văn bản trước
    .then(text => {
        try {
            let json = JSON.parse(text); // Cố gắng phân tích văn bản thành JSON
            callback(json);
        } catch (e) {
            throw new Error(`Failed to parse JSON: ${e.message}\nResponse: ${text}`);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        toastr.error('Có lỗi xảy ra khi gửi dữ liệu.');
    });
}


// machine location 


function getLocationDetail(id) {
    let action = baseUrl + 'get_location_detail'
    LoadingShow();

       LoadingShow();  
        let datasend = {
        id: id
     
    };
    PostDataAjax(action,datasend, function (response) {
        LoadingHide();
        if(response.rs){
            let data = response.data;

            $("#UBuilding").val(data[0].building);
            $("#UZone").val(data[0].zone);
            $("#UZoneCode").val(data[0].zone_code);
            $("#UBuildingCode").val(data[0].building_code);
            $("#ULocation").val(data[0].location);
            $("#ULocationCode").val(data[0].location_code);
            $("#UCodeName").val(data[0].code_name);
            $("#URemarks").val(data[0].remarks);
            $("#modalUpdateLocation").data("id", data[0].id);

        }
        else{
            toastr.error(response.msg, "Thất bại");
        }
    });
    
    $("#modalUpdateLocation").modal("show");

}

async function getKindOfMachine(type){
    let url = baseUrl + 'get_kind_of_machine'

      
    let datasend = {
            machineType: type
    };
 
    const headers = {
        'Content-Type': 'application/json',
    };
    const response = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(datasend)
    });

    let data = await response.json();
   data = data.data
  

    let html = "";
    for (let i = 0; i < data.length; i++) {
        let ele = data[i];
        html += "<option value='" + ele.name + "'>" + ele.name + "</option>";
    }
    $("#txtASMType").html('');
    $("#txtASMType").append(html);
    $("#txtUSMType").html('');
    $("#txtUSMType").append(html);
    
}

function getAllLocation(){
    // let building = document.getElementById("selectBuilding");
    let KeyWord = document.getElementById("txtKeyWord");

    let action = baseUrl + 'getAllLocation';
    let datasend = {
        // building: building.value ?building.value:'',
        KeyWord: KeyWord.value?KeyWord.value.trim():''
    
    };
    LoadingShow();
    PostDataAjax(action, datasend, function (response) {
        LoadingHide();
        if(response.rs){
            let data = response.data;
            locationArr = data;

            let html = "";
            for (let i = 0; i < data.length; i++) {
                let ele = data[i];
                html += "<tr>"
                        + "<td width='5%'>"+ (i+1) +"</td>"
                        + "<td width='15%'>"+ ele.building +"</td>"
                        + "<td width='15%'>"+ (ele.zone !='NA' && ele.zone!=null ?ele.zone : '...')  +"</td>"
                        + "<td width='15%'>"+ ele.location +"</td>"           
                        + "<td width='10%'>"+ ele.building_code +"</td>"
                        + "<td width='10%'>"+ ele.zone_code  +"</td>"
                        + "<td width='10%'>"+ ele.location_code +"</td>"              
                        + "<td width='10%'>" + ele.code_name + "</td>"
                        + `<td width='5%'>
                             
                                <a href='javascript:void(0)' >
                                    <i class='fa fa-download' style='font-size: 14px'></i>
                                </a>
                                <a href='javascript:void(0)' onclick='getLocationDetail(${ele.id})'>
                                    <i class='fa fa-edit' style='font-size: 14px'>
                                    </i>
                                </a>
                                <a href='javascript:void(0)' onclick='deleteLocation(${ele.id})'>
                                    <i class='fa fa-trash' style='font-size: 14px; color: red;'></i>
                                </a>

                            </td>"
                        `
                        + "</tr>";
            }
            $("#location-table-body").html('');
            $("#location-table-body").html(html);
            $("#location-count").text("(" + data.length + ")");

            
            let html1 =`<option value='' > Select an option </option>`
            for(var i = 0; i <locationArr.length;i++) {
                let ele = locationArr[i];
                html1 += "<option value='"+ele.code_name+"'>"+ele.building+' _ '+ele.zone+' _ '+ ele.location + ' ('+ele.code_name+')'+"</option>";
            
            }
            $("#txtASMLocation").html=''
            $("#txtASMLocation").append(html1);
            $("#txtUSMLocation").html=''
            $("#txtUSMLocation").append(html1);
       

        }
        else{
            toastr.warning('Không tìm thấy bản ghi phù hợp ! ', " ");
        }
    });
} 

function downloadLocation() {
    LoadingShow(); // Hiển thị loading

    let KeyWord = document.getElementById("txtKeyWord").value;

    let action = baseUrl + 'machine_location/download';

    let datasend = { KeyWord: KeyWord || "" };

    // Gửi yêu cầu đến server
    fetch(action, {
        method: 'POST',
        body: JSON.stringify(datasend),
        headers: { 'Content-Type': 'application/json' }
    }).then(function (resp) {

        // Kiểm tra phản hồi
        if (!resp.ok) {
            LoadingHide(); // Ẩn loading khi có lỗi
            // Hiển thị thông báo không có quyền xóa
            toastr.error('Bạn không có quyền tải bản ghi này!', 'Lỗi', {
                timeOut: 3000,
                progressBar: true,
                closeButton: true,
            });
            return;
        }

        // Log body của phản hồi

        return resp.blob();  // Chuyển đổi phản hồi thành blob (file)

    }).then(function (blob) {

        // Chỉ tiếp tục nếu nhận được blob
        if (blob) {
            LoadingHide(); // Ẩn loading sau khi nhận blob

            // Tiến hành tải file
            return download(blob, GetTodayDate() + "_machineLocation.xlsx");
        }
    }).catch(function (error) {
        LoadingHide(); // Ẩn loading khi có lỗi
        toastr.error('Lỗi xảy ra khi tải file!', 'Lỗi', {
            timeOut: 3000,
            progressBar: true,
            closeButton: true
        });
    });
}




function AddMachineLocation() {
    // Lấy giá trị từ các trường input
    let building = $("#selectAddBuilding").val();
    let buildingCode = $("#txtBuildingCode").val();
    let zone = $("#txtZone").val();
    let zoneCode = $("#txtZoneCode").val();
    let location = $("#txtLocation").val();
    let locationCode = $("#txtLocationCode").val();
    let codeName = $("#txtCodeName").val();
    let remarks = $("#txtRemarks").val();

    // Kiểm tra các trường input có bị bỏ trống không
    
    if (!CheckNullOrEmpty(building, "Building không được để trống")) return false;    
    if (!CheckNullOrEmpty(zone, "Zone không được để trống")) return false;
    if (!CheckNullOrEmpty(location, "Location không được để trống")) return false;
    if (!CheckNullOrEmpty(buildingCode, "Building code không được để trống")) return false;
    if (!CheckNullOrEmpty(zoneCode, "Zone code không được để trống")) return false;
    if (!CheckNullOrEmpty(locationCode, "Location code không được để trống")) return false;
    if (!CheckNullOrEmpty(codeName, "Code name không được để trống")) return false;
    if (!CheckNullOrEmpty(remarks, "Remarks không được để trống")) return false;

    let action = baseUrl + 'machine-location/add'; // URL của API để thêm machine location
    let datasend = {
        building: building,
        zone: zone,
        location: location,
        building_code: buildingCode,
        zone_code: zoneCode,
        location_code: locationCode,
        code_name: codeName,
        remarks: remarks
    };

    // Hiển thị thông báo đang xử lý
    LoadingShow();
    PostDataAjax(action, datasend, function (response) {
        // Ẩn thông báo đang xử lý
        LoadingHide();
        if (response.rs) {
            // Hiển thị thông báo thành công
            toastr.success('Thêm bản ghi thành công!', 'Thành công', {
                timeOut: 3000,  // Thời gian hiển thị (3 giây)
                progressBar: true,  // Hiển thị thanh tiến độ
                closeButton: true,  // Hiển thị nút đóng thông báo
            });
            getAllLocation();
            // Làm sạch các trường input
            $("#selectAddBuilding").val('');
            $("#txtBuildingCode").val('');
            $("#txtZone").val('');
            $("#txtZoneCode").val('');
            $("#txtLocation").val('');
            $("#txtLocationCode").val('');
            $("#txtCodeName").val('');
            $("#txtRemarks").val('');
            // Đóng modal
            $("#modalAddLocation").modal("hide");
        } else {
            // Hiển thị thông báo không có quyền xóa
            toastr.error('Bạn không có quyền thêm bản ghi này!', 'Lỗi', {
                timeOut: 3000,
                progressBar: true,
                closeButton: true,
            });

        }
    });
}

function CheckNullOrEmpty(input, strError) {
    // Kiểm tra nếu input là một jQuery object
    if (input instanceof jQuery) {
        // Lấy giá trị của trường input
        const value = input.val();
        // Kiểm tra nếu giá trị của input là undefined, null hoặc chuỗi rỗng
        if (value === undefined || value === null || value.trim() === "") {
            toastr.error(strError); // Hiển thị thông báo lỗi
            input.focus(); // Đưa con trỏ chuột vào trường nhập liệu
            return false;
        }
    } else {
        // Nếu input không phải là jQuery object, trực tiếp kiểm tra giá trị
        if (input === undefined || input === null || input.trim() === "") {
            toastr.error(strError); // Hiển thị thông báo lỗi
            return false;
        }
    }
    return true;
}

async function updateMachineLocation() {
    // Lấy giá trị từ các trường trong modal
    const id = $("#modalUpdateLocation").data("id");
    const building = $("#UBuilding").val().trim();
    const buildingCode = $("#UBuildingCode").val().trim();
    const zone = $("#UZone").val().trim();
    const zoneCode = $("#UZoneCode").val().trim();
    const location = $("#ULocation").val().trim();
    const locationCode = $("#ULocationCode").val().trim();
    const codeName = $("#UCodeName").val().trim();
    const remarks = $("#URemarks").val().trim();

     // Kiểm tra tính hợp lệ của các trường thông tin
    if (!CheckNullOrEmpty(building, "Building không được để trống") ||
        !CheckNullOrEmpty(zone, "Zone không được để trống") ||
        !CheckNullOrEmpty(location, "Location không được để trống") ||
        !CheckNullOrEmpty(buildingCode, "Building code không được để trống") ||
        !CheckNullOrEmpty(zoneCode, "Zone code không được để trống") ||
        !CheckNullOrEmpty(locationCode, "Location code không được để trống") ||
        !CheckNullOrEmpty(codeName, "Code name không được để trống") ||
        !CheckNullOrEmpty(remarks, "Remarks không được để trống")) {
        return false;
    }

    const action = baseUrl + 'machine-location/update'; // URL API cập nhật
    const datasend = {
        id: id,
        building: building,
        building_code: buildingCode,
        zone: zone,
        zone_code: zoneCode,
        location: location,
        location_code: locationCode,
        code_name: codeName,
        remarks: remarks
    };

    try {
        // Hiển thị thông báo tải dữ liệu
        LoadingShow();
        
        const response = await fetch(action, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datasend)
        });

        const result = await response.json();
        LoadingHide();
        
        if (result.rs) {
            // Hiển thị thông báo thành công
            toastr.success('Cập nhật bản ghi thành công!', 'Thành công', {
                timeOut: 3000,  // Thời gian hiển thị (3 giây)
                progressBar: true,  // Hiển thị thanh tiến độ
                closeButton: true,  // Hiển thị nút đóng thông báo
            });
            $("#modalUpdateLocation").modal("hide");
            getAllLocation(); // Tải lại danh sách vị trí để cập nhật giao diện
        } else {
            // Hiển thị thông báo không có quyền xóa
            toastr.error('Bạn không có quyền sửa bản ghi này!', 'Lỗi', {
                timeOut: 3000,
                progressBar: true,
                closeButton: true,
            });
        }
    } catch (error) {
        LoadingHide();
        console.error('Error:', error);
        toastr.error('Đã xảy ra lỗi khi cập nhật thông tin!', 'Thất bại');
    }
}


function deleteLocation(id) {
    if (confirm('Bạn có chắc chắn muốn xóa bản ghi này ?')) {
        // Gửi yêu cầu xóa đến server
        fetch('machine-location/delete', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ id: id })
        })
        .then(response => response.json())
        .then(data => {
            if (data.rs) {
                // Hiển thị thông báo thành công
                toastr.success('Xóa bản ghi thành công!', 'Thành công', {
                    timeOut: 3000,  // Thời gian hiển thị (3 giây)
                    progressBar: true,  // Hiển thị thanh tiến độ
                    closeButton: true,  // Hiển thị nút đóng thông báo
                });
                // Cập nhật lại bảng dữ liệu sau khi xóa
                getAllLocation(); // Hoặc bạn có thể gọi một hàm để làm mới dữ liệu mà không phải reload trang
            } else {
                // Hiển thị thông báo không có quyền xóa
                toastr.error('Bạn không có quyền xóa bản ghi này!', 'Lỗi', {
                    timeOut: 3000,
                    progressBar: true,
                    closeButton: true,
                });
            }
        })
        .catch(error => {
            console.error('Lỗi:', error);
            alert('Lỗi xảy ra khi xóa bản ghi!');
        });
    }
}

function deleteModel(id) {
    if (confirm('Bạn có chắc chắn muốn xóa bản ghi này ?')) {
        // Gửi yêu cầu xóa đến server
        fetch('model/delete', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ id: id })
        })
        .then(response => response.json())
        .then(data => {
            if (data.rs) {
                // Hiển thị thông báo thành công
                toastr.success('Xóa bản ghi thành công!', 'Thành công', {
                    timeOut: 3000,  // Thời gian hiển thị (3 giây)
                    progressBar: true,  // Hiển thị thanh tiến độ
                    closeButton: true,  // Hiển thị nút đóng thông báo
                });
                // Cập nhật lại bảng dữ liệu sau khi xóa
                getAllModel(); // Hoặc bạn có thể gọi một hàm để làm mới dữ liệu mà không phải reload trang
            } else {
                // Hiển thị thông báo không có quyền xóa
                toastr.error('Bạn không có quyền xóa bản ghi này!', 'Lỗi', {
                    timeOut: 3000,
                    progressBar: true,
                    closeButton: true,
                });
            }
        })
        .catch(error => {
            console.error('Lỗi:', error);
            alert('Lỗi xảy ra khi xóa bản ghi!');
        });
    }
}

// Hàm để hiển thị thông tin file khi người dùng chọn file
function showFileInfo() {
    var fileInput = document.getElementById('fileUploadExcel');
    var file = fileInput.files[0]; // Lấy file đầu tiên từ input

    console.log('File được chọn:', file); // Log file được chọn

    if (!file) {
        // Xóa thông tin file nếu không có file nào được chọn
        $("#fileDetails").html('<p>Không có file nào được chọn.</p>');
        return;
    }

    // Hiển thị thông tin về file
    var fileInfoHtml = `<p><strong>File Name:</strong> ${file.name}</p>
                        <p><strong>Size:</strong> ${formatBytes(file.size)}</p>`;
    $("#fileDetails").html(fileInfoHtml);
}

// Hàm để định dạng kích thước file
function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Byte';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// Hàm uploadExcellocation() không thay đổi, chỉ cập nhật để sử dụng cho việc upload file
function uploadExcellocation() {
    var fileInput = document.getElementById('fileUploadExcel');
    var file = fileInput.files[0]; // Lấy file đầu tiên từ input

    if (!file) {
        toastr.warning("Vui lòng chọn file Excel để tải lên.");
        console.log('Không có file nào được chọn.');
        return;
    }
    // Kiểm tra loại file (chỉ cho phép file Excel)
    var allowedExtensions = /(\.xlsx|\.xls)$/i;
    if (!allowedExtensions.exec(file.name)) {
        toastr.warning("Vui lòng chọn file Excel (.xlsx hoặc .xls).");
        console.log('Loại file không hợp lệ.');
        return;
    }

    var formData = new FormData();
    formData.append("file", file); // Thêm file vào FormData

    // Hiển thị thông báo tải dữ liệu
    LoadingShow();

    $.ajax({
        url: baseUrl + 'importLocation', // URL endpoint để xử lý upload
        method: 'POST',
        contentType: false, // Không đặt content type
        processData: false, // Không xử lý dữ liệu
        data: formData,
        success: function (response) {
            // Kiểm tra phản hồi từ server
            if (response.status === 403) {
                // Nếu phản hồi từ server là 403 (không có quyền), hiển thị thông báo lỗi
                LoadingHide();
                toastr.error("Bạn không có quyền tải lên file.", "Lỗi", {
                    timeOut: 3000,
                    progressBar: true,
                    closeButton: true
                });
                return; // Dừng lại, không thực hiện tiếp các bước sau
            }
            console.log('Phản hồi từ server:', response); // Log phản hồi từ server
            toastr.success("Upload file thành công !");
            // Ẩn thông báo tải dữ liệu
            LoadingHide();
        },
        error: function(err) {
            // Ẩn thông báo tải dữ liệu
            LoadingHide();
            if (err.status === 403) {
                toastr.error("Bạn không có quyền tải lên file.", "Lỗi", {
                    timeOut: 3000,
                    progressBar: true,
                    closeButton: true
                });
            } else {
                toastr.error("Đã xảy ra lỗi khi tải lên file. Vui lòng thử lại.");
            }
        }
    });
}


// Upload excel máy may sll

// Đẩy file lên để xử lý thành JSON trước khi update
async function uploadFile() {
    const fileInput = document.getElementById('fileInput');
    const file = fileInput.files[0]; // Lấy file từ input

    if (file) {
        const reader = new FileReader();

        // Đọc file dưới dạng binary
        reader.onload = async function (e) {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });

            // Lấy sheet đầu tiên
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];

            // Chuyển đổi sheet thành JSON
            const jsonData = XLSX.utils.sheet_to_json(firstSheet);
            console.log("JSON Data:", jsonData); // Kiểm tra dữ liệu JSON

            // Gửi dữ liệu theo từng phần
            await sendDataInChunks(jsonData, 300); // Chia thành các phần 500 bản ghi

        };

        reader.readAsArrayBuffer(file);
    } else {
        toastr.success(`Vui lòng chọn một file Excel để tải lên!`, "Thông báo", { timeOut: 700 });
    }
}

// Gọi API đẩy data vào DB theo từng phần
async function sendDataInChunks(jsonData, chunkSize) {
    const totalChunks = Math.ceil(jsonData.length / chunkSize); // Tính số phần cần gửi

    for (let i = 0; i < totalChunks; i++) {
        const chunk = jsonData.slice(i * chunkSize, (i + 1) * chunkSize); // Lấy phần dữ liệu cần gửi

        // Gửi từng phần dữ liệu
        try {
            const response = await fetch('machineManagerv2/insert-machine', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(chunk) // Gửi từng phần
            });
            // Kiểm tra mã trạng thái của phản hồi
            if (!response.ok) {
                if (response.status === 403) { // Người dùng không có quyền
                    // Hiển thị thông báo không có quyền xóa
                    toastr.error('Bạn không có quyền tải lên bản ghi này!', 'Lỗi', {
                        timeOut: 3000,
                        progressBar: true,
                        closeButton: true,
                    });
                    break; // Dừng vòng lặp nếu gặp lỗi quyền truy cập
                } else if (response.status === 401) { // Xác thực không hợp lệ
                    toastr.error('Vui lòng đăng nhập lại!', 'Lỗi', {
                        timeOut: 3000,
                        progressBar: true,
                        closeButton: true,
                    });
                    break;
                } else {
                    toastr.error(`Lỗi máy chủ: ${response.statusText}`, "Lỗi", { timeOut: 3000 });
                    continue; // Bỏ qua phần này và tiếp tục
                }
            }
            const data = await response.json();
            toastr.success(`Đã gửi Json ${i + 1} dữ liệu lên server!`, "Thông báo", { timeOut: 700 });

            // Thêm thời gian chờ trước khi gửi phần tiếp theo
            await new Promise(resolve => setTimeout(resolve, 2000)); // Chờ 3 giây
        } catch (error) {
            console.error('Error:', error);
            toastr.error(`Đã xảy ra lỗi khi gửi phần ${i + 1} dữ liệu lên server`, "Lỗi", { timeOut: 700 });
        }
    }
}