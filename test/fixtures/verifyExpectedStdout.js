export const VERIFY_EXPECTED_LINES = `directory size:     2 KB
unique licenses:    MIT

   ext    files                                   minified files
   .js    index.js                                index.min.js
  .json   package.json

--------------------------------------------------------------------------------
                         Required dependency and files
--------------------------------------------------------------------------------

                                    index.js
--------------------------------------------------------------------------------
required stmt                      try/catch                     source location
node:os                              false                        [2:0] - [2:34]

--------------------------------------------------------------------------------
                                  AST Warnings
--------------------------------------------------------------------------------

file                                  kind                       source location
index.js                       suspicious-literal                  [4:1] - [4:8]

                               5.268656716417911
--------------------------------------------------------------------------------`.split("\n");
