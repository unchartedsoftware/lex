Lex ships with both a compiled CSS stylesheet (`lex.css`) and a raw SASS stylesheet (`lex.scss`). If you wish to customize styles, you will need to include the raw SASS stylesheet in your build and override one or more of the following variables (shown here with their default values):

```scss
$lex-background: revert; // use the background color inherited from Bootstrap
$lex-border-color: revert; // use the border color inherited from Bootstrap
$lex-border-radius-base: 3px; // border radius for various things
$lex-highlight-color: #0097a7;  // highlight color for various things
$lex-highlight-text-color: #fff; // color for text shown on top of a highlight-color background
$lex-danger-highlight-color: #d9534f; // highlight color for dangerous things
$lex-danger-highlight-text-color: #fff; // color for text shown on top of a danger-highlight-color background
$lex-line-height: 1.67; // base line height for lex tokens, etc.
$lex-token-padding: 2px; // padding for lex tokens
$lex-token-value-spacing: 0.3em; // spacing for token value inputs
$lex-token-background: #ededed; // background color for tokens
$lex-token-color: #555; // text color for tokens (inherit from Bootstrap)
$lex-token-hover-color: lighten($lex-token-color, 15%); // hover color for close button
$lex-token-border-color: darken($lex-token-background, 15%); // border color for a token
$lex-token-active-background: darken($lex-token-background, 15%); // background for active token components
$lex-token-input-border-color: transparent; // border for lex token text inputs
$lex-token-remove-button-color: lighten($lex-token-color, 45%); // hover color for remove button in multi-entry
$lex-token-remove-button-hover-color: darken($lex-token-remove-button-color, 15%); // text color for remove button in multi-entry
$lex-token-active-background: darken($lex-token-background, 15%); // background color for active region of a token. should lighten for dark theme
$lex-token-invalid-background: #e2a4e2; // background color for invalid region of token. should lighten for dark theme
$lex-assistant-background: #fff; // background color for assistant drop-down
$lex-assistant-border-color: $lex-token-border-color; // border color for assistant drop-down
$lex-assistant-header-background: $lex-token-background; // header background color for assistant drop-down
$lex-assistant-header-color: #8d8d8d; // header text color for assistant drop-down
```
