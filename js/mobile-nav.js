// Mobile navigation initialization
$(document).ready(function() {
    let scrollPosition = 0;
    let menuIsOpen = false;
    
    // Function to lock scroll
    function lockScroll() {
        scrollPosition = $(window).scrollTop();
        
        // Store scroll position dan lock scroll tanpa using transform
        $('html').addClass('menu-open');
        $('body').addClass('menu-open');
        // Lock overflow saja, jangan pakai transform karena affect fixed positioning
        $('body').css({
            'overflow': 'hidden'
        });
        menuIsOpen = true;
        
        // Prevent scroll with multiple methods
        $(document).on('touchmove.menu-lock', function(e) {
            // Allow scroll only inside the menu
            if (!$(e.target).closest('.NavigationSlideOut').length) {
                e.preventDefault();
            }
        });
        
        // Prevent scroll wheel
        $(document).on('wheel.menu-lock', function(e) {
            if (!$(e.target).closest('.NavigationSlideOut').length) {
                e.preventDefault();
            }
        });
    }
    
    // Function to unlock scroll
    function unlockScroll() {
        $('html').removeClass('menu-open');
        $('body').removeClass('menu-open');
        // Reset inline styles
        $('body').css({
            'overflow': ''
        });
        menuIsOpen = false;
        
        // Restore scroll position
        $(window).scrollTop(scrollPosition);
        
        // Remove scroll prevention
        $(document).off('touchmove.menu-lock');
        $(document).off('wheel.menu-lock');
    }
    
    // Function to close menu
    function closeMenu() {
        $('.NavigationSlideOut').animate({ right: '-300px' }, 300, function() {
            unlockScroll();
        });
        $('.menuIcon').removeClass('on');
        $('#mobile-dropdown').removeClass('show');
        $('.NavigationTab.dropdown').removeClass('active');
        $('#mobile-dropdown-btn svg').removeClass('rotate-180');
    }
    
    // Mobile menu hamburger icon
    $('.menuIcon').on('click', function(e) {
        e.stopPropagation();
        $(this).toggleClass('on');
        const isOpen = $(this).hasClass('on');
        
        if (isOpen) {
            lockScroll();
            $('.NavigationSlideOut').stop(true, false).animate({
                right: '0px'
            }, 300);
        } else {
            closeMenu();
        }
    });

    // Mobile dropdown toggle - ONLY toggle dropdown, don't navigate
    $('#mobile-dropdown-btn').on('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        const dropdownContent = $('#mobile-dropdown');
        const parentTab = $(this).closest('.NavigationTab.dropdown');
        
        parentTab.toggleClass('active');
        $(this).find('svg').toggleClass('rotate-180');
        dropdownContent.toggleClass('show');
    });

    // Close mobile menu when clicking OUTSIDE menu and icons
    // ONLY close if click is NOT inside NavigationSlideOut
    $(document).on('click', function(e) {
        if (menuIsOpen) {
            // Check if click is inside menu or on menu icon
            const isInMenu = $(e.target).closest('.NavigationSlideOut').length > 0;
            const isMenuIcon = $(e.target).closest('.menuIcon').length > 0;
            
            // Only close if click is OUTSIDE both menu and menu icon
            if (!isInMenu && !isMenuIcon) {
                closeMenu();
            }
        }
    });

    // Also close on touchend outside menu
    $(document).on('touchend', function(e) {
        if (menuIsOpen) {
            // Check if touch is inside menu or on menu icon
            const isInMenu = $(e.target).closest('.NavigationSlideOut').length > 0;
            const isMenuIcon = $(e.target).closest('.menuIcon').length > 0;
            
            // Only close if touch is OUTSIDE both menu and menu icon
            if (!isInMenu && !isMenuIcon) {
                closeMenu();
            }
        }
    });

    // Prevent propagation when clicking inside menu (to prevent close trigger)
    $('.NavigationSlideOut').on('click', function(e) {
        e.stopPropagation();
    });

    // Handle actual navigation links - ONLY navigate links with actual href (not #)
    // Close menu when navigating to different page
    $('.NavigationTab a').on('click', function(e) {
        const href = $(this).attr('href');
        
        // If this is dropdown button (href="#"), don't close menu - let dropdown handler do it
        if (href === '#' || href === '') {
            return;
        }
        
        // If it's a real navigation link, close menu
        if (menuIsOpen) {
            closeMenu();
        }
    });
});
