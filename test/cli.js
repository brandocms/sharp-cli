/* global describe, it, beforeEach, afterEach */
/*!
 * The MIT License (MIT)
 *
 * Copyright (c) 2017 Mark van Seventer
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
 * the Software, and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
 * FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
 * COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
 * IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

// Strict mode.
'use strict'

// Standard lib.
const path = require('path')

// Package modules.
const chai = require('chai')
const sinonChai = require('sinon-chai')

// Local modules.
const cli = require('../lib/cli')
const pkg = require('../package.json')
const queue = require('../lib/queue')
const sharp = require('./mocks/sharp')

// Configure.
chai.use(sinonChai)
const expect = chai.expect

// Test suite.
describe(`${pkg.name} <options> [command..]`, () => {
  // Defaults (avoid `path.join` to test for input normalizing).
  const input = `${__dirname}/../test/fixtures/input.jpg`
  const output = `${__dirname}/../test/`
  const ioFlags = [ '-i', input, '-o', output ]

  // Reset.
  afterEach('queue', () => queue.splice(0))
  afterEach('sharp', sharp.prototype.reset)

  describe('<options>', () => {
    void [ 'h', 'help' ].forEach((alias) => {
      describe(`--${alias}`, () => {
        it('should set the help flag', (done) => {
          cli.parse([ `--${alias}` ], (err, args, output) => {
            expect(args).to.have.property('help', true)
            done(err)
          })
        })
        it('should display help', (done) => {
          cli.parse([ `--${alias}` ], (err, args, output) => {
            expect(output).to.exist
            expect(output).to.contain('Commands')
            expect(output).to.contain('Options')
            expect(output).to.contain('Example')
            done(err)
          })
        })
      })
    })

    void [ 'i', 'input' ].forEach((alias) => {
      describe(`--${alias}`, () => {
        // Run.
        beforeEach((done) => cli.parse([ `--${alias}`, input, input, '-o', output ], done))

        // Tests.
        it('should set the input flag', () => {
          const args = cli.parsed.argv
          expect(args).to.have.property('input')
          expect(args.input).to.deep.equal([ path.normalize(input), path.normalize(input) ])
        })

        it('should fail when no input is given', (done) => {
          cli.parse([ `--${alias}`, '-o', output ], (err) => {
            expect(err).to.exist
            expect(err).to.have.property('message')
            expect(err.message).to.contain('Not enough arguments')
            done()
          })
        })
      })
    })

    void [ 'l', 'limitInputPixels' ].forEach((alias) => {
      describe(`--${alias}`, () => {
        // Run.
        beforeEach((done) => cli.parse([ `--${alias}`, '10', ...ioFlags ], done))

        // Tests.
        it('should set the limitInputPixels flag', () => {
          expect(cli.parsed.argv).to.have.property('limitInputPixels', 10)
        })
        it('should update the pipeline', () => {
          expect(queue.pipeline).to.have.length(1)
          expect(queue.pipeline).to.include('limitInputPixels')
        })
        it('should execute the pipeline', () => {
          const pipeline = queue.drain(sharp())
          expect(pipeline.limitInputPixels).to.have.been.called
        })
      })
    })

    void [ 'o', 'output' ].forEach((alias) => {
      describe(`--${alias}`, () => {
        // Run.
        beforeEach((done) => cli.parse([ `--${alias}`, output, '-i', input ], done))

        // Tests.
        it('should set the input flag', () => {
          expect(cli.parsed.argv).to.have.property('output', path.normalize(output))
        })
      })
    })

    describe('--sequentialRead', () => {
      // Run.
      beforeEach((done) => cli.parse([ '--sequentialRead', ...ioFlags ], done))

      // Tests.
      it('should set the sequentialRead flag', () => {
        expect(cli.parsed.argv).to.have.property('sequentialRead', true)
      })
      it('should update the pipeline', () => {
        expect(queue.pipeline).to.have.length(1)
        expect(queue.pipeline).to.include('sequentialRead')
      })
      it('should execute the pipeline', () => {
        const pipeline = queue.drain(sharp())
        expect(pipeline.sequentialRead).to.have.been.called
      })
    })

    void [ 'v', 'version' ].forEach((alias) => {
      describe(`--${alias}`, () => {
        it('should set the version flag', (done) => {
          cli.parse([ `--${alias}` ], (err, args, output) => {
            expect(args).to.have.property('version', true)
            done(err)
          })
        })
        it('should display the version number', (done) => {
          cli.parse([ `--${alias}` ], (err, args, output) => {
            expect(output).to.equal(pkg.version)
            done(err)
          })
        })
      })
    })

    void [ 'm', 'withMetadata' ].forEach((alias) => {
      describe(`--${alias}`, () => {
        // Run.
        beforeEach((done) => cli.parse([ `--${alias}`, ...ioFlags ], done))

        // Tests.
        it('should set the withMetadata flag', () => {
          expect(cli.parsed.argv).to.have.property('withMetadata', true)
        })
        it('should update the pipeline', () => {
          expect(queue.pipeline).to.have.length(1)
          expect(queue.pipeline).to.include('withMetadata')
        })
        it('should execute the pipeline', () => {
          const pipeline = queue.drain(sharp())
          expect(pipeline.withMetadata).to.have.been.called
        })
      })
    })
  })

  describe('[command]', () => {
    // Run.
    beforeEach((done) => cli.parse([ 'flip', ...ioFlags ], done))

    // Tests.
    it('should update the pipeline', () => {
      expect(queue.pipeline).to.have.length(1)
      expect(queue.pipeline).to.include.members([ 'flip' ])
    })
    it('should execute the pipeline', () => {
      const pipeline = queue.drain(sharp())
      expect(pipeline.flip).to.have.been.called
    })
  })
})