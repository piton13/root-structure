const util = require('util');
const exec = util.promisify(require('child_process').exec)
const fs = require("fs");
const path2 = require("path");
require('dotenv').config();

const port = process.env.PORT;

const httpServer = require("http").createServer((req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/html',
  });

  const readStream = fs.createReadStream('./public/index.html');

  readStream.pipe(res);
});
const io = require("socket.io")(httpServer, {});

function getFilesByPath(path, arrOfFiles = []) {
  const files = fs.readdirSync(path, {
    encoding: 'utf8',
    // withFileTypes: true,
  });
  console.log('files: ', files);

  files.forEach((file) => {
    if (fs.statSync(path + '/' + file).isDirectory()) {
      arrOfFiles = getFilesByPath(path + '/' + file, arrOfFiles);
    } else {
      const pathToFile = path2.join(path, '/', file);
      const fileStats = fs.statSync(pathToFile);
      console.log('fileStats: ', fileStats);

      arrOfFiles.push({
        fileName: pathToFile,
        size: fileStats.size,
        time: fileStats.mtime.toISOString(),
      });
      // arrOfFiles.push(path2.join(__dirname, path, '/', file));
    }
  });

  return arrOfFiles;
}

io.on("connection", (socket) => {
  console.log(`Socket ${socket.id} was connected!`);

  socket.on("private_message", async (msg) => {
    console.log('on_private_message: ', msg);
    // console.log('path: ', msg.path);

    const isFile = /^\w*\.\w*$/.test(msg.path);

    if (isFile) {
      return;
    }

    const path = `./public/${msg.path}`;

    const root = await fs.promises.readdir(path, {
      encoding: 'utf8',
      // withFileTypes: true,
    });

    console.log('root: ', root);

    const { stdout } = await exec(`ls -alt ${path}`);
    console.log('res :', stdout);

    const structure = getFilesByPath(path);
    const stats = {
      count: structure.length,
      size: structure.map(i => i.size).reduce((acc, el) => acc += el, 0),
    };

    console.log('structure: ', structure);

    socket.emit('private_msg', {
      data: stdout.split('\n')
        .map(item => item.split(' '))
        .filter(r => r[11])
        .map(i => i.filter(i => !!i))
        .map(r => ({
          fileName: r[8],
          size: Number(r[4]),
          time: `${r[5]} ${r[6]} ${r[7]}`,
        })),
      stats,
    });
  });
});

httpServer.listen(port, () => {
  console.log(`Server is running on ${port} port.`);
});
