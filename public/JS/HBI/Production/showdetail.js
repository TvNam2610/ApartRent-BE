// Tự động làm mới trang sau mỗi 5 phút
setTimeout(() => {
    console.log("Đang làm mới trang..."); // Log khi trang được làm mới

    window.location.reload();
}, 300000); // 300000 ms = 5 phút

document.getElementById('back-button').addEventListener('click', function () {
    window.history.back(); // Quay về trang trước đó
});


