var cluster = require('cluster');
var control = require('../index');
var program = require('commander');

program
  .option('-p,--path <path>', 'listen on socket for control, default to ' + control.ADDR)
  .option('-e,--exec <script>', 'execute worker script, default to same as master')
  .option('-s,--size <size>', 'start cluster at size workers, default to cpu count')
  ;

program.parse(process.argv);

if(program.exec) {
  cluster.setupMaster({
    exec: program.exec
  });
}

control.start({
  size: program.size,
  path: program.path,
});
