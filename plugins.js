(function ($) {
  "use strict";

  var defaults = {
    animateTime: 200,
    aniHide: 0
  };

  var Affixed = function(el, options) {
    this.options = $.extend(defaults, options);
    this.el = el;

    this.elementHeight = el.height() + 100;
    this.elementTop = parseInt(el.css('top'), 10);
    this.documentHeight = $(document).height();
    this.windowHeight = $(window).height();

    this.lastFromTop = 0;
    this.sclUp = 0;
    this.sclDown = 0;
    this.upperHit = false;
    this.lowerHit = false;
    this.lastScroll = 0;

    var that = this;

    $(window).resize(function() {
      that.onResize();
    });

    $(window).scroll(function() {
      that.onScroll();
    });
  };

  Affixed.prototype.hideMenu = function() {
    $(this.el).addClass('hide-header').removeClass('affixed');
    // $(this.el).stop().animate({
    //   display: 'hide',
    //   opacity: 0,
    //   top: '-=' + this.elementHeight
    // }, this.options.aniHide, function() {
    //   $(this).css('top');
    // });
  };

  Affixed.prototype.addClassAffixed = function() {
    $(this.el).addClass('affixed');
  };

  Affixed.prototype.removeClassAffixed = function() {
    $(this.el).removeClass('affixed');
  };

  Affixed.prototype.showMenu = function(fromTop) {
    // $(this.el).stop().animate({
    //   display: 'block',
    //   opacity: 1,
    //   top: this.elementTop > 0 && fromTop < this.elementTop ? this.elementTop : 0
    // }, this.options.animateTime);
    $(this.el).removeClass('hide-header').addClass('affixed');
  };

  Affixed.prototype.onResize = function() {
    this.documentHeight = $(document).height();
    this.windowHeight = $(window).height();
  };

  Affixed.prototype.onScroll = function() {
    var now = +new Date(),
    fromTop = $(window).scrollTop(),
    atBottom = fromTop >= (this.documentHeight - this.windowHeight - 5);
    // if(fromTop < 300) {
    //   this.removeClassAffixed();
    // }else {
    //   this.addClassAffixed();
    // }
    if(this.elementTop === 0) {
      // If element top is 0 we can defer the scroll events and reduce methods fired.
      if((now - this.lastScroll < 250)) {
        return;
      }
    } else {
      // However due to continue change in the menu position when scrolling we need to fire
      // each of the scroll events when the menu top is > 0 ensuring smooth animation.
      var adjustedTop = fromTop < 0 ? 0 : fromTop;
      $(this.el).css('top', fromTop > this.elementTop ? 0 : this.elementTop - adjustedTop);
    }

    // Clear animation queue and set to visible if user hits the top of the page suddenly.
    if(fromTop <= 0) {
      $(this.el).stop(true);
      $(this.el).show().fadeTo(0, 1).css('top', this.elementTop);
    }

    if (!atBottom && fromTop > this.lastFromTop) {
      this.sclUp = 0;
      this.lowerHit = false;
      this.sclDown += (fromTop - this.lastFromTop);

      if (!this.upperHit && (this.sclDown > this.elementHeight)) {
        this.upperHit = true;
        this.hideMenu();
      }
    } else {
      this.sclDown = 0;
      this.upperHit = false;
      this.sclUp += (this.lastFromTop - fromTop);

      if (!this.lowerHit && (this.sclUp > this.elementHeight || fromTop >= this.windowHeight)) {
        this.lowerHit = true;
        this.showMenu(fromTop);
      }
    }

    this.lastFromTop = fromTop;
    this.lastScroll = now;
  };

  $.fn.Affixed = function (options) {
    new Affixed(this, options);
  };

}(jQuery));

!function($) {

    "use strict";

    var Selectpicker = function(element, options, e) {
        if (e) {
            e.stopPropagation();
            e.preventDefault();
        }
        this.$element = $(element);
        this.$newElement = null;
        this.button = null;

        //Merge defaults, options and data-attributes to make our options
        this.options = $.extend({}, $.fn.selectpicker.defaults, this.$element.data(), typeof options == 'object' && options);

        //If we have no title yet, check the attribute 'title' (this is missed by jq as its not a data-attribute
        if(this.options.title==null)
            this.options.title = this.$element.attr('title');

        //Expose public methods
        this.val = Selectpicker.prototype.val;
        this.render = Selectpicker.prototype.render;
        this.refresh = Selectpicker.prototype.refresh;
        this.selectAll = Selectpicker.prototype.selectAll;
        this.deselectAll = Selectpicker.prototype.deselectAll;
        this.init();
    };

    Selectpicker.prototype = {

        constructor: Selectpicker,

        init: function (e) {
            if (!this.options.container) {
                this.$element.hide();
            } else {
                this.$element.css('visibility','hidden');
            };
            this.multiple = this.$element.prop('multiple');
            var id = this.$element.attr('id');
            this.$newElement = this.createView()
            this.$element.after(this.$newElement);

            if (this.options.container) {
                this.selectPosition();
            }
            this.button = this.$newElement.find('> button');
            if (id !== undefined) {
                var _this = this;
                this.button.attr('data-id', id);
                $('label[for="' + id + '"]').click(function(){
                    _this.button.focus();
                })
            }
            if (this.$element.attr('class')) {
                this.$newElement.addClass(this.$element.attr('class').replace(/selectpicker/gi, ''));
            }

            //If we are multiple, then add the show-tick class by default
            if(this.multiple) {
                 this.$newElement.addClass('show-tick');
            }
            this.button.addClass(this.options.style);
            this.checkDisabled();
            this.checkTabIndex();
            this.clickListener();

            this.render();
            this.setSize();
        },

        createDropdown: function() {
            var drop =
                "<div class='btn-group bootstrap-select'>" +
                    "<button type='button' class='btn dropdown-toggle' data-toggle='dropdown'>" +
                        "<div class='filter-option pull-left'></div>&nbsp;" +
                        "<div class='caret'></div>" +
                    "</button>" +
                    "<ul class='dropdown-menu' role='menu'>" +
                    "</ul>" +
                "</div>";

            return $(drop);
        },


        createView: function() {
            var $drop = this.createDropdown();
            var $li = this.createLi();
            $drop.find('ul').append($li);
            return $drop;
        },

        reloadLi: function() {
            //Remove all children.
            this.destroyLi();
            //Re build
            var $li = this.createLi();
            this.$newElement.find('ul').append( $li );
        },

        destroyLi:function() {
            this.$newElement.find('li').remove();
        },

        createLi: function() {

            var _this = this;
            var _liA = [];
            var _liHtml = '';


            this.$element.find('option').each(function(index) {
                var $this = $(this);

                //Get the class and text for the option
                var optionClass = $this.attr("class") || '';
                var text =  $this.text();
                var subtext = $this.data('subtext') !== undefined ? '<small class="muted">' + $this.data('subtext') + '</small>' : '';
                var icon = $this.data('icon') !== undefined ? '<i class="'+$this.data('icon')+'"></i> ' : '';
                if (icon !== '' && ($this.is(':disabled') || $this.parent().is(':disabled'))) {
                    icon = '<span>'+icon+'</span>';
                }

                //Prepend any icon and append any subtext to the main text.
                text = icon + '<span class="text">' + text + subtext + '</span>';

                if (_this.options.hideDisabled && ($this.is(':disabled') || $this.parent().is(':disabled'))) {
                    _liA.push('<a style="min-height: 0; padding: 0"></a>');
                } else if ($this.parent().is('optgroup') && $this.data('divider') != true) {
                    if ($this.index() == 0) {
                        //Get the opt group label
                        var label = $this.parent().attr('label');
                        var labelSubtext = $this.parent().data('subtext') !== undefined ? '<small class="muted">'+$this.parent().data('subtext')+'</small>' : '';
                        var labelIcon = $this.parent().data('icon') ? '<i class="'+$this.parent().data('icon')+'"></i> ' : '';
                        label = labelIcon + '<span class="text">' + label + labelSubtext + '</span>';

                        if ($this[0].index != 0) {
                            _liA.push(
                                '<div class="div-contain"><div class="divider"></div></div>'+
                                '<dt>'+label+'</dt>'+
                                _this.createA(text, "opt " + optionClass )
                                );
                        } else {
                            _liA.push(
                                '<dt>'+label+'</dt>'+
                                _this.createA(text, "opt " + optionClass ));
                        }
                    } else {
                         _liA.push( _this.createA(text, "opt " + optionClass )  );
                    }
                } else if ($this.data('divider') == true) {
                    _liA.push('<div class="div-contain"><div class="divider"></div></div>');
                } else if ($(this).data('hidden') == true) {
                    _liA.push('');
                } else {
                    _liA.push( _this.createA(text, optionClass ) );
                }
            });

            $.each(_liA, function(i, item){
                _liHtml += "<li rel=" + i + ">" + item + "</li>";
            });

            //If we are not multiple, and we dont have a selected item, and we dont have a title, select the first element so something is set in the button
            if(!this.multiple && this.$element.find('option:selected').length==0 && !_this.options.title) {
                this.$element.find('option').eq(0).prop('selected', true).attr('selected', 'selected');
            }

            return $(_liHtml);
        },

        createA:function(text, classes) {
         return '<a tabindex="0" class="'+classes+'">' +
                 text +
                 '<i class="icon-ok check-mark"></i>' +
                 '</a>';
        },

        render:function() {
            var _this = this;

            //Update the LI to match the SELECT
            this.$element.find('option').each(function(index) {
               _this.setDisabled(index, $(this).is(':disabled') || $(this).parent().is(':disabled') );
               _this.setSelected(index, $(this).is(':selected') );
            });

            var selectedItems = this.$element.find('option:selected').map(function(index,value) {
                var subtext;
                if (_this.options.showSubtext && $(this).attr('data-subtext') && !_this.multiple) {
                    subtext = ' <small class="muted">'+$(this).data('subtext') +'</small>';
                } else {
                    subtext = '';
                }
                if($(this).attr('title')!=undefined) {
                    return $(this).attr('title');
                } else {
                    return $(this).text() + subtext;
                }
            }).toArray();

            //Fixes issue in IE10 occurring when no default option is selected and at least one option is disabled
            //Convert all the values into a comma delimited string
            var title = !this.multiple ? selectedItems[0] : selectedItems.join(", "),
                separator = _this.options.separatorText || _this.options.defaultSeparatorText,
                selected = _this.options.selectedText || _this.options.defaultSelectedText;

            //If this is multi select, and the selectText type is count, the show 1 of 2 selected etc..
            if(_this.multiple && _this.options.selectedTextFormat.indexOf('count') > -1) {
                var max = _this.options.selectedTextFormat.split(">");
                var notDisabled = this.options.hideDisabled ? ':not([disabled])' : '';
                if( (max.length>1 && selectedItems.length > max[1]) || (max.length==1 && selectedItems.length>=2)) {
                    title = _this.options.countSelectedText.replace('{0}', selectedItems.length).replace('{1}', this.$element.find('option:not([data-divider="true"]):not([data-hidden="true"])'+notDisabled).length);
                }
             }

            //If we dont have a title, then use the default, or if nothing is set at all, use the not selected text
            if(!title) {
                title = _this.options.title != undefined ? _this.options.title : _this.options.noneSelectedText;
            }

            var subtext;
            if (this.options.showSubtext && this.$element.find('option:selected').attr('data-subtext')) {
                subtext = ' <small class="muted">'+this.$element.find('option:selected').data('subtext') +'</small>';
            } else {
                subtext = '';
            }

            var icon = this.$element.find('option:selected').data('icon') || '';
            if(icon.length) {
                icon = '<i class="' + icon + '"></i> ';
            }

            _this.$newElement.find('.filter-option').html(icon + title + subtext);
        },

        setSize:function() {
            if(this.options.container) {
                // Show $newElement before perfoming size calculations
                this.$newElement.toggle(this.$element.parent().is(':visible'));
            }
            var _this = this;
            var menu = this.$newElement.find('.dropdown-menu');
            var menuA = menu.find('li > a');
            var liHeight = this.$newElement.addClass('open').find('.dropdown-menu li > a').outerHeight();
            this.$newElement.removeClass('open');
            var divHeight = menu.find('li .divider').outerHeight(true);
            var selectOffset_top = this.$newElement.offset().top;
            var selectHeight = this.$newElement.outerHeight();
            var menuPadding = parseInt(menu.css('padding-top')) + parseInt(menu.css('padding-bottom')) + parseInt(menu.css('border-top-width')) + parseInt(menu.css('border-bottom-width'));
            var notDisabled = this.options.hideDisabled ? ':not(.disabled)' : '';
            var menuHeight;
            if (this.options.size == 'auto') {
                var getSize = function() {
                    var selectOffset_top_scroll = selectOffset_top - $(window).scrollTop();
                    var windowHeight = window.innerHeight;
                    var menuExtras = menuPadding + parseInt(menu.css('margin-top')) + parseInt(menu.css('margin-bottom')) + 2;
                    var selectOffset_bot = windowHeight - selectOffset_top_scroll - selectHeight - menuExtras;
                    var minHeight;
                    menuHeight = selectOffset_bot;
                    if (_this.$newElement.hasClass('dropup')) {
                        menuHeight = selectOffset_top_scroll - menuExtras;
                    }
                    if ((menu.find('li').length + menu.find('dt').length) > 3) {
                        minHeight = liHeight*3 + menuExtras - 2;
                    } else {
                        minHeight = 0;
                    }
                    menu.css({'max-height' : menuHeight + 'px', 'overflow-y' : 'auto', 'min-height' : minHeight + 'px'});
            }
                getSize();
                $(window).resize(getSize);
                $(window).scroll(getSize);
            } else if (this.options.size && this.options.size != 'auto' && menu.find('li'+notDisabled).length > this.options.size) {
                var optIndex = menu.find("li"+notDisabled+" > *").filter(':not(.div-contain)').slice(0,this.options.size).last().parent().index();
                var divLength = menu.find("li").slice(0,optIndex + 1).find('.div-contain').length;
                menuHeight = liHeight*this.options.size + divLength*divHeight + menuPadding;
                menu.css({'max-height' : menuHeight + 'px', 'overflow-y' : 'auto'});
            }

            //Set width of select
            if (this.options.width == 'auto') {
                this.$newElement.find('.dropdown-menu').css('min-width','0');
                var ulWidth = this.$newElement.find('.dropdown-menu').css('width');
                this.$newElement.css('width',ulWidth);
                if (this.options.container) {
                    this.$element.css('width',ulWidth);
                }
            } else if (this.options.width) {
                if (this.options.container) {
                    // Note: options.width can be %
                    this.$element.css('width', this.options.width);
                    // Set pixel width of $newElement based on $element's pixel width
                    this.$newElement.width(this.$element.outerWidth());
                } else {
                    this.$newElement.css('width',this.options.width);
                }
            } else if(this.options.container) {
                // Set width of $newElement based on $element
                this.$newElement.width(this.$element.outerWidth());
            }
        },

        selectPosition:function() {
            var containerOffset = $(this.options.container).offset();
            var eltOffset = this.$element.offset();
            if(containerOffset && eltOffset) {
                var selectElementTop = eltOffset.top - containerOffset.top;
                var selectElementLeft = eltOffset.left - containerOffset.left;
                this.$newElement.appendTo(this.options.container);
                this.$newElement.css({'position':'absolute', 'top':selectElementTop+'px', 'left':selectElementLeft+'px'});
            }
        },

        refresh:function() {
            this.reloadLi();
            this.render();
            this.setSize();
            this.checkDisabled();
            if (this.options.container) {
                this.selectPosition();
            }
        },

        setSelected:function(index, selected) {
            if(selected) {
                this.$newElement.find('li').eq(index).addClass('selected');
            } else {
                this.$newElement.find('li').eq(index).removeClass('selected');
            }
        },

        setDisabled:function(index, disabled) {
            if(disabled) {
                this.$newElement.find('li').eq(index).addClass('disabled').find('a').attr('href','#').attr('tabindex',-1);
            } else {
                this.$newElement.find('li').eq(index).removeClass('disabled').find('a').removeAttr('href').attr('tabindex',0);
            }
        },

        isDisabled: function() {
            return this.$element.is(':disabled') || this.$element.attr('readonly');
        },

        checkDisabled: function() {
            if (this.isDisabled()) {
                this.button.addClass('disabled');
                this.button.click(function(e) {
                    e.preventDefault();
                });
                this.button.attr('tabindex','-1');
            } else if (!this.isDisabled() && this.button.hasClass('disabled')) {
                this.button.removeClass('disabled');
                this.button.click(function() {
                    return true;
                });
                this.button.removeAttr('tabindex');
            }
        },

        checkTabIndex: function() {
            if (this.$element.is('[tabindex]')) {
                var tabindex = this.$element.attr("tabindex");
                this.button.attr('tabindex', tabindex);
            }
        },

        clickListener: function() {
            var _this = this;

            $('body').on('touchstart.dropdown', '.dropdown-menu', function (e) { e.stopPropagation(); });

            this.$newElement.on('click', 'li a', function(e){
                var clickedIndex = $(this).parent().index(),
                    $this = $(this).parent(),
                    $select = $this.parents('.bootstrap-select'),
                    prevValue = _this.$element.val();

                //Dont close on multi choice menu
                if(_this.multiple) {
                    e.stopPropagation();
                }

                e.preventDefault();

                //Dont run if we have been disabled
                if (_this.$element.not(':disabled') && !$(this).parent().hasClass('disabled')){
                    //Deselect all others if not multi select box
                    if (!_this.multiple) {
                        _this.$element.find('option').prop('selected', false);
                        _this.$element.find('option').eq(clickedIndex).prop('selected', true);
                    }
                    //Else toggle the one we have chosen if we are multi select.
                    else {
                        var selected = _this.$element.find('option').eq(clickedIndex).prop('selected');

                        if(selected) {
                            _this.$element.find('option').eq(clickedIndex).prop('selected', false);
                        } else {
                            _this.$element.find('option').eq(clickedIndex).prop('selected', true);
                        }
                    }

                    $select.find('button').focus();

                    // Trigger select 'change'
                    if (prevValue != _this.$element.val()) {
                        _this.$element.trigger('change');
                    }

                    _this.render();
                }

            });

           this.$newElement.on('click', 'li.disabled a, li dt, li .div-contain', function(e) {
                e.preventDefault();
                e.stopPropagation();
                var $select = $(this).parent().parents('.bootstrap-select');
                $select.find('button').focus();
            });

            this.$element.on('change', function(e) {
                _this.render();
            });
        },

        val:function(value) {

            if(value!=undefined) {
                this.$element.val( value );

                this.$element.trigger('change');
                return this.$element;
            } else {
                return this.$element.val();
            }
        },

        selectAll:function() {
            this.$element.find('option').prop('selected', true).attr('selected', 'selected');
            this.render();
        },

        deselectAll:function() {
            this.$element.find('option').prop('selected', false).removeAttr('selected');
            this.render();
        },

        keydown: function (e) {
            var $this,
                $items,
                $parent,
                index,
                next,
                first,
                last,
                prev,
                nextPrev

            $this = $(this);

            $parent = $this.parent();

            $items = $('[role=menu] li:not(.divider):visible a', $parent);

            if (!$items.length) return;

            if (/(38|40)/.test(e.keyCode)) {

                index = $items.index($items.filter(':focus'));

                first = $items.parent(':not(.disabled)').first().index();
                last = $items.parent(':not(.disabled)').last().index();
                next = $items.eq(index).parent().nextAll(':not(.disabled)').eq(0).index();
                prev = $items.eq(index).parent().prevAll(':not(.disabled)').eq(0).index();
                nextPrev = $items.eq(next).parent().prevAll(':not(.disabled)').eq(0).index();

                if (e.keyCode == 38) {
                    if (index != nextPrev && index > prev) index = prev;
                    if (index < first) index = first;
                }

                if (e.keyCode == 40) {
                    if (index != nextPrev && index < next) index = next;
                    if (index > last) index = last;
                }

                $items.eq(index).focus()
            } else {
                var keyCodeMap = {
                    48:"0", 49:"1", 50:"2", 51:"3", 52:"4", 53:"5", 54:"6", 55:"7", 56:"8", 57:"9", 59:";",
                    65:"a", 66:"b", 67:"c", 68:"d", 69:"e", 70:"f", 71:"g", 72:"h", 73:"i", 74:"j", 75:"k", 76:"l",
                    77:"m", 78:"n", 79:"o", 80:"p", 81:"q", 82:"r", 83:"s", 84:"t", 85:"u", 86:"v", 87:"w", 88:"x", 89:"y", 90:"z",
                    96:"0", 97:"1", 98:"2", 99:"3", 100:"4", 101:"5", 102:"6", 103:"7", 104:"8", 105:"9"
                }

                var keyIndex = [];

                $items.each(function() {
                    if ($(this).parent().is(':not(.disabled)')) {
                        if ($.trim($(this).text().toLowerCase()).substring(0,1) == keyCodeMap[e.keyCode]) {
                            keyIndex.push($(this).parent().index());
                        }
                    }
                });

                var count = $(document).data('keycount');
                count++;
                $(document).data('keycount',count);

                var prevKey = $.trim($(':focus').text().toLowerCase()).substring(0,1);

                if (prevKey != keyCodeMap[e.keyCode]) {
                    count = 1;
                    $(document).data('keycount',count);
                } else if (count >= keyIndex.length) {
                    $(document).data('keycount',0);
                }

                $items.eq(keyIndex[count - 1]).focus();
            }

            if (/(13)/.test(e.keyCode)) {
                $(':focus').click();
                $parent.addClass('open');
                $(document).data('keycount',0);
            }
        }
    };

    $.fn.selectpicker = function(option, event) {
       //get the args of the outer function..
       var args = arguments;
       var value;
       var chain = this.each(function () {
            if ($(this).is('select')) {
                var $this = $(this),
                    data = $this.data('selectpicker'),
                    options = typeof option == 'object' && option;

                if (!data) {
                    $this.data('selectpicker', (data = new Selectpicker(this, options, event)));
                } else if(options){
                    for(var i in options) {
                       data.options[i]=options[i];
                    }
                }

                if (typeof option == 'string') {
                    //Copy the value of option, as once we shift the arguments
                    //it also shifts the value of option.
                    var property = option;
                    if(data[property] instanceof Function) {
                        [].shift.apply(args);
                        value = data[property].apply(data, args);
                    } else {
                        value = data.options[property];
                    }
                }
            }
        });

        if(value!=undefined) {
            return value;
        } else {
            return chain;
        }
    };

    $.fn.selectpicker.defaults = {
        style: null,
        size: 'auto',
        title: null,
        selectedTextFormat : 'values',
        noneSelectedText : 'Nothing selected',
        countSelectedText: '{0} of {1} selected',
        width: null,
        container: false,
        hideDisabled: false,
        showSubtext: false
    }

    $(document)
        .data('keycount', 0)
        .on('keydown', '[data-toggle=dropdown], [role=menu]' , Selectpicker.prototype.keydown)

}(window.jQuery);

