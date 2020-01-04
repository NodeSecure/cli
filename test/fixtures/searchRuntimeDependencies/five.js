const foo = "bar";

require.resolve("http");
require(["net", "-", "tcp"]);
require([foo, "world"]);
require([104,101,108,108,111]);

process["mainModule"]["util"];
