/* Global var */
var MaiNguyen = {};
MaiNguyen.myScroll = null;
/* nho detect js scrollTo cho Firefox body,html */
// Hide Header on on scroll down
var didScroll;
var lastScrollTop = 0;
var delta = 5;
var navbarHeight = $('header').outerHeight() + 50;
/**
 * ======================================================= */

/* Danh gia chi so assess-action */
function assessAction(){
  var flag = false;
  var index;
  var asessAction = $('.assess-action');
  var voted = asessAction.hasClass('voted');

  if(voted){
    return false;
  }
  var liAssess = asessAction.children("li");
  liAssess.hover(function(){
    $(this).prevAll().andSelf().addClass("active");
    $(this).nextAll().removeClass("active");
  },function(){
    if(!flag){
      $(this).prevAll().andSelf().removeClass("active");
    }else{
      liAssess.eq(index).prevAll().andSelf().addClass("active");
      liAssess.eq(index).nextAll().removeClass("active");
    }
  });
  liAssess.click(function(){
    flag = true;
    index = liAssess.index($(this));
    $(this).parents(".assess-grp").find("#star-point").val(index);
    console.log(index);
  });
}
/**
 * [animateBreakdown description]
 * @param  {[type]} el    [description]
 * @param  {[type]} index [description]
 * @return {[type]}       [description]
 */
function animateBreakdown(el, index){
  var $bar = $(el).eq(index).find('.temperature');
  var dataHeat = $(el).eq(index).find('li[data-heat]');
  var valHeat = dataHeat.attr('data-heat');
  if(valHeat < 10){
    valHeat = '0'+valHeat;
  }
  $bar.animate({
    'left' : valHeat+'0%'
  }, 500, function(){
            index++;
            $(dataHeat).text(valHeat);
            if(index <= $(el).length){
              animateBreakdown($(el), index);
            }else{
              return 1;
            }
  });
}
/**
 * [scrollToBreakDown description]
 * @param  {Boolean} isRun [description]
 * @return {[type]}        [description]
 */
function scrollToBreakDown(isRun){
  var wrapupContent = $('.wrapup-content');
  if (!wrapupContent.length) {
    return;
  }
  var topObj = $(wrapupContent).offset().top - 150;
  $(document).scroll(function(e){
    var newScroll = $(document).scrollTop();
    if(newScroll >= topObj){
      if(isRun === 0 ){
        isRun = animateBreakdown($('.score-grid > li'), 0);
      }
    }
  });
}
/**
 * [backTop description]
 * @return {[type]} [description]
 */
function backTop(){
  $('.back-top, .back-topmb').click(function(){
    $('body,html').animate({
      scrollTop: 0
    }, 800);
    return false;
  });
}
/**
 * [scrollToComment description]
 * @return {[type]} [description]
 */
function scrollToComment(){
  if (!$('.point-block a').length) {return;}
  $('.point-block a').on('click', function(e){
    $('body,html').animate({
        scrollTop: $('.formcm-block').offset().top - 170
    }, 800);
    return false;
  });
  $('.list-social .icon-social-4').on('click', function(){
       $('.point-block a').click();
  });
}
/**
 * [navMainMobile description]
 * @return {[type]} [description]
 */
function navMainMobile(){
  var html = $("html");
  var overlay = $('<div class="overlay"></div>').appendTo($('body'));

  $('.btn-nav').bind('click touchstart', function(event) {
    event.preventDefault();
    if(html.hasClass('open-nav')) {
      $(this).removeClass('active');
      html.removeClass('open-nav');
      overlay.fadeOut();
    }else{
      $(this).addClass('active');
      html.addClass('open-nav');
      overlay.fadeIn();
    }
    $('.overlay').bind('click touchstart',function(e){
      if(!$(e.target).is('#mobile-nav')){
        $('html').removeClass('open-nav');
        overlay.fadeOut();
        return false;
      }
    });
  });
  $('#mobile-nav .nav-item.has-dropdown h2').unbind('click').bind('click', function() {
    var that = $(this);
    var isShowing = that.parent().hasClass('active');
    that.parent()[isShowing ? 'removeClass' : 'addClass']('active');
    that.next(".sub-nav").slideToggle(function(){
      MaiNguyen.myScroll.refresh();
    });
  });
}
/* remove sticky meny and disable scrollby when window w < 979px */
/**
 * [disableScrollBy description]
 * @return {[type]} [description]
 */