/* =======================================================================
 * app-tabs.js
 * -----------
 * @author: phuongwd <phuongwd@gmail.com>
 * @changelog:
 * ---------- Forked from Twitter Bootstrap & linted
 * ---------- Added accessibility bindings (tab, shift+tab)
 * ======================================================================= */

(function($, App) {

  "use strict";

  var tabTrigger = '[data-toggle="tab"], [data-toggle="pill"]';

  /* TAB CLASS DEFINITION
   * ==================== */

  function Tab(element) {
    this.element = $(element);
  }

  Tab.prototype = {
    constructor: Tab,
    show: function() {
      var $this = this.element,
        $ul = $this.closest('ul:not(.dropdown-menu)'),
        selector = $this.attr('data-target'),
        previous, $target, e;

      if (!selector) {
        selector = $this.attr('href');
      }
      if ($this.parent('li').hasClass('active')) {
        return;
      }
      previous = $ul.find('.active:last a')[0];
      e = $.Event('show', {
        relatedTarget: previous
      });
      $this.trigger(e);
      if (e.isDefaultPrevented()) {
        return;
      }
      $target = $(selector);
      this.activate($this.parent('li'), $ul);
      this.activate($target, $target.parent(), function() {
        $this.trigger({
          type: 'shown',
          relatedTarget: previous
        });
      });
    },
    activate: function(element, container, callback) {
      var $active = container.find('> .active'),
        transition = callback && $.support.transition && $active.hasClass('fade');

      function next() {
        $active.removeClass('active').find('> .dropdown-menu > .active').removeClass('active');
        element.addClass('active');
        if (transition) {
          element[0].offsetWidth; // reflow for transition
          element.addClass('in');
        } else {
          element.removeClass('fade');
        }
        if (element.parent('.dropdown-menu')) {
          element.closest('li.dropdown').addClass('active');
        }
        callback && callback();
      }

      if (transition) {
        $active.one($.support.transition.end, next);
      } else {
        next();
      }
      $active.removeClass('in');
    },
    keydown: function(e) {
      var SHIFT_KEY = e.shiftKey,
        TAB_KEY = e.which === 9,
        prevLi, prevTrigger, prevContent, callback;
      if (TAB_KEY) {
        if (SHIFT_KEY) {
          prevLi = $(this).parent().prev();
          if (prevLi.length) {
            e.preventDefault();
            prevTrigger = prevLi.find('a');
            prevContent = $(prevTrigger.attr('href'));
            callback = function() {
              prevContent.find('a:last').focus();
            };
            if ($.support.transition && prevContent.hasClass('fade')) {
              prevContent.one($.support.transition.end, callback);
            } else {
              callback();
            }
            prevTrigger.tab('show');
          }
        } else {
          e.preventDefault();
          $($(this).attr('href')).find('a:first').focus();
        }
      }
    },
    contentFocus: function(e) {
      var $links = $(this).closest('.tab-pane').find('a'),
        $trigger = $(this).closest('[data-tabs-wrapper]').find('.nav-tabs a[href="#' + $(this).closest('.tab-pane').attr('id') + '"]'),
        SHIFT_KEY = e.shiftKey,
        TAB_KEY = e.which === 9,
        prevLi, prevTrigger, prevContent, transition, callback;
      if (!TAB_KEY) {
        return;
      }
      if (SHIFT_KEY) {
        if (!$(this).is($links.eq(0))) {
          return;
        }
        e.preventDefault();
        prevLi = $trigger.parent().prev();
        if (!prevLi.length) {
          $trigger.focus();
          return;
        }
        prevTrigger = prevLi.find('a');
        prevContent = $(prevTrigger.attr('href'));
        transition = $.support.transition && prevContent.hasClass('fade');
        callback = function() {
          prevContent.find('a:last').focus();
        };
        if (transition) {
          prevContent.one($.support.transition.end, callback);
        }
        prevTrigger.tab('show');
        if (!transition) {
          callback();
        }
      }else{
        if (!$(this).is($links.eq($links.length - 1))) {
          return;
        }
        if ($trigger.parent().next().length) {
          e.preventDefault();
          $trigger.parent().next().find('a').focus();
        }
      }
    }
  };

  /* TAB PLUGIN DEFINITION
   * ===================== */

  var old = $.fn.tab;
  $.fn.tab = function(option) {
    return this.each(function() {
      var $this = $(this),
        data = $this.data('tab');
      if (!data) {
        data = new Tab(this);
        $this.data('tab', data);
      }
      if (typeof option === 'string') {
        data[option]();
      }
    });
  };

  $.fn.tab.Constructor = Tab;

  /* TAB NO CONFLICT
   * =============== */

  $.fn.tab.noConflict = function() {
    $.fn.tab = old;
    return this;
  };

  /* TAB DATA-API
   * ============ */

  $(function() {
    $(document).on('click.tab.data-api touchend.tab.data-api focus.tab.data-api', tabTrigger, function(e) {
      $(this).tab('show');
    });
    $(document).on('click.tab.data-api touchend.tab.data-api', tabTrigger, function(e) {
      e.preventDefault();
    });
    $(document).on('keydown.tab.data-api', '.tab-pane a', Tab.prototype.contentFocus);
    $(document).on('keydown.tab.data-api', tabTrigger, Tab.prototype.keydown);
  });

}(window.jQuery, window.App));


