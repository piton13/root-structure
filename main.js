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

function getStats(path) {
  return fs.statSync(path);
}

function getFilesByPath(path, arrOfFiles = [], deepDive) {
  const files = fs.readdirSync(path, {
    encoding: 'utf8',
  });

  files.forEach((file) => {
    const newPath = path2.join(path, '/', file);

    if (isDirectory(newPath)) {
      if (!deepDive) {
        const dirStats = getStats(newPath);
        arrOfFiles.push({
          isFile: false,
          fileName: newPath,
          size: 0,
          time: dirStats.mtime.toISOString(),
        });
      }
      arrOfFiles = getFilesByPath(newPath, arrOfFiles, true);
    } else {
      const fileStats = getStats(newPath);

      arrOfFiles.push({
        isFile: true,
        fileName: newPath,
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
  let currentPath;

  const rootStructure = await getRootFolders(rootPath);

  socket.emit('initialization', {
    rootFolders: rootStructure.folders,
  });

  socket.on("private_message", async (msg) => {
    console.log('move to inner file|folder: ', msg);

    let path = path2.join(rootPath, '/', msg.path);
    if (!rootStructure.folders.includes(msg.path) && !isDirectory(path)) {
      console.log('Root folder or file is selected');
      return ;
    }

    // TODO: validate edge cases for path
    if (msg.path === '..') {
      const arr = currentPath.split('/');
      arr.pop();

      path = arr.join('/');
    }

    const root = await getRootFolders(path);
    const folders = root.folders.map(f => {
      const filePath = path2.join(path, '/', f);
      const fileStats = fs.statSync(filePath);

      const structure = getFilesByPath(filePath);
      const sizeOfFiles = structure.map(i => i.size).reduce((acc, el) => acc += el, 0);

      return {
        isFile: false,
        fileName: filePath.replace('public/', ''),
        size: sizeOfFiles,
        time: fileStats.mtime.toISOString(),
      };
    });
    const files = root.files.map((p) => {
      const filePath = path2.join(path, '/', p);
      const fileStats = fs.statSync(filePath);

      return {
        isFile: true,
        fileName: filePath.replace('public/', ''),
        size: fileStats.size,
        time: fileStats.mtime.toISOString(),
      };
    });
    const data = [...folders, ...files];

    const structure = getFilesByPath(path);
    const filesOnly = structure.filter(r => r.isFile);
    const stats = {
      count: filesOnly.length,
      size: filesOnly
        .map(i => i.size)
        .reduce((acc, el) => acc += el, 0),
    };

    socket.emit('private_msg', {
      data,
      stats,
    });
    currentPath = path;
  });
});

httpServer.listen(port, () => {
  console.log(`Server is running on ${port} port.`);
});
