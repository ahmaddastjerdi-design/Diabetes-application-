/**
 * Expo config plugin: register the Health Connect permission delegate.
 *
 * react-native-health-connect requires
 *   HealthConnectPermissionDelegate.setPermissionDelegate(this)
 * inside MainActivity.onCreate, otherwise requestPermission() launches an
 * unregistered ActivityResultLauncher and the app crashes. The library's own
 * Expo plugin only edits the manifest, so we inject the Kotlin here.
 */
const { withMainActivity } = require("@expo/config-plugins");

const IMPORT =
  "import dev.matinzd.healthconnect.permissions.HealthConnectPermissionDelegate";
const CALL = "HealthConnectPermissionDelegate.setPermissionDelegate(this)";

module.exports = function withHealthConnectPermissionDelegate(config) {
  return withMainActivity(config, (cfg) => {
    if (cfg.modResults.language !== "kt") {
      throw new Error(
        "withHealthConnectPermissionDelegate expects a Kotlin MainActivity"
      );
    }
    let src = cfg.modResults.contents;

    // 1. Add the import right after the package declaration.
    if (!src.includes(IMPORT)) {
      src = src.replace(/(^package .*$)/m, `$1\n\n${IMPORT}`);
    }

    // 2. Register the delegate right after super.onCreate(...).
    if (!src.includes(CALL)) {
      src = src.replace(
        /(super\.onCreate\([^)]*\)\s*\n)/,
        `$1    ${CALL}\n`
      );
    }

    cfg.modResults.contents = src;
    return cfg;
  });
};
