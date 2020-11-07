# 七牛云对象储存定时上传系统
定时将文件备份到七牛对象储存中

会定时将文件夹中的最新一个文件/文件夹上传到七牛云

如果为文件夹的话会自动创建ZIP文件

克隆仓库后需要配置.env文件

### env文件例子：
```
accessKey=填写七牛云的accessKey
secretKey=填写七牛云的secretKey
bucket=填写七牛云的bucket
localPathList=填写备份文件所在的文件夹路径，如果有多个用[,]隔开
fileFrontNameList=填写备份后的文件名前缀，如果有多个用[,]隔开，且必须和上面的localPathList数量一直
uploadSchedule=填写定时备份时间cron格式，如：0 53 14 * * * 为每天14点53分0秒执行
```

### 安装依赖：

运行
```
npm install
```
安装依赖


### 运行定时任务：

运行
```
npm run backup
```
开始定时上传目录下的最新文件/文件夹


### 立刻上传：

运行
```
npm run upload
```
立刻上传文件/文件夹