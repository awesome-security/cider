var log = console.log;
var chalk = require('chalk');
var readline = require('readline');
var repodir = __dirname + '/../../repos';
var exdir = __dirname + '/../exploits';
var repolist = __dirname + '/../../configs/repos';
var files = require(__dirname + '/../lib/files');
var targets = require(__dirname + '/../lib/targets');
var fs = require('fs');

module.exports = {

    // Checks checks repo to see if it contains Circle-ci content
    isCircleRepo: (reponame) => {
        return fs.existsSync(`${repodir}/${reponame}/.circleci/config.yml`);
    },

    //Loads an exploit into said repo
    loadCircleConfig: (exploit, authed_user, repo_name, callback) => {
        if (module.exports.isCircleRepo(repo_name)) {
            fs.createReadStream(`${exdir}/${exploit}/config.yml`).pipe(fs.createWriteStream(`${repodir}/${repo_name}/.circleci/config.yml`).on('close', () => {
                log(chalk.green(`Circle config for ${repo_name} successfully overwritten`));
                return callback();
            }));
        } else {
            log(chalk.yellow(`Tried to load ${exploit}, but ${repo_name} does not appear to be a Circle-Repository`));
            return callback();
        }

    },

    loadCircleConfigAll: (exploit, authed_user, circle_targets, callback) => {
        var promises = [];
        for(let target in circle_targets) {
            promises.push(new Promise((resolve, reject) => {
                module.exports.loadCircleConfig(exploit, authed_user, circle_targets[target], () => {
                    resolve();
                })
            }));
        }
        Promise.all(promises)
            .then(c => {
                return callback();
            }).catch(e => {
                log(chalk.red(`ERROR with function loadCircleConfigAll: ... ${e}`));
                return callback();
            })
    },

    //Get a list of cloned repos that contain .circle.yml files
    getForkedCircleRepos: (callback) => {
        var flist = files.walkSync(repodir);
        var tlist = []
        flist.forEach((item) => {
            if (item.includes(".circleci/config.yml") && !item.includes("node_modules")) {
                tlist.push(item);
            }
        })
        return callback(tlist);
    },

    //Append line to circle config
    appendCircleConfig: (file, line) => {
        fs.appendFileSync(file, line, 'utf-8');
    },

    appendCircleConfigAll: (line, callback) => {
        var flist = files.walkSync(repodir);
        var promises = [];
        for (let f in flist) {
            if (flist[f].includes('.circleci/config.yml')) {
                promises.push(new Promise((resolve, reject) => {
                    module.exports.appendCircleConfig(flist[f], line, () => {
                        resolve();
                    });
                }).catch(err => {
                    log(err);
                }))
            }
        }
        //.on('close', () => {
        Promise.all(promises)
            .then(c => {
                return callback();
            }).catch(e => {
                log(chalk.red(`ERROR with function appendCircleConfigAll: ... ${e}`));
                return callback();
            })
    }
}