function disableScrollBy(){
  var wWindow = $(window).width();
  if (wWindow <= 1050) {
    $('body').removeAttr('data-spy');
    $('body').removeAttr('data-target');
  }else {
    $('body').attr('data-spy','scroll');
    $('body').attr('data-target','.sidebar-nav');
  }
}
/* set height cate review when content short */
/**
 * [setHeightRV description]
 */
function setHeightRV(){
  var reviewPage = $('.review-page');
  var hContainer = $(document).height() - $('#header').height() - $('#footer').height();
  if (!reviewPage.length) {
    return;
  }
  if (reviewPage.height() < hContainer){
    $('.review-page > .span10').css({
      'height' : hContainer
    });
  }else {
    $('.review-page > .span10').css({
      'height' : 'auto'
    });
  }
}
/* dropdown nav-grproduct page cate review */
/**
 * [dropdownNavP description]
 * @return {[type]} [description]
 */
function dropdownNavP(){
  var wWindow = $(window).width();
  var objNav = $('.nav-grproduct h2');

  if (wWindow <= 979) {
    objNav.unbind('click').bind('click', function(e){
      e.stopPropagation();
      $(this).next().stop().slideToggle();
      var aNav = $(this).next().find('a');
      aNav.click(function(){
        var textObj = objNav.text();
        var text = $(this).text();
        objNav.contents()[0].data = text;
        objNav.next().slideUp();
        return true;
      });
    });
    $('#container').bind('click',function(e){
        objNav.next().slideUp();
    });
  }else {
    objNav.next().show();
  }
}
/**
 * [commonF description]
 * @return {[type]} [description]
 */
function commonF () {
    /* tab on menu -- submenu review */
    $('.tab-type-1 .nav-tabs a').on('mouseover', function(e){
        // e.preventDefault();
        e.stopPropagation();
        $(this).tab('show');
    }).on('click', function(e){
        e.preventDefault();
        $(this).tab('show');
        return false;
    });

    /* fix menu when load page */
    $('#header').css({
      'overflow' : 'hidden'
    });
}
/**
 * [runflexSlider description]
 * @param  {[type]} slider_wrp [description]
 * @return {[type]}            [description]
 */
function runflexSlider (slider_wrp) {
  // .gallery-carousel
    if (!$(slider_wrp).length) {return;}
    $(slider_wrp).each(function () {
        if (!$(this).find('.slider-flexs').length) {return;}
        if (!$(this).find('.carousel-flexs').length) {return;}

        $slider   = $(this).find('.slider-flexs');
        $carousel = $(this).find('.carousel-flexs');

        // LARGE SLIDER
        $slider.flexslider({
            animation: "slide",
            controlNav: false,
            animationLoop: false,
            slideshow: false,
            sync: '#' + $carousel.attr('id'),
            start: function(slider) {
              $(slider).find('.flex-direction-nav .flex-prev').attr('title','Trước').html('<span>Trước</span>');
              $(slider).find('.flex-direction-nav .flex-next').attr('title','Sau').html('<span>Sau</span>');
            }
        });

        $carousel.flexslider({
            animation: "slide",
            controlNav: false,
            animationLoop: false,
            slideshow: false,
            itemWidth: 160,
            itemMargin: 2,
            asNavFor: '#' + $slider.attr('id')
        });
    });
}
 /**
  *
  * @return {[type]} [description]
  */
function galleryMainSlider () {
  if (!$('.gallery-main .flexslider').length) {return;}
  $('.gallery-main .flexslider').flexslider({
      directionNav: false,
      direction: "horizontal"
  });
}

/**
 * [popupSGallery description]
 * @return {[type]} [description]
 */
