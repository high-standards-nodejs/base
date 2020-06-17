const fs = require('fs');
const path = require('path');
const readline = require('readline');
const mkdirp = require('mkdirp');

if (process.cwd() === process.env.INIT_CWD) process.exit(0);

const initPackageJsonPath = path.join(process.env.INIT_CWD, 'package.json');
const highStandardsFilePath = path.join(process.env.INIT_CWD, '.highstandards');

function getOwnPackageJson() {
    return JSON.parse(
        fs.readFileSync(path.join('.', 'package.json'))
    );
}

function getInitiatingProjectPackageJson() {
    return JSON.parse(
        fs.readFileSync(initPackageJsonPath)
    );
}

function writeInitiatingProjectPackageJson(packageJson) {
    fs.writeFileSync(
        JSON.stringify(packageJson, null, 2)
    )
}

function writeFile(filePath, content, addToGitIgnore = false) {
    const directory = path.dirname(filePath);
    if (!fs.existsSync(directory)) {
        mkdirp.sync(directory);
    }
    fs.writeFileSync(filePath, content);
    if (addToGitIgnore) {
        const gitignorePath = path.join(process.env.INIT_CWD, '.gitignore');
        console.log(gitignorePath)
        if (!fs.existsSync(gitignorePath)) {
            fs.writeFileSync(gitignorePath, '');
        }
        const gitignoreContent = fs.readFileSync(gitignorePath);
        if (!new RegExp(filePath).test(gitignoreContent)) {
            fs.appendFileSync(gitignorePath, `${filePath}\n`);
        }
    }
}

function checkAcceptedHighStandards() {
    if (fs.exists(highStandardsFilePath)) return true;
    
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    rl.question('Are you aware that "high-standards" libraries can add / modify / remove files in your project. (yes/NO)', function(answer) {
        if (answer.toLowerCase() === 'yes') {
            writeFile(highStandardsFilePath, '', true);
        }
        rl.close();
    });
}

module.exports = {
    getOwnPackageJson,
    getInitiatingProjectPackageJson,
    writeInitiatingProjectPackageJson,
    writeFile,
    checkAcceptedHighStandards,
}