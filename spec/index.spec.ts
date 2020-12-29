import { expect } from 'chai';
import 'mocha';
const path = require('path');
const webpack = require('webpack');
const rimraf = require('rimraf');
import { diff } from 'json-diff';

const contextPath = path.join(__dirname, "../", "example")
const outputPath = path.join(__dirname, "../", "example", "build")


before(function (done) {
  this.timeout(5000);

  rimraf(outputPath, () => {
    const options = require(path.join(contextPath, 'webpack.test.config.js'));
    options.mode = 'production';
    options.context = contextPath;

    webpack(options, (err, stats) => {
      if (err) return done(err);
      // add a file to asset
      //if success call done
      done();
    })
  });
});

/**
 * Test all the scenerios
 */
describe('MergeWebpackPlugin', () => {

  it('should merge by file names', (done) => {
    const expected = require('../example/app/merge-by-file-names/expected.json')
    const actual = require('../example/build/merge-by-file-names/output.json')
    expect(diff(expected, actual)).to.be.undefined;
    done();
  });

  it('should merge files by glob (more than one pattern in glob array)', (done) => {
    const expected1 = require('../example/app/glob/multiple/expected_en.json')
    const actual1 = require('../example/build/glob/multiple/en.json')
    expect(diff(expected1, actual1)).to.be.undefined;

    const expected2 = require('../example/app/glob/multiple/expected_fr.json')
    const actual2 = require('../example/build/glob/multiple/fr.json')
    expect(diff(expected2, actual2)).to.be.undefined;
    done();
  });

  it('should handle non json extention files.', (done) => {
    const expected = require('../example/app/non-json-extn/expected.json')
    const actual = require('../example/build/non-json-extn/output.json')
    expect(diff(expected, actual)).to.be.undefined;
    done();
  })

  it('should override values of key, when overwrite is true (default option)', (done) => {
    const expected = require('../example/app/overwrite-values/expected.json')
    const actual = require('../example/build/overwrite-values/actual.json')
    expect(diff(expected, actual)).to.be.undefined;
    done();
  })

  it('should merge into array, values of key, when overwrite is false.', (done) => {
    const expected = require('../example/app/merge-values/expected.json')
    const actual = require('../example/build/merge-values/actual.json')
    expect(diff(expected, actual)).to.be.undefined;
    done();
  })

  it('should append filename as prefix in the content', (done) => {
    const expected = require('../example/app/prefixFileName/expected.json')
    const actual = require('../example/build/prefixFileName/actual.json')
    expect(diff(expected, actual)).to.be.undefined;
    done();
  })

  it('should process jsons with BOM bytes', (done) => {
    // These 2 files don't have BOM bytes on them.
    // The file bundled via wepack.test.config.js does
    const expected = require('../example/app/bom-bytes/bom-bytes.json')
    const actual = require('../example/build/bom-bytes/bom-bytes.json')
    expect(diff(expected, actual)).to.be.undefined;
    done();
  })

  it('should use the function to generate prefixes if it\'s provided', (done) => {
    const expected = require('../example/app/prefixFileNameFn/expected.json')
    const actual = require('../example/build/prefixFileNameFn/actual.json')
    expect(diff(expected, actual)).to.be.undefined;
    done();
  })

  it('should format output if space parameter is provided', (done) => {
    const expected = require('../example/app/formatted-output/expected.json')
    const actual = require('../example/build/formatted-output/actual.json')
    expect(diff(expected, actual)).to.be.undefined;
    done();
  })

  it('should load file from assets', (done) => {
    const expected = require('../example/app/asset-files/expected.json')
    const actual = require('../example/build/asset-files/actual.json')
    expect(diff(expected, actual)).to.be.undefined;
    done();
  });

});