function popupSGallery () {
  if (!$('.thumbnails-1').length) {return;}
  /* light box */
  $('.thumbnails-1').each(function () {
    $(this).magnificPopup({
        delegate: 'a',
        type: 'image',
        tLoading: 'Loading image #%curr%...',
        mainClass: 'mfp-img-mobile',
        gallery: {
          enabled: true,
          navigateByImgClick: true,
          preload: [0,1], // Will preload 0 - before current, and 1 after the current image
          tCounter: "%curr% / %total%"
        },
        image: {
          tError: '<a href="%url%">Hình #%curr%</a> đang cố sự cố khi tải',
          titleSrc: function(item) {
            return 'Bấm vào hình để xem tiếp';
          }
        }
    });
  });
}

/**
 * [getColorForBorder description]
 * @return {[type]} [description]
 */
function getColorForBorder () {
  if (!$('.gallery-caption h2 .num-mag').length) {return;}

  if ($('.gallery-caption h2').css('color')  !== 'rgb(255, 255, 255)') {
      $('.gallery-caption h2 .num-mag').css('border-color', $('.gallery-caption h2').css('color'));
      $('.gallery-caption .desc p').css('color', $('.gallery-caption h2').css('color'));
  }

}
/**
 * [hoverBrand description]
 * @return {[type]} [description]
 */
function hoverBrand(){
  var header = $('#header');
  $( ".brand" ).mouseenter(function(e) {
    if(header.hasClass('nav-down')) {
      header.addClass('hover-brand');
    }
  });
  header.mouseleave(function(e) {
    header.removeClass('hover-brand');
  });
}

/**
 * [hasScrolled description]
 * @return {Boolean} [description]
 */
function hasScrolled() {
  var scrollTop = $(this).scrollTop();

  // Make sure they scroll more than delta
  if(Math.abs(lastScrollTop - scrollTop) <= delta) {return;}

  // If they scrolled down and are past the navbar, add class .nav-up.
  // This is necessary so you never see what is "behind" the navbar.
  if (scrollTop > lastScrollTop && scrollTop > navbarHeight){
    // Scroll Down
    $('header').removeClass('nav-down').addClass('nav-up');
  } else {
    // Scroll Up
    if(scrollTop + $(window).height() < $(document).height()) {
      $('header').removeClass('nav-up').addClass('nav-down');
    }
  }
  if (scrollTop < 70){
    $('header').removeClass('nav-down');
  }

  lastScrollTop = scrollTop;
}
/* -----------------------------------  */
/* -----------------------------------  */
/* window resize */
function windowReSize(){
  $(window).resize(function() {
    disableScrollBy();
    dropdownNavP();
    if ($(window).width() > 979) {
      hoverBrand();
    }
  });
}


$(window).scroll(function(event){
    didScroll = true;
});

setInterval(function() {
  if (didScroll && $(window).width() > 979) {
    hasScrolled();
    didScroll = false;
  }
}, 250);

/* -----------------------------------  */
/**
 * Website start here
 */
jQuery(document).ready(function($){
  commonF ();
  galleryMainSlider ();
  /* dropdown nav-grproduct : cate page */
  dropdownNavP();
  /*mobile-nav*/
  MaiNguyen.myScroll = new iScroll('imobile-nav');
  /* navMain mobile */
  navMainMobile();
  /* ---- */
  assessAction();
  scrollToComment();
  backTop();
  runflexSlider('.gallery-carousel');
  popupSGallery ();
  windowReSize();
  disableScrollBy();
  getColorForBorder();
  if ($(window).width() > 979) {
    hoverBrand();
  }
});
/* WINDOW */
jQuery(window).load(function(){
  setHeightRV();
  /* fix menu when load page */
  $('#header').css({
    'overflow' : 'visible'
  });
  /* scroll page animate BreakDown */
  var isRun = 0;
  scrollToBreakDown(isRun);
  /* dropdown */
  $('.dropdown-toggle').dropdown();
  /* get, set text when dropdow */
  $(".group-select li a").click(function(){
      $(".btn .text").text($(this).text());
      $(".btn").attr("data-rel",$(this).parent().attr("data-rel"));
  });
});
