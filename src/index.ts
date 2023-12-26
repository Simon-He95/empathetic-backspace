import { addEventListener, getConfiguration, getLineText, getSelection, updateText } from '@vscode-use/utils'
import type { Disposable, ExtensionContext } from 'vscode'
import { Position, Range } from 'vscode'

export async function activate(context: ExtensionContext) {
  const disposes: Disposable[] = []
  const tabSize = getConfiguration('editor').get('tabSize') || 2

  let flag = false
  disposes.push(addEventListener('text-change', (e) => {
    if (flag)
      return
    if (e.contentChanges.some((i: any) => i.text.includes('\n')))
      return
    const selection = getSelection()

    if (selection && (selection.selectedTextArray.length > 1)) // 如果是多选操作的时候就不触发
      return
    const target = e.contentChanges.find((i: any) => (i.text === '') && ((i.range.end.line === selection?.line) || (i.range.start.line === selection?.line)))
    if (selection?.selectedTextArray[0].length)
      return

    if (!target)
      return
    if (target.rangeLength > tabSize)
      return

    if (target.range.start.line === target.range.end.line - 1 && target.rangeLength > 1)
      return
    // 判断是前删还是后删
    const isDeleteFromBefore = (target.range.start.line < selection!.line) || ((target.range.start.line === selection!.line) && (selection!.character >= target.range.start.character))
    // const isNewLine = target.range.start.line !== target.range.end.line

    // 删除空内容
    // 判断当前行的位置前面是否是空白
    const lineText = getLineText(target.range.start.line)
    let end: Position
    let start: Position
    if (isDeleteFromBefore) {
      // 前面的空格都应该被删除
      // 如果上一行也是空白行也应该被删除，直到找到有内容的地方的后面
      // 获取需要被替换成空字符串的结尾位置
      end = target.range.start

      // 检测当前行之前是否全是空字符串
      let index = end.character
      const match = lineText.match(/^\s+/)
      if (index === 0 || (match && match[0].length >= index)) {
        // 前面全是空字符串
        let preLine = end.line
        while (getLineText(--preLine).trim() === '') {
          //
        }
        const lineText = getLineText(preLine)
        const match = lineText.match(/\s+$/)
        const _endIndex = match ? lineText.length - match[0].length : lineText.length
        start = new Position(preLine, _endIndex)
      }
      else {
        // 在当前行找到结尾
        while (index > 0 && lineText[--index] === ' ') {
          //
        }
        start = new Position(end.line, index + 1)
      }
    }
    else {
      // 可能是尾部回删
      if (selection?.character && selection?.character > target.range.start.character)
        return
      start = target.range.start
      let start_index = start.character

      while ((start_index <= lineText.length) && lineText[start_index++] === ' ') {
        //
      }

      if (lineText.length <= start_index) {
        // 一整行都是空字符串，考虑将下一行如果是空行也合并了
        let preLine = start.line + 1
        while (!(getLineText(preLine++).trim())) {
          //
        }
        const lineText = getLineText(preLine - 1)
        const c = lineText.match(/^(\s+)/) ? lineText.match(/^(\s+)/)![1].length : 0
        end = new Position(preLine - 1, c)
      }
      else {
        if (start.character === start_index - 1)
          return
        end = new Position(start.line, start_index - 1)
      }
    }
    updateText((editor) => {
      flag = true
      // 如果end后面有内容，并且没有空格，删减到保留一个空格会较好
      if (start.character !== end.character && start.line === end.line)
        editor.replace(new Range(start, end), ' ')
      else
        editor.replace(new Range(start, end), '')

      setTimeout(() => {
        flag = false
      }, 200)
    })
    // eventNames.contentChanges
  }))
  context.subscriptions.push(...disposes)
}

export function deactivate() {

}
