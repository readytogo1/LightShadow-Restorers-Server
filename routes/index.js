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
  const {"0":param1,"1":param2,"2":param3} = req.query
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
  const uniqueFileName2 = generateUniqueFileName(imageFile.originalname);
  const inputPath_f = path.join(__dirname, '../public/input/', uniqueFileName)
  const outputPath_f = path.join(__dirname, '../public/output/', uniqueFileName2)
  

  // 将图片文件保存到服务器端
  fs.rename(imageFile.path, path.join(__dirname, '../public/input/', uniqueFileName), (err) => {
    if (err) {
      console.error(err);
      res.status(500).send('图片上传失败');
    } else{
      // 进行去雾操作
      if(param1 === '1'){
        // 构造 Python 程序的命令和参数
       const pythonScript = path.join(__dirname,'../../python/enhance.py');
       const pythonArgs = [inputPath_f,outputPath_f];
 
       // 调用 Python 程序
       const pythonProcess = spawn('python', [pythonScript, ...pythonArgs]);
 
       pythonProcess.stderr.on('data', (data) => {
         // 处理 Python 程序的错误输出
         console.error(data.toString());
         res.status(500).send('Python 程序执行出错');
         return
       });
 
       // 处理 Python 程序的关闭事件
       pythonProcess.on('close', (code) => {
         if (code != 0) {
           res.status(500).send('Python 程序执行出错');
           return 
         }else if(param2 === '0' && param3 === '0'){
          // 将处理后的图像文件返回给客户端
          let inputPath = 'http://localhost:3000/input/' + uniqueFileName
          let outputPath = 'http://localhost:3000/output/' + uniqueFileName2
          res.send([inputPath,outputPath]);
         }
       });
      }
      if(param3 != '0'){
        let pythonProcess2 = null; // 声明 pythonProcess 变量并初始化为 null
        let pythonFilePath = '../color/color/colorization/eccv16_f.py'
        if(param3 === '2') pythonFilePath = '../color/color/colorization/siggraph17_f.py'
        if(param1 != '0' || param2 != '0'){
          pythonProcess2 = spawn('conda', 
            ['run', '-n', 'color', 'python', pythonFilePath , 
            '-i', outputPath_f, '-o', outputPath_f]);
              console.log(outputPath_f,outputPath_f);
        }else{
          // 传递参数 输入文件路径和输出文件路径
          pythonProcess2 = spawn('conda', 
          ['run', '-n', 'color', 'python', pythonFilePath, 
            '-i', inputPath_f, '-o', outputPath_f]);
          console.log(inputPath_f,outputPath_f);
        }

        // 调用 Python 脚本
        pythonProcess2.stdout.on('data', (data) => {
          console.log(`stdout: ${data}`);
        });

        pythonProcess2.stderr.on('data', (data) => {
          console.error(`stderr: ${data}`);
        });
        // 处理 Python 程序的关闭事件
        pythonProcess2.on('close', (code) => {
          if (code != 0) {
            res.status(500).send('Python 程序执行出错');
            return 
          }else{
            let inputPath = 'http://localhost:3000/input/' + uniqueFileName
            let outputPath = 'http://localhost:3000/output/' + uniqueFileName2
            res.send([inputPath,outputPath]);
          }
        });
      }
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
