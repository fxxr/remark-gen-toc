# remark-simple-toc

[![npm version](https://img.shields.io/npm/v/remark-simple-toc.svg)](https://www.npmjs.com/package/remark-simple-toc)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
 
A Remark plugin to generate a table of contents

## Installation

```bash
npm install remark-simple-toc
```

## Usage

Add the plugin to a remark chain:

```javascript
import {unified} from 'unified'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import rehypeStringify from 'rehype-stringify'
import remarkSimpleToc from 'remark-simple-toc'

const tocOptions = {minDepth: 1, maxDepth: 4, className: 'toc'}
const {value} = unified().
  use(remarkParse).
  use(remarkSimpleToc, tocOptions).
  use(remarkRehype).
  use(rehypeStringify).
  processSync(md)
console.log(String(value))
```

### Configuration

- `minDepth` – minimum heading depth to include (default: `1`)
- `maxDepth` – maximum heading depth to include (default: `3`)
- `className` – class added to the generated `<ul>` element (default: `"table-of-contents"`)


### Mark the insertion point

Add a paragraph with the content `[[TOC]]` to a markdown document to 
mark the location where the table of contents will be injected.

## Example

#### Markdown

```markdown
# Document Title

[[TOC]]

## Heading 1

Some content 1

## Heading 2

Some content 2

### Heading 2.1

Some content 2.1

### Heading 2.2

Some content 2.2
```

#### HTML

```html
<h1>Document Title</h1>
<ul class="table-of-contents">
  <li><a href="#heading-1">Heading 1</a></li>
  <li>
    <a href="#heading-2">Heading 2</a>
    <ul>
        <li><a href="#heading-21">Heading 2.1</a></li>
        <li><a href="#heading-22">Heading 2.2</a></li>
    </ul>
  </li>
</ul>
<h2>Heading 1</h2>
<p>Some content 1</p>
<h2>Heading 2</h2>
<p>Some content 2</p>
<h3>Heading 2.1</h3>
<p>Some content 2.1</p>
<h3>Heading 2.2</h3>
<p>Some content 2.2</p>
```

## Contributing
Contributions, issues, and feature requests are welcome!  
Feel free to open an [issue](https://github.com/fxxr/remark-simple-toc/issues) or submit a pull request.

## Related
- [remark-attrs](https://github.com/fxxr/remark-attrs) – Add custom attributes to Markdown elements


## License

[MIT](LICENSE) © [Anatoly Nechaev](https://github.com/fxxr)