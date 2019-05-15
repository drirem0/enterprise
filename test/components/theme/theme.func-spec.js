// Import all the locales
import { theme } from '../../../src/components/theme/theme';

require('../../../src/components/locale/cultures/en-US.js');
require('../../../src/components/locale/cultures/es-ES.js');

describe('Theme API', () => {
  const Locale = window.Soho.Locale;

  beforeEach(() => {
    Locale.set('en-US');
  });

  it('Should be an object', () => {
    expect(theme).toBeDefined();
  });

  it('Should contain current theme', () => {
    expect(theme.currentTheme.id).toEqual('theme-soho-light');
  });

  it('Should be able to set current theme', () => {
    theme.setTheme('theme-soho-dark');

    expect(theme.currentTheme.id).toEqual('theme-soho-dark');
    theme.setTheme('theme-soho-light');
  });

  it('Should be able to list all colors', () => {
    expect(theme.getAllThemeColors.length).toEqual(4);
    expect(theme.getAllThemeColors[0].colors.palette.amber['10'].value).toEqual('#fbe9bf');
    expect(theme.getAllThemeColors[1].colors.palette.amber['10'].value).toEqual('#fbe9bf');
    expect(theme.getAllThemeColors[2].colors.palette.amber['10'].value).toEqual('#fbe9bf');
    expect(theme.getAllThemeColors[3].colors.palette.amber['10'].value).toEqual('#FDF0DD');
  });

  it('Should be able to list themes', () => {
    expect(theme.themes().length).toEqual(4);
    expect(theme.themes()[0].id).toEqual('theme-soho-light');
    expect(theme.themes()[1].id).toEqual('theme-soho-dark');
    expect(theme.themes()[2].id).toEqual('theme-soho-contrast');
    expect(theme.themes()[3].id).toEqual('theme-uplift-light');
    expect(theme.themes()[4].id).toEqual('theme-uplift-dark');
    expect(theme.themes()[5].id).toEqual('theme-uplift-contrast');
  });

  it('Should be able to get theme colors', () => {
    expect(theme.themeColors().palette.azure['70'].value).toEqual('#2578a9');
    theme.setTheme('theme-uplift-light');

    expect(theme.themeColors().palette.azure['70'].value).toEqual('#0563C2');
    theme.setTheme('theme-soho-light');
  });

  it('Should be able to get personalization colors', () => {
    expect(theme.personalizationColors().azure.value).toEqual('#2578a9');
    // Locale doesnt work in the test but this proves it fires translate
    expect(theme.personalizationColors().azure.name).toEqual('Azure');
    theme.setTheme('theme-uplift-light');

    expect(theme.personalizationColors().azure.value).toEqual('#0563C2');
    expect(theme.personalizationColors().azure.id).toEqual('azure');
    theme.setTheme('theme-soho-light');
  });
});
