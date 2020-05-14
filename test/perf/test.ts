import Benchmark = require('benchmark');


const suite = new Benchmark.Suite;

suite.add("test case", ()=> {
    'Hello World!'.indexOf('o') > -1;
  })
  .on('cycle', (event: { target: any; }) => {
    console.log(String(event.target));
  })
  .run();

