module.exports = function (wallaby) {
  return {

    files: [
      'src/*.ts',
      'tests/apiResponseMock.ts'
    ],

    tests: [
      'tests/*Spec.ts'
    ],

    testFramework: 'mocha',

    compilers: {
      '**/*.ts': wallaby.compilers.typeScript({ module: 'commonjs' })
    },


    env: {
      type: 'node',
      runner: 'node'
    }

  };
};