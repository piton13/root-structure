const { exec } = require("child_process");
const httpServer = require("http").createServer();
const io = require("socket.io")(httpServer, {
  // ...
});
io.on("connection", (socket) => {
  console.log(`Socket ${socket.id} was connected!`);

  socket.on("private_message", (msg) => {
    console.log('on_private_message: ', msg);
    // console.log('path: ', msg.path);

    const isFile = /^\w*\.\w*$/.test(msg.path);

    if (isFile) {
      return;
    }

    exec(`ls -alt ./public/${msg.path}`, (error, stdout, stderr) => {
    // exec(`ls -alt ./public/source`, (error, stdout, stderr) => {
      if (error) {
        console.log(`error: ${error.message}`);
        return;
      }
      if (stderr) {
        console.log(`stderr: ${stderr}`);
        return;
      }
      console.log(`stdout: ${stdout}`);
      socket.emit('private_msg', {
        data: stdout.split('\n')
          .map(item => item.split(' '))
          .filter(r => r[11])
          .map(i => i.filter(i => !!i))
          .map(r => [r[8], r[4], `${r[5]} ${r[6]} ${r[7]}`])
        // 7th - size; 8th - month; 9 - date; 10 - time; 11 - name
      });
      /*socket.emit('private_msg', {
        data: stdout
          .split('\n')
          .map(item => item.split(' '))
          .filter(d => d[6]).map(r => [r[6], r[5], r[4]])
      });*/
    });
  });

});

httpServer.listen(4567, () => {
  console.log('Server is running on 4567 port.');
});
