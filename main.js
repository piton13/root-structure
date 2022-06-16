const util = require('util');
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

async function getRootFiles(path) {
  return fs.promises.readdir(path, { encoding: 'utf8' });
}

function isDirectory(path) {
  return fs.statSync(path).isDirectory();
}

function getFilesByPath(path, arrOfFiles = []) {
  const files = fs.readdirSync(path, {
    encoding: 'utf8',
  });

  files.forEach((file) => {
    if (isDirectory(path + '/' + file)) {
      arrOfFiles = getFilesByPath(path + '/' + file, arrOfFiles);
    } else {
      const pathToFile = path2.join(path, '/', file);
      const fileStats = fs.statSync(pathToFile);

      arrOfFiles.push({
        fileName: pathToFile,
        size: fileStats.size,
        time: fileStats.mtime.toISOString(),
      });
    }
  });

  return arrOfFiles;
}

async function getRootFolders(path) {
  const folders = [];
  const files = [];
  const rootStructure = await getRootFiles(path);

  rootStructure.forEach((file) => {
    if (isDirectory(path + '/' + file)) {
      folders.push(file);
    } else {
      files.push(file);
    }
  });

  return {
    folders,
    files,
  };
}

io.on("connection", async (socket) => {
  console.log(`Socket ${socket.id} was connected!`);
  const rootPath = './public';

  const rootStructure = await getRootFolders(rootPath);

  socket.emit('initialization', {
    rootFolders: rootStructure.folders,
  });

  socket.on("private_message", async (msg) => {
    console.log('move to inner file|folder: ', msg);

    const path = `${rootPath}/${msg.path}`;
    if (!rootStructure.folders.includes(msg.path) && !isDirectory(path)) {
      console.log('Root folder or file is selected');
      return ;
    }

    console.log('path2', path2.basename(`${rootPath}/.././..`));
    if (msg.path === '..') {
      console.error('Not secure path is passed');
      // return
    }

    const root = await getRootFolders(path);
    const folders = root.folders.map(f => {
      const filePath = path2.join(path, '/', f);
      const fileStats = fs.statSync(filePath);

      const structure = getFilesByPath(filePath);
      const sizeOfFiles = structure.map(i => i.size).reduce((acc, el) => acc += el, 0);

      return {
        fileName: filePath.replace('public/', ''),
        size: sizeOfFiles,
        time: fileStats.mtime.toISOString(),
      };
    });
    const files = root.files.map((p) => {
      const filePath = path2.join(path, '/', p);
      const fileStats = fs.statSync(filePath);

      return {
        fileName: filePath.replace('public/', ''),
        size: fileStats.size,
        time: fileStats.mtime.toISOString(),
      };
    });
    const data = [...folders, ...files];

    const structure = getFilesByPath(path);
    const stats = {
      count: structure.length,
      size: structure.map(i => i.size).reduce((acc, el) => acc += el, 0),
    };

    socket.emit('private_msg', {
      data,
      stats,
    });
  });
});

httpServer.listen(port, () => {
  console.log(`Server is running on ${port} port.`);
});
