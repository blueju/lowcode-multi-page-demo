const express = require('express');
const app = express();
const port = 3010;
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');

let pages = require('./pages.json')

app.use(cors());
app.use(express.static('static'));
app.use(bodyParser.json())

app.get('/', (req, res) => {
  res.sendFile(path.resolve('pages/index.html'));
});

// 获取页面
app.get('/pages', (req, res) => {
  res.json({
    code: 0,
    data: pages
  })
});

// 新建页面
app.post('/page/:fileName', (req, res) => {
  const { fileName = '' } = req.params
  if (fileName.length === 0) {
    res.json({
      code: -1,
      msg: '缺少参数：页面文件名'
    })
    return
  }
  const { pageSchema = {} } = req.body
  if (Object.keys(pageSchema).length) {
    pages.push(pageSchema)
    res.json({
      code: 0,
      msg: '新页面创建成功'
    })
  } else {
    res.json({
      code: -1,
      msg: '缺少参数：页面描述 Schema'
    })
  }
});

// 保存页面
app.put('/page/:fileName', (req, res) => {
  const { fileName = '' } = req.params
  if (fileName.length === 0) {
    res.json({
      code: -1,
      msg: '页面保存失败，缺少参数：页面文件名'
    })
    return
  }
  const { pageSchema = {} } = req.body
  if (Object.keys(pageSchema).length) {
    const index = pages.findIndex(item => item.fileName === pageSchema.fileName)
    if (index === -1) {
      res.json({
        code: -1,
        msg: '页面保存失败，未找到要保存/更新的页面'
      })
      return
    }
    pages.splice(index, 1, pageSchema)
    res.json({
      code: 0,
      msg: `页面保存成功`
    })
  } else {
    res.json({
      code: -1,
      msg: '缺少参数：页面描述 Schema'
    })
  }
});

// 删除页面
app.delete('/page/:fileName', (req, res) => {
  const { fileName = '' } = req.params
  if (fileName.length) {
    const index = pages.findIndex(page => page.fileName === fileName)
    if (index === -1) {
      res.json({
        code: -1,
        msg: '未找到要删除的页面'
      })
      return
    }
    pages.splice(index, 1)
    res.json({
      code: 0,
      msg: '删除成功'
    })
  } else {
    res.json({
      code: -1,
      msg: '缺少参数：页面文件名'
    })
  }
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
