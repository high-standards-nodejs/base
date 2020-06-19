const fs = require('fs');
const path = require('path');
const readline = require('readline');
const mkdirp = require('mkdirp');
const template = require('es6-template-strings');
const pkgDir = require('pkg-dir');
const latestVersion = require('latest-version'); 

if (!process.env.INIT_CWD) process.env.INIT_CWD = process.cwd();
if (process.cwd() === process.env.INIT_CWD) process.exit(0);

const initPackageJsonPath = path.join(process.env.INIT_CWD, 'package.json');
const highStandardsFilePath = path.join(process.env.INIT_CWD, '.highstandards', 'accepted');

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

function getProjectRoot() {
    return process.env.INIT_CWD;
}

function writeInitiatingProjectPackageJson(packageJson) {
    fs.writeFileSync(
        initPackageJsonPath,
        JSON.stringify(packageJson, null, 2)
    )
}

function copyFileFromTemplate(packageDir, filePath, context) {
    writeFile(
        filePath,
        getTemplate(packageDir, filePath, context)
    );
}

function getFullFilePath(filePath) {
    return path.join(
        getProjectRoot(),
        filePath
    );
}

function fileExists(filePath) {
    return fs.existsSync(
        getFullFilePath(filePath)
    ) 
}

function getFile(filePath, forceCreateFile = false) {
    const fullFilePath = getFullFilePath(filePath);
    if (!fileExists(filePath) && forceCreateFile) {
        fs.writeFileSync(
            getFullFilePath(filePath),
            ''
        );
    }
    return fs.readFileSync(fullFilePath)
}

function writeFile(filePath, content, addToGitIgnore = false) {
    filePath = path.join(
        process.env.INIT_CWD,
        filePath
    );
    const directory = path.dirname(filePath);
    if (!fs.existsSync(directory)) {
        mkdirp.sync(directory);
    }
    fs.writeFileSync(filePath, content);
    if (addToGitIgnore) {
        const gitignorePath = path.join(process.env.INIT_CWD, '.gitignore');
        if (!fs.existsSync(gitignorePath)) {
            fs.writeFileSync(gitignorePath, '');
        }
        const gitignoreContent = fs.readFileSync(gitignorePath);
        if (!new RegExp(filePath).test(gitignoreContent)) {
            fs.appendFileSync(gitignorePath, `${filePath}\n`);
        }
    }
}

async function addDependency(packageJson, packageName, version = null) {
    if (!packageJson.dependencies) packageJson.dependencies = {};
    packageJson.dependencies[packageName] = version || (await latestVersion(packageName));
    return packageJson;
}

async function addDevDependency(packageJson, packageName, version = null) {
    if (!packageJson.devDependencies) packageJson.devDependencies = {};
    packageJson.devDependencies[packageName] = version || (await latestVersion(packageName));
    return packageJson;
}

async function checkAcceptedHighStandards() {
    return new Promise((resolve) => {
        if (fs.existsSync(highStandardsFilePath)) return resolve();
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
    
        rl.question('Are you aware that "high-standards" libraries can add / modify / remove files in your project? (yes/NO) ', function(answer) {
            if (answer.toLowerCase() === 'yes') {
                createAcceptFile();
            } else {
                console.log('exit');
                process.exit(0);
            }
            rl.close();
            resolve();
        });
    })
    
}

function createAcceptFile() {
    mkdirp.sync(path.dirname(highStandardsFilePath));
    writeFile(highStandardsFilePath, '', true);
}

function getTemplate(packageDir, filePath, context) {
    const templatePath = getTemplatePath(packageDir, filePath);
    const fileContent = fs.readFileSync(templatePath).toString();
    return template(fileContent, context);
}

function getTemplatePath(packageDir, filePath) {
    const initPackageTemplatePath = path.join(
        pkgDir.sync(process.env.INIT_CWD),
        '.highstandards',
        filePath
    );
    if (fs.existsSync(initPackageTemplatePath)) return initPackageTemplatePath;
    
    const packageTemplatePath = path.join(
        pkgDir.sync(packageDir),
        '.highstandards',
        filePath
    );
    if (fs.existsSync(packageTemplatePath)) return packageTemplatePath;
    throw new Error(`"${filePath}" not found! checked:
    - ${initPackageTemplatePath}
    - ${packageTemplatePath}
    `);
}

module.exports = {
    addDependency,
    addDevDependency,
    checkAcceptedHighStandards,
    copyFileFromTemplate,
    fileExists,
    getFile,
    getFullFilePath,
    getInitiatingProjectPackageJson,
    getOwnPackageJson,
    getProjectRoot,
    getTemplate,
    writeFile,
    writeInitiatingProjectPackageJson,
}