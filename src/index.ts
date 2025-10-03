import type {Heading, Link, List, ListItem, Node, Paragraph, Parent, PhrasingContent, Root, Text} from 'mdast'
import Slugger from 'github-slugger'
import {toString} from 'mdast-util-to-string'

export type HeadingDepth = 1 | 2 | 3 | 4 | 5 | 6
export type Options = {minDepth?: HeadingDepth, maxDepth?: HeadingDepth, className?: string}

const [MIN_DEPTH, MAX_DEPTH, TOC_CLASS]: [HeadingDepth, HeadingDepth, string] = [1, 3, 'table-of-contents']
export const DEFAULT_OPTIONS = {minDepth: MIN_DEPTH, maxDepth: MAX_DEPTH, className: TOC_CLASS}



export default function remarkGenTocPlugin(options: Options = DEFAULT_OPTIONS) {
  return (tree: Root) => {
    const opts: Options = {...DEFAULT_OPTIONS, ...options}
    const minDepth = opts.minDepth ?? MIN_DEPTH
    const maxDepth = opts.maxDepth ?? MAX_DEPTH
    if (minDepth > maxDepth) {
      throw new Error(`minDepth ${minDepth} should be greater or equal to maxDepth ${maxDepth}`)
    }
    const replaceToc = (toc: List | undefined, tocIndex: number): void => {
      if (toc) {
        toc.data = {hProperties: {className: opts.className}}
        tree.children.splice(tocIndex, 1, toc)
      }
      else {
        tree.children.splice(tocIndex, 1)
      }
    }

    let tocIndex: number = -1
    while ((tocIndex = findTocMarker(tree, tocIndex + 1)) !== -1) {
      const toc = makeTableOfContents(tree, tocIndex, opts)
      replaceToc(toc, tocIndex)
    }
  }
}

type HeadingInfo = {index: number, depth: HeadingDepth, id?: string, content: PhrasingContent[], children: HeadingInfo[]}

function makeTableOfContents(tree: Root, tocIndex: number, opts: Options): List | undefined {
  const headings: HeadingInfo[] = []
  for (let i = tocIndex + 1; i < tree.children.length; i++) {
    const node = tree.children[i]
    const minDepth = opts.minDepth ?? MIN_DEPTH
    const maxDepth = opts.maxDepth ?? MAX_DEPTH
    if (isHeading(node) && node.depth >= minDepth && node.depth <= maxDepth) {
      const heading: HeadingInfo = {
        index: i,
        id: getHeadingId(node),
        depth: node.depth,
        content: node.children,
        children: []
      }
      headings.push(heading)
    }
  }
  slugHeadings(headings, tree)
  return buildTocTree(headings)
}

function makeLink(node: HeadingInfo): Link {
  return {type: 'link', children: node.content, url: `#${node.id}`}
}

function transformToListTree(nodes: HeadingInfo[]): ListItem[] {
  const result: ListItem[] = []
  for (const node of nodes) {
    const children = node.id ? [makeLink(node)] : node.content
    /* @ts-ignore */
    const item: ListItem = {type: 'listItem', children}
    if (node.children.length > 0) {
      const children: ListItem[] = transformToListTree(node.children)
      const list: List = {
        type: 'list',
        children: children,
      }
      item.children.push(list)
    }
    result.push(item)
  }
  return result
}

function slugHeadings(headings: HeadingInfo[], root: Root) {
  const slugger = new Slugger()
  for (const heading of headings) {
    if (!heading.id) {
      const node = root.children[heading.index]
      if (isHeading(node)) {
        const id = slugger.slug(getHPropertiesId(node) ?? toString(node))
        heading.id = id
        node.data ??= {}
        node.data.hProperties ??= {}
        node.data.hProperties.id = id
      }
    }
  }
}

function buildTocTree(headings: HeadingInfo[]): List | undefined {
  if (headings.length > 0) {
    const findMinDepth = (minDepth: number, h: HeadingInfo): number => Math.min(minDepth, h.depth)
    const minDepth: HeadingDepth = headings.reduce(findMinDepth, 6) as HeadingDepth
    const tree: HeadingInfo[] = buildTree(headings, minDepth)
    const toc: ListItem[] = transformToListTree(tree)
    return {type: 'list', children: toc}
  }
}

function buildTree(headings: HeadingInfo[], minDepth: HeadingDepth, result: HeadingInfo[] = []): HeadingInfo[] {
  if (headings.length > 0) {
    const [head, ...rest] = headings
    if (head.depth === minDepth) {
      result.push(head)
    }
    else if (result.length === 0) {
      result.push(ensureDepth(head, minDepth))
    }
    else {
      const current = result[result.length - 1]
      appendLeaf(head, current)
    }
    buildTree(rest, minDepth, result)
  }
  return result
}

function deeper(depth: HeadingDepth): HeadingDepth {
  return depth === 6 ? depth : depth + 1 as HeadingDepth
}

function appendLeaf(head: HeadingInfo, target: HeadingInfo) {
  if (head.depth === target.depth + 1) {
    target.children.push(head)
  }
  else {
    if (target.children.length === 0) {
      target.children.push(ensureDepth(head, deeper(target.depth)))
    }
    else {
      appendLeaf(head, target.children[target.children.length - 1])
    }
  }
}

function ensureDepth(node: HeadingInfo, targetDepth: HeadingDepth): HeadingInfo {
  if (node.depth === targetDepth) {
    return node
  }
  else {
    const parent: HeadingInfo = {
      index: -1,
      depth: node.depth - 1 as HeadingDepth,
      content: [],
      children: [node]
    }
    return ensureDepth(parent, targetDepth)
  }
}

function getHeadingId(node: Heading): string | undefined {
  return node.data?.hProperties?.id
}

function findTocMarker(tree: Root, startIndex: number = 0): number {
  for (let index = startIndex; index < tree.children.length; index++) {
    const node = tree.children[index]
    if (isTextOnlyParagraph(node)) {
      if (isTocMarker(node.children[0])) {
        return index
      }
    }
  }
  return -1
}

function getHPropertiesId(node: Node): string | undefined {
  if (typeof node.data === 'object') {
    if ('hProperties' in node.data && typeof node.data.hProperties === 'object') {
      if (node.data.hProperties && 'id' in node.data.hProperties && typeof node.data.hProperties.id === 'string') {
        return node.data.hProperties.id
      }
    }
  }
}

function isTextOnlyParagraph(node: Node): node is Paragraph {
  return node.type === 'paragraph' &&
    isParent(node) &&
    node.children.length === 1 && node.children[0].type === 'text'
}

function isParent(node: Node): node is Parent {
  return 'children' in node
}

function isText(node: Node): node is Text {
  return node.type === 'text' && 'value' in node
}

function isHeading(node: Node): node is Heading {
  return node.type === 'heading'
}

function isTocMarker(node: Node) {
  if (isText(node)) {
    const text = node.value.trim()
    return /\[\[\s*TOC\s*]]/gi.test(text)
  }
}

type HProperties = {id?: string, className?: string, [attr: string]: string | undefined}

declare module 'mdast' {
  interface HeadingData {
    hProperties?: HProperties
  }

  interface ListItem {
    // @ts-ignore
    children: Array<FlowContent>
  }
}