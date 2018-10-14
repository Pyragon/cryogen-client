const installer = require('electron-winstaller').createWindowsInstaller
const path = require('path');

getInstallerConfig()
    .then(installer)
    .catch((error) => {
        console.error(error.message || error);
        process.exit(1);
    });

function getInstallerConfig() {
    console.log('Creating windows installer...');
    const rootPath = path.join('./');
    const outPath = path.join(rootPath, 'dist');

    return Promise.resolve({
        appDirectory: path.join(outPath, 'Cryogen Client Wrapper-win32-ia32/'),
        authors: 'Pyragon',
        noMsi: true,
        outputDirectory: path.join(outPath, 'windows-installer'),
        exe: 'CryoWebClient.exe',
        setupExe: 'CryoWebClientInstaller.exe',
        setupIcon: path.join(rootPath, 'assets', 'icon.ico')
    });
}