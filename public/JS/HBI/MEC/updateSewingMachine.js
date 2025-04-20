var baseUrl = "/mechanic/";
var machineArr = []; // danh sách machine
var modelArr = [] // danh sách model
var locationArr = [] // danh sách location
var selectedModelName = ''; // Biến toàn cục để lưu tên mô hình

// $('#txtUSMMachineType').on('select2:select', async function() {  
//     await getModelByMachineType1($(this).val())
//     await getKindOfMachine($(this).val());  
//   });
function updateSewingMachine(){

    let serialNo =  $("#txtUSMSerial");
    let tag =  $("#txtUSMTag");

    let model = $("#txtUSMMachineModel");

    
    let type= $("#txtUSMType")
    let mecLocation =  $("#txtUSMLocation");
    let brand = $("#txtUSMBrand")
    let status =  $("#txtUSMStatus");
    let id = $("#txtUSMId");

    //console.log("Model value:", model.val());

    if (!CheckNullOrEmpty(model, "Model không được để trống"))
        return false;
    if (!CheckNullOrEmpty(type, "Kiểu máy không được để trống"))
        return false;
    if (!CheckNullOrEmpty(serialNo, "Serial máy không được để trống"))
        return false;
    if (!CheckNullOrEmpty(tag, "Tag máy không được để trống"))
        return false;


    let action = baseUrl + 'update_machine';
    let datasend = {
            id:id.val(),
            serialNo: serialNo.val(),
            tag: tag.val(),      
            model: selectedModelName,
            mecLocation: mecLocation.val(),
            type:type.val(),
            brand:brand.val(),

            status: status.val(),
            username:localStorage.getItem('username'),
    };
    //console.log("dữ liệu update",datasend)

   
    PostDataAjax(action, datasend, function (response) {
      
        if(response.rs){
            toastr.success("Thành công", "Cập nhật thành công");
            $("#modalUpdateSewingMachine").modal("hide");
            getAllSewingMachine();
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
function getSewingMachineDetail(id){    
    let action = baseUrl + 'get_machine_by_id/' + id; 

    LoadingShow();
    GetDataAjax(action,async function (response) {
        LoadingHide();
        if(response.rs){
            let data = response.data;
   
            //console.log("Dữ liệu nhận được từ API:", data);

            $("#txtUSMId").val(data.id);
            $("#txtUSMSerial").val(data.serial);
            $("#txtUSMTag").val(data.tag);
            
            getKindOfMachine()

        //    await getKindOfMachine(data.loai_may.trim(''))
        //    await getModelByMachineType1(data.loai_may.trim(''));
            if ($('#txtUSMLocation option[value="' + data.location + '"]').length === 0) {
            // Nếu chưa có, thêm tùy chọn mới
            var newOption = new Option(data.location, data.location, true, true);
            $('#txtUSMLocation').append(newOption).trigger('change');
            } else {
                // Nếu đã có, chỉ cần gán giá trị
                $("#txtUSMLocation").val(data.location).trigger('change');
            }  
            $('#txtUSMType').val(data.type).trigger('change')
            $("#txtUSMMachineModel").val(data.model_id).trigger('change');
            // console.log("Giá trị mô hình sau khi cập nhật:", $("#txtUSMMachineModel").val()); // Kiểm tra giá trị model_id
            // $("#txtUSMLocation").val(data.location).trigger('change');
            $('#txtUSMBrand').val(data.manufacturer);
            $("#txtUSMStatus").val(data.status);
        }
        else{
            toastr.error(response.msg, "Thất bại");
            LoadingHide();
        }
    });
    
    $("#modalUpdateSewingMachine").modal("show");
    LoadingHide();
}

// Ghi log và lưu tên mô hình khi người dùng chọn từ phần tử select
$("#txtUSMMachineModel").on('change', function () {
    selectedModelName = $(this).find('option:selected').text(); // Lấy tên mô hình
    console.log("Tên mô hình được chọn:", selectedModelName);
});


async function getKindOfMachine(){
    let url = baseUrl + 'get_kind_of_machine'

 
    const headers = {
        'Content-Type': 'application/json',
    };
    const response = await fetch(url, {
        method: 'POST',
        headers: headers,

    });

    let data = await response.json();
    data = data.data
  

    let html = "";
    for (let i = 0; i < data.length; i++) {
        let ele = data[i];
        html += "<option value='" + ele.name + "'>" + ele.name + "</option>";
    }
    // $("#txtASMType").html('');
    // $("#txtASMType").append(html);
    $("#txtUSMType").html('');
    $("#txtUSMType").append(html);
    
}


function getAllModel(){
    let keyword =  $("#txtModel").val();


    let action = baseUrl + 'getMachineModel';
    let datasend = {
        model: keyword,

    };
    LoadingShow();
    PostDataAjax(action, datasend, function (response) {
        LoadingHide();
        if(response.rs){
            let data = response.data;
     
            DropDownListModel(data,$(".list-model"))
           
        }
        else{
            toastr.error(response.msg, " ");
        }
    });
}  

async function init () {
    
    // getAllModel()

}

init()

