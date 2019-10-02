import { utils } from '../../utils/utils';
import { ToolbarFlex } from '../toolbar-flex/toolbar-flex';
import { Locale } from '../locale/locale';

// Default Settings
const COMPONENT_NAME = 'calendartoolbar';

/**
 * The Calendar Toolbar Displays a toolbar above calendars and week views.
 * @class CalendarToolbar
 * @constructor
 *
 * @param {jQuery[]|HTMLElement} element The component element.
 * @param {object} [settings] The component settings.
 * @param {string} [settings.locale] The name of the locale to use for this instance. If not set the current locale will be used.
 * @param {number} [settings.month] The month to show.
 * @param {number} [settings.year] The year to show.
 * @param {boolean} [settings.showToday=true] If true the today button is shown on the header.
 * @param {function} [settings.onOpenCalendar] Call back for when the calendar is open on the toolbar datepicker, allows you to set the date.
 * @param {boolean} [settings.isAlternate] Alternate style for the datepicker popup.
 * @param {boolean} [settings.isMenuButton] Show the month/year as a menu button object, works if isAlternate is true.
*/
const COMPONENT_DEFAULTS = {
  month: new Date().getMonth(),
  year: new Date().getFullYear(),
  locale: null,
  showToday: true,
  onOpenCalendar: null,
  isAlternate: false,
  isMenuButton: true
};

function CalendarToolbar(element, settings) {
  this.element = $(element);
  this.settings = utils.mergeSettings(this.element[0], settings, COMPONENT_DEFAULTS);
  this.init();
}

