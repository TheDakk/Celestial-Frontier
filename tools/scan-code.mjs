// Words after which a `/` starts a regular-expression literal, not a division.
const REGEX_AFTER_WORD = new Set(['return', 'typeof', 'case', 'in', 'of', 'delete', 'void', 'throw', 'new', 'else', 'do', 'yield', 'await', 'instanceof']);
const WORD_CHAR = /[A-Za-z0-9_$]/;

/**
 * A small tokenizer for the purity check. Returns `kept` (comments removed, regular-expression literals
 * replaced by `RE`, string literals kept for import detection), `bare` (the same with the contents of
 * string and template text blanked, so only real code is left) and whether a `/` division operator occurs.
 * A `/` is a division when the previous significant token is an operand (identifier, number, `)` or `]`);
 * otherwise it starts a regular expression. A postfix `!`, `++` or `--` keeps the operand state.
 * Known false positive, left alone on purpose: `if (x) /re/.test(y)` is read as a division.
 * Code inside a template's `${ }` is scanned as code.
 */
export function scanCode(text) {
  let kept = '';
  let bare = '';
  let division = false;
  let i = 0;
  const emit = (k, b = k) => { kept += k; bare += b; };

  function code(untilBrace) {
    let operand = false;
    let depth = 0;
    while (i < text.length) {
      const c = text[i];
      if (c === '/' && text[i + 1] === '/') { while (i < text.length && text[i] !== '\n') i++; continue; }
      if (c === '/' && text[i + 1] === '*') {
        const end = text.indexOf('*/', i + 2);
        i = end < 0 ? text.length : end + 2;
        emit(' ');
        continue;
      }
      if (c === "'" || c === '"') {
        let j = i + 1;
        while (j < text.length && text[j] !== c && text[j] !== '\n') j += text[j] === '\\' ? 2 : 1;
        emit(text.slice(i, j + 1), c + c);
        i = j + 1;
        operand = true;
        continue;
      }
      if (c === '`') {
        emit('`');
        i++;
        while (i < text.length && text[i] !== '`') {
          if (text[i] === '\\') { emit(text.slice(i, i + 2), ''); i += 2; continue; }
          if (text[i] === '$' && text[i + 1] === '{') { emit('${'); i += 2; code(true); emit('}'); continue; }
          emit(text[i], '');
          i++;
        }
        emit('`');
        i++;
        operand = true;
        continue;
      }
      if (c === '/') {
        if (operand) { division = true; emit('/'); i++; operand = false; continue; }
        let j = i + 1;
        let inClass = false;
        while (j < text.length && text[j] !== '\n' && (inClass || text[j] !== '/')) {
          if (text[j] === '\\') j++;
          else if (text[j] === '[') inClass = true;
          else if (text[j] === ']') inClass = false;
          j++;
        }
        j++;
        while (j < text.length && WORD_CHAR.test(text[j])) j++;
        emit('RE');
        i = j;
        operand = true;
        continue;
      }
      if (c === '{') depth++;
      if (c === '}') {
        if (untilBrace && depth === 0) { i++; return; }
        depth--;
      }
      if (WORD_CHAR.test(c)) {
        let j = i;
        while (j < text.length && WORD_CHAR.test(text[j])) j++;
        const word = text.slice(i, j);
        emit(word);
        i = j;
        operand = !REGEX_AFTER_WORD.has(word);
        continue;
      }
      // Postfix `!`, `++` and `--` (right after an operand) leave the operand standing, so a following `/` is a
      // division; the same characters as prefix operators (or `!=`) expect an operand next.
      if (operand && ((c === '+' || c === '-') && text[i + 1] === c)) { emit(c + c); i += 2; continue; }
      if (operand && c === '!' && text[i + 1] !== '=') { emit(c); i++; continue; }
      emit(c);
      i++;
      if (c === ')' || c === ']') operand = true;
      else if (!/\s/.test(c)) operand = false;
    }
  }

  code(false);
  return { kept, bare, division };
}
