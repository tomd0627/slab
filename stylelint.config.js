export default {
  extends: ['stylelint-config-standard'],
  plugins: ['stylelint-order'],
  rules: {
    'order/properties-alphabetical-order': true,
    // Allow BEM double-underscore and double-dash notation
    'selector-class-pattern': [
      '^[a-z][a-z0-9-]*(__[a-z][a-z0-9-]*)?(--[a-z0-9][a-z0-9-]*)?$',
      { message: (selector) => `Expected "${selector}" to use BEM notation` },
    ],
  },
};