// CalendarToolbar Methods
CalendarToolbar.prototype = {

  init() {
    this.build();
    this.handleEvents();
  },

  /**
   * Set up the toolbar to the settings.
   * @private
   * @returns {void}
   */
  build() {
    this.setLocale();
    this.element[0].classList.add('flex-toolbar');

    if (this.settings.isAlternate) {
      this.element[0].classList.add('is-alternate');
      const monthYearPaneButton = `<button type="button" class="btn btn-monthyear-pane expandable-area-trigger" id="btn-monthyear-pane">
        <span class="month">november</span>
        <span class="year">2019</span>
        <svg class="icon icon-closed" focusable="false" aria-hidden="true" role="presentation">
          <use xlink:href="#icon-dropdown"></use>
        </svg>
        <svg class="icon icon-opened" focusable="false" aria-hidden="true" role="presentation">
          <use xlink:href="#icon-dropdown"></use>
        </svg>
      </button>`;

      this.element[0].innerHTML = `
        <div class="toolbar-section">
          ${this.settings.isMenuButton ? monthYearPaneButton : '<span class="month">november</span><span class="year">2015</span>'}
        </div>
        <div class="toolbar-section buttonset">
          ${this.settings.showToday ? `<a class="hyperlink today" href="#">${Locale.translate('Today', { locale: this.locale.name })}</a>` : ''}
          <button type="button" class="btn-icon prev">
            <svg class="icon" focusable="false" aria-hidden="true" role="presentation"><use xlink:href="#icon-caret-left"></use></svg>
            <span>${Locale.translate('PreviousMonth')}</span>
            </button>
          <button type="button" class="btn-icon next">
              <svg class="icon" focusable="false" aria-hidden="true" role="presentation"><use xlink:href="#icon-caret-right"></use></svg>
              <span>${Locale.translate('NextMonth')}</span>
          </button>
        </div>
      `;
    } else {
      this.element[0].innerHTML = `
        <div class="toolbar-section">
          <button type="button" class="btn-icon prev">
            <svg class="icon" focusable="false" aria-hidden="true" role="presentation"><use xlink:href="#icon-caret-left"></use></svg>
            <span>${Locale.translate('PreviousMonth')}</span>
            </button>
          <button type="button" class="btn-icon next">
              <svg class="icon" focusable="false" aria-hidden="true" role="presentation"><use xlink:href="#icon-caret-right"></use></svg>
              <span>${Locale.translate('NextMonth')}</span>
          </button>
          <span class="monthview-datepicker">
            <span class="hidden month" data-month="9">9</span>
            <span class="hidden year">2019</span>
            <label class="audible" for="monthview-datepicker-field">${Locale.translate('SelectDay')}</label>
            <input aria-label="${Locale.translate('Today')}" id="monthview-datepicker-field" class="datepicker" type="text" data-validate="none"/>
          </span>
          ${this.settings.showToday ? `<a class="hyperlink today" href="#">${Locale.translate('Today', { locale: this.locale.name })}</a>` : ''}
        </div>
        <div class="toolbar-section buttonset">
        </div>
      `;
    }

    // Invoke the toolbar
    this.toolbarApi = new ToolbarFlex(this.element[0], {});

    // Setup the datepicker
    this.monthPicker = this.element.find('#monthview-datepicker-field').datepicker({
      autoSize: true,
      dateFormat: Locale.calendar(this.locale.name).dateFormat.year,
      locale: this.settings.locale,
      onOpenCalendar: this.settings.onOpenCalendar
    });

    this.todayLink = this.element.find('.hyperlink.today');
    this.monthPickerApi = this.monthPicker.data('datepicker');

    this.setInternalDate(new Date(this.settings.year, this.settings.month, 1));

    // Hide focus on buttons
    this.element.find('button, a').hideFocus();
    return this;
  },

  /**
   * Set the internal date state.
   * @private
   * @param {date} date The date to set.
   * @returns {void}
   */
  setInternalDate(date) {
    this.currentYear = date.getFullYear();
    this.currentMonth = date.getMonth();
    this.currentDay = date.getDate();
    this.currentDate = date;

    this.monthPicker.val(Locale.formatDate(new Date(this.currentYear, this.currentMonth, this.currentDay), { date: 'year', locale: this.locale.name }));
    if (this.monthPickerApi) {
      this.monthPickerApi.setSize();
      return;
    }

    this.setCurrentCalendar();
    const monthName = this.currentCalendar.months.wide[this.currentMonth];
    this.element.find('span.month').attr('data-month', this.currentMonth).text(monthName);
    this.element.find('span.year').text(` ${this.currentYear}`);

    // Some locales set the year first
    const yearFirst = this.currentCalendar.dateFormat.year && this.currentCalendar.dateFormat.year.substr(1, 1) === 'y';
    if (yearFirst) {
      const translation = Locale.formatDate(this.currentDate, { date: 'year', locale: this.locale.name });
      const justYear = translation.split(' ')[0];

      this.element.find('span.year').text(`${justYear} `);
      this.element.find('span.year').insertBefore(this.element.find('span.month'));
    }
  },

  /**
   * Set current calendar
   * @private
   * @returns {void}
   */
  setCurrentCalendar() {
    this.currentCalendar = Locale.calendar(this.locale.name, this.settings.calendarName);
  },

  /**
   * Set current locale to be used if different than the set locale.
   * @private
   * @returns {void}
   */
  setLocale() {
    if (this.settings.locale && (!this.locale || this.locale.name !== this.settings.locale)) {
      Locale.getLocale(this.settings.locale).done((locale) => {
        this.locale = Locale.cultures[locale];
        this.setCurrentCalendar();
        this.build().handleEvents();
      });
    } else if (!this.settings.locale) {
      this.locale = Locale.currentLocale;
    }
  },

  /**
   * Attach Events used by the Component.
   * @private
   * @returns {void}
   */
  handleEvents() {
    const self = this;
    this.monthPicker.off('change.calendar-toolbar-p').on('change.calendar-toolbar-p', function () {
      const picker = $(this).data('datepicker');
      self.setInternalDate(picker.currentDate);
      self.element.trigger('change-date', { selectedDate: picker.currentDate, isToday: false });
    });

    this.todayLink.off('click.calendar-toolbar-t').on('click.calendar-toolbar-t', () => {
      this.element.trigger('change-date', { selectedDate: this.currentDate, isToday: true });
    });

    this.element.find('.prev').off('click.calendar-toolbar-b').on('click.calendar-toolbar-b', () => {
      this.element.trigger('change-next', { selectedDate: this.currentDate, isToday: false });
    });
    this.element.find('.next').off('click.calendar-toolbar-b').on('click.calendar-toolbar-b', () => {
      this.element.trigger('change-prev', { selectedDate: this.currentDate, isToday: false });
    });
    return this;
  },

  /**
   * Resync the UI and Settings.
   * @param {object} settings The settings to apply.
   * @returns {object} The api
   */
  updated(settings) {
    if (typeof settings !== 'undefined') {
      this.settings = utils.mergeSettings(this.element, settings, COMPONENT_DEFAULTS);
    }
    return this
      .teardown()
      .init();
  },

  /**
   * Teardown all event handles.
   * @returns {void}
   */
  teardown() {
    this.element.off();
    this.monthPicker.off();
    this.todayLink.off();
    this.element.find('.prev .next').off();
  },

  /**
   * Destroy this component instance and remove the link from its base element.
   * @returns {void}
   */
  destroy() {
    this.unbind();
    $.removeData(this.element[0], COMPONENT_NAME);
  }

};

export { CalendarToolbar, COMPONENT_NAME };
