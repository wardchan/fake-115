const {
  app,
  BrowserWindow,
  Menu,
  session,
  dialog,
} = require('electron')

if (require('electron-squirrel-startup')) { // eslint-disable-line global-require
  app.quit()
}

const downloads = []

const cookies = [
  {
    url: 'https://115.com',
    name: 'CID',
    value: 'a37cc0a9bfc1c48a74ebf0ce0ff1b3fa',
    domain: '.115.com',
    path: '/',
  },
  {
    url: 'https://115.com',
    name: 'UID',
    value: '593888198_A1_1593321415',
    domain: '.115.com',
    path: '/',
  },
  {
    url: 'https://115.com',
    name: 'SEID',
    value: 'd43d3ec7fd0d459ad41a50c805b759a31b1dfaa7a2e56707980a630d36117b9ccef953d0f8b85761da6c7d40e582e4f84d7ff829de887b557647b26e',
    domain: '.115.com',
    path: '/',
  },
]

const menuTemplate = [
  {
    label: '操作',
    submenu: [
      {
        label: '下载任务管理',
        async click() {
          await dialog.showMessageBox({
            type: 'none',
            message: '下载任务列表（暂时只支持显示任务列表，后续会支持下载任务的操作，例如暂停或取消）',
            detail: `${downloads.map(d => {
              return `文件名：\n${d.filename}\n进度：${d.progress}\n状态：${d.status}`
            }).join('\n---------------------\n')}`,
          })
        },
      }
    ]
  }
]

const createWindow = async () => {
  if (process.platform === 'darwin') {
    menuTemplate.unshift({
      label: app.getName(),
      submenu: [
        {
          label: '退出',
          click() {
            app.quit()
          },
        },
      ],
    })
  }

  const appMenu = Menu.buildFromTemplate(menuTemplate)
  Menu.setApplicationMenu(appMenu)

  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
  })

  for (let i = 0, length = cookies.length; i < length; i ++) {
    const cookie = cookies[i]
    try {
      await session.defaultSession.cookies.set(cookie)
    } catch (error) {
      console.error(`set cookie error, cookie=${JSON.stringify(cookie)}, error=${error}`)
    }
  }

  mainWindow.loadURL('https://115.com')

  mainWindow.webContents.session.on('will-download', (event, item, webContents) => {
    const download = {
      url: item.getURL(),
      filename: item.getFilename(),
      progress: `${item.getReceivedBytes() / item.getTotalBytes() * 100}%`,
      status: '下载中...',
    }
    downloads.push(download);

    item.on('updated', (event, state) => {
      if (state === 'interrupted') {
        download.status = '已暂停';
      } else if (state === 'progressing') {
        if (item.isPaused()) {
          download.status = '已暂停';
        } else {
          download.progress = `${item.getReceivedBytes() / item.getTotalBytes() * 100}%`
        }
      }
    })

    item.once('done', (event, state) => {
      if (state === 'completed') {
        download.status = '下载完成'
      } else {
        download.status = '下载失败'
      }
    })
  })
}

app.on('ready', createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})