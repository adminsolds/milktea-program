const fs = require('fs');
const http = require('http');
const path = require('path');

// 测试图片上传API
const filePath = path.join(__dirname, 'views', 'favicon.ico');
const apiUrl = 'http://localhost:3000/api/upload/image';

// 检查文件是否存在
if (!fs.existsSync(filePath)) {
    console.error('文件不存在:', filePath);
    process.exit(1);
}

// 创建FormData
const boundary = '----WebKitFormBoundary' + Math.random().toString(16).substr(2, 10);
const fileContent = fs.readFileSync(filePath);
const fileName = path.basename(filePath);
const fileType = 'image/x-icon';

// 构建请求体
const postData = `--${boundary}\r\n` +
  `Content-Disposition: form-data; name="image"; filename="${fileName}"\r\n` +
  `Content-Type: ${fileType}\r\n\r\n` +
  fileContent +
  `\r\n--${boundary}--\r\n`;

// 构建请求选项
const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/upload/image',
  method: 'POST',
  headers: {
    'Content-Type': `multipart/form-data; boundary=${boundary}`,
    'Content-Length': Buffer.byteLength(postData)
  }
};

// 发送请求
const req = http.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('请求成功!');
    console.log('返回结果:');
    console.log(JSON.parse(data));
  });
});

req.on('error', (e) => {
  console.error('请求失败:', e.message);
});

// 写入请求体
req.write(postData);
req.end();