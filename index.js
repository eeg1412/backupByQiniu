require('dotenv').config();
const log = require('./log');
const qiniu = require("./qiniu");
const schedule = require('node-schedule');
log.info(`已启动`);
schedule.scheduleJob(process.env.uploadSchedule, () => {
    log.info(`开始定时上传任务`);
    qiniu.backup();
});