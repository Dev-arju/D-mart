/*  ---------------------------------------------------
    Template Name: Ogani
    Description:  Ogani eCommerce  HTML Template
    Author: Colorlib
    Author URI: https://colorlib.com
    Version: 1.0
    Created: Colorlib
---------------------------------------------------------  */

'use strict';

(function ($) {

    /*------------------
        Preloader
    --------------------*/
    $(window).on('load', function () {
        $(".loader").fadeOut();
        $("#preloder").delay(200).fadeOut("slow");

        /*------------------
            Gallery filter
        --------------------*/
        $('.featured__controls li').on('click', function () {
            $('.featured__controls li').removeClass('active');
            $(this).addClass('active');
        });
        if ($('.featured__filter').length > 0) {
            var containerEl = document.querySelector('.featured__filter');
            var mixer = mixitup(containerEl);
        }
        
    });

    /*------------------
        Background Set
    --------------------*/
    $('.set-bg').each(function () {
        var bg = $(this).data('setbg');
        $(this).css('background-image', 'url(' + bg + ')');
    });

    //Humberger Menu
    $(".humberger__open").on('click', function () {
        $(".humberger__menu__wrapper").addClass("show__humberger__menu__wrapper");
        $(".humberger__menu__overlay").addClass("active");
        $("body").addClass("over_hid");
    });

    $(".humberger__menu__overlay").on('click', function () {
        $(".humberger__menu__wrapper").removeClass("show__humberger__menu__wrapper");
        $(".humberger__menu__overlay").removeClass("active");
        $("body").removeClass("over_hid");
    });

    /*------------------
		Navigation
	--------------------*/
    $(".mobile-menu").slicknav({
        prependTo: '#mobile-menu-wrap',
        allowParentLinks: true
    });

    /*-----------------------
        Categories Slider
    ------------------------*/
    $(".categories__slider").owlCarousel({
        loop: true,
        margin: 0,
        items: 4,
        dots: false,
        nav: true,
        navText: ["<span class='fa fa-angle-left'><span/>", "<span class='fa fa-angle-right'><span/>"],
        animateOut: 'fadeOut',
        animateIn: 'fadeIn',
        smartSpeed: 1200,
        autoHeight: false,
        autoplay: true,
        responsive: {

            0: {
                items: 1,
            },

            480: {
                items: 2,
            },

            768: {
                items: 3,
            },

            992: {
                items: 4,
            }
        }
    });


    $('.hero__categories__all').on('click', function(){
        $('.hero__categories ul').slideToggle(400);
    });

    /*--------------------------
        Latest Product Slider
    ----------------------------*/
    $(".latest-product__slider").owlCarousel({
        loop: true,
        margin: 0,
        items: 1,
        dots: false,
        nav: true,
        navText: ["<span class='fa fa-angle-left'><span/>", "<span class='fa fa-angle-right'><span/>"],
        smartSpeed: 1200,
        autoHeight: false,
        autoplay: true
    });

    /*-----------------------------
        Product Discount Slider
    -------------------------------*/
    $(".product__discount__slider").owlCarousel({
        loop: true,
        margin: 0,
        items: 3,
        dots: true,
        smartSpeed: 1200,
        autoHeight: false,
        autoplay: true,
        responsive: {

            320: {
                items: 1,
            },

            480: {
                items: 2,
            },

            768: {
                items: 2,
            },

            992: {
                items: 3,
            }
        }
    });

    /*---------------------------------
        Product Details Pic Slider
    ----------------------------------*/
    $(".product__details__pic__slider").owlCarousel({
        loop: true,
        margin: 20,
        items: 4,
        dots: true,
        smartSpeed: 1200,
        autoHeight: false,
        autoplay: true
    });

    /*-----------------------
		Price Range Slider
	------------------------ */
    var rangeSlider = $(".price-range"),
        minamount = $("#minamount"),
        maxamount = $("#maxamount"),
        minPrice = rangeSlider.data('min'),
        maxPrice = rangeSlider.data('max');
    rangeSlider.slider({
        range: true,
        min: minPrice,
        max: maxPrice,
        values: [minPrice, maxPrice],
        slide: function (event, ui) {
            minamount.val('$' + ui.values[0]);
            maxamount.val('$' + ui.values[1]);
        }
    });
    minamount.val('$' + rangeSlider.slider("values", 0));
    maxamount.val('$' + rangeSlider.slider("values", 1));

    /*--------------------------
        Select
    ----------------------------*/
    $("select").niceSelect();

    /*------------------
		Single Product
	--------------------*/
    $('.product__details__pic__slider img').on('click', function () {

        var imgurl = $(this).data('imgbigurl');
        var bigImg = $('.product__details__pic__item--large').attr('src');
        if (imgurl != bigImg) {
            $('.product__details__pic__item--large').attr({
                src: imgurl
            });
        }
    });

    /*-------------------
		Quantity change
	--------------------- */
    var proQty = $('.pro-qty');

    proQty.on('click', '.qtybtn', function () {
        var $button = $(this);
        var proId = $button.attr('data-proId')
        var oldValue = $button.parent().find('input').val();
        var proPrice = $button.parent().find('input').data('price')
        var totalField = $button.closest('.product-row').find('.total-price')
    

        if ($button.hasClass('inc')) {
            let inc = true
            var newVal = parseInt(oldValue) + 1;
            var total = newVal * proPrice
            //ajax jquery
            $.ajax({
                url: '/cart/update/quantity',
                method: 'put',
                data: { proId , inc, newVal},
                success: function(response) {
                  // Handle the response from the server
                  totalField.html('&#x20B9; ' + total)
                  totalField.attr('data-itemTotal', total)
                    console.log(response);
                },
                error: function(xhr, status, error) {
                  // Handle the error from the server
                  console.error(error);
                }
              });
              
        } else {
            let dec = true
            // Don't allow decrementing below zero
            if (oldValue > 1) {
                var newVal = parseInt(oldValue) - 1;
                var total = newVal * proPrice
                //ajax jquery
            $.ajax({
                url: '/cart/update/quantity',
                method: 'put',
                data: { proId , dec, newVal},
                success: function(response) {
                  // Handle the response from the server
                  totalField.html('&#x20B9; ' + total)
                  totalField.attr('data-itemTotal', total)
                    console.log(response);
                },
                error: function(xhr, status, error) {
                  // Handle the error from the server
                  console.error(error);
                }
              });
            } else if (oldValue == 1){
                newVal = 1;
            }
        }
        $button.parent().find('input').val(newVal);
    });

    /*-------------------
		Delete product
	--------------------- */
    var delBtn = $('.del-btn')
    let subTotalField = $('#subTotal')
    let totalField = $('#total')

    delBtn.click(function (){
        let $btn = $(this)
        let proId = $btn.attr('data-proId')

        Swal.fire({
            title: "Confirmation",
            text: "Are you sure you want to delete this cart item?",
            icon: "question",
            showCancelButton: true,
            confirmButtonText: "Yes",
            cancelButtonText: "No",
          }).then((result) => {
            if(result.isConfirmed){
                $.ajax({
                    url: '/cart/delete',
                    method: 'delete',
                    data: { proId },
                    success: async function(response) {
                      // Handle the response from the server
                        let sub = 0
                        $('.total-price').each(function() {
                            sub += parseInt($(this).attr('data-itemTotal'));
                        });
                            subTotalField.html('&#x20B9; ' + sub)
                            totalField.html('&#x20B9; ' + sub)
                            console.log(response);
                            await  Swal.fire("Success", "Product Deleted from cart", "success");
                            location.reload()
                    },
                    error: function(xhr, status, error) {
                      // Handle the error from the server
                      console.error(error);
                    }
                  });
            }
          })
    })
    

})(jQuery);