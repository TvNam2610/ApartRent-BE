const baseUrl = "/warehouse/shippingMark/";
var dataScan=[];
var id = "";
var licensePlates = "";
var palletId="";
$(document).ready(function () {
     $('#changeUser').modal('show');
   $( "#changeUser" ).on('shown.bs.modal', function(){
    document.getElementById("idCode").focus();
    });

});



function ScanId(){
    toastr.options = {
    "positionClass": "toast-bottom-right"
  }
    id =  document.getElementById("idCode").value;
    console.log(id)
    $.ajax({
        url: baseUrl + 'CheckId',
        method: 'POST',
        data:{'id':id},
        dataType: 'json',
        success: function (result) {
            if(result.rs){
                console.log(result.msg);
                
                toastr.remove()
                toastr.success(result.msg);
                
                $('#changeUser').modal('hide');
                $( "#changeUser" ).on('hidden.bs.modal', function(){
                    document.getElementById("caseCode").focus();
                });
                
                document.getElementById("DLOid").innerHTML = id;
                document.getElementById("DLOName").innerHTML = result.data[0]["Name"];
            }
            else{
                toastr.remove()
                toastr.warning(result.msg);
              
                document.getElementById("idCode").value = "";
            }
          
        }
    })

}
function SaveId(){
    $('#changeUser').modal('hide');
    document.getElementById("caseCode").focus();
    
}
var beforeScan="";
function AddCaseCode(){
    var caseScan = document.getElementById("caseCode").value;
    // var idCase = document.getElementById("caseCode").value;
    // let length = beforeScan.length;
    // let indexOf = idCase.indexOf(beforeScan);
    // let caseScan = idCase.substring(indexOf+length);
    // beforeScan= caseScan;
    // document.getElementById("caseCode").value = caseScan;
    document.getElementById("caseCode").value="";
    toastr.remove();
    toastr.options = {
        "positionClass": "toast-bottom-right"
      }
      if(caseScan.length > 15){
        let data = caseScan.split(";");
        
        let po_data = (typeof data[0]!=='undefined' ? data[0] :"");
        let po = (po_data!="" ? (typeof po_data.split("-")[0]!=='undefined' ? po_data.split("-")[0] :""):"");
        let po_release = (po_data!="" ? (typeof po_data.split("-")[1]!=='undefined' ? po_data.split("-")[1] :""):"");
        let code = (typeof data[1]!=='undefined' ? data[1] :"");
        let quantity = (typeof data[2]!=='undefined' ? data[2] :"0");
        let box = (typeof data[3]!=='undefined' ? data[3] :"0");
        addBoxToPallet(po,code,quantity,box,po_release);
        toastr.success(`Đã thêm thùng po:  ${po} thành công`);
      }
      if(caseScan.length == 9){
        palletId = caseScan;
        console.log("close pallet")
        closePallet();
      }
}


var idNumber = 0;
function addLicense(){
  licensePlates = document.getElementById("licensePlatesCode").value;
  
  if(licensePlates != ""){
    toastr.success("Thay đổi biển số xe thành công");
    document.getElementById("caseCode").focus();
  }
  else{
    toastr.warning("Bạn cần nhập vào biển số xe");
    document.getElementById("licensePlatesCode").focus();
  }
}
function addBoxToPallet(po,code,quantity,box,po_release){
  
  idNumber= idNumber+1;
  dataScan.push({
      id:idNumber,
      po: po,
      code:code ,
      quantity: quantity,
      box:box,
      id_employee:id,
      po_release:po_release
    });
    console.log(dataScan)
    document.getElementById("itemCode").innerHTML =code;
    document.getElementById("quantityCode").innerHTML =quantity;
    document.getElementById("poCode").innerHTML =po;
    loadDataTable();
}
function deleteScan(id){
    var data = dataScan;
    console.log(dataScan.length);
    dataScan=[];
    idNumber = 0;
    data.forEach(function(item, index) { 
        if(item.id != id) {
            idNumber += 1;
            console.log("id   "+index);
            dataScan.push({
                id:idNumber,
                po: item.po,
                po_release:item.po_release,
                code:item.code,
                quantity: item.quantity,
                box:item.box,
                id_employee:id
            })
        }
        loadDataTable();
    });
    
}
function DeleteAll(){
    dataScan=[];
    idNumber=0;
    loadDataTable();
}
function closePallet(){
    
  if(dataScan.length>0){
    LoadingShow();
    $.ajax({
      url: baseUrl + 'UploadPallet',
      method: 'POST',
      data:{'dataScan':dataScan,'palletId':palletId,'licensePlates':licensePlates},
      dataType: 'json',
      success: function (result) {
        if(result.rs){
          dataScan=[];
          idNumber=0;
          loadDataTable();
          toastr.success(result.msg);
        }
        else
            toastr.error(result.msg);
        LoadingHide();
      }
    })
  }
  else
    toastr.error("Pallet rỗng, bạn cần thêm thùng vào pallet");
 
}
 function loadDataTable(){
    var tableBody ="";
    dataScan.forEach(function (item, index) {
        tableBody += `<tr class="row-body">
        <td class="listItem-body">${index +1}</th>
        <td class="listItem-body">${item["po"]}</td>
        <td class="listItem-body">${item["po_release"]}</td>
        <td class="listItem-body">${item["code"]}</td>
        <td class="listItem-body">${item["quantity"]}</td>
        <td class="listItem-body">${item["box"]}</td>
        <td class="listItem-body">  
            <button type="button" onclick=" deleteScan(${index +1})" class="like btn btn-danger bnt-delete_item">Xoá</button>
        </td>
        </tr>`;
    })
    document.getElementById("box/pallet").innerHTML =dataScan.length;
    document.getElementById('tableBody').innerHTML = tableBody;

 }
 $(function() {
     loadDataTable();
     $('#locale').change(loadDataTable)
   })
