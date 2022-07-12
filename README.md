# ddu-source-marks

List all the current marks and the jump list.

This source collects text from :marks or :jumps.

## Required

### denops.vim

https://github.com/vim-denops/denops.vim

### ddu.vim

https://github.com/Shougo/ddu.vim

### ddu-kind-file

https://github.com/Shougo/ddu-kind-file

## Configuration

```vim
" Use the source.
call ddu#start({'sources': [{'name': 'marks', 'params': {'jumps': v:false}}]})
```
