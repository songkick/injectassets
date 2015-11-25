# injectassets

CLI tool to inject assets (CSS, JS, ...) file paths into your HTML file (or other).

## Usage

1. Write a basic (HTML) [mustache](http://mustache.github.io/) template using extensions as iterators:

  ```html
  <html>
  <head>
      <title>injectassets - example</title>
      {{#css}}
      <link href="{{{.}}}" rel="stylesheet" type="text/css">
      {{/css}}
  </head>
  <body>
      <h1>It works!</h1>
      {{#js}}
      <script src="{{{.}}}"></script>
      {{/js}}
  </body>
  </html>

  ```

1. Run the command:

  ```sh
  cat src/index.html | injectassets > dist/index.html
  ```

## Options
**-s, --source**: template file path. Default: `stdin`  
**-o, --output**: result output path. Default: `stdout`  
**-d, --dir**: injected assets directory. Default: `./`  
**-e, --extensions**: comma separated list of extensions to inject. Default: `js,css`  
**-p, --pattern**: use this pattern to generate paths. Default: `{base}` (i.e. just the file name). Example: `/static/{name}.whatever{ext}`. Available keys are attribute returned by [`path.parse()`](https://nodejs.org/api/path.html#path_path_parse_pathstring).  
**-w, --watch**: run on every source file change.  
**-E, --encoding:** read/write encoding, Default: `utf-8`  
