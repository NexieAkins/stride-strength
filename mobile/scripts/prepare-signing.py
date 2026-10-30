"""Validate private profiles and configure manual signing without printing credentials."""
import datetime, json, os, pathlib, plistlib, shutil
root = pathlib.Path(os.environ['RUNNER_TEMP']) / 'stride-signing'
spec_path = pathlib.Path('mobile/ios/App/project.yml')
spec = spec_path.read_text()
profiles = {}
team = None
for kind, bundle in [('ios', 'com.strideandstrength.app'), ('watch', 'com.strideandstrength.app.watchkitapp')]:
    p = plistlib.loads((root / (kind + '.plist')).read_bytes())
    current_team = p['TeamIdentifier'][0]
    assert team is None or team == current_team, 'Profiles belong to different teams'
    team = current_team
    assert p['Entitlements']['application-identifier'] == team + '.' + bundle, 'Wrong bundle identifier in ' + kind + ' profile'
    assert p['ExpirationDate'] > datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None), 'Expired profile'
    assert not p['Entitlements'].get('get-task-allow', False), 'Development profile cannot be used for TestFlight'
    assert not p.get('ProvisionedDevices') and not p.get('ProvisionsAllDevices'), 'Expected App Store distribution profile'
    assert p['Entitlements'].get('com.apple.developer.healthkit'), kind + ' profile needs the HealthKit capability'
    profiles[bundle] = p['UUID']
    destination = pathlib.Path.home() / 'Library/MobileDevice/Provisioning Profiles'
    destination.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(root / (kind + '.mobileprovision'), destination / (p['UUID'] + '.mobileprovision'))
    marker = '        PRODUCT_BUNDLE_IDENTIFIER: ' + bundle + '\n'
    assert marker in spec, 'Missing target in project specification'
    spec = spec.replace(marker, marker + '        CODE_SIGN_STYLE: Manual\n        CODE_SIGN_IDENTITY: Apple Distribution\n        DEVELOPMENT_TEAM: ' + team + '\n        PROVISIONING_PROFILE_SPECIFIER: ' + p['UUID'] + '\n')
spec = spec.replace('        WKApplication: true', '        CFBundleVersion: \"$(CURRENT_PROJECT_VERSION)\"\n        CFBundleShortVersionString: \"$(MARKETING_VERSION)\"\n        WKApplication: true')
spec_path.write_text(spec)
# A watchOS app requires a separate app-icon catalog even when sharing the initial test artwork.
icons = pathlib.Path('mobile/watch/Assets.xcassets/AppIcon.appiconset')
icons.mkdir(parents=True, exist_ok=True)
shutil.copyfile('mobile/ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png', icons / 'AppIcon.png')
(icons / 'Contents.json').write_text(json.dumps({'images':[{'filename':'AppIcon.png','idiom':'universal','platform':'watchos','size':'1024x1024'}], 'info':{'author':'xcode','version':1}}))
options = {'method':'app-store-connect','destination':'upload','teamID':team,'signingStyle':'manual','signingCertificate':'Apple Distribution','provisioningProfiles':profiles,'uploadSymbols':True,'manageAppVersionAndBuildNumber':False}
(root / 'ExportOptions.plist').write_bytes(plistlib.dumps(options))
print('Validated iPhone and Watch App Store profiles; manual signing configured.')
