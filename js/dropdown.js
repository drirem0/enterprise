/**
* Responsive Tab Control
* @name Tabs
* @param {string} propertyName - The Name of the Property
*/
(function (factory) {
  if (typeof define === 'function' && define.amd) {
      // AMD. Register as an anonymous module depending on jQuery.
      define(['jquery'], factory);
  } else {
      // No AMD. Register plugin with global jQuery object.
      factory(jQuery);
  }
}(function ($) {

  $.fn.dropdown = function(options) {

    // Dropdown Settings and Options
    var pluginName = 'dropdown',
        defaults = {
          editable: 'false' //TODO
        },
        settings = $.extend({}, defaults, options);

    // Plugin Constructor
    function Plugin(element) {
        this.element = $(element);
        this.init();
    }

    // Actual DropDown Code
    Plugin.prototype = {
      init: function() {

        var id = this.element.attr('id')+'-shdo'; //The Shadow Input Element. We use the dropdown to serialize.
        this.orgLabel = this.element.hide().prev('.label');

        this.label = $('<label class="label"></label>').attr('for', id).text(this.orgLabel.text());
        this.input = $('<input type="text" readonly class="dropdown" tabindex="0"/>').attr({'role': 'combobox'})
                        .attr({'aria-autocomplete': 'none', 'aria-owns': 'dropdown-list'})
                        .attr({'aria-readonly': 'true', 'aria-activedescendant': 'dropdown-opt16'})
                        .attr('id', id);

        this.element.after(this.label, this.input, this.trigger);
        this.orgLabel.hide();
        this.updateList();
        this.setValue();
        this.setWidth();
        this._bindEvents();
      },
      setWidth: function() {
        var style = this.element[0].style,
          labelStyle = this.orgLabel[0].style;

        if (style.width) {
          this.input.width(style.width);
        }
        if (style.position === 'absolute') {
          this.input.css({position: 'absolute', left: style.left, top: style.top, bottom: style.bottom, right: style.right});
        }
        if (labelStyle.position === 'absolute') {
          this.label.css({position: 'absolute', left: labelStyle.left, top: labelStyle.top, bottom: labelStyle.bottom, right: labelStyle.right});
        }
      },
      updateList: function() {
        var self = this;
        //Keep a list generated and append it when we need to.
        self.list = $('<ul id="dropdown-list" class="dropdown-list" tabindex="-1" aria-expanded="true"></ul>');

        self.element.find('option').each(function(i) {
          var option = $(this),
              listOption = $('<li id="list-option'+ i +'" role="option" class="dropdown-option" role="listitem" tabindex="-1">'+ option.text() + '</li>');
          self.list.append(listOption);
          if (option.is(':selected')) {
            listOption.addClass('is-selected');
          }
        });

        //TODO : Call source - Ajax.
      },

      setValue: function() {

        //Set initial value for the edit box
       this.input.val(this.element.find('option:selected').text());
      },

      _bindEvents: function() {
        var self = this,
          timer, buffer = '';

        //Bind mouse and key events
        this.input.on('keydown.dropdown', function(e) {
          self.handleKeyDown($(this), e);
        }).on('keypress.dropdown', function(e) {
          var charCode = e.charCode || e.keyCode;

          //Needed for browsers that use keypress events to manipulate the window.
          if (e.altKey && (charCode === 38 || charCode === 40)) {
            e.stopPropagation();
            return false;
          }

          if (charCode === 13) {
            e.stopPropagation();
            return false;
          }

          //Printable Chars Jump to first high level node with it...
           if (e.which !== 0) {
            var term = String.fromCharCode(e.which),
              opts = $(self.element[0].options);

            buffer += term.toLowerCase();
            clearTimeout(timer);
            setTimeout(function () {
              buffer ='';
            }, 700);

            opts.each(function () {
              if ($(this).text().substr(0, buffer.length).toLowerCase() === buffer) {
                self.selectOption($(this));
                return false;
              }
            });
          }

          return true;
        }).on('mouseup.dropdown', function() {
          self.openList();
        });

      },

      openList: function() {
        var current = this.list.find('.is-selected'),
            self =  this,
            isFixed = false,
            isAbs = false;

        this.list.appendTo('body').show().attr('aria-expanded', 'true');
        this.list.css({'top': this.input.position().top , 'left': this.input.position().left});

        this.input.parentsUntil('body').each(function () {
          if ($(this).css('position') === 'fixed') {
            isFixed = true;
            return;
          }

        });

        if (this.input.parent('.field').css('position') === 'absolute') {
          isAbs = true;
          this.list.css({'top': this.input.parent('.field').position().top + this.input.prev('label').height() , 'left': this.input.parent('.field').position().left});
       }

        if (isFixed) {
          this.list.css('position', 'fixed');
        }

        //let grow or to field size.
        if (this.list.width() > this.input.outerWidth()) {
           this.list.css({'width': this.list.width() + 15});
        } else {
           this.list.width(this.input.outerWidth());
        }

        this.scrollToOption(current);
        this.input.addClass('is-open');

        //TODO: Animate this.list.css('height', 0);
        //this.list.slideUp();

        self.list.on('click.list', 'li', function () {
          var idx = $(this).index(),
              cur = $(self.element[0].options[idx]);

          // select the clicked item
          self.selectOption(cur);
          self.input.focus();
          self.closeList();
        });

        $(document).on('click.dropdown', function(e) {
          var target = $(e.target);
          if (target.is('.dropdown-option') || target.is('.dropdown')) {
            return;
          }
          self.closeList();
        }).on('resize.dropdown', function() {
          self.closeList();
        }).on('scroll.dropdown', function() {
          self.closeList();
        });
      },

      closeList: function() {
        this.list.hide().attr('aria-expanded', 'false').remove();
        this.list.off('click.list').off('mousewheel.list');
        this.input.removeClass('is-open');
        $(document).off('click.dropdown resize.dropdown scroll.dropdown');
      },

      scrollToOption: function(current) {
        var self = this;
        if (!current) {
          return;
        }
        if (current.length === 0) {
          return;
        }
        // scroll to the currently selected option
        self.list.scrollTop(0);
        self.list.scrollTop(current.offset().top - self.list.offset().top - self.list.scrollTop());
      },

      handleBlur: function() {
        var self = this;

        if (this.isOpen()) {
          this.timer = setTimeout(function() {
            self.closeList();
          }, 40);
        }

        return true;
      },
      handleKeyDown: function(input, e) {
        var selectedIndex = this.element[0].selectedIndex,
            selectedText = this.element.val(),
            options = this.element[0].options,
            self = this;

        if (e.altKey && (e.keyCode === 38 || e.keyCode === 40)) {
          self.toggleList(true);
          e.stopPropagation();
          return false;
        }

        switch (e.keyCode) {
          case 8:    //backspace
          case 46: { //del
            // prevent the edit box from being changed
            this.input.val(selectedText);
            e.stopPropagation();
            return false;
          }
          case 9: {  //tab - save the current selection

            this.selectOption($(options[selectedIndex]));

            if (self.isOpen()) {  // Close the option list
              self.closeList(false);
            }

            // allow tab to propagate
            return true;
          }
          case 27: { //Esc - Close the Combo and Do not change value
            if (self.isOpen()) {
              // Close the option list
              self.closeList(true);
            }

            e.stopPropagation();
            return false;
          }
          case 13: {  //enter

            if (self.isOpen()) {
              self.selectOption($(options[selectedIndex])); // store the current selection
              self.closeList(false);  // Close the option list
            } else {
              self.openList(false);
            }

            e.stopPropagation();
            return false;
          }
          case 38: {  //up

            if (selectedIndex > 0) {
              var prev = $(options[selectedIndex - 1]);
              this.selectOption(prev);
            }

            e.stopPropagation();
            e.preventDefault();
            return false;
          }
          case 40: {  //down

            if (selectedIndex < options.length - 1) {
              var next = $(options[selectedIndex + 1]);
              this.selectOption(next);
            }

            e.stopPropagation();
            e.preventDefault();
            return false;
          }
          case 35: { //end
            var last = $(options[options.length - 1]);
            this.selectOption(last);

            e.stopPropagation();
            return false;
          }
          case 36: {  //home
            var first = $(options[0]);
            this.selectOption(first);

            e.stopPropagation();
            return false;
          }
        }

        return true;
      },
      isOpen: function() {
        return this.list.is(':visible');
      },
      toggleList: function() {
        if (this.isOpen()) {
          this.closeList();
        } else {
          this.openList();
        }
      },
      selectOption: function(option) {
        var code = option.val();

        if (this.isOpen()) {
          // remove the selected class from the current selection
          this.list.find('.is-selected').removeClass('is-selected');
          var listOption = this.list.find('#list-option'+option.index());
          listOption.addClass('is-selected');

          // Set activedescendent for new option
          this.input.attr('aria-activedescendant', listOption.attr('id'));
          this.scrollToOption(listOption);
        }
        this.input.val(option.text()); //set value and active descendent

        if (this.element.find('[value="' + code + '"]').length > 0) {
          this.element.find('[value="' + code + '"]')[0].selected = true;
        }
        this.element.val(code).trigger('change');

        this.input.focus();  //scroll to left
        this.input[0].setSelectionRange(0, 0);
      },
      destroy: function() {
        $.removeData(this.obj, pluginName);
        this.input.off().remove();
        $(document).off('click.dropdown');
      }
    };

    // Keep the Chaining and Init the Controls or Settings
    return this.each(function() {
      var instance = $.data(this, pluginName);
      if (instance) {
        instance.settings = $.extend({}, defaults, options);
      } else {
        instance = $.data(this, pluginName, new Plugin(this, settings));
      }
    });
  };
}));
