$(document).ready(function () {
    // Append the navigation tabs
    $('.card-body').prepend(`
        <div class="card-body">
            <ul class="nav nav-tabs" id="mainTabs">
                <li class="nav-item">
                    <a class="nav-link" href="/production/get-view-superintendent-manager" data-tab="superintendent"><b>Quản lý line - Giãn ca</b></a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" href="/production/get-view-leave-request" data-tab="approve-change-line"><b>Duyệt đăng ký nghỉ</b></a>
                </li>

                <li class="nav-item">
                    <a class="nav-link" href="/production/get-approve-change-line" data-tab="approve-change-line"><b>Duyệt đổi line</b></a>
                </li>

                

                </li>
                <li class="nav-item">
                    <a class="nav-link" href="#" data-tab="approve-change-line"><b>Duyệt tăng ca</b></a>
                </li>

                </li>
                <li class="nav-item">
                    <a class="nav-link" href="#" data-tab="approve-change-line"><b>Duyệt tách giờ</b></a>
                </li>
            </ul>
        </div>
    `);

    // Get the current URL path
    const currentPath = window.location.pathname;

    // Add the active class to the appropriate tab based on the current URL
    $('#mainTabs .nav-link').each(function () {
        if ($(this).attr('href') === currentPath) {
            $(this).addClass('active');
        } else {
            $(this).removeClass('active');
        }
    });
});