
$(document).ready(function () {
    // Append the navigation tabs
    $('.card-body').prepend(`
        <div class="card-body">
            <ul class="nav nav-tabs">
                <li class="nav-item">
                    <a class="nav-link" href="/production/get-view-daily-attendance" data-tab="attendance"><b>Điểm Danh</b></a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" href="/production/get-view-register-for-leave" data-tab="ot"><b>Đăng Ký Nghỉ</b></a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" href="/production/get-view-time-separation" data-tab="time-separation"><b>Tách Giờ</b></a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" href="/production/get-view-change-line" data-tab="line-change"><b>Chuyển Line</b></a>
                </li>
                  <li class="nav-item">
                    <a class="nav-link" href="/production/get-view-over-time" data-tab="ot"><b>Tăng ca</b></a>
                </li>
                </li>
                  <li class="nav-item">
                    <a class="nav-link" href="/production/get-view-leave-history" data-tab="leave-history"><b>Lịch sử nghỉ</b></a>
                </li>
                </li>
                  <li class="nav-item">
                    <a class="nav-link" href="/production/get-view-worker-management" data-tab="leave-history"><b>Thêm công nhân</b></a>
                </li>
            </ul>
        </div>
    `);

    // Get the current URL path
    const currentPath = window.location.pathname;

    // Add the active class to the appropriate tab based on the current URL
    $('.nav-link').each(function () {
        if ($(this).attr('href') === currentPath) {
            $(this).addClass('active');
        } else {
            $(this).removeClass('active');
        }
    });
});
