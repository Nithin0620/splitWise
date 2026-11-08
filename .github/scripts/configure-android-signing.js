const fs = require('fs')
const path = require('path')

const gradlePath = path.join(process.cwd(), 'android', 'app', 'build.gradle')
const required = [
  'ANDROID_KEYSTORE_FILE',
  'ANDROID_KEYSTORE_PASSWORD',
  'ANDROID_KEY_ALIAS',
  'ANDROID_KEY_PASSWORD',
]

const missing = required.filter((name) => !process.env[name])
if (missing.length > 0) {
  console.log(`Release signing secrets not set (${missing.join(', ')}). Keeping default signing.`)
  process.exit(0)
}

let gradle = fs.readFileSync(gradlePath, 'utf8')

const releaseSigningConfig = `
        release {
            storeFile file(System.getenv("ANDROID_KEYSTORE_FILE"))
            storePassword System.getenv("ANDROID_KEYSTORE_PASSWORD")
            keyAlias System.getenv("ANDROID_KEY_ALIAS")
            keyPassword System.getenv("ANDROID_KEY_PASSWORD")
        }`

const beforeBuildType = gradle
if (!/release\s*\{[\s\S]*?signingConfig\s+signingConfigs\.debug/.test(beforeBuildType)) {
  console.error('Could not find the release build type in android/app/build.gradle')
  process.exit(1)
}

gradle = gradle.replace(
  /(release\s*\{[\s\S]*?)signingConfig\s+signingConfigs\.debug/,
  '$1signingConfig signingConfigs.release',
)

gradle = gradle.replace(
  /(signingConfigs\s*\{[\s\S]*?debug\s*\{[\s\S]*?\})/,
  `$1${releaseSigningConfig}`,
)

fs.writeFileSync(gradlePath, gradle)
console.log('Configured release signing with the provided keystore.')
