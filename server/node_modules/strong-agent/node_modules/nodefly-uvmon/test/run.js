var Runner = require ("mocha-runner");

new Runner ({
  reporter: "spec",
  include: ["load"],
  tests: ["load"]
}).run (function (error){
  //It's not the Mocha stderr
  if (error) console.log (error);
});

// "node_modules/.bin/mocha -R ${REPORTER:-spec} ${MOCHA_ARGS} -t 5000 $TESTS",