import {test, expect} from 'vitest'
import fs from 'fs'
import path from 'path'
import {unified} from 'unified'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import rehypeStringify from 'rehype-stringify'
import {parse as parseHtml} from 'node-html-parser'
import remarkToc, {DEFAULT_OPTIONS, type Options} from '../src/index'


function normalizeHtml(html: string): string {
  const parsed = parseHtml(html)
  return parsed.removeWhitespace().toString()
}

function checkEqual(md: string, html: string, options: Options): void {
  const convertedToHtml = mdToHtml(md, options)
  expect(normalizeHtml(convertedToHtml)).eq(normalizeHtml(html))
}

function mdToHtml(md: string, options: Options): string {
  const {value} = unified().
    use(remarkParse).
    use(remarkToc, options).
    use(remarkRehype).
    use(rehypeStringify).
    processSync(md)
  return String(value)
}

function testToc(testCase: string, options: Options = DEFAULT_OPTIONS) {
  return () => {
    const md = String(fs.readFileSync(path.join(__dirname, `fixtures/${testCase}.md`)))
    const html = String(fs.readFileSync(path.join(__dirname, `fixtures/${testCase}.html`)))
    checkEqual(md, html, options)
  }
}

function testMalformedOptions(testCase: string) {
  return () => {
    const options: Options = {minDepth: 4, maxDepth: 3}
    const md = String(fs.readFileSync(path.join(__dirname, `fixtures/${testCase}.md`)))
    expect(() => mdToHtml(md, options)).toThrowError(/should be greater or equal to maxDepth/)
  }
}

test('Basic', testToc('basic'))
test('Duplicate Headings', testToc('duplicate_headings'))
test('Omitted Headings', testToc('omitted_headings', {maxDepth: 4}))
test('No Headings', testToc('no_headings'))
test('Multiple TOCs', testToc('multiple_tocs'))
test('Case-insensitive marker', testToc('case_insensitive_marker'))
test('Malformed options', testMalformedOptions('basic'))
test('Custom minDepth', testToc('min_depth', {minDepth: 2}))
test('Custom className', testToc('class_name', {className: 'toc'}))