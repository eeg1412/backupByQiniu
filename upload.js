require('dotenv').config();
const log = require('./log');
const qiniu = require("./qiniu");

qiniu.backup();