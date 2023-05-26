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

const { spawn } = require('child_process');

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
  fs.rename(imageFile.path, path.join(__dirname, '../public/input/', uniqueFileName), (err) => {
    if (err) {
      console.error(err);
      res.status(500).send('图片上传失败');
    } else {
      /* res.send('图片上传成功'); */
       // 构造 Python 程序的命令和参数
      const pythonScript = path.join(__dirname,'../../python/enhance.py');
      const pythonArgs = [path.join(__dirname, '../public/input/', uniqueFileName)];

      // 调用 Python 程序
      const pythonProcess = spawn('python', [pythonScript, ...pythonArgs]);

      let pythonResult = ''; // 用于存储 Python 程序的输出结果

      pythonProcess.stdout.on('data', (data) => {
        // 处理 Python 程序的输出
        const result = data.toString();

        // 在此处可以根据需要处理 Python 程序的输出
        pythonResult += result;
      });

      pythonProcess.stderr.on('data', (data) => {
        // 处理 Python 程序的错误输出
        console.error(data.toString());
        res.status(500).send('Python 程序执行出错');
        return
      });

      // 处理 Python 程序的关闭事件
      pythonProcess.on('close', (code) => {
        if (code === 0) {
          // Python 程序执行成功，处理完成的图像文件路径为：
          // const processedImagePath = path.join(__dirname, '../../uploads/', uniqueFileName);
          
          // 将处理后的图像文件返回给客户端
          inputPath = 'http://localhost:3000/input/' + uniqueFileName
          outputPath = 'http://localhost:3000/output/' + pythonResult
          res.send([inputPath,outputPath]);
        } else {
          res.status(500).send('Python 程序执行出错');
        }
      });
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
