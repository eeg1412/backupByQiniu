var qiniu = require("qiniu");
const log = require('./log');
const util = require('util');
const fs = require('fs');
const _ = require('lodash');
const archiver = require('archiver');
//需要填写你的 Access Key 和 Secret Key
var accessKey = process.env.accessKey;
var secretKey = process.env.secretKey;
//要上传的空间
const bucket = process.env.bucket;
exports.backup = async function () {
    if (!process.env.localPathList) {
        throw '请设置备份文件夹路径！'
    }
    if (!process.env.fileFrontNameList) {
        throw '请设置备份文件名前缀！'
    }
    const localPathList = process.env.localPathList.split(',');
    const fileFrontNameList = process.env.fileFrontNameList.split(',');
    if (localPathList.length !== fileFrontNameList.length) {
        throw '备份文件夹数量必须要和备份文件名前缀数量一致！'
    }
    localPathList.forEach(async (item, index) => {
        const dirList = fs.readdirSync(item, { withFileTypes: true });
        let dirFileList = [];
        dirList.forEach((fileItem) => {
            const itemFilePath = `${item}/${fileItem.name}`;
            // 区分是文件夹还是文件
            const isFile = fileItem.isFile();
            // 获取文件属性
            const fileStat = fs.statSync(itemFilePath);
            const fileInfo = {
                isFile: isFile,
                path: itemFilePath,
                name: fileItem.name,
                mtimeMs: fileStat.mtimeMs
            };
            dirFileList.push(fileInfo);
        });
        // 给文件夹/文件进行排序
        dirFileList = _.orderBy(dirFileList, "mtimeMs", "desc");
        if (dirFileList.length === 0) {
            log.warning('该目录不存在文件！');
            return
        }
        // 获取最新的文件
        lastFile = dirFileList[0];
        let localFile = '';
        let key = ``;
        if (lastFile.isFile) {
            localFile = lastFile.path;
            key = `${fileFrontNameList[index]}-${new Date().getTime()}-${lastFile.name}`;
        } else {
            // 如果为文件夹需要给文件夹创建一个zip
            await this.creatZIP(item, lastFile.name);
            localFile = `${lastFile.path}.zip`;
            key = `${fileFrontNameList[index]}-${new Date().getTime()}-${lastFile.name}.zip`;
        }


        var mac = new qiniu.auth.digest.Mac(accessKey, secretKey);
        //自定义凭证有效期（示例2小时，expires单位为秒，为上传凭证的有效时间）
        var options = {
            scope: bucket,
            expires: 7200
        };
        var putPolicy = new qiniu.rs.PutPolicy(options);
        var uploadToken = putPolicy.uploadToken(mac);
        var putExtra = new qiniu.form_up.PutExtra();
        await this.putFile(uploadToken, key, localFile, putExtra);
    })
};
exports.creatZIP = async function (path, name) {
    let promise = new Promise((resolve, reject) => {
        log.info('开始创建ZIP' + `${path}/${name}.zip`);
        const zipPath = `${path}/${name}.zip`
        const output = fs.createWriteStream(zipPath);
        const archive = archiver('zip', {
            zlib: { level: 9 } // Sets the compression level.
        });
        archive.pipe(output);
        archive.directory(`${path}/${name}/`, false);
        output.on('close', function () {
            log.info('ZIP创建完毕！');
            resolve(archive);
        });
        archive.on('error', function (err) {
            throw err;
        });
        archive.finalize();
    });
    const res = await promise;
    return res;
};
exports.putFile = async function (uploadToken, key, localFile, putExtra) {
    // 文件上传
    var config = new qiniu.conf.Config();
    // 空间对应的机房
    config.zone = qiniu.zone.Zone_z2;
    var formUploader = new qiniu.form_up.FormUploader(config);
    let promise = new Promise((resolve, reject) => {
        formUploader.putFile(uploadToken, key, localFile, putExtra, function (respErr,
            respBody, respInfo) {
            if (respErr) {
                log.error(util.inspect(respErr, { colors: true, depth: null }));
                log.error('上传失败！');
                resolve(respErr);
            }
            if (respInfo.statusCode == 200) {
                log.info(util.inspect(respBody, { colors: true, depth: null }));
                log.info('上传成功！');
                resolve(respBody);
            } else {
                log.warning(respInfo.statusCode);
                log.warning(util.inspect(respBody, { colors: true, depth: null }));
                log.error('上传失败！');
                resolve(respInfo.statusCode, respBody);
            }
        });
    });
    const res = await promise;
    return res;
}