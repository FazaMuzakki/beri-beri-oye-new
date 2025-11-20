// Desktop navigation initialization
$(document).ready(function() {
    // Desktop dropdown
    const desktopDropdownBtn = $('#desktop-dropdown-btn');
    const desktopDropdownMenu = $('#desktop-dropdown-menu');
    
    desktopDropdownBtn.on('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        $(this).find('svg').toggleClass('rotate-180');
        desktopDropdownMenu.toggleClass('show');
    });

    // Close desktop dropdown when clicking outside
    $(document).on('click', function(e) {
        if (!$(e.target).closest('.group').length) {
            desktopDropdownMenu.removeClass('show');
            desktopDropdownBtn.find('svg').removeClass('rotate-180');
        }
    });
});