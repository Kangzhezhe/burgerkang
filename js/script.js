$(document).ready(function() {
  console.log("Elent theme loaded");

  // TOC Logic
  var $toc = $('#postWidgetToc');
  var $toggleBtn = $('#tocToggle');
  var $tocHeader = $('.toc-header'); 

  if ($toc.length) {
    // Initial State Check (Optional: Load from localStorage)
    
    // Toggle Function
    function toggleToc() {
      $toc.toggleClass('collapsed');
      
      // Update Icon
      var isCollapsed = $toc.hasClass('collapsed');
      // Using generic symbols or specific logic
      if(isCollapsed) {
          $toggleBtn.html('<span style="font-size:14px">☰</span>'); // Menu icon when collapsed
      } else {
          $toggleBtn.text('▼');
      }
    }

    $toggleBtn.on('click', function(e) {
      e.stopPropagation();
      // Ensure we don't trigger drag logic
      toggleToc();
    });

    // Make TOC Draggable
    var isDragging = false;
    var startX, startY, initialRect, offsetX, offsetY;

    $tocHeader.on('mousedown', function(e) {
        // Prevent default text selection but allow button clicks
        if(e.target === $toggleBtn[0] || $.contains($toggleBtn[0], e.target)) return;
        
        isDragging = false;
        startX = e.clientX;
        startY = e.clientY;
        
        // Don't switch positioning yet. Wait for drag.
        var rect = $toc[0].getBoundingClientRect();
        offsetX = e.clientX - rect.left;
        offsetY = e.clientY - rect.top;

        $(document).on('mousemove.tocDrag', function(e) {
            var dx = e.clientX - startX;
            var dy = e.clientY - startY;

            if (!isDragging && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) {
                isDragging = true;
                // Switch to absolute positioning now that we are dragging
                var currentRect = $toc[0].getBoundingClientRect();
                $toc.css({
                    left: currentRect.left,
                    top: currentRect.top,
                    right: 'auto',
                    bottom: 'auto'
                });
            }

            if (isDragging) {
                var newLeft = e.clientX - offsetX;
                var newTop = e.clientY - offsetY;
                
                // Boundary checks
                var maxLeft = $(window).width() - $toc.outerWidth();
                var maxTop = $(window).height() - $toc.outerHeight();
                
                // Prevent dragging completely off screen
                newLeft = Math.max(-200, Math.min(newLeft, $(window).width() - 50));
                newTop = Math.max(0, Math.min(newTop, $(window).height() - 50));
                
                $toc.css({
                    left: newLeft,
                    top: newTop
                });
            }
        });

        $(document).on('mouseup.tocDrag', function(e) {
            $(document).off('mousemove.tocDrag');
            $(document).off('mouseup.tocDrag');
            
            if (!isDragging) {
                // It was a click
                toggleToc();
            }
        });
    });

    // Touch support for mobile
    $tocHeader.on('touchstart', function(e) {
         if(e.target === $toggleBtn[0] || $.contains($toggleBtn[0], e.target)) return;
         var touch = e.originalEvent.touches[0];
         startX = touch.clientX;
         startY = touch.clientY;
         isDragging = false;
         
         var rect = $toc[0].getBoundingClientRect();
         offsetX = touch.clientX - rect.left;
         offsetY = touch.clientY - rect.top;
    });

    $tocHeader.on('touchmove', function(e) {
         var touch = e.originalEvent.touches[0];
         var dx = touch.clientX - startX;
         var dy = touch.clientY - startY;
         
         if (!isDragging && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) {
             isDragging = true;
             
             // Switch positioning on first drag move
             var currentRect = $toc[0].getBoundingClientRect();
             $toc.css({
                left: currentRect.left,
                top: currentRect.top,
                right: 'auto',
                bottom: 'auto'
             });
         }

         if (isDragging) {
             e.preventDefault(); 
             
             var newLeft = touch.clientX - offsetX;
             var newTop = touch.clientY - offsetY;
             
             $toc.css({
                 left: newLeft,
                 top: newTop 
             });
         }
    });

    // Auto Collapse on Small Screens
    if ($(window).width() < 1000) {
        $toc.addClass('collapsed');
        $toggleBtn.html('<span style="font-size:14px">☰</span>');
    }

    // Smooth Scroll for TOC Links
    $('.toc-link').on('click', function(e) {
        e.preventDefault();
        var target = $(this).attr('href');
        // Handle decoding for non-ASCII IDs
        try {
            var $target = $(decodeURIComponent(target));
            
            if ($target.length) {
                $('html, body').animate({
                    scrollTop: $target.offset().top - 80 // Offset for fixed header
                }, 400);
                
                // On mobile/tablet, collapse after click
                if ($(window).width() < 1000) {
                    $toc.addClass('collapsed');
                    $toggleBtn.html('<span style="font-size:14px">☰</span>');
                }
            }
        } catch (err) {
            console.error("TOC Scroll Error:", err);
            // Fallback
            window.location.hash = target;
        }
    });

    // Highlight Active Link on Scroll (ScrollSpy)
    var scrollTimeout;
    $(window).scroll(function() {
        if (scrollTimeout) clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(function() {
            var scrollPos = $(window).scrollTop() + 100; // Offset matches header height + padding
            
            // Find the section that is currently in view
            var currentId = "";
            $('.post-content h1, .post-content h2, .post-content h3, .post-content h4, .post-content h5').each(function() {
                var $this = $(this);
                // If this header is above the "read line"
                if ($this.offset().top < scrollPos) {
                    currentId = '#' + $this.attr('id');
                }
            });

            if (currentId) {
                // Robust matching handling URL encoding (e.g. for Chinese headers)
                var $currentLink = $('.toc-link').filter(function() {
                    var href = $(this).attr('href');
                    if (!href) return false;
                    try {
                        return decodeURIComponent(href) === decodeURIComponent(currentId);
                    } catch (e) {
                        return href === currentId;
                    }
                });

                if ($currentLink.length && !$currentLink.hasClass('active')) {
                    $('.toc-link').removeClass('active');
                    $currentLink.addClass('active');

                     // Auto-scroll TOC to show active link
                    var $tocContent = $toc.find('.toc-content');
                    if ($tocContent.length && !$toc.hasClass('collapsed')) {
                       // detailed scroll logic could go here, omitting for simplicity unless requested
                    }
                }
            } else {
                // If at top and no header passed yet, maybe highlight first? 
                // Or clear all. Clearing is safer.
                $('.toc-link').removeClass('active');
            }
        }, 50);
    });
  }
});




$(document).ready(function() {
  // Category Modal Logic
  var $modal = $('#categoryModal');
  var $btn = $('#categoryMoreBtn');
  var $close = $('.close-modal');

  if ($modal.length && $btn.length) {
    $btn.click(function(e) {
      e.stopPropagation();
      $modal.css('display', 'block');
      $('body').css('overflow', 'hidden');
    });

    $close.click(function() {
      $modal.css('display', 'none');
      $('body').css('overflow', 'auto');
    });

    $(window).click(function(event) {
      if (event.target == $modal[0]) {
        $modal.css('display', 'none');
        $('body').css('overflow', 'auto');
      }
    });

    $(document).keydown(function(e) {
      if (e.key === "Escape" && $modal.css('display') === 'block') {
        $modal.css('display', 'none');
        $('body').css('overflow', 'auto');
      }
    });
  }
});


/* Scroll Down Logic */
$(document).ready(function() {
  $("#scrollDownBtn").click(function() {
    var $target = $(".container"); 
    // Or .main-column, but .container starts the content area
    if ($target.length) {
      $("html, body").animate({
        scrollTop: $target.offset().top + 50 // Adjust if needed
      }, 800);
    }
  });
});