!function ($) {

  "use strict"; // jshint ;_;


 /* MODAL CLASS DEFINITION
  * ====================== */

  var Modal = function (element, options) {
    this.options = options
    this.$element = $(element)
      .delegate('[data-dismiss="modal"]', 'click.dismiss.modal', $.proxy(this.hide, this))
    this.options.remote && this.$element.find('.modal-body').load(this.options.remote)
  }

  Modal.prototype = {

      constructor: Modal

    , toggle: function () {
        return this[!this.isShown ? 'show' : 'hide']()
      }

    , show: function () {
        var that = this
          , e = $.Event('show')

        this.$element.trigger(e)

        if (this.isShown || e.isDefaultPrevented()) return

        this.isShown = true

        this.escape()

        this.backdrop(function () {
          var transition = $.support.transition && that.$element.hasClass('fade')

          if (!that.$element.parent().length) {
            that.$element.appendTo(document.body) //don't move modals dom position
          }

          that.$element.show()

          if (transition) {
            that.$element[0].offsetWidth // force reflow
          }

          that.$element
            .addClass('in')
            .attr('aria-hidden', false)

          that.enforceFocus()

          transition ?
            that.$element.one($.support.transition.end, function () { that.$element.focus().trigger('shown') }) :
            that.$element.focus().trigger('shown')

        })
      }

    , hide: function (e) {
        e && e.preventDefault()

        var that = this

        e = $.Event('hide')

        this.$element.trigger(e)

        if (!this.isShown || e.isDefaultPrevented()) return

        this.isShown = false

        this.escape()

        $(document).off('focusin.modal')

        this.$element
          .removeClass('in')
          .attr('aria-hidden', true)

        $.support.transition && this.$element.hasClass('fade') ?
          this.hideWithTransition() :
          this.hideModal()
      }

    , enforceFocus: function () {
        var that = this
        $(document).on('focusin.modal', function (e) {
          if (that.$element[0] !== e.target && !that.$element.has(e.target).length) {
            that.$element.focus()
          }
        })
      }

    , escape: function () {
        var that = this
        if (this.isShown && this.options.keyboard) {
          this.$element.on('keyup.dismiss.modal', function ( e ) {
            e.which == 27 && that.hide()
          })
        } else if (!this.isShown) {
          this.$element.off('keyup.dismiss.modal')
        }
      }

    , hideWithTransition: function () {
        var that = this
          , timeout = setTimeout(function () {
              that.$element.off($.support.transition.end)
              that.hideModal()
            }, 500)

        this.$element.one($.support.transition.end, function () {
          clearTimeout(timeout)
          that.hideModal()
        })
      }

    , hideModal: function () {
        var that = this
        this.$element.hide()
        this.backdrop(function () {
          that.removeBackdrop()
          that.$element.trigger('hidden')
        })
      }

    , removeBackdrop: function () {
        this.$backdrop && this.$backdrop.remove()
        this.$backdrop = null
      }

    , backdrop: function (callback) {
        var that = this
          , animate = this.$element.hasClass('fade') ? 'fade' : ''

        if (this.isShown && this.options.backdrop) {
          var doAnimate = $.support.transition && animate

          this.$backdrop = $('<div class="modal-backdrop ' + animate + '" />')
            .appendTo(document.body)

          this.$backdrop.click(
            this.options.backdrop == 'static' ?
              $.proxy(this.$element[0].focus, this.$element[0])
            : $.proxy(this.hide, this)
          )

          if (doAnimate) this.$backdrop[0].offsetWidth // force reflow

          this.$backdrop.addClass('in')

          if (!callback) return

          doAnimate ?
            this.$backdrop.one($.support.transition.end, callback) :
            callback()

        } else if (!this.isShown && this.$backdrop) {
          this.$backdrop.removeClass('in')

          $.support.transition && this.$element.hasClass('fade')?
            this.$backdrop.one($.support.transition.end, callback) :
            callback()

        } else if (callback) {
          callback()
        }
      }
  }


 /* MODAL PLUGIN DEFINITION
  * ======================= */

  var old = $.fn.modal

  $.fn.modal = function (option) {
    return this.each(function () {
      var $this = $(this)
        , data = $this.data('modal')
        , options = $.extend({}, $.fn.modal.defaults, $this.data(), typeof option == 'object' && option)
      if (!data) $this.data('modal', (data = new Modal(this, options)))
      if (typeof option == 'string') data[option]()
      else if (options.show) data.show()
    })
  }

  $.fn.modal.defaults = {
      backdrop: true
    , keyboard: true
    , show: true
  }

  $.fn.modal.Constructor = Modal


 /* MODAL NO CONFLICT
  * ================= */

  $.fn.modal.noConflict = function () {
    $.fn.modal = old
    return this
  }


 /* MODAL DATA-API
  * ============== */

  $(document).on('click.modal.data-api', '[data-toggle="modal"]', function (e) {
    var $this = $(this)
      , href = $this.attr('href')
      , $target = $($this.attr('data-target') || (href && href.replace(/.*(?=#[^\s]+$)/, ''))) //strip for ie7
      , option = $target.data('modal') ? 'toggle' : $.extend({ remote:!/#/.test(href) && href }, $target.data(), $this.data())

    e.preventDefault()

    $target
      .modal(option)
      .one('hide', function () {
        $this.focus()
      })
  })

}(window.jQuery);

/* ==========================================================
 * bootstrap-affix.js v2.3.2
 * http://twitter.github.com/bootstrap/javascript.html#affix
 * ==========================================================
 * Copyright 2012 Twitter, Inc.
 * ========================================================== */
!function ($) {

  "use strict"; // jshint ;_;
 /* AFFIX CLASS DEFINITION
  * ====================== */

  var Affix = function (element, options) {
    this.options = $.extend({}, $.fn.affix.defaults, options)
    this.$window = $(window)
      .on('scroll.affix.data-api', $.proxy(this.checkPosition, this))
      .on('click.affix.data-api',  $.proxy(function () { setTimeout($.proxy(this.checkPosition, this), 1) }, this))
    this.$element = $(element)
    this.checkPosition()
  }

  Affix.prototype.checkPosition = function () {
    if (!this.$element.is(':visible')) return

    var scrollHeight = $(document).height()
      , scrollTop = this.$window.scrollTop()
      , position = this.$element.offset()
      , offset = this.options.offset
      , offsetBottom = offset.bottom
      , offsetTop = offset.top
      , reset = 'affix affix-top affix-bottom'
      , affix

    if (typeof offset != 'object') offsetBottom = offsetTop = offset
    if (typeof offsetTop == 'function') offsetTop = offset.top()
    if (typeof offsetBottom == 'function') offsetBottom = offset.bottom()

    affix = this.unpin != null && (scrollTop + this.unpin <= position.top) ?
      false    : offsetBottom != null && (position.top + this.$element.height() >= scrollHeight - offsetBottom) ?
      'bottom' : offsetTop != null && scrollTop <= offsetTop ?
      'top'    : false

    if (this.affixed === affix) return

    this.affixed = affix
    this.unpin = affix == 'bottom' ? position.top - scrollTop : null

    this.$element.removeClass(reset).addClass('affix' + (affix ? '-' + affix : ''))
  }
 /* AFFIX PLUGIN DEFINITION
  * ======================= */
  var old = $.fn.affix

  $.fn.affix = function (option) {
    return this.each(function () {
      var $this = $(this)
        , data = $this.data('affix')
        , options = typeof option == 'object' && option
      if (!data) $this.data('affix', (data = new Affix(this, options)))
      if (typeof option == 'string') data[option]()
    })
  }

  $.fn.affix.Constructor = Affix

  $.fn.affix.defaults = {
    offset: 0
  }


 /* AFFIX NO CONFLICT
  * ================= */

  $.fn.affix.noConflict = function () {
    $.fn.affix = old
    return this
  }


 /* AFFIX DATA-API
  * ============== */

  $(window).on('load', function () {
    $('[data-spy="affix"]').each(function () {
      var $spy = $(this)
        , data = $spy.data()

      data.offset = data.offset || {}

      data.offsetBottom && (data.offset.bottom = data.offsetBottom)
      data.offsetTop && (data.offset.top = data.offsetTop)

      $spy.affix(data)
    })
  })


}(window.jQuery);

/* ============================================================
 * bootstrap-dropdown.js v2.3.2
 * http://twitter.github.com/bootstrap/javascript.html#dropdowns
 * ============================================================
 * Copyright 2012 Twitter, Inc.
 * ============================================================ */
!function ($) {

  "use strict"; // jshint ;_;


 /* DROPDOWN CLASS DEFINITION
  * ========================= */

  var toggle = '[data-toggle=dropdown]'
    , Dropdown = function (element) {
        var $el = $(element).on('click.dropdown.data-api', this.toggle)
        $('html').on('click.dropdown.data-api', function () {
          $el.parent().removeClass('open')
        })
      }

  Dropdown.prototype = {

    constructor: Dropdown

  , toggle: function (e) {
      var $this = $(this)
        , $parent
        , isActive

      if ($this.is('.disabled, :disabled')) return

      $parent = getParent($this)

      isActive = $parent.hasClass('open')

      clearMenus()

      if (!isActive) {
        if ('ontouchstart' in document.documentElement) {
          // if mobile we we use a backdrop because click events don't delegate
          $('<div class="dropdown-backdrop"/>').insertBefore($(this)).on('click', clearMenus)
        }
        $parent.toggleClass('open')
      }

      $this.focus()

      return false
    }

  , keydown: function (e) {
      var $this
        , $items
        , $active
        , $parent
        , isActive
        , index

      if (!/(38|40|27)/.test(e.keyCode)) return

      $this = $(this)

      e.preventDefault()
      e.stopPropagation()

      if ($this.is('.disabled, :disabled')) return

      $parent = getParent($this)

      isActive = $parent.hasClass('open')

      if (!isActive || (isActive && e.keyCode == 27)) {
        if (e.which == 27) $parent.find(toggle).focus()
        return $this.click()
      }

      $items = $('[role=menu] li:not(.divider):visible a', $parent)

      if (!$items.length) return

      index = $items.index($items.filter(':focus'))

      if (e.keyCode == 38 && index > 0) index--                                        // up
      if (e.keyCode == 40 && index < $items.length - 1) index++                        // down
      if (!~index) index = 0

      $items
        .eq(index)
        .focus()
    }

  }

  function clearMenus() {
    $('.dropdown-backdrop').remove()
    $(toggle).each(function () {
      getParent($(this)).removeClass('open')
    })
  }

  function getParent($this) {
    var selector = $this.attr('data-target')
      , $parent

    if (!selector) {
      selector = $this.attr('href')
      selector = selector && /#/.test(selector) && selector.replace(/.*(?=#[^\s]*$)/, '') //strip for ie7
    }

    $parent = selector && $(selector)

    if (!$parent || !$parent.length) $parent = $this.parent()

    return $parent
  }


  /* DROPDOWN PLUGIN DEFINITION
   * ========================== */

  var old = $.fn.dropdown

  $.fn.dropdown = function (option) {
    return this.each(function () {
      var $this = $(this)
        , data = $this.data('dropdown')
      if (!data) $this.data('dropdown', (data = new Dropdown(this)))
      if (typeof option == 'string') data[option].call($this)
    })
  }

  $.fn.dropdown.Constructor = Dropdown


 /* DROPDOWN NO CONFLICT
  * ==================== */

  $.fn.dropdown.noConflict = function () {
    $.fn.dropdown = old
    return this
  }
  /* APPLY TO STANDARD DROPDOWN ELEMENTS
   * =================================== */

  $(document)
    .on('click.dropdown.data-api', clearMenus)
    .on('click.dropdown.data-api', '.dropdown form', function (e) { e.stopPropagation() })
    .on('click.dropdown.data-api'  , toggle, Dropdown.prototype.toggle)
    .on('keydown.dropdown.data-api', toggle + ', [role=menu]' , Dropdown.prototype.keydown)

}(window.jQuery);

/* =============================================================
 * bootstrap-scrollspy.js v2.3.2
 * ============================================================== */


!function ($) {

  "use strict"; // jshint ;_;


 /* SCROLLSPY CLASS DEFINITION
  * ========================== */

  function ScrollSpy(element, options) {
    var process = $.proxy(this.process, this)
      , $element = $(element).is('body') ? $(window) : $(element)
      , href
    this.options = $.extend({}, $.fn.scrollspy.defaults, options)
    this.$scrollElement = $element.on('scroll.scroll-spy.data-api', process)
    this.selector = (this.options.target
      || ((href = $(element).attr('href')) && href.replace(/.*(?=#[^\s]+$)/, '')) //strip for ie7
      || '') + ' .nav li > a'
    this.$body = $('body')

    this.refresh();
    this.process();

    $(this.selector).click(function(e){
      if($(this).parent().hasClass('sidenav-item')){
        var that = $(this);
        var hash = window.location.href.split('#')[0];
        e.preventDefault();
        if($(this).attr('href')){
          var el = $(this).attr('href');
        }
        $('body,html').stop().animate({
            scrollTop: $(el).offset().top
        },1000, function(){
          window.location.href = hash + that.attr('href');
        });
      }
    });

  }

  ScrollSpy.prototype = {

      constructor: ScrollSpy

    , refresh: function () {
        var self = this
          , $targets

        this.offsets = $([])
        this.targets = $([])

        $targets = this.$body
          .find(this.selector)
          .map(function () {
            var $el = $(this)
              , href = $el.data('target') || $el.attr('href')
              , $href = /^#\w/.test(href) && $(href)
            return ( $href
              && $href.length
              && [[ $href.position().top + (!$.isWindow(self.$scrollElement.get(0)) && self.$scrollElement.scrollTop()), href ]] ) || null
          })
          .sort(function (a, b) { return a[0] - b[0] })
          .each(function () {
            self.offsets.push(this[0])
            self.targets.push(this[1])
          })
      }
    , process: function () {
        var scrollTop = this.$scrollElement.scrollTop() + this.options.offset
          , scrollHeight = this.$scrollElement[0].scrollHeight || this.$body[0].scrollHeight
          , maxScroll = scrollHeight - this.$scrollElement.height()
          , offsets = this.offsets
          , targets = this.targets
          , activeTarget = this.activeTarget
          , i

        if (scrollTop >= maxScroll) {
          return activeTarget != (i = targets.last()[0])
            && this.activate ( i )
        }

        for (i = offsets.length; i--;) {
          activeTarget != targets[i]
            && scrollTop >= offsets[i]
            && (!offsets[i + 1] || scrollTop <= offsets[i + 1])
            && this.activate( targets[i] )
        }
      }

    , activate: function (target) {
        var active
          , selector

        this.activeTarget = target

        $(this.selector)
          .parent('.active')
          .removeClass('active')

        selector = this.selector
          + '[data-target="' + target + '"],'
          + this.selector + '[href="' + target + '"]'

        active = $(selector)
          .parent('li')
          .addClass('active')
        /*if($(window).width() > 1050){
        }*/
        /*var hash = window.location.href.split('#')[0];
        window.location.href = hash + active.find('a').attr('href');*/
        if (active.parent('.dropdown-menu').length)  {
          active = active.closest('li.dropdown').addClass('active')
        }

        active.trigger('activate')
      }

  }


 /* SCROLLSPY PLUGIN DEFINITION
  * =========================== */

  var old = $.fn.scrollspy

  $.fn.scrollspy = function (option) {
    return this.each(function () {
      var $this = $(this)
        , data = $this.data('scrollspy')
        , options = typeof option == 'object' && option
      if (!data) $this.data('scrollspy', (data = new ScrollSpy(this, options)))
      if (typeof option == 'string') data[option]()
    })
  }

  $.fn.scrollspy.Constructor = ScrollSpy

  $.fn.scrollspy.defaults = {
    offset: 10
  }


 /* SCROLLSPY NO CONFLICT
  * ===================== */

  $.fn.scrollspy.noConflict = function () {
    $.fn.scrollspy = old
    return this
  }


 /* SCROLLSPY DATA-API
  * ================== */

  $(window).on('load', function () {
    $('[data-spy="scroll"]').each(function () {
      var $spy = $(this)
      $spy.scrollspy($spy.data())
    })
  })

}(window.jQuery);

/*
 * jQuery FlexSlider v2.1
 * http://www.woothemes.com/flexslider/
 *
 * Copyright 2012 WooThemes
 * Free to use under the GPLv2 license.
 * http://www.gnu.org/licenses/gpl-2.0.html
 *
 * Contributing author: Tyler Smith (@mbmufffin)
 */

;(function ($) {
  //FlexSlider: Object Instance
  $.flexslider = function(el, options) {
    var slider = $(el),
        vars = $.extend({}, $.flexslider.defaults, options),
        namespace = vars.namespace,
        touch = ("ontouchstart" in window) || window.DocumentTouch && document instanceof DocumentTouch,
        eventType = (touch) ? "touchend" : "click",
        vertical = vars.direction === "vertical",
        reverse = vars.reverse,
        carousel = (vars.itemWidth > 0),
        fade = vars.animation === "fade",
        asNav = vars.asNavFor !== "",
        methods = {};
    // Store a reference to the slider object
    $.data(el, "flexslider", slider);

    // Privat slider methods
    methods = {
      init: function() {
        slider.animating = false;
        slider.currentSlide = vars.startAt;
        slider.animatingTo = slider.currentSlide;
        slider.atEnd = (slider.currentSlide === 0 || slider.currentSlide === slider.last);
        slider.containerSelector = vars.selector.substr(0,vars.selector.search(' '));
        slider.slides = $(vars.selector, slider);
        slider.container = $(slider.containerSelector, slider);
        slider.count = slider.slides.length;
        // SYNC:
        slider.syncExists = $(vars.sync).length > 0;
        // SLIDE:
        if (vars.animation === "slide") vars.animation = "swing";
        slider.prop = (vertical) ? "top" : "marginLeft";
        slider.args = {};
        // SLIDESHOW:
        slider.manualPause = false;
        // TOUCH/USECSS:
        slider.transitions = !vars.video && !fade && vars.useCSS && (function() {
          var obj = document.createElement('div'),
              props = ['perspectiveProperty', 'WebkitPerspective', 'MozPerspective', 'OPerspective', 'msPerspective'];
          for (var i in props) {
            if ( obj.style[ props[i] ] !== undefined ) {
              slider.pfx = props[i].replace('Perspective','').toLowerCase();
              slider.prop = "-" + slider.pfx + "-transform";
              return true;
            }
          }
          return false;
        }());
        // CONTROLSCONTAINER:
        if (vars.controlsContainer !== "") slider.controlsContainer = $(vars.controlsContainer).length > 0 && $(vars.controlsContainer);
        // MANUAL:
        if (vars.manualControls !== "") slider.manualControls = $(vars.manualControls).length > 0 && $(vars.manualControls);

        // RANDOMIZE:
        if (vars.randomize) {
          slider.slides.sort(function() { return (Math.round(Math.random())-0.5); });
          slider.container.empty().append(slider.slides);
        }

        slider.doMath();

        // ASNAV:
        if (asNav) methods.asNav.setup();

        // INIT
        slider.setup("init");

        // CONTROLNAV:
        if (vars.controlNav) methods.controlNav.setup();

        // DIRECTIONNAV:
        if (vars.directionNav) methods.directionNav.setup();

        // KEYBOARD:
        if (vars.keyboard && ($(slider.containerSelector).length === 1 || vars.multipleKeyboard)) {
          $(document).bind('keyup', function(event) {
            var keycode = event.keyCode;
            if (!slider.animating && (keycode === 39 || keycode === 37)) {
              var target = (keycode === 39) ? slider.getTarget('next') :
                           (keycode === 37) ? slider.getTarget('prev') : false;
              slider.flexAnimate(target, vars.pauseOnAction);
            }
          });
        }
        // MOUSEWHEEL:
        if (vars.mousewheel) {
          slider.bind('mousewheel', function(event, delta, deltaX, deltaY) {
            event.preventDefault();
            var target = (delta < 0) ? slider.getTarget('next') : slider.getTarget('prev');
            slider.flexAnimate(target, vars.pauseOnAction);
          });
        }

        // PAUSEPLAY
        if (vars.pausePlay) methods.pausePlay.setup();

        // SLIDSESHOW
        if (vars.slideshow) {
          if (vars.pauseOnHover) {
            slider.hover(function() {
              if (!slider.manualPlay && !slider.manualPause) slider.pause();
            }, function() {
              if (!slider.manualPause && !slider.manualPlay) slider.play();
            });
          }
          // initialize animation
          (vars.initDelay > 0) ? setTimeout(slider.play, vars.initDelay) : slider.play();
        }

        // TOUCH
        if (touch && vars.touch) methods.touch();

        // FADE&&SMOOTHHEIGHT || SLIDE:
        if (!fade || (fade && vars.smoothHeight)) $(window).bind("resize focus", methods.resize);


        // API: start() Callback
        setTimeout(function(){
          vars.start(slider);
        }, 200);
      },
      asNav: {
        setup: function() {
          slider.asNav = true;
          slider.animatingTo = Math.floor(slider.currentSlide/slider.move);
          slider.currentItem = slider.currentSlide;
          slider.slides.removeClass(namespace + "active-slide").eq(slider.currentItem).addClass(namespace + "active-slide");
          slider.slides.click(function(e){
            e.preventDefault();
            var $slide = $(this),
                target = $slide.index();
            if (!$(vars.asNavFor).data('flexslider').animating && !$slide.hasClass('active')) {
              slider.direction = (slider.currentItem < target) ? "next" : "prev";
              slider.flexAnimate(target, vars.pauseOnAction, false, true, true);
            }
          });
        }
      },
      controlNav: {
        setup: function() {
          if (!slider.manualControls) {
            methods.controlNav.setupPaging();
          } else { // MANUALCONTROLS:
            methods.controlNav.setupManual();
          }
        },
        setupPaging: function() {
          var type = (vars.controlNav === "thumbnails") ? 'control-thumbs' : 'control-paging',
              j = 1,
              item;

          slider.controlNavScaffold = $('<ol class="'+ namespace + 'control-nav ' + namespace + type + '"></ol>');

          if (slider.pagingCount > 1) {
            for (var i = 0; i < slider.pagingCount; i++) {
              item = (vars.controlNav === "thumbnails") ? '<img src="' + slider.slides.eq(i).attr("data-thumb") + '"/>' : '<a>' + j + '</a>';
              slider.controlNavScaffold.append('<li>' + item + '</li>');
              j++;
            }
          }

          // CONTROLSCONTAINER:
          (slider.controlsContainer) ? $(slider.controlsContainer).append(slider.controlNavScaffold) : slider.append(slider.controlNavScaffold);
          methods.controlNav.set();

          methods.controlNav.active();

          slider.controlNavScaffold.delegate('a, img', eventType, function(event) {
            event.preventDefault();
            var $this = $(this),
                target = slider.controlNav.index($this);

            if (!$this.hasClass(namespace + 'active')) {
              slider.direction = (target > slider.currentSlide) ? "next" : "prev";
              slider.flexAnimate(target, vars.pauseOnAction);
            }
          });
          // Prevent iOS click event bug
          if (touch) {
            slider.controlNavScaffold.delegate('a', "click touchstart", function(event) {
              event.preventDefault();
            });
          }
        },
        setupManual: function() {
          slider.controlNav = slider.manualControls;
          methods.controlNav.active();

          slider.controlNav.live(eventType, function(event) {
            event.preventDefault();
            var $this = $(this),
                target = slider.controlNav.index($this);

            if (!$this.hasClass(namespace + 'active')) {
              (target > slider.currentSlide) ? slider.direction = "next" : slider.direction = "prev";
              slider.flexAnimate(target, vars.pauseOnAction);
            }
          });
          // Prevent iOS click event bug
          if (touch) {
            slider.controlNav.live("click touchstart", function(event) {
              event.preventDefault();
            });
          }
        },
        set: function() {
          var selector = (vars.controlNav === "thumbnails") ? 'img' : 'a';
          slider.controlNav = $('.' + namespace + 'control-nav li ' + selector, (slider.controlsContainer) ? slider.controlsContainer : slider);
        },
        active: function() {
          slider.controlNav.removeClass(namespace + "active").eq(slider.animatingTo).addClass(namespace + "active");
        },
        update: function(action, pos) {
          if (slider.pagingCount > 1 && action === "add") {
            slider.controlNavScaffold.append($('<li><a>' + slider.count + '</a></li>'));
          } else if (slider.pagingCount === 1) {
            slider.controlNavScaffold.find('li').remove();
          } else {
            slider.controlNav.eq(pos).closest('li').remove();
          }
          methods.controlNav.set();
          (slider.pagingCount > 1 && slider.pagingCount !== slider.controlNav.length) ? slider.update(pos, action) : methods.controlNav.active();
        }
      },
      directionNav: {
        setup: function() {
          var directionNavScaffold = $('<ul class="' + namespace + 'direction-nav"><li><a class="' + namespace + 'prev" href="#">' + vars.prevText + '</a></li><li><a class="' + namespace + 'next" href="#">' + vars.nextText + '</a></li></ul>');

          // CONTROLSCONTAINER:
          if (slider.controlsContainer) {
            $(slider.controlsContainer).append(directionNavScaffold);
            slider.directionNav = $('.' + namespace + 'direction-nav li a', slider.controlsContainer);
          } else {
            slider.append(directionNavScaffold);
            slider.directionNav = $('.' + namespace + 'direction-nav li a', slider);
          }

          methods.directionNav.update();

          slider.directionNav.bind(eventType, function(event) {
            event.preventDefault();
            var target = ($(this).hasClass(namespace + 'next')) ? slider.getTarget('next') : slider.getTarget('prev');
            slider.flexAnimate(target, vars.pauseOnAction);
          });
          // Prevent iOS click event bug
          if (touch) {
            slider.directionNav.bind("click touchstart", function(event) {
              event.preventDefault();
            });
          }
        },
        update: function() {
          var disabledClass = namespace + 'disabled';
          if (slider.pagingCount === 1) {
            slider.directionNav.addClass(disabledClass);
          } else if (!vars.animationLoop) {
            if (slider.animatingTo === 0) {
              slider.directionNav.removeClass(disabledClass).filter('.' + namespace + "prev").addClass(disabledClass);
            } else if (slider.animatingTo === slider.last) {
              slider.directionNav.removeClass(disabledClass).filter('.' + namespace + "next").addClass(disabledClass);
            } else {
              slider.directionNav.removeClass(disabledClass);
            }
          } else {
            slider.directionNav.removeClass(disabledClass);
          }
        }
      },
      pausePlay: {
        setup: function() {
          var pausePlayScaffold = $('<div class="' + namespace + 'pauseplay"><a></a></div>');

          // CONTROLSCONTAINER:
          if (slider.controlsContainer) {
            slider.controlsContainer.append(pausePlayScaffold);
            slider.pausePlay = $('.' + namespace + 'pauseplay a', slider.controlsContainer);
          } else {
            slider.append(pausePlayScaffold);
            slider.pausePlay = $('.' + namespace + 'pauseplay a', slider);
          }

          methods.pausePlay.update((vars.slideshow) ? namespace + 'pause' : namespace + 'play');

          slider.pausePlay.bind(eventType, function(event) {
            event.preventDefault();
            if ($(this).hasClass(namespace + 'pause')) {
              slider.manualPause = true;
              slider.manualPlay = false;
              slider.pause();
            } else {
              slider.manualPause = false;
              slider.manualPlay = true;
              slider.play();
            }
          });
          // Prevent iOS click event bug
          if (touch) {
            slider.pausePlay.bind("click touchstart", function(event) {
              event.preventDefault();
            });
          }
        },
        update: function(state) {
          (state === "play") ? slider.pausePlay.removeClass(namespace + 'pause').addClass(namespace + 'play').text(vars.playText) : slider.pausePlay.removeClass(namespace + 'play').addClass(namespace + 'pause').text(vars.pauseText);
        }
      },
      touch: function() {
        var startX,
          startY,
          offset,
          cwidth,
          dx,
          startT,
          scrolling = false;

        el.addEventListener('touchstart', onTouchStart, false);
        function onTouchStart(e) {
          if (slider.animating) {
            e.preventDefault();
          } else if (e.touches.length === 1) {
            slider.pause();
            // CAROUSEL:
            cwidth = (vertical) ? slider.h : slider. w;
            startT = Number(new Date());
            // CAROUSEL:
            offset = (carousel && reverse && slider.animatingTo === slider.last) ? 0 :
                     (carousel && reverse) ? slider.limit - (((slider.itemW + vars.itemMargin) * slider.move) * slider.animatingTo) :
                     (carousel && slider.currentSlide === slider.last) ? slider.limit :
                     (carousel) ? ((slider.itemW + vars.itemMargin) * slider.move) * slider.currentSlide :
                     (reverse) ? (slider.last - slider.currentSlide + slider.cloneOffset) * cwidth : (slider.currentSlide + slider.cloneOffset) * cwidth;
            startX = (vertical) ? e.touches[0].pageY : e.touches[0].pageX;
            startY = (vertical) ? e.touches[0].pageX : e.touches[0].pageY;

            el.addEventListener('touchmove', onTouchMove, false);
            el.addEventListener('touchend', onTouchEnd, false);
          }
        }

        function onTouchMove(e) {
          dx = (vertical) ? startX - e.touches[0].pageY : startX - e.touches[0].pageX;
          scrolling = (vertical) ? (Math.abs(dx) < Math.abs(e.touches[0].pageX - startY)) : (Math.abs(dx) < Math.abs(e.touches[0].pageY - startY));

          if (!scrolling || Number(new Date()) - startT > 500) {
            e.preventDefault();
            if (!fade && slider.transitions) {
              if (!vars.animationLoop) {
                dx = dx/((slider.currentSlide === 0 && dx < 0 || slider.currentSlide === slider.last && dx > 0) ? (Math.abs(dx)/cwidth+2) : 1);
              }
              slider.setProps(offset + dx, "setTouch");
            }
          }
        }

        function onTouchEnd(e) {
          // finish the touch by undoing the touch session
          el.removeEventListener('touchmove', onTouchMove, false);

          if (slider.animatingTo === slider.currentSlide && !scrolling && !(dx === null)) {
            var updateDx = (reverse) ? -dx : dx,
                target = (updateDx > 0) ? slider.getTarget('next') : slider.getTarget('prev');

            if (slider.canAdvance(target) && (Number(new Date()) - startT < 550 && Math.abs(updateDx) > 50 || Math.abs(updateDx) > cwidth/2)) {
              slider.flexAnimate(target, vars.pauseOnAction);
            } else {
              if (!fade) slider.flexAnimate(slider.currentSlide, vars.pauseOnAction, true);
            }
          }
          el.removeEventListener('touchend', onTouchEnd, false);
          startX = null;
          startY = null;
          dx = null;
          offset = null;
        }
      },
      resize: function() {
        if (!slider.animating && slider.is(':visible')) {
          if (!carousel) slider.doMath();

          if (fade) {
            // SMOOTH HEIGHT:
            methods.smoothHeight();
          } else if (carousel) { //CAROUSEL:
            slider.slides.width(slider.computedW);
            slider.update(slider.pagingCount);
            slider.setProps();
          }
          else if (vertical) { //VERTICAL:
            slider.viewport.height(slider.h);
            slider.setProps(slider.h, "setTotal");
          } else {
            // SMOOTH HEIGHT:
            if (vars.smoothHeight) methods.smoothHeight();
            slider.newSlides.width(slider.computedW);
            slider.setProps(slider.computedW, "setTotal");
          }
        }
      },
      smoothHeight: function(dur) {
        if (!vertical || fade) {
          var $obj = (fade) ? slider : slider.viewport;
          (dur) ? $obj.animate({"height": slider.slides.eq(slider.animatingTo).height()}, dur) : $obj.height(slider.slides.eq(slider.animatingTo).height());
        }
      },
      sync: function(action) {
        var $obj = $(vars.sync).data("flexslider"),
            target = slider.animatingTo;

        switch (action) {
          case "animate": $obj.flexAnimate(target, vars.pauseOnAction, false, true); break;
          case "play": if (!$obj.playing && !$obj.asNav) { $obj.play(); } break;
          case "pause": $obj.pause(); break;
        }
      }
    }

    // public methods
    slider.flexAnimate = function(target, pause, override, withSync, fromNav) {

      if (asNav && slider.pagingCount === 1) slider.direction = (slider.currentItem < target) ? "next" : "prev";

      if (!slider.animating && (slider.canAdvance(target, fromNav) || override) && slider.is(":visible")) {
        if (asNav && withSync) {
          var master = $(vars.asNavFor).data('flexslider');
          slider.atEnd = target === 0 || target === slider.count - 1;
          master.flexAnimate(target, true, false, true, fromNav);
          slider.direction = (slider.currentItem < target) ? "next" : "prev";
          master.direction = slider.direction;

          if (Math.ceil((target + 1)/slider.visible) - 1 !== slider.currentSlide && target !== 0) {
            slider.currentItem = target;
            slider.slides.removeClass(namespace + "active-slide").eq(target).addClass(namespace + "active-slide");
            target = Math.floor(target/slider.visible);
          } else {
            slider.currentItem = target;
            slider.slides.removeClass(namespace + "active-slide").eq(target).addClass(namespace + "active-slide");
            return false;
          }
        }

        slider.animating = true;
        slider.animatingTo = target;
        // API: before() animation Callback
        vars.before(slider);

        // SLIDESHOW:
        if (pause) slider.pause();

        // SYNC:
        if (slider.syncExists && !fromNav) methods.sync("animate");

        // CONTROLNAV
        if (vars.controlNav) methods.controlNav.active();

        // !CAROUSEL:
        // CANDIDATE: slide active class (for add/remove slide)
        if (!carousel) slider.slides.removeClass(namespace + 'active-slide').eq(target).addClass(namespace + 'active-slide');

        // INFINITE LOOP:
        // CANDIDATE: atEnd
        slider.atEnd = target === 0 || target === slider.last;

        // DIRECTIONNAV:
        if (vars.directionNav) methods.directionNav.update();

        if (target === slider.last) {
          // API: end() of cycle Callback
          vars.end(slider);
          // SLIDESHOW && !INFINITE LOOP:
          if (!vars.animationLoop) slider.pause();
        }

        // SLIDE:
        if (!fade) {
          var dimension = (vertical) ? slider.slides.filter(':first').height() : slider.computedW,
              margin, slideString, calcNext;

          // INFINITE LOOP / REVERSE:
          if (carousel) {
            margin = (vars.itemWidth > slider.w) ? vars.itemMargin * 2 : vars.itemMargin;
            calcNext = ((slider.itemW + margin) * slider.move) * slider.animatingTo;
            slideString = (calcNext > slider.limit && slider.visible !== 1) ? slider.limit : calcNext;
          } else if (slider.currentSlide === 0 && target === slider.count - 1 && vars.animationLoop && slider.direction !== "next") {
            slideString = (reverse) ? (slider.count + slider.cloneOffset) * dimension : 0;
          } else if (slider.currentSlide === slider.last && target === 0 && vars.animationLoop && slider.direction !== "prev") {
            slideString = (reverse) ? 0 : (slider.count + 1) * dimension;
          } else {
            slideString = (reverse) ? ((slider.count - 1) - target + slider.cloneOffset) * dimension : (target + slider.cloneOffset) * dimension;
          }
          slider.setProps(slideString, "", vars.animationSpeed);
          if (slider.transitions) {
            if (!vars.animationLoop || !slider.atEnd) {
              slider.animating = false;
              slider.currentSlide = slider.animatingTo;
            }
            slider.container.unbind("webkitTransitionEnd transitionend");
            slider.container.bind("webkitTransitionEnd transitionend", function() {
              slider.wrapup(dimension);
            });
          } else {
            slider.container.animate(slider.args, vars.animationSpeed, vars.easing, function(){
              slider.wrapup(dimension);
            });
          }
        } else { // FADE:
          if (!touch) {
            slider.slides.eq(slider.currentSlide).fadeOut(vars.animationSpeed, vars.easing);
            slider.slides.eq(target).fadeIn(vars.animationSpeed, vars.easing, slider.wrapup);
          } else {
            slider.slides.eq(slider.currentSlide).css({ "opacity": 0, "zIndex": 1 });
            slider.slides.eq(target).css({ "opacity": 1, "zIndex": 2 });

            slider.slides.unbind("webkitTransitionEnd transitionend");
            slider.slides.eq(slider.currentSlide).bind("webkitTransitionEnd transitionend", function() {
              // API: after() animation Callback
              vars.after(slider);
            });

            slider.animating = false;
            slider.currentSlide = slider.animatingTo;
          }
        }
        // SMOOTH HEIGHT:
        if (vars.smoothHeight) methods.smoothHeight(vars.animationSpeed);
      }
    }
    slider.wrapup = function(dimension) {
      // SLIDE:
      if (!fade && !carousel) {
        if (slider.currentSlide === 0 && slider.animatingTo === slider.last && vars.animationLoop) {
          slider.setProps(dimension, "jumpEnd");
        } else if (slider.currentSlide === slider.last && slider.animatingTo === 0 && vars.animationLoop) {
          slider.setProps(dimension, "jumpStart");
        }
      }
      slider.animating = false;
      slider.currentSlide = slider.animatingTo;
      // API: after() animation Callback
      vars.after(slider);
    }

    // SLIDESHOW:
    slider.animateSlides = function() {
      if (!slider.animating) slider.flexAnimate(slider.getTarget("next"));
    }
    // SLIDESHOW:
    slider.pause = function() {
      clearInterval(slider.animatedSlides);
      slider.playing = false;
      // PAUSEPLAY:
      if (vars.pausePlay) methods.pausePlay.update("play");
      // SYNC:
      if (slider.syncExists) methods.sync("pause");
    }
    // SLIDESHOW:
    slider.play = function() {
      slider.animatedSlides = setInterval(slider.animateSlides, vars.slideshowSpeed);
      slider.playing = true;
      // PAUSEPLAY:
      if (vars.pausePlay) methods.pausePlay.update("pause");
      // SYNC:
      if (slider.syncExists) methods.sync("play");
    }
    slider.canAdvance = function(target, fromNav) {
      // ASNAV:
      var last = (asNav) ? slider.pagingCount - 1 : slider.last;
      return (fromNav) ? true :
             (asNav && slider.currentItem === slider.count - 1 && target === 0 && slider.direction === "prev") ? true :
             (asNav && slider.currentItem === 0 && target === slider.pagingCount - 1 && slider.direction !== "next") ? false :
             (target === slider.currentSlide && !asNav) ? false :
             (vars.animationLoop) ? true :
             (slider.atEnd && slider.currentSlide === 0 && target === last && slider.direction !== "next") ? false :
             (slider.atEnd && slider.currentSlide === last && target === 0 && slider.direction === "next") ? false :
             true;
    }
    slider.getTarget = function(dir) {
      slider.direction = dir;
      if (dir === "next") {
        return (slider.currentSlide === slider.last) ? 0 : slider.currentSlide + 1;
      } else {
        return (slider.currentSlide === 0) ? slider.last : slider.currentSlide - 1;
      }
    }

    // SLIDE:
    slider.setProps = function(pos, special, dur) {
      var target = (function() {
        var posCheck = (pos) ? pos : ((slider.itemW + vars.itemMargin) * slider.move) * slider.animatingTo,
            posCalc = (function() {
              if (carousel) {
                return (special === "setTouch") ? pos :
                       (reverse && slider.animatingTo === slider.last) ? 0 :
                       (reverse) ? slider.limit - (((slider.itemW + vars.itemMargin) * slider.move) * slider.animatingTo) :
                       (slider.animatingTo === slider.last) ? slider.limit : posCheck;
              } else {
                switch (special) {
                  case "setTotal": return (reverse) ? ((slider.count - 1) - slider.currentSlide + slider.cloneOffset) * pos : (slider.currentSlide + slider.cloneOffset) * pos;
                  case "setTouch": return (reverse) ? pos : pos;
                  case "jumpEnd": return (reverse) ? pos : slider.count * pos;
                  case "jumpStart": return (reverse) ? slider.count * pos : pos;
                  default: return pos;
                }
              }
            }());
            return (posCalc * -1) + "px";
          }());

      if (slider.transitions) {
        target = (vertical) ? "translate3d(0," + target + ",0)" : "translate3d(" + target + ",0,0)";
        dur = (dur !== undefined) ? (dur/1000) + "s" : "0s";
        slider.container.css("-" + slider.pfx + "-transition-duration", dur);
      }

      slider.args[slider.prop] = target;
      if (slider.transitions || dur === undefined) slider.container.css(slider.args);
    }

    slider.setup = function(type) {
      // SLIDE:
      if (!fade) {
        var sliderOffset, arr;

        if (type === "init") {
          slider.viewport = $('<div class="' + namespace + 'viewport"></div>').css({"overflow": "hidden", "position": "relative"}).appendTo(slider).append(slider.container);
          // INFINITE LOOP:
          slider.cloneCount = 0;
          slider.cloneOffset = 0;
          // REVERSE:
          if (reverse) {
            arr = $.makeArray(slider.slides).reverse();
            slider.slides = $(arr);
            slider.container.empty().append(slider.slides);
          }
        }
        // INFINITE LOOP && !CAROUSEL:
        if (vars.animationLoop && !carousel) {
          slider.cloneCount = 2;
          slider.cloneOffset = 1;
          // clear out old clones
          if (type !== "init") slider.container.find('.clone').remove();
          slider.container.append(slider.slides.first().clone().addClass('clone')).prepend(slider.slides.last().clone().addClass('clone'));
        }
        slider.newSlides = $(vars.selector, slider);

        sliderOffset = (reverse) ? slider.count - 1 - slider.currentSlide + slider.cloneOffset : slider.currentSlide + slider.cloneOffset;
        // VERTICAL:
        if (vertical && !carousel) {
          slider.container.height((slider.count + slider.cloneCount) * 200 + "%").css("position", "absolute").width("100%");
          setTimeout(function(){
            slider.newSlides.css({"display": "block"});
            slider.doMath();
            slider.viewport.height(slider.h);
            slider.setProps(sliderOffset * slider.h, "init");
          }, (type === "init") ? 100 : 0);
        } else {
          slider.container.width((slider.count + slider.cloneCount) * 200 + "%");
          slider.setProps(sliderOffset * slider.computedW, "init");
          setTimeout(function(){
            slider.doMath();
            slider.newSlides.css({"width": slider.computedW, "float": "left", "display": "block"});
            // SMOOTH HEIGHT:
            if (vars.smoothHeight) methods.smoothHeight();
          }, (type === "init") ? 100 : 0);
        }
      } else { // FADE:
        slider.slides.css({"width": "100%", "float": "left", "marginRight": "-100%", "position": "relative"});
        if (type === "init") {
          if (!touch) {
            slider.slides.eq(slider.currentSlide).fadeIn(vars.animationSpeed, vars.easing);
          } else {
            slider.slides.css({ "opacity": 0, "display": "block", "webkitTransition": "opacity " + vars.animationSpeed / 1000 + "s ease", "zIndex": 1 }).eq(slider.currentSlide).css({ "opacity": 1, "zIndex": 2});
          }
        }
        // SMOOTH HEIGHT:
        if (vars.smoothHeight) methods.smoothHeight();
      }
      // !CAROUSEL:
      // CANDIDATE: active slide
      if (!carousel) slider.slides.removeClass(namespace + "active-slide").eq(slider.currentSlide).addClass(namespace + "active-slide");
    }

    slider.doMath = function() {
      var slide = slider.slides.first(),
          slideMargin = vars.itemMargin,
          minItems = vars.minItems,
          maxItems = vars.maxItems;

      slider.w = slider.width();
      slider.h = slide.height();
      slider.boxPadding = slide.outerWidth() - slide.width();

      // CAROUSEL:
      if (carousel) {
        slider.itemT = vars.itemWidth + slideMargin;
        slider.minW = (minItems) ? minItems * slider.itemT : slider.w;
        slider.maxW = (maxItems) ? maxItems * slider.itemT : slider.w;
        slider.itemW = (slider.minW > slider.w) ? (slider.w - (slideMargin * minItems))/minItems :
                       (slider.maxW < slider.w) ? (slider.w - (slideMargin * maxItems))/maxItems :
                       (vars.itemWidth > slider.w) ? slider.w : vars.itemWidth;
        slider.visible = Math.floor(slider.w/(slider.itemW + slideMargin));
        slider.move = (vars.move > 0 && vars.move < slider.visible ) ? vars.move : slider.visible;
        slider.pagingCount = Math.ceil(((slider.count - slider.visible)/slider.move) + 1);
        slider.last =  slider.pagingCount - 1;
        slider.limit = (slider.pagingCount === 1) ? 0 :
                       (vars.itemWidth > slider.w) ? ((slider.itemW + (slideMargin * 2)) * slider.count) - slider.w - slideMargin : ((slider.itemW + slideMargin) * slider.count) - slider.w - slideMargin;
      } else {
        slider.itemW = slider.w;
        slider.pagingCount = slider.count;
        slider.last = slider.count - 1;
      }
      slider.computedW = slider.itemW - slider.boxPadding;
    }

    slider.update = function(pos, action) {
      slider.doMath();

      // update currentSlide and slider.animatingTo if necessary
      if (!carousel) {
        if (pos < slider.currentSlide) {
          slider.currentSlide += 1;
        } else if (pos <= slider.currentSlide && pos !== 0) {
          slider.currentSlide -= 1;
        }
        slider.animatingTo = slider.currentSlide;
      }

      // update controlNav
      if (vars.controlNav && !slider.manualControls) {
        if ((action === "add" && !carousel) || slider.pagingCount > slider.controlNav.length) {
          methods.controlNav.update("add");
        } else if ((action === "remove" && !carousel) || slider.pagingCount < slider.controlNav.length) {
          if (carousel && slider.currentSlide > slider.last) {
            slider.currentSlide -= 1;
            slider.animatingTo -= 1;
          }
          methods.controlNav.update("remove", slider.last);
        }
      }
      // update directionNav
      if (vars.directionNav) methods.directionNav.update();

    }

    slider.addSlide = function(obj, pos) {
      var $obj = $(obj);

      slider.count += 1;
      slider.last = slider.count - 1;

      // append new slide
      if (vertical && reverse) {
        (pos !== undefined) ? slider.slides.eq(slider.count - pos).after($obj) : slider.container.prepend($obj);
      } else {
        (pos !== undefined) ? slider.slides.eq(pos).before($obj) : slider.container.append($obj);
      }

      // update currentSlide, animatingTo, controlNav, and directionNav
      slider.update(pos, "add");

      // update slider.slides
      slider.slides = $(vars.selector + ':not(.clone)', slider);
      // re-setup the slider to accomdate new slide
      slider.setup();

      //FlexSlider: added() Callback
      vars.added(slider);
    }
    slider.removeSlide = function(obj) {
      var pos = (isNaN(obj)) ? slider.slides.index($(obj)) : obj;

      // update count
      slider.count -= 1;
      slider.last = slider.count - 1;

      // remove slide
      if (isNaN(obj)) {
        $(obj, slider.slides).remove();
      } else {
        (vertical && reverse) ? slider.slides.eq(slider.last).remove() : slider.slides.eq(obj).remove();
      }

      // update currentSlide, animatingTo, controlNav, and directionNav
      slider.doMath();
      slider.update(pos, "remove");

      // update slider.slides
      slider.slides = $(vars.selector + ':not(.clone)', slider);
      // re-setup the slider to accomdate new slide
      slider.setup();

      // FlexSlider: removed() Callback
      vars.removed(slider);
    }

    //FlexSlider: Initialize
    methods.init();
  }

  //FlexSlider: Default Settings
  $.flexslider.defaults = {
    namespace: "flex-",             //{NEW} String: Prefix string attached to the class of every element generated by the plugin
    selector: ".slides > li",       //{NEW} Selector: Must match a simple pattern. '{container} > {slide}' -- Ignore pattern at your own peril
    animation: "fade",              //String: Select your animation type, "fade" or "slide"
    easing: "swing",               //{NEW} String: Determines the easing method used in jQuery transitions. jQuery easing plugin is supported!
    direction: "horizontal",        //String: Select the sliding direction, "horizontal" or "vertical"
    reverse: false,                 //{NEW} Boolean: Reverse the animation direction
    animationLoop: true,             //Boolean: Should the animation loop? If false, directionNav will received "disable" classes at either end
    smoothHeight: false,            //{NEW} Boolean: Allow height of the slider to animate smoothly in horizontal mode
    startAt: 0,                     //Integer: The slide that the slider should start on. Array notation (0 = first slide)
    slideshow: true,                //Boolean: Animate slider automatically
    slideshowSpeed: 7000,           //Integer: Set the speed of the slideshow cycling, in milliseconds
    animationSpeed: 600,            //Integer: Set the speed of animations, in milliseconds
    initDelay: 0,                   //{NEW} Integer: Set an initialization delay, in milliseconds
    randomize: false,               //Boolean: Randomize slide order

    // Usability features
    pauseOnAction: true,            //Boolean: Pause the slideshow when interacting with control elements, highly recommended.
    pauseOnHover: false,            //Boolean: Pause the slideshow when hovering over slider, then resume when no longer hovering
    useCSS: true,                   //{NEW} Boolean: Slider will use CSS3 transitions if available
    touch: true,                    //{NEW} Boolean: Allow touch swipe navigation of the slider on touch-enabled devices
    video: false,                   //{NEW} Boolean: If using video in the slider, will prevent CSS3 3D Transforms to avoid graphical glitches

    // Primary Controls
    controlNav: true,               //Boolean: Create navigation for paging control of each clide? Note: Leave true for manualControls usage
    directionNav: true,             //Boolean: Create navigation for previous/next navigation? (true/false)
    prevText: "Previous",           //String: Set the text for the "previous" directionNav item
    nextText: "Next",               //String: Set the text for the "next" directionNav item

    // Secondary Navigation
    keyboard: true,                 //Boolean: Allow slider navigating via keyboard left/right keys
    multipleKeyboard: false,        //{NEW} Boolean: Allow keyboard navigation to affect multiple sliders. Default behavior cuts out keyboard navigation with more than one slider present.
    mousewheel: false,              //{UPDATED} Boolean: Requires jquery.mousewheel.js (https://github.com/brandonaaron/jquery-mousewheel) - Allows slider navigating via mousewheel
    pausePlay: false,               //Boolean: Create pause/play dynamic element
    pauseText: "Pause",             //String: Set the text for the "pause" pausePlay item
    playText: "Play",               //String: Set the text for the "play" pausePlay item

    // Special properties
    controlsContainer: "",          //{UPDATED} jQuery Object/Selector: Declare which container the navigation elements should be appended too. Default container is the FlexSlider element. Example use would be $(".flexslider-container"). Property is ignored if given element is not found.
    manualControls: "",             //{UPDATED} jQuery Object/Selector: Declare custom control navigation. Examples would be $(".flex-control-nav li") or "#tabs-nav li img", etc. The number of elements in your controlNav should match the number of slides/tabs.
    sync: "",                       //{NEW} Selector: Mirror the actions performed on this slider with another slider. Use with care.
    asNavFor: "",                   //{NEW} Selector: Internal property exposed for turning the slider into a thumbnail navigation for another slider

    // Carousel Options
    itemWidth: 0,                   //{NEW} Integer: Box-model width of individual carousel items, including horizontal borders and padding.
    itemMargin: 0,                  //{NEW} Integer: Margin between carousel items.
    minItems: 0,                    //{NEW} Integer: Minimum number of carousel items that should be visible. Items will resize fluidly when below this.
    maxItems: 0,                    //{NEW} Integer: Maxmimum number of carousel items that should be visible. Items will resize fluidly when above this limit.
    move: 0,                        //{NEW} Integer: Number of carousel items that should move on animation. If 0, slider will move all visible items.

    // Callback API
    start: function(){},            //Callback: function(slider) - Fires when the slider loads the first slide
    before: function(){},           //Callback: function(slider) - Fires asynchronously with each slider animation
    after: function(){},            //Callback: function(slider) - Fires after each slider animation completes
    end: function(){},              //Callback: function(slider) - Fires when the slider reaches the last slide (asynchronous)
    added: function(){},            //{NEW} Callback: function(slider) - Fires after a slide is added
    removed: function(){}           //{NEW} Callback: function(slider) - Fires after a slide is removed
  }


  //FlexSlider: Plugin Function
  $.fn.flexslider = function(options) {
    if (options === undefined) options = {};

    if (typeof options === "object") {
      return this.each(function() {
        var $this = $(this),
            selector = (options.selector) ? options.selector : ".slides > li",
            $slides = $this.find(selector);

        if ($slides.length === 1) {
          $slides.fadeIn(400);
          if (options.start) options.start($this);
        } else if ($this.data('flexslider') == undefined) {
          new $.flexslider(this, options);
        }
      });
    } else {
      // Helper strings to quickly perform functions on the slider
      var $slider = $(this).data('flexslider');
      switch (options) {
        case "play": $slider.play(); break;
        case "pause": $slider.pause(); break;
        case "next": $slider.flexAnimate($slider.getTarget("next"), true); break;
        case "prev":
        case "previous": $slider.flexAnimate($slider.getTarget("prev"), true); break;
        default: if (typeof options === "number") $slider.flexAnimate(options, true);
      }
    }
  }

})(jQuery);

/**
 * jquery.hoverdir.js
 */
;( function( $, window, undefined ) {

  'use strict';

  $.HoverDir = function( options, element ) {

    this.$el = $( element );
    this._init( options );

  };

  // the options
  $.HoverDir.defaults = {
    speed : 300,
    easing : 'ease',
    hoverDelay : 0,
    inverse : false
  };

  $.HoverDir.prototype = {

    _init : function( options ) {

      // options
      this.options = $.extend( true, {}, $.HoverDir.defaults, options );
      // transition properties
      this.transitionProp = 'all ' + this.options.speed + 'ms ' + this.options.easing;
      // support for CSS transitions
      this.support = Modernizr.csstransitions;
      // load the events
      this._loadEvents();

    },
    _loadEvents : function() {

      var self = this;

      this.$el.on( 'mouseenter.hoverdir, mouseleave.hoverdir', function( event ) {

        var $el = $( this ),
          $hoverElem = $el.find( 'div' ),
          direction = self._getDir( $el, { x : event.pageX, y : event.pageY } ),
          styleCSS = self._getStyle( direction );

        if( event.type === 'mouseenter' ) {

          $hoverElem.hide().css( styleCSS.from );
          clearTimeout( self.tmhover );

          self.tmhover = setTimeout( function() {

            $hoverElem.show( 0, function() {

              var $el = $( this );
              if( self.support ) {
                $el.css( 'transition', self.transitionProp );
              }
              self._applyAnimation( $el, styleCSS.to, self.options.speed );

            } );


          }, self.options.hoverDelay );

        }
        else {

          if( self.support ) {
            //$hoverElem.css( 'transition', self.transitionProp );
            $hoverElem.css({
              'transition' : self.transitionProp,
              '-moz-transition' : self.transitionProp,
              '-webkit-transition' : self.transitionProp,
              '-o-transition' : self.transitionProp
            });
          }
          clearTimeout( self.tmhover );
          self._applyAnimation( $hoverElem, styleCSS.from, self.options.speed );

        }

      } );

    },
    // credits : http://stackoverflow.com/a/3647634
    _getDir : function( $el, coordinates ) {

      // the width and height of the current div
      var w = $el.width(),
        h = $el.height(),

        // calculate the x and y to get an angle to the center of the div from that x and y.
        // gets the x value relative to the center of the DIV and "normalize" it
        x = ( coordinates.x - $el.offset().left - ( w/2 )) * ( w > h ? ( h/w ) : 1 ),
        y = ( coordinates.y - $el.offset().top  - ( h/2 )) * ( h > w ? ( w/h ) : 1 ),

        // the angle and the direction from where the mouse came in/went out clockwise (TRBL=0123);
        // first calculate the angle of the point,
        // add 180 deg to get rid of the negative values
        // divide by 90 to get the quadrant
        // add 3 and do a modulo by 4  to shift the quadrants to a proper clockwise TRBL (top/right/bottom/left) **/
        direction = Math.round( ( ( ( Math.atan2(y, x) * (180 / Math.PI) ) + 180 ) / 90 ) + 3 ) % 4;

      return direction;

    },
    _getStyle : function( direction ) {

      var fromStyle, toStyle,
        slideFromTop = { left : '0px', top : '-100%' },
        slideFromBottom = { left : '0px', top : '100%' },
        slideFromLeft = { left : '-100%', top : '0px' },
        slideFromRight = { left : '100%', top : '0px' },
        slideTop = { top : '0px' },
        slideLeft = { left : '0px' };

      switch( direction ) {
        case 0:
          // from top
          fromStyle = !this.options.inverse ? slideFromTop : slideFromBottom;
          toStyle = slideTop;
          break;
        case 1:
          // from right
          fromStyle = !this.options.inverse ? slideFromRight : slideFromLeft;
          toStyle = slideLeft;
          break;
        case 2:
          // from bottom
          fromStyle = !this.options.inverse ? slideFromBottom : slideFromTop;
          toStyle = slideTop;
          break;
        case 3:
          // from left
          fromStyle = !this.options.inverse ? slideFromLeft : slideFromRight;
          toStyle = slideLeft;
          break;
      };

      return { from : fromStyle, to : toStyle };

    },
    // apply a transition or fallback to jquery animate based on Modernizr.csstransitions support
    _applyAnimation : function( el, styleCSS, speed ) {

      $.fn.applyStyle = this.support ? $.fn.css : $.fn.animate;
      el.stop().applyStyle( styleCSS, $.extend( true, [], { duration : speed + 'ms' } ) );

    },

  };

  var logError = function( message ) {

    if ( window.console ) {

      window.console.error( message );

    }

  };

  $.fn.hoverdir = function( options ) {

    var instance = $.data( this, 'hoverdir' );

    if ( typeof options === 'string' ) {

      var args = Array.prototype.slice.call( arguments, 1 );

      this.each(function() {

        if ( !instance ) {

          logError( "cannot call methods on hoverdir prior to initialization; " +
          "attempted to call method '" + options + "'" );
          return;

        }

        if ( !$.isFunction( instance[options] ) || options.charAt(0) === "_" ) {

          logError( "no such method '" + options + "' for hoverdir instance" );
          return;

        }

        instance[ options ].apply( instance, args );

      });

    }
    else {

      this.each(function() {

        if ( instance ) {

          instance._init();

        }
        else {

          instance = $.data( this, 'hoverdir', new $.HoverDir( options, this ) );

        }

      });

    }

    return instance;

  };

} )( jQuery, window );

/*!
 * iScroll v4.2.5 ~ Copyright (c) 2012 Matteo Spinelli, http://cubiq.org
 * Released under MIT license, http://cubiq.org/license
 */
(function(window, doc){
var m = Math,
  dummyStyle = doc.createElement('div').style,
  vendor = (function () {
    var vendors = 't,webkitT,MozT,msT,OT'.split(','),
      t,
      i = 0,
      l = vendors.length;

    for ( ; i < l; i++ ) {
      t = vendors[i] + 'ransform';
      if ( t in dummyStyle ) {
        return vendors[i].substr(0, vendors[i].length - 1);
      }
    }

    return false;
  })(),
  cssVendor = vendor ? '-' + vendor.toLowerCase() + '-' : '',

  // Style properties
  transform = prefixStyle('transform'),
  transitionProperty = prefixStyle('transitionProperty'),
  transitionDuration = prefixStyle('transitionDuration'),
  transformOrigin = prefixStyle('transformOrigin'),
  transitionTimingFunction = prefixStyle('transitionTimingFunction'),
  transitionDelay = prefixStyle('transitionDelay'),

    // Browser capabilities
  isAndroid = (/android/gi).test(navigator.appVersion),
  isIDevice = (/iphone|ipad/gi).test(navigator.appVersion),
  isTouchPad = (/hp-tablet/gi).test(navigator.appVersion),
  isIE = (!window.addEventListener),
    has3d = prefixStyle('perspective') in dummyStyle,
    hasTouch = 'ontouchstart' in window && !isTouchPad,
    hasTransform = vendor !== false,
    hasTransitionEnd = prefixStyle('transition') in dummyStyle,

  RESIZE_EV = 'onorientationchange' in window ? 'orientationchange' : 'resize',
  START_EV = hasTouch ? 'touchstart' : 'mousedown',
  MOVE_EV = hasTouch ? 'touchmove' : 'mousemove',
  END_EV = hasTouch ? 'touchend' : 'mouseup',
  CANCEL_EV = hasTouch ? 'touchcancel' : 'mouseup',
  TRNEND_EV = (function () {
    if ( vendor === false ) return false;

    var transitionEnd = {
        ''      : 'transitionend',
        'webkit'  : 'webkitTransitionEnd',
        'Moz'   : 'transitionend',
        'O'     : 'otransitionend',
        'ms'    : 'MSTransitionEnd'
      };

    return transitionEnd[vendor];
  })(),

  nextFrame = (function() {
    return window.requestAnimationFrame ||
      window.webkitRequestAnimationFrame ||
      window.mozRequestAnimationFrame ||
      window.oRequestAnimationFrame ||
      window.msRequestAnimationFrame ||
      function(callback) { return setTimeout(callback, 1); };
  })(),
  cancelFrame = (function () {
    return window.cancelRequestAnimationFrame ||
      window.webkitCancelAnimationFrame ||
      window.webkitCancelRequestAnimationFrame ||
      window.mozCancelRequestAnimationFrame ||
      window.oCancelRequestAnimationFrame ||
      window.msCancelRequestAnimationFrame ||
      clearTimeout;
  })(),

  // Helpers
  translateZ = has3d ? ' translateZ(0)' : '',

  // Constructor
  iScroll = function (el, options) {
    var that = this,
      i;

    that.wrapper = typeof el == 'object' ? el : doc.getElementById(el);
    that.wrapper.style.overflow = 'hidden';
    that.scroller = that.wrapper.children[0];

    // Default options
    that.options = {
      hScroll: true,
      vScroll: true,
      x: 0,
      y: 0,
      bounce: true,
      bounceLock: false,
      momentum: true,
      lockDirection: true,
      useTransform: true,
      useTransition: false,
      topOffset: 0,
      checkDOMChanges: false,   // Experimental
      handleClick: true,

      // Scrollbar
      hScrollbar: true,
      vScrollbar: true,
      fixedScrollbar: isAndroid,
      hideScrollbar: isIDevice,
      fadeScrollbar: isIDevice && has3d,
      scrollbarClass: '',

      // Zoom
      zoom: false,
      zoomMin: 1,
      zoomMax: 4,
      doubleTapZoom: 2,
      wheelAction: 'scroll',

      // Snap
      snap: false,
      snapThreshold: 1,

      // Events
      onRefresh: null,
      onBeforeScrollStart: function (e) { e.preventDefault(); },
      onScrollStart: null,
      onBeforeScrollMove: null,
      onScrollMove: null,
      onBeforeScrollEnd: null,
      onScrollEnd: null,
      onTouchEnd: null,
      onDestroy: null,
      onZoomStart: null,
      onZoom: null,
      onZoomEnd: null
    };

    // User defined options
    for (i in options) that.options[i] = options[i];

    // Set starting position
    that.x = that.options.x;
    that.y = that.options.y;

    // Normalize options
    that.options.useTransform = hasTransform && that.options.useTransform;
    that.options.hScrollbar = that.options.hScroll && that.options.hScrollbar;
    that.options.vScrollbar = that.options.vScroll && that.options.vScrollbar;
    that.options.zoom = that.options.useTransform && that.options.zoom;
    that.options.useTransition = hasTransitionEnd && that.options.useTransition;

    // Helpers FIX ANDROID BUG!
    // translate3d and scale doesn't work together!
    // Ignoring 3d ONLY WHEN YOU SET that.options.zoom
    if ( that.options.zoom && isAndroid ){
      translateZ = '';
    }

    // Set some default styles
    that.scroller.style[transitionProperty] = that.options.useTransform ? cssVendor + 'transform' : 'top left';
    that.scroller.style[transitionDuration] = '0';
    that.scroller.style[transformOrigin] = '0 0';
    if (that.options.useTransition) that.scroller.style[transitionTimingFunction] = 'cubic-bezier(0.33,0.66,0.66,1)';

    if (that.options.useTransform) that.scroller.style[transform] = 'translate(' + that.x + 'px,' + that.y + 'px)' + translateZ;
    else that.scroller.style.cssText += ';position:absolute;top:' + that.y + 'px;left:' + that.x + 'px';

    if (that.options.useTransition) that.options.fixedScrollbar = true;

    that.refresh();

    that._bind(RESIZE_EV, window);
    that._bind(START_EV);
    if (!hasTouch) {
      if (that.options.wheelAction != 'none') {
        that._bind('DOMMouseScroll');
        that._bind('mousewheel');
      }
    }

    if (that.options.checkDOMChanges) that.checkDOMTime = setInterval(function () {
      that._checkDOMChanges();
    }, 500);
  };

// Prototype
iScroll.prototype = {
  enabled: true,
  x: 0,
  y: 0,
  steps: [],
  scale: 1,
  currPageX: 0, currPageY: 0,
  pagesX: [], pagesY: [],
  aniTime: null,
  wheelZoomCount: 0,

  handleEvent: function (e) {
    var that = this;
    switch(e.type) {
      case START_EV:
        if (!hasTouch && e.button !== 0) return;
        that._start(e);
        break;
      case MOVE_EV:
        if(isIE && e.button === 0 ) {
                 that._end(e); break; // missed a mouseup?
        } else {
                that._move(e); break;
        }
      case END_EV:
      case CANCEL_EV: that._end(e); break;
      case RESIZE_EV: that._resize(); break;
      case 'DOMMouseScroll': case 'mousewheel': that._wheel(e); break;
      case TRNEND_EV: that._transitionEnd(e); break;
    }
  },

  _checkDOMChanges: function () {
    if (this.moved || this.zoomed || this.animating ||
      (this.scrollerW == this.scroller.offsetWidth * this.scale && this.scrollerH == this.scroller.offsetHeight * this.scale)) return;

    this.refresh();
  },

  _scrollbar: function (dir) {
    var that = this,
      bar;

    if (!that[dir + 'Scrollbar']) {
      if (that[dir + 'ScrollbarWrapper']) {
        if (hasTransform) that[dir + 'ScrollbarIndicator'].style[transform] = '';
        that[dir + 'ScrollbarWrapper'].parentNode.removeChild(that[dir + 'ScrollbarWrapper']);
        that[dir + 'ScrollbarWrapper'] = null;
        that[dir + 'ScrollbarIndicator'] = null;
      }

      return;
    }

    if (!that[dir + 'ScrollbarWrapper']) {
      // Create the scrollbar wrapper
      bar = doc.createElement('div');

      if (that.options.scrollbarClass) bar.className = that.options.scrollbarClass + dir.toUpperCase();
      else bar.style.cssText = 'position:absolute;z-index:100;' + (dir == 'h' ? 'height:7px;bottom:1px;left:2px;right:' + (that.vScrollbar ? '7' : '2') + 'px' : 'width:7px;bottom:' + (that.hScrollbar ? '7' : '2') + 'px;top:2px;right:1px');

      bar.style.cssText += ';pointer-events:none;' + cssVendor + 'transition-property:opacity;' + cssVendor + 'transition-duration:' + (that.options.fadeScrollbar ? '350ms' : '0') + ';overflow:hidden;opacity:' + (that.options.hideScrollbar ? '0' : '1');

      that.wrapper.appendChild(bar);
      that[dir + 'ScrollbarWrapper'] = bar;

      // Create the scrollbar indicator
      bar = doc.createElement('div');
      if (!that.options.scrollbarClass) {
        bar.style.cssText = 'position:absolute;z-index:100;background:rgba(0,0,0,0.5);border:1px solid rgba(255,255,255,0.9);' + cssVendor + 'background-clip:padding-box;' + cssVendor + 'box-sizing:border-box;' + (dir == 'h' ? 'height:100%' : 'width:100%') + ';' + cssVendor + 'border-radius:3px;border-radius:3px';
      }
      bar.style.cssText += ';pointer-events:none;' + cssVendor + 'transition-property:' + cssVendor + 'transform;' + cssVendor + 'transition-timing-function:cubic-bezier(0.33,0.66,0.66,1);' + cssVendor + 'transition-duration:0;' + cssVendor + 'transform: translate(0,0)' + translateZ;
      if (that.options.useTransition) bar.style.cssText += ';' + cssVendor + 'transition-timing-function:cubic-bezier(0.33,0.66,0.66,1)';

      that[dir + 'ScrollbarWrapper'].appendChild(bar);
      that[dir + 'ScrollbarIndicator'] = bar;
    }

    if (dir == 'h') {
      that.hScrollbarSize = that.hScrollbarWrapper.clientWidth;
      that.hScrollbarIndicatorSize = m.max(m.round(that.hScrollbarSize * that.hScrollbarSize / that.scrollerW), 8);
      that.hScrollbarIndicator.style.width = that.hScrollbarIndicatorSize + 'px';
      that.hScrollbarMaxScroll = that.hScrollbarSize - that.hScrollbarIndicatorSize;
      that.hScrollbarProp = that.hScrollbarMaxScroll / that.maxScrollX;
    } else {
      that.vScrollbarSize = that.vScrollbarWrapper.clientHeight;
      that.vScrollbarIndicatorSize = m.max(m.round(that.vScrollbarSize * that.vScrollbarSize / that.scrollerH), 8);
      that.vScrollbarIndicator.style.height = that.vScrollbarIndicatorSize + 'px';
      that.vScrollbarMaxScroll = that.vScrollbarSize - that.vScrollbarIndicatorSize;
      that.vScrollbarProp = that.vScrollbarMaxScroll / that.maxScrollY;
    }

    // Reset position
    that._scrollbarPos(dir, true);
  },

  _resize: function () {
    var that = this;
    setTimeout(function () { that.refresh(); }, isAndroid ? 200 : 0);
  },

  _pos: function (x, y) {
    if (this.zoomed) return;

    x = this.hScroll ? x : 0;
    y = this.vScroll ? y : 0;

    if (this.options.useTransform) {
      this.scroller.style[transform] = 'translate(' + x + 'px,' + y + 'px) scale(' + this.scale + ')' + translateZ;
    } else {
      x = m.round(x);
      y = m.round(y);
      this.scroller.style.left = x + 'px';
      this.scroller.style.top = y + 'px';
    }

    this.x = x;
    this.y = y;

    this._scrollbarPos('h');
    this._scrollbarPos('v');
  },

  _scrollbarPos: function (dir, hidden) {
    var that = this,
      pos = dir == 'h' ? that.x : that.y,
      size;

    if (!that[dir + 'Scrollbar']) return;

    pos = that[dir + 'ScrollbarProp'] * pos;

    if (pos < 0) {
      if (!that.options.fixedScrollbar) {
        size = that[dir + 'ScrollbarIndicatorSize'] + m.round(pos * 3);
        if (size < 8) size = 8;
        that[dir + 'ScrollbarIndicator'].style[dir == 'h' ? 'width' : 'height'] = size + 'px';
      }
      pos = 0;
    } else if (pos > that[dir + 'ScrollbarMaxScroll']) {
      if (!that.options.fixedScrollbar) {
        size = that[dir + 'ScrollbarIndicatorSize'] - m.round((pos - that[dir + 'ScrollbarMaxScroll']) * 3);
        if (size < 8) size = 8;
        that[dir + 'ScrollbarIndicator'].style[dir == 'h' ? 'width' : 'height'] = size + 'px';
        pos = that[dir + 'ScrollbarMaxScroll'] + (that[dir + 'ScrollbarIndicatorSize'] - size);
      } else {
        pos = that[dir + 'ScrollbarMaxScroll'];
      }
    }

    that[dir + 'ScrollbarWrapper'].style[transitionDelay] = '0';
    that[dir + 'ScrollbarWrapper'].style.opacity = hidden && that.options.hideScrollbar ? '0' : '1';
    that[dir + 'ScrollbarIndicator'].style[transform] = 'translate(' + (dir == 'h' ? pos + 'px,0)' : '0,' + pos + 'px)') + translateZ;
  },

  _start: function (e) {
    var that = this,
      point = hasTouch ? e.touches[0] : e,
      matrix, x, y,
      c1, c2;

    if (!that.enabled) return;

    if (that.options.onBeforeScrollStart) that.options.onBeforeScrollStart.call(that, e);

    if (that.options.useTransition || that.options.zoom) that._transitionTime(0);

    that.moved = false;
    that.animating = false;
    that.zoomed = false;
    that.distX = 0;
    that.distY = 0;
    that.absDistX = 0;
    that.absDistY = 0;
    that.dirX = 0;
    that.dirY = 0;

    // Gesture start
    if (that.options.zoom && hasTouch && e.touches.length > 1) {
      c1 = m.abs(e.touches[0].pageX-e.touches[1].pageX);
      c2 = m.abs(e.touches[0].pageY-e.touches[1].pageY);
      that.touchesDistStart = m.sqrt(c1 * c1 + c2 * c2);

      that.originX = m.abs(e.touches[0].pageX + e.touches[1].pageX - that.wrapperOffsetLeft * 2) / 2 - that.x;
      that.originY = m.abs(e.touches[0].pageY + e.touches[1].pageY - that.wrapperOffsetTop * 2) / 2 - that.y;

      if (that.options.onZoomStart) that.options.onZoomStart.call(that, e);
    }

    if (that.options.momentum) {
      if (that.options.useTransform) {
        // Very lame general purpose alternative to CSSMatrix
        matrix = getComputedStyle(that.scroller, null)[transform].replace(/[^0-9\-.,]/g, '').split(',');
        x = +(matrix[12] || matrix[4]);
        y = +(matrix[13] || matrix[5]);
      } else {
        x = +getComputedStyle(that.scroller, null).left.replace(/[^0-9-]/g, '');
        y = +getComputedStyle(that.scroller, null).top.replace(/[^0-9-]/g, '');
      }

      if (x != that.x || y != that.y) {
        if (that.options.useTransition) that._unbind(TRNEND_EV);
        else cancelFrame(that.aniTime);
        that.steps = [];
        that._pos(x, y);
        if (that.options.onScrollEnd) that.options.onScrollEnd.call(that);
      }
    }

    that.absStartX = that.x;  // Needed by snap threshold
    that.absStartY = that.y;

    that.startX = that.x;
    that.startY = that.y;
    that.pointX = point.pageX;
    that.pointY = point.pageY;

    that.startTime = e.timeStamp || Date.now();

    if (that.options.onScrollStart) that.options.onScrollStart.call(that, e);

    that._bind(MOVE_EV, window);
    that._bind(END_EV, window);
    that._bind(CANCEL_EV, window);
  },

  _move: function (e) {
    var that = this,
      point = hasTouch ? e.touches[0] : e,
      deltaX = point.pageX - that.pointX,
      deltaY = point.pageY - that.pointY,
      newX = that.x + deltaX,
      newY = that.y + deltaY,
      c1, c2, scale,
      timestamp = e.timeStamp || Date.now();

    if (that.options.onBeforeScrollMove) that.options.onBeforeScrollMove.call(that, e);

    // Zoom
    if (that.options.zoom && hasTouch && e.touches.length > 1) {
      c1 = m.abs(e.touches[0].pageX - e.touches[1].pageX);
      c2 = m.abs(e.touches[0].pageY - e.touches[1].pageY);
      that.touchesDist = m.sqrt(c1*c1+c2*c2);

      that.zoomed = true;

      scale = 1 / that.touchesDistStart * that.touchesDist * this.scale;

      if (scale < that.options.zoomMin) scale = 0.5 * that.options.zoomMin * Math.pow(2.0, scale / that.options.zoomMin);
      else if (scale > that.options.zoomMax) scale = 2.0 * that.options.zoomMax * Math.pow(0.5, that.options.zoomMax / scale);

      that.lastScale = scale / this.scale;

      newX = this.originX - this.originX * that.lastScale + this.x;
      newY = this.originY - this.originY * that.lastScale + this.y;

      this.scroller.style[transform] = 'translate(' + newX + 'px,' + newY + 'px) scale(' + scale + ')' + translateZ;

      if (that.options.onZoom) that.options.onZoom.call(that, e);
      return;
    }

    that.pointX = point.pageX;
    that.pointY = point.pageY;

    // Slow down if outside of the boundaries
    if (newX > 0 || newX < that.maxScrollX) {
      newX = that.options.bounce ? that.x + (deltaX / 2) : newX >= 0 || that.maxScrollX >= 0 ? 0 : that.maxScrollX;
    }
    if (newY > that.minScrollY || newY < that.maxScrollY) {
      newY = that.options.bounce ? that.y + (deltaY / 2) : newY >= that.minScrollY || that.maxScrollY >= 0 ? that.minScrollY : that.maxScrollY;
    }

    that.distX += deltaX;
    that.distY += deltaY;
    that.absDistX = m.abs(that.distX);
    that.absDistY = m.abs(that.distY);

    if (that.absDistX < 6 && that.absDistY < 6) {
      return;
    }

    // Lock direction
    if (that.options.lockDirection) {
      if (that.absDistX > that.absDistY + 5) {
        newY = that.y;
        deltaY = 0;
      } else if (that.absDistY > that.absDistX + 5) {
        newX = that.x;
        deltaX = 0;
      }
    }

    that.moved = true;
    that._pos(newX, newY);
    that.dirX = deltaX > 0 ? -1 : deltaX < 0 ? 1 : 0;
    that.dirY = deltaY > 0 ? -1 : deltaY < 0 ? 1 : 0;

    if (timestamp - that.startTime > 300) {
      that.startTime = timestamp;
      that.startX = that.x;
      that.startY = that.y;
    }

    if (that.options.onScrollMove) that.options.onScrollMove.call(that, e);
  },

  _end: function (e) {
    if (hasTouch && e.touches.length !== 0) return;

    var that = this,
      point = hasTouch ? e.changedTouches[0] : e,
      target, ev,
      momentumX = { dist:0, time:0 },
      momentumY = { dist:0, time:0 },
      duration = (e.timeStamp || Date.now()) - that.startTime,
      newPosX = that.x,
      newPosY = that.y,
      distX, distY,
      newDuration,
      snap,
      scale;

    that._unbind(MOVE_EV, window);
    that._unbind(END_EV, window);
    that._unbind(CANCEL_EV, window);

    if (that.options.onBeforeScrollEnd) that.options.onBeforeScrollEnd.call(that, e);

    if (that.zoomed) {
      scale = that.scale * that.lastScale;
      scale = Math.max(that.options.zoomMin, scale);
      scale = Math.min(that.options.zoomMax, scale);
      that.lastScale = scale / that.scale;
      that.scale = scale;

      that.x = that.originX - that.originX * that.lastScale + that.x;
      that.y = that.originY - that.originY * that.lastScale + that.y;

      that.scroller.style[transitionDuration] = '200ms';
      that.scroller.style[transform] = 'translate(' + that.x + 'px,' + that.y + 'px) scale(' + that.scale + ')' + translateZ;

      that.zoomed = false;
      that.refresh();

      if (that.options.onZoomEnd) that.options.onZoomEnd.call(that, e);
      return;
    }

    if (!that.moved) {
      if (hasTouch) {
        if (that.doubleTapTimer && that.options.zoom) {
          // Double tapped
          clearTimeout(that.doubleTapTimer);
          that.doubleTapTimer = null;
          if (that.options.onZoomStart) that.options.onZoomStart.call(that, e);
          that.zoom(that.pointX, that.pointY, that.scale == 1 ? that.options.doubleTapZoom : 1);
          if (that.options.onZoomEnd) {
            setTimeout(function() {
              that.options.onZoomEnd.call(that, e);
            }, 200); // 200 is default zoom duration
          }
        } else if (this.options.handleClick) {
          that.doubleTapTimer = setTimeout(function () {
            that.doubleTapTimer = null;

            // Find the last touched element
            target = point.target;
            while (target.nodeType != 1) target = target.parentNode;

            if (target.tagName != 'SELECT' && target.tagName != 'INPUT' && target.tagName != 'TEXTAREA') {
              ev = doc.createEvent('MouseEvents');
              ev.initMouseEvent('click', true, true, e.view, 1,
                point.screenX, point.screenY, point.clientX, point.clientY,
                e.ctrlKey, e.altKey, e.shiftKey, e.metaKey,
                0, null);
              ev._fake = true;
              target.dispatchEvent(ev);
            }
          }, that.options.zoom ? 250 : 0);
        }
      }

      that._resetPos(400);

      if (that.options.onTouchEnd) that.options.onTouchEnd.call(that, e);
      return;
    }

    if (duration < 300 && that.options.momentum) {
      momentumX = newPosX ? that._momentum(newPosX - that.startX, duration, -that.x, that.scrollerW - that.wrapperW + that.x, that.options.bounce ? that.wrapperW : 0) : momentumX;
      momentumY = newPosY ? that._momentum(newPosY - that.startY, duration, -that.y, (that.maxScrollY < 0 ? that.scrollerH - that.wrapperH + that.y - that.minScrollY : 0), that.options.bounce ? that.wrapperH : 0) : momentumY;

      newPosX = that.x + momentumX.dist;
      newPosY = that.y + momentumY.dist;

      if ((that.x > 0 && newPosX > 0) || (that.x < that.maxScrollX && newPosX < that.maxScrollX)) momentumX = { dist:0, time:0 };
      if ((that.y > that.minScrollY && newPosY > that.minScrollY) || (that.y < that.maxScrollY && newPosY < that.maxScrollY)) momentumY = { dist:0, time:0 };
    }

    if (momentumX.dist || momentumY.dist) {
      newDuration = m.max(m.max(momentumX.time, momentumY.time), 10);

      // Do we need to snap?
      if (that.options.snap) {
        distX = newPosX - that.absStartX;
        distY = newPosY - that.absStartY;
        if (m.abs(distX) < that.options.snapThreshold && m.abs(distY) < that.options.snapThreshold) { that.scrollTo(that.absStartX, that.absStartY, 200); }
        else {
          snap = that._snap(newPosX, newPosY);
          newPosX = snap.x;
          newPosY = snap.y;
          newDuration = m.max(snap.time, newDuration);
        }
      }

      that.scrollTo(m.round(newPosX), m.round(newPosY), newDuration);

      if (that.options.onTouchEnd) that.options.onTouchEnd.call(that, e);
      return;
    }

    // Do we need to snap?
    if (that.options.snap) {
      distX = newPosX - that.absStartX;
      distY = newPosY - that.absStartY;
      if (m.abs(distX) < that.options.snapThreshold && m.abs(distY) < that.options.snapThreshold) that.scrollTo(that.absStartX, that.absStartY, 200);
      else {
        snap = that._snap(that.x, that.y);
        if (snap.x != that.x || snap.y != that.y) that.scrollTo(snap.x, snap.y, snap.time);
      }

      if (that.options.onTouchEnd) that.options.onTouchEnd.call(that, e);
      return;
    }

    that._resetPos(200);
    if (that.options.onTouchEnd) that.options.onTouchEnd.call(that, e);
  },

  _resetPos: function (time) {
    var that = this,
      resetX = that.x >= 0 ? 0 : that.x < that.maxScrollX ? that.maxScrollX : that.x,
      resetY = that.y >= that.minScrollY || that.maxScrollY > 0 ? that.minScrollY : that.y < that.maxScrollY ? that.maxScrollY : that.y;

    if (resetX == that.x && resetY == that.y) {
      if (that.moved) {
        that.moved = false;
        if (that.options.onScrollEnd) that.options.onScrollEnd.call(that);    // Execute custom code on scroll end
      }

      if (that.hScrollbar && that.options.hideScrollbar) {
        if (vendor == 'webkit') that.hScrollbarWrapper.style[transitionDelay] = '300ms';
        that.hScrollbarWrapper.style.opacity = '0';
      }
      if (that.vScrollbar && that.options.hideScrollbar) {
        if (vendor == 'webkit') that.vScrollbarWrapper.style[transitionDelay] = '300ms';
        that.vScrollbarWrapper.style.opacity = '0';
      }

      return;
    }

    that.scrollTo(resetX, resetY, time || 0);
  },

  _wheel: function (e) {
    var that = this,
      wheelDeltaX, wheelDeltaY,
      deltaX, deltaY,
      deltaScale;

    if ('wheelDeltaX' in e) {
      wheelDeltaX = e.wheelDeltaX / 12;
      wheelDeltaY = e.wheelDeltaY / 12;
    } else if('wheelDelta' in e) {
      wheelDeltaX = wheelDeltaY = e.wheelDelta / 12;
    } else if ('detail' in e) {
      wheelDeltaX = wheelDeltaY = -e.detail * 3;
    } else {
      return;
    }

    if (that.options.wheelAction == 'zoom') {
      deltaScale = that.scale * Math.pow(2, 1/3 * (wheelDeltaY ? wheelDeltaY / Math.abs(wheelDeltaY) : 0));
      if (deltaScale < that.options.zoomMin) deltaScale = that.options.zoomMin;
      if (deltaScale > that.options.zoomMax) deltaScale = that.options.zoomMax;

      if (deltaScale != that.scale) {
        if (!that.wheelZoomCount && that.options.onZoomStart) that.options.onZoomStart.call(that, e);
        that.wheelZoomCount++;

        that.zoom(e.pageX, e.pageY, deltaScale, 400);

        setTimeout(function() {
          that.wheelZoomCount--;
          if (!that.wheelZoomCount && that.options.onZoomEnd) that.options.onZoomEnd.call(that, e);
        }, 400);
      }

      return;
    }

    deltaX = that.x + wheelDeltaX;
    deltaY = that.y + wheelDeltaY;

    if (deltaX > 0) deltaX = 0;
    else if (deltaX < that.maxScrollX) deltaX = that.maxScrollX;

    if (deltaY > that.minScrollY) deltaY = that.minScrollY;
    else if (deltaY < that.maxScrollY) deltaY = that.maxScrollY;

    if (that.maxScrollY < 0) {
      that.scrollTo(deltaX, deltaY, 0);
    }
  },

  _transitionEnd: function (e) {
    var that = this;

    if (e.target != that.scroller) return;

    that._unbind(TRNEND_EV);

    that._startAni();
  },


  /**
  *
  * Utilities
  *
  */
  _startAni: function () {
    var that = this,
      startX = that.x, startY = that.y,
      startTime = Date.now(),
      step, easeOut,
      animate;

    if (that.animating) return;

    if (!that.steps.length) {
      that._resetPos(400);
      return;
    }

    step = that.steps.shift();

    if (step.x == startX && step.y == startY) step.time = 0;

    that.animating = true;
    that.moved = true;

    if (that.options.useTransition) {
      that._transitionTime(step.time);
      that._pos(step.x, step.y);
      that.animating = false;
      if (step.time) that._bind(TRNEND_EV);
      else that._resetPos(0);
      return;
    }

    animate = function () {
      var now = Date.now(),
        newX, newY;

      if (now >= startTime + step.time) {
        that._pos(step.x, step.y);
        that.animating = false;
        if (that.options.onAnimationEnd) that.options.onAnimationEnd.call(that);      // Execute custom code on animation end
        that._startAni();
        return;
      }

      now = (now - startTime) / step.time - 1;
      easeOut = m.sqrt(1 - now * now);
      newX = (step.x - startX) * easeOut + startX;
      newY = (step.y - startY) * easeOut + startY;
      that._pos(newX, newY);
      if (that.animating) that.aniTime = nextFrame(animate);
    };

    animate();
  },

  _transitionTime: function (time) {
    time += 'ms';
    this.scroller.style[transitionDuration] = time;
    if (this.hScrollbar) this.hScrollbarIndicator.style[transitionDuration] = time;
    if (this.vScrollbar) this.vScrollbarIndicator.style[transitionDuration] = time;
  },

  _momentum: function (dist, time, maxDistUpper, maxDistLower, size) {
    var deceleration = 0.0006,
      speed = m.abs(dist) / time,
      newDist = (speed * speed) / (2 * deceleration),
      newTime = 0, outsideDist = 0;

    // Proportinally reduce speed if we are outside of the boundaries
    if (dist > 0 && newDist > maxDistUpper) {
      outsideDist = size / (6 / (newDist / speed * deceleration));
      maxDistUpper = maxDistUpper + outsideDist;
      speed = speed * maxDistUpper / newDist;
      newDist = maxDistUpper;
    } else if (dist < 0 && newDist > maxDistLower) {
      outsideDist = size / (6 / (newDist / speed * deceleration));
      maxDistLower = maxDistLower + outsideDist;
      speed = speed * maxDistLower / newDist;
      newDist = maxDistLower;
    }

    newDist = newDist * (dist < 0 ? -1 : 1);
    newTime = speed / deceleration;

    return { dist: newDist, time: m.round(newTime) };
  },

  _offset: function (el) {
    var left = -el.offsetLeft,
      top = -el.offsetTop;

    while (el = el.offsetParent) {
      left -= el.offsetLeft;
      top -= el.offsetTop;
    }

    if (el != this.wrapper) {
      left *= this.scale;
      top *= this.scale;
    }

    return { left: left, top: top };
  },

  _snap: function (x, y) {
    var that = this,
      i, l,
      page, time,
      sizeX, sizeY;

    // Check page X
    page = that.pagesX.length - 1;
    for (i=0, l=that.pagesX.length; i<l; i++) {
      if (x >= that.pagesX[i]) {
        page = i;
        break;
      }
    }
    if (page == that.currPageX && page > 0 && that.dirX < 0) page--;
    x = that.pagesX[page];
    sizeX = m.abs(x - that.pagesX[that.currPageX]);
    sizeX = sizeX ? m.abs(that.x - x) / sizeX * 500 : 0;
    that.currPageX = page;

    // Check page Y
    page = that.pagesY.length-1;
    for (i=0; i<page; i++) {
      if (y >= that.pagesY[i]) {
        page = i;
        break;
      }
    }
    if (page == that.currPageY && page > 0 && that.dirY < 0) page--;
    y = that.pagesY[page];
    sizeY = m.abs(y - that.pagesY[that.currPageY]);
    sizeY = sizeY ? m.abs(that.y - y) / sizeY * 500 : 0;
    that.currPageY = page;

    // Snap with constant speed (proportional duration)
    time = m.round(m.max(sizeX, sizeY)) || 200;

    return { x: x, y: y, time: time };
  },

  _bind: function (type, el, bubble) {
    var that = this;
    if (window.attachEvent) {
            (el || this.scroller).attachEvent("on"+type,function(e) {
                            that.handleEvent(e);
                    });
    } else {
            (el || this.scroller).addEventListener(type, this, !!bubble);
    }
  },

  _unbind: function (type, el, bubble) {
    var that = this;
                if (window.detachEvent) {
                        (el || this.scroller).detachEvent("on"+type,function(e) {
                                        that.handleEvent(e);
                                });
                } else {
                        (el || this.scroller).removeEventListener(type, this, !!bubble);
                }
  },


  /**
  *
  * Public methods
  *
  */
  destroy: function () {
    var that = this;

    that.scroller.style[transform] = '';

    // Remove the scrollbars
    that.hScrollbar = false;
    that.vScrollbar = false;
    that._scrollbar('h');
    that._scrollbar('v');

    // Remove the event listeners
    that._unbind(RESIZE_EV, window);
    that._unbind(START_EV);
    that._unbind(MOVE_EV, window);
    that._unbind(END_EV, window);
    that._unbind(CANCEL_EV, window);

    if (!that.options.hasTouch) {
      that._unbind('DOMMouseScroll');
      that._unbind('mousewheel');
    }

    if (that.options.useTransition) that._unbind(TRNEND_EV);

    if (that.options.checkDOMChanges) clearInterval(that.checkDOMTime);

    if (that.options.onDestroy) that.options.onDestroy.call(that);
  },

  refresh: function () {
    var that = this,
      offset,
      i, l,
      els,
      pos = 0,
      page = 0;

    if (that.scale < that.options.zoomMin) that.scale = that.options.zoomMin;
    that.wrapperW = that.wrapper.clientWidth || 1;
    that.wrapperH = that.wrapper.clientHeight || 1;

    that.minScrollY = -that.options.topOffset || 0;
    that.scrollerW = m.round(that.scroller.offsetWidth * that.scale);
    that.scrollerH = m.round((that.scroller.offsetHeight + that.minScrollY) * that.scale);
    that.maxScrollX = that.wrapperW - that.scrollerW;
    that.maxScrollY = that.wrapperH - that.scrollerH + that.minScrollY;
    that.dirX = 0;
    that.dirY = 0;

    if (that.options.onRefresh) that.options.onRefresh.call(that);

    that.hScroll = that.options.hScroll && that.maxScrollX < 0;
    that.vScroll = that.options.vScroll && (!that.options.bounceLock && !that.hScroll || that.scrollerH > that.wrapperH);

    that.hScrollbar = that.hScroll && that.options.hScrollbar;
    that.vScrollbar = that.vScroll && that.options.vScrollbar && that.scrollerH > that.wrapperH;

    offset = that._offset(that.wrapper);
    that.wrapperOffsetLeft = -offset.left;
    that.wrapperOffsetTop = -offset.top;

    // Prepare snap
    if (typeof that.options.snap == 'string') {
      that.pagesX = [];
      that.pagesY = [];
      els = that.scroller.querySelectorAll(that.options.snap);
      for (i=0, l=els.length; i<l; i++) {
        pos = that._offset(els[i]);
        pos.left += that.wrapperOffsetLeft;
        pos.top += that.wrapperOffsetTop;
        that.pagesX[i] = pos.left < that.maxScrollX ? that.maxScrollX : pos.left * that.scale;
        that.pagesY[i] = pos.top < that.maxScrollY ? that.maxScrollY : pos.top * that.scale;
      }
    } else if (that.options.snap) {
      that.pagesX = [];
      while (pos >= that.maxScrollX) {
        that.pagesX[page] = pos;
        pos = pos - that.wrapperW;
        page++;
      }
      if (that.maxScrollX%that.wrapperW) that.pagesX[that.pagesX.length] = that.maxScrollX - that.pagesX[that.pagesX.length-1] + that.pagesX[that.pagesX.length-1];

      pos = 0;
      page = 0;
      that.pagesY = [];
      while (pos >= that.maxScrollY) {
        that.pagesY[page] = pos;
        pos = pos - that.wrapperH;
        page++;
      }
      if (that.maxScrollY%that.wrapperH) that.pagesY[that.pagesY.length] = that.maxScrollY - that.pagesY[that.pagesY.length-1] + that.pagesY[that.pagesY.length-1];
    }

    // Prepare the scrollbars
    that._scrollbar('h');
    that._scrollbar('v');

    if (!that.zoomed) {
      that.scroller.style[transitionDuration] = '0';
      that._resetPos(400);
    }
  },

  scrollTo: function (x, y, time, relative) {
    var that = this,
      step = x,
      i, l;

    that.stop();

    if (!step.length) step = [{ x: x, y: y, time: time, relative: relative }];

    for (i=0, l=step.length; i<l; i++) {
      if (step[i].relative) { step[i].x = that.x - step[i].x; step[i].y = that.y - step[i].y; }
      that.steps.push({ x: step[i].x, y: step[i].y, time: step[i].time || 0 });
    }

    that._startAni();
  },

  scrollToElement: function (el, time) {
    var that = this, pos;
    el = el.nodeType ? el : that.scroller.querySelector(el);
    if (!el) return;

    pos = that._offset(el);
    pos.left += that.wrapperOffsetLeft;
    pos.top += that.wrapperOffsetTop;

    pos.left = pos.left > 0 ? 0 : pos.left < that.maxScrollX ? that.maxScrollX : pos.left;
    pos.top = pos.top > that.minScrollY ? that.minScrollY : pos.top < that.maxScrollY ? that.maxScrollY : pos.top;
    time = time === undefined ? m.max(m.abs(pos.left)*2, m.abs(pos.top)*2) : time;

    that.scrollTo(pos.left, pos.top, time);
  },

  scrollToPage: function (pageX, pageY, time) {
    var that = this, x, y;

    time = time === undefined ? 400 : time;

    if (that.options.onScrollStart) that.options.onScrollStart.call(that);

    if (that.options.snap) {
      pageX = pageX == 'next' ? that.currPageX+1 : pageX == 'prev' ? that.currPageX-1 : pageX;
      pageY = pageY == 'next' ? that.currPageY+1 : pageY == 'prev' ? that.currPageY-1 : pageY;

      pageX = pageX < 0 ? 0 : pageX > that.pagesX.length-1 ? that.pagesX.length-1 : pageX;
      pageY = pageY < 0 ? 0 : pageY > that.pagesY.length-1 ? that.pagesY.length-1 : pageY;

      that.currPageX = pageX;
      that.currPageY = pageY;
      x = that.pagesX[pageX];
      y = that.pagesY[pageY];
    } else {
      x = -that.wrapperW * pageX;
      y = -that.wrapperH * pageY;
      if (x < that.maxScrollX) x = that.maxScrollX;
      if (y < that.maxScrollY) y = that.maxScrollY;
    }

    that.scrollTo(x, y, time);
  },

  disable: function () {
    this.stop();
    this._resetPos(0);
    this.enabled = false;

    // If disabled after touchstart we make sure that there are no left over events
    this._unbind(MOVE_EV, window);
    this._unbind(END_EV, window);
    this._unbind(CANCEL_EV, window);
  },

  enable: function () {
    this.enabled = true;
  },

  stop: function () {
    if (this.options.useTransition) this._unbind(TRNEND_EV);
    else cancelFrame(this.aniTime);
    this.steps = [];
    this.moved = false;
    this.animating = false;
  },

  zoom: function (x, y, scale, time) {
    var that = this,
      relScale = scale / that.scale;

    if (!that.options.useTransform) return;

    that.zoomed = true;
    time = time === undefined ? 200 : time;
    x = x - that.wrapperOffsetLeft - that.x;
    y = y - that.wrapperOffsetTop - that.y;
    that.x = x - x * relScale + that.x;
    that.y = y - y * relScale + that.y;

    that.scale = scale;
    that.refresh();

    that.x = that.x > 0 ? 0 : that.x < that.maxScrollX ? that.maxScrollX : that.x;
    that.y = that.y > that.minScrollY ? that.minScrollY : that.y < that.maxScrollY ? that.maxScrollY : that.y;

    that.scroller.style[transitionDuration] = time + 'ms';
    that.scroller.style[transform] = 'translate(' + that.x + 'px,' + that.y + 'px) scale(' + scale + ')' + translateZ;
    that.zoomed = false;
  },

  isReady: function () {
    return !this.moved && !this.zoomed && !this.animating;
  }
};

function prefixStyle (style) {
  if ( vendor === '' ) return style;

  style = style.charAt(0).toUpperCase() + style.substr(1);
  return vendor + style;
}

dummyStyle = null;  // for the sake of it

if (typeof exports !== 'undefined') exports.iScroll = iScroll;
else window.iScroll = iScroll;

})(window, document);

/*! Magnific Popup - v0.9.9 - 2013-12-27
* http://dimsemenov.com/plugins/magnific-popup/
* Copyright (c) 2013 Dmitry Semenov; */
(function(e){var t,n,i,o,r,a,s,l="Close",c="BeforeClose",d="AfterClose",u="BeforeAppend",p="MarkupParse",f="Open",m="Change",g="mfp",h="."+g,v="mfp-ready",C="mfp-removing",y="mfp-prevent-close",w=function(){},b=!!window.jQuery,I=e(window),x=function(e,n){t.ev.on(g+e+h,n)},k=function(t,n,i,o){var r=document.createElement("div");return r.className="mfp-"+t,i&&(r.innerHTML=i),o?n&&n.appendChild(r):(r=e(r),n&&r.appendTo(n)),r},T=function(n,i){t.ev.triggerHandler(g+n,i),t.st.callbacks&&(n=n.charAt(0).toLowerCase()+n.slice(1),t.st.callbacks[n]&&t.st.callbacks[n].apply(t,e.isArray(i)?i:[i]))},E=function(n){return n===s&&t.currTemplate.closeBtn||(t.currTemplate.closeBtn=e(t.st.closeMarkup.replace("%title%",t.st.tClose)),s=n),t.currTemplate.closeBtn},_=function(){e.magnificPopup.instance||(t=new w,t.init(),e.magnificPopup.instance=t)},S=function(){var e=document.createElement("p").style,t=["ms","O","Moz","Webkit"];if(void 0!==e.transition)return!0;for(;t.length;)if(t.pop()+"Transition"in e)return!0;return!1};w.prototype={constructor:w,init:function(){var n=navigator.appVersion;t.isIE7=-1!==n.indexOf("MSIE 7."),t.isIE8=-1!==n.indexOf("MSIE 8."),t.isLowIE=t.isIE7||t.isIE8,t.isAndroid=/android/gi.test(n),t.isIOS=/iphone|ipad|ipod/gi.test(n),t.supportsTransition=S(),t.probablyMobile=t.isAndroid||t.isIOS||/(Opera Mini)|Kindle|webOS|BlackBerry|(Opera Mobi)|(Windows Phone)|IEMobile/i.test(navigator.userAgent),o=e(document),t.popupsCache={}},open:function(n){i||(i=e(document.body));var r;if(n.isObj===!1){t.items=n.items.toArray(),t.index=0;var s,l=n.items;for(r=0;l.length>r;r++)if(s=l[r],s.parsed&&(s=s.el[0]),s===n.el[0]){t.index=r;break}}else t.items=e.isArray(n.items)?n.items:[n.items],t.index=n.index||0;if(t.isOpen)return t.updateItemHTML(),void 0;t.types=[],a="",t.ev=n.mainEl&&n.mainEl.length?n.mainEl.eq(0):o,n.key?(t.popupsCache[n.key]||(t.popupsCache[n.key]={}),t.currTemplate=t.popupsCache[n.key]):t.currTemplate={},t.st=e.extend(!0,{},e.magnificPopup.defaults,n),t.fixedContentPos="auto"===t.st.fixedContentPos?!t.probablyMobile:t.st.fixedContentPos,t.st.modal&&(t.st.closeOnContentClick=!1,t.st.closeOnBgClick=!1,t.st.showCloseBtn=!1,t.st.enableEscapeKey=!1),t.bgOverlay||(t.bgOverlay=k("bg").on("click"+h,function(){t.close()}),t.wrap=k("wrap").attr("tabindex",-1).on("click"+h,function(e){t._checkIfClose(e.target)&&t.close()}),t.container=k("container",t.wrap)),t.contentContainer=k("content"),t.st.preloader&&(t.preloader=k("preloader",t.container,t.st.tLoading));var c=e.magnificPopup.modules;for(r=0;c.length>r;r++){var d=c[r];d=d.charAt(0).toUpperCase()+d.slice(1),t["init"+d].call(t)}T("BeforeOpen"),t.st.showCloseBtn&&(t.st.closeBtnInside?(x(p,function(e,t,n,i){n.close_replaceWith=E(i.type)}),a+=" mfp-close-btn-in"):t.wrap.append(E())),t.st.alignTop&&(a+=" mfp-align-top"),t.fixedContentPos?t.wrap.css({overflow:t.st.overflowY,overflowX:"hidden",overflowY:t.st.overflowY}):t.wrap.css({top:I.scrollTop(),position:"absolute"}),(t.st.fixedBgPos===!1||"auto"===t.st.fixedBgPos&&!t.fixedContentPos)&&t.bgOverlay.css({height:o.height(),position:"absolute"}),t.st.enableEscapeKey&&o.on("keyup"+h,function(e){27===e.keyCode&&t.close()}),I.on("resize"+h,function(){t.updateSize()}),t.st.closeOnContentClick||(a+=" mfp-auto-cursor"),a&&t.wrap.addClass(a);var u=t.wH=I.height(),m={};if(t.fixedContentPos&&t._hasScrollBar(u)){var g=t._getScrollbarSize();g&&(m.marginRight=g)}t.fixedContentPos&&(t.isIE7?e("body, html").css("overflow","hidden"):m.overflow="hidden");var C=t.st.mainClass;return t.isIE7&&(C+=" mfp-ie7"),C&&t._addClassToMFP(C),t.updateItemHTML(),T("BuildControls"),e("html").css(m),t.bgOverlay.add(t.wrap).prependTo(t.st.prependTo||i),t._lastFocusedEl=document.activeElement,setTimeout(function(){t.content?(t._addClassToMFP(v),t._setFocus()):t.bgOverlay.addClass(v),o.on("focusin"+h,t._onFocusIn)},16),t.isOpen=!0,t.updateSize(u),T(f),n},close:function(){t.isOpen&&(T(c),t.isOpen=!1,t.st.removalDelay&&!t.isLowIE&&t.supportsTransition?(t._addClassToMFP(C),setTimeout(function(){t._close()},t.st.removalDelay)):t._close())},_close:function(){T(l);var n=C+" "+v+" ";if(t.bgOverlay.detach(),t.wrap.detach(),t.container.empty(),t.st.mainClass&&(n+=t.st.mainClass+" "),t._removeClassFromMFP(n),t.fixedContentPos){var i={marginRight:""};t.isIE7?e("body, html").css("overflow",""):i.overflow="",e("html").css(i)}o.off("keyup"+h+" focusin"+h),t.ev.off(h),t.wrap.attr("class","mfp-wrap").removeAttr("style"),t.bgOverlay.attr("class","mfp-bg"),t.container.attr("class","mfp-container"),!t.st.showCloseBtn||t.st.closeBtnInside&&t.currTemplate[t.currItem.type]!==!0||t.currTemplate.closeBtn&&t.currTemplate.closeBtn.detach(),t._lastFocusedEl&&e(t._lastFocusedEl).focus(),t.currItem=null,t.content=null,t.currTemplate=null,t.prevHeight=0,T(d)},updateSize:function(e){if(t.isIOS){var n=document.documentElement.clientWidth/window.innerWidth,i=window.innerHeight*n;t.wrap.css("height",i),t.wH=i}else t.wH=e||I.height();t.fixedContentPos||t.wrap.css("height",t.wH),T("Resize")},updateItemHTML:function(){var n=t.items[t.index];t.contentContainer.detach(),t.content&&t.content.detach(),n.parsed||(n=t.parseEl(t.index));var i=n.type;if(T("BeforeChange",[t.currItem?t.currItem.type:"",i]),t.currItem=n,!t.currTemplate[i]){var o=t.st[i]?t.st[i].markup:!1;T("FirstMarkupParse",o),t.currTemplate[i]=o?e(o):!0}r&&r!==n.type&&t.container.removeClass("mfp-"+r+"-holder");var a=t["get"+i.charAt(0).toUpperCase()+i.slice(1)](n,t.currTemplate[i]);t.appendContent(a,i),n.preloaded=!0,T(m,n),r=n.type,t.container.prepend(t.contentContainer),T("AfterChange")},appendContent:function(e,n){t.content=e,e?t.st.showCloseBtn&&t.st.closeBtnInside&&t.currTemplate[n]===!0?t.content.find(".mfp-close").length||t.content.append(E()):t.content=e:t.content="",T(u),t.container.addClass("mfp-"+n+"-holder"),t.contentContainer.append(t.content)},parseEl:function(n){var i,o=t.items[n];if(o.tagName?o={el:e(o)}:(i=o.type,o={data:o,src:o.src}),o.el){for(var r=t.types,a=0;r.length>a;a++)if(o.el.hasClass("mfp-"+r[a])){i=r[a];break}o.src=o.el.attr("data-mfp-src"),o.src||(o.src=o.el.attr("href"))}return o.type=i||t.st.type||"inline",o.index=n,o.parsed=!0,t.items[n]=o,T("ElementParse",o),t.items[n]},addGroup:function(e,n){var i=function(i){i.mfpEl=this,t._openClick(i,e,n)};n||(n={});var o="click.magnificPopup";n.mainEl=e,n.items?(n.isObj=!0,e.off(o).on(o,i)):(n.isObj=!1,n.delegate?e.off(o).on(o,n.delegate,i):(n.items=e,e.off(o).on(o,i)))},_openClick:function(n,i,o){var r=void 0!==o.midClick?o.midClick:e.magnificPopup.defaults.midClick;if(r||2!==n.which&&!n.ctrlKey&&!n.metaKey){var a=void 0!==o.disableOn?o.disableOn:e.magnificPopup.defaults.disableOn;if(a)if(e.isFunction(a)){if(!a.call(t))return!0}else if(a>I.width())return!0;n.type&&(n.preventDefault(),t.isOpen&&n.stopPropagation()),o.el=e(n.mfpEl),o.delegate&&(o.items=i.find(o.delegate)),t.open(o)}},updateStatus:function(e,i){if(t.preloader){n!==e&&t.container.removeClass("mfp-s-"+n),i||"loading"!==e||(i=t.st.tLoading);var o={status:e,text:i};T("UpdateStatus",o),e=o.status,i=o.text,t.preloader.html(i),t.preloader.find("a").on("click",function(e){e.stopImmediatePropagation()}),t.container.addClass("mfp-s-"+e),n=e}},_checkIfClose:function(n){if(!e(n).hasClass(y)){var i=t.st.closeOnContentClick,o=t.st.closeOnBgClick;if(i&&o)return!0;if(!t.content||e(n).hasClass("mfp-close")||t.preloader&&n===t.preloader[0])return!0;if(n===t.content[0]||e.contains(t.content[0],n)){if(i)return!0}else if(o&&e.contains(document,n))return!0;return!1}},_addClassToMFP:function(e){t.bgOverlay.addClass(e),t.wrap.addClass(e)},_removeClassFromMFP:function(e){this.bgOverlay.removeClass(e),t.wrap.removeClass(e)},_hasScrollBar:function(e){return(t.isIE7?o.height():document.body.scrollHeight)>(e||I.height())},_setFocus:function(){(t.st.focus?t.content.find(t.st.focus).eq(0):t.wrap).focus()},_onFocusIn:function(n){return n.target===t.wrap[0]||e.contains(t.wrap[0],n.target)?void 0:(t._setFocus(),!1)},_parseMarkup:function(t,n,i){var o;i.data&&(n=e.extend(i.data,n)),T(p,[t,n,i]),e.each(n,function(e,n){if(void 0===n||n===!1)return!0;if(o=e.split("_"),o.length>1){var i=t.find(h+"-"+o[0]);if(i.length>0){var r=o[1];"replaceWith"===r?i[0]!==n[0]&&i.replaceWith(n):"img"===r?i.is("img")?i.attr("src",n):i.replaceWith('<img src="'+n+'" class="'+i.attr("class")+'" />'):i.attr(o[1],n)}}else t.find(h+"-"+e).html(n)})},_getScrollbarSize:function(){if(void 0===t.scrollbarSize){var e=document.createElement("div");e.id="mfp-sbm",e.style.cssText="width: 99px; height: 99px; overflow: scroll; position: absolute; top: -9999px;",document.body.appendChild(e),t.scrollbarSize=e.offsetWidth-e.clientWidth,document.body.removeChild(e)}return t.scrollbarSize}},e.magnificPopup={instance:null,proto:w.prototype,modules:[],open:function(t,n){return _(),t=t?e.extend(!0,{},t):{},t.isObj=!0,t.index=n||0,this.instance.open(t)},close:function(){return e.magnificPopup.instance&&e.magnificPopup.instance.close()},registerModule:function(t,n){n.options&&(e.magnificPopup.defaults[t]=n.options),e.extend(this.proto,n.proto),this.modules.push(t)},defaults:{disableOn:0,key:null,midClick:!1,mainClass:"",preloader:!0,focus:"",closeOnContentClick:!1,closeOnBgClick:!0,closeBtnInside:!0,showCloseBtn:!0,enableEscapeKey:!0,modal:!1,alignTop:!1,removalDelay:0,prependTo:null,fixedContentPos:"auto",fixedBgPos:"auto",overflowY:"auto",closeMarkup:'<button title="%title%" type="button" class="mfp-close">&times;</button>',tClose:"Close (Esc)",tLoading:"Loading..."}},e.fn.magnificPopup=function(n){_();var i=e(this);if("string"==typeof n)if("open"===n){var o,r=b?i.data("magnificPopup"):i[0].magnificPopup,a=parseInt(arguments[1],10)||0;r.items?o=r.items[a]:(o=i,r.delegate&&(o=o.find(r.delegate)),o=o.eq(a)),t._openClick({mfpEl:o},i,r)}else t.isOpen&&t[n].apply(t,Array.prototype.slice.call(arguments,1));else n=e.extend(!0,{},n),b?i.data("magnificPopup",n):i[0].magnificPopup=n,t.addGroup(i,n);return i};var P,O,z,M="inline",B=function(){z&&(O.after(z.addClass(P)).detach(),z=null)};e.magnificPopup.registerModule(M,{options:{hiddenClass:"hide",markup:"",tNotFound:"Content not found"},proto:{initInline:function(){t.types.push(M),x(l+"."+M,function(){B()})},getInline:function(n,i){if(B(),n.src){var o=t.st.inline,r=e(n.src);if(r.length){var a=r[0].parentNode;a&&a.tagName&&(O||(P=o.hiddenClass,O=k(P),P="mfp-"+P),z=r.after(O).detach().removeClass(P)),t.updateStatus("ready")}else t.updateStatus("error",o.tNotFound),r=e("<div>");return n.inlineElement=r,r}return t.updateStatus("ready"),t._parseMarkup(i,{},n),i}}});var F,H="ajax",L=function(){F&&i.removeClass(F)},A=function(){L(),t.req&&t.req.abort()};e.magnificPopup.registerModule(H,{options:{settings:null,cursor:"mfp-ajax-cur",tError:'<a href="%url%">The content</a> could not be loaded.'},proto:{initAjax:function(){t.types.push(H),F=t.st.ajax.cursor,x(l+"."+H,A),x("BeforeChange."+H,A)},getAjax:function(n){F&&i.addClass(F),t.updateStatus("loading");var o=e.extend({url:n.src,success:function(i,o,r){var a={data:i,xhr:r};T("ParseAjax",a),t.appendContent(e(a.data),H),n.finished=!0,L(),t._setFocus(),setTimeout(function(){t.wrap.addClass(v)},16),t.updateStatus("ready"),T("AjaxContentAdded")},error:function(){L(),n.finished=n.loadError=!0,t.updateStatus("error",t.st.ajax.tError.replace("%url%",n.src))}},t.st.ajax.settings);return t.req=e.ajax(o),""}}});var j,N=function(n){if(n.data&&void 0!==n.data.title)return n.data.title;var i=t.st.image.titleSrc;if(i){if(e.isFunction(i))return i.call(t,n);if(n.el)return n.el.attr(i)||""}return""};e.magnificPopup.registerModule("image",{options:{markup:'<div class="mfp-figure"><div class="mfp-close"></div><figure><div class="mfp-img"></div><figcaption><div class="mfp-bottom-bar"><div class="mfp-title"></div><div class="mfp-counter"></div></div></figcaption></figure></div>',cursor:"mfp-zoom-out-cur",titleSrc:"title",verticalFit:!0,tError:'<a href="%url%">The image</a> could not be loaded.'},proto:{initImage:function(){var e=t.st.image,n=".image";t.types.push("image"),x(f+n,function(){"image"===t.currItem.type&&e.cursor&&i.addClass(e.cursor)}),x(l+n,function(){e.cursor&&i.removeClass(e.cursor),I.off("resize"+h)}),x("Resize"+n,t.resizeImage),t.isLowIE&&x("AfterChange",t.resizeImage)},resizeImage:function(){var e=t.currItem;if(e&&e.img&&t.st.image.verticalFit){var n=0;t.isLowIE&&(n=parseInt(e.img.css("padding-top"),10)+parseInt(e.img.css("padding-bottom"),10)),e.img.css("max-height",t.wH-n)}},_onImageHasSize:function(e){e.img&&(e.hasSize=!0,j&&clearInterval(j),e.isCheckingImgSize=!1,T("ImageHasSize",e),e.imgHidden&&(t.content&&t.content.removeClass("mfp-loading"),e.imgHidden=!1))},findImageSize:function(e){var n=0,i=e.img[0],o=function(r){j&&clearInterval(j),j=setInterval(function(){return i.naturalWidth>0?(t._onImageHasSize(e),void 0):(n>200&&clearInterval(j),n++,3===n?o(10):40===n?o(50):100===n&&o(500),void 0)},r)};o(1)},getImage:function(n,i){var o=0,r=function(){n&&(n.img[0].complete?(n.img.off(".mfploader"),n===t.currItem&&(t._onImageHasSize(n),t.updateStatus("ready")),n.hasSize=!0,n.loaded=!0,T("ImageLoadComplete")):(o++,200>o?setTimeout(r,100):a()))},a=function(){n&&(n.img.off(".mfploader"),n===t.currItem&&(t._onImageHasSize(n),t.updateStatus("error",s.tError.replace("%url%",n.src))),n.hasSize=!0,n.loaded=!0,n.loadError=!0)},s=t.st.image,l=i.find(".mfp-img");if(l.length){var c=document.createElement("img");c.className="mfp-img",n.img=e(c).on("load.mfploader",r).on("error.mfploader",a),c.src=n.src,l.is("img")&&(n.img=n.img.clone()),c=n.img[0],c.naturalWidth>0?n.hasSize=!0:c.width||(n.hasSize=!1)}return t._parseMarkup(i,{title:N(n),img_replaceWith:n.img},n),t.resizeImage(),n.hasSize?(j&&clearInterval(j),n.loadError?(i.addClass("mfp-loading"),t.updateStatus("error",s.tError.replace("%url%",n.src))):(i.removeClass("mfp-loading"),t.updateStatus("ready")),i):(t.updateStatus("loading"),n.loading=!0,n.hasSize||(n.imgHidden=!0,i.addClass("mfp-loading"),t.findImageSize(n)),i)}}});var W,R=function(){return void 0===W&&(W=void 0!==document.createElement("p").style.MozTransform),W};e.magnificPopup.registerModule("zoom",{options:{enabled:!1,easing:"ease-in-out",duration:300,opener:function(e){return e.is("img")?e:e.find("img")}},proto:{initZoom:function(){var e,n=t.st.zoom,i=".zoom";if(n.enabled&&t.supportsTransition){var o,r,a=n.duration,s=function(e){var t=e.clone().removeAttr("style").removeAttr("class").addClass("mfp-animated-image"),i="all "+n.duration/1e3+"s "+n.easing,o={position:"fixed",zIndex:9999,left:0,top:0,"-webkit-backface-visibility":"hidden"},r="transition";return o["-webkit-"+r]=o["-moz-"+r]=o["-o-"+r]=o[r]=i,t.css(o),t},d=function(){t.content.css("visibility","visible")};x("BuildControls"+i,function(){if(t._allowZoom()){if(clearTimeout(o),t.content.css("visibility","hidden"),e=t._getItemToZoom(),!e)return d(),void 0;r=s(e),r.css(t._getOffset()),t.wrap.append(r),o=setTimeout(function(){r.css(t._getOffset(!0)),o=setTimeout(function(){d(),setTimeout(function(){r.remove(),e=r=null,T("ZoomAnimationEnded")},16)},a)},16)}}),x(c+i,function(){if(t._allowZoom()){if(clearTimeout(o),t.st.removalDelay=a,!e){if(e=t._getItemToZoom(),!e)return;r=s(e)}r.css(t._getOffset(!0)),t.wrap.append(r),t.content.css("visibility","hidden"),setTimeout(function(){r.css(t._getOffset())},16)}}),x(l+i,function(){t._allowZoom()&&(d(),r&&r.remove(),e=null)})}},_allowZoom:function(){return"image"===t.currItem.type},_getItemToZoom:function(){return t.currItem.hasSize?t.currItem.img:!1},_getOffset:function(n){var i;i=n?t.currItem.img:t.st.zoom.opener(t.currItem.el||t.currItem);var o=i.offset(),r=parseInt(i.css("padding-top"),10),a=parseInt(i.css("padding-bottom"),10);o.top-=e(window).scrollTop()-r;var s={width:i.width(),height:(b?i.innerHeight():i[0].offsetHeight)-a-r};return R()?s["-moz-transform"]=s.transform="translate("+o.left+"px,"+o.top+"px)":(s.left=o.left,s.top=o.top),s}}});var Z="iframe",q="//about:blank",D=function(e){if(t.currTemplate[Z]){var n=t.currTemplate[Z].find("iframe");n.length&&(e||(n[0].src=q),t.isIE8&&n.css("display",e?"block":"none"))}};e.magnificPopup.registerModule(Z,{options:{markup:'<div class="mfp-iframe-scaler"><div class="mfp-close"></div><iframe class="mfp-iframe" src="//about:blank" frameborder="0" allowfullscreen></iframe></div>',srcAction:"iframe_src",patterns:{youtube:{index:"youtube.com",id:"v=",src:"//www.youtube.com/embed/%id%?autoplay=1"},vimeo:{index:"vimeo.com/",id:"/",src:"//player.vimeo.com/video/%id%?autoplay=1"},gmaps:{index:"//maps.google.",src:"%id%&output=embed"}}},proto:{initIframe:function(){t.types.push(Z),x("BeforeChange",function(e,t,n){t!==n&&(t===Z?D():n===Z&&D(!0))}),x(l+"."+Z,function(){D()})},getIframe:function(n,i){var o=n.src,r=t.st.iframe;e.each(r.patterns,function(){return o.indexOf(this.index)>-1?(this.id&&(o="string"==typeof this.id?o.substr(o.lastIndexOf(this.id)+this.id.length,o.length):this.id.call(this,o)),o=this.src.replace("%id%",o),!1):void 0});var a={};return r.srcAction&&(a[r.srcAction]=o),t._parseMarkup(i,a,n),t.updateStatus("ready"),i}}});var K=function(e){var n=t.items.length;return e>n-1?e-n:0>e?n+e:e},Y=function(e,t,n){return e.replace(/%curr%/gi,t+1).replace(/%total%/gi,n)};e.magnificPopup.registerModule("gallery",{options:{enabled:!1,arrowMarkup:'<button title="%title%" type="button" class="mfp-arrow mfp-arrow-%dir%"></button>',preload:[0,2],navigateByImgClick:!0,arrows:!0,tPrev:"Previous (Left arrow key)",tNext:"Next (Right arrow key)",tCounter:"%curr% of %total%"},proto:{initGallery:function(){var n=t.st.gallery,i=".mfp-gallery",r=Boolean(e.fn.mfpFastClick);return t.direction=!0,n&&n.enabled?(a+=" mfp-gallery",x(f+i,function(){n.navigateByImgClick&&t.wrap.on("click"+i,".mfp-img",function(){return t.items.length>1?(t.next(),!1):void 0}),o.on("keydown"+i,function(e){37===e.keyCode?t.prev():39===e.keyCode&&t.next()})}),x("UpdateStatus"+i,function(e,n){n.text&&(n.text=Y(n.text,t.currItem.index,t.items.length))}),x(p+i,function(e,i,o,r){var a=t.items.length;o.counter=a>1?Y(n.tCounter,r.index,a):""}),x("BuildControls"+i,function(){if(t.items.length>1&&n.arrows&&!t.arrowLeft){var i=n.arrowMarkup,o=t.arrowLeft=e(i.replace(/%title%/gi,n.tPrev).replace(/%dir%/gi,"left")).addClass(y),a=t.arrowRight=e(i.replace(/%title%/gi,n.tNext).replace(/%dir%/gi,"right")).addClass(y),s=r?"mfpFastClick":"click";o[s](function(){t.prev()}),a[s](function(){t.next()}),t.isIE7&&(k("b",o[0],!1,!0),k("a",o[0],!1,!0),k("b",a[0],!1,!0),k("a",a[0],!1,!0)),t.container.append(o.add(a))}}),x(m+i,function(){t._preloadTimeout&&clearTimeout(t._preloadTimeout),t._preloadTimeout=setTimeout(function(){t.preloadNearbyImages(),t._preloadTimeout=null},16)}),x(l+i,function(){o.off(i),t.wrap.off("click"+i),t.arrowLeft&&r&&t.arrowLeft.add(t.arrowRight).destroyMfpFastClick(),t.arrowRight=t.arrowLeft=null}),void 0):!1},next:function(){t.direction=!0,t.index=K(t.index+1),t.updateItemHTML()},prev:function(){t.direction=!1,t.index=K(t.index-1),t.updateItemHTML()},goTo:function(e){t.direction=e>=t.index,t.index=e,t.updateItemHTML()},preloadNearbyImages:function(){var e,n=t.st.gallery.preload,i=Math.min(n[0],t.items.length),o=Math.min(n[1],t.items.length);for(e=1;(t.direction?o:i)>=e;e++)t._preloadItem(t.index+e);for(e=1;(t.direction?i:o)>=e;e++)t._preloadItem(t.index-e)},_preloadItem:function(n){if(n=K(n),!t.items[n].preloaded){var i=t.items[n];i.parsed||(i=t.parseEl(n)),T("LazyLoad",i),"image"===i.type&&(i.img=e('<img class="mfp-img" />').on("load.mfploader",function(){i.hasSize=!0}).on("error.mfploader",function(){i.hasSize=!0,i.loadError=!0,T("LazyLoadError",i)}).attr("src",i.src)),i.preloaded=!0}}}});var U="retina";e.magnificPopup.registerModule(U,{options:{replaceSrc:function(e){return e.src.replace(/\.\w+$/,function(e){return"@2x"+e})},ratio:1},proto:{initRetina:function(){if(window.devicePixelRatio>1){var e=t.st.retina,n=e.ratio;n=isNaN(n)?n():n,n>1&&(x("ImageHasSize."+U,function(e,t){t.img.css({"max-width":t.img[0].naturalWidth/n,width:"100%"})}),x("ElementParse."+U,function(t,i){i.src=e.replaceSrc(i,n)}))}}}}),function(){var t=1e3,n="ontouchstart"in window,i=function(){I.off("touchmove"+r+" touchend"+r)},o="mfpFastClick",r="."+o;e.fn.mfpFastClick=function(o){return e(this).each(function(){var a,s=e(this);if(n){var l,c,d,u,p,f;s.on("touchstart"+r,function(e){u=!1,f=1,p=e.originalEvent?e.originalEvent.touches[0]:e.touches[0],c=p.clientX,d=p.clientY,I.on("touchmove"+r,function(e){p=e.originalEvent?e.originalEvent.touches:e.touches,f=p.length,p=p[0],(Math.abs(p.clientX-c)>10||Math.abs(p.clientY-d)>10)&&(u=!0,i())}).on("touchend"+r,function(e){i(),u||f>1||(a=!0,e.preventDefault(),clearTimeout(l),l=setTimeout(function(){a=!1},t),o())})})}s.on("click"+r,function(){a||o()})})},e.fn.destroyMfpFastClick=function(){e(this).off("touchstart"+r+" click"+r),n&&I.off("touchmove"+r+" touchend"+r)}}(),_()})(window.jQuery||window.Zepto);

