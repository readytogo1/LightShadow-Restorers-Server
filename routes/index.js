var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

// 导入文件系统模块
const fs = require('fs');
// 导入路径模块
const path = require('path');
// 导入 multer 中间件
const multer = require('multer');
// 导入 shortid 生成唯一文件名
const shortid = require('shortid');

// 创建 multer 实例并配置文件上传选项
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './uploads'); // 指定文件存储的目录
  },
  filename: (req, file, cb) => {
    const uniqueFileName = generateUniqueFileName(file.originalname);
    cb(null, uniqueFileName); // 指定文件的命名规则
  },
});

const upload = multer({ storage: storage });

// 处理图片上传请求
router.post('/upload', upload.single('image'), (req, res) => {
  // 检查文件类型
  const allowedFileTypes = ['.png', '.jpg', '.jpeg'];
  const imageFile = req.file;

  if (!imageFile) {
    res.status(400).send('未上传图片文件');
    return;
  }

  const fileExtension = path.extname(imageFile.originalname);
  if (!allowedFileTypes.includes(fileExtension.toLowerCase())) {
    res.status(400).send('不支持的文件类型');
    return;
  }

  // 生成一个唯一的文件名，可以使用 shortid 或其他方式生成
  const uniqueFileName = generateUniqueFileName(imageFile.originalname);

  // 将图片文件保存到服务器端
  fs.rename(imageFile.path, path.join(__dirname, '../../uploads/', uniqueFileName), (err) => {
    if (err) {
      console.error(err);
      res.status(500).send('图片上传失败');
    } else {
      res.send('图片上传成功');
    }
  });
});

// 辅助函数：生成唯一的文件名
function generateUniqueFileName(originalFileName) {
  const fileExtension = path.extname(originalFileName);
  const uniqueFileName = `${shortid.generate()}${fileExtension}`;
  return uniqueFileName;
}

module.exports = router;
