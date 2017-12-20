Lex ships with both a compiled CSS stylesheet (`lex.css`) and a raw SASS stylesheet (`lex.scss`). If you wish to customize styles, you will need to include the raw SASS stylesheet in your build and override one or more of the following variables (shown here with their default values):

```scss
$lex-background: revert; // use the background color inherited from Bootstrap
$lex-border-color: revert; // use the border color inherited from Bootstrap
$lex-border-radius-base: 3px; // border radius for various things
$lex-highlight-color: #0097a7;  // highlight color for various things
$lex-highlight-text-color: #fff; // color for text shown on top of a highlight-color background
$lex-token-background: #ededed; // background color for tokens
$lex-token-color: revert; // text color for tokens (inherit from Bootstrap)
$lex-token-border-color: darken($lex-token-background, 15%); // border color for a token
$lex-token-active-background: darken($lex-token-background, 15%); // background color for active region of a token. should lighten for dark theme
$lex-token-invalid-background: #e2a4e2; // background color for invalid region of token. should lighten for dark theme
$lex-assistant-background: #fff; // background color for assistant drop-down
$lex-assistant-border-color: $lex-token-border-color; // border color for assistant drop-down
$lex-assistant-header-background: $lex-token-background; // header background color for assistant drop-down
$lex-assistant-header-color: #8d8d8d; // header text color for assistant drop-down
```
