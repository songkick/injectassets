# injectassets [![Build Status](https://travis-ci.org/ArnaudRinquin/injectassets.svg)](https://travis-ci.org/ArnaudRinquin/injectassets)

Utility to inject reference or inline assets in your HTML

**Use cases**

* Automatically inject a long list of assets in your index.html
* Automatically inject files which names are updated often, like when using [`hashmark`](https://github.com/keithamus/hashmark)
* Just list all your assets
* Generate an [appcache manifest](http://www.html5rocks.com/en/tutorials/appcache/beginner/)
* Concat files
* _???_

## Usage

1. Write a basic (HTML) [mustache](http://mustache.github.io/) template using extensions as iterators:

  ```html
  <html>
  <head>
      <title>injectassets - example</title>

      {{#inline_css}}
      <style>{{{.}}}</style>
      {{/inline_css}}

      {{#css}}
      <link href="{{{.}}}" rel="stylesheet" type="text/css">
      {{/css}}
  </head>
  <body>
      <h1>It works!</h1>
      {{#js}}
      <script src="{{{.}}}"></script>
      {{/js}}

      {{#inline_js}}
      <script>{{{.}}}</script>
      {{/inline_js}}
  </body>
  </html>

  ```

1. Run the command:

  ```bash
  Usage: injectassets [options]

  Options:

  -h, --help                        output usage information
  -V, --version                     output the version number
  -s, --source <path to template>   template file path, default: stdin
  -o, --output <path>               result output path, default: stdout
  -g, --reference-globs <globs...>  globs for files to be inject as references
  -G, --inline-globs <globs...>     globs for files to be inlined
  -d, --dir <assets folder>         injected assets directory, default: "./"
  -p, --pattern <string>            use this pattern to generate paths, default {dir}/{base}
  -w, --watch                       run on every source file change
  -e, --encoding <string>           read/write encoding, encoding "utf-8"
  ```

## Examples

  * Use stdin and stdout, insert files path with the `-g, --reference-globs` option.

    ```bash
    cat src/index.html | injectassets -g '*.{css,js}'
    ```

  * Use a source file and specify output

    ```bash
    injectassets -g '*.{css,js}' -s src/index.html
    ```

  * Output to a file

    ```bash
    cat src/index.html | injectassets -g '*.{css,js}' -o dist/index.html
    # or simply
    cat src/index.html | injectassets -g '*.{css,js}' > dist/index.html
    ```

  * Specify directory containing the assets with `-d, --dir`

    ```bash
    cat src/index.html | injectassets -d 'dist/' -g '*.{css,js}'
    ```

  * Decide how files path will be formatted. Keys are all the values returned by [`path.parse()`](https://nodejs.org/api/path.html#path_path_parse_pathstring) (i.e: `root`, `dir`, `base`, `name`, `ext`)

    ```bash
    cat src/index.html | injectassets -g '*.{css,js}' -p '/public/{name}{ext}'
    ```

  * Inline files content with the `-G, --inline-globs` option

    ```bash
    cat src/index.html | injectassets -G '*.{css,js}'
    ```

  * Inline some files, inject references some others

    ```bash
    cat src/index.html | injectassets -G 'critical*.{css,js}' -g '!(critical)*.{css,js}'
    ```

  * Specify multiple globs separating them with `;`

    ```bash
    cat src/index.html | injectassets -G 'scripts/*.js;styles/*.css'
    ```

  * Watch for any change on specified globs and rerun automatically with `-w, --watch`

    ```bash
    cat src/index.html | injectassets -G 'scripts/*.js;styles/*.css' -w -o dist/index.html
    ```
