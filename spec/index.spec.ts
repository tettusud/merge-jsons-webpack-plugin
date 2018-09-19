import { expect } from 'chai';
import 'mocha';
const path = require('path');
const webpack = require('webpack');
const rimraf = require('rimraf');
const fs = require('fs');


const webpackMajorVersion = require('webpack/package.json').version.split('.')[0];
const examplePath = path.resolve(__dirname, '..', 'example');
var outputPath = path.resolve(examplePath, 'build');
var expectedPath = path.resolve(__dirname, '..', 'app', 'expected');

const expected = [
  'app/expected/countries.json',
  'app/expected/en.json',
  'app/expected/fr.json',
  'app/expected/file.json',
  'app/expected/prefixFileName.json',
  'app/expected/bom-bytes.json',
];

const actual = [
  'build/groupBy/countries/countries.json',
  'build/groupBy/locales/en.json',
  'build/groupBy/locales/fr.json',
  'build/files/file.json',
  'build/prefixFileName/prefixFileName.json',
  'build/bom-bytes/bom-bytes.json',
];

describe('should merge json files', () => {

  expect('hello world', 'hello world');
});

before(function (done) {
  this.timeout(5000);  
  var options = require(path.join(examplePath, 'webpack.test.config.js'));
  options.mode = 'production';
  options.context = examplePath;

  rimraf(outputPath, () => {
    webpack(options, (err) => {
      if (err) return done(err);
      //if success call done
      done();
    })
  })

});

/**
 * Test all the scenerios
 */
describe('MergeWebpackPlugin', () => {
  
  it('should merge files by glob', (done) => {
    var file1Contents = fs.readFileSync(path.join(examplePath, expected[0])).toString();
    var file2Contents = fs.readFileSync(path.join(examplePath, actual[0])).toString();
    expect(file2Contents).to.equal(file1Contents);
    done();
  })

  it('should merge files by more than one glob', (done) => {
    var file1Contents = fs.readFileSync(path.join(examplePath, expected[1])).toString();
    var file2Contents = fs.readFileSync(path.join(examplePath, actual[1])).toString();
    expect(file1Contents).to.equal(file2Contents);
    file1Contents = fs.readFileSync(path.join(examplePath, expected[2])).toString();
    file2Contents = fs.readFileSync(path.join(examplePath, actual[2])).toString();
    expect(file2Contents).to.equal(file1Contents);
    done();
  })

  it('should merge files by filename', (done) => {
    var file1Contents = fs.readFileSync(path.join(examplePath, expected[3])).toString();
    var file2Contents = fs.readFileSync(path.join(examplePath, actual[3])).toString();
    expect(file2Contents).to.equal(file1Contents);     
    done();
  })

  it('should append filename as prefix in the content', (done) => {
    var file1Contents = fs.readFileSync(path.join(examplePath, expected[4])).toString();
    var file2Contents = fs.readFileSync(path.join(examplePath, actual[4])).toString();
    expect(file2Contents).to.equal(file1Contents);     
    done();
  })

  it('should process jsons with BOM bytes', (done) => {
    // These 2 files don't have BOM bytes on them.
    // The file bundled via wepack.test.config.js does
    var file1Contents = fs.readFileSync(path.join(examplePath, expected[5])).toString();
    var file2Contents = fs.readFileSync(path.join(examplePath, actual[5])).toString();
    expect(file2Contents).to.equal(file1Contents);
    done();
  })

